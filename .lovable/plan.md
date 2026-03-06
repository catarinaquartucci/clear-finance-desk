

# Vantari como Sede + Sincronização de Dados no Planejamento + Análise por Tipo de Despesa

## 1. Vantari como empresa padrão em todas as telas

### Alterações
- Adicionar `defaultCompanyId` ao `AppPreferencesContext` com valor padrão = ID da Vantari (`3d37326f-bedc-4a16-b81f-0213c826d423`)
- Alterar todos os 7 componentes de relatório que inicializam `companyId` com `"all"` para usar o ID da Vantari como padrão
- Alterar o `CompanyFilter` para mostrar "Vantari (Sede)" como label quando selecionada

**Arquivos a editar:**
- `src/contexts/AppPreferencesContext.tsx` — novo campo `defaultCompanyId`
- `src/components/finance/reports/ReceivablesReport.tsx`
- `src/components/finance/reports/PayablesReport.tsx`
- `src/components/finance/reports/PaidReport.tsx`
- `src/components/finance/reports/MonthlyFlowChart.tsx`
- `src/components/finance/reports/ExecutiveSummary.tsx`
- `src/components/finance/reports/CostCenterDashboard.tsx`
- `src/components/finance/reports/TopSuppliersChart.tsx`

### Migration
Atualizar tipo da Vantari para `matriz`:
```sql
UPDATE group_companies SET type = 'matriz' WHERE id = '3d37326f-bedc-4a16-b81f-0213c826d423';
```

## 2. Planejamento: sincronizar despesas e receitas (aportes) com dados existentes

### Dados disponíveis
- **Despesas (payables):** 390 registros importados da Vantari, março/2026 a junho/2028
- **Receitas/Aportes (bank_transactions):** TEDs e PIXs recebidos na conta Vantari:
  - Fev/2026: R$ 272.286
  - Mar/2026: R$ 224.226

### Lógica de sincronização
Criar um botão "Sincronizar com Sistema" na página de Planejamento que:
1. Busca total de `payables` por mês (filtrando `company_id` = Vantari)
2. Busca total de créditos bancários por mês (excluindo "SALDO" e "RENDIMENTOS")
3. Faz upsert no `monthly_planning`:
   - `expense` = total de payables já pagos (status = 'paid') do mês
   - `planned_expense` = total de payables em aberto (status = 'open') do mês
   - `revenue` = total de créditos bancários (aportes/TEDs/PIXs) do mês (meses passados)

### Implementação
- Criar hook `usePlanningSync.ts` que agrega dados de `payables` e `bank_transactions` por mês
- Adicionar botão de sincronização na página `Planejamento.tsx`
- Usar `upsertPlanningBatch` existente para gravar os dados

**Arquivos a criar/editar:**
- `src/hooks/usePlanningSync.ts` — novo hook
- `src/pages/financeiro/Planejamento.tsx` — botão de sync

## 3. Análise Financeira: breakdown por tipo de despesa

### Alteração
Modificar o `expenseComposition` no `useFinancialAnalysis.ts` para buscar dados de `payables` agrupados por `notes` (tipo de despesa) em vez da composição genérica atual (Operacionais/Taxa Hubla/Impostos/Distribuição).

### Implementação
- Criar query em `useFinancialAnalysis` que busca `payables` agrupados por `notes` para o ano selecionado, filtrando por Vantari
- Gerar array de composição com cores distintas para cada categoria (PRÓ LABORE, MARKETING, CAIXINHA, etc.)
- Manter o pie chart existente (`ExpenseBreakdownPie`) que já aceita dados genéricos

**Arquivos a editar:**
- `src/hooks/useFinancialAnalysis.ts` — nova lógica de composição
- `src/pages/financeiro/AnaliseFinanceira.tsx` — passar dados da query

### Resumo de arquivos

| Arquivo | Ação |
|---------|------|
| `src/contexts/AppPreferencesContext.tsx` | Adicionar `defaultCompanyId` |
| 7 componentes de relatório | Default company = Vantari |
| `src/hooks/usePlanningSync.ts` | Novo hook de sincronização |
| `src/pages/financeiro/Planejamento.tsx` | Botão sync |
| `src/hooks/useFinancialAnalysis.ts` | Expense breakdown por tipo |
| `src/pages/financeiro/AnaliseFinanceira.tsx` | Integrar nova composição |
| Migration SQL | Vantari type → `matriz` |

