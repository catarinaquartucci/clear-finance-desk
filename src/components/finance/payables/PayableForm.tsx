import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import type { PayableInsert } from "@/hooks/usePayables";

interface PayableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PayableInsert) => void;
  onUpdate?: (data: Partial<PayableInsert> & { id: string }) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<PayableInsert> & { id?: string };
  title?: string;
  allowInstallments?: boolean;
}

const emptyForm = (): PayableInsert & { company_id?: string | null } => ({
  description: "",
  amount: 0,
  due_date: new Date().toISOString().split("T")[0],
  supplier_id: null,
  cost_center_id: null,
  bank_account_id: null,
  chart_account_id: null,
  payment_method: null,
  notes: null,
  installment_total: 1,
  company_id: null,
});

export const PayableForm = ({
  open,
  onOpenChange,
  onSubmit,
  onUpdate,
  isSubmitting,
  defaultValues,
  title,
  allowInstallments = true,
}: PayableFormProps) => {
  const { data: suppliers } = useSuppliers();
  const { data: costCenters } = useCostCenters();
  const { data: bankAccounts } = useBankAccounts();
  const { data: chartAccounts } = useChartOfAccounts();

  const isEdit = !!defaultValues?.id;

  const [form, setForm] = useState<PayableInsert & { company_id?: string | null }>(emptyForm());
  const [amountStr, setAmountStr] = useState("");

  useEffect(() => {
    if (open && defaultValues) {
      setForm({
        ...emptyForm(),
        ...defaultValues,
        company_id: (defaultValues as any).company_id ?? null,
      });
      setAmountStr(defaultValues.amount ? String(defaultValues.amount) : "");
    } else if (open) {
      setForm(emptyForm());
      setAmountStr("");
    }
  }, [open, defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!form.description || !amount || !form.due_date) return;

    if (isEdit && onUpdate) {
      onUpdate({
        id: defaultValues!.id!,
        description: form.description,
        amount,
        due_date: form.due_date,
        supplier_id: form.supplier_id,
        cost_center_id: form.cost_center_id,
        bank_account_id: form.bank_account_id,
        chart_account_id: form.chart_account_id,
        payment_method: form.payment_method,
        notes: form.notes,
      });
      onOpenChange(false);
      return;
    }

    const total = form.installment_total ?? 1;
    if (total > 1 && allowInstallments) {
      for (let i = 0; i < total; i++) {
        const dueDate = new Date(form.due_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        onSubmit({
          ...form,
          amount: Number((amount / total).toFixed(2)),
          due_date: dueDate.toISOString().split("T")[0],
          installment_number: i + 1,
          installment_total: total,
          description: `${form.description} (${i + 1}/${total})`,
        });
      }
    } else {
      onSubmit({ ...form, amount, installment_number: 1, installment_total: 1 });
    }
    onOpenChange(false);
  };

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const formTitle = title ?? (isEdit ? "Editar Conta a Pagar" : "Nova Conta a Pagar");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor total *</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) {
                    setAmountStr(v);
                  }
                }}
                required
              />
            </div>
            <div>
              <Label>Vencimento *</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} required />
            </div>
          </div>

          <div>
            <Label>Fornecedor</Label>
            <Select value={form.supplier_id ?? "none"} onValueChange={(v) => set("supplier_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {suppliers?.filter(s => s.active).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
              <Label>Conta Bancária</Label>
              <Select value={form.bank_account_id ?? "none"} onValueChange={(v) => set("bank_account_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {bankAccounts?.filter(b => b.active).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} - {b.bank_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.payment_method ?? "none"} onValueChange={(v) => set("payment_method", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definida</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {allowInstallments && !isEdit && (
              <div>
                <Label>Parcelas</Label>
                <Input type="number" min="1" max="60" value={form.installment_total ?? 1} onChange={(e) => set("installment_total", Number(e.target.value))} />
              </div>
            )}
          </div>

          <div>
            <Label>Classificação Financeira</Label>
            <Select value={form.chart_account_id ?? "none"} onValueChange={(v) => set("chart_account_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {chartAccounts?.filter(c => c.active).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Filial</Label>
            <CompanyFilter
              value={form.company_id ?? "none"}
              onChange={(v) => set("company_id", v === "none" ? null : v)}
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
