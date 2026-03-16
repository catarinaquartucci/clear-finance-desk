

# Melhorias em Contas a Pagar (e Receber)

## 1. Filtro por data de vencimento
Adicionar dois date inputs (De / Até) na toolbar do `PayablesList`. Filtro aplicado client-side sobre os dados já carregados.

## 2. Visualizar e editar descrição
- Adicionar opção "Editar" no dropdown de ações de cada linha
- Abrir o `PayableForm` em modo edição, preenchido com os dados existentes
- Reutilizar `updatePayable` do hook

## 3. Corrigir instabilidade no campo de valor
O campo de valor usa `type="number"` com `value={form.amount || ""}` — o `|| ""` causa conflito: quando o usuário digita e o valor vira `0` intermediário, o input perde o valor. Corrigir para usar um estado string controlado para o campo de valor (padrão monetário), convertendo para number apenas no submit. Aplicar a mesma correção no `ReceivableForm`.

## 4. Filtro de status "Vencido"
Adicionar `<SelectItem value="overdue">Vencidos</SelectItem>` no select de status. No hook, quando `statusFilter === "overdue"`, buscar `status = 'open'` e filtrar client-side por `due_date < today`.

## 5. Baixa em lote (múltiplos títulos)
- Adicionar checkbox em cada linha (apenas títulos abertos) + checkbox "selecionar todos" no header
- State `selectedIds: Set<string>`
- Botão "Dar Baixa em X títulos" que abre o `PayablePayDialog`
- No confirm, chamar `markAsPaid` para cada ID selecionado (loop sequencial com Promise)
- Adicionar `markAsPaidBatch` no hook que faz update em lote

## 6. Classificação financeira (Plano de Contas)
A tabela `payables` já tem `chart_account_id`. Adicionar:
- Select de classificação no `PayableForm` usando dados de `useChartOfAccounts`
- Coluna "Classificação" na tabela
- Incluir o join com `chart_of_accounts` na query do hook

## Arquivos a editar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/finance/payables/PayablesList.tsx` | Filtro de data, filtro vencido, checkboxes, botão baixa em lote, coluna classificação, botão editar |
| `src/components/finance/payables/PayableForm.tsx` | Modo edição, campo valor como string, select classificação |
| `src/hooks/usePayables.ts` | Join chart_of_accounts, markAsPaidBatch, filtro overdue |
| `src/components/finance/receivables/ReceivableForm.tsx` | Mesma correção do campo valor |

