-- Adicionar novos campos à tabela colaboradores
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS variavel text,
ADD COLUMN IF NOT EXISTS regra_ote text,
ADD COLUMN IF NOT EXISTS data_nascimento date;

COMMENT ON COLUMN public.colaboradores.variavel IS 'Valor ou percentual variável';
COMMENT ON COLUMN public.colaboradores.regra_ote IS 'Regra de OTE (On-Target Earnings)';
COMMENT ON COLUMN public.colaboradores.data_nascimento IS 'Data de nascimento do colaborador';