-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_viewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_viewer';

-- Add columns to colaboradores table
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS has_finance_view_access boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_admin_view_access boolean DEFAULT false;

COMMENT ON COLUMN public.colaboradores.has_finance_view_access IS 
'Permite acesso somente leitura ao módulo financeiro';

COMMENT ON COLUMN public.colaboradores.has_admin_view_access IS 
'Permite acesso somente leitura ao módulo admin';

-- Trigger function for finance_viewer role sync
CREATE OR REPLACE FUNCTION public.sync_finance_viewer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    IF NEW.has_finance_view_access = true AND 
       (OLD.has_finance_view_access = false OR OLD.has_finance_view_access IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.has_finance_view_access = false OR NEW.has_finance_view_access IS NULL) 
          AND OLD.has_finance_view_access = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'finance_viewer';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for finance_viewer on has_finance_view_access change
DROP TRIGGER IF EXISTS on_colaborador_finance_viewer_change ON public.colaboradores;
CREATE TRIGGER on_colaborador_finance_viewer_change
  AFTER UPDATE OF has_finance_view_access ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION sync_finance_viewer_role();

-- Trigger function for finance_viewer on user_id link
CREATE OR REPLACE FUNCTION public.sync_finance_viewer_role_on_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.has_finance_view_access = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'finance_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for finance_viewer on user_id link
DROP TRIGGER IF EXISTS on_colaborador_link_finance_viewer ON public.colaboradores;
CREATE TRIGGER on_colaborador_link_finance_viewer
  AFTER UPDATE OF user_id ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION sync_finance_viewer_role_on_link();

-- Trigger function for admin_viewer role sync
CREATE OR REPLACE FUNCTION public.sync_admin_viewer_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    IF NEW.has_admin_view_access = true AND 
       (OLD.has_admin_view_access = false OR OLD.has_admin_view_access IS NULL) THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF (NEW.has_admin_view_access = false OR NEW.has_admin_view_access IS NULL) 
          AND OLD.has_admin_view_access = true THEN
      DELETE FROM user_roles 
      WHERE user_id = NEW.user_id AND role = 'admin_viewer';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for admin_viewer on has_admin_view_access change
DROP TRIGGER IF EXISTS on_colaborador_admin_viewer_change ON public.colaboradores;
CREATE TRIGGER on_colaborador_admin_viewer_change
  AFTER UPDATE OF has_admin_view_access ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_viewer_role();

-- Trigger function for admin_viewer on user_id link
CREATE OR REPLACE FUNCTION public.sync_admin_viewer_role_on_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    IF NEW.has_admin_view_access = true THEN
      INSERT INTO user_roles (user_id, role) 
      VALUES (NEW.user_id, 'admin_viewer')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for admin_viewer on user_id link
DROP TRIGGER IF EXISTS on_colaborador_link_admin_viewer ON public.colaboradores;
CREATE TRIGGER on_colaborador_link_admin_viewer
  AFTER UPDATE OF user_id ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_viewer_role_on_link();