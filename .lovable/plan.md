

# Restaurar Dados dos Colaboradores via CSV

## Contexto

O CSV exportado contém 10 colaboradores com IDs existentes no banco. A funcao de importacao atual apenas **insere novos** registros e pula emails ja cadastrados. Para restaurar, precisamos **atualizar** registros existentes pelo `id`.

## Plano

### 1. Criar edge function `restore-colaboradores`

Nova edge function que recebe uma lista de colaboradores com `id` e faz **upsert** (update se existe, insert se nao):

- Recebe array de objetos com todos os campos do CSV
- Para cada registro, faz `UPDATE` na tabela `colaboradores` usando `WHERE id = ...`
- Usa service role key para bypassar RLS
- Retorna contagem de sucesso/falha

### 2. Adicionar botao "Restaurar" no ImportColaboradoresDialog

Atualizar `ImportColaboradoresDialog.tsx` para:
- Detectar se o CSV contém coluna `id` (indicando restauracao)
- Quando tem `id`, mapear os campos incluindo o id
- Chamar a nova edge function `restore-colaboradores` em vez de `import-colaboradores`

### 3. Atualizar hook useColaboradores

Adicionar mutation `restoreColaboradores` que chama a nova edge function.

### 4. Atualizar ColaboradoresList

Passar a nova funcao de restore para o dialog de importacao.

### Campos mapeados do CSV

O CSV usa `;` como separador. A biblioteca xlsx ja suporta isso nativamente. Campos: `id`, `user_id`, `nome`, `cnpj`, `cpf`, `endereco`, `chave_pix_cnpj`, `email`, `data_inicio_contrato`, `data_fim_contrato`, `area`, `remuneracao`, `funcao`, `is_admin`, `ativo`, `variavel`, `regra_ote`, `data_nascimento`, `has_finance_access`, `has_finance_view_access`, `has_admin_view_access`.

### Sequencia

1. Criar `supabase/functions/restore-colaboradores/index.ts`
2. Atualizar `ImportColaboradoresDialog.tsx` - adicionar mapeamento de `id` e campos extras (`has_finance_access`, etc.)
3. Atualizar `useColaboradores.tsx` - adicionar mutation `restoreColaboradores`
4. Atualizar `ColaboradoresList.tsx` - passar restore function ao dialog

