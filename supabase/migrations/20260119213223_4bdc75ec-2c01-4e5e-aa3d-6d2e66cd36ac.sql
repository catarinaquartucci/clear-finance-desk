-- Tabela para dados detalhados do Marvee (3 níveis)
CREATE TABLE public.cash_flow_data_detailed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  marvee_category_structure TEXT NOT NULL,
  marvee_category_description TEXT,
  realized_value NUMERIC DEFAULT 0,
  projected_value NUMERIC DEFAULT 0,
  source_type TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(month, marvee_category_structure, source_type)
);

-- Índices para performance
CREATE INDEX idx_detailed_month ON public.cash_flow_data_detailed(month);
CREATE INDEX idx_detailed_category ON public.cash_flow_data_detailed(marvee_category_structure);
CREATE INDEX idx_detailed_source_type ON public.cash_flow_data_detailed(source_type);

-- Trigger para updated_at
CREATE TRIGGER update_cash_flow_data_detailed_updated_at
  BEFORE UPDATE ON public.cash_flow_data_detailed
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.cash_flow_data_detailed ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (mesmo padrão das tabelas financeiras)
CREATE POLICY "Users with finance access can read detailed data"
  ON public.cash_flow_data_detailed FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role])
  ));

CREATE POLICY "Users with finance access can insert detailed data"
  ON public.cash_flow_data_detailed FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role])
  ));

CREATE POLICY "Users with finance access can update detailed data"
  ON public.cash_flow_data_detailed FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role])
  ));

CREATE POLICY "Users with finance access can delete detailed data"
  ON public.cash_flow_data_detailed FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role])
  ));