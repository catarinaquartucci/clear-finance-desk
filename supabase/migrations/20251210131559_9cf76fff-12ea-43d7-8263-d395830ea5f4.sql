-- Adicionar campos para separar receitas: novas vendas vs recorrentes de meses anteriores
ALTER TABLE monthly_planning
ADD COLUMN revenue_new_sales numeric DEFAULT 0,
ADD COLUMN revenue_recurring_previous numeric DEFAULT 0;

COMMENT ON COLUMN monthly_planning.revenue_new_sales IS 'Receita de novas vendas realizadas no mês';
COMMENT ON COLUMN monthly_planning.revenue_recurring_previous IS 'Receita de parcelas recorrentes de meses anteriores';