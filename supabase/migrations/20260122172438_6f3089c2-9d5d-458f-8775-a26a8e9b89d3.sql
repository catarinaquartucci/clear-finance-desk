-- ===========================================
-- ATUALIZAR POLÍTICAS RLS PARA INCLUIR VIEWER ROLES
-- ===========================================

-- ============================================
-- MÓDULO FINANCEIRO - Adicionar finance_viewer
-- ============================================

-- 1. cash_flow_data
DROP POLICY IF EXISTS "Users with finance access can read cash flow data" ON cash_flow_data;
CREATE POLICY "Users with finance access can read cash flow data" ON cash_flow_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role])
    )
  );

-- 2. cash_flow_data_detailed
DROP POLICY IF EXISTS "Users with finance access can read detailed data" ON cash_flow_data_detailed;
CREATE POLICY "Users with finance access can read detailed data" ON cash_flow_data_detailed
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role])
    )
  );

-- 3. cash_flow_revenues
DROP POLICY IF EXISTS "Finance users can read revenues" ON cash_flow_revenues;
CREATE POLICY "Finance users can read revenues" ON cash_flow_revenues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role])
    )
  );

-- 4. cash_flow_expenses
DROP POLICY IF EXISTS "Finance users can read expenses" ON cash_flow_expenses;
CREATE POLICY "Finance users can read expenses" ON cash_flow_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin'::app_role, 'finance'::app_role, 'finance_viewer'::app_role])
    )
  );

-- 5. transactions
DROP POLICY IF EXISTS "Admin e Finance podem ver transactions" ON transactions;
CREATE POLICY "Admin e Finance podem ver transactions" ON transactions
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 6. goals
DROP POLICY IF EXISTS "Admin e Finance podem ver goals" ON goals;
CREATE POLICY "Admin e Finance podem ver goals" ON goals
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 7. tax_rules
DROP POLICY IF EXISTS "Admin e Finance podem ver tax_rules" ON tax_rules;
CREATE POLICY "Admin e Finance podem ver tax_rules" ON tax_rules
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 8. sales_targets
DROP POLICY IF EXISTS "Admin e Finance podem ver sales_targets" ON sales_targets;
CREATE POLICY "Admin e Finance podem ver sales_targets" ON sales_targets
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 9. sales_target_monthly (tabela relacionada)
DROP POLICY IF EXISTS "Admin e Finance podem ver sales_target_monthly" ON sales_target_monthly;
CREATE POLICY "Admin e Finance podem ver sales_target_monthly" ON sales_target_monthly
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 10. scenarios
DROP POLICY IF EXISTS "Admin e Finance podem ver scenarios" ON scenarios;
CREATE POLICY "Admin e Finance podem ver scenarios" ON scenarios
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 11. monthly_targets
DROP POLICY IF EXISTS "Admin e Finance podem ver monthly_targets" ON monthly_targets;
CREATE POLICY "Admin e Finance podem ver monthly_targets" ON monthly_targets
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 12. monthly_planning
DROP POLICY IF EXISTS "Admin e Finance podem ver monthly_planning" ON monthly_planning;
CREATE POLICY "Admin e Finance podem ver monthly_planning" ON monthly_planning
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 13. marvee_sync_logs
DROP POLICY IF EXISTS "Admin e Finance podem ver sync logs" ON marvee_sync_logs;
CREATE POLICY "Admin e Finance podem ver sync logs" ON marvee_sync_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 14. marvee_category_mapping
DROP POLICY IF EXISTS "Admin e Finance podem ver mapeamentos" ON marvee_category_mapping;
CREATE POLICY "Admin e Finance podem ver mapeamentos" ON marvee_category_mapping
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 15. director_bonus_config
DROP POLICY IF EXISTS "Finance users can view director_bonus_config" ON director_bonus_config;
CREATE POLICY "Finance users can view director_bonus_config" ON director_bonus_config
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 16. transaction_categories
DROP POLICY IF EXISTS "Admin e Finance podem ver transaction_categories" ON transaction_categories;
CREATE POLICY "Admin e Finance podem ver transaction_categories" ON transaction_categories
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 17. financial_periods
DROP POLICY IF EXISTS "Admin e Finance podem ver financial_periods" ON financial_periods;
CREATE POLICY "Admin e Finance podem ver financial_periods" ON financial_periods
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 18. financial_config
DROP POLICY IF EXISTS "Admin e Finance podem ver financial_config" ON financial_config;
CREATE POLICY "Admin e Finance podem ver financial_config" ON financial_config
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- 19. marvee_transactions (se existir política)
DROP POLICY IF EXISTS "Admin e Finance podem ver marvee_transactions" ON marvee_transactions;
CREATE POLICY "Admin e Finance podem ver marvee_transactions" ON marvee_transactions
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );

