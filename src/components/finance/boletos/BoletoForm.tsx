import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useBoletos, BoletoInsert } from "@/hooks/useBoletos";
import { useCustomers } from "@/hooks/useCustomers";

export const BoletoForm = () => {
  const [open, setOpen] = useState(false);
  const { createBoleto, isCreating } = useBoletos();
  const { data: customers = [] } = useCustomers();

  const [form, setForm] = useState<BoletoInsert>({
    amount: 0,
    due_date: "",
    customer_id: null,
    notes: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0 || !form.due_date) return;
    await createBoleto(form);
    setForm({ amount: 0, due_date: "", customer_id: null, notes: null });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1" /> Gerar Boleto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Novo Boleto</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor (R$) *</Label>
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
              <Label>Vencimento *</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Input
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Gerando..." : "Gerar Boleto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
