
Objetivo imediato: destravar seu acesso no ambiente Lovable (preview) sem depender de comportamento de popup instável.

Diagnóstico confirmado
- O backend está íntegro para sua conta (`raquel@vantari.com.br`): usuário existe, colaborador vinculado, roles `admin` + `finance`, triggers ativos.
- O erro atual acontece antes de criar sessão: `Sign in was cancelled` no `@lovable.dev/cloud-auth-js`.
- Isso indica fechamento do popup sem retorno do `web_message` (não é falha de permissão/role).
- O ponto mais frágil introduzido no frontend é o `redirect_uri` customizado com `"/auth?__lovable_token=..."`, que foge do padrão recomendado para Lovable Cloud.

Plano de correção (foco em desbloqueio urgente)
1) Corrigir fluxo OAuth para padrão estável
- Arquivo: `src/pages/Auth.tsx`
- Trocar `redirect_uri` para `window.location.origin` (sem `/auth` e sem `__lovable_token`).
- Manter `lovable.auth.signInWithOAuth("google", ...)` (sem implementação manual de OAuth).

2) Fallback específico para preview (anti-bloqueio)
- No erro `Sign in was cancelled` ou `Popup was blocked`, exibir ação explícita:
  - “Abrir login em nova aba”
- Essa ação abre o app em nova aba (mesma origem do preview) e dispara login por redirecionamento de página completa, evitando dependência do popup no iframe do editor.
- Após login na aba, ao voltar para o preview, a sessão deve estar disponível.

3) Melhorar telemetria de erro para diagnóstico rápido
- Em `Auth.tsx`, registrar `isIframe`, tipo do erro e fase do fluxo.
- Toast com mensagem orientativa (ex.: popup bloqueado/cancelado + botão de fallback), sem texto genérico.

4) Manter AuthContext como está (sem mudanças estruturais agora)
- `AuthContext` já está com listener correto e retry de roles.
- Como o bloqueio atual é pré-sessão, prioridade é estabilizar entrada OAuth, não roles.

5) Validação obrigatória pós-ajuste
- Preview `/auth`: clicar Google e confirmar que não trava mais no erro recorrente.
- Se popup falhar, validar fallback “nova aba” e retorno com sessão ativa no preview.
- Publicado (aba externa): login completo e redirecionamento para `/admin`.

Detalhes técnicos (resumo)
- Não há necessidade de nova migração de banco para este bloqueio específico.
- Ajuste principal é de client auth flow (`redirect_uri` + fallback de execução).
- Segurança preservada: sem bypass client-side de admin; autorização continua via roles no backend.

Critério de sucesso
- Você consegue autenticar no Lovable preview sem ficar presa na tela `/auth`.
- Acesso ao painel administrativo volta a funcionar com sua conta atual.
