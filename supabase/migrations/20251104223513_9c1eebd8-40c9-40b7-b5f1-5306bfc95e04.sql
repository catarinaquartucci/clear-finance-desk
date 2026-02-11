-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Função de verificação de role (SECURITY DEFINER para evitar recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tabela de reembolsos
CREATE TABLE public.reembolsos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  motivo TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  centro_custo TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo_chave_pix TEXT NOT NULL,
  comprovante_url TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'pago')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de devoluções
CREATE TABLE public.devolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_cliente TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  motivo TEXT NOT NULL,
  numero_nota TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  comprovante_original_url TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'pago')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notas fiscais
CREATE TABLE public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  periodo_referencia TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  nota_url TEXT NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  tipo_conta TEXT NOT NULL,
  chave_pix TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'pago')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reembolsos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para reembolsos
CREATE POLICY "Usuários podem criar reembolsos"
  ON public.reembolsos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios reembolsos"
  ON public.reembolsos FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar reembolsos"
  ON public.reembolsos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para devoluções
CREATE POLICY "Usuários podem criar devoluções"
  ON public.devolucoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas próprias devoluções"
  ON public.devolucoes FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar devoluções"
  ON public.devolucoes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para notas fiscais
CREATE POLICY "Usuários podem criar notas fiscais"
  ON public.notas_fiscais FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver suas próprias notas fiscais"
  ON public.notas_fiscais FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar notas fiscais"
  ON public.notas_fiscais FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('reembolsos', 'reembolsos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
  ('devolucoes', 'devolucoes', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']),
  ('notas-fiscais', 'notas-fiscais', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']);

-- Políticas de Storage para reembolsos
CREATE POLICY "Usuários autenticados podem fazer upload de reembolsos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reembolsos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Todos podem visualizar arquivos de reembolsos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reembolsos');

-- Políticas de Storage para devoluções
CREATE POLICY "Usuários autenticados podem fazer upload de devoluções"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'devolucoes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Todos podem visualizar arquivos de devoluções"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'devolucoes');

-- Políticas de Storage para notas fiscais
CREATE POLICY "Usuários autenticados podem fazer upload de notas fiscais"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'notas-fiscais' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Todos podem visualizar arquivos de notas fiscais"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'notas-fiscais');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reembolsos_updated_at
  BEFORE UPDATE ON public.reembolsos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_devolucoes_updated_at
  BEFORE UPDATE ON public.devolucoes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();