-- Tornar os buckets privados
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('reembolsos', 'devolucoes', 'notas-fiscais');

-- Criar políticas para acesso aos arquivos
-- Admins podem ver todos os arquivos
CREATE POLICY "Admins podem ver todos os arquivos de reembolsos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reembolsos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins podem ver todos os arquivos de devoluções"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'devolucoes' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins podem ver todos os arquivos de notas fiscais"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notas-fiscais' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Usuários podem ver apenas seus próprios arquivos
CREATE POLICY "Usuários podem ver seus arquivos de reembolsos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reembolsos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem ver seus arquivos de devoluções"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'devolucoes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem ver seus arquivos de notas fiscais"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notas-fiscais' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);