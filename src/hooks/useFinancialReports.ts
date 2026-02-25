import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface AgingRow {
  id: string;
  description: string;
  entity_name: string | null;
  amount: number;
  due_date: string;
  days_overdue: number;
  bucket: AgingBucket;
  type: "payable" | "receivable";
}

export interface DRERow {
  label: string;
  realized: number;
  projected: number;
  isBold?: boolean;
  isResult?: boolean;
  indent?: number;
}

export interface EntityReport {
  id: string;
  name: string;
  total_paid: number;
  total_open: number;
  total_overdue: number;
  count: number;
}

export interface CostCenterReport {
  id: string;
  code: string;
  name: string;
  total_expenses: number;
  total_paid: number;
  total_open: number;
  count: number;
}

// ========== Aging Report ==========
export const useAgingReport = () => {
  const payablesQuery = useQuery({
    queryKey: ["report-aging-payables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("id, description, amount, due_date, status, supplier_id, suppliers:supplier_id(name)")
        .in("status", ["open", "overdue"]);
      if (error) throw error;
      return data;
    },
  });

  const receivablesQuery = useQuery({
    queryKey: ["report-aging-receivables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("id, description, amount, due_date, status, customer_id, customers:customer_id(name)")
        .in("status", ["open", "overdue"]);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: AgingRow[] = [];

    const getBucket = (daysOverdue: number): AgingBucket => {
      if (daysOverdue <= 0) return "current";
      if (daysOverdue <= 30) return "1-30";
      if (daysOverdue <= 60) return "31-60";
      if (daysOverdue <= 90) return "61-90";
      return "90+";
    };

    (payablesQuery.data || []).forEach((p: any) => {
      const due = new Date(p.due_date + "T00:00:00");
      const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
      result.push({
        id: p.id,
        description: p.description,
        entity_name: p.suppliers?.name || null,
        amount: Number(p.amount),
        due_date: p.due_date,
        days_overdue: diff,
        bucket: getBucket(diff),
        type: "payable",
      });
    });

    (receivablesQuery.data || []).forEach((r: any) => {
      const due = new Date(r.due_date + "T00:00:00");
      const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
      result.push({
        id: r.id,
        description: r.description,
        entity_name: r.customers?.name || null,
        amount: Number(r.amount),
        due_date: r.due_date,
        days_overdue: diff,
        bucket: getBucket(diff),
        type: "receivable",
      });
    });

    return result.sort((a, b) => b.days_overdue - a.days_overdue);
  }, [payablesQuery.data, receivablesQuery.data]);

  const summary = useMemo(() => {
    const buckets: Record<AgingBucket, { payable: number; receivable: number }> = {
      current: { payable: 0, receivable: 0 },
      "1-30": { payable: 0, receivable: 0 },
      "31-60": { payable: 0, receivable: 0 },
      "61-90": { payable: 0, receivable: 0 },
      "90+": { payable: 0, receivable: 0 },
    };
    rows.forEach((r) => {
      buckets[r.bucket][r.type] += r.amount;
    });
    return buckets;
  }, [rows]);

  return {
    rows,
    summary,
    isLoading: payablesQuery.isLoading || receivablesQuery.isLoading,
  };
};

// ========== DRE (simplified) ==========
export const useDREReport = (year: number) => {
  const payablesQuery = useQuery({
    queryKey: ["report-dre-payables", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("amount, status, due_date, paid_date")
        .gte("due_date", `${year}-01-01`)
        .lte("due_date", `${year}-12-31`);
      if (error) throw error;
      return data;
    },
  });

  const receivablesQuery = useQuery({
    queryKey: ["report-dre-receivables", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("amount, status, due_date, received_date")
        .gte("due_date", `${year}-01-01`)
        .lte("due_date", `${year}-12-31`);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo((): DRERow[] => {
    const payables = payablesQuery.data || [];
    const receivables = receivablesQuery.data || [];

    const totalRevenuePaid = receivables
      .filter((r) => r.status === "received")
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalRevenueOpen = receivables
      .filter((r) => r.status !== "received" && r.status !== "cancelled")
      .reduce((s, r) => s + Number(r.amount), 0);

    const totalExpensePaid = payables
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenseOpen = payables
      .filter((p) => p.status !== "paid" && p.status !== "cancelled")
      .reduce((s, p) => s + Number(p.amount), 0);

    const taxRate = 0.087;
    const taxRealized = totalRevenuePaid * taxRate;
    const taxProjected = totalRevenueOpen * taxRate;

    const netRealized = totalRevenuePaid - totalExpensePaid - taxRealized;
    const netProjected = totalRevenueOpen - totalExpenseOpen - taxProjected;

    return [
      { label: "Receita Bruta", realized: totalRevenuePaid, projected: totalRevenueOpen, isBold: true },
      { label: "(-) Deduções / Impostos", realized: -taxRealized, projected: -taxProjected, indent: 1 },
      { label: "= Receita Líquida", realized: totalRevenuePaid - taxRealized, projected: totalRevenueOpen - taxProjected, isBold: true, isResult: true },
      { label: "(-) Despesas Operacionais", realized: -totalExpensePaid, projected: -totalExpenseOpen, indent: 1 },
      { label: "= Resultado Operacional", realized: netRealized, projected: netProjected, isBold: true, isResult: true },
      {
        label: "Margem Líquida (%)",
        realized: totalRevenuePaid > 0 ? (netRealized / totalRevenuePaid) * 100 : 0,
        projected: totalRevenueOpen > 0 ? (netProjected / totalRevenueOpen) * 100 : 0,
        isBold: true,
      },
    ];
  }, [payablesQuery.data, receivablesQuery.data]);

  return { rows, isLoading: payablesQuery.isLoading || receivablesQuery.isLoading };
};

// ========== Report by Supplier ==========
export const useSupplierReport = () => {
  return useQuery({
    queryKey: ["report-by-supplier"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("amount, status, supplier_id, suppliers:supplier_id(id, name)")
        .not("supplier_id", "is", null);
      if (error) throw error;

      const map = new Map<string, EntityReport>();
      (data || []).forEach((p: any) => {
        const sid = p.supplier_id;
        const existing = map.get(sid) || {
          id: sid,
          name: p.suppliers?.name || "Sem nome",
          total_paid: 0,
          total_open: 0,
          total_overdue: 0,
          count: 0,
        };
        existing.count++;
        const amt = Number(p.amount);
        if (p.status === "paid") existing.total_paid += amt;
        else if (p.status === "overdue") existing.total_overdue += amt;
        else existing.total_open += amt;
        map.set(sid, existing);
      });

      return Array.from(map.values()).sort((a, b) => (b.total_paid + b.total_open) - (a.total_paid + a.total_open));
    },
  });
};

// ========== Report by Customer ==========
export const useCustomerReport = () => {
  return useQuery({
    queryKey: ["report-by-customer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("amount, status, customer_id, customers:customer_id(id, name)")
        .not("customer_id", "is", null);
      if (error) throw error;

      const map = new Map<string, EntityReport>();
      (data || []).forEach((r: any) => {
        const cid = r.customer_id;
        const existing = map.get(cid) || {
          id: cid,
          name: r.customers?.name || "Sem nome",
          total_paid: 0,
          total_open: 0,
          total_overdue: 0,
          count: 0,
        };
        existing.count++;
        const amt = Number(r.amount);
        if (r.status === "received") existing.total_paid += amt;
        else if (r.status === "overdue") existing.total_overdue += amt;
        else existing.total_open += amt;
        map.set(cid, existing);
      });

      return Array.from(map.values()).sort((a, b) => (b.total_paid + b.total_open) - (a.total_paid + a.total_open));
    },
  });
};

// ========== Report by Cost Center ==========
export const useCostCenterReport = () => {
  return useQuery({
    queryKey: ["report-by-cost-center"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("amount, status, cost_center_id, cost_centers:cost_center_id(id, code, name)")
        .not("cost_center_id", "is", null);
      if (error) throw error;

      const map = new Map<string, CostCenterReport>();
      (data || []).forEach((p: any) => {
        const ccid = p.cost_center_id;
        const existing = map.get(ccid) || {
          id: ccid,
          code: p.cost_centers?.code || "",
          name: p.cost_centers?.name || "Sem nome",
          total_expenses: 0,
          total_paid: 0,
          total_open: 0,
          count: 0,
        };
        existing.count++;
        const amt = Number(p.amount);
        existing.total_expenses += amt;
        if (p.status === "paid") existing.total_paid += amt;
        else existing.total_open += amt;
        map.set(ccid, existing);
      });

      return Array.from(map.values()).sort((a, b) => b.total_expenses - a.total_expenses);
    },
  });
};
