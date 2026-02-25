import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BankTransaction } from "@/hooks/useBankTransactions";
import type { Payable } from "@/hooks/usePayables";
import type { Receivable } from "@/hooks/useReceivables";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: BankTransaction | null;
  payables: Payable[];
  receivables: Receivable[];
  onConciliate: (withType: string, withId: string) => void;
}

export const ConciliateDialog = ({
  open, onOpenChange, transaction, payables, receivables, onConciliate,
}: Props) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("auto");

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Auto-match: find payables/receivables with similar amount (+/- 1%) and date (+/- 3 days)
  const autoMatches = useMemo(() => {
    if (!transaction) return [];
    const tAmount = Math.abs(Number(transaction.amount));
    const tDate = new Date(transaction.date + "T12:00:00").getTime();
    const tolerance = 3 * 86400000; // 3 days
    const amountTolerance = tAmount * 0.01;

    const items: { type: string; id: string; description: string; amount: number; date: string; score: number }[] = [];

    // For debits, match payables; for credits, match receivables
    const source = transaction.type === "debit" ? payables : receivables;
    const sourceType = transaction.type === "debit" ? "payable" : "receivable";

    source.forEach((item) => {
      const iAmount = Math.abs(Number(item.amount));
      const iDate = new Date(item.due_date + "T12:00:00").getTime();
      const amountDiff = Math.abs(tAmount - iAmount);
      const dateDiff = Math.abs(tDate - iDate);

      if (amountDiff <= amountTolerance && dateDiff <= tolerance) {
        const score = (1 - amountDiff / tAmount) * 50 + (1 - dateDiff / tolerance) * 50;
        items.push({
          type: sourceType,
          id: item.id,
          description: item.description,
          amount: iAmount,
          date: item.due_date,
          score,
        });
      }
    });

    return items.sort((a, b) => b.score - a.score);
  }, [transaction, payables, receivables]);

  // Manual list
  const manualItems = useMemo(() => {
    const items: { type: string; id: string; description: string; amount: number; date: string }[] = [];

    payables.filter(p => p.status === "open").forEach(p => {
      items.push({ type: "payable", id: p.id, description: p.description, amount: Number(p.amount), date: p.due_date });
    });
    receivables.filter(r => r.status === "open").forEach(r => {
      items.push({ type: "receivable", id: r.id, description: r.description, amount: Number(r.amount), date: r.due_date });
    });

    if (search) {
      return items.filter(i => i.description.toLowerCase().includes(search.toLowerCase()));
    }
    return items;
  }, [payables, receivables, search]);

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Conciliar Lançamento</DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Extrato:</span>
            <span className="font-medium">{transaction.description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor:</span>
            <span className={`font-mono font-bold ${transaction.type === "credit" ? "text-emerald-500" : "text-destructive"}`}>
              {transaction.type === "credit" ? "+" : "-"}{fmt(Math.abs(Number(transaction.amount)))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data:</span>
            <span>{format(new Date(transaction.date + "T12:00:00"), "dd/MM/yyyy")}</span>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">
              Sugestões ({autoMatches.length})
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="auto">
            <ScrollArea className="h-[250px]">
              {autoMatches.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma correspondência automática encontrada
                </p>
              ) : (
                <div className="space-y-2">
                  {autoMatches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(m.amount)} • {format(new Date(m.date + "T12:00:00"), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(m.score)}%
                        </Badge>
                        <Button size="sm" onClick={() => onConciliate(m.type, m.id)}>
                          Vincular
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manual">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar conta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <ScrollArea className="h-[220px]">
                {manualItems.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Nenhum item encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {manualItems.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmt(m.amount)} • {format(new Date(m.date + "T12:00:00"), "dd/MM/yyyy")} •{" "}
                            <Badge variant="outline" className="text-xs">
                              {m.type === "payable" ? "A Pagar" : "A Receber"}
                            </Badge>
                          </p>
                        </div>
                        <Button size="sm" className="ml-2" onClick={() => onConciliate(m.type, m.id)}>
                          Vincular
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
