import { format } from "date-fns";
import {
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, Circle, Link2, Unlink, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { BankTransaction } from "@/hooks/useBankTransactions";

interface Props {
  day: number;
  month: number; // 1-based
  year: number;
  transactions: BankTransaction[];
  allTransactions: BankTransaction[];
  readOnly: boolean;
  onConciliate: (id: string) => void;
  onUnconciliate: (id: string) => void;
  onIgnore: (id: string) => void;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const DayTransactionsList = ({
  day, month, year, transactions, allTransactions, readOnly,
  onConciliate, onUnconciliate, onIgnore,
}: Props) => {
  const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

  const credits = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const debits = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  // Calculate previous balance from the last transaction before this day that has a balance
  const currentDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const previousTxs = allTransactions
    .filter((t) => t.date < currentDateStr && t.balance != null)
    .sort((a, b) => b.date.localeCompare(a.date));
  const previousBalance = previousTxs.length > 0 ? Number(previousTxs[0].balance) : null;

  // Final balance: last transaction of this day with balance, or calculate
  const dayTxsWithBalance = transactions.filter((t) => t.balance != null);
  const finalBalance = dayTxsWithBalance.length > 0
    ? Number(dayTxsWithBalance[dayTxsWithBalance.length - 1].balance)
    : previousBalance != null
      ? previousBalance + credits - debits
      : null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Movimentos de {dateStr}
      </h3>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Descrição / Histórico</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 4 : 5} className="text-center py-6 text-muted-foreground">
                  Nenhum movimento neste dia
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id} className={t.conciliated ? "opacity-60" : ""}>
                  <TableCell>
                    {t.type === "credit" ? (
                      <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[400px] truncate">
                    {t.description}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${t.type === "credit" ? "text-emerald-500" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "-"}{fmt(Math.abs(Number(t.amount)))}
                  </TableCell>
                  <TableCell>
                    {t.conciliated ? (
                      t.conciliated_with_type === "ignored" ? (
                        <Badge variant="secondary" className="gap-1"><EyeOff className="w-3 h-3" /> Ignorado</Badge>
                      ) : (
                        <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Conciliado</Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="gap-1"><Circle className="w-3 h-3" /> Pendente</Badge>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex gap-1">
                        {t.conciliated ? (
                          <Button variant="ghost" size="icon" title="Desfazer" onClick={() => onUnconciliate(t.id)}>
                            <Unlink className="w-4 h-4" />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" title="Conciliar" onClick={() => onConciliate(t.id)}>
                              <Link2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Ignorar" onClick={() => onIgnore(t.id)}>
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {previousBalance != null && (
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-[10px] text-muted-foreground uppercase">Saldo Anterior</p>
              <p className="text-sm font-bold font-mono">{fmt(previousBalance)}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Créditos</p>
            <p className="text-sm font-bold font-mono text-emerald-500">+{fmt(credits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Débitos</p>
            <p className="text-sm font-bold font-mono text-destructive">-{fmt(debits)}</p>
          </CardContent>
        </Card>
        {finalBalance != null && (
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-[10px] text-muted-foreground uppercase">Saldo Final</p>
              <p className="text-sm font-bold font-mono">{fmt(finalBalance)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
