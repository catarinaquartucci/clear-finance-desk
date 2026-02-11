-- Criar bucket para fotos de equipamentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipamentos-fotos', 'equipamentos-fotos', true);

-- Políticas de acesso para o bucket
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de equipamentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'equipamentos-fotos');

CREATE POLICY "Usuários autenticados podem ver fotos de equipamentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'equipamentos-fotos');

CREATE POLICY "Usuários autenticados podem deletar fotos de equipamentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'equipamentos-fotos');

CREATE POLICY "Usuários autenticados podem atualizar fotos de equipamentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'equipamentos-fotos');

-- Criar tabela para metadados das fotos
CREATE TABLE public.equipamento_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.equipamento_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a tabela
CREATE POLICY "Usuários autenticados podem ver fotos de equipamentos"
ON public.equipamento_fotos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem inserir fotos de equipamentos"
ON public.equipamento_fotos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar fotos de equipamentos"
ON public.equipamento_fotos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar fotos de equipamentos"
ON public.equipamento_fotos FOR DELETE
TO authenticated
USING (true);