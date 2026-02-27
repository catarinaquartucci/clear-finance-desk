import { useState } from "react";
import { useCustomers, Customer, CustomerInsert } from "@/hooks/useCustomers";
import { useGroupCompanies } from "@/hooks/useGroupCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import { formatCPFCNPJ } from "@/lib/masks";

const emptyForm: CustomerInsert = {
  name: "", document: "", contact_email: "", contact_phone: "",
  address: "", segment: "", active: true, company_id: null,
};

export const CustomersList = () => {
  const [companyFilter, setCompanyFilter] = useState("all");
  const { data: customers, isLoading, create, update, remove } = useCustomers(companyFilter);
  const { companies } = useGroupCompanies();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInsert>(emptyForm);
  const [search, setSearch] = useState("");

  const handleOpen = (customer?: Customer) => {
    if (customer) {
      setEditing(customer);
      setForm({ name: customer.name, document: customer.document, contact_email: customer.contact_email, contact_phone: customer.contact_phone, address: customer.address, segment: customer.segment, active: customer.active, company_id: customer.company_id });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, company_id: form.company_id === null ? null : form.company_id };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const getCompanyName = (id: string | null) => companies.find(c => c.id === id)?.name ?? "—";

  const filtered = customers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.document?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <CompanyFilter value={companyFilter} onChange={setCompanyFilter} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Cliente</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>CNPJ/CPF</Label><Input value={form.document ?? ""} onChange={e => setForm(f => ({ ...f, document: formatCPFCNPJ(e.target.value) }))} /></div>
              <div><Label>Segmento</Label><Input value={form.segment ?? ""} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.contact_email ?? ""} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.contact_phone ?? ""} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div>
                <Label>Filial</Label>
                <CompanyFilter value={form.company_id ?? "none"} onChange={v => setForm(f => ({ ...f, company_id: v === "none" ? null : v }))} formMode className="w-full" />
              </div>
              <div className="flex items-end gap-2 pb-1">
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
                <TableHead>Segmento</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.document || "—"}</TableCell>
                  <TableCell>{c.segment || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{getCompanyName(c.company_id)}</TableCell>
                  <TableCell>{c.contact_email || "—"}</TableCell>
                  <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpen(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
