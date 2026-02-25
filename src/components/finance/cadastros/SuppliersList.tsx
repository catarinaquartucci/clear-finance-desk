import { useState } from "react";
import { useSuppliers, Supplier, SupplierInsert } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const emptyForm: SupplierInsert = {
  name: "", document: "", contact_email: "", contact_phone: "",
  address: "", bank_name: "", bank_agency: "", bank_account: "",
  pix_key: "", category: "", active: true,
};

export const SuppliersList = () => {
  const { data: suppliers, isLoading, create, update, remove } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInsert>(emptyForm);
  const [search, setSearch] = useState("");

  const handleOpen = (supplier?: Supplier) => {
    if (supplier) {
      setEditing(supplier);
      setForm({ name: supplier.name, document: supplier.document, contact_email: supplier.contact_email, contact_phone: supplier.contact_phone, address: supplier.address, bank_name: supplier.bank_name, bank_agency: supplier.bank_agency, bank_account: supplier.bank_account, pix_key: supplier.pix_key, category: supplier.category, active: supplier.active });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      update.mutate({ id: editing.id, ...form }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate(form, { onSuccess: () => setOpen(false) });
    }
  };

  const filtered = suppliers?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.document?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-2" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>CNPJ/CPF</Label><Input value={form.document ?? ""} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
              <div><Label>Categoria</Label><Input value={form.category ?? ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.contact_email ?? ""} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.contact_phone ?? ""} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label>Banco</Label><Input value={form.bank_name ?? ""} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
              <div><Label>Agência</Label><Input value={form.bank_agency ?? ""} onChange={e => setForm(f => ({ ...f, bank_agency: e.target.value }))} /></div>
              <div><Label>Conta</Label><Input value={form.bank_account ?? ""} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} /></div>
              <div><Label>Chave PIX</Label><Input value={form.pix_key ?? ""} onChange={e => setForm(f => ({ ...f, pix_key: e.target.value }))} /></div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <Label>Ativo</Label>
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
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.document || "—"}</TableCell>
                  <TableCell>{s.category || "—"}</TableCell>
                  <TableCell>{s.contact_email || "—"}</TableCell>
                  <TableCell><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpen(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
