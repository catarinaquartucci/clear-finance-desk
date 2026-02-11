-- Criar tabela de documentos do colaborador
CREATE TABLE public.colaborador_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL,
  arquivo_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de notas do colaborador
CREATE TABLE public.colaborador_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.colaborador_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_notas ENABLE ROW LEVEL SECURITY;

-- Políticas para documentos (apenas admins)
CREATE POLICY "Admins podem ver documentos" ON public.colaborador_documentos
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar documentos" ON public.colaborador_documentos
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem excluir documentos" ON public.colaborador_documentos
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para notas (apenas admins)
CREATE POLICY "Admins podem ver notas" ON public.colaborador_notas
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar notas" ON public.colaborador_notas
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar notas" ON public.colaborador_notas
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem excluir notas" ON public.colaborador_notas
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at nas notas
CREATE TRIGGER update_colaborador_notas_updated_at
BEFORE UPDATE ON public.colaborador_notas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Criar bucket de storage para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('colaboradores-docs', 'colaboradores-docs', false);

-- Políticas de storage (apenas admins)
CREATE POLICY "Admins podem ver documentos de colaboradores"
ON storage.objects FOR SELECT
USING (bucket_id = 'colaboradores-docs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem fazer upload de documentos de colaboradores"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'colaboradores-docs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem excluir documentos de colaboradores"
ON storage.objects FOR DELETE
USING (bucket_id = 'colaboradores-docs' AND has_role(auth.uid(), 'admin'::app_role));