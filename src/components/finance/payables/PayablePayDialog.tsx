import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBankAccounts } from "@/hooks/useBankAccounts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { paid_date: string; payment_method?: string; bank_account_id?: string }) => void;
}

export const PayablePayDialog = ({ open, onOpenChange, onConfirm }: Props) => {
  const { data: bankAccounts } = useBankAccounts();
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("pix");
  const [bankId, setBankId] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Dar Baixa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Data do Pagamento</Label>
            <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Conta Bancária</Label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {bankAccounts?.filter(b => b.active).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => onConfirm({
              paid_date: paidDate,
              payment_method: method,
              bank_account_id: bankId && bankId !== "none" ? bankId : undefined,
            })}>
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
