import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarveeCategory {
  id: number;
  structure: string;
  description: string;
}

interface MarveeDocument {
  id: number;
  code: string | number;
  category_level_1?: MarveeCategory;
  category_level_2?: MarveeCategory;
  category_level_3?: MarveeCategory;
}

interface MarveeConta {
  id: number;
  movement_value: number;
  payment_date?: string;
  expiration_date?: string;
  installment?: number;
  document?: MarveeDocument;
}

interface MarveePaginatedResponse {
  data: MarveeConta[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface TransactionRecord {
  marvee_id: number;
  source_type: string;
  status: string;
  installment: number;
  movement_value: number;
  payment_date: string | null;
  expiration_date: string | null;
  document_number: string | null;
  category_level_1_id: number | null;
  category_level_1_structure: string | null;
  category_level_1_description: string | null;
  category_level_2_id: number | null;
  category_level_2_structure: string | null;
  category_level_2_description: string | null;
  category_level_3_id: number | null;
  category_level_3_structure: string | null;
  category_level_3_description: string | null;
  raw_payload: unknown;
  synced_at: string;
}

// Fetch all pages from Marvee API
async function fetchAllContas(
  apiUrl: string,
  endpoint: string,
  status: "paid" | "pending",
  startDate: string,
  endDate: string,
  clientId: string,
  clientSecret: string
): Promise<MarveeConta[]> {
  const allContas: MarveeConta[] = [];
  let page = 1;
  let hasMore = true;

  // Para paid usamos date_option=liquidacao, para pending usamos date_option=vencimento
  const dateOption = status === "paid" ? "liquidacao" : "vencimento";

  while (hasMore) {
    const url = new URL(`${apiUrl}/v1/${endpoint}`);
    url.searchParams.set("dateStart", startDate);
    url.searchParams.set("dateEnd", endDate);
    url.searchParams.set("status", status);
    url.searchParams.set("date_option", dateOption);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", "1000");
    
    console.log(`Fetching: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "client-id": clientId,
        "authorization": clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Marvee API error: ${response.status} - ${errorText}`);
    }

    const data: MarveePaginatedResponse = await response.json();
    
    allContas.push(...(data.data || []));
    
    console.log(`Page ${page}/${data.meta?.last_page || 1}: fetched ${data.data?.length || 0} records (total so far: ${allContas.length})`);
    
    hasMore = data.meta?.current_page < data.meta?.last_page;
    page++;

    // Safety limit
    if (page > 100) {
      console.warn("Reached page limit (100), stopping pagination");
      break;
    }
  }

  return allContas;
}

// Transform Marvee conta to database record
function transformToRecord(
  conta: MarveeConta,
  sourceType: "receita" | "despesa",
  status: "paid" | "pending",
  syncedAt: string
): TransactionRecord {
  const doc = conta.document;
  
  return {
    marvee_id: conta.id,
    source_type: sourceType,
    status: status,
    installment: conta.installment || 1,
    movement_value: Number(conta.movement_value) || 0,
    payment_date: conta.payment_date || null,
    expiration_date: conta.expiration_date || null,
    document_number: doc?.code != null ? String(doc.code) : null,
    category_level_1_id: doc?.category_level_1?.id || null,
    category_level_1_structure: doc?.category_level_1?.structure || null,
    category_level_1_description: doc?.category_level_1?.description || null,
    category_level_2_id: doc?.category_level_2?.id || null,
    category_level_2_structure: doc?.category_level_2?.structure || null,
    category_level_2_description: doc?.category_level_2?.description || null,
    category_level_3_id: doc?.category_level_3?.id || null,
    category_level_3_structure: doc?.category_level_3?.structure || null,
    category_level_3_description: doc?.category_level_3?.description || null,
    raw_payload: conta,
    synced_at: syncedAt,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment variables
    const marveeApiUrl = Deno.env.get("MARVEE_API_URL");
    const marveeClientId = Deno.env.get("MARVEE_CLIENT_ID");
    const marveeClientSecret = Deno.env.get("MARVEE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!marveeApiUrl || !marveeClientId || !marveeClientSecret) {
      throw new Error("Missing Marvee API credentials");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // === AUTH CHECK: require admin or finance role ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authToken = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authToken);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerIdR = claimsData.claims.sub;
    const { data: roleDataR } = await supabase
      .from('user_roles').select('role').eq('user_id', callerIdR).in('role', ['admin', 'finance']).limit(1).maybeSingle();
    if (!roleDataR) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // === END AUTH CHECK ===

    // Parse request body
    const body = await req.json();
    const { year, sync_all } = body;

    // Determine date range
    let startDate: string;
    let endDate: string;

    if (sync_all) {
      startDate = "2020-01-01";
      endDate = new Date().toISOString().split("T")[0];
    } else if (year) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else {
      // Default: current year
      const currentYear = new Date().getFullYear();
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;
    }

    console.log(`Syncing raw data from ${startDate} to ${endDate}`);

    const syncedAt = new Date().toISOString();
    const allRecords: TransactionRecord[] = [];
    const stats = {
      contasReceberPaid: 0,
      contasReceberPending: 0,
      contasPagarPaid: 0,
      contasPagarPending: 0,
      total: 0,
      inserted: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Fetch contas a receber (receitas) - PAID
    console.log("Fetching contas a receber - paid...");
    const receitasPagas = await fetchAllContas(
      marveeApiUrl,
      "contas-a-receber",
      "paid",
      startDate,
      endDate,
      marveeClientId,
      marveeClientSecret
    );
    stats.contasReceberPaid = receitasPagas.length;
    console.log(`Got ${receitasPagas.length} paid receivables`);

    // Fetch contas a receber (receitas) - PENDING
    console.log("Fetching contas a receber - pending...");
    const receitasPendentes = await fetchAllContas(
      marveeApiUrl,
      "contas-a-receber",
      "pending",
      startDate,
      endDate,
      marveeClientId,
      marveeClientSecret
    );
    stats.contasReceberPending = receitasPendentes.length;
    console.log(`Got ${receitasPendentes.length} pending receivables`);

    // Fetch contas a pagar (despesas) - PAID
    console.log("Fetching contas a pagar - paid...");
    const despesasPagas = await fetchAllContas(
      marveeApiUrl,
      "contas-a-pagar",
      "paid",
      startDate,
      endDate,
      marveeClientId,
      marveeClientSecret
    );
    stats.contasPagarPaid = despesasPagas.length;
    console.log(`Got ${despesasPagas.length} paid payables`);

    // Fetch contas a pagar (despesas) - PENDING
    console.log("Fetching contas a pagar - pending...");
    const despesasPendentes = await fetchAllContas(
      marveeApiUrl,
      "contas-a-pagar",
      "pending",
      startDate,
      endDate,
      marveeClientId,
      marveeClientSecret
    );
    stats.contasPagarPending = despesasPendentes.length;
    console.log(`Got ${despesasPendentes.length} pending payables`);

    // Transform all records
    for (const conta of receitasPagas) {
      allRecords.push(transformToRecord(conta, "receita", "paid", syncedAt));
    }
    for (const conta of receitasPendentes) {
      allRecords.push(transformToRecord(conta, "receita", "pending", syncedAt));
    }
    for (const conta of despesasPagas) {
      allRecords.push(transformToRecord(conta, "despesa", "paid", syncedAt));
    }
    for (const conta of despesasPendentes) {
      allRecords.push(transformToRecord(conta, "despesa", "pending", syncedAt));
    }

    stats.total = allRecords.length;
    console.log(`Total records to insert: ${allRecords.length}`);

    // Insert in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE);
      console.log(`Upserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allRecords.length / BATCH_SIZE)} (${batch.length} records)`);

      const { data, error } = await supabase
        .from("marvee_transactions")
        .upsert(batch, { 
          onConflict: "marvee_id,source_type,status,installment",
          ignoreDuplicates: false 
        })
        .select("id");

      if (error) {
        console.error(`Batch error: ${error.message}`);
        stats.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        stats.inserted += data?.length || 0;
      }
    }

    console.log(`Sync completed! Inserted/updated: ${stats.inserted}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        dateRange: { startDate, endDate },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in marvee-sync-raw:", errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
