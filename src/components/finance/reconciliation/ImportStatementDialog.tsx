import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { parseStatement, parsePDFStatement } from "@/lib/bankStatementParser";
import type { BankTransactionInsert } from "@/hooks/useBankTransactions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: BankTransactionInsert[]) => void;
  isImporting: boolean;
  preselectedAccountId?: string;
}

export const ImportStatementDialog = ({
  open, onOpenChange, onImport, isImporting, preselectedAccountId,
}: Props) => {
  const { data: bankAccounts } = useBankAccounts();
  const [accountId, setAccountId] = useState(preselectedAccountId ?? "");
  const [preview, setPreview] = useState<BankTransactionInsert[]>([]);
  const [detectedBank, setDetectedBank] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accountId) return;

    try {
      let result;
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const buffer = await file.arrayBuffer();
        result = await parsePDFStatement(buffer, accountId);
      } else {
        const text = await file.text();
        result = parseStatement(text, accountId, file.name);
      }

      if (result.transactions.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo.");
        return;
      }

      setPreview(result.transactions);
      setDetectedBank(result.detectedBank);
    } catch (err: any) {
      toast.error(err.message || "Erro ao ler arquivo");
    }
  };

  const handleConfirm = () => {
    onImport(preview);
    setPreview([]);
    setDetectedBank(null);
    onOpenChange(false);
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Importar Extrato Bancário
            {detectedBank === "itau" && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                Itaú Detectado
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Conta Bancária *</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>
                {bankAccounts?.filter(b => b.active).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name} - {b.bank_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Arquivo (OFX, CSV, PDF ou TXT)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".ofx,.ofc,.csv,.txt,.pdf"
              onChange={handleFile}
              disabled={!accountId}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 mt-1"
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{preview.length} lançamento(s) encontrado(s)</p>
              <div className="max-h-48 overflow-auto border rounded text-xs">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">Data</th>
                      <th className="px-2 py-1 text-left">Descrição</th>
                      <th className="px-2 py-1 text-right">Valor</th>
                      <th className="px-2 py-1">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1">{t.date}</td>
                        <td className="px-2 py-1 truncate max-w-[200px]">{t.description}</td>
                        <td className="px-2 py-1 text-right font-mono">{fmt(t.amount)}</td>
                        <td className="px-2 py-1 text-center">
                          <span className={t.type === "credit" ? "text-emerald-500" : "text-destructive"}>
                            {t.type === "credit" ? "C" : "D"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 50 && (
                  <p className="text-center py-1 text-muted-foreground">... e mais {preview.length - 50}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setPreview([]); setDetectedBank(null); onOpenChange(false); }}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={preview.length === 0 || isImporting}>
              <Upload className="w-4 h-4 mr-1" />
              {isImporting ? "Importando..." : `Importar ${preview.length} lançamento(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
