# Despesas Recorrentes - Gerador Automatico de Contas a Pagar

## O que sera criado

Uma funcionalidade de "Despesas Recorrentes" que permite cadastrar uma despesa uma unica vez e gerar automaticamente as contas a pagar para os proximos meses desejados.

Permitir edição de contas já cadastradas para que tenham essa mesma opção

---

## Como vai funcionar

1. Na tela de **Contas a Pagar**, um novo botao "Despesa Recorrente" abre um formulario especial
2. O usuario preenche os dados da despesa (descricao, valor, fornecedor, centro de custo, etc.)
3. Define a **recorrencia**: mensal, e por quantos meses (ex: 12 meses)
4. Define o **dia do vencimento** (ex: dia 10 de cada mes)
5. Ao salvar, o sistema gera todas as contas a pagar de uma vez, com as datas de vencimento corretas

Isso elimina a necessidade de cadastrar um por um.

---

## Mudancas Tecnicas

### 1. Nova tabela `recurring_expenses`

Armazena o modelo da despesa recorrente para referencia futura.

```text
Campos:
- id, description, amount, supplier_id, cost_center_id, bank_account_id
- company_id, payment_method, chart_account_id
- frequency (mensal)
- day_of_month (dia do vencimento)
- start_date, end_date (periodo de vigencia)
- active (pode pausar/reativar)
- created_at, updated_at
```

RLS: Acesso para admin e finance (mesmo padrao de payables).

### 2. Componente `RecurringExpenseForm.tsx`

Novo dialog com os mesmos campos do `PayableForm` + campos extras:

- Dia do vencimento (1-28)
- Quantidade de meses OU data final
- Preview mostrando as datas que serao geradas

### 3. Logica de geracao em lote

Ao salvar, o sistema:

- Cria o registro na tabela `recurring_expenses` (modelo)
- Gera N registros na tabela `payables` existente, um para cada mes, com `recurring_expense_id` como referencia

### 4. Coluna extra na tabela `payables`

Adicionar `recurring_expense_id` (uuid, nullable) para rastrear quais contas vieram de uma recorrencia.

### 5. Alteracoes na interface

`**PayablesList.tsx`:**

- Novo botao "Despesa Recorrente" ao lado de "Nova Conta"
- Badge "Recorrente" nas contas geradas por recorrencia

**Novo componente `RecurringExpenseForm.tsx`:**

- Formulario com campos da despesa + configuracao de recorrencia
- Preview das datas antes de confirmar
- Botao "Gerar X contas"

### 6. Arquivos envolvidos

- **Novo**: `src/components/finance/payables/RecurringExpenseForm.tsx`
- **Modificado**: `src/components/finance/payables/PayablesList.tsx` (botao + badge)
- **Modificado**: `src/hooks/usePayables.ts` (funcao para criar em lote)
- **Migracao**: Criar tabela `recurring_expenses` + coluna `recurring_expense_id` em `payables`