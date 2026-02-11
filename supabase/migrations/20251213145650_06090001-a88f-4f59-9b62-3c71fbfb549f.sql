-- Adicionar coluna platform_fee na tabela monthly_planning
ALTER TABLE public.monthly_planning 
ADD COLUMN platform_fee numeric DEFAULT 0;