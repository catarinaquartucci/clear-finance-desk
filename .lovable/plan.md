

# Modulo de Configuracoes do Sistema

## Objetivo

Criar uma nova area "Configuracoes" acessivel apenas por administradores, centralizada como um novo modulo (similar ao Admin e Financeiro), com abas para gerenciar diferentes aspectos do sistema.

## Estrutura

O modulo tera uma pagina principal com abas (tabs), acessivel via navegacao principal:

### Abas planejadas

1. **Regras e Metricas** - Editor para as instrucoes/politicas financeiras (atualmente hardcoded em `Regras.tsx`). Permite editar textos das regras diretamente pelo sistema, salvando no banco de dados (`system_settings` table).

2. **Usuarios do Sistema** - Listar todos os usuarios registrados (da tabela `colaboradores` com `user_id` vinculado), permitindo gerenciar roles (admin, finance, finance_viewer, admin_viewer) sem precisar editar cada colaborador individualmente.

3. **Empresas do Grupo** - Cadastro de empresas do grupo economico (nova tabela `group_companies`) com campos: nome, CNPJ, razao social, tipo (matriz/filial), ativa.

4. **Metas Gerais** - Configuracao de metas e KPIs do sistema (diferentes das metas de vendas financeiras), como metas operacionais, indicadores de desempenho, etc.

5. **Preferencias** - Configuracoes gerais como nome da empresa, logo, timezone, moeda padrao.

## Detalhes Tecnicos

### Banco de dados (migrations)

**Tabela `system_settings`** - Para armazenar configuracoes dinamicas (regras, textos, preferencias):
```text
id (uuid, PK)
key (text, UNIQUE)
value (jsonb)
category (text) -- 'rules', 'preferences', 'metrics'
updated_at (timestamptz)
updated_by (uuid)
```

**Tabela `group_companies`** - Para empresas do grupo:
```text
id (uuid, PK)
name (text)
legal_name (text)
document (text) -- CNPJ
type (text) -- 'matriz', 'filial'
active (boolean, default true)
created_at, updated_at (timestamptz)
```

RLS: Apenas admin pode inserir/atualizar/excluir. Admin + admin_viewer podem visualizar.

### Arquivos novos

- `src/pages/admin/AdminConfiguracoes.tsx` - Pagina principal com Tabs
- `src/components/admin/configuracoes/RegrasEditor.tsx` - Editor de regras/metricas
- `src/components/admin/configuracoes/UsuariosSistema.tsx` - Gestao de usuarios e roles
- `src/components/admin/configuracoes/EmpresasGrupo.tsx` - CRUD de empresas do grupo
- `src/components/admin/configuracoes/MetasGerais.tsx` - Configuracao de metas
- `src/components/admin/configuracoes/PreferenciasGerais.tsx` - Preferencias do sistema
- `src/hooks/useSystemSettings.ts` - Hook para system_settings
- `src/hooks/useGroupCompanies.ts` - Hook para group_companies

### Arquivos modificados

- `src/App.tsx` - Adicionar rota `/admin/configuracoes`
- `src/components/admin/layout/AdminNavigation.tsx` - Adicionar item "Configuracoes" com icone `Settings`
- `src/pages/Regras.tsx` - Carregar textos do banco (system_settings) ao inves de hardcoded, com fallback para os textos atuais

### Fluxo de uso

1. Admin acessa Admin > Configuracoes
2. Na aba "Regras e Metricas", edita os textos das politicas financeiras que aparecem na pagina inicial
3. Na aba "Usuarios", ve todos os usuarios do sistema e pode alterar suas permissoes rapidamente via toggles
4. Na aba "Empresas do Grupo", cadastra as empresas (CNPJ, razao social, etc.)
5. Na aba "Metas Gerais", define indicadores e metas operacionais
6. Na aba "Preferencias", configura dados basicos da organizacao

