-- Função para configurar o primeiro administrador do sistema
-- Só funciona se não existir nenhum colaborador cadastrado
CREATE OR REPLACE FUNCTION public.setup_primeiro_admin(
  p_email text,
  p_user_id uuid,
  p_nome text DEFAULT 'Administrador'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_colaborador_count integer;
  v_colaborador_id uuid;
BEGIN
  -- Verificar se já existe algum colaborador
  SELECT COUNT(*) INTO v_colaborador_count FROM colaboradores;
  
  -- Se já existe colaborador, não permitir
  IF v_colaborador_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Criar primeiro colaborador como admin
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
  
  -- Criar role admin
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Criar role finance
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, 'finance')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Função para verificar se é o primeiro acesso (sem colaboradores)
CREATE OR REPLACE FUNCTION public.is_first_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*) = 0 FROM colaboradores;
$$;