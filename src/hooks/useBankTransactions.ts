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
      const batchSize = 100;
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        // Try upsert first (requires unique index on import_hash)
        const { data, error } = await supabase
          .from("bank_transactions")
          .upsert(batch, { onConflict: "import_hash", ignoreDuplicates: true })
          .select();
        
        if (error) {
          // Fallback: if no unique constraint, insert one by one ignoring duplicates
          if (error.code === "42P10" || error.message?.includes("ON CONFLICT")) {
            for (const row of batch) {
              const { data: single, error: singleErr } = await supabase
                .from("bank_transactions")
                .insert(row)
                .select();
              if (!singleErr && single) {
                inserted += single.length;
              } else {
                skipped++;
              }
            }
          } else {
            throw error;
          }
        } else {
          inserted += data?.length ?? 0;
        }
      }
      skipped = rows.length - inserted;
      return { inserted, skipped };
    },
    onSuccess: async ({ inserted, skipped }) => {
      // Update bank account current_balance from latest transaction
      if (bankAccountId && inserted > 0) {
        try {
          const { data: latestTx } = await supabase
            .from("bank_transactions")
            .select("balance, date")
            .eq("bank_account_id", bankAccountId)
            .not("balance", "is", null)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (latestTx?.balance != null) {
            await supabase
              .from("bank_accounts")
              .update({ current_balance: latestTx.balance })
              .eq("id", bankAccountId);
            queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
          }
        } catch (e) {
          console.error("Error updating bank account balance:", e);
        }
      }
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

  const batchConciliate = useMutation({
    mutationFn: async (items: { transactionId: string; withType: string; withId: string }[]) => {
      let success = 0;
      for (const item of items) {
        const { error } = await supabase
          .from("bank_transactions")
          .update({
            conciliated: true,
            conciliated_with_type: item.withType,
            conciliated_with_id: item.withId,
            conciliated_at: new Date().toISOString(),
          })
          .eq("id", item.transactionId);
        if (!error) success++;
      }
      return success;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success(`${count} transação(ões) conciliada(s) automaticamente!`);
    },
    onError: (error) => {
      toast.error("Erro na conciliação em lote: " + error.message);
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
    batchConciliate: batchConciliate.mutate,
    isBatchConciliating: batchConciliate.isPending,
  };
};
