

# Dashboard — Sub-janela ao clicar nos quadros

## Situação atual
A página `/dashboard` (Index.tsx) possui 6 quadros:
1. **Saldo Atual** — KPI card
2. **Entradas do Mês** — KPI card
3. **Saídas do Mês** — KPI card
4. **Projeção 30 dias** — KPI card
5. **Contas a Pagar — Atenção** — tabela de alertas
6. **Despesas por Tipo** — gráfico de pizza

Nenhum deles abre detalhes ao clicar.

## Proposta

Ao clicar em qualquer quadro, abrir um **Dialog** com detalhes relevantes:

| Quadro | Conteúdo do Dialog |
|--------|-------------------|
| Saldo Atual | Lista de contas bancárias com saldo individual |
| Entradas do Mês | Lista das transações de crédito do mês (descrição, valor, data) |
| Saídas do Mês | Lista das transações de débito do mês |
| Projeção 30 dias | Breakdown: saldo atual + recebíveis previstos - pagáveis previstos |
| Contas a Pagar | Já tem link "Ver todas", manter comportamento e adicionar click no card inteiro para abrir dialog com lista completa |
| Despesas por Tipo | Dialog com tabela detalhada por categoria (nome, valor, % do total) |

## Implementação

### 1. Expandir `useFinanceDashboard` para retornar dados de detalhe
- Adicionar ao retorno: `bankAccountsDetail` (nome + saldo por conta), `entradasDetail` (transações crédito), `saidasDetail` (transações débito), `projecaoDetail` (recebíveis e pagáveis abertos)

### 2. Criar `src/components/Dashboard/DashboardDetailDialog.tsx`
- Componente genérico que recebe `type` (saldo|entradas|saidas|projecao|payables|despesas) e renderiza o conteúdo adequado
- Usa Dialog do shadcn/ui
- Tabelas simples com scroll para listas longas

### 3. Atualizar `src/pages/Index.tsx`
- Adicionar state `openDetail: string | null`
- Tornar cada KPI Card clicável (`cursor-pointer`, `onClick`)
- Tornar os cards de Contas a Pagar e Despesas clicáveis
- Renderizar o `DashboardDetailDialog` condicionalmente

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useFinanceDashboard.ts` | Adicionar dados de detalhe ao retorno |
| `src/components/Dashboard/DashboardDetailDialog.tsx` | Criar — dialog com conteúdo por tipo |
| `src/pages/Index.tsx` | Adicionar estado e onClick em todos os quadros |

