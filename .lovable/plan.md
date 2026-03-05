

## Diagnóstico e Correções

Dois problemas identificados:

1. **Email provider desabilitado (novamente)** -- O backend voltou a desabilitar o provedor de email. Preciso reativá-lo pois o sistema depende dele internamente (criação de contas, triggers, etc.), mesmo que a UI mostre apenas Google.

2. **Google OAuth bloqueado no iframe** -- O erro `ERR_BLOCKED_BY_RESPONSE` na screenshot é esperado: o Google bloqueia login dentro de iframes por segurança. Isso funciona normalmente quando acessado pela URL publicada (`clear-finance-desk.lovable.app`) ou no preview aberto em nova aba.

### Mudanças

**1. Reativar email provider no backend**
- Usar `configure-auth` para reabilitar o provedor de email.

**2. Simplificar Auth.tsx para login somente via Google**
- Remover formulário de email/senha e cadastro
- Manter apenas o botão "Entrar com Google"
- Remover restrição `hd: "vantari.com.br"` (permitir externos)
- Manter `prompt: "select_account"`
- Remover fluxo de primeiro acesso, esqueci senha, e cadastro manual

**3. Manter fluxo de primeiro acesso via backend**
- O `setup_primeiro_admin` e `vincular_user_colaborador` continuam funcionando -- quando o usuário faz login via Google, o `handle_new_user_profile` trigger cria o perfil automaticamente.

### Arquivos modificados
- `src/pages/Auth.tsx` -- Simplificar para Google-only login
- Backend config -- Reativar email provider

