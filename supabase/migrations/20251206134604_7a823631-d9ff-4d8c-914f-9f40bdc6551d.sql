-- Função para validar se um colaborador pode se cadastrar
-- Retorna informações sobre a validade do email para signup
CREATE OR REPLACE FUNCTION public.validar_colaborador_signup(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_colaborador RECORD;
BEGIN
  -- Buscar colaborador pelo email
  SELECT id, ativo, user_id INTO v_colaborador
  FROM colaboradores
  WHERE lower(email) = lower(p_email);
  
  -- Colaborador não encontrado
  IF v_colaborador IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  -- Colaborador já tem conta vinculada
  IF v_colaborador.user_id IS NOT NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_registered');
  END IF;
  
  -- Colaborador está inativo
  IF NOT COALESCE(v_colaborador.ativo, false) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'inactive');
  END IF;
  
  -- Tudo ok, pode se cadastrar
  RETURN jsonb_build_object('valid', true);
END;
$$;