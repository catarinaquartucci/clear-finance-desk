-- 1. Remover role admin do usuário teste que ficou dessincronizado
DELETE FROM user_roles 
WHERE user_id = 'db185e55-0778-4528-b856-10789ec9bb67' 
AND role = 'admin';

-- 2. Criar função para sincronizar admin role automaticamente
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só sincroniza se o colaborador tem user_id vinculado
  IF NEW.user_id IS NOT NULL THEN
    -- Se is_admin mudou de false para true, adicionar role
    IF NEW.is_admin = true AND (OLD.is_admin = false OR OLD.is_admin IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    -- Se is_admin mudou de true para false, remover role
    ELSIF (NEW.is_admin = false OR NEW.is_admin IS NULL) AND OLD.is_admin = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Criar trigger que executa após UPDATE na tabela colaboradores
CREATE TRIGGER trigger_sync_admin_role
AFTER UPDATE ON colaboradores
FOR EACH ROW
EXECUTE FUNCTION sync_admin_role();

-- 4. Criar trigger para quando user_id é vinculado (INSERT ou UPDATE de user_id)
CREATE OR REPLACE FUNCTION public.sync_admin_role_on_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando user_id é vinculado e colaborador é admin, adicionar role
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.is_admin = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_admin_role_on_link
AFTER UPDATE ON colaboradores
FOR EACH ROW
WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
EXECUTE FUNCTION sync_admin_role_on_link();