
-- 1. Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert (via SECURITY DEFINER functions)
CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Create audit function for colaboradores access
CREATE OR REPLACE FUNCTION public.audit_colaboradores_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id)
  VALUES (auth.uid(), TG_OP, 'colaboradores', COALESCE(OLD.id::text, NEW.id::text));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Add audit trigger on colaboradores for UPDATE and DELETE
CREATE TRIGGER audit_colaboradores_changes
  AFTER UPDATE OR DELETE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_colaboradores_access();

-- 4. Allow authenticated colaboradores to see their OWN record (self-service)
-- Drop old SELECT policy and replace with more granular ones
DROP POLICY IF EXISTS "Admins e viewers podem ver todos os colaboradores" ON public.colaboradores;

-- Admins and admin_viewers can see ALL colaboradores
CREATE POLICY "Admins e viewers podem ver todos os colaboradores"
  ON public.colaboradores FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- Regular users can see only their own record
CREATE POLICY "Usuarios podem ver seu proprio registro"
  ON public.colaboradores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
