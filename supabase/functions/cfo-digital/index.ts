import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch financial context
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonth = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    const [payablesRes, receivablesRes, cashFlowRes, planningRes] = await Promise.all([
      supabase.from("payables").select("amount, status, due_date, description").order("due_date", { ascending: false }).limit(50),
      supabase.from("receivables").select("amount, status, due_date, description").order("due_date", { ascending: false }).limit(50),
      supabase.from("cash_flow_data").select("category_code, month, realized_value, projected_value").in("month", [currentMonth, prevMonth]),
      supabase.from("monthly_planning").select("*").in("month", [currentMonth, prevMonth]),
    ]);

    const pendingPayables = (payablesRes.data || []).filter(p => p.status === "pending");
    const totalPendingPayables = pendingPayables.reduce((s, p) => s + Number(p.amount), 0);
    const pendingReceivables = (receivablesRes.data || []).filter(r => r.status === "pending");
    const totalPendingReceivables = pendingReceivables.reduce((s, r) => s + Number(r.amount), 0);

    const simulatorExtra = mode === "simulator"
      ? `\n\nVocê está no modo SIMULADOR DE CENÁRIOS. O usuário vai fazer perguntas do tipo "E se...". 
Analise o impacto financeiro usando os dados reais acima. Apresente projeções numéricas, 
liste riscos e oportunidades, e dê recomendações claras. Use tabelas markdown quando apropriado.`
      : "";

    const systemPrompt = `Você é o CFO Digital, um assistente financeiro inteligente da empresa. 
Responda sempre em português brasileiro. Use markdown para formatar suas respostas.

## Dados financeiros atuais (${currentMonth}):

### Contas a Pagar Pendentes: R$ ${totalPendingPayables.toLocaleString("pt-BR")}
${pendingPayables.slice(0, 10).map(p => `- ${p.description}: R$ ${Number(p.amount).toLocaleString("pt-BR")} (venc: ${p.due_date})`).join("\n")}

### Contas a Receber Pendentes: R$ ${totalPendingReceivables.toLocaleString("pt-BR")}
${pendingReceivables.slice(0, 10).map(r => `- ${r.description}: R$ ${Number(r.amount).toLocaleString("pt-BR")} (venc: ${r.due_date})`).join("\n")}

### Fluxo de Caixa:
${(cashFlowRes.data || []).map(cf => `- ${cf.category_code} (${cf.month}): Realizado R$ ${Number(cf.realized_value || 0).toLocaleString("pt-BR")} / Previsto R$ ${Number(cf.projected_value || 0).toLocaleString("pt-BR")}`).join("\n")}

### Planejamento Mensal:
${(planningRes.data || []).map(p => `- ${p.month}: Receita R$ ${Number(p.revenue || 0).toLocaleString("pt-BR")} | Despesa R$ ${Number(p.expense || 0).toLocaleString("pt-BR")}`).join("\n")}

Baseie suas respostas nestes dados reais. Seja preciso, objetivo e estratégico.${simulatorExtra}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Chave de API não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiResponse.text();
      console.error("AI gateway error:", status, txt);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("cfo-digital error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
