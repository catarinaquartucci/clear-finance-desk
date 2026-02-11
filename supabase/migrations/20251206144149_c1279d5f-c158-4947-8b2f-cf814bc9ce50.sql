-- Adicionar coluna mes_pagamento na tabela notas_fiscais
ALTER TABLE public.notas_fiscais 
ADD COLUMN mes_pagamento text;