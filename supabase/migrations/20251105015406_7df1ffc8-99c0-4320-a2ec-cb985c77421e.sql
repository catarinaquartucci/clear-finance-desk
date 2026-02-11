-- Corrigir função RPC para buscar notas fiscais do mês com email dos usuários
CREATE OR REPLACE FUNCTION public.get_notas_fiscais_mes()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nome text,
  email text,
  valor numeric,
  created_at timestamptz,
  periodo_referencia text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é admin
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
$$;