-- Criar tabela de contratos finder fee
CREATE TABLE contratos_finder_fee (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome_razao_social text NOT NULL,
  cpf_cnpj text NOT NULL,
  email text NOT NULL,
  email_testemunha text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_contratos_finder_fee_user_id ON contratos_finder_fee(user_id);
CREATE INDEX idx_contratos_finder_fee_status ON contratos_finder_fee(status);

-- Habilitar RLS
ALTER TABLE contratos_finder_fee ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem criar seus próprios contratos
CREATE POLICY "Usuários podem criar contratos finder fee"
  ON contratos_finder_fee
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver seus próprios contratos OU admins podem ver todos
CREATE POLICY "Usuários podem ver seus próprios contratos finder fee"
  ON contratos_finder_fee
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar contratos
CREATE POLICY "Admins podem atualizar contratos finder fee"
  ON contratos_finder_fee
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER handle_contratos_finder_fee_updated_at
  BEFORE UPDATE ON contratos_finder_fee
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();