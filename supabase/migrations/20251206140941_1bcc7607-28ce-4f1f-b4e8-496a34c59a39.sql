-- Tabela de anexos para reembolsos
CREATE TABLE reembolso_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reembolso_id uuid NOT NULL REFERENCES reembolsos(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS para reembolso_anexos
ALTER TABLE reembolso_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver anexos dos seus reembolsos"
  ON reembolso_anexos FOR SELECT
  USING (
    reembolso_id IN (
      SELECT id FROM reembolsos WHERE user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Usuários podem criar anexos para seus reembolsos"
  ON reembolso_anexos FOR INSERT
  WITH CHECK (
    reembolso_id IN (
      SELECT id FROM reembolsos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem excluir anexos de reembolsos"
  ON reembolso_anexos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índice
CREATE INDEX idx_reembolso_anexos_reembolso_id ON reembolso_anexos(reembolso_id);

-- Tabela de anexos para devoluções
CREATE TABLE devolucao_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucao_id uuid NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  arquivo_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS para devolucao_anexos
ALTER TABLE devolucao_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver anexos das suas devoluções"
  ON devolucao_anexos FOR SELECT
  USING (
    devolucao_id IN (
      SELECT id FROM devolucoes WHERE user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Usuários podem criar anexos para suas devoluções"
  ON devolucao_anexos FOR INSERT
  WITH CHECK (
    devolucao_id IN (
      SELECT id FROM devolucoes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem excluir anexos de devoluções"
  ON devolucao_anexos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índice
CREATE INDEX idx_devolucao_anexos_devolucao_id ON devolucao_anexos(devolucao_id);

-- Permitir null no comprovante_url existente (para retrocompatibilidade)
ALTER TABLE reembolsos ALTER COLUMN comprovante_url DROP NOT NULL;
ALTER TABLE devolucoes ALTER COLUMN comprovante_original_url DROP NOT NULL;