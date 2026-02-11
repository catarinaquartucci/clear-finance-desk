-- Add descricao column to notas_fiscais
ALTER TABLE public.notas_fiscais 
ADD COLUMN descricao text;