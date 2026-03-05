
Objetivo: recuperar acesso imediato ao sistema (tela branca) e evitar novas quedas na carga inicial.

Diagnóstico confirmado
- Reproduzi o problema: página inicial abre em branco.
- No console, erro crítico: falha ao carregar `node_modules/.vite/deps/xlsx.js` (HTTP 504).
- Hoje o `xlsx` está importado de forma estática em módulos que entram no bundle inicial:
  - `src/components/Colaboradores/ImportColaboradoresDialog.tsx`
  - `src/pages/admin/AdminColaboradores.tsx`
  - `src/lib/exportUtils.ts`
  - `src/components/finance/cash-flow/CashFlowExportButton.tsx`
- Como `App.tsx` importa várias páginas diretamente, esse erro de dependência derruba a aplicação inteira antes de renderizar (por isso tela branca e “sem acesso”).

Plano de implementação
1) Remover `xlsx` da carga inicial (correção principal)
- Trocar imports estáticos por `import("xlsx")` sob demanda (somente quando usuário clicar em exportar/importar arquivo).
- Ajustar:
  - `AdminColaboradores.tsx` (export Excel)
  - `ImportColaboradoresDialog.tsx` (parse de planilha)
  - `exportUtils.ts` (`exportToExcel` dinâmico)
  - `CashFlowExportButton.tsx` (export Excel dinâmico)

2) Tratamento de erro amigável para ações com planilha
- Se falhar o carregamento dinâmico de `xlsx`, mostrar toast claro:
  - “Não foi possível carregar módulo de planilha. Tente novamente.”
- Assim a aplicação permanece funcional mesmo se o módulo de planilha falhar.

3) Reduzir chance de falha global futura
- Converter imports pesados de páginas em `React.lazy` + `Suspense` em `App.tsx` (especialmente módulo financeiro/admin).
- Benefício: uma dependência problemática em módulo secundário não bloqueia a home.

4) Proteção de UX para erros de renderização
- Envolver árvore principal com `ErrorBoundary` (já existe no projeto) para evitar tela totalmente branca sem mensagem.

Validação após correção
- Abrir `/` e `/auth`: deve renderizar normalmente (sem branco).
- Entrar em `/admin` e `/financeiro`: carregamento normal.
- Testar ações de planilha:
  - Importar colaboradores (xlsx/csv)
  - Exportar colaboradores
  - Exportar fluxo de caixa
  - Export de relatórios (Excel)
- Confirmar no console: sem erro fatal de bootstrap.

Impacto em backend
- Nenhuma alteração em banco, autenticação ou regras de acesso.
- Correção é 100% frontend (bundle/carregamento de dependência).
