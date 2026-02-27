import { useState } from "react";
import { formatCNPJ } from "@/lib/masks";
import { useGroupCompanies, GroupCompany } from "@/hooks/useGroupCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

const EMPTY_FORM = { name: "", legal_name: "", document: "", type: "filial", active: true };

export const EmpresasGrupo = () => {
  const { companies, isLoading, createCompany, updateCompany, deleteCompany } = useGroupCompanies();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateCompany.mutate({ id: editingId, ...form }, { onSuccess: () => { setOpen(false); reset(); } });
    } else {
      createCompany.mutate(form as any, { onSuccess: () => { setOpen(false); reset(); } });
    }
  };

  const handleEdit = (company: GroupCompany) => {
    setEditingId(company.id);
    setForm({
      name: company.name,
      legal_name: company.legal_name || "",
      document: company.document || "",
      type: company.type,
      active: company.active,
    });
    setOpen(true);
  };

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Empresas do Grupo</h3>
          <p className="text-sm text-muted-foreground">Cadastre as empresas do grupo econômico.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome Fantasia *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Razão Social</Label>
                <Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.document} onChange={(e) => setForm({ ...form, document: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matriz">Matriz</SelectItem>
                    <SelectItem value="filial">Filial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Ativa</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createCompany.isPending || updateCompany.isPending}>
                {editingId ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma empresa cadastrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <Card key={company.id} className={!company.active ? "opacity-50" : ""}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{company.name}</p>
                    <Badge variant={company.type === "matriz" ? "default" : "secondary"} className="text-xs">
                      {company.type === "matriz" ? "Matriz" : "Filial"}
                    </Badge>
                    {!company.active && <Badge variant="destructive" className="text-xs">Inativa</Badge>}
                  </div>
                  {company.legal_name && <p className="text-sm text-muted-foreground">{company.legal_name}</p>}
                  {company.document && <p className="text-xs text-muted-foreground">CNPJ: {company.document}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCompany.mutate(company.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
