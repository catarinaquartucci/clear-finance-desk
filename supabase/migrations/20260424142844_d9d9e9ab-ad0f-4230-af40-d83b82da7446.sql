-- Tabela de credenciais Itaú (uma por filial/conta)
CREATE TABLE public.itau_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.group_companies(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bank_account_id)
);

ALTER TABLE public.itau_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can view itau_credentials"
ON public.itau_credentials FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'finance'::app_role) OR
  has_role(auth.uid(), 'finance_viewer'::app_role)
);

CREATE POLICY "Admins can insert itau_credentials"
ON public.itau_credentials FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update itau_credentials"
ON public.itau_credentials FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete itau_credentials"
ON public.itau_credentials FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_itau_credentials_updated_at
BEFORE UPDATE ON public.itau_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_itau_credentials_company ON public.itau_credentials(company_id);
CREATE INDEX idx_itau_credentials_bank_account ON public.itau_credentials(bank_account_id);
CREATE INDEX idx_itau_credentials_ativo ON public.itau_credentials(ativo) WHERE ativo = true;

-- Tabela de logs de sincronização
CREATE TABLE public.itau_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID REFERENCES public.itau_credentials(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  period_from DATE,
  period_to DATE,
  transactions_imported INTEGER NOT NULL DEFAULT 0,
  transactions_skipped INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'error')),
  error_message TEXT,
  triggered_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itau_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can view itau_sync_log"
ON public.itau_sync_log FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'finance'::app_role) OR
  has_role(auth.uid(), 'finance_viewer'::app_role)
);

CREATE POLICY "Admins can delete itau_sync_log"
ON public.itau_sync_log FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_itau_sync_log_credential ON public.itau_sync_log(credential_id);
CREATE INDEX idx_itau_sync_log_started ON public.itau_sync_log(started_at DESC);

-- Garantir índice único para upsert por import_hash em bank_transactions (idempotência)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_import_hash
ON public.bank_transactions(import_hash)
WHERE import_hash IS NOT NULL;