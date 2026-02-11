-- Adicionar colunas de chave PIX na tabela devolucoes
ALTER TABLE public.devolucoes 
ADD COLUMN tipo_chave_pix text NOT NULL DEFAULT 'CPF',
ADD COLUMN chave_pix text NOT NULL DEFAULT '';

-- Comentários para documentação
COMMENT ON COLUMN public.devolucoes.tipo_chave_pix IS 'Tipo da chave PIX: CPF, CNPJ, Email, Telefone ou Aleatória';
COMMENT ON COLUMN public.devolucoes.chave_pix IS 'Chave PIX para devolução ao cliente';