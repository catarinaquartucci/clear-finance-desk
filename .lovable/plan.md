

# Diagnóstico: Login por Email Desabilitado

## Problema

O erro `email_provider_disabled` (HTTP 422) confirma que o **provedor de email** está desabilitado na configuração de autenticação do backend. Isso impede tanto o login com email/senha quanto o funcionamento correto dos triggers de backend (criação de perfil, vinculação de colaborador).

## Causa Provável

Em alguma alteração recente de configuração, o provedor de email foi desativado. Conforme documentado na memória do projeto, o provedor de email **deve permanecer habilitado** mesmo quando o Google Sign-In é o método principal, pois os triggers de backend dependem dele.

## Correção

A correção é uma **configuração de backend**, não uma mudança de código:

1. **Reabilitar o provedor de email** na configuração de autenticação do Lovable Cloud
2. Manter o Google Sign-In ativo como método principal
3. Validar que o login funciona com email/senha e com Google

Vou aplicar essa configuração ao implementar.

