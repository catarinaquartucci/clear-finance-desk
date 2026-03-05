

# Reabilitar Login por Email

## Problema
Os logs de autenticação ainda mostram `email_provider_disabled` (HTTP 422). A configuração anterior não surtiu efeito.

## Correção
Chamar novamente a ferramenta de configuração de autenticação para reabilitar o provedor de email, garantindo que tanto login quanto cadastro funcionem.

Configuração:
- **Email provider**: habilitado
- **Signup**: habilitado
- **Auto-confirm**: desabilitado (usuários devem verificar email)

Nenhuma alteração de código necessária — apenas configuração de backend.

