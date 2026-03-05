
Objetivo: destravar seu acesso imediatamente no publicado e no preview do editor, tratando o problema como dois bloqueios separados (OAuth do app + acesso via token do preview).

Diagnóstico consolidado (com base no que verifiquei):
1) Seu usuário `raquel@vantari.com.br` existe e já está com `admin` + `finance` na base de teste.
2) O colaborador dessa conta já está vinculado (`user_id` preenchido).
3) O erro atual acontece no clique do Google (“Erro ao entrar com Google”), ou seja, falha antes de chegar na etapa de permissão no app.
4) No preview do editor existe um token de acesso na URL (`__lovable_token`) e hoje o redirect do Google não preserva esse contexto.
5) Existem funções de automação de perfil/role, mas não há trigger em `auth.users` para executá-las automaticamente.

Do I know what the issue is?
- Sim, com alta confiança: há uma combinação de (a) fluxo OAuth frágil entre preview/publicado e (b) sincronização de acesso incompleta no backend para novos/logins reprocessados.

Plano de correção (implementação):
1) Fortalecer o login Google no frontend (falha visível + redirect robusto)
- Arquivo: `src/pages/Auth.tsx`
- Ajustar `redirect_uri` para retornar sempre em `/auth` e, no preview, preservar parâmetros necessários.
- Exibir erro técnico real no toast (mensagem/código) para não ficar “erro genérico”.
- Adicionar fallback controlado para reabrir fluxo quando houver erro transitório de OAuth.

2) Tornar o vínculo e sincronização idempotentes no login
- Arquivo: `src/contexts/AuthContext.tsx`
- No `onAuthStateChange` e no bootstrap (`getSession`), executar:
  - tentativa de vínculo por e-mail (`vincular_user_colaborador`);
  - refresh de roles em sequência, com retry curto.
- Evitar estado “travado em loading” quando der erro parcial.

3) Corrigir automações de backend faltantes para novos logins
- Migração SQL:
  - criar trigger em `auth.users` para `handle_new_user_profile`;
  - criar trigger em `auth.users` para `handle_admin_user`;
- Resultado: novos acessos deixam de depender de execução manual para perfil/admin seed.

4) Garantir consistência entre ambientes (teste x live)
- Aplicar configuração de autenticação no ambiente correto antes de validar (provedor e fluxo OAuth).
- Publicar frontend após os ajustes (pois mudanças de UI/cliente só entram no live após update).

5) Validação de desbloqueio (critério de aceite)
- Publicado (aba externa): login com `raquel@vantari.com.br` entra sem toast de erro e redireciona para `/admin`.
- Preview do editor: acesso não fica preso em tela de login externa; rota `/auth` do app abre e autentica.
- Pós-login: `useAuth` mostra `isAdmin=true`, `canEditAdmin=true`.

Detalhes técnicos (resumo objetivo):
- Frontend:
  - `Auth.tsx`: redirect/callback resiliente + erro detalhado.
  - `AuthContext.tsx`: vínculo/roles com retry e sem deadlock.
- Backend:
  - adicionar triggers em `auth.users` para funções já existentes.
- Segurança:
  - sem bypass client-side de admin;
  - permissões continuam server-side via `user_roles` + RLS.

Ordem de execução recomendada:
1) Migração de triggers.
2) Ajustes em `Auth.tsx`.
3) Ajustes em `AuthContext.tsx`.
4) Publicar atualização.
5) Teste E2E no publicado e no preview.
