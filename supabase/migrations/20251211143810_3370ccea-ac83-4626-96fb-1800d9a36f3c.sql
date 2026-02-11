-- Criar tabela de rascunhos
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'reembolso', 'devolucao', 'nota_fiscal', 'material'
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX idx_drafts_type ON public.drafts(type);
CREATE UNIQUE INDEX idx_drafts_user_type ON public.drafts(user_id, type);

-- Habilitar RLS
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuário só pode gerenciar seus próprios rascunhos
CREATE POLICY "Users can view own drafts" 
  ON public.drafts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own drafts" 
  ON public.drafts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" 
  ON public.drafts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" 
  ON public.drafts FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();