-- Criar função auxiliar para calcular dias úteis
CREATE OR REPLACE FUNCTION public.add_business_days(start_date DATE, days_to_add INTEGER)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result_date DATE := start_date;
  days_added INTEGER := 0;
  day_of_week INTEGER;
BEGIN
  WHILE days_added < days_to_add LOOP
    result_date := result_date + INTERVAL '1 day';
    day_of_week := EXTRACT(DOW FROM result_date);
    
    -- Pula fins de semana (0 = domingo, 6 = sábado)
    IF day_of_week NOT IN (0, 6) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  
  RETURN result_date;
END;
$$;

-- Atualizar função calcular_data_prevista_devolucao para usar 5 dias úteis
CREATE OR REPLACE FUNCTION public.calcular_data_prevista_devolucao(data_solicitacao timestamp with time zone)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  -- Adiciona 5 dias úteis (excluindo finais de semana)
  RETURN add_business_days(data_solicitacao::date, 5);
END;
$function$;

-- Atualizar registros existentes com o cálculo correto
UPDATE public.devolucoes
SET data_prevista_pagamento = calcular_data_prevista_devolucao(created_at)
WHERE status NOT IN ('pago', 'rejeitado');