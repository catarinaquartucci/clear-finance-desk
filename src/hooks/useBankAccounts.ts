import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  agency: string | null;
  account_number: string | null;
  account_type: string;
  initial_balance: number;
  current_balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type BankAccountInsert = Omit<BankAccount, "id" | "created_at" | "updated_at">;

export const useBankAccounts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const create = useMutation({
    mutationFn: async (account: BankAccountInsert) => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
      toast.success("Conta bancária criada com sucesso");
    },
    onError: (error) => toast.error("Erro ao criar conta: " + error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BankAccount> & { id: string }) => {
      const { error } = await supabase.from("bank_accounts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
      toast.success("Conta atualizada");
    },
    onError: (error) => toast.error("Erro ao atualizar: " + error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
      toast.success("Conta removida");
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

  return { ...query, create, update, remove };
};
