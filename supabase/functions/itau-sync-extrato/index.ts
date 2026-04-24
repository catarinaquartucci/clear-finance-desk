import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function secretKeys(credentialId: string) {
  const safe = credentialId.replace(/-/g, "_").toUpperCase();
  return {
    secret: `ITAU_CRED_${safe}_SECRET`,
    cert: `ITAU_CRED_${safe}_CERT`,
    key: `ITAU_CRED_${safe}_KEY`,
  };
}

function envBaseUrls(env: "sandbox" | "production") {
  return env === "production"
    ? {
        oauth: "https://sts.itau.com.br",
        api: "https://secure.api.itau",
      }
    : {
        oauth: "https://sts.sandbox.itau.com.br",
        api: "https://sandbox.devportal.itau.com.br",
      };
}

function dateOnly(d: Date) {
  return d.toISOString().split("T")[0];
}

function buildImportHash(args: {
  bankAccountId: string;
  date: string;
  amount: number;
  description: string;
  ref: string | null;
}) {
  const raw = `${args.bankAccountId}|${args.date}|${args.amount.toFixed(2)}|${args.description}|${args.ref ?? ""}`;
  // Simple deterministic hash (FNV-1a) — we just need uniqueness per row
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `itau_${(hash >>> 0).toString(16)}_${args.date}_${Math.round(args.amount * 100)}`;
}

interface SyncResult {
  credential_id: string;
  imported: number;
  skipped: number;
  status: "success" | "partial" | "error";
  error?: string;
}

