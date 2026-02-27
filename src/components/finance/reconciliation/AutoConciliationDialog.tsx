import { useState } from "react";
import { format } from "date-fns";
import { Wand2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MatchCandidate } from "@/lib/autoConciliation";
import type { BankTransaction } from "@/hooks/useBankTransactions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: MatchCandidate[];
  transactions: BankTransaction[];
  onConfirm: (selected: MatchCandidate[]) => void;
  isProcessing: boolean;
}

export const AutoConciliationDialog = ({
  open, onOpenChange, matches, transactions, onConfirm, isProcessing,
}: Props) => {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(matches.filter(m => m.score >= 70).map(m => m.transactionId))
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === matches.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(matches.map(m => m.transactionId)));
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    if (score >= 60) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  };

  const selectedMatches = matches.filter(m => selected.has(m.transactionId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Conciliação Automática
          </DialogTitle>
          <DialogDescription>
            {matches.length} match(es) encontrado(s). Selecione os que deseja conciliar.
          </DialogDescription>
        </DialogHeader>

        {matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma correspondência encontrada.</p>
            <p className="text-xs mt-1">Tente importar mais transações ou verifique as contas a pagar/receber.</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === matches.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Transação</TableHead>
                    <TableHead>Correspondência</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((m) => {
                    const txn = transactions.find(t => t.id === m.transactionId);
                    if (!txn) return null;
                    return (
                      <TableRow key={m.transactionId} className="text-xs">
                        <TableCell>
                          <Checkbox
                            checked={selected.has(m.transactionId)}
                            onCheckedChange={() => toggle(m.transactionId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium truncate max-w-[200px]">{txn.description}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(txn.date + "T12:00:00"), "dd/MM/yy")} • {fmt(Math.abs(Number(txn.amount)))}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium truncate max-w-[200px]">{m.withDescription}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(m.withDate + "T12:00:00"), "dd/MM/yy")} • {fmt(m.withAmount)}
                              {" • "}
                              <span className="capitalize">{m.withType === "payable" ? "A pagar" : "A receber"}</span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreColor(m.score)}>
                            {m.score}%
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{m.reason}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {selected.size} de {matches.length} selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button
                  onClick={() => onConfirm(selectedMatches)}
                  disabled={selected.size === 0 || isProcessing}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {isProcessing ? "Processando..." : `Conciliar ${selected.size}`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
