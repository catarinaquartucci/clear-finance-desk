import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GroupCompany {
  id: string;
  name: string;
  legal_name: string | null;
  document: string | null;
  type: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGroupCompanies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["group_companies"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("group_companies" as any) as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as GroupCompany[];
    },
  });

  const createCompany = useMutation({
    mutationFn: async (company: Omit<GroupCompany, "id" | "created_at" | "updated_at">) => {
      const { error } = await (supabase.from("group_companies" as any) as any).insert(company);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group_companies"] });
      toast({ title: "Empresa cadastrada com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar empresa", description: error.message, variant: "destructive" });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...data }: Partial<GroupCompany> & { id: string }) => {
      const { error } = await (supabase.from("group_companies" as any) as any)
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group_companies"] });
      toast({ title: "Empresa atualizada com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar empresa", description: error.message, variant: "destructive" });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("group_companies" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group_companies"] });
      toast({ title: "Empresa removida com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover empresa", description: error.message, variant: "destructive" });
    },
  });

  return { companies, isLoading, createCompany, updateCompany, deleteCompany };
};
