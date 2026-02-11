-- Função RPC segura para vincular user_id ao colaborador
CREATE OR REPLACE FUNCTION public.vincular_user_colaborador(
  p_colaborador_email text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_colaborador_id uuid;
  v_user_email text;
BEGIN
  -- Buscar email do usuário autenticado
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Verificar se os emails correspondem (segurança!)
  IF lower(p_colaborador_email) != lower(v_user_email) THEN
    RAISE EXCEPTION 'Email não corresponde';
  END IF;
  
  -- Buscar colaborador com esse email que ainda não tem user_id
  SELECT id INTO v_colaborador_id
  FROM colaboradores
  WHERE lower(email) = lower(p_colaborador_email) 
    AND user_id IS NULL;
  
  IF v_colaborador_id IS NULL THEN
    RETURN false; -- Colaborador não encontrado ou já vinculado
  END IF;
  
  -- Vincular user_id ao colaborador
  UPDATE colaboradores
  SET user_id = p_user_id
  WHERE id = v_colaborador_id;
  
  RETURN true;
END;
$$;