-- Criar tabela de categorias do fluxo de caixa
CREATE TABLE public.cash_flow_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense', 'distribution', 'balance')),
  parent_code TEXT,
  sort_order INTEGER NOT NULL,
  is_calculated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE cash_flow_categories ENABLE ROW LEVEL SECURITY;

-- Política de leitura para usuários autenticados
CREATE POLICY "Authenticated users can read cash flow categories"
ON cash_flow_categories FOR SELECT TO authenticated USING (true);

-- Inserir categorias padrão baseadas na imagem de referência
INSERT INTO cash_flow_categories (code, name, type, parent_code, sort_order, is_calculated) VALUES
-- Saldo Inicial
('00', 'Saldo Inicial', 'balance', NULL, 0, true),
-- Receitas Operacionais
('01', 'Receitas Operacionais', 'revenue', NULL, 100, true),
('01.01', 'Outras Receitas', 'revenue', '01', 101, false),
('01.02', 'Aquisição', 'revenue', '01', 102, false),
('01.03', 'Expansão', 'revenue', '01', 103, false),
-- Despesas Operacionais
('02', 'Despesas Operacionais', 'expense', NULL, 200, true),
('02.01', 'Impostos', 'expense', '02', 201, false),
('02.02', 'Prestação de Serviço', 'expense', '02', 202, false),
('02.03', 'Salários, Encargos e Pessoal', 'expense', '02', 203, false),
('02.07', 'Financeiro', 'expense', '02', 207, false),
('02.08', 'Produto/CS', 'expense', '02', 208, false),
('02.09', 'Parcerias', 'expense', '02', 209, false),
('02.10', 'Vendas', 'expense', '02', 210, false),
('02.12', 'Marketing', 'expense', '02', 212, false),
('02.13', 'Operação', 'expense', '02', 213, false),
-- Geração de Caixa Operacional (calculado)
('GCO', 'Geração de Caixa Operacional', 'balance', NULL, 300, true),
-- Receitas Não Operacionais
('03', 'Receitas Não Operacionais', 'revenue', NULL, 400, true),
('03.01', 'Outras Receitas Não Op.', 'revenue', '03', 401, false),
-- Despesas Não Operacionais
('04', 'Despesas Não Operacionais', 'expense', NULL, 500, true),
('04.01', 'Outras Despesas Não Op.', 'expense', '04', 501, false),
-- Distribuição de Lucros
('05', 'Distribuição de Lucros', 'distribution', NULL, 600, true),
('05.01', 'Distribuição', 'distribution', '05', 601, false),
-- Geração de Caixa do Período (calculado)
('GCP', 'Geração de Caixa do Período', 'balance', NULL, 700, true),
-- Saldo Final (calculado)
('SF', 'Saldo Final', 'balance', NULL, 800, true);

-- Criar tabela de dados do fluxo de caixa
CREATE TABLE public.cash_flow_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  category_code TEXT NOT NULL REFERENCES cash_flow_categories(code),
  realized_value NUMERIC DEFAULT 0,
  projected_value NUMERIC DEFAULT 0,
  notes TEXT,
  synced_from TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(month, category_code)
);

-- Habilitar RLS
ALTER TABLE cash_flow_data ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados (finance ou admin)
CREATE POLICY "Users with finance access can read cash flow data"
ON cash_flow_data FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
  )
);

CREATE POLICY "Users with finance access can insert cash flow data"
ON cash_flow_data FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
  )
);

CREATE POLICY "Users with finance access can update cash flow data"
ON cash_flow_data FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
  )
);

CREATE POLICY "Users with finance access can delete cash flow data"
ON cash_flow_data FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'finance')
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cash_flow_data_updated_at
BEFORE UPDATE ON cash_flow_data
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_cash_flow_data_month ON cash_flow_data(month);
CREATE INDEX idx_cash_flow_data_category ON cash_flow_data(category_code);
CREATE INDEX idx_cash_flow_categories_parent ON cash_flow_categories(parent_code);
CREATE INDEX idx_cash_flow_categories_sort ON cash_flow_categories(sort_order);