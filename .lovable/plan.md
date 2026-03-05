

## Plan: Google Login na Solicitações + Restrição de Domínio @vantari.com.br

### Problema
Atualmente, o login via Google está disponível apenas na página `/auth`. O usuário quer que colaboradores do domínio `@vantari.com.br` possam fazer login via Google diretamente na página de Solicitações (ou ser redirecionados para lá após login).

### Mudanças

**1. Restringir Google OAuth ao domínio @vantari.com.br**
- No `Auth.tsx`, adicionar o parâmetro `hd: "vantari.com.br"` ao `lovable.auth.signInWithOAuth("google")` para que apenas contas do Google Workspace desse domínio possam fazer login.

**2. Redirecionar login Google para /solicitacoes**
- No `Auth.tsx`, alterar o `redirect_uri` do Google OAuth para `window.location.origin + "/solicitacoes"` (ou manter `window.location.origin` e ajustar o redirect pós-login no `useEffect`).
- Ajustar o `useEffect` de redirect no `Auth.tsx`: quando o usuário NÃO for admin, redirecionar para `/solicitacoes` (já faz isso, mas garantir que funcione após Google OAuth).

**3. Adicionar botão Google Login na página Solicitações (quando não logado)**
- A página Solicitações é protegida pelo `ProtectedRoute`, que redireciona para `/auth` se não logado. Portanto, não é necessário adicionar botão na própria página -- o fluxo natural já redireciona para `/auth`.
- Alternativa: Se o objetivo é ter um botão Google na própria tela de Solicitações, modificar o `ProtectedRoute` para mostrar um card de login inline com botão Google ao invés de redirecionar.

### Arquivos Modificados
- `src/pages/Auth.tsx` -- Adicionar `hd: "vantari.com.br"` e `prompt: "select_account"` ao Google OAuth
- `src/components/Auth/ProtectedRoute.tsx` -- (Opcional) Mostrar tela de login com Google inline para rotas de colaborador

### Detalhes Técnicos
```typescript
// Auth.tsx - Google OAuth com restrição de domínio
await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin,
  extraParams: {
    hd: "vantari.com.br",
    prompt: "select_account",
  },
});
```

O parâmetro `hd` restringe a seleção de conta Google ao domínio especificado. O `prompt: "select_account"` garante que o usuário sempre possa escolher qual conta usar.

