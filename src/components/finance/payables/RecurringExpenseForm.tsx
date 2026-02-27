import { useState, useMemo } from "react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Repeat, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { CompanyFilter } from "@/components/finance/CompanyFilter";

interface RecurringExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    description: string;
    amount: number;
    supplier_id: string | null;
    cost_center_id: string | null;
    bank_account_id: string | null;
    chart_account_id: string | null;
    company_id: string | null;
    payment_method: string | null;
    day_of_month: number;
    total_months: number;
    start_date: string;
    notes: string | null;
  }) => void;
  isSubmitting?: boolean;
}

export const RecurringExpenseForm = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: RecurringExpenseFormProps) => {
  const { data: suppliers } = useSuppliers();
  const { data: costCenters } = useCostCenters();
  const { data: bankAccounts } = useBankAccounts();

  const [form, setForm] = useState({
    description: "",
    amount: 0,
    supplier_id: null as string | null,
    cost_center_id: null as string | null,
    bank_account_id: null as string | null,
    chart_account_id: null as string | null,
    company_id: null as string | null,
    payment_method: null as string | null,
    day_of_month: 10,
    total_months: 12,
    start_date: new Date().toISOString().split("T")[0],
    notes: null as string | null,
  });

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const previewDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(form.start_date + "T12:00:00");
    for (let i = 0; i < form.total_months; i++) {
      const d = addMonths(start, i);
      const day = Math.min(form.day_of_month, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
      d.setDate(day);
      dates.push(format(d, "yyyy-MM-dd"));
    }
    return dates;
  }, [form.start_date, form.day_of_month, form.total_months]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || form.total_months < 1) return;
    onSubmit(form);
    onOpenChange(false);
    setForm({
      description: "",
      amount: 0,
      supplier_id: null,
      cost_center_id: null,
      bank_account_id: null,
      chart_account_id: null,
      company_id: null,
      payment_method: null,
      day_of_month: 10,
      total_months: 12,
      start_date: new Date().toISOString().split("T")[0],
      notes: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" /> Despesa Recorrente
          </DialogTitle>
          <DialogDescription>
            Cadastre uma vez e gere automaticamente as contas a pagar para os próximos meses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={(e) => set("description", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor mensal *</Label>
              <Input type="number" step="0.01" min="0.01" value={form.amount || ""} onChange={(e) => set("amount", Number(e.target.value))} required />
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
            <div>
              <Label>Filial</Label>
              <CompanyFilter
                value={form.company_id ?? "none"}
                onChange={(v) => set("company_id", v === "none" ? null : v)}
                formMode
                className="w-full"
              />
            </div>
          </div>

          {/* Recurrence config */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Configuração de Recorrência
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Dia do vencimento *</Label>
                <Input type="number" min={1} max={28} value={form.day_of_month} onChange={(e) => set("day_of_month", Number(e.target.value))} required />
              </div>
              <div>
                <Label>Quantidade de meses *</Label>
                <Input type="number" min={1} max={60} value={form.total_months} onChange={(e) => set("total_months", Number(e.target.value))} required />
              </div>
              <div>
                <Label>Início a partir de *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold">
                Preview — {previewDates.length} contas serão geradas ({fmt(form.amount * previewDates.length)} total)
              </h4>
              <ScrollArea className="max-h-40">
                <div className="flex flex-wrap gap-2">
                  {previewDates.map((d, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {format(new Date(d + "T12:00:00"), "dd/MM/yyyy")}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Gerando..." : `Gerar ${previewDates.length} contas`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
