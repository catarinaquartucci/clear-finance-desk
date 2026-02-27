

# Corrigir Erro de Importacao de Extrato

## Problema

A importacao falha com erro `"there is no unique or exclusion constraint matching the ON CONFLICT specification"` porque a coluna `import_hash` na tabela `bank_transactions` nao tem uma constraint UNIQUE aplicada corretamente no banco.

## Solucao

Duas acoes paralelas:

### 1. Recriar a constraint UNIQUE no banco
Criar nova migration SQL com:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS bank_transactions_import_hash_unique 
ON public.bank_transactions (import_hash) 
WHERE import_hash IS NOT NULL;
```

### 2. Tornar o codigo mais resiliente (fallback)
Alterar `useBankTransactions.ts` para que, caso o `upsert` falhe, use insert simples ignorando erros de duplicata individualmente. Isso garante que funcione mesmo sem a constraint.

**Abordagem no codigo:**
- Primeiro tenta `upsert` com `onConflict: "import_hash"`
- Se falhar com erro `42P10` (no unique constraint), faz insert em lote sem `onConflict`, tratando erros de duplicata individualmente

### Arquivo afetado
- `src/hooks/useBankTransactions.ts` — mutation `importTransactions`
- Nova migration SQL para a constraint

