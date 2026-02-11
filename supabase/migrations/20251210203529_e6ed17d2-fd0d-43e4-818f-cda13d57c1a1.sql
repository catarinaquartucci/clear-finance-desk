-- Create equipamentos table for equipment management
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  patrimonio TEXT,
  estado TEXT NOT NULL DEFAULT 'bom',
  data_aquisicao DATE,
  valor NUMERIC,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage equipment
CREATE POLICY "Admins podem ver equipamentos"
ON public.equipamentos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar equipamentos"
ON public.equipamentos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar equipamentos"
ON public.equipamentos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem excluir equipamentos"
ON public.equipamentos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_equipamentos_updated_at
BEFORE UPDATE ON public.equipamentos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();