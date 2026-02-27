import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  updated_at: string;
  updated_by: string | null;
}

export const useSystemSettings = (category?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["system_settings", category],
    queryFn: async () => {
      let query = supabase.from("system_settings" as any).select("*");
      if (category) {
        query = query.eq("category", category);
      }
      const { data, error } = await query.order("key");
      if (error) throw error;
      return (data || []) as unknown as SystemSetting[];
    },
  });

  const getSetting = (key: string): any => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value ?? null;
  };

  const upsertSetting = useMutation({
    mutationFn: async ({
      key,
      value,
      category: cat = "preferences",
    }: {
      key: string;
      value: any;
      category?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase.from("system_settings" as any) as any).upsert(
        {
          key,
          value,
          category: cat,
          updated_by: userData.user?.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system_settings"] });
      toast({ title: "Configuração salva com sucesso" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { settings, isLoading, getSetting, upsertSetting };
};
