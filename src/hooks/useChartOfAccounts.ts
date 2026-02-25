import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  level: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ChartAccountInsert = Omit<ChartAccount, "id" | "created_at" | "updated_at">;

export const useChartOfAccounts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("code");
      if (error) throw error;
      return data as ChartAccount[];
    },
  });

  const create = useMutation({
    mutationFn: async (account: ChartAccountInsert) => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Conta criada com sucesso");
    },
    onError: (error) => toast.error("Erro ao criar conta: " + error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChartAccount> & { id: string }) => {
      const { error } = await supabase.from("chart_of_accounts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Conta atualizada");
    },
    onError: (error) => toast.error("Erro ao atualizar: " + error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Conta removida");
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

  return { ...query, create, update, remove };
};
