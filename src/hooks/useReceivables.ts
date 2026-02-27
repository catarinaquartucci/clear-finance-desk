import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Receivable {
  id: string;
  customer_id: string | null;
  description: string;
  amount: number;
  due_date: string;
  received_date: string | null;
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
  customer?: { id: string; name: string; document: string | null } | null;
  cost_center?: { id: string; name: string; code: string } | null;
}

export interface ReceivableInsert {
  customer_id?: string | null;
  description: string;
  amount: number;
  due_date: string;
  received_date?: string | null;
  status?: string;
  chart_account_id?: string | null;
  cost_center_id?: string | null;
  bank_account_id?: string | null;
  installment_number?: number;
  installment_total?: number;
  payment_method?: string | null;
  notes?: string | null;
}

export const useReceivables = (statusFilter?: string, companyId?: string) => {
  const queryClient = useQueryClient();

  const { data: receivables, isLoading } = useQuery({
    queryKey: ["receivables", statusFilter, companyId],
    queryFn: async () => {
      let query = supabase
        .from("receivables")
        .select(`
          *,
          customer:customers(id, name, document),
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
      return data as Receivable[];
    },
  });

  const createReceivable = useMutation({
    mutationFn: async (receivable: ReceivableInsert) => {
      const { data, error } = await supabase
        .from("receivables")
        .insert(receivable)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta a receber criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar: " + error.message);
    },
  });

  const updateReceivable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReceivableInsert> & { id: string }) => {
      const { error } = await supabase
        .from("receivables")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteReceivable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receivables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const markAsReceived = useMutation({
    mutationFn: async ({ id, received_date, payment_method, bank_account_id }: {
      id: string;
      received_date: string;
      payment_method?: string;
      bank_account_id?: string;
    }) => {
      const { error } = await supabase
        .from("receivables")
        .update({ status: "received", received_date, payment_method, bank_account_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Recebimento confirmado!");
    },
    onError: (error) => {
      toast.error("Erro ao dar baixa: " + error.message);
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const stats = {
    overdue: receivables?.filter(r => r.status === "open" && r.due_date < today).length ?? 0,
    dueToday: receivables?.filter(r => r.status === "open" && r.due_date === today).length ?? 0,
    dueThisWeek: receivables?.filter(r => r.status === "open" && r.due_date >= today && r.due_date <= nextWeek).length ?? 0,
    totalOpen: receivables?.filter(r => r.status === "open").reduce((s, r) => s + Number(r.amount), 0) ?? 0,
    totalOverdue: receivables?.filter(r => r.status === "open" && r.due_date < today).reduce((s, r) => s + Number(r.amount), 0) ?? 0,
  };

  return {
    receivables,
    isLoading,
    stats,
    createReceivable: createReceivable.mutate,
    updateReceivable: updateReceivable.mutate,
    deleteReceivable: deleteReceivable.mutate,
    markAsReceived: markAsReceived.mutate,
    isCreating: createReceivable.isPending,
  };
};
