
-- Boletos table
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receivable_id UUID REFERENCES public.receivables(id),
  customer_id UUID REFERENCES public.customers(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  barcode TEXT,
  our_number TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can view boletos"
  ON public.boletos FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR 
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

CREATE POLICY "Finance users can insert boletos"
  ON public.boletos FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Finance users can update boletos"
  ON public.boletos FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Admin can delete boletos"
  ON public.boletos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON public.boletos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
