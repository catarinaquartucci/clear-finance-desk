
-- Create payables table (contas a pagar)
CREATE TABLE public.payables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date,
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
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Finance users can view payables"
  ON public.payables FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
    OR has_role(auth.uid(), 'finance_viewer'::app_role)
  );

CREATE POLICY "Finance users can insert payables"
  ON public.payables FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Finance users can update payables"
  ON public.payables FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Admin can delete payables"
  ON public.payables FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_payables_updated_at
  BEFORE UPDATE ON public.payables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create payable_attachments table
CREATE TABLE public.payable_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payable_id uuid NOT NULL REFERENCES public.payables(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payable_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can view payable_attachments"
  ON public.payable_attachments FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
    OR has_role(auth.uid(), 'finance_viewer'::app_role)
  );

CREATE POLICY "Finance users can insert payable_attachments"
  ON public.payable_attachments FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Admin can delete payable_attachments"
  ON public.payable_attachments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
