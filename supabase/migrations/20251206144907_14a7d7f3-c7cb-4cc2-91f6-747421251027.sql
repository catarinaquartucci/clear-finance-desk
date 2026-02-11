-- Add tipo_chave_pix column to notas_fiscais table
ALTER TABLE public.notas_fiscais 
ADD COLUMN IF NOT EXISTS tipo_chave_pix text DEFAULT 'CNPJ';