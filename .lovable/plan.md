

# Relatórios Financeiros — Ajustes

## 1. Incluir valor total nas exportações Excel e PDF

Atualmente, os relatórios exportam apenas as linhas de dados sem uma linha de totalização. Adicionar uma **linha "TOTAL"** ao final dos dados exportados em Excel e PDF nos seguintes componentes:

- **PayablesReport** — linha total no `handleExcel` e `handlePDF`
- **ReceivablesReport** — idem
- **PaidReport** — idem
- **CostCenterDashboard** — idem (já mostra total na tela, falta no export)
- **MonthlyFlowChart** — adicionar linha total no export Excel
- **ExecutiveSummary** — já exporta KPIs, sem alteração necessária

A implementação é simples: antes de chamar `exportToExcel`/`exportToPDF`, adicionar um objeto/array extra com "TOTAL" na primeira coluna e o valor total na coluna de valor.

## 2. Remover abas não utilizadas

Remover **Top Fornecedores**, **DRE** e **Aging** da página de Relatórios:

- **`Relatorios.tsx`** — remover as 3 TabsTrigger e TabsContent correspondentes, e remover os imports de `TopSuppliersChart`, `DREReport`, `AgingReport`
- **`useReportQueries.ts`** — remover `useTopSuppliersReport` (não usado em mais nenhum lugar)
- Os arquivos de componente (`TopSuppliersChart.tsx`, `DREReport.tsx`, `AgingReport.tsx`) podem ser mantidos por ora (não causam overhead), mas os imports são removidos

## 3. Remover página NFS-e e corrigir instabilidade

O usuário confirmou que a emissão de NFS-e é feita diretamente na prefeitura e lançada como conta a receber. Portanto:

- **`AppSidebar.tsx`** — remover o item `{ icon: FileText, label: "NFS-e", path: "/financeiro/emissao-nf" }` do menu
- **`App.tsx`** — remover a rota `/financeiro/emissao-nf` e o lazy import de `EmissaoNF`
- Não é necessário corrigir a instabilidade do campo de valor pois a página será removida

## Arquivos a editar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/finance/reports/PayablesReport.tsx` | Linha total no Excel e PDF |
| `src/components/finance/reports/ReceivablesReport.tsx` | Linha total no Excel e PDF |
| `src/components/finance/reports/PaidReport.tsx` | Linha total no Excel e PDF |
| `src/components/finance/reports/CostCenterDashboard.tsx` | Linha total no Excel e PDF |
| `src/components/finance/reports/MonthlyFlowChart.tsx` | Linha total no Excel |
| `src/pages/financeiro/Relatorios.tsx` | Remover abas Top Fornecedores, DRE, Aging |
| `src/components/Layout/AppSidebar.tsx` | Remover item NFS-e do menu |
| `src/App.tsx` | Remover rota e import de EmissaoNF |

