import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Users, Shield, Pencil } from "lucide-react";

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

interface EditForm {
  nome: string;
  email: string;
  funcao: string;
  area: string;
  ativo: boolean;
}

export const UsuariosSistema = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<Colaborador | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nome: "", email: "", funcao: "", area: "", ativo: true });

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

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EditForm> }) => {
      const { error } = await supabase
        .from("colaboradores")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores_usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast({ title: "Usuário atualizado com sucesso" });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar usuário", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (colab: Colaborador) => {
    setEditForm({
      nome: colab.nome,
      email: colab.email,
      funcao: colab.funcao,
      area: colab.area,
      ativo: colab.ativo ?? true,
    });
    setEditingUser(colab);
  };

  const handleSave = () => {
    if (!editingUser) return;
    const updates: Partial<EditForm> = {
      nome: editForm.nome,
      funcao: editForm.funcao,
      area: editForm.area,
      ativo: editForm.ativo,
    };
    if (!editingUser.user_id) {
      updates.email = editForm.email;
    }
    updateUser.mutate({ id: editingUser.id, updates });
  };

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
                <div className="flex items-start gap-2">
                  <div className="space-y-1 flex-1">
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
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => openEdit(colab)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
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
                        updateRole.mutate({ id: colab.id, field: "has_finance_view_access", value: v })
                      }
                    />
                    <Label className="text-xs">Viewer Fin.</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={colab.has_admin_view_access || false}
                      onCheckedChange={(v) =>
                        updateRole.mutate({ id: colab.id, field: "has_admin_view_access", value: v })
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

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                disabled={!!editingUser?.user_id}
              />
              {editingUser?.user_id && (
                <p className="text-xs text-muted-foreground">Email não pode ser alterado pois já existe uma conta vinculada.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função</Label>
                <Input value={editForm.funcao} onChange={(e) => setEditForm({ ...editForm, funcao: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.ativo} onCheckedChange={(v) => setEditForm({ ...editForm, ativo: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
