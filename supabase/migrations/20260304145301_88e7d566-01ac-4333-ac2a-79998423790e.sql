
-- Fix equipamento_fotos INSERT RLS: restrict to admins only
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fotos de equipamentos" ON public.equipamento_fotos;

CREATE POLICY "Admins podem inserir fotos de equipamentos"
ON public.equipamento_fotos
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
