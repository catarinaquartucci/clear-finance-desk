import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error('Não autorizado');

    // Verificar se é admin
    const { data: roleData } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error('Acesso negado: apenas administradores');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { colaboradores } = await req.json() as { colaboradores: any[] };

    if (!colaboradores || !Array.isArray(colaboradores)) {
      throw new Error('Lista de colaboradores inválida');
    }

    console.log(`Restaurando ${colaboradores.length} colaboradores`);

    let sucessos = 0;
    let falhas = 0;
    const results: { nome: string; email: string; sucesso: boolean; erro?: string }[] = [];

    for (const colab of colaboradores) {
      try {
        const updateData: Record<string, any> = {};

        // Mapear campos permitidos
        const fields = [
          'nome', 'cnpj', 'cpf', 'endereco', 'chave_pix_cnpj', 'email',
          'data_inicio_contrato', 'area', 'funcao', 'variavel', 'regra_ote',
        ];

        for (const field of fields) {
          if (colab[field] !== undefined && colab[field] !== '') {
            updateData[field] = colab[field];
          }
        }

        // Campos numéricos
        if (colab.remuneracao !== undefined) {
          updateData.remuneracao = parseFloat(colab.remuneracao) || 0;
        }

        // Campos booleanos
        const boolFields = ['is_admin', 'ativo', 'has_finance_access', 'has_finance_view_access', 'has_admin_view_access'];
        for (const field of boolFields) {
          if (colab[field] !== undefined) {
            updateData[field] = colab[field] === true || colab[field] === 'true' || colab[field] === 'TRUE';
          }
        }

        // Campos de data (nullable)
        const dateFields = ['data_fim_contrato', 'data_nascimento'];
        for (const field of dateFields) {
          if (colab[field] !== undefined) {
            updateData[field] = colab[field] && colab[field] !== '' ? colab[field] : null;
          }
        }

        // user_id - preservar se existir no CSV
        if (colab.user_id && colab.user_id !== '') {
          updateData.user_id = colab.user_id;
        }

        if (colab.id) {
          // Atualizar registro existente pelo ID
          const { error } = await supabase
            .from('colaboradores')
            .update(updateData)
            .eq('id', colab.id);

          if (error) {
            // Se não existe, inserir com o ID
            const { error: insertError } = await supabase
              .from('colaboradores')
              .insert({ id: colab.id, ...updateData });

            if (insertError) {
              results.push({ nome: colab.nome || '', email: colab.email || '', sucesso: false, erro: insertError.message });
              falhas++;
              continue;
            }
          }
        } else {
          // Sem ID, inserir novo
          const { error } = await supabase
            .from('colaboradores')
            .insert(updateData);

          if (error) {
            results.push({ nome: colab.nome || '', email: colab.email || '', sucesso: false, erro: error.message });
            falhas++;
            continue;
          }
        }

        results.push({ nome: colab.nome || '', email: colab.email || '', sucesso: true });
        sucessos++;
      } catch (err) {
        results.push({
          nome: colab.nome || '',
          email: colab.email || '',
          sucesso: false,
          erro: err instanceof Error ? err.message : 'Erro desconhecido',
        });
        falhas++;
      }
    }

    console.log(`Restauração finalizada: ${sucessos} sucessos, ${falhas} falhas`);

    return new Response(
      JSON.stringify({ results, sucessos, falhas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Erro na restauração:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
