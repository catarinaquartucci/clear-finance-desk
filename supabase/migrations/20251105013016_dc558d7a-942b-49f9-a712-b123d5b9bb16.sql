-- Criar tabela de materiais
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_solicitante TEXT NOT NULL,
  material TEXT NOT NULL,
  centro_custo TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem criar materiais"
ON public.materiais
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios materiais"
ON public.materiais
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar materiais"
ON public.materiais
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_materiais_updated_at
BEFORE UPDATE ON public.materiais
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();