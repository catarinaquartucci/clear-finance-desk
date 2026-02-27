import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export const usePayablesReport = (dateFrom?: string, dateTo?: string, companyId?: string) => {
  return useQuery({
    queryKey: ["report-payables", dateFrom, dateTo, companyId],
    queryFn: async () => {
      let query = supabase
        .from("payables")
        .select("id, description, amount, due_date, status, payment_method, supplier_id, company_id, cost_center_id, suppliers:supplier_id(name), cost_centers:cost_center_id(name, code), group_companies:company_id(name)")
        .in("status", ["open", "overdue"]);
      if (dateFrom) query = query.gte("due_date", dateFrom);
      if (dateTo) query = query.lte("due_date", dateTo);
      if (companyId && companyId !== "all") query = query.eq("company_id", companyId);
      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useReceivablesReport = (dateFrom?: string, dateTo?: string, companyId?: string) => {
  return useQuery({
    queryKey: ["report-receivables", dateFrom, dateTo, companyId],
    queryFn: async () => {
      let query = supabase
        .from("receivables")
        .select("id, description, amount, due_date, status, customer_id, company_id, customers:customer_id(name), group_companies:company_id(name)")
        .in("status", ["open", "overdue"]);
      if (dateFrom) query = query.gte("due_date", dateFrom);
      if (dateTo) query = query.lte("due_date", dateTo);
      if (companyId && companyId !== "all") query = query.eq("company_id", companyId);
      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

export const usePaidReport = (dateFrom?: string, dateTo?: string, companyId?: string) => {
  return useQuery({
    queryKey: ["report-paid", dateFrom, dateTo, companyId],
    queryFn: async () => {
      let query = supabase
        .from("payables")
        .select("id, description, amount, due_date, paid_date, status, payment_method, supplier_id, company_id, cost_center_id, suppliers:supplier_id(name), cost_centers:cost_center_id(name, code), group_companies:company_id(name)")
        .eq("status", "paid");
      if (dateFrom) query = query.gte("paid_date", dateFrom);
      if (dateTo) query = query.lte("paid_date", dateTo);
      if (companyId && companyId !== "all") query = query.eq("company_id", companyId);
      const { data, error } = await query.order("paid_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCostCenterDashboard = (dateFrom?: string, dateTo?: string, companyId?: string) => {
  return useQuery({
    queryKey: ["report-cost-center-dashboard", dateFrom, dateTo, companyId],
    queryFn: async () => {
      let query = supabase
        .from("payables")
        .select("amount, status, cost_center_id, cost_centers:cost_center_id(id, name, code)")
        .not("cost_center_id", "is", null);
      if (dateFrom) query = query.gte("due_date", dateFrom);
      if (dateTo) query = query.lte("due_date", dateTo);
      if (companyId && companyId !== "all") query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;

      const map = new Map<string, { name: string; code: string; total: number; paid: number; open: number; count: number }>();
      (data || []).forEach((p: any) => {
        const ccid = p.cost_center_id;
        const existing = map.get(ccid) || { name: p.cost_centers?.name || "Sem nome", code: p.cost_centers?.code || "", total: 0, paid: 0, open: 0, count: 0 };
        const amt = Number(p.amount);
        existing.total += amt;
        existing.count++;
        if (p.status === "paid") existing.paid += amt;
        else existing.open += amt;
        map.set(ccid, existing);
      });

      return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total);
    },
  });
};

export const useMonthlyFlowReport = (year: number, companyId?: string) => {
  return useQuery({
    queryKey: ["report-monthly-flow", year, companyId],
    queryFn: async () => {
      let payQuery = supabase.from("payables").select("amount, status, due_date, paid_date, company_id")
        .gte("due_date", `${year}-01-01`).lte("due_date", `${year}-12-31`);
      let recQuery = supabase.from("receivables").select("amount, status, due_date, received_date, company_id")
        .gte("due_date", `${year}-01-01`).lte("due_date", `${year}-12-31`);
      if (companyId && companyId !== "all") {
        payQuery = payQuery.eq("company_id", companyId);
        recQuery = recQuery.eq("company_id", companyId);
      }
      const [{ data: payables }, { data: receivables }] = await Promise.all([payQuery, recQuery]);

      const months: Record<string, { month: string; receitas: number; despesas: number }> = {};
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, "0")}`;
        months[key] = { month: key, receitas: 0, despesas: 0 };
      }
      (payables || []).forEach((p: any) => {
        const m = p.due_date?.substring(0, 7);
        if (m && months[m]) months[m].despesas += Number(p.amount);
      });
      (receivables || []).forEach((r: any) => {
        const m = r.due_date?.substring(0, 7);
        if (m && months[m]) months[m].receitas += Number(r.amount);
      });
      return Object.values(months);
    },
  });
};

export const useTopSuppliersReport = (dateFrom?: string, dateTo?: string, companyId?: string) => {
  return useQuery({
    queryKey: ["report-top-suppliers", dateFrom, dateTo, companyId],
    queryFn: async () => {
      let query = supabase.from("payables").select("amount, status, supplier_id, suppliers:supplier_id(name)")
        .eq("status", "paid").not("supplier_id", "is", null);
      if (dateFrom) query = query.gte("paid_date", dateFrom);
      if (dateTo) query = query.lte("paid_date", dateTo);
      if (companyId && companyId !== "all") query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;

      const map = new Map<string, { name: string; total: number; count: number }>();
      (data || []).forEach((p: any) => {
        const sid = p.supplier_id;
        const existing = map.get(sid) || { name: (p.suppliers as any)?.name || "Sem nome", total: 0, count: 0 };
        existing.total += Number(p.amount);
        existing.count++;
        map.set(sid, existing);
      });
      return Array.from(map.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total).slice(0, 15);
    },
  });
};

export const useExecutiveSummary = (dateFrom?: string, dateTo?: string, companyId?: string) => {
  return useQuery({
    queryKey: ["report-executive-summary", dateFrom, dateTo, companyId],
    queryFn: async () => {
      let payQuery = supabase.from("payables").select("amount, status, due_date");
      let recQuery = supabase.from("receivables").select("amount, status, due_date");
      if (dateFrom) { payQuery = payQuery.gte("due_date", dateFrom); recQuery = recQuery.gte("due_date", dateFrom); }
      if (dateTo) { payQuery = payQuery.lte("due_date", dateTo); recQuery = recQuery.lte("due_date", dateTo); }
      if (companyId && companyId !== "all") { payQuery = payQuery.eq("company_id", companyId); recQuery = recQuery.eq("company_id", companyId); }
      const [{ data: payables }, { data: receivables }] = await Promise.all([payQuery, recQuery]);

      const totalPagar = (payables || []).filter((p: any) => p.status !== "paid" && p.status !== "cancelled").reduce((s: number, p: any) => s + Number(p.amount), 0);
      const totalReceber = (receivables || []).filter((r: any) => r.status !== "received" && r.status !== "cancelled").reduce((s: number, r: any) => s + Number(r.amount), 0);
      const totalVencido = (payables || []).filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + Number(p.amount), 0);
      const totalReceberVencido = (receivables || []).filter((r: any) => r.status === "overdue").reduce((s: number, r: any) => s + Number(r.amount), 0);
      const countPagar = (payables || []).filter((p: any) => p.status !== "cancelled").length;
      const countReceber = (receivables || []).filter((r: any) => r.status !== "cancelled").length;

      return {
        totalPagar,
        totalReceber,
        saldoLiquido: totalReceber - totalPagar,
        totalVencido,
        totalReceberVencido,
        taxaInadimplencia: totalPagar > 0 ? (totalVencido / totalPagar) * 100 : 0,
        ticketMedioPagar: countPagar > 0 ? totalPagar / countPagar : 0,
        ticketMedioReceber: countReceber > 0 ? totalReceber / countReceber : 0,
      };
    },
  });
};
