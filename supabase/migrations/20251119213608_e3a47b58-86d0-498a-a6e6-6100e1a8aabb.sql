-- Tabela de colaboradores
CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  cnpj text,
  cpf text NOT NULL,
  endereco text,
  chave_pix_cnpj text,
  email text NOT NULL UNIQUE,
  data_inicio_contrato date NOT NULL,
  data_fim_contrato date,
  area text NOT NULL,
  remuneracao numeric(10,2) NOT NULL,
  funcao text NOT NULL,
  is_admin boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_colaboradores_email ON public.colaboradores(email);
CREATE INDEX idx_colaboradores_user_id ON public.colaboradores(user_id);
CREATE INDEX idx_colaboradores_ativo ON public.colaboradores(ativo);

-- Habilitar RLS
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (apenas admins)
CREATE POLICY "Admins podem ver todos os colaboradores"
ON public.colaboradores
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar colaboradores"
ON public.colaboradores
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar colaboradores"
ON public.colaboradores
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem excluir colaboradores"
ON public.colaboradores
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER handle_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Comentários nas colunas
COMMENT ON COLUMN public.colaboradores.user_id IS 'Vinculação com usuário de acesso (auth.users)';
COMMENT ON COLUMN public.colaboradores.is_admin IS 'Define se o colaborador terá acesso admin';
COMMENT ON COLUMN public.colaboradores.ativo IS 'Status ativo/inativo do colaborador';