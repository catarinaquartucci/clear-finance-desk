import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { BankTransaction } from "@/hooks/useBankTransactions";

interface DayData {
  total: number;
  pending: number;
  conciliated: number;
  credits: number;
  debits: number;
}

interface Props {
  year: number;
  month: number; // 1-based
  transactions: BankTransaction[];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const ReconciliationCalendar = ({
  year, month, transactions, selectedDay, onSelectDay,
}: Props) => {
  const isMobile = useIsMobile();

  const dayMap = useMemo(() => {
    const map = new Map<number, DayData>();
    for (const t of transactions) {
      const d = new Date(t.date + "T12:00:00").getDate();
      const current = map.get(d) ?? { total: 0, pending: 0, conciliated: 0, credits: 0, debits: 0 };
      current.total++;
      if (t.conciliated) current.conciliated++;
      else current.pending++;
      const amt = Math.abs(Number(t.amount));
      if (t.type === "credit") current.credits += amt;
      else current.debits += amt;
      map.set(d, current);
    }
    return map;
  }, [transactions]);

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  // Mobile: list view showing only days with transactions
  if (isMobile) {
    const daysWithData = Array.from(dayMap.entries())
      .sort(([a], [b]) => a - b);

    if (daysWithData.length === 0) {
      return (
        <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">
          Nenhuma movimentação neste mês
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {daysWithData.map(([day, data]) => {
          const isSelected = selectedDay === day;
          const isToday = isCurrentMonth && today.getDate() === day;
          const hasPending = data.pending > 0;
          const allConciliated = data.total > 0 && data.pending === 0;
          const dayOfWeek = WEEKDAYS[new Date(year, month - 1, day).getDay()];

          return (
            <Collapsible key={day} open={isSelected} onOpenChange={() => onSelectDay(day)}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border p-3 transition-colors",
                    isSelected && "bg-primary/10 border-primary",
                    !isSelected && hasPending && "bg-amber-500/5 border-amber-500/20",
                    !isSelected && allConciliated && "bg-emerald-500/5 border-emerald-500/20",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isToday ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}>
                      {day}
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-muted-foreground">{dayOfWeek}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          hasPending ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <span className="text-xs text-muted-foreground">{data.total} mov.</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {data.credits > 0 && (
                        <p className="text-xs text-emerald-600 font-mono">+{fmt(data.credits)}</p>
                      )}
                      {data.debits > 0 && (
                        <p className="text-xs text-destructive font-mono">-{fmt(data.debits)}</p>
                      )}
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isSelected && "rotate-180")} />
                  </div>
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // Desktop: calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-muted-foreground py-2 border-b">
            {w}
          </div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r bg-muted/20" />;
          }
          const data = dayMap.get(day);
          const isSelected = selectedDay === day;
          const isToday = isCurrentMonth && today.getDate() === day;
          const hasPending = data && data.pending > 0;
          const allConciliated = data && data.total > 0 && data.pending === 0;

          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[80px] border-b border-r p-1.5 text-left transition-colors hover:bg-accent/50 relative flex flex-col",
                isSelected && "bg-primary/10 ring-2 ring-primary ring-inset",
                !isSelected && hasPending && "bg-amber-500/5",
                !isSelected && allConciliated && "bg-emerald-500/5",
              )}
            >
              <span className={cn(
                "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                isToday && "bg-primary text-primary-foreground",
              )}>
                {day}
              </span>
              {data && (
                <div className="mt-auto space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      hasPending ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <span className="text-[10px] text-muted-foreground">{data.total} mov.</span>
                  </div>
                  {data.debits > 0 && (
                    <p className="text-[10px] text-destructive font-mono truncate">-{fmt(data.debits)}</p>
                  )}
                  {data.credits > 0 && (
                    <p className="text-[10px] text-emerald-600 font-mono truncate">+{fmt(data.credits)}</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
