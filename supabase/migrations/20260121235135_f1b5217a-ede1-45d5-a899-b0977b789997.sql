-- ===========================================
-- REFATORAÇÃO: Estrutura de Dados Detalhados
-- ===========================================

-- 1. Tabela para DESPESAS (apenas status = 'pending')
CREATE TABLE public.cash_flow_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marvee_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  category_structure TEXT NOT NULL,
  category_description TEXT,
  movement_value NUMERIC NOT NULL DEFAULT 0,
  expiration_date DATE,
  document_number TEXT,
  installment INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(marvee_id, installment)
);

-- 2. Tabela para RECEITAS (status = 'paid' COM document_number)
CREATE TABLE public.cash_flow_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marvee_id INTEGER NOT NULL,
  month TEXT NOT NULL,
  category_structure TEXT NOT NULL,
  category_description TEXT,
  movement_value NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE,
  document_number TEXT NOT NULL,
  installment INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(marvee_id, installment)
);

-- 3. Índices para performance
CREATE INDEX idx_cash_flow_expenses_month ON public.cash_flow_expenses(month);
CREATE INDEX idx_cash_flow_expenses_category ON public.cash_flow_expenses(category_structure);
CREATE INDEX idx_cash_flow_revenues_month ON public.cash_flow_revenues(month);
CREATE INDEX idx_cash_flow_revenues_category ON public.cash_flow_revenues(category_structure);

-- 4. Habilitar RLS
ALTER TABLE public.cash_flow_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_revenues ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para cash_flow_expenses
CREATE POLICY "Finance users can read expenses" ON public.cash_flow_expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

CREATE POLICY "Finance users can insert expenses" ON public.cash_flow_expenses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

CREATE POLICY "Finance users can update expenses" ON public.cash_flow_expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

CREATE POLICY "Finance users can delete expenses" ON public.cash_flow_expenses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

-- 6. Políticas RLS para cash_flow_revenues
CREATE POLICY "Finance users can read revenues" ON public.cash_flow_revenues
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

CREATE POLICY "Finance users can insert revenues" ON public.cash_flow_revenues
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

CREATE POLICY "Finance users can update revenues" ON public.cash_flow_revenues
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

CREATE POLICY "Finance users can delete revenues" ON public.cash_flow_revenues
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'finance'))
  );

-- 7. Função para popular as tabelas a partir de marvee_transactions
CREATE OR REPLACE FUNCTION public.populate_cash_flow_tables(p_year INTEGER DEFAULT NULL)
RETURNS TABLE(expenses_count BIGINT, revenues_count BIGINT, expenses_deleted BIGINT, revenues_deleted BIGINT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expenses_deleted BIGINT;
  v_revenues_deleted BIGINT;
  v_expenses_count BIGINT;
  v_revenues_count BIGINT;
BEGIN
  -- Limpar tabelas (do ano específico ou todas)
  IF p_year IS NOT NULL THEN
    DELETE FROM cash_flow_expenses WHERE month LIKE p_year::TEXT || '-%';
    GET DIAGNOSTICS v_expenses_deleted = ROW_COUNT;
    
    DELETE FROM cash_flow_revenues WHERE month LIKE p_year::TEXT || '-%';
    GET DIAGNOSTICS v_revenues_deleted = ROW_COUNT;
  ELSE
    TRUNCATE cash_flow_expenses, cash_flow_revenues;
    v_expenses_deleted := 0;
    v_revenues_deleted := 0;
  END IF;

  -- Inserir DESPESAS: source_type = 'despesa' AND status = 'pending'
  INSERT INTO cash_flow_expenses (marvee_id, month, category_structure, category_description, movement_value, expiration_date, document_number, installment)
  SELECT 
    marvee_id,
    TO_CHAR(expiration_date, 'YYYY-MM'),
    category_level_3_structure,
    category_level_3_description,
    movement_value,
    expiration_date,
    document_number,
    COALESCE(installment, 1)
  FROM marvee_transactions
  WHERE source_type = 'despesa'
    AND status = 'pending'
    AND category_level_3_structure IS NOT NULL
    AND expiration_date IS NOT NULL
    AND (p_year IS NULL OR EXTRACT(YEAR FROM expiration_date) = p_year)
  ON CONFLICT (marvee_id, installment) DO UPDATE SET
    month = EXCLUDED.month,
    category_structure = EXCLUDED.category_structure,
    category_description = EXCLUDED.category_description,
    movement_value = EXCLUDED.movement_value,
    expiration_date = EXCLUDED.expiration_date,
    document_number = EXCLUDED.document_number;

  GET DIAGNOSTICS v_expenses_count = ROW_COUNT;

  -- Inserir RECEITAS: source_type = 'receita' AND status = 'paid' AND document_number NOT NULL/EMPTY
  INSERT INTO cash_flow_revenues (marvee_id, month, category_structure, category_description, movement_value, payment_date, document_number, installment)
  SELECT 
    marvee_id,
    TO_CHAR(payment_date, 'YYYY-MM'),
    category_level_3_structure,
    category_level_3_description,
    movement_value,
    payment_date,
    document_number,
    COALESCE(installment, 1)
  FROM marvee_transactions
  WHERE source_type = 'receita'
    AND status = 'paid'
    AND document_number IS NOT NULL
    AND document_number != ''
    AND category_level_3_structure IS NOT NULL
    AND payment_date IS NOT NULL
    AND (p_year IS NULL OR EXTRACT(YEAR FROM payment_date) = p_year)
  ON CONFLICT (marvee_id, installment) DO UPDATE SET
    month = EXCLUDED.month,
    category_structure = EXCLUDED.category_structure,
    category_description = EXCLUDED.category_description,
    movement_value = EXCLUDED.movement_value,
    payment_date = EXCLUDED.payment_date,
    document_number = EXCLUDED.document_number;

  GET DIAGNOSTICS v_revenues_count = ROW_COUNT;

  RETURN QUERY SELECT v_expenses_count, v_revenues_count, v_expenses_deleted, v_revenues_deleted;
END;
$$;

-- 8. View unificada para consultas no frontend
CREATE OR REPLACE VIEW public.cash_flow_detailed_view AS
-- Despesas agregadas por mês e categoria
SELECT 
  month,
  category_structure,
  MAX(category_description) as category_description,
  'despesa'::TEXT as source_type,
  SUM(movement_value) as total_value,
  COUNT(*) as transaction_count
FROM public.cash_flow_expenses
GROUP BY month, category_structure

UNION ALL

-- Receitas agregadas por mês e categoria
SELECT 
  month,
  category_structure,
  MAX(category_description) as category_description,
  'receita'::TEXT as source_type,
  SUM(movement_value) as total_value,
  COUNT(*) as transaction_count
FROM public.cash_flow_revenues
GROUP BY month, category_structure;