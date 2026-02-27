import { useState } from "react";
import { useBankAccounts, BankAccount, BankAccountInsert } from "@/hooks/useBankAccounts";
import { useGroupCompanies } from "@/hooks/useGroupCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CompanyFilter } from "@/components/finance/CompanyFilter";

const emptyForm: BankAccountInsert = {
  name: "", bank_name: "", agency: "", account_number: "",
  account_type: "corrente", initial_balance: 0, current_balance: 0, active: true, company_id: null,
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const BankAccountsList = () => {
  const [companyFilter, setCompanyFilter] = useState("all");
  const { data: accounts, isLoading, create, update, remove } = useBankAccounts(companyFilter);
  const { companies } = useGroupCompanies();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<BankAccountInsert>(emptyForm);

  const handleOpen = (account?: BankAccount) => {
    if (account) {
      setEditing(account);
      setForm({ name: account.name, bank_name: account.bank_name, agency: account.agency, account_number: account.account_number, account_type: account.account_type, initial_balance: account.initial_balance, current_balance: account.current_balance, active: account.active, company_id: account.company_id });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.bank_name.trim()) return;
    const payload = { ...form, company_id: form.company_id === null ? null : form.company_id };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate({ ...payload, current_balance: payload.initial_balance }, { onSuccess: () => setOpen(false) });
    }
  };

  const getCompanyName = (id: string | null) => companies.find(c => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <CompanyFilter value={companyFilter} onChange={setCompanyFilter} />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-2" />Nova Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Conta Bancária</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Banco *</Label><Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.account_type} onValueChange={v => setForm(f => ({ ...f, account_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="investimento">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Agência</Label><Input value={form.agency ?? ""} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} /></div>
              <div><Label>Conta</Label><Input value={form.account_number ?? ""} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} /></div>
              <div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={form.initial_balance} onChange={e => setForm(f => ({ ...f, initial_balance: Number(e.target.value) }))} /></div>
              <div>
                <Label>Filial</Label>
                <CompanyFilter value={form.company_id ?? "none"} onChange={v => setForm(f => ({ ...f, company_id: v === "none" ? null : v }))} formMode className="w-full" />
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
                <TableHead>Nome</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Agência/Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead className="text-right">Saldo Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts?.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma conta cadastrada</TableCell></TableRow>
              ) : accounts?.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.bank_name}</TableCell>
                  <TableCell>{[a.agency, a.account_number].filter(Boolean).join(" / ") || "—"}</TableCell>
                  <TableCell className="capitalize">{a.account_type}</TableCell>
                  <TableCell className="text-muted-foreground">{getCompanyName(a.company_id)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(a.current_balance)}</TableCell>
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
