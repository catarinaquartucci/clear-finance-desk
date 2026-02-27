import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Users, Shield } from "lucide-react";

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  area: string;
  ativo: boolean;
  user_id: string | null;
  is_admin: boolean;
  has_finance_access: boolean;
  has_finance_view_access: boolean;
  has_admin_view_access: boolean;
}

export const UsuariosSistema = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: colaboradores = [], isLoading } = useQuery({
    queryKey: ["colaboradores_usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome, email, funcao, area, ativo, user_id, is_admin, has_finance_access, has_finance_view_access, has_admin_view_access")
        .order("nome");
      if (error) throw error;
      return data as Colaborador[];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("colaboradores")
        .update({ [field]: value } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores_usuarios"] });
      toast({ title: "Permissão atualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const filtered = colaboradores.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const linkedUsers = colaboradores.filter((c) => c.user_id);

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie permissões dos colaboradores. Apenas colaboradores com conta vinculada podem acessar o sistema.
        </p>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{colaboradores.length}</p>
              <p className="text-xs text-muted-foreground">Total Colaboradores</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{linkedUsers.length}</p>
              <p className="text-xs text-muted-foreground">Com Conta Ativa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((colab) => (
          <Card key={colab.id} className={!colab.ativo ? "opacity-50" : ""}>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{colab.nome}</p>
                    {!colab.user_id && (
                      <Badge variant="outline" className="text-xs">Sem conta</Badge>
                    )}
                    {!colab.ativo && (
                      <Badge variant="destructive" className="text-xs">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{colab.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {colab.funcao} · {colab.area}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={colab.is_admin || false}
                      onCheckedChange={(v) =>
                        updateRole.mutate({ id: colab.id, field: "is_admin", value: v })
                      }
                    />
                    <Label className="text-xs">Admin</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={colab.has_finance_access || false}
                      onCheckedChange={(v) =>
                        updateRole.mutate({ id: colab.id, field: "has_finance_access", value: v })
                      }
                    />
                    <Label className="text-xs">Financeiro</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={colab.has_finance_view_access || false}
                      onCheckedChange={(v) =>
                        updateRole.mutate({
                          id: colab.id,
                          field: "has_finance_view_access",
                          value: v,
                        })
                      }
                    />
                    <Label className="text-xs">Viewer Fin.</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={colab.has_admin_view_access || false}
                      onCheckedChange={(v) =>
                        updateRole.mutate({
                          id: colab.id,
                          field: "has_admin_view_access",
                          value: v,
                        })
                      }
                    />
                    <Label className="text-xs">Viewer Adm.</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
