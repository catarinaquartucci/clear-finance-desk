-- Adicionar coluna planned_revenue para Rec. Previstas editável
ALTER TABLE public.monthly_planning 
ADD COLUMN IF NOT EXISTS planned_revenue NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.monthly_planning.planned_revenue IS 'Receitas Previstas - valor manual editável';