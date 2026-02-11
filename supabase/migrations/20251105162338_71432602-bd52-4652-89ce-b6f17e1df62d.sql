-- Adicionar políticas RLS de DELETE para administradores

-- Política DELETE para reembolsos
CREATE POLICY "Admins podem excluir reembolsos"
ON public.reembolsos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política DELETE para devoluções
CREATE POLICY "Admins podem excluir devoluções"
ON public.devolucoes
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política DELETE para materiais
CREATE POLICY "Admins podem excluir materiais"
ON public.materiais
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política DELETE para contratos finder fee
CREATE POLICY "Admins podem excluir contratos finder fee"
ON public.contratos_finder_fee
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política DELETE para notas fiscais
CREATE POLICY "Admins podem excluir notas fiscais"
ON public.notas_fiscais
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));