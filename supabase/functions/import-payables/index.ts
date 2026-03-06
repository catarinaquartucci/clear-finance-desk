import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PayableImport {
  description: string;
  amount: number;
  due_date: string;
  status?: string;
  payment_method?: string;
  notes?: string;
  company_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Check admin or finance role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAccess = roles?.some(r => r.role === 'admin' || r.role === 'finance');
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { payables } = await req.json() as { payables: PayableImport[] };

    if (!payables || !Array.isArray(payables)) {
      throw new Error('Lista de contas a pagar inválida');
    }

    console.log(`Importando ${payables.length} contas a pagar`);

    // Insert in batches of 100
    const batchSize = 100;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < payables.length; i += batchSize) {
      const batch = payables.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('payables')
        .insert(batch.map(p => ({
          description: p.description,
          amount: p.amount,
          due_date: p.due_date,
          status: p.status || 'open',
          payment_method: p.payment_method || null,
          notes: p.notes || null,
          company_id: p.company_id || null,
        })));

      if (error) {
        console.error(`Erro no batch ${i / batchSize + 1}:`, error);
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
      }
    }

    console.log(`Importação finalizada: ${totalInserted} inseridos, ${totalErrors} erros`);

    return new Response(
      JSON.stringify({
        message: `Importação concluída: ${totalInserted} inseridos, ${totalErrors} erros`,
        total: payables.length,
        inserted: totalInserted,
        errors: totalErrors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na importação:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
