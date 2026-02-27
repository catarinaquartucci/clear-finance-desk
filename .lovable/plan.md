# Mascara CNPJ + Filtro por Filial em Todo o Financeiro

## Resumo

Tres frentes de trabalho:

1. Mascara automatica de CNPJ em formularios
2. Remover sincronizacao Marvee do Fluxo de Caixa e adicionar filtro por filial
3. Remover sincronização Marvee em todo o sistema
4. Adicionar campo `company_id` e filtro por filial em todos os modulos financeiros

---

## 1. Mascara CNPJ

Criar um utilitario `formatCNPJ(value)` que aplica a mascara `00.000.000/0000-00` conforme o usuario digita. Sera usado em:

- **EmpresasGrupo** (campo CNPJ do cadastro de empresas)
- **SuppliersList** (campo CNPJ/CPF do fornecedor)
- **CustomersList** (campo CNPJ/CPF do cliente)

Arquivo novo: `src/lib/masks.ts` com funcoes `formatCNPJ` e `formatCPFCNPJ` (detecta automaticamente pelo tamanho).

---

## 2. Fluxo de Caixa - Remover Marvee + Filtro por Filial

**Arquivo**: `src/pages/financeiro/FluxoCaixa.tsx`

- Remover o componente `MarveeSyncButton` e `MarveeMappingDialog` do header
- Adicionar um `Select` de filial no area de filtros, usando dados de `useGroupCompanies`
- Passar o `companyId` selecionado para os hooks de dados

---

## 3. Campo `company_id` em Tabelas Financeiras (Migration)

Adicionar coluna `company_id UUID REFERENCES group_companies(id)` (nullable, para compatibilidade com dados existentes) nas seguintes tabelas:

- `suppliers`
- `customers`
- `cost_centers`
- `bank_accounts`
- `payables`
- `receivables`

Isso permite filtrar qualquer registro por empresa/filial.

---

## 4. Filtro por Filial nos Modulos

Para cada modulo, adicionar:

- **Select de filial** na barra de filtros (toolbar) - usando `useGroupCompanies`
- **Campo filial** nos formularios de cadastro/criacao
- **Coluna filial** na tabela de listagem

### Arquivos afetados (UI):


| Modulo           | Lista                     | Formulario           |
| ---------------- | ------------------------- | -------------------- |
| Fornecedores     | `SuppliersList.tsx`       | inline no dialog     |
| Clientes         | `CustomersList.tsx`       | inline no dialog     |
| Centros de Custo | `CostCentersList.tsx`     | inline no dialog     |
| Contas Bancarias | `BankAccountsList.tsx`    | inline no dialog     |
| Contas a Pagar   | `PayablesList.tsx`        | `PayableForm.tsx`    |
| Contas a Receber | `ReceivablesList.tsx`     | `ReceivableForm.tsx` |
| Conciliacao      | `ReconciliationPanel.tsx` | -                    |


### Arquivos afetados (Hooks):

Cada hook recebera um parametro opcional `companyId` e aplicara `.eq("company_id", companyId)` quando definido:

- `useSuppliers.ts`
- `useCustomers.ts`
- `useCostCenters.ts`
- `useBankAccounts.ts`
- `usePayables.ts`
- `useReceivables.ts`
- `useBankTransactions.ts`

---

## Detalhes Tecnicos

### Migration SQL

```sql
ALTER TABLE suppliers ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE customers ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE cost_centers ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE bank_accounts ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE payables ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE receivables ADD COLUMN company_id UUID REFERENCES group_companies(id);
```

### Mascara CNPJ (src/lib/masks.ts)

```typescript
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
```

### Filtro por filial (padrao reutilizavel)

Criar componente `CompanyFilter` que encapsula o Select com dados de `useGroupCompanies`, reutilizavel em todas as telas:

```typescript
// src/components/finance/CompanyFilter.tsx
<Select value={companyId} onValueChange={setCompanyId}>
  <SelectTrigger><SelectValue placeholder="Todas as filiais" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todas</SelectItem>
    {companies.map(c => (
      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Sequencia de implementacao

1. Migration para adicionar `company_id` nas tabelas
2. Criar `src/lib/masks.ts` (formatCNPJ)
3. Criar `src/components/finance/CompanyFilter.tsx`
4. Atualizar EmpresasGrupo com mascara CNPJ
5. Atualizar hooks (useSuppliers, useCustomers, etc.) para aceitar `companyId`
6. Atualizar listas e formularios (Fornecedores, Clientes, Centros de Custo, Contas Bancarias)
7. Atualizar PayableForm/PayablesList e ReceivableForm/ReceivablesList
8. Atualizar ReconciliationPanel com filtro de filial
9. Atualizar FluxoCaixa - remover Marvee, adicionar filtro filial