

# Dashboard Financeiro - Pagina Inicial do Modulo Financas

## Resumo

Criar uma pagina de dashboard como tela inicial do modulo financeiro (`/financeiro/dashboard`), substituindo o redirecionamento atual para "Cadastros". A pagina exibira KPI cards com os principais indicadores e graficos interativos usando dados reais de contas a pagar, receber e centros de custo.

---

## O que sera criado

### 1. Pagina `src/pages/financeiro/FinanceDashboard.tsx`

Dashboard com as seguintes secoes:

**KPI Cards (linha superior - 6 cards):**
- Receita Total (receivables com status received)
- Despesa Total (payables com status paid)
- Geracao de Caixa (receita - despesa)
- Margem Liquida (%)
- Atingimento de Meta (% vs meta configurada)
- Saldo Final

**Graficos:**
- Receitas x Despesas mensal (BarChart com recharts, 12 meses do ano atual)
- Distribuicao por Centro de Custo (PieChart)
- Contas vencidas vs em dia (cards de alerta)
- Ultimas movimentacoes (tabela resumida com as 5 mais recentes)

### 2. Hook `src/hooks/useDashboardFinance.ts`

Hook dedicado que busca dados agregados para o dashboard:
- Total de payables por status (open, overdue, paid)
- Total de receivables por status
- Dados mensais para o grafico de barras (reutiliza logica de `useMonthlyFlowReport`)
- Dados de centro de custo (reutiliza logica de `useCostCenterDashboard`)
- Ultimas transacoes (5 payables + 5 receivables mais recentes)

### 3. Componentes visuais

- `src/components/finance/dashboard/FinancialKPICards.tsx` - Grid de 6 KPI cards
- `src/components/finance/dashboard/RevenueExpenseChart.tsx` - Grafico de barras Receitas x Despesas
- `src/components/finance/dashboard/RecentTransactions.tsx` - Tabela das ultimas movimentacoes (ja existe, sera reutilizado/ajustado)

### 4. Alteracoes em arquivos existentes

**`src/App.tsx`:**
- Importar `FinanceDashboard`
- Alterar redirect index de `cadastros` para `dashboard`
- Adicionar rota `<Route path="dashboard" element={<FinanceDashboard />} />`

**`src/components/finance/layout/FinanceNavigation.tsx`:**
- Adicionar item "Dashboard" como primeiro item da navegacao com icone `LayoutDashboard`

---

## Detalhes Tecnicos

### Hook useDashboardFinance

```typescript
// Busca paralela de payables e receivables do ano atual
// Agrega por mes para grafico de barras
// Calcula KPIs: totais, margens, vencidos
// Retorna { kpis, monthlyData, costCenterData, recentItems, isLoading }
```

### KPI Cards

Usa o componente Card existente com icones do lucide-react e cores condicionais (verde para positivo, vermelho para negativo).

### Grafico Receitas x Despesas

Utiliza `recharts` (BarChart) com dois bars: Receitas (verde) e Despesas (vermelho), agrupados por mes.

### Filtro por filial

Inclui o `CompanyFilter` existente no topo do dashboard para filtrar todos os dados por empresa/filial.

### Sequencia de implementacao

1. Criar hook `useDashboardFinance.ts`
2. Criar componentes `FinancialKPICards.tsx` e `RevenueExpenseChart.tsx`
3. Criar pagina `FinanceDashboard.tsx`
4. Atualizar `FinanceNavigation.tsx` (adicionar item Dashboard)
5. Atualizar `App.tsx` (rota + redirect)
