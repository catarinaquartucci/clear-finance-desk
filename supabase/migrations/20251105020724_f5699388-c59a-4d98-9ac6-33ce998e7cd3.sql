-- Tornar chave_pix obrigatória (NOT NULL)
ALTER TABLE notas_fiscais 
ALTER COLUMN chave_pix SET NOT NULL,
ALTER COLUMN chave_pix SET DEFAULT '';

-- Tornar campos bancários opcionais (para manter compatibilidade com dados antigos)
ALTER TABLE notas_fiscais 
ALTER COLUMN banco DROP NOT NULL,
ALTER COLUMN agencia DROP NOT NULL,
ALTER COLUMN conta DROP NOT NULL,
ALTER COLUMN tipo_conta DROP NOT NULL;