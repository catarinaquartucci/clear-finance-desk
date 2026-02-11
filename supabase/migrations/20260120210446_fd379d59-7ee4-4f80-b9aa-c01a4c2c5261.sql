-- Tabela para armazenar lançamentos brutos do Marvee
CREATE TABLE marvee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marvee_id INTEGER NOT NULL,
  
  -- Tipo e Status
  source_type TEXT NOT NULL, -- 'receita' ou 'despesa'
  status TEXT NOT NULL,      -- 'paid' ou 'pending'
  
  -- Valores
  movement_value NUMERIC NOT NULL DEFAULT 0,
  
  -- Datas
  payment_date DATE,
  expiration_date DATE,
  
  -- Documento (pode ser número ou texto)
  document_number TEXT,
  
  -- Categorias (3 níveis - todos os campos)
  category_level_1_id INTEGER,
  category_level_1_structure TEXT,
  category_level_1_description TEXT,
  
  category_level_2_id INTEGER,
  category_level_2_structure TEXT,
  category_level_2_description TEXT,
  
  category_level_3_id INTEGER,
  category_level_3_structure TEXT,
  category_level_3_description TEXT,
  
  -- Payload bruto para debug
  raw_payload JSONB,
  
  -- Metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicatas
  UNIQUE(marvee_id, source_type, status)
);

-- Índices para consultas
CREATE INDEX idx_marvee_tx_source ON marvee_transactions(source_type);
CREATE INDEX idx_marvee_tx_status ON marvee_transactions(status);
CREATE INDEX idx_marvee_tx_payment ON marvee_transactions(payment_date);
CREATE INDEX idx_marvee_tx_expiration ON marvee_transactions(expiration_date);
CREATE INDEX idx_marvee_tx_cat3 ON marvee_transactions(category_level_3_structure);
CREATE INDEX idx_marvee_tx_doc ON marvee_transactions(document_number);

-- RLS
ALTER TABLE marvee_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance users can manage transactions"
  ON marvee_transactions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'finance')
  ));