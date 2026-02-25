import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CostCenterInsert = Omit<CostCenter, "id" | "created_at" | "updated_at">;

export const useCostCenters = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cost_centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .order("code");
      if (error) throw error;
      return data as CostCenter[];
    },
  });

  const create = useMutation({
    mutationFn: async (center: CostCenterInsert) => {
      const { data, error } = await supabase
        .from("cost_centers")
        .insert(center)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
      toast.success("Centro de custo criado com sucesso");
    },
    onError: (error) => toast.error("Erro ao criar: " + error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CostCenter> & { id: string }) => {
      const { error } = await supabase.from("cost_centers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
      toast.success("Centro de custo atualizado");
    },
    onError: (error) => toast.error("Erro ao atualizar: " + error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cost_centers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost_centers"] });
      toast.success("Centro de custo removido");
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

  return { ...query, create, update, remove };
};
