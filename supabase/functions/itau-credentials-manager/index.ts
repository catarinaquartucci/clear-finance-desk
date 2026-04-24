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
const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN");
const PROJECT_REF = Deno.env.get("SUPABASE_PROJECT_REF") ?? "wbrwqyjtlpsrcpevszlh";

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

/**
 * Stores secrets via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN as a function secret.
 */
async function upsertProjectSecrets(secrets: Record<string, string>) {
  if (!SUPABASE_ACCESS_TOKEN) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN não configurado. Adicione via Lovable Cloud para gerenciar secrets de credenciais Itaú.",
    );
  }
  const payload = Object.entries(secrets).map(([name, value]) => ({ name, value }));
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao salvar secrets: ${res.status} ${text}`);
  }
}

async function deleteProjectSecrets(names: string[]) {
  if (!SUPABASE_ACCESS_TOKEN) return;
  await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(names),
    },
  );
}

async function testItauConnection(args: {
  environment: "sandbox" | "production";
  client_id: string;
  client_secret: string;
  cert_pem: string;
  key_pem: string;
  agencia: string;
  conta: string;
}) {
  const oauthBase =
    args.environment === "production"
      ? "https://sts.itau.com.br"
      : "https://sts.sandbox.itau.com.br";

  // mTLS HTTP client
  // deno-lint-ignore no-explicit-any
  const httpClient = (Deno as any).createHttpClient({
    cert: args.cert_pem,
    key: args.key_pem,
  });

  try {
    const tokenRes = await fetch(`${oauthBase}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: args.client_id,
        client_secret: args.client_secret,
      }),
      // deno-lint-ignore no-explicit-any
      client: httpClient,
    } as any);

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return {
        ok: false,
        step: "oauth",
        status: tokenRes.status,
        message: text.slice(0, 500),
      };
    }
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      return { ok: false, step: "oauth", message: "Resposta sem access_token" };
    }
    return { ok: true, step: "oauth", message: "Token obtido com sucesso" };
  } catch (err) {
    return {
      ok: false,
      step: "oauth",
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    try {
      // deno-lint-ignore no-explicit-any
      (httpClient as any)?.close?.();
    } catch (_) {
      /* ignore */
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: only admins can manage credentials
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
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

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: roles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
  if (!isAdmin) {
    return json(403, { error: "Forbidden: admin role required" });
  }

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop() ?? "";

  try {
    const body = await req.json();

    if (action === "test") {
      const result = await testItauConnection({
        environment: body.environment ?? "sandbox",
        client_id: body.client_id,
        client_secret: body.client_secret,
        cert_pem: body.cert_pem,
        key_pem: body.key_pem,
        agencia: body.agencia,
        conta: body.conta,
      });
      return json(result.ok ? 200 : 400, result);
    }

    if (action === "upsert") {
      // body: { credential_id, client_secret, cert_pem, key_pem }
      if (!body.credential_id) {
        return json(400, { error: "credential_id obrigatório" });
      }
      const keys = secretKeys(body.credential_id);
      const secrets: Record<string, string> = {};
      if (body.client_secret) secrets[keys.secret] = body.client_secret;
      if (body.cert_pem) secrets[keys.cert] = body.cert_pem;
      if (body.key_pem) secrets[keys.key] = body.key_pem;
      if (Object.keys(secrets).length === 0) {
        return json(400, { error: "Nenhum secret fornecido" });
      }
      await upsertProjectSecrets(secrets);
      return json(200, { ok: true });
    }

    if (action === "delete") {
      if (!body.credential_id) {
        return json(400, { error: "credential_id obrigatório" });
      }
      const keys = secretKeys(body.credential_id);
      await deleteProjectSecrets([keys.secret, keys.cert, keys.key]);
      return json(200, { ok: true });
    }

    return json(404, { error: "Ação não suportada" });
  } catch (err) {
    console.error("itau-credentials-manager error:", err);
    return json(500, {
      error: err instanceof Error ? err.message : "Erro interno",
    });
  }
});
