-- 1. Corrigir situação da Sandy imediatamente
INSERT INTO user_roles (user_id, role)
VALUES ('b835c522-1d53-4ec6-89cb-bdfef0a0b4c6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Atualizar função vincular_user_colaborador para criar role automaticamente
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
  v_is_admin boolean;
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
  SELECT id, is_admin INTO v_colaborador_id, v_is_admin
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
  
  -- Se colaborador é admin, criar role em user_roles
  IF v_is_admin = true THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN true;
END;
$$;