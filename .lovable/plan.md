

# Seletor Global de Filial — Plano de Implementação

## Resumo

Criar um seletor de empresa no header (canto superior direito) que funciona como filtro global. Ao selecionar uma filial, **todas** as telas financeiras mostram apenas dados daquela empresa. Isso substitui os filtros locais `companyFilter` espalhados em cada componente.

## Arquitetura

```text
AppPreferencesContext
  └── selectedCompanyId: string  ("all" | uuid da empresa)
  └── setSelectedCompanyId(id)

AppLayout header
  └── CompanySwitcher (canto superior direito, antes do user info)

Hooks financeiros
  └── Leem selectedCompanyId do contexto ao invés de receber prop ou usar VANTARI_ID hardcoded
```

## Mudanças

### 1. Adicionar `selectedCompanyId` ao AppPreferencesContext

**Arquivo:** `src/contexts/AppPreferencesContext.tsx`
- Adicionar campo `selectedCompanyId: string` (default: `"all"`) ao state
- Adicionar setter `setSelectedCompanyId`
- Persistido no localStorage como os demais

### 2. Criar CompanySwitcher no Header

**Arquivo:** `src/components/Layout/AppLayout.tsx`
- Inserir um seletor de empresa (dropdown com ícone `Building2`) entre o `SidebarTrigger` e o user info
- Usa `useGroupCompanies()` para listar empresas ativas
- Opção "Todas as filiais" + cada empresa cadastrada
- Mostra nome curto da empresa selecionada

### 3. Remover filtros locais de empresa de 8 componentes

Cada um desses arquivos tem `useState("all")` para `companyFilter` local + um `<CompanyFilter>` na UI. Substituir por leitura do contexto global:

- `ReconciliationPanel.tsx` — remover state + CompanyFilter local
- `PayablesList.tsx` — idem
- `ReceivablesList.tsx` — idem
- `BankAccountsList.tsx` — idem
- `SuppliersList.tsx` — idem
- `CustomersList.tsx` — idem
- `CostCentersList.tsx` — idem
- `FluxoCaixa.tsx` — idem

Em cada arquivo: `const { selectedCompanyId } = useAppPreferences()` substitui o state local.

### 4. Substituir VANTARI_ID hardcoded

3 hooks usam `VANTARI_ID` hardcoded para filtrar dados:

- `useFinanceDashboard.ts` — receber `companyId` como parâmetro, filtrar por ele (quando não for "all", aplicar `.eq("company_id", id)`)
- `useFinancialAnalysis.ts` — idem
- `usePlanningSync.ts` — idem

Os componentes que chamam esses hooks passarão `selectedCompanyId` do contexto.

### 5. Relatórios

**Arquivo:** `src/components/finance/reports/ReportFilters.tsx`
- Inicializar o filtro de empresa dos relatórios com o valor do contexto global (ao invés de "all")
- Manter a possibilidade de override local para relatórios específicos

## O que NÃO muda

- Estrutura do banco de dados (nenhuma migration)
- RLS policies (já filtram por `company_id`)
- Módulo admin (colaboradores, equipamentos) — não tem `company_id`

## Resultado

O usuário seleciona a filial uma vez no canto superior direito e todas as telas financeiras refletem automaticamente essa seleção, sem precisar trocar filtro em cada página.

