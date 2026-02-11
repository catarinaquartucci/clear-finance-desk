-- Corrigir função para calcular dia 10 do mês seguinte (não dia 09)
CREATE OR REPLACE FUNCTION calcular_data_prevista_reembolso(data_solicitacao timestamptz)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Pega o primeiro dia do mês seguinte e adiciona 9 dias para chegar ao dia 10
  RETURN (DATE_TRUNC('month', data_solicitacao) + INTERVAL '1 month' + INTERVAL '9 days')::date;
END;
$$;

-- Recalcular todos os registros existentes com a fórmula correta
UPDATE reembolsos 
SET data_prevista_pagamento = calcular_data_prevista_reembolso(created_at);