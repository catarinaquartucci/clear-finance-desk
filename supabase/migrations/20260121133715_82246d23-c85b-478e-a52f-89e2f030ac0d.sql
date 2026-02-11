-- Atualizar função aggregate_raw_to_detailed para usar expiration_date como fallback
-- quando payment_date é NULL para determinar se o valor é realizado
CREATE OR REPLACE FUNCTION public.aggregate_raw_to_detailed(p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(processed bigint, created bigint, updated bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_processed BIGINT := 0;
BEGIN
  -- Upsert agregando dados raw para detailed
  -- Mês é determinado por COALESCE(payment_date, expiration_date)
  -- Realizado/Projetado: usa payment_date se disponível, senão usa expiration_date
  WITH aggregated AS (
    SELECT 
      TO_CHAR(COALESCE(mt.payment_date, mt.expiration_date)::DATE, 'YYYY-MM') as agg_month,
      mt.category_level_3_structure as marvee_cat_structure,
      MAX(mt.category_level_3_description) as marvee_cat_description,
      mt.source_type as src_type,
      -- REALIZADO: 
      -- 1) tem payment_date e data <= hoje, OU
      -- 2) payment_date é NULL mas expiration_date <= hoje (já venceu = considerado pago)
      SUM(CASE 
        WHEN mt.payment_date IS NOT NULL AND mt.payment_date::DATE <= CURRENT_DATE 
          THEN mt.movement_value 
        WHEN mt.payment_date IS NULL AND mt.expiration_date IS NOT NULL 
          AND mt.expiration_date::DATE <= CURRENT_DATE 
          THEN mt.movement_value 
        ELSE 0 
      END) as real_value,
      -- PROJETADO:
      -- 1) payment_date > hoje, OU
      -- 2) payment_date NULL e expiration_date > hoje ou NULL
      SUM(CASE 
        WHEN mt.payment_date IS NOT NULL AND mt.payment_date::DATE > CURRENT_DATE 
          THEN mt.movement_value 
        WHEN mt.payment_date IS NULL AND (mt.expiration_date IS NULL 
          OR mt.expiration_date::DATE > CURRENT_DATE) 
          THEN mt.movement_value 
        ELSE 0 
      END) as proj_value
    FROM marvee_transactions mt
    WHERE mt.category_level_3_structure IS NOT NULL
      AND COALESCE(mt.payment_date, mt.expiration_date) IS NOT NULL
      AND (p_year IS NULL OR EXTRACT(YEAR FROM COALESCE(mt.payment_date, mt.expiration_date)::DATE) = p_year)
    GROUP BY 
      TO_CHAR(COALESCE(mt.payment_date, mt.expiration_date)::DATE, 'YYYY-MM'),
      mt.category_level_3_structure,
      mt.source_type
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
$function$;