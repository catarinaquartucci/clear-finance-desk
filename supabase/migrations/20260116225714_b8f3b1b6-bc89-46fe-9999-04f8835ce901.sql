-- Tabela para logs de sincronização Marvee
CREATE TABLE public.marvee_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  triggered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para logs
ALTER TABLE public.marvee_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e Finance podem ver sync logs"
ON public.marvee_sync_logs FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'finance'::app_role)
);

-- Tabela para mapeamento de categorias Marvee -> Fluxo de Caixa
CREATE TABLE public.marvee_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marvee_cost_center_id TEXT NOT NULL,
  marvee_cost_center_name TEXT NOT NULL,
  cash_flow_category_code TEXT NOT NULL REFERENCES cash_flow_categories(code),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(marvee_cost_center_id)
);

-- RLS para mapeamento
ALTER TABLE public.marvee_category_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e Finance podem ver mapeamentos"
ON public.marvee_category_mapping FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'finance'::app_role)
);

CREATE POLICY "Admin e Finance podem inserir mapeamentos"
ON public.marvee_category_mapping FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'finance'::app_role)
);

CREATE POLICY "Admin e Finance podem atualizar mapeamentos"
ON public.marvee_category_mapping FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'finance'::app_role)
);

CREATE POLICY "Admin pode excluir mapeamentos"
ON public.marvee_category_mapping FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_marvee_category_mapping_updated_at
BEFORE UPDATE ON public.marvee_category_mapping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Registrar automação Marvee
INSERT INTO automation_config (job_name, name, description, function_name, schedule, is_active, config) VALUES (
  'marvee-cash-flow-sync',
  'Sincronização Marvee - Fluxo de Caixa',
  'Sincroniza dados de contas a pagar/receber do Marvee para o Fluxo de Caixa',
  'marvee-sync',
  '0 6 * * *',
  false,
  '{"sync_type": "cash_flow", "months_back": 1}'::jsonb
);