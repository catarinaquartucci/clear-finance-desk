

# Correções na Conciliação Bancária

## Problema 1: Conciliação parcial
Atualmente, ao vincular uma transação bancária de R$500 a uma conta de R$2.000, o sistema marca toda a conta como conciliada. O correto é abater apenas o valor da transação e manter o saldo restante (R$1.500) pendente para conciliação futura.

**Solução:**
- No `ConciliateDialog`, ao vincular, mostrar o valor da transação vs. o valor da conta e permitir confirmar o valor conciliado
- No `useBankTransactions.conciliate`, ao confirmar:
  - Marcar a transação bancária como conciliada (como hoje)
  - Se o valor da transação < valor da conta a pagar: atualizar o `amount` da conta para o saldo restante (amount - valor transação), mantendo status "open"
  - Se o valor da transação >= valor da conta: marcar a conta como "paid" (comportamento atual)
- Adicionar lógica no hook `conciliate` para receber o `conciliatedAmount` e decidir se é baixa total ou parcial

## Problema 2: Saldo e rendimentos aparecendo como pendentes
Transações de crédito como "SALDO ANTERIOR", "RENDIMENTOS" não têm conta a pagar correspondente e poluem a lista de pendentes.

**Solução:**
- Filtrar a lista de transações na `ReconciliationPanel` para mostrar **apenas débitos** por padrão (já que "só conciliamos as saídas com as contas previstas a pagar")
- Adicionar um filtro de tipo (Débitos / Créditos / Todos) na toolbar para quem quiser ver tudo
- No `ConciliateDialog`, remover a aba de receivables e mostrar apenas payables
- Na conciliação automática (`findMatches`), processar apenas transações de débito
- Marcar automaticamente transações de crédito com descrição contendo "SALDO" ou "RENDIMENTO" como conciliadas (não conciliáveis) na importação, ou adicionar botão "Ignorar" para marcar como não aplicável

## Arquivos a editar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/finance/reconciliation/ConciliateDialog.tsx` | Mostrar apenas payables, adicionar lógica de valor parcial com confirmação |
| `src/components/finance/reconciliation/ReconciliationPanel.tsx` | Filtro de tipo (débito/crédito), padrão "débitos", botão "Ignorar" para créditos |
| `src/hooks/useBankTransactions.ts` | Receber `conciliatedAmount` no `conciliate`, implementar lógica de baixa parcial no payable |
| `src/lib/autoConciliation.ts` | Filtrar apenas débitos no `findMatches` |

