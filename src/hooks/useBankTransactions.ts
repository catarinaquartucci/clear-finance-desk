import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  balance: number | null;
  reference: string | null;
  conciliated: boolean;
  conciliated_with_type: string | null;
  conciliated_with_id: string | null;
  conciliated_at: string | null;
  import_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransactionInsert {
  bank_account_id: string;
  date: string;
  description: string;
  amount: number;
  type?: string;
  balance?: number | null;
  reference?: string | null;
  import_hash?: string | null;
}

export const useBankTransactions = (bankAccountId?: string, month?: string) => {
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["bank-transactions", bankAccountId, month],
    queryFn: async () => {
      if (!bankAccountId) return [];
      let query = supabase
        .from("bank_transactions")
        .select("*")
        .eq("bank_account_id", bankAccountId)
        .order("date", { ascending: false });

      if (month) {
        const start = `${month}-01`;
        const endDate = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0);
        const end = endDate.toISOString().split("T")[0];
        query = query.gte("date", start).lte("date", end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!bankAccountId,
  });

  const importTransactions = useMutation({
    mutationFn: async (rows: BankTransactionInsert[]) => {
      // Insert in batches, skip duplicates via import_hash unique index
      const batchSize = 100;
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from("bank_transactions")
          .upsert(batch, { onConflict: "import_hash", ignoreDuplicates: true })
          .select();
        if (error) throw error;
        inserted += data?.length ?? 0;
      }
      skipped = rows.length - inserted;
      return { inserted, skipped };
    },
    onSuccess: ({ inserted, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success(`${inserted} lançamento(s) importado(s)${skipped > 0 ? `, ${skipped} duplicado(s) ignorado(s)` : ""}`);
    },
    onError: (error) => {
      toast.error("Erro na importação: " + error.message);
    },
  });

  const conciliate = useMutation({
    mutationFn: async ({ transactionId, withType, withId }: {
      transactionId: string;
      withType: string;
      withId: string;
    }) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update({
          conciliated: true,
          conciliated_with_type: withType,
          conciliated_with_id: withId,
          conciliated_at: new Date().toISOString(),
        })
        .eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success("Conciliação realizada!");
    },
    onError: (error) => {
      toast.error("Erro ao conciliar: " + error.message);
    },
  });

  const unconciliate = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update({
          conciliated: false,
          conciliated_with_type: null,
          conciliated_with_id: null,
          conciliated_at: null,
        })
        .eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success("Conciliação desfeita!");
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const stats = {
    total: transactions?.length ?? 0,
    conciliated: transactions?.filter(t => t.conciliated).length ?? 0,
    pending: transactions?.filter(t => !t.conciliated).length ?? 0,
    bankBalance: transactions?.[0]?.balance ?? null,
    totalCredits: transactions?.filter(t => t.type === "credit").reduce((s, t) => s + Math.abs(Number(t.amount)), 0) ?? 0,
    totalDebits: transactions?.filter(t => t.type === "debit").reduce((s, t) => s + Math.abs(Number(t.amount)), 0) ?? 0,
  };

  return {
    transactions,
    isLoading,
    stats,
    importTransactions: importTransactions.mutate,
    isImporting: importTransactions.isPending,
    conciliate: conciliate.mutate,
    unconciliate: unconciliate.mutate,
  };
};
