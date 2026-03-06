

# Vincular user_id do colaborador financeiro@vantari.com.br

## Problema
A conta de autenticação existe (`d33d57f4-eb87-452f-978a-803b48a71536`) mas o colaborador tem `user_id = NULL`. Sem essa vinculação, os triggers de sincronização não populam `user_roles`, e o usuário fica sem permissões.

## Solução
Executar uma migration para:
1. Vincular o `user_id` no colaborador
2. Inserir as roles correspondentes em `user_roles` (admin, finance, finance_viewer, admin_viewer) — os triggers devem fazer isso automaticamente, mas incluímos inserts manuais como fallback

### SQL
```sql
UPDATE colaboradores 
SET user_id = 'd33d57f4-eb87-452f-978a-803b48a71536'
WHERE email = 'financeiro@vantari.com.br' AND user_id IS NULL;

INSERT INTO user_roles (user_id, role) VALUES
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'admin'),
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'finance'),
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'finance_viewer'),
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'admin_viewer')
ON CONFLICT (user_id, role) DO NOTHING;
```

Nenhuma alteração de código necessária — apenas dados.

