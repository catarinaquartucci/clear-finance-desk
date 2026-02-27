import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Supplier {
  id: string;
  name: string;
  document: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  pix_key: string | null;
  category: string | null;
  active: boolean;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SupplierInsert = Omit<Supplier, "id" | "created_at" | "updated_at">;

export const useSuppliers = (companyId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers", companyId],
    queryFn: async () => {
      let q = supabase.from("suppliers").select("*").order("name");
      if (companyId && companyId !== "all") {
        q = q.eq("company_id", companyId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const create = useMutation({
    mutationFn: async (supplier: SupplierInsert) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert(supplier as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor criado com sucesso");
    },
    onError: (error) => toast.error("Erro ao criar fornecedor: " + error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase.from("suppliers").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor atualizado");
    },
    onError: (error) => toast.error("Erro ao atualizar: " + error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor removido");
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

  return { ...query, create, update, remove };
};
