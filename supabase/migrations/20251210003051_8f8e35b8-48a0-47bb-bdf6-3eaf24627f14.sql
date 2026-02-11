-- 1. Adicionar coluna has_finance_access na tabela colaboradores
ALTER TABLE colaboradores 
ADD COLUMN has_finance_access boolean DEFAULT false;

-- 2. Criar função para sincronizar finance role automaticamente
CREATE OR REPLACE FUNCTION public.sync_finance_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só sincroniza se o colaborador tem user_id vinculado
  IF NEW.user_id IS NOT NULL THEN
    -- Se has_finance_access mudou de false para true, adicionar role
    IF NEW.has_finance_access = true AND (OLD.has_finance_access = false OR OLD.has_finance_access IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance')
      ON CONFLICT (user_id, role) DO NOTHING;
    -- Se has_finance_access mudou de true para false, remover role
    ELSIF (NEW.has_finance_access = false OR NEW.has_finance_access IS NULL) AND OLD.has_finance_access = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'finance';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Criar trigger que executa após UPDATE na tabela colaboradores
CREATE TRIGGER trigger_sync_finance_role
AFTER UPDATE ON colaboradores
FOR EACH ROW
EXECUTE FUNCTION sync_finance_role();

-- 4. Criar função para quando user_id é vinculado e tem acesso finance
CREATE OR REPLACE FUNCTION public.sync_finance_role_on_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando user_id é vinculado e colaborador tem acesso finance, adicionar role
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.has_finance_access = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Criar trigger para vincular finance role quando user_id muda
CREATE TRIGGER trigger_sync_finance_role_on_link
AFTER UPDATE ON colaboradores
FOR EACH ROW
WHEN (OLD.user_id IS DISTINCT FROM NEW.user_id)
EXECUTE FUNCTION sync_finance_role_on_link();