

# Correcao do Login Google - redirect_uri_mismatch

## Problema Encontrado

O botao "Entrar com Google" redireciona para o Google OAuth, mas retorna **Error 400: redirect_uri_mismatch**. O projeto esta usando credenciais Google OAuth customizadas (client_id `418611336196-...`) que nao possuem a URL de callback `https://oauth.lovable.app/callback` registrada.

## Solucao

Este problema nao e de codigo - o codigo esta correto usando `lovable.auth.signInWithOAuth("google")`. O problema esta na configuracao das credenciais OAuth.

### Opcao 1: Usar credenciais gerenciadas pelo Lovable Cloud (recomendado)
- Acessar as configuracoes de autenticacao do Lovable Cloud
- Remover as credenciais customizadas do Google OAuth
- As credenciais gerenciadas automaticamente pelo Lovable Cloud ja incluem todos os redirect URIs necessarios

### Opcao 2: Corrigir as credenciais customizadas
Se voce precisa manter suas proprias credenciais Google:
1. Acessar o [Google Cloud Console](https://console.cloud.google.com/)
2. Ir em **APIs & Services > Credentials**
3. Editar o OAuth Client ID `418611336196-...`
4. Adicionar `https://oauth.lovable.app/callback` em **Authorized redirect URIs**
5. Salvar

### Nenhuma alteracao de codigo necessaria
O codigo em `src/pages/Auth.tsx` esta correto - usa `lovable.auth.signInWithOAuth("google")` com `redirect_uri: window.location.origin`.

