-- Adicionar coluna planned_expense à tabela monthly_planning
ALTER TABLE public.monthly_planning 
ADD COLUMN IF NOT EXISTS planned_expense NUMERIC DEFAULT 0;

COMMENT ON COLUMN monthly_planning.planned_expense IS 'Despesas previstas (editável manualmente)';