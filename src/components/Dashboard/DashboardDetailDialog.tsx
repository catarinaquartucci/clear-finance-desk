import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import type {
  BankAccountDetail,
  TransactionDetail,
  ProjecaoDetail,
  PayableAlert,
  ExpenseCategory,
} from "@/hooks/useFinanceDashboard";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export type DetailType = "saldo" | "entradas" | "saidas" | "projecao" | "payables" | "despesas";

interface Props {
  type: DetailType | null;
  onClose: () => void;
  bankAccounts?: BankAccountDetail[];
  entradas?: TransactionDetail[];
  saidas?: TransactionDetail[];
  projecao?: ProjecaoDetail;
  payables?: PayableAlert[];
  expenses?: ExpenseCategory[];
  totalVencido?: number;
  totalAVencer?: number;
}

const TITLES: Record<DetailType, string> = {
  saldo: "Saldo por Conta Bancária",
  entradas: "Entradas do Mês",
  saidas: "Saídas do Mês",
  projecao: "Projeção de Caixa — 30 dias",
  payables: "Contas a Pagar — Atenção",
  despesas: "Despesas por Tipo",
};

export const DashboardDetailDialog = ({
  type,
  onClose,
  bankAccounts,
  entradas,
  saidas,
  projecao,
  payables,
  expenses,
  totalVencido,
  totalAVencer,
}: Props) => {
  if (!type) return null;

  return (
    <Dialog open={!!type} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{TITLES[type]}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          {type === "saldo" && <SaldoDetail data={bankAccounts || []} />}
          {type === "entradas" && <TransactionTable data={entradas || []} />}
          {type === "saidas" && <TransactionTable data={saidas || []} />}
          {type === "projecao" && projecao && <ProjecaoBreakdown data={projecao} />}
          {type === "payables" && (
            <PayablesDetail data={payables || []} totalVencido={totalVencido || 0} totalAVencer={totalAVencer || 0} />
          )}
          {type === "despesas" && <ExpensesDetail data={expenses || []} />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const SaldoDetail = ({ data }: { data: BankAccountDetail[] }) => {
  const total = data.reduce((s, a) => s + a.current_balance, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Conta</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((a, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell className="text-muted-foreground">{a.bank_name}</TableCell>
            <TableCell className="text-right font-medium">{fmt(a.current_balance)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2 border-border font-bold">
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">{fmt(total)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

const TransactionTable = ({ data }: { data: TransactionDetail[] }) => {
  const total = data.reduce((s, t) => s + t.amount, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right">Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </TableCell>
          </TableRow>
        ) : (
          <>
            {data.map((t, i) => (
              <TableRow key={i}>
                <TableCell className="max-w-[280px] truncate" title={t.description}>
                  {t.description}
                </TableCell>
                <TableCell className="text-right font-medium whitespace-nowrap">{fmt(t.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                  {format(parseISO(t.date), "dd/MM/yyyy")}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-border font-bold">
              <TableCell>Total ({data.length})</TableCell>
              <TableCell className="text-right">{fmt(total)}</TableCell>
              <TableCell />
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
  );
};

const ProjecaoBreakdown = ({ data }: { data: ProjecaoDetail }) => (
  <div className="space-y-4 p-2">
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Saldo Atual</p>
        <p className="text-xl font-bold text-primary">{fmt(data.saldoAtual)}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Receitas Previstas</p>
        <p className="text-xl font-bold text-neon-green">{fmt(data.receitaPrevista)}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Despesas Previstas</p>
        <p className="text-xl font-bold text-destructive">{fmt(data.despesaPrevista)}</p>
      </div>
      <div className="rounded-lg border-2 border-primary p-4">
        <p className="text-sm text-muted-foreground">Projeção Final</p>
        <p className={`text-xl font-bold ${data.projecaoCaixa >= 0 ? "text-neon-green" : "text-destructive"}`}>
          {fmt(data.projecaoCaixa)}
        </p>
      </div>
    </div>
    <p className="text-xs text-muted-foreground text-center">
      Projeção = Saldo Atual + Recebíveis Abertos − Pagáveis Abertos (próximos 30 dias)
    </p>
  </div>
);

const PayablesDetail = ({
  data,
  totalVencido,
  totalAVencer,
}: {
  data: PayableAlert[];
  totalVencido: number;
  totalAVencer: number;
}) => (
  <div className="space-y-4">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right">Vencimento</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              Nenhuma conta vencida ou próxima do vencimento 🎉
            </TableCell>
          </TableRow>
        ) : (
          data.map(p => (
            <TableRow key={p.id}>
              <TableCell className="max-w-[200px] truncate" title={p.description}>
                {p.supplier_name || p.description}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">{fmt(p.amount)}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {format(parseISO(p.due_date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={p.status === "overdue" ? "destructive" : "outline"} className="text-xs">
                  {p.status === "overdue" ? "Vencido" : "Próximo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    {data.length > 0 && (
      <div className="flex justify-between pt-2 border-t text-sm">
        <span className="text-destructive font-semibold">Vencido: {fmt(totalVencido)}</span>
        <span className="text-orange font-semibold">A vencer: {fmt(totalAVencer)}</span>
      </div>
    )}
  </div>
);

const ExpensesDetail = ({ data }: { data: ExpenseCategory[] }) => {
  const total = data.reduce((s, e) => s + e.value, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="text-right">%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((e, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: e.fill }} />
                {e.name}
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">{fmt(e.value)}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {total > 0 ? ((e.value / total) * 100).toFixed(1) : "0.0"}%
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2 border-border font-bold">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">{fmt(total)}</TableCell>
          <TableCell className="text-right">100%</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
