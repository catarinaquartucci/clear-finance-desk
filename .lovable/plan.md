

# Remodelar Navegação — Menu Único com Todas as Funções Financeiras

## Situação Atual
- Navegação principal com tabs genéricas: Instruções, Solicitações, Notas Fiscais, Financeiro, Admin
- Sub-navegação financeira separada (FinanceNavigation) que só aparece dentro de `/financeiro/*`
- Dashboard (`Index.tsx`) usa `Navigation` genérica + hero com título estático
- São 14 itens financeiros escondidos atrás de um clique em "Financeiro"

## Proposta

Eliminar a navegação genérica (`Navigation.tsx`) e promover todos os itens financeiros para o menu principal. Usar uma **sidebar colapsável** (Shadcn Sidebar) em vez de tabs horizontais, pois 14+ itens não cabem bem em uma barra horizontal.

### Nova Estrutura de Navegação (Sidebar)

```text
┌─────────────────────┐
│ Logo  Central Fin.  │
├─────────────────────┤
│ 📊 Dashboard        │  ← /dashboard
│                     │
│ OPERACIONAL         │
│  Cadastros          │
│  Contas a Pagar     │
│  Contas a Receber   │
│  Conciliação        │
│  Boletos            │
│  NFS-e              │
│                     │
│ PLANEJAMENTO        │
│  Planejamento       │
│  Fluxo de Caixa     │
│  Impostos           │
│                     │
│ ANÁLISE             │
│  Análise Financeira │
│  Metas de Vendas    │
│  Bônus              │
│  Distribuição       │
│  Relatórios         │
│                     │
│ ADMIN               │  ← só para admins
│  Aprovações         │
│  Colaboradores      │
│  Equipamentos       │
│  Automações         │
│  Configurações      │
└─────────────────────┘
```

### Alterações

**1. Criar `src/components/Layout/AppSidebar.tsx`**
- Sidebar com `collapsible="icon"` usando Shadcn Sidebar
- Grupos: Dashboard, Operacional, Planejamento, Análise, Admin (condicional)
- Highlight da rota ativa
- Logo no topo da sidebar

**2. Criar `src/components/Layout/AppLayout.tsx`**
- Layout wrapper com `SidebarProvider` + `AppSidebar` + `SidebarTrigger` no header
- Substitui Header + Navigation + FinanceNavigation em um layout unificado
- Header simplificado (trigger, user info, logout) dentro do layout

**3. Reescrever `src/pages/Index.tsx`**
- Remover hero com gradient — substituir por saudação compacta (ex: "Painel Financeiro — março de 2026")
- Remover imports de Navigation/Header (vêm do layout)
- Manter KPIs, alertas e pie chart

**4. Atualizar `src/App.tsx`**
- Envolver todas as rotas protegidas com `AppLayout` (em vez de cada page importar Header/Navigation)
- Remover `FinanceLayout` e `AdminLayout` como wrappers de rota (sidebar já cobre tudo)
- Flatten das rotas financeiras: `/cadastros`, `/contas-pagar`, etc. (ou manter `/financeiro/*` — sem impacto visual)

**5. Atualizar `FinanceLayout.tsx`**
- Simplificar para apenas `<Outlet />` (sem Header, Navigation, FinanceNavigation)

**6. Atualizar `AdminLayout.tsx`**
- Simplificar para apenas `<Outlet />` (sem Header, Navigation, AdminNavigation)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/Layout/AppSidebar.tsx` | Criar — sidebar com todos os itens |
| `src/components/Layout/AppLayout.tsx` | Criar — layout com SidebarProvider |
| `src/pages/Index.tsx` | Editar — remover hero/Navigation, layout limpo |
| `src/App.tsx` | Editar — envolver rotas com AppLayout |
| `src/components/finance/layout/FinanceLayout.tsx` | Simplificar — só Outlet |
| `src/components/admin/layout/AdminLayout.tsx` | Simplificar — só Outlet |
| `src/components/Layout/Navigation.tsx` | Pode ser removido |
| `src/components/finance/layout/FinanceNavigation.tsx` | Pode ser removido |
| `src/components/admin/layout/AdminNavigation.tsx` | Pode ser removido |
| `src/components/Layout/Header.tsx` | Simplificar — mover para dentro do AppLayout |

