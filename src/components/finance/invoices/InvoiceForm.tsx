import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useInvoices, InvoiceInsert } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";

export const InvoiceForm = () => {
  const [open, setOpen] = useState(false);
  const { createInvoice, isCreating } = useInvoices();
  const { data: customers = [] } = useCustomers();

  const [form, setForm] = useState<InvoiceInsert>({
    service_description: "",
    amount: 0,
    customer_id: null,
    notes: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_description || form.amount <= 0) return;
    await createInvoice(form);
    setForm({ service_description: "", amount: 0, customer_id: null, notes: null });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nova NFS-e
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Nota Fiscal de Serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select
              value={form.customer_id || "none"}
              onValueChange={(v) => setForm({ ...form, customer_id: v === "none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrição do Serviço *</Label>
            <Textarea
              value={form.service_description}
              onChange={(e) => setForm({ ...form, service_description: e.target.value })}
              placeholder="Descrição detalhada do serviço prestado"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Bruto (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label>Impostos Estimados (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={(form.amount * 0.087).toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Input
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
              placeholder="Observações internas"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Rascunho"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