async function syncCredential(
  admin: ReturnType<typeof createClient>,
  credential: any,
  days: number,
  triggeredBy: string,
): Promise<SyncResult> {
  const keys = secretKeys(credential.id);
  const clientSecret = Deno.env.get(keys.secret);
  const certPem = Deno.env.get(keys.cert);
  const keyPem = Deno.env.get(keys.key);

  const periodTo = new Date();
  const periodFrom = new Date();
  periodFrom.setDate(periodFrom.getDate() - days);

  // Insert log row (running)
  const { data: logRow } = await admin
    .from("itau_sync_log")
    .insert({
      credential_id: credential.id,
      period_from: dateOnly(periodFrom),
      period_to: dateOnly(periodTo),
      status: "running",
      triggered_by: triggeredBy,
    })
    .select()
    .single();

  const finishLog = async (
    status: "success" | "partial" | "error",
    imported: number,
    skipped: number,
    errorMessage?: string,
  ) => {
    if (!logRow?.id) return;
    await admin
      .from("itau_sync_log")
      .update({
        finished_at: new Date().toISOString(),
        transactions_imported: imported,
        transactions_skipped: skipped,
        status,
        error_message: errorMessage,
      })
      .eq("id", logRow.id);
  };

  if (!clientSecret || !certPem || !keyPem) {
    const msg = "Secrets de credencial não encontrados. Refaça o cadastro.";
    await finishLog("error", 0, 0, msg);
    return { credential_id: credential.id, imported: 0, skipped: 0, status: "error", error: msg };
  }

  const urls = envBaseUrls(credential.environment);
  // deno-lint-ignore no-explicit-any
  let httpClient: any = null;
  try {
    // deno-lint-ignore no-explicit-any
    httpClient = (Deno as any).createHttpClient({ cert: certPem, key: keyPem });

    // 1) OAuth
    const tokenRes = await fetch(`${urls.oauth}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: credential.client_id,
        client_secret: clientSecret,
      }),
      // deno-lint-ignore no-explicit-any
      client: httpClient,
    } as any);
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`OAuth falhou (${tokenRes.status}): ${text.slice(0, 200)}`);
    }
    const { access_token } = await tokenRes.json();

    // 2) GET extrato
    // Endpoint indicativo — pode variar conforme produto contratado no devportal
    const extratoUrl = new URL(`${urls.api}/cash-management/v2/extratos`);
    extratoUrl.searchParams.set("agencia", credential.agencia);
    extratoUrl.searchParams.set("conta", credential.conta);
    extratoUrl.searchParams.set("dataInicio", dateOnly(periodFrom));
    extratoUrl.searchParams.set("dataFim", dateOnly(periodTo));

    const extratoRes = await fetch(extratoUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "x-itau-correlationid": crypto.randomUUID(),
        Accept: "application/json",
      },
      // deno-lint-ignore no-explicit-any
      client: httpClient,
    } as any);
    if (!extratoRes.ok) {
      const text = await extratoRes.text();
      throw new Error(`Extrato falhou (${extratoRes.status}): ${text.slice(0, 200)}`);
    }
    const extrato = await extratoRes.json();

    // 3) Map -> bank_transactions
    const lancamentos: any[] = extrato?.lancamentos ?? extrato?.data ?? [];
    const rows = lancamentos.map((lc) => {
      const rawDate: string = lc.dataLancamento ?? lc.date ?? lc.data;
      const date = rawDate?.length >= 10 ? rawDate.slice(0, 10) : dateOnly(new Date());
      const amount = Number(lc.valor ?? lc.amount ?? 0);
      const description = String(lc.descricao ?? lc.description ?? "Lançamento Itaú").trim();
      const reference: string | null = lc.documento ?? lc.reference ?? null;
      const type = (lc.tipo ?? lc.type ?? (amount < 0 ? "debit" : "credit")).toString().toLowerCase();
      const balance = lc.saldo != null ? Number(lc.saldo) : null;
      return {
        bank_account_id: credential.bank_account_id,
        date,
        description,
        amount,
        type: type === "credit" || type === "c" ? "credit" : "debit",
        balance,
        reference,
        import_hash: buildImportHash({
          bankAccountId: credential.bank_account_id,
          date,
          amount,
          description,
          ref: reference,
        }),
      };
    });

    let imported = 0;
    let skipped = 0;
    if (rows.length > 0) {
      const { data: insertedRows, error } = await admin
        .from("bank_transactions")
        .upsert(rows, { onConflict: "import_hash", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(`Persistência falhou: ${error.message}`);
      imported = insertedRows?.length ?? 0;
      skipped = rows.length - imported;
    }

    // Update last_sync_at
    await admin
      .from("itau_credentials")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", credential.id);

    await finishLog("success", imported, skipped);
    return { credential_id: credential.id, imported, skipped, status: "success" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("syncCredential error:", credential.id, msg);
    await finishLog("error", 0, 0, msg);
    return { credential_id: credential.id, imported: 0, skipped: 0, status: "error", error: msg };
  } finally {
    try {
      httpClient?.close?.();
    } catch (_) {
      /* ignore */
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Auth: aceita usuário logado (admin/finance) OU service role (cron)
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  let triggeredBy = "cron";
  let isServiceRole = token === SERVICE_ROLE_KEY;

  if (!isServiceRole) {
    if (!authHeader.startsWith("Bearer ")) {
      return json(401, { error: "Unauthorized" });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json(401, { error: "Unauthorized" });
    }
    const userId = userData.user.id;
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const allowed = roles?.some((r) =>
      ["admin", "finance"].includes(r.role as string)
    );
    if (!allowed) {
      return json(403, { error: "Forbidden: admin/finance required" });
    }
    triggeredBy = `user:${userId}`;
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (_) {
    body = {};
  }
  const days: number = Number.isFinite(body.days) ? Number(body.days) : 7;
  const credentialId: string | undefined = body.credential_id;

  // Carrega credenciais alvo
  let query = admin.from("itau_credentials").select("*").eq("ativo", true);
  if (credentialId) query = query.eq("id", credentialId);
  const { data: creds, error } = await query;
  if (error) return json(500, { error: error.message });
  if (!creds || creds.length === 0) {
    return json(200, { results: [], message: "Nenhuma credencial ativa" });
  }

  const results: SyncResult[] = [];
  for (const c of creds) {
    results.push(await syncCredential(admin, c, days, triggeredBy));
  }

  const totalImported = results.reduce((s, r) => s + r.imported, 0);
  const anyError = results.some((r) => r.status === "error");

  return json(200, {
    ok: !anyError,
    total_imported: totalImported,
    results,
  });
});
