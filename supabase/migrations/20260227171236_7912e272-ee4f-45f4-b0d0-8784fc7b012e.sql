
-- 1. Create recurring_expenses table
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  chart_account_id UUID REFERENCES public.chart_of_accounts(id),
  company_id UUID REFERENCES public.group_companies(id),
  payment_method TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER NOT NULL DEFAULT 10,
  start_date DATE NOT NULL,
  end_date DATE,
  total_months INTEGER NOT NULL DEFAULT 12,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add recurring_expense_id to payables
ALTER TABLE public.payables ADD COLUMN recurring_expense_id UUID REFERENCES public.recurring_expenses(id);

-- 3. Enable RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies (same pattern as payables)
CREATE POLICY "Finance users can view recurring_expenses"
  ON public.recurring_expenses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'finance_viewer'::app_role));

CREATE POLICY "Finance users can insert recurring_expenses"
  ON public.recurring_expenses FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));

CREATE POLICY "Finance users can update recurring_expenses"
  ON public.recurring_expenses FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));

CREATE POLICY "Admin can delete recurring_expenses"
  ON public.recurring_expenses FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Updated_at trigger
CREATE TRIGGER set_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
