

# Filial padrão "Vantari" + opção "Ambas" para Fornecedores e Clientes

## Situação Atual
- Fornecedores e clientes já possuem campo `company_id` (filial) no banco e na UI
- Existem 2 filiais: **Vantari** (`3d37326f-...`) e **Eudora Games** (`b398335c-...`)
- `company_id = null` atualmente significa "Nenhuma" filial selecionada
- Ao criar novo registro, o padrão é `null` (nenhuma filial)

## Plano

### 1. Sem alteração de banco de dados
Reutilizar `company_id = null` com semântica de **"Ambas as filiais"** (atende todas). Não precisa de migration.

### 2. Alterar CompanyFilter (form mode)
- Trocar label "Nenhuma" por **"Ambas as filiais"**
- Manter o valor `none` internamente (que mapeia para `null` no banco)

### 3. Alterar default nos formulários
- `SuppliersList`: `emptyForm.company_id` = ID da Vantari (`3d37326f-bedc-4a16-b81f-0213c826d423`)
- `CustomersList`: `emptyForm.company_id` = ID da Vantari

### 4. Alterar hooks de query (useSuppliers, useCustomers)
- Quando filtrar por uma filial específica, incluir também registros com `company_id IS NULL` (pois atendem ambas)
- Filtro: `q.or('company_id.eq.{id},company_id.is.null')`

### 5. Alterar label na tabela
- Quando `company_id = null`, exibir **"Ambas"** em vez de "—"

### Arquivos a editar
- `src/components/finance/CompanyFilter.tsx` — label "Ambas as filiais"
- `src/components/finance/cadastros/SuppliersList.tsx` — default Vantari + label "Ambas"
- `src/components/finance/cadastros/CustomersList.tsx` — default Vantari + label "Ambas"
- `src/hooks/useSuppliers.ts` — filtro OR com null
- `src/hooks/useCustomers.ts` — filtro OR com null

