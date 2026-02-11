
-- Criar novos enums
CREATE TYPE period_status AS ENUM ('open', 'closed');
CREATE TYPE goal_type AS ENUM ('sales_volume', 'sales_value', 'net_margin_percentage');
CREATE TYPE tax_regime AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');
CREATE TYPE transaction_type AS ENUM ('revenue', 'expense', 'tax');

-- Criar tabelas

-- financial_periods
CREATE TABLE public.financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status period_status DEFAULT 'open',
  initial_cash_balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- monthly_planning
CREATE TABLE public.monthly_planning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  revenue numeric DEFAULT 0,
  other_revenue numeric DEFAULT 0,
  forecast_revenue numeric DEFAULT 0,
  expense numeric DEFAULT 0,
  other_expense numeric DEFAULT 0,
  forecast_expense numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  distribution numeric DEFAULT 0,
  initial_balance numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- monthly_targets
CREATE TABLE public.monthly_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  revenue_target numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- sales_targets
CREATE TABLE public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  monthly_target numeric DEFAULT 0,
  target_ml_percentage numeric DEFAULT 15,
  cash_sale_percentage numeric DEFAULT 30,
  recurring_sale_percentage numeric DEFAULT 70,
  recurring_installments integer DEFAULT 12,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- sales_target_monthly
CREATE TABLE public.sales_target_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_target_id uuid NOT NULL REFERENCES public.sales_targets(id) ON DELETE CASCADE,
  month date NOT NULL,
  monthly_target numeric DEFAULT 0,
  achieved_value numeric DEFAULT 0,
  cash_achieved numeric DEFAULT 0,
  recurring_achieved numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  type goal_type NOT NULL,
  target_value numeric NOT NULL,
  achieved_value numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- scenarios
CREATE TABLE public.scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  name text NOT NULL,
  revenue_change_percent numeric DEFAULT 0,
  expense_change_percent numeric DEFAULT 0,
  time_horizon_months integer DEFAULT 6,
  projected_revenue numeric,
  projected_expenses numeric,
  projected_taxes numeric,
  projected_net_margin numeric,
  projected_cash_balance numeric,
  ai_analysis text,
  ai_recommendations jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- tax_rules
CREATE TABLE public.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  regime tax_regime NOT NULL,
  aliquot_percentage numeric NOT NULL,
  min_revenue numeric DEFAULT 0,
  max_revenue numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- transaction_categories
CREATE TABLE public.transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type transaction_type NOT NULL,
  color text DEFAULT '#6366f1',
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.financial_periods(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  description text,
  amount numeric NOT NULL,
  date date NOT NULL,
  is_forecast boolean DEFAULT true,
  is_recurring boolean DEFAULT false,
  recurring_interval text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_target_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para financial_periods
CREATE POLICY "Admin e Finance podem ver financial_periods" ON public.financial_periods FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir financial_periods" ON public.financial_periods FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar financial_periods" ON public.financial_periods FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir financial_periods" ON public.financial_periods FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para monthly_planning
CREATE POLICY "Admin e Finance podem ver monthly_planning" ON public.monthly_planning FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir monthly_planning" ON public.monthly_planning FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar monthly_planning" ON public.monthly_planning FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir monthly_planning" ON public.monthly_planning FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para monthly_targets
CREATE POLICY "Admin e Finance podem ver monthly_targets" ON public.monthly_targets FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir monthly_targets" ON public.monthly_targets FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar monthly_targets" ON public.monthly_targets FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir monthly_targets" ON public.monthly_targets FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para sales_targets
CREATE POLICY "Admin e Finance podem ver sales_targets" ON public.sales_targets FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir sales_targets" ON public.sales_targets FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar sales_targets" ON public.sales_targets FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir sales_targets" ON public.sales_targets FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para sales_target_monthly
CREATE POLICY "Admin e Finance podem ver sales_target_monthly" ON public.sales_target_monthly FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir sales_target_monthly" ON public.sales_target_monthly FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar sales_target_monthly" ON public.sales_target_monthly FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir sales_target_monthly" ON public.sales_target_monthly FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para goals
CREATE POLICY "Admin e Finance podem ver goals" ON public.goals FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir goals" ON public.goals FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar goals" ON public.goals FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir goals" ON public.goals FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para scenarios
CREATE POLICY "Admin e Finance podem ver scenarios" ON public.scenarios FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir scenarios" ON public.scenarios FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar scenarios" ON public.scenarios FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir scenarios" ON public.scenarios FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para tax_rules
CREATE POLICY "Admin e Finance podem ver tax_rules" ON public.tax_rules FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir tax_rules" ON public.tax_rules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar tax_rules" ON public.tax_rules FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir tax_rules" ON public.tax_rules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para transaction_categories
CREATE POLICY "Admin e Finance podem ver transaction_categories" ON public.transaction_categories FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir transaction_categories" ON public.transaction_categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar transaction_categories" ON public.transaction_categories FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir transaction_categories" ON public.transaction_categories FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para transactions
CREATE POLICY "Admin e Finance podem ver transactions" ON public.transactions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem inserir transactions" ON public.transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin e Finance podem atualizar transactions" ON public.transactions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance'::app_role));
CREATE POLICY "Admin pode excluir transactions" ON public.transactions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_financial_periods_updated_at BEFORE UPDATE ON public.financial_periods FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_monthly_planning_updated_at BEFORE UPDATE ON public.monthly_planning FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_monthly_targets_updated_at BEFORE UPDATE ON public.monthly_targets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON public.sales_targets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_sales_target_monthly_updated_at BEFORE UPDATE ON public.sales_target_monthly FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_tax_rules_updated_at BEFORE UPDATE ON public.tax_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
