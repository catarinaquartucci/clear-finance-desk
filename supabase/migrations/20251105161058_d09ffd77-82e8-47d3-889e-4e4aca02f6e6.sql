-- Corrigir função calcular_data_prevista_devolucao para considerar timezone de Brasília
CREATE OR REPLACE FUNCTION public.calcular_data_prevista_devolucao(data_solicitacao timestamp with time zone)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  -- Converte para timezone de Brasília antes de extrair a data
  -- Depois adiciona 5 dias úteis (excluindo finais de semana)
  RETURN add_business_days(
    (data_solicitacao AT TIME ZONE 'America/Sao_Paulo')::date, 
    5
  );
END;
$function$;

-- Recalcular datas previstas dos registros existentes
UPDATE public.devolucoes
SET data_prevista_pagamento = calcular_data_prevista_devolucao(created_at)
WHERE status NOT IN ('pago', 'rejeitado');