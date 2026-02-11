-- Adicionar coluna installment
ALTER TABLE marvee_transactions ADD COLUMN installment INTEGER DEFAULT 1;

-- Remover constraint antiga
ALTER TABLE marvee_transactions DROP CONSTRAINT IF EXISTS marvee_transactions_marvee_id_source_type_status_key;

-- Criar nova constraint incluindo installment
ALTER TABLE marvee_transactions ADD CONSTRAINT marvee_transactions_unique_key 
  UNIQUE(marvee_id, source_type, status, installment);