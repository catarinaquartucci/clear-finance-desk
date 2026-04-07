

# Funcionalidades do Projeto Remix para Implementar

Analisei o projeto "Remix Finance ERP Marquesi" e identifiquei 4 funcionalidades que você selecionou. Abaixo o plano de implementação.

## Visão Geral

| Funcionalidade | Complexidade | Dependências |
|---|---|---|
| Score Financeiro Visual | Baixa | Dados de transações existentes |
| CFO Digital (Chat IA) | Alta | Edge function + Lovable AI |
| Scanner OCR de Documentos | Alta | Edge function + Lovable AI (multimodal) |
| Simulador de Cenários | Média | Reutiliza edge function do CFO |

## 1. Score Financeiro Visual

Componente circular animado (0-100) que calcula saúde financeira baseado em margem, crescimento de receita e controle de despesas.

- Criar `src/components/finance/dashboard/FinancialScore.tsx` — componente SVG circular com animação, score calculado a partir de receitas/despesas do mês atual vs anterior
- Integrar no dashboard financeiro principal (`src/pages/financeiro/FluxoCaixa.tsx` ou página inicial do financeiro)
- Sem necessidade de backend — cálculo 100% client-side usando dados já disponíveis nos hooks existentes

## 2. CFO Digital (Chat com IA Streaming)

Assistente financeiro com chat streaming que analisa dados reais da empresa e responde perguntas estratégicas.

- Criar edge function `supabase/functions/cfo-digital/index.ts`:
  - Busca dados financeiros da empresa (transações, contas a pagar/receber, fluxo de caixa)
  - Monta prompt de sistema com contexto financeiro real
  - Usa Lovable AI Gateway com streaming SSE (`LOVABLE_API_KEY` já configurado)
- Criar página `src/pages/financeiro/CFODigital.tsx`:
  - Chat com streaming token-by-token
  - Cards de ações rápidas (resumo estratégico, alertas de risco, análise de centros de custo)
  - Perguntas sugeridas após resposta
  - Renderização markdown das respostas
- Adicionar rota e item no menu lateral do financeiro

## 3. Scanner OCR de Documentos

Upload de boletos, notas fiscais e recibos — IA extrai dados e classifica automaticamente.

- Criar edge function `supabase/functions/ocr-document/index.ts`:
  - Recebe imagem/PDF em base64
  - Envia para Lovable AI (modelo multimodal `google/gemini-2.5-flash`) com prompt para extrair: tipo de documento, valor, data, emitente, beneficiário, código de barras, etc.
  - Retorna dados estruturados via tool calling
- Criar página `src/pages/financeiro/ScannerDocumentos.tsx`:
  - Área de upload (drag & drop) para imagens e PDFs
  - Exibição dos dados extraídos com campos editáveis
  - Botão para criar lançamento (conta a pagar/receber) a partir dos dados
  - Seleção de conta contábil, centro de custo e conta bancária
- Adicionar rota e item no menu lateral

## 4. Simulador de Cenários

Perguntas "E se..." com simulação financeira baseada em dados reais.

- Criar página `src/pages/financeiro/Simulador.tsx`:
  - Cards com cenários pré-definidos (demitir funcionário, receita cair 20%, contratar mais pessoas, etc.)
  - Campo livre para perguntas customizadas
  - Reutiliza a edge function `cfo-digital` com prompt especializado para simulação
  - Resposta renderizada em markdown com streaming
- Adicionar rota e item no menu lateral

## Ordem de implementação sugerida

1. **Score Financeiro** — sem dependência de backend, implementação rápida
2. **CFO Digital** — cria a edge function base que será reutilizada
3. **Simulador de Cenários** — reutiliza a edge function do CFO
4. **Scanner OCR** — funcionalidade independente com edge function própria

## Detalhes técnicos

- Todas as chamadas IA usam `LOVABLE_API_KEY` (já configurado) via Lovable AI Gateway
- Edge functions com CORS headers padrão e tratamento de erros 429/402
- Modelo padrão: `google/gemini-3-flash-preview` para chat/simulação, `google/gemini-2.5-flash` para OCR multimodal
- Streaming SSE para CFO e Simulador, resposta JSON para Scanner OCR
- Rotas protegidas pelo `FinanceGuard` existente

