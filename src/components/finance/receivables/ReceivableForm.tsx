import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCustomers } from "@/hooks/useCustomers";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import type { ReceivableInsert } from "@/hooks/useReceivables";

interface ReceivableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReceivableInsert) => void;
  isSubmitting?: boolean;
}

export const ReceivableForm = ({ open, onOpenChange, onSubmit, isSubmitting }: ReceivableFormProps) => {
  const { data: customers } = useCustomers();
  const { data: costCenters } = useCostCenters();
  const { data: bankAccounts } = useBankAccounts();

  const [form, setForm] = useState<ReceivableInsert>({
    description: "",
    amount: 0,
    due_date: new Date().toISOString().split("T")[0],
    customer_id: null,
    cost_center_id: null,
    bank_account_id: null,
    payment_method: null,
    notes: null,
    installment_total: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.due_date) return;

    const total = form.installment_total ?? 1;
    if (total > 1) {
      for (let i = 0; i < total; i++) {
        const dueDate = new Date(form.due_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        onSubmit({
          ...form,
          amount: Number((form.amount / total).toFixed(2)),
          due_date: dueDate.toISOString().split("T")[0],
          installment_number: i + 1,
          installment_total: total,
          description: `${form.description} (${i + 1}/${total})`,
        });
      }
    } else {
      onSubmit({ ...form, installment_number: 1, installment_total: 1 });
    }
    onOpenChange(false);
    setForm({
      description: "", amount: 0,
      due_date: new Date().toISOString().split("T")[0],
      customer_id: null, cost_center_id: null, bank_account_id: null,
      payment_method: null, notes: null, installment_total: 1,
    });
  };

  const set = (key: keyof ReceivableInsert, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta a Receber</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor total *</Label>
              <Input type="number" step="0.01" min="0.01" value={form.amount || ""} onChange={(e) => set("amount", Number(e.target.value))} required />
            </div>
            <div>
              <Label>Vencimento *</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} required />
            </div>
          </div>

          <div>
            <Label>Cliente</Label>
            <Select value={form.customer_id ?? "none"} onValueChange={(v) => set("customer_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {customers?.filter(c => c.active).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Centro de Custo</Label>
              <Select value={form.cost_center_id ?? "none"} onValueChange={(v) => set("cost_center_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {costCenters?.filter(c => c.active).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parcelas</Label>
              <Input type="number" min="1" max="60" value={form.installment_total ?? 1} onChange={(e) => set("installment_total", Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label>Filial</Label>
            <CompanyFilter
              value={(form as any).company_id ?? "none"}
              onChange={(v) => set("company_id" as any, v === "none" ? null : v)}
              formMode
              className="w-full"
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
