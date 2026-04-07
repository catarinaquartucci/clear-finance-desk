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

    // Verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image_base64, mime_type } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "Imagem não fornecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em análise de documentos financeiros brasileiros. 
Extraia os dados do documento enviado usando a ferramenta extract_document_data.
Identifique: tipo de documento (boleto, nota_fiscal, recibo, outro), valor, data de vencimento,
emitente/beneficiário, CNPJ/CPF, código de barras (se houver), descrição do serviço/produto.
Use formato de data YYYY-MM-DD. Valores numéricos sem formatação.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise este documento financeiro e extraia os dados:" },
              {
                type: "image_url",
                image_url: { url: `data:${mime_type || "image/png"};base64,${image_base64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_data",
              description: "Extrair dados estruturados de um documento financeiro",
              parameters: {
                type: "object",
                properties: {
                  document_type: {
                    type: "string",
                    enum: ["boleto", "nota_fiscal", "recibo", "outro"],
                    description: "Tipo do documento",
                  },
                  amount: { type: "number", description: "Valor total em reais" },
                  due_date: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
                  issue_date: { type: "string", description: "Data de emissão (YYYY-MM-DD)" },
                  issuer_name: { type: "string", description: "Nome do emitente/beneficiário" },
                  issuer_document: { type: "string", description: "CNPJ ou CPF do emitente" },
                  payer_name: { type: "string", description: "Nome do pagador" },
                  payer_document: { type: "string", description: "CNPJ ou CPF do pagador" },
                  barcode: { type: "string", description: "Linha digitável ou código de barras" },
                  description: { type: "string", description: "Descrição do serviço ou produto" },
                  invoice_number: { type: "string", description: "Número da nota fiscal" },
                  confidence: {
                    type: "number",
                    description: "Nível de confiança na extração (0-100)",
                  },
                },
                required: ["document_type", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_document_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiResponse.text();
      console.error("OCR AI error:", status, txt);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResponse.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair dados do documento" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
