-- Adicionar novas colunas para categoria Marvee
ALTER TABLE marvee_category_mapping 
  ADD COLUMN IF NOT EXISTS marvee_category_structure TEXT,
  ADD COLUMN IF NOT EXISTS marvee_category_description TEXT;

-- Permitir null nas colunas antigas durante transição
ALTER TABLE marvee_category_mapping 
  ALTER COLUMN marvee_cost_center_id DROP NOT NULL,
  ALTER COLUMN marvee_cost_center_name DROP NOT NULL;

-- Adicionar constraint unique para structure (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'marvee_category_mapping_marvee_category_structure_key'
  ) THEN
    ALTER TABLE marvee_category_mapping
      ADD CONSTRAINT marvee_category_mapping_marvee_category_structure_key 
      UNIQUE(marvee_category_structure);
  END IF;
END $$;