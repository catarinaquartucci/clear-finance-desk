

# Sincronizar Dados Bancarios com Saldo de Caixa

## Contexto Atual

- **Contas bancarias** (`bank_accounts`): tem campo `current_balance` mas nunca e atualizado apos importacao de extratos
- **Transacoes bancarias** (`bank_transactions`): importadas via OFC/OFX, cada transacao tem campo `balance` (saldo apos a transacao) e `amount`
- **Planejamento** (`monthly_planning`): tem `initial_balance` por mes, preenchido manualmente
- **Saldo Livre / Retido** (`financial_config`): editados manualmente nos cards da pagina de Planejamento

Nao existe nenhuma conexao entre os dados reais importados do banco e os saldos exibidos no planejamento.

## Solucao Proposta

### 1. Atualizar saldo da conta bancaria apos importacao

**Arquivo**: `src/hooks/useBankTransactions.ts`

Apos importacao bem-sucedida de transacoes, calcular o saldo mais recente (ultimo `balance` ou somatorio de transacoes) e atualizar `bank_accounts.current_balance`.

### 2. Botao "Sincronizar com Banco" na pagina de Planejamento

**Arquivos**: `src/pages/financeiro/Planejamento.tsx`, `src/hooks/useFinancialConfig.ts`

Adicionar um botao que:
- Busca todas as contas bancarias ativas e soma seus `current_balance`
- Atualiza o "Saldo Livre" com esse valor (ou oferece opcao de qual campo atualizar)
- Mostra toast de confirmacao

### 3. Sincronizar Saldo Caixa mensal com dados bancarios

**Arquivo**: `src/components/finance/planning/PlanningTable.tsx`

Para meses passados, permitir preencher automaticamente o "Saldo Caixa" (initial_balance) com o saldo bancario real do ultimo dia do mes anterior, calculado a partir das transacoes importadas.

## Detalhes Tecnicos

### Hook `useBankTransactions.ts`
- No `onSuccess` do `importTransactions`, adicionar chamada para atualizar `bank_accounts.current_balance`
- Usar o `balance` da transacao mais recente (por data) ou calcular: `initial_balance + sum(credits) - sum(debits)`

### Hook `useFinancialConfig.ts`
- Adicionar funcao `syncFromBankAccounts()` que:
  1. Faz `SELECT SUM(current_balance) FROM bank_accounts WHERE active = true`
  2. Chama `updateSaldoLivre` com o resultado

### Pagina `Planejamento.tsx`
- Adicionar botao com icone `RefreshCw` ao lado dos cards de saldo
- Ao clicar, executa `syncFromBankAccounts()`
- Exibir o saldo bancario real como referencia abaixo do "Saldo Livre"

### Sincronizacao mensal (PlanningTable)
- Adicionar funcao que busca transacoes bancarias agrupadas por mes
- Para cada mes com dados bancarios, calcula o saldo final do mes (ultimo `balance` da transacao mais recente)
- Botao opcional "Preencher saldos reais" que popula `initial_balance` de cada mes

### Nenhuma migracao de banco necessaria
Todos os campos ja existem (`bank_accounts.current_balance`, `monthly_planning.initial_balance`, `financial_config.saldo_livre`). A solucao usa apenas logica de leitura e atualizacao dos dados existentes.

