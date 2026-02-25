
-- Create receivables table (contas a receber)
CREATE TABLE public.receivables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  received_date date,
  status text NOT NULL DEFAULT 'open',
  chart_account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  cost_center_id uuid REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  installment_number integer DEFAULT 1,
  installment_total integer DEFAULT 1,
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Finance users can view receivables"
  ON public.receivables FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
    OR has_role(auth.uid(), 'finance_viewer'::app_role)
  );

CREATE POLICY "Finance users can insert receivables"
  ON public.receivables FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Finance users can update receivables"
  ON public.receivables FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Admin can delete receivables"
  ON public.receivables FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
