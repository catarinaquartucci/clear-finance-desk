import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addMonths, format } from "date-fns";

export interface Payable {
  id: string;
  supplier_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  chart_account_id: string | null;
  cost_center_id: string | null;
  bank_account_id: string | null;
  installment_number: number;
  installment_total: number;
  payment_method: string | null;
  notes: string | null;
  recurring_expense_id: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string; document: string | null } | null;
  cost_center?: { id: string; name: string; code: string } | null;
}

export interface PayableInsert {
  supplier_id?: string | null;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  status?: string;
  chart_account_id?: string | null;
  cost_center_id?: string | null;
  bank_account_id?: string | null;
  installment_number?: number;
  installment_total?: number;
  payment_method?: string | null;
  notes?: string | null;
  recurring_expense_id?: string | null;
}

export interface RecurringExpenseInput {
  description: string;
  amount: number;
  supplier_id: string | null;
  cost_center_id: string | null;
  bank_account_id: string | null;
  chart_account_id: string | null;
  company_id: string | null;
  payment_method: string | null;
  day_of_month: number;
  total_months: number;
  start_date: string;
  notes: string | null;
}

export const usePayables = (statusFilter?: string, companyId?: string) => {
  const queryClient = useQueryClient();

  const { data: payables, isLoading } = useQuery({
    queryKey: ["payables", statusFilter, companyId],
    queryFn: async () => {
      let query = supabase
        .from("payables")
        .select(`
          *,
          supplier:suppliers(id, name, document),
          cost_center:cost_centers(id, name, code)
        `)
        .order("due_date", { ascending: true });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (companyId && companyId !== "all") {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payable[];
    },
  });

  const createPayable = useMutation({
    mutationFn: async (payable: PayableInsert) => {
      const { data, error } = await supabase
        .from("payables")
        .insert(payable)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta a pagar criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar: " + error.message);
    },
  });

  const createRecurringExpense = useMutation({
    mutationFn: async (input: RecurringExpenseInput) => {
      // 1. Create recurring_expenses record
      const startDate = new Date(input.start_date + "T12:00:00");
      const endDate = addMonths(startDate, input.total_months - 1);

      const { data: recurring, error: recError } = await supabase
        .from("recurring_expenses" as any)
        .insert({
          description: input.description,
          amount: input.amount,
          supplier_id: input.supplier_id,
          cost_center_id: input.cost_center_id,
          bank_account_id: input.bank_account_id,
          chart_account_id: input.chart_account_id,
          company_id: input.company_id,
          payment_method: input.payment_method,
          day_of_month: input.day_of_month,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          total_months: input.total_months,
        })
        .select()
        .single();

      if (recError) throw recError;

      // 2. Generate all payables
      const payables: any[] = [];
      for (let i = 0; i < input.total_months; i++) {
        const d = addMonths(startDate, i);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const day = Math.min(input.day_of_month, lastDay);
        d.setDate(day);

        payables.push({
          description: input.description,
          amount: input.amount,
          due_date: format(d, "yyyy-MM-dd"),
          supplier_id: input.supplier_id,
          cost_center_id: input.cost_center_id,
          bank_account_id: input.bank_account_id,
          chart_account_id: input.chart_account_id,
          company_id: input.company_id,
          payment_method: input.payment_method,
          notes: input.notes,
          installment_number: i + 1,
          installment_total: input.total_months,
          recurring_expense_id: (recurring as any).id,
          status: "open",
        });
      }

      const { error: payError } = await supabase
        .from("payables")
        .insert(payables as any);

      if (payError) throw payError;

      return { count: payables.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success(`${data.count} contas a pagar geradas com sucesso!`);
    },
    onError: (error) => {
      toast.error("Erro ao gerar recorrência: " + error.message);
    },
  });

  const updatePayable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PayableInsert> & { id: string }) => {
      const { error } = await supabase
        .from("payables")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deletePayable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, paid_date, payment_method, bank_account_id }: {
      id: string;
      paid_date: string;
      payment_method?: string;
      bank_account_id?: string;
    }) => {
      const { error } = await supabase
        .from("payables")
        .update({ status: "paid", paid_date, payment_method, bank_account_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta marcada como paga!");
    },
    onError: (error) => {
      toast.error("Erro ao dar baixa: " + error.message);
    },
  });

  // Summary stats
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const stats = {
    overdue: payables?.filter(p => p.status === "open" && p.due_date < today).length ?? 0,
    dueToday: payables?.filter(p => p.status === "open" && p.due_date === today).length ?? 0,
    dueThisWeek: payables?.filter(p => p.status === "open" && p.due_date >= today && p.due_date <= nextWeek).length ?? 0,
    totalOpen: payables?.filter(p => p.status === "open").reduce((s, p) => s + Number(p.amount), 0) ?? 0,
    totalOverdue: payables?.filter(p => p.status === "open" && p.due_date < today).reduce((s, p) => s + Number(p.amount), 0) ?? 0,
  };

  return {
    payables,
    isLoading,
    stats,
    createPayable: createPayable.mutate,
    createRecurringExpense: createRecurringExpense.mutate,
    updatePayable: updatePayable.mutate,
    deletePayable: deletePayable.mutate,
    markAsPaid: markAsPaid.mutate,
    isCreating: createPayable.isPending,
    isCreatingRecurring: createRecurringExpense.isPending,
  };
};
