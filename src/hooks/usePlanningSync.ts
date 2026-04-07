import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const VANTARI_ID = "3d37326f-bedc-4a16-b81f-0213c826d423";

// Helper to apply optional company_id filter
const applyCompanyFilter = (query: any, companyId: string, column = "company_id") => {
  if (companyId && companyId !== "all") {
    return query.eq(column, companyId);
  }
  return query;
};

interface MonthlyAggregation {
  month: string;
  expense: number;        // payables paid
  planned_expense: number; // payables open
  revenue: number;         // bank credits (aportes)
}

export const usePlanningSync = (companyId: string = "all") => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncPlanningData = async (
    upsertBatch: (plannings: { month: string; expense?: number; planned_expense?: number; revenue?: number }[]) => Promise<any>
  ) => {
    setIsSyncing(true);
    try {
      const effectiveId = companyId || "all";
      // 1. Fetch payables
      let payQuery = supabase
        .from("payables")
        .select("amount, due_date, status, company_id");
      payQuery = applyCompanyFilter(payQuery, effectiveId);
      const { data: payables, error: payErr } = await payQuery;

      if (payErr) throw payErr;

      // 2. Fetch credit bank transactions (aportes) - excluding SALDO and RENDIMENTOS
      let bankQuery = supabase
        .from("bank_accounts")
        .select("id");
      bankQuery = applyCompanyFilter(bankQuery, effectiveId);
      const { data: bankAccounts } = await bankQuery;

      const accountIds = (bankAccounts || []).map(a => a.id);

      let credits: { amount: number; date: string }[] = [];
      if (accountIds.length > 0) {
        const { data: txns, error: txErr } = await supabase
          .from("bank_transactions")
          .select("amount, date, description, type")
          .in("bank_account_id", accountIds)
          .eq("type", "credit");

        if (txErr) throw txErr;

        credits = (txns || []).filter(t => {
          const desc = (t.description || "").toUpperCase();
          return !desc.includes("SALDO") && !desc.includes("RENDIMENTO");
        });
      }

      // 3. Aggregate by month
      const monthMap = new Map<string, MonthlyAggregation>();

      const getOrCreate = (month: string): MonthlyAggregation => {
        if (!monthMap.has(month)) {
          monthMap.set(month, { month, expense: 0, planned_expense: 0, revenue: 0 });
        }
        return monthMap.get(month)!;
      };

      // Aggregate payables by due_date month
      (payables || []).forEach(p => {
        const month = p.due_date.substring(0, 7) + "-01"; // yyyy-MM-01
        const agg = getOrCreate(month);
        if (p.status === "paid") {
          agg.expense += Number(p.amount) || 0;
        } else {
          agg.planned_expense += Number(p.amount) || 0;
        }
      });

      // Aggregate bank credits by date month
      credits.forEach(c => {
        const month = c.date.substring(0, 7) + "-01";
        const agg = getOrCreate(month);
        agg.revenue += Number(c.amount) || 0;
      });

      // 4. Upsert batch
      const plannings = Array.from(monthMap.values()).map(agg => ({
        month: agg.month,
        expense: agg.expense,
        planned_expense: agg.planned_expense,
        revenue: agg.revenue,
      }));

      if (plannings.length === 0) {
        toast.info("Nenhum dado encontrado para sincronizar.");
        return;
      }

      await upsertBatch(plannings);
      toast.success(`Planejamento sincronizado: ${plannings.length} meses atualizados.`);
    } catch (error: any) {
      toast.error("Erro ao sincronizar: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncPlanningData, isSyncing };
};
