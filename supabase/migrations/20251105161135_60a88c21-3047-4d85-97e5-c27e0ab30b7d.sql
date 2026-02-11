-- Adicionar search_path à função calcular_data_prevista_reembolso
CREATE OR REPLACE FUNCTION public.calcular_data_prevista_reembolso(data_solicitacao timestamp with time zone)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  -- Pega o primeiro dia do mês seguinte e adiciona 9 dias para chegar ao dia 10
  RETURN (DATE_TRUNC('month', data_solicitacao) + INTERVAL '1 month' + INTERVAL '9 days')::date;
END;
$function$;