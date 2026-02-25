
-- =============================================
-- FASE 1: CADASTROS BASE
-- =============================================

-- 1. Fornecedores (suppliers)
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  pix_key TEXT,
  category TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Clientes (customers)
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  segment TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Contas Bancárias (bank_accounts)
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  agency TEXT,
  account_number TEXT,
  account_type TEXT NOT NULL DEFAULT 'corrente',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Plano de Contas (chart_of_accounts)
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- revenue, expense, cost
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Centros de Custo (cost_centers)
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGERS updated_at
-- =============================================
CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_chart_of_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- SELECT: admin, finance, finance_viewer
CREATE POLICY "Finance users can view suppliers" ON public.suppliers FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'finance_viewer'));

CREATE POLICY "Finance users can view customers" ON public.customers FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'finance_viewer'));

CREATE POLICY "Finance users can view bank_accounts" ON public.bank_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'finance_viewer'));

CREATE POLICY "Finance users can view chart_of_accounts" ON public.chart_of_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'finance_viewer'));

CREATE POLICY "Finance users can view cost_centers" ON public.cost_centers FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance') OR has_role(auth.uid(), 'finance_viewer'));

-- INSERT: admin, finance
CREATE POLICY "Finance users can insert suppliers" ON public.suppliers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can insert customers" ON public.customers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can insert bank_accounts" ON public.bank_accounts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can insert chart_of_accounts" ON public.chart_of_accounts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can insert cost_centers" ON public.cost_centers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

-- UPDATE: admin, finance
CREATE POLICY "Finance users can update suppliers" ON public.suppliers FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can update customers" ON public.customers FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can update bank_accounts" ON public.bank_accounts FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can update chart_of_accounts" ON public.chart_of_accounts FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can update cost_centers" ON public.cost_centers FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'finance'));

-- DELETE: admin only
CREATE POLICY "Admin can delete suppliers" ON public.suppliers FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete customers" ON public.customers FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete bank_accounts" ON public.bank_accounts FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete chart_of_accounts" ON public.chart_of_accounts FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete cost_centers" ON public.cost_centers FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