-- ============================================
-- MÓDULO ADMIN - Adicionar admin_viewer
-- ============================================

-- 1. colaboradores
DROP POLICY IF EXISTS "Admins podem ver todos os colaboradores" ON colaboradores;
CREATE POLICY "Admins e viewers podem ver todos os colaboradores" ON colaboradores
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 2. equipamentos
DROP POLICY IF EXISTS "Admins podem ver equipamentos" ON equipamentos;
CREATE POLICY "Admins e viewers podem ver equipamentos" ON equipamentos
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 3. automation_config
DROP POLICY IF EXISTS "Admins can view automations" ON automation_config;
CREATE POLICY "Admins e viewers podem ver automations" ON automation_config
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 4. colaborador_documentos
DROP POLICY IF EXISTS "Admins podem ver documentos" ON colaborador_documentos;
CREATE POLICY "Admins e viewers podem ver documentos" ON colaborador_documentos
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 5. colaborador_notas
DROP POLICY IF EXISTS "Admins podem ver notas" ON colaborador_notas;
CREATE POLICY "Admins e viewers podem ver notas" ON colaborador_notas
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 6. equipamento_fotos - já tem política permissiva para autenticados

-- 7. reembolsos - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver seus próprios reembolsos" ON reembolsos;
CREATE POLICY "Usuários podem ver seus próprios reembolsos" ON reembolsos
  FOR SELECT USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 8. devolucoes - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver suas próprias devoluções" ON devolucoes;
CREATE POLICY "Usuários podem ver suas próprias devoluções" ON devolucoes
  FOR SELECT USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 9. materiais - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver seus próprios materiais" ON materiais;
CREATE POLICY "Usuários podem ver seus próprios materiais" ON materiais
  FOR SELECT USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 10. notas_fiscais - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notas fiscais" ON notas_fiscais;
CREATE POLICY "Usuários podem ver suas próprias notas fiscais" ON notas_fiscais
  FOR SELECT USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 11. reembolso_anexos - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver anexos dos seus reembolsos" ON reembolso_anexos;
CREATE POLICY "Usuários podem ver anexos dos seus reembolsos" ON reembolso_anexos
  FOR SELECT USING (
    reembolso_id IN (SELECT id FROM reembolsos WHERE user_id = auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 12. devolucao_anexos - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver anexos das suas devoluções" ON devolucao_anexos;
CREATE POLICY "Usuários podem ver anexos das suas devoluções" ON devolucao_anexos
  FOR SELECT USING (
    devolucao_id IN (SELECT id FROM devolucoes WHERE user_id = auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );

-- 13. nota_fiscal_anexos - atualizar para incluir admin_viewer
DROP POLICY IF EXISTS "Usuários podem ver anexos das suas notas fiscais" ON nota_fiscal_anexos;
CREATE POLICY "Usuários podem ver anexos das suas notas fiscais" ON nota_fiscal_anexos
  FOR SELECT USING (
    nota_fiscal_id IN (SELECT id FROM notas_fiscais WHERE user_id = auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'admin_viewer'::app_role)
  );