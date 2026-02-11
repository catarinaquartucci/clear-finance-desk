-- Vincular Camila que já tem conta
UPDATE colaboradores 
SET user_id = 'aac68f8d-6810-42be-a974-284bf2e3e6a0'
WHERE lower(email) = 'camila.adegas@viverdeia.ai' 
  AND user_id IS NULL;

-- Garantir que todos os admins do colaboradores tenham user_roles
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT c.user_id, 'admin'::app_role
FROM colaboradores c
WHERE c.is_admin = true 
  AND c.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = c.user_id AND ur.role = 'admin'
  );