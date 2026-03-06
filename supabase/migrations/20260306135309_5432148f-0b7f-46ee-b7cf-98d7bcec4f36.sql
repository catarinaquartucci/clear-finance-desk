ALTER TABLE colaboradores DISABLE TRIGGER audit_colaboradores_changes;

UPDATE colaboradores 
SET user_id = 'd33d57f4-eb87-452f-978a-803b48a71536'
WHERE email = 'financeiro@vantari.com.br' AND user_id IS NULL;

ALTER TABLE colaboradores ENABLE TRIGGER audit_colaboradores_changes;

INSERT INTO user_roles (user_id, role) VALUES
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'admin'),
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'finance'),
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'finance_viewer'),
  ('d33d57f4-eb87-452f-978a-803b48a71536', 'admin_viewer')
ON CONFLICT (user_id, role) DO NOTHING;