
-- Bank transactions (imported from OFX/CSV statements)
CREATE TABLE public.bank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'debit',
  balance numeric,
  reference text,
  conciliated boolean NOT NULL DEFAULT false,
  conciliated_with_type text,
  conciliated_with_id uuid,
  conciliated_at timestamp with time zone,
  import_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can view bank_transactions"
  ON public.bank_transactions FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
    OR has_role(auth.uid(), 'finance_viewer'::app_role)
  );

CREATE POLICY "Finance users can insert bank_transactions"
  ON public.bank_transactions FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Finance users can update bank_transactions"
  ON public.bank_transactions FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  );

CREATE POLICY "Admin can delete bank_transactions"
  ON public.bank_transactions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Prevent duplicate imports
CREATE UNIQUE INDEX bank_transactions_import_hash_idx ON public.bank_transactions(import_hash) WHERE import_hash IS NOT NULL;
