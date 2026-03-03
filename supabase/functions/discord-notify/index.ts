import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface NotificationPayload {
  type: 'reembolso' | 'devolucao' | 'material' | 'nota_fiscal';
  data: Record<string, any>;
}

const COLORS = {
  reembolso: 0x00d4ff,
  devolucao: 0xff6b6b,
  material: 0xffd93d,
  nota_fiscal: 0x6bcb77,
};

const EMOJIS = {
  reembolso: '💰',
  devolucao: '↩️',
  material: '📦',
  nota_fiscal: '🧾',
};

const TITLES = {
  reembolso: 'Nova Solicitação de Reembolso',
  devolucao: 'Nova Solicitação de Devolução',
  material: 'Nova Solicitação de Material',
  nota_fiscal: 'Nova Nota Fiscal Enviada',
};

function buildEmbed(payload: NotificationPayload) {
  const { type, data } = payload;
  
  let fields = [];
  
  switch (type) {
    case 'reembolso':
      fields = [
        { name: '👤 Solicitante', value: data.nome || '-', inline: true },
        { name: '💵 Valor', value: `R$ ${data.valor || 0}`, inline: true },
        { name: '🏢 Centro de Custo', value: data.centroCusto || '-', inline: true },
        { name: '📝 Motivo', value: (data.motivo || '-').substring(0, 200) },
      ];
      break;
    case 'devolucao':
      fields = [
        { name: '👤 Cliente', value: data.nomeCliente || '-', inline: true },
        { name: '💵 Valor', value: `R$ ${data.valor || 0}`, inline: true },
        { name: '👷 Responsável', value: data.responsavel || '-', inline: true },
        { name: '📝 Motivo', value: (data.motivo || '-').substring(0, 200) },
      ];
      break;
    case 'material':
      fields = [
        { name: '👤 Solicitante', value: data.nomeSolicitante || '-', inline: true },
        { name: '🏢 Centro de Custo', value: data.centroCusto || '-', inline: true },
        { name: '📦 Material', value: data.material || '-' },
        { name: '📝 Justificativa', value: (data.justificativa || '-').substring(0, 200) },
      ];
      break;
    case 'nota_fiscal':
      fields = [
        { name: '👤 Nome/Razão Social', value: data.nome || '-', inline: true },
        { name: '💵 Valor', value: `R$ ${data.valor || 0}`, inline: true },
        { name: '🏢 CNPJ', value: data.cnpj || '-', inline: true },
        { name: '📅 Período', value: data.periodoReferencia || '-', inline: true },
        { name: '💳 Mês Pagamento', value: data.mesPagamento || '-', inline: true },
      ];
      break;
  }
  
  return {
    embeds: [{
      title: `${EMOJIS[type]} ${TITLES[type]}`,
      color: COLORS[type],
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'Sistema Viver de IA' },
    }],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTH CHECK: require authenticated user ===
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // === END AUTH CHECK ===

    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not configured');
      throw new Error('DISCORD_WEBHOOK_URL not configured');
    }

    const payload: NotificationPayload = await req.json();
    console.log('Discord notification request:', payload.type, JSON.stringify(payload.data));

    const embed = buildEmbed(payload);
    console.log('Sending embed to Discord:', JSON.stringify(embed));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', response.status, errorText);
      throw new Error(`Discord API error: ${response.status} - ${errorText}`);
    }

    console.log('Discord notification sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Discord notify error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
