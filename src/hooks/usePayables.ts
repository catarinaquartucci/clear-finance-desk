import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    updatePayable: updatePayable.mutate,
    deletePayable: deletePayable.mutate,
    markAsPaid: markAsPaid.mutate,
    isCreating: createPayable.isPending,
  };
};
