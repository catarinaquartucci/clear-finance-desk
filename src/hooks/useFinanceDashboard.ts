import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";

const VANTARI_ID = "3d37326f-bedc-4a16-b81f-0213c826d423";

// Helper to apply optional company_id filter
const applyCompanyFilter = (query: any, companyId: string, column = "company_id") => {
  if (companyId && companyId !== "all") {
    return query.eq(column, companyId);
  }
  return query;
};

export interface PayableAlert {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  supplier_name?: string;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  fill: string;
}

export interface BankAccountDetail {
  name: string;
  bank_name: string;
  current_balance: number;
}

export interface TransactionDetail {
  description: string;
  amount: number;
  date: string;
}

export interface ProjecaoDetail {
  saldoAtual: number;
  receitaPrevista: number;
  despesaPrevista: number;
  projecaoCaixa: number;
}

const EXPENSE_COLORS = [
  "#0ea5e9", "#f97316", "#8b5cf6", "#10b981", "#ef4444",
  "#ec4899", "#f59e0b", "#6366f1", "#14b8a6", "#e11d48",
  "#84cc16", "#06b6d4", "#a855f7", "#d946ef",
];

export const useFinanceDashboard = (companyId: string = "all") => {
  const effectiveCompanyId = companyId || "all";
  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const in7Days = format(addDays(today, 7), "yyyy-MM-dd");
  const in30Days = format(addDays(today, 30), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["finance-dashboard", monthStart],
    queryFn: async () => {
      // 1. Bank accounts balance + detail
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("name, bank_name, current_balance")
        .eq("company_id", VANTARI_ID)
        .eq("active", true);

      const bankAccountsDetail: BankAccountDetail[] = (accounts || []).map(a => ({
        name: a.name,
        bank_name: a.bank_name,
        current_balance: Number(a.current_balance || 0),
      }));

      const saldoAtual = bankAccountsDetail.reduce(
        (sum, a) => sum + a.current_balance, 0
      );

      // 2. Get Vantari account IDs for transactions
      const { data: accountIds } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("company_id", VANTARI_ID);

      const ids = (accountIds || []).map(a => a.id);

      let entradasMes = 0;
      let saidasMes = 0;
      let entradasDetail: TransactionDetail[] = [];
      let saidasDetail: TransactionDetail[] = [];

      if (ids.length > 0) {
        const { data: txns } = await supabase
          .from("bank_transactions")
          .select("amount, type, description, date")
          .in("bank_account_id", ids)
          .gte("date", monthStart)
          .lte("date", monthEnd);

        (txns || []).forEach(t => {
          const desc = (t.description || "").toUpperCase();
          if (desc.includes("SALDO") || desc.includes("RENDIMENTO")) return;
          if (t.type === "credit") {
            const amt = Number(t.amount || 0);
            entradasMes += amt;
            entradasDetail.push({ description: t.description, amount: amt, date: t.date });
          } else {
            const amt = Math.abs(Number(t.amount || 0));
            saidasMes += amt;
            saidasDetail.push({ description: t.description, amount: amt, date: t.date });
          }
        });
      }

      // Sort by date desc
      entradasDetail.sort((a, b) => b.date.localeCompare(a.date));
      saidasDetail.sort((a, b) => b.date.localeCompare(a.date));

      // 3. Payable alerts: overdue + due in 7 days
      const { data: alertPayables } = await supabase
        .from("payables")
        .select("id, description, amount, due_date, status, supplier_id, suppliers:supplier_id(name)")
        .eq("company_id", VANTARI_ID)
        .in("status", ["open", "overdue"])
        .lte("due_date", in7Days)
        .order("due_date", { ascending: true });

      const payableAlerts: PayableAlert[] = (alertPayables || []).map((p: any) => ({
        id: p.id,
        description: p.description,
        amount: Number(p.amount),
        due_date: p.due_date,
        status: p.due_date < todayStr ? "overdue" : "upcoming",
        supplier_name: p.suppliers?.name || undefined,
      }));

      const totalVencido = payableAlerts
        .filter(p => p.status === "overdue")
        .reduce((s, p) => s + p.amount, 0);
      const totalAVencer = payableAlerts
        .filter(p => p.status === "upcoming")
        .reduce((s, p) => s + p.amount, 0);

      // 4. Expense composition (current month payables by notes)
      const { data: monthPayables } = await supabase
        .from("payables")
        .select("amount, notes")
        .eq("company_id", VANTARI_ID)
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd);

      const categoryMap = new Map<string, number>();
      (monthPayables || []).forEach(p => {
        const cat = (p.notes || "Sem categoria").trim();
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(p.amount || 0));
      });

      const expenseComposition: ExpenseCategory[] = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value], i) => ({
          name,
          value,
          fill: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
        }));

      // 5. Cash projection (30 days)
      const { data: openReceivables } = await supabase
        .from("receivables")
        .select("amount")
        .eq("status", "open")
        .gte("due_date", todayStr)
        .lte("due_date", in30Days);

      const { data: openPayables } = await supabase
        .from("payables")
        .select("amount")
        .eq("company_id", VANTARI_ID)
        .in("status", ["open", "overdue"])
        .lte("due_date", in30Days);

      const receitaPrevista = (openReceivables || []).reduce(
        (s, r) => s + Number(r.amount || 0), 0
      );
      const despesaPrevista = (openPayables || []).reduce(
        (s, p) => s + Number(p.amount || 0), 0
      );
      const projecaoCaixa = saldoAtual + receitaPrevista - despesaPrevista;

      const projecaoDetail: ProjecaoDetail = {
        saldoAtual,
        receitaPrevista,
        despesaPrevista,
        projecaoCaixa,
      };

      return {
        saldoAtual,
        entradasMes,
        saidasMes,
        projecaoCaixa,
        payableAlerts,
        totalVencido,
        totalAVencer,
        expenseComposition,
        bankAccountsDetail,
        entradasDetail,
        saidasDetail,
        projecaoDetail,
      };
    },
    refetchInterval: 5 * 60 * 1000, // 5 min
  });
};
