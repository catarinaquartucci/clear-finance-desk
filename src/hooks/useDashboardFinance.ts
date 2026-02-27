import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface DashboardKPIs {
  totalRevenue: number;
  totalExpense: number;
  cashGeneration: number;
  netMargin: number;
  targetAchievement: number;
  finalBalance: number;
  overduePayables: number;
  overdueReceivables: number;
  openPayables: number;
  openReceivables: number;
}

export interface DashboardMonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

export interface CostCenterItem {
  name: string;
  value: number;
}

export interface RecentItem {
  id: string;
  type: "payable" | "receivable";
  description: string;
  amount: number;
  due_date: string;
  status: string;
  entity_name?: string;
}

export const useDashboardFinance = (companyId?: string) => {
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const today = new Date().toISOString().split("T")[0];

  const payablesQuery = useQuery({
    queryKey: ["dashboard-payables", year, companyId],
    queryFn: async () => {
      let q = supabase
        .from("payables")
        .select("id, description, amount, due_date, status, paid_date, cost_center_id, company_id, supplier_id, suppliers:supplier_id(name), cost_centers:cost_center_id(name)")
        .gte("due_date", startDate)
        .lte("due_date", endDate);
      if (companyId && companyId !== "all") q = q.eq("company_id", companyId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const receivablesQuery = useQuery({
    queryKey: ["dashboard-receivables", year, companyId],
    queryFn: async () => {
      let q = supabase
        .from("receivables")
        .select("id, description, amount, due_date, status, received_date, company_id, customer_id, customers:customer_id(name)")
        .gte("due_date", startDate)
        .lte("due_date", endDate);
      if (companyId && companyId !== "all") q = q.eq("company_id", companyId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const monthlyTargetsQuery = useQuery({
    queryKey: ["dashboard-monthly-targets", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .select("month, revenue_target")
        .gte("month", startDate)
        .lte("month", endDate);
      if (error) throw error;
      return data || [];
    },
  });

  const result = useMemo(() => {
    const payables = payablesQuery.data || [];
    const receivables = receivablesQuery.data || [];
    const targets = monthlyTargetsQuery.data || [];

    // KPIs
    const totalRevenue = receivables
      .filter((r: any) => r.status === "received")
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const totalExpense = payables
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const cashGeneration = totalRevenue - totalExpense;
    const netMargin = totalRevenue > 0 ? (cashGeneration / totalRevenue) * 100 : 0;

    const totalTarget = targets.reduce((sum: number, t: any) => sum + Number(t.revenue_target || 0), 0);
    const targetAchievement = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

    const overduePayables = payables.filter((p: any) => p.status === "overdue" || (p.status === "open" && p.due_date < today)).length;
    const overdueReceivables = receivables.filter((r: any) => r.status === "overdue" || (r.status === "open" && r.due_date < today)).length;
    const openPayables = payables.filter((p: any) => p.status === "open").length;
    const openReceivables = receivables.filter((r: any) => r.status === "open").length;

    const openReceivableAmount = receivables
      .filter((r: any) => r.status === "open")
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    const openPayableAmount = payables
      .filter((p: any) => p.status === "open")
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const finalBalance = cashGeneration + openReceivableAmount - openPayableAmount;

    const kpis: DashboardKPIs = {
      totalRevenue,
      totalExpense,
      cashGeneration,
      netMargin,
      targetAchievement,
      finalBalance,
      overduePayables,
      overdueReceivables,
      openPayables,
      openReceivables,
    };

    // Monthly data
    const monthlyData: DashboardMonthlyData[] = MONTH_LABELS.map((label, idx) => {
      const monthStr = `${year}-${String(idx + 1).padStart(2, "0")}`;

      const revenue = receivables
        .filter((r: any) => r.status === "received" && (r.received_date || r.due_date).startsWith(monthStr))
        .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

      const expenses = payables
        .filter((p: any) => p.status === "paid" && (p.paid_date || p.due_date).startsWith(monthStr))
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return { month: label, revenue, expenses };
    });

    // Cost center data
    const costCenterMap: Record<string, number> = {};
    payables
      .filter((p: any) => p.status === "paid")
      .forEach((p: any) => {
        const name = (p.cost_centers as any)?.name || "Sem centro de custo";
        costCenterMap[name] = (costCenterMap[name] || 0) + Number(p.amount);
      });
    const costCenterData: CostCenterItem[] = Object.entries(costCenterMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Recent items
    const recentPayables: RecentItem[] = payables
      .sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        type: "payable" as const,
        description: p.description,
        amount: Number(p.amount),
        due_date: p.due_date,
        status: p.status,
        entity_name: (p.suppliers as any)?.name,
      }));

    const recentReceivables: RecentItem[] = receivables
      .sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .slice(0, 5)
      .map((r: any) => ({
        id: r.id,
        type: "receivable" as const,
        description: r.description,
        amount: Number(r.amount),
        due_date: r.due_date,
        status: r.status,
        entity_name: (r.customers as any)?.name,
      }));

    const recentItems = [...recentPayables, ...recentReceivables]
      .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .slice(0, 10);

    return { kpis, monthlyData, costCenterData, recentItems };
  }, [payablesQuery.data, receivablesQuery.data, monthlyTargetsQuery.data, today, year]);

  return {
    ...result,
    isLoading: payablesQuery.isLoading || receivablesQuery.isLoading || monthlyTargetsQuery.isLoading,
  };
};
