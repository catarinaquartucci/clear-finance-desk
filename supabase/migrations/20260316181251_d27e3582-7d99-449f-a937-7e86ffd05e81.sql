-- Harden publicly callable SECURITY DEFINER RPCs with input validation and explicit execution grants

CREATE OR REPLACE FUNCTION public.get_notas_fiscais_mes()
 RETURNS TABLE(id uuid, user_id uuid, nome text, email text, valor numeric, created_at timestamp with time zone, periodo_referencia text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT 
    nf.id,
    nf.user_id,
    nf.nome,
    au.email::text,
    nf.valor,
    nf.created_at,
    nf.periodo_referencia
  FROM public.notas_fiscais nf
  LEFT JOIN auth.users au ON nf.user_id = au.id
  WHERE nf.created_at >= date_trunc('month', CURRENT_DATE)
    AND nf.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  ORDER BY nf.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.aggregate_raw_to_detailed(p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(processed bigint, created bigint, updated bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_processed BIGINT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_year IS NOT NULL AND (p_year < 2000 OR p_year > EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 5) THEN
    RAISE EXCEPTION 'Invalid year';
  END IF;

  WITH deduped_transactions AS (
    SELECT mt.*
    FROM marvee_transactions mt
    WHERE NOT EXISTS (
      SELECT 1 
      FROM marvee_transactions mt2
      WHERE mt2.marvee_id = mt.marvee_id
        AND mt2.source_type = mt.source_type
        AND mt2.installment = mt.installment
        AND mt2.status = 'paid'
        AND mt.status = 'pending'
    )
  ),
  aggregated AS (
    SELECT 
      TO_CHAR(COALESCE(mt.payment_date, mt.expiration_date)::DATE, 'YYYY-MM') as agg_month,
      mt.category_level_3_structure as marvee_cat_structure,
      MAX(mt.category_level_3_description) as marvee_cat_description,
      mt.source_type as src_type,
      SUM(CASE 
        WHEN mt.payment_date IS NOT NULL AND mt.payment_date::DATE <= CURRENT_DATE 
          THEN mt.movement_value 
        WHEN mt.payment_date IS NULL AND mt.expiration_date IS NOT NULL 
          AND mt.expiration_date::DATE <= CURRENT_DATE 
          THEN mt.movement_value 
        ELSE 0 
      END) as real_value,
      SUM(CASE 
        WHEN mt.payment_date IS NOT NULL AND mt.payment_date::DATE > CURRENT_DATE 
          THEN mt.movement_value 
        WHEN mt.payment_date IS NULL AND (mt.expiration_date IS NULL 
          OR mt.expiration_date::DATE > CURRENT_DATE) 
          THEN mt.movement_value 
        ELSE 0 
      END) as proj_value
    FROM deduped_transactions mt
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

CREATE OR REPLACE FUNCTION public.populate_cash_flow_tables(p_year integer DEFAULT NULL::integer)
 RETURNS TABLE(expenses_count bigint, revenues_count bigint, expenses_deleted bigint, revenues_deleted bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expenses_deleted BIGINT;
  v_revenues_deleted BIGINT;
  v_expenses_count BIGINT;
  v_revenues_count BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'finance'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_year IS NOT NULL AND (p_year < 2000 OR p_year > EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 5) THEN
    RAISE EXCEPTION 'Invalid year';
  END IF;

  IF p_year IS NOT NULL THEN
    DELETE FROM cash_flow_expenses WHERE month LIKE p_year::TEXT || '-%';
    GET DIAGNOSTICS v_expenses_deleted = ROW_COUNT;
    
    DELETE FROM cash_flow_revenues WHERE month LIKE p_year::TEXT || '-%';
    GET DIAGNOSTICS v_revenues_deleted = ROW_COUNT;
  ELSE
    TRUNCATE cash_flow_expenses, cash_flow_revenues;
    v_expenses_deleted := 0;
    v_revenues_deleted := 0;
  END IF;

  INSERT INTO cash_flow_expenses (marvee_id, month, category_structure, category_description, movement_value, expiration_date, document_number, installment)
  SELECT 
    marvee_id,
    TO_CHAR(expiration_date, 'YYYY-MM'),
    category_level_3_structure,
    category_level_3_description,
    movement_value,
    expiration_date,
    document_number,
    COALESCE(installment, 1)
  FROM marvee_transactions
  WHERE source_type = 'despesa'
    AND status = 'pending'
    AND category_level_3_structure IS NOT NULL
    AND expiration_date IS NOT NULL
    AND (p_year IS NULL OR EXTRACT(YEAR FROM expiration_date) = p_year)
  ON CONFLICT (marvee_id, installment) DO UPDATE SET
    month = EXCLUDED.month,
    category_structure = EXCLUDED.category_structure,
    category_description = EXCLUDED.category_description,
    movement_value = EXCLUDED.movement_value,
    expiration_date = EXCLUDED.expiration_date,
    document_number = EXCLUDED.document_number;

  GET DIAGNOSTICS v_expenses_count = ROW_COUNT;

  INSERT INTO cash_flow_revenues (marvee_id, month, category_structure, category_description, movement_value, payment_date, document_number, installment)
  SELECT 
    marvee_id,
    TO_CHAR(payment_date, 'YYYY-MM'),
    category_level_3_structure,
    category_level_3_description,
    movement_value,
    payment_date,
    document_number,
    COALESCE(installment, 1)
  FROM marvee_transactions
  WHERE source_type = 'receita'
    AND status = 'paid'
    AND document_number IS NOT NULL
    AND document_number != ''
    AND category_level_3_structure IS NOT NULL
    AND payment_date IS NOT NULL
    AND (p_year IS NULL OR EXTRACT(YEAR FROM payment_date) = p_year)
  ON CONFLICT (marvee_id, installment) DO UPDATE SET
    month = EXCLUDED.month,
    category_structure = EXCLUDED.category_structure,
    category_description = EXCLUDED.category_description,
    movement_value = EXCLUDED.movement_value,
    payment_date = EXCLUDED.payment_date,
    document_number = EXCLUDED.document_number;

  GET DIAGNOSTICS v_revenues_count = ROW_COUNT;

  RETURN QUERY SELECT v_expenses_count, v_revenues_count, v_expenses_deleted, v_revenues_deleted;
END;
$function$;

CREATE OR REPLACE FUNCTION public.setup_primeiro_admin(p_email text, p_user_id uuid, p_nome text DEFAULT 'Administrador'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_colaborador_count integer;
  v_colaborador_id uuid;
  v_user_email text;
BEGIN
  p_email := lower(trim(coalesce(p_email, '')));
  p_nome := trim(coalesce(p_nome, ''));

  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_email = '' OR length(p_email) > 254 OR p_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' THEN
    RETURN false;
  END IF;

  IF p_nome = '' OR length(p_nome) > 120 THEN
    RETURN false;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL OR lower(v_user_email) <> p_email THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_colaborador_count FROM colaboradores;
  
  IF v_colaborador_count > 0 THEN
    RETURN false;
  END IF;
  
  INSERT INTO colaboradores (
    nome, email, cpf, area, funcao,
    data_inicio_contrato, remuneracao,
    is_admin, ativo, has_finance_access, user_id
  ) VALUES (
    p_nome,
    p_email,
    '00000000000',
    'Administração',
    'Administrador',
    CURRENT_DATE,
    0,
    true,
    true,
    true,
    p_user_id
  )
  RETURNING id INTO v_colaborador_id;
  
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'finance')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_colaborador_signup(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_colaborador RECORD;
  v_email text;
BEGIN
  v_email := lower(trim(coalesce(p_email, '')));

  IF v_email = '' OR length(v_email) > 254 OR v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_email');
  END IF;

  SELECT id, ativo, user_id INTO v_colaborador
  FROM colaboradores
  WHERE lower(email) = v_email;
  
  IF v_colaborador IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  IF v_colaborador.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_registered');
  END IF;
  
  IF NOT COALESCE(v_colaborador.ativo, false) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'inactive');
  END IF;
  
  RETURN jsonb_build_object('valid', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.vincular_user_colaborador(p_colaborador_email text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_colaborador_id uuid;
  v_user_email text;
  v_is_admin boolean;
  v_email text;
BEGIN
  v_email := lower(trim(coalesce(p_colaborador_email, '')));

  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_email = '' OR length(v_email) > 254 OR v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' THEN
    RETURN false;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_user_email IS NULL OR lower(v_email) != lower(v_user_email) THEN
    RAISE EXCEPTION 'Email não corresponde';
  END IF;
  
  SELECT id, is_admin INTO v_colaborador_id, v_is_admin
  FROM colaboradores
  WHERE lower(email) = v_email
    AND user_id IS NULL;
  
  IF v_colaborador_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE colaboradores
  SET user_id = p_user_id
  WHERE id = v_colaborador_id;
  
  IF v_is_admin = true THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_notas_fiscais_mes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_notas_fiscais_mes() TO authenticated;

REVOKE ALL ON FUNCTION public.aggregate_raw_to_detailed(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aggregate_raw_to_detailed(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.populate_cash_flow_tables(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.populate_cash_flow_tables(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.setup_primeiro_admin(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_primeiro_admin(text, uuid, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.validar_colaborador_signup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validar_colaborador_signup(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.vincular_user_colaborador(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vincular_user_colaborador(text, uuid) TO anon, authenticated;