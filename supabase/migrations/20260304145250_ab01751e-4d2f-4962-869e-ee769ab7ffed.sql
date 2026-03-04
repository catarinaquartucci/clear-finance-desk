
-- Fix equipamento_fotos RLS: restrict DELETE/UPDATE to admins only
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fotos de equipamentos" ON public.equipamento_fotos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar fotos de equipamentos" ON public.equipamento_fotos;

CREATE POLICY "Admins podem atualizar fotos de equipamentos"
ON public.equipamento_fotos
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar fotos de equipamentos"
ON public.equipamento_fotos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
