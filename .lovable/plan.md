

## Diagnóstico Completo

Identifiquei **dois problemas simultâneos** causando o bloqueio total:

### Problema 1: Email provider continua desabilitado
Os logs do backend confirmam que o provedor de email está **desabilitado novamente** (erro `email_provider_disabled`). Já reativei duas vezes, mas algo está revertendo a configuração (possivelmente um deploy/restart do serviço). Preciso reativar mais uma vez.

### Problema 2: URL publicada desatualizada
A mudança para login somente via Google foi feita no código de desenvolvimento, mas a **URL publicada** (`clear-finance-desk.lovable.app`) ainda tem a versão antiga com formulário de email/senha. Precisa ser republicada após as correções.

### Problema 3: Google OAuth no iframe
O Google bloqueia autenticação dentro de iframes por segurança (`ERR_BLOCKED_BY_RESPONSE`). No preview do Lovable, o login Google **nunca funcionará**. Funciona apenas na URL publicada ou no preview aberto em aba separada.

### Correções

**1. Reativar email provider no backend**
- Usar `configure-auth` para reabilitar o provedor de email. Mesmo usando apenas Google na UI, o provedor de email precisa estar ativo para que o sistema de autenticação processe tokens corretamente após o OAuth.

**2. Garantir vinculação automática do colaborador após Google login**
- Atualmente, quando um usuário faz login via Google, o trigger `handle_new_user_profile` cria o perfil, e o trigger `handle_admin_user` adiciona role de admin para emails específicos.
- Mas a **vinculação com a tabela `colaboradores`** (`vincular_user_colaborador`) não acontece automaticamente. Preciso adicionar lógica no `Auth.tsx` para chamar `vincular_user_colaborador` após o primeiro login Google, garantindo que o colaborador seja reconhecido e receba as permissões corretas (admin, finance, etc.).

**3. Republicar o site**
- Após as correções, o site precisa ser republicado para que a URL `clear-finance-desk.lovable.app` reflita o login Google-only.

### Arquivos a Modificar
- **Backend**: Reativar email provider via `configure-auth`
- `src/pages/Auth.tsx`: Adicionar lógica de vinculação automática pós-login Google (chamar `vincular_user_colaborador` quando detectar primeiro acesso)
- `src/contexts/AuthContext.tsx`: Adicionar tentativa de vinculação automática após `onAuthStateChange` com evento `SIGNED_IN`

### Fluxo Pós-Correção
1. Usuário acessa `clear-finance-desk.lovable.app`
2. Vê botão "Entrar com Google"
3. Faz login com conta Google
4. Sistema cria perfil automaticamente (trigger `handle_new_user_profile`)
5. Sistema vincula ao colaborador existente (chamada a `vincular_user_colaborador`)
6. Roles são sincronizadas automaticamente (triggers `sync_admin_role_on_link`, `sync_finance_role_on_link`, etc.)
7. Usuário é redirecionado para `/admin` ou `/solicitacoes` conforme suas permissões

