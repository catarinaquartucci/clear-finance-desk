
-- Table: system_settings
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'preferences',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin viewers can read system_settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_viewer'::app_role));

-- Anyone authenticated can read rules (needed for Regras page)
CREATE POLICY "Authenticated can read rules" ON public.system_settings
  FOR SELECT TO authenticated
  USING (category = 'rules');

-- Table: group_companies
CREATE TABLE public.group_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  document text,
  type text NOT NULL DEFAULT 'filial',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group_companies" ON public.group_companies
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin viewers can read group_companies" ON public.group_companies
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin_viewer'::app_role));

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_system_settings
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_group_companies
  BEFORE UPDATE ON public.group_companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
