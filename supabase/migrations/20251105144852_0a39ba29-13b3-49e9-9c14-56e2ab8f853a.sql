-- Adicionar coluna data_prevista_pagamento nas tabelas
ALTER TABLE reembolsos 
ADD COLUMN data_prevista_pagamento date;

ALTER TABLE devolucoes 
ADD COLUMN data_prevista_pagamento date;

-- Criar função para calcular data prevista de pagamento de reembolsos
-- Sempre retorna dia 10 do mês seguinte
CREATE OR REPLACE FUNCTION calcular_data_prevista_reembolso(data_solicitacao timestamptz)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Pega o mês seguinte e define como dia 10
  RETURN (DATE_TRUNC('month', data_solicitacao) + INTERVAL '1 month' + INTERVAL '9 days')::date;
END;
$$;

-- Criar função para calcular data prevista de pagamento de devoluções
-- Adiciona 7 dias corridos (aproximação de 5 dias úteis)
CREATE OR REPLACE FUNCTION calcular_data_prevista_devolucao(data_solicitacao timestamptz)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Adiciona 7 dias corridos (aproximadamente 5 dias úteis)
  RETURN (data_solicitacao + INTERVAL '7 days')::date;
END;
$$;

-- Criar trigger para reembolsos - calcula automaticamente ao inserir
CREATE OR REPLACE FUNCTION set_data_prevista_reembolso()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.data_prevista_pagamento := calcular_data_prevista_reembolso(NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_data_prevista_reembolso
  BEFORE INSERT ON reembolsos
  FOR EACH ROW
  EXECUTE FUNCTION set_data_prevista_reembolso();

-- Criar trigger para devoluções - calcula automaticamente ao inserir
CREATE OR REPLACE FUNCTION set_data_prevista_devolucao()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.data_prevista_pagamento := calcular_data_prevista_devolucao(NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_data_prevista_devolucao
  BEFORE INSERT ON devolucoes
  FOR EACH ROW
  EXECUTE FUNCTION set_data_prevista_devolucao();

-- Atualizar registros existentes com data prevista
UPDATE reembolsos 
SET data_prevista_pagamento = calcular_data_prevista_reembolso(created_at)
WHERE data_prevista_pagamento IS NULL;

UPDATE devolucoes 
SET data_prevista_pagamento = calcular_data_prevista_devolucao(created_at)
WHERE data_prevista_pagamento IS NULL;