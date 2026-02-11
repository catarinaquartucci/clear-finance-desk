-- Create table for nota fiscal attachments
CREATE TABLE public.nota_fiscal_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_fiscal_id uuid NOT NULL REFERENCES public.notas_fiscais(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nota_fiscal_anexos ENABLE ROW LEVEL SECURITY;

-- Users can insert attachments for their own notas fiscais
CREATE POLICY "Usuários podem criar anexos para suas notas fiscais"
ON public.nota_fiscal_anexos
FOR INSERT
WITH CHECK (
  nota_fiscal_id IN (
    SELECT id FROM public.notas_fiscais WHERE user_id = auth.uid()
  )
);

-- Users can view attachments of their own notas fiscais, admins can view all
CREATE POLICY "Usuários podem ver anexos das suas notas fiscais"
ON public.nota_fiscal_anexos
FOR SELECT
USING (
  nota_fiscal_id IN (
    SELECT id FROM public.notas_fiscais WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete attachments
CREATE POLICY "Admins podem excluir anexos de notas fiscais"
ON public.nota_fiscal_anexos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));