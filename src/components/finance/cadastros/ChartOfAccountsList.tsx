import { useState } from "react";
import { useChartOfAccounts, ChartAccount, ChartAccountInsert } from "@/hooks/useChartOfAccounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const emptyForm: ChartAccountInsert = {
  code: "", name: "", type: "expense", parent_id: null, level: 1, active: true,
};

const typeLabels: Record<string, string> = {
  revenue: "Receita",
  expense: "Despesa",
  cost: "Custo",
};

export const ChartOfAccountsList = () => {
  const { data: accounts, isLoading, create, update, remove } = useChartOfAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChartAccount | null>(null);
  const [form, setForm] = useState<ChartAccountInsert>(emptyForm);

  const handleOpen = (account?: ChartAccount) => {
    if (account) {
      setEditing(account);
      setForm({ code: account.code, name: account.name, type: account.type, parent_id: account.parent_id, level: account.level, active: account.active });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editing) {
      update.mutate({ id: editing.id, ...form }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate(form, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-2" />Nova Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Conta</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
              <div><Label>Nível</Label><Input type="number" min={1} value={form.level} onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))} /></div>
              <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="cost">Custo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta Pai</Label>
                <Select value={form.parent_id ?? "none"} onValueChange={v => setForm(f => ({ ...f, parent_id: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {accounts?.filter(a => a.id !== editing?.id).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <Label>Ativa</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={create.isPending || update.isPending}>{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts?.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta cadastrada</TableCell></TableRow>
              ) : accounts?.map(a => (
                <TableRow key={a.id} style={{ paddingLeft: `${(a.level - 1) * 20}px` }}>
                  <TableCell className="font-mono">{a.code}</TableCell>
                  <TableCell className="font-medium" style={{ paddingLeft: `${(a.level - 1) * 16}px` }}>{a.name}</TableCell>
                  <TableCell><Badge variant="outline">{typeLabels[a.type] || a.type}</Badge></TableCell>
                  <TableCell>{a.level}</TableCell>
                  <TableCell><Badge variant={a.active ? "default" : "secondary"}>{a.active ? "Ativa" : "Inativa"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpen(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
