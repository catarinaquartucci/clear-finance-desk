

# Remodelar Dashboard Inicial — Foco 100% Financeiro

## Situação Atual
A página Index (`/`) exibe métricas genéricas de reembolsos/devoluções e cards informativos estáticos voltados a "usuários em geral". O roteamento atual direciona `/` para a página de Regras. Não há dashboard financeiro consolidado na entrada do sistema.

## Proposta

Substituir completamente o conteúdo de `Index.tsx` por um **dashboard financeiro executivo** com três blocos principais:

### 1. KPIs de Saldo e Fluxo de Caixa (topo)
4 cards em grid:
- **Saldo Atual** — soma do `current_balance` de todas as `bank_accounts` da Vantari
- **Entradas do Mês** — total de créditos em `bank_transactions` do mês corrente
- **Saídas do Mês** — total de débitos em `bank_transactions` do mês corrente
- **Projeção de Caixa** — saldo + receitas previstas (`receivables` open) − despesas previstas (`payables` open) nos próximos 30 dias

### 2. Alertas de Contas a Pagar (meio)
Card com tabela compacta mostrando:
- Contas **vencidas** (status = 'overdue') com destaque vermelho
- Contas **vencendo nos próximos 7 dias** (status = 'open', due_date ≤ hoje + 7)
- Total vencido e total a vencer
- Link para `/financeiro/contas-pagar`

### 3. Composição de Despesas do Mês (inferior)
- Pie chart agrupando `payables` do mês corrente por `notes` (mesmo padrão já implementado na Análise Financeira)
- Reutilizar `ExpenseBreakdownPie` existente

### Roteamento
- Alterar `App.tsx` para que `/` redirecione para `/dashboard` (nova rota protegida)
- Mover o dashboard financeiro para `/dashboard`
- Manter `/regras` como rota separada

## Implementação

### Novo hook: `src/hooks/useFinanceDashboard.ts`
Query única que busca em paralelo:
1. `bank_accounts` (company_id = Vantari) → saldo
2. `bank_transactions` do mês corrente → entradas/saídas
3. `payables` com status 'overdue' ou due_date ≤ 7 dias → alertas
4. `payables` do mês corrente agrupados por `notes` → composição
5. `receivables` open dos próximos 30 dias → projeção

### Reescrever: `src/pages/Index.tsx`
- Remover todo conteúdo atual (reembolsos, ações rápidas, info cards)
- Novo layout com os 3 blocos acima
- Manter Header + Navigation

### Editar: `src/App.tsx`
- Rota `/` → `<Navigate to="/dashboard" />`
- Rota `/dashboard` → `<ProtectedRoute><Index /></ProtectedRoute>`

### Arquivos a editar/criar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useFinanceDashboard.ts` | Criar — queries de saldo, alertas, composição |
| `src/pages/Index.tsx` | Reescrever — dashboard financeiro |
| `src/App.tsx` | Ajustar rotas |
| `src/hooks/useDashboardStats.tsx` | Pode ser removido (não mais utilizado) |

