-- Adicionar constraint UNIQUE na cash_flow_data_detailed se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cash_flow_data_detailed_unique_key'
  ) THEN
    ALTER TABLE cash_flow_data_detailed 
    ADD CONSTRAINT cash_flow_data_detailed_unique_key 
    UNIQUE(month, marvee_category_structure, source_type);
  END IF;
END $$;

-- Criar função de agregação dos dados raw para detailed
CREATE OR REPLACE FUNCTION aggregate_raw_to_detailed(p_year INTEGER DEFAULT NULL)
RETURNS TABLE(processed BIGINT, created BIGINT, updated BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed BIGINT := 0;
BEGIN
  -- Upsert agregando dados raw para detailed
  WITH aggregated AS (
    SELECT 
      CASE 
        WHEN mt.status = 'paid' THEN TO_CHAR(mt.payment_date::DATE, 'YYYY-MM')
        ELSE TO_CHAR(mt.expiration_date::DATE, 'YYYY-MM')
      END as agg_month,
      mt.category_level_3_structure as marvee_cat_structure,
      MAX(mt.category_level_3_description) as marvee_cat_description,
      mt.source_type as src_type,
      SUM(CASE WHEN mt.status = 'paid' THEN mt.movement_value ELSE 0 END) as real_value,
      SUM(CASE WHEN mt.status = 'pending' THEN mt.movement_value ELSE 0 END) as proj_value
    FROM marvee_transactions mt
    WHERE mt.category_level_3_structure IS NOT NULL
      AND (
        p_year IS NULL 
        OR (mt.status = 'paid' AND EXTRACT(YEAR FROM mt.payment_date::DATE) = p_year)
        OR (mt.status = 'pending' AND EXTRACT(YEAR FROM mt.expiration_date::DATE) = p_year)
      )
    GROUP BY 
      CASE 
        WHEN mt.status = 'paid' THEN TO_CHAR(mt.payment_date::DATE, 'YYYY-MM')
        ELSE TO_CHAR(mt.expiration_date::DATE, 'YYYY-MM')
      END,
      mt.category_level_3_structure,
      mt.source_type
    HAVING CASE 
        WHEN mt.status = 'paid' THEN TO_CHAR(mt.payment_date::DATE, 'YYYY-MM')
        ELSE TO_CHAR(mt.expiration_date::DATE, 'YYYY-MM')
      END IS NOT NULL
  ),
  upserted AS (
    INSERT INTO cash_flow_data_detailed (
      month, marvee_category_structure, marvee_category_description,
      source_type, realized_value, projected_value, synced_at
    )
    SELECT 
      agg_month, marvee_cat_structure, marvee_cat_description,
      src_type, real_value, proj_value, NOW()
    FROM aggregated
    ON CONFLICT (month, marvee_category_structure, source_type)
    DO UPDATE SET
      marvee_category_description = EXCLUDED.marvee_category_description,
      realized_value = EXCLUDED.realized_value,
      projected_value = EXCLUDED.projected_value,
      synced_at = NOW(),
      updated_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_processed FROM upserted;
  
  RETURN QUERY SELECT v_processed, v_processed, 0::BIGINT;
END;
$$;