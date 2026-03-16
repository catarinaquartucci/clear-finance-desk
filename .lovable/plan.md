

# Remover Devolucao + Novo Modulo de Relatorios Avancados

## 1. Remover aba "Devolucao" da pagina Solicitacoes

**Arquivo**: `src/pages/Solicitacoes.tsx`
- Remover a tab "Devolucao" e seu conteudo (`DevolucaoForm`)
- Remover import de `DevolucaoForm` e `TrendingUp`
- Ajustar grid de tabs de 4 para 3 colunas
- Na aba "Minhas Solicitacoes", remover `MyDevolucoesList`

**Arquivo**: `src/pages/admin/AdminDashboard.tsx`
- Remover o AccordionItem de "Devoluções" e imports relacionados (`DevolucoesList`, `useDevolucoes`)

---

## 2. Reformular pagina de Relatorios Financeiros

**Arquivo**: `src/pages/financeiro/Relatorios.tsx` - Reescrever com novas abas

### Novas abas:

| Aba | Descricao | Filtros |
|-----|-----------|---------|
| Contas a Pagar | Listagem de payables com status open/overdue | Periodo (de-ate) + Filial |
| Contas a Receber | Listagem de receivables com status open/overdue | Periodo (de-ate) + Filial |
| Contas Pagas | Payables ja pagos com data de pagamento | Periodo (de-ate) + Filial |
| Gastos por Centro de Custo | Dashboard com grafico de pizza/barras + tabela | Periodo + Filial |
| DRE | Mantido como esta | Ano |
| Aging | Mantido como esta | - |

### Componentes novos:

- `src/components/finance/reports/PayablesReport.tsx` - Tabela de contas a pagar com filtros de periodo e filial, botoes de exportar Excel e PDF
- `src/components/finance/reports/ReceivablesReport.tsx` - Tabela de contas a receber com filtros
- `src/components/finance/reports/PaidReport.tsx` - Contas pagas com data de pagamento
- `src/components/finance/reports/CostCenterDashboard.tsx` - Dashboard com grafico de rosca (recharts PieChart) mostrando distribuicao de gastos por centro de custo + tabela detalhada
- `src/components/finance/reports/ReportFilters.tsx` - Componente reutilizavel com DatePicker "De" e "Ate" + CompanyFilter + botoes de exportar

### Exportacao:

- **Excel**: Usar biblioteca `xlsx` (ja instalada) para gerar planilhas
- **PDF**: Gerar via `window.print()` com CSS de impressao dedicado, ou criar uma funcao que monta uma tabela HTML e abre em nova janela para imprimir como PDF

---

## 3. Dashboards e Relatorios Sugeridos (incluidos na implementacao)

Alem dos solicitados, incluir as seguintes abas extras no modulo de Relatorios:

1. **Fluxo Mensal** - Grafico de barras comparando receitas vs despesas mes a mes (usando dados de payables/receivables agrupados por mes). Filtro por ano e filial.

2. **Top Fornecedores** - Ranking dos maiores fornecedores por valor pago, com grafico de barras horizontal. Filtro por periodo e filial.

3. **Resumo Executivo** - Card com KPIs: total a pagar, total a receber, saldo liquido, taxa de inadimplencia, ticket medio. Exportavel em PDF como relatorio executivo de uma pagina.

Estes serao adicionados como abas extras no mesmo componente de Relatorios.

---

## 4. Detalhes Tecnicos

### Hooks atualizados/novos:

**`src/hooks/useFinancialReports.ts`** - Adicionar novos hooks:
- `usePayablesReport(dateFrom, dateTo, companyId)` - Busca payables com joins em suppliers e cost_centers, filtrando por periodo e company_id
- `useReceivablesReport(dateFrom, dateTo, companyId)` - Idem para receivables com join em customers
- `usePaidReport(dateFrom, dateTo, companyId)` - Payables com status "paid", usando paid_date como filtro de periodo
- `useCostCenterDashboard(dateFrom, dateTo, companyId)` - Agrupa payables por cost_center_id, retorna totais para grafico
- `useMonthlyFlowReport(year, companyId)` - Agrupa receitas e despesas por mes
- `useExecutiveSummary(dateFrom, dateTo, companyId)` - Calcula KPIs agregados

### Exportacao Excel (usando xlsx):

```typescript
import * as XLSX from "xlsx";

function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

### Exportacao PDF:

Criar funcao `exportToPDF` que monta HTML com estilos inline, abre em nova janela e chama `window.print()`.

### Arquivos modificados:

- `src/pages/Solicitacoes.tsx` - Remover tab devolucao
- `src/pages/admin/AdminDashboard.tsx` - Remover secao devoluções
- `src/pages/financeiro/Relatorios.tsx` - Reescrever com todas as novas abas
- `src/hooks/useFinancialReports.ts` - Adicionar novos hooks

### Arquivos novos:

- `src/components/finance/reports/ReportFilters.tsx`
- `src/components/finance/reports/PayablesReport.tsx`
- `src/components/finance/reports/ReceivablesReport.tsx`
- `src/components/finance/reports/PaidReport.tsx`
- `src/components/finance/reports/CostCenterDashboard.tsx`
- `src/components/finance/reports/MonthlyFlowChart.tsx`
- `src/components/finance/reports/TopSuppliersChart.tsx`
- `src/components/finance/reports/ExecutiveSummary.tsx`
- `src/lib/exportUtils.ts` - Funcoes utilitarias de exportacao (Excel + PDF)

### Nenhuma mudanca no banco de dados

Todos os dados ja existem nas tabelas `payables`, `receivables`, `suppliers`, `customers`, `cost_centers`. Os novos relatorios sao consultas com filtros sobre dados existentes.

