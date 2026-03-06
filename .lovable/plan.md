

# Criar função de administrador para raquel@marquesi.com.br

## Situação atual
- Usuário existe na autenticação (id: `52e423b7-6da8-407c-a6f2-bd914e5e24ba`)
- **Sem registro** na tabela `colaboradores`
- **Sem roles** na tabela `user_roles`

## Ações necessárias

### 1. Criar registro na tabela `colaboradores`
Inserir um registro vinculando o `user_id` ao email, com `is_admin = true`, `has_finance_access = true`, e `ativo = true`. Campos obrigatórios (cpf, area, funcao, etc.) serão preenchidos com valores padrão editáveis depois.

### 2. Inserir role `admin` na tabela `user_roles`
Isso será feito automaticamente pelo trigger `sync_admin_role_on_link` quando o colaborador for criado com `is_admin = true` e `user_id` preenchido. Mas para garantir, também inserir diretamente.

### 3. Inserir role `finance` na tabela `user_roles`
Para dar acesso completo ao sistema financeiro.

### Implementação
Tudo via migration SQL - sem alteração de código.

```sql
INSERT INTO colaboradores (nome, email, cpf, area, funcao, data_inicio_contrato, remuneracao, is_admin, ativo, has_finance_access, user_id)
VALUES ('Raquel Marquesi', 'raquel@marquesi.com.br', '00000000000', 'Administração', 'Administradora', CURRENT_DATE, 0, true, true, true, '52e423b7-6da8-407c-a6f2-bd914e5e24ba');

INSERT INTO user_roles (user_id, role) VALUES ('52e423b7-6da8-407c-a6f2-bd914e5e24ba', 'admin') ON CONFLICT (user_id, role) DO NOTHING;
INSERT INTO user_roles (user_id, role) VALUES ('52e423b7-6da8-407c-a6f2-bd914e5e24ba', 'finance') ON CONFLICT (user_id, role) DO NOTHING;
```

