import { useState, useMemo, useEffect } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload, Wand2, Clock, ChevronLeft, ChevronRight, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useBankTransactions } from "@/hooks/useBankTransactions";
import { usePayables } from "@/hooks/usePayables";
import { useReceivables } from "@/hooks/useReceivables";
import { ImportStatementDialog } from "./ImportStatementDialog";
import { ConciliateDialog } from "./ConciliateDialog";
import { AutoConciliationDialog } from "./AutoConciliationDialog";
import { ReconciliationCalendar } from "./ReconciliationCalendar";
import { DayTransactionsList } from "./DayTransactionsList";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

export const ReconciliationPanel = () => {
  const { hasFinanceViewOnly } = useAuth();
  const { selectedCompanyId } = useAppPreferences();
  const { data: bankAccounts } = useBankAccounts(selectedCompanyId);
  const [selectedAccount, setSelectedAccount] = useState<string>(() => sessionStorage.getItem("reconciliation_account") || "");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = sessionStorage.getItem("reconciliation_month");
    if (saved) return saved;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Auto-select first active account when none is selected
  useEffect(() => {
    if (!selectedAccount && bankAccounts && bankAccounts.length > 0) {
      const firstActive = bankAccounts.find((b) => b.active);
      if (firstActive) {
        setSelectedAccount(firstActive.id);
      }
    }
  }, [bankAccounts, selectedAccount]);

  useEffect(() => { sessionStorage.setItem("reconciliation_account", selectedAccount); }, [selectedAccount]);
  useEffect(() => { sessionStorage.setItem("reconciliation_month", selectedMonth); }, [selectedMonth]);
  const [importOpen, setImportOpen] = useState(false);
  const [conciliateId, setConciliateId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoMatches, setAutoMatches] = useState<MatchCandidate[]>([]);

  const {
    transactions, isLoading, stats,
    importTransactions, isImporting,
    conciliate, unconciliate,
    batchConciliate, isBatchConciliating,
    markAsIgnored,
  } = useBankTransactions(selectedAccount, selectedMonth);

  const { payables } = usePayables("open");
  const { receivables } = useReceivables("open");

  const [parsedYear, parsedMonth] = selectedMonth.split("-").map(Number);

  // Month navigation helpers
  const navigateMonth = (direction: "prev" | "next") => {
    const current = new Date(parsedYear, parsedMonth - 1, 1);
    const target = direction === "prev" ? subMonths(current, 1) : addMonths(current, 1);
    const newVal = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newVal);
    setSelectedDay(null);
  };

  const currentMonthLabel = format(new Date(parsedYear, parsedMonth - 1, 1), "MMMM yyyy", { locale: ptBR });

  // Last conciliation date
  const lastConciliationDate = useMemo(() => {
    if (!transactions) return null;
    const conciliated = transactions
      .filter((t) => t.conciliated && t.conciliated_at)
      .map((t) => new Date(t.conciliated_at!).getTime());
    if (conciliated.length === 0) return null;
    return new Date(Math.max(...conciliated));
  }, [transactions]);

  // Progress
  const progressPercent = stats.total > 0 ? Math.round((stats.conciliated / stats.total) * 100) : 0;

  // Day transactions
  const dayTransactions = useMemo(() => {
    if (!transactions || selectedDay === null) return [];
    const dayStr = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    return transactions.filter((t) => t.date === dayStr);
  }, [transactions, selectedDay, parsedYear, parsedMonth]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
        navigateMonth("prev");
      }
      if (e.key === "ArrowRight" && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
        navigateMonth("next");
      }
      if (e.key === "Escape" && selectedDay !== null) {
        setSelectedDay(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedDay, parsedYear, parsedMonth]);

  const handleAutoConciliate = () => {
    if (!transactions || !payables || !receivables) return;
    const matches = findMatches(transactions, payables, receivables);
    setAutoMatches(matches);
    setAutoOpen(true);
  };

  const handleConfirmAuto = (selected: MatchCandidate[]) => {
    batchConciliate(
      selected.map((m) => ({
        transactionId: m.transactionId,
        withType: m.withType,
        withId: m.withId,
      }))
    );
    setAutoOpen(false);
    setAutoMatches([]);
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={selectedAccount} onValueChange={(v) => { setSelectedAccount(v); setSelectedDay(null); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
          <SelectContent>
            {bankAccounts?.filter((b) => b.active).map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name} - {b.bank_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Month nav with arrows */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[120px] text-center">{currentMonthLabel}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Row 2: Actions */}
      {!hasFinanceViewOnly && selectedAccount && (
        <>
          <Separator />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleAutoConciliate} disabled={!selectedAccount || stats.pending === 0}>
              <Wand2 className="w-4 h-4 mr-1" /> Conciliar Automaticamente
            </Button>
            <Button onClick={() => setImportOpen(true)} disabled={!selectedAccount}>
              <Upload className="w-4 h-4 mr-1" /> Importar Extrato
            </Button>
          </div>
        </>
      )}

      {/* Last conciliation badge + Stats + Progress */}
      {selectedAccount && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            {lastConciliationDate && (
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Clock className="w-3 h-3" />
                Última conciliação: {format(lastConciliationDate, "dd/MM/yyyy 'às' HH:mm")}
              </Badge>
            )}
            {stats.total > 0 && (
              <Badge variant="secondary" className="gap-1.5 text-xs">
                {progressPercent}% conciliado ({stats.conciliated} de {stats.total})
              </Badge>
            )}
          </div>

          {stats.total > 0 && (
            <Progress value={progressPercent} className="h-2" />
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Conciliados</p>
                <p className="text-xl font-bold text-emerald-500">{stats.conciliated}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-amber-500">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Créditos</p>
                <p className="text-xl font-bold text-emerald-500">{fmt(stats.totalCredits)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Débitos</p>
                <p className="text-xl font-bold text-destructive">{fmt(stats.totalDebits)}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Calendar + Day detail */}
      {selectedAccount ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : transactions?.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <FileSearch className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Nenhuma transação encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Importe um extrato bancário (OFX/CSV) para iniciar a conciliação deste mês.
                  </p>
                </div>
                {!hasFinanceViewOnly && (
                  <Button onClick={() => setImportOpen(true)}>
                    <Upload className="w-4 h-4 mr-1" /> Importar Primeiro Extrato
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <ReconciliationCalendar
                year={parsedYear}
                month={parsedMonth}
                transactions={transactions ?? []}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />

              {selectedDay !== null && (
                <DayTransactionsList
                  day={selectedDay}
                  month={parsedMonth}
                  year={parsedYear}
                  transactions={dayTransactions}
                  allTransactions={transactions ?? []}
                  readOnly={!!hasFinanceViewOnly}
                  onConciliate={(id) => setConciliateId(id)}
                  onUnconciliate={(id) => unconciliate(id)}
                  onIgnore={(id) => markAsIgnored(id)}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Selecione uma conta bancária</p>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha uma conta acima para visualizar e conciliar as transações.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ImportStatementDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importTransactions}
        isImporting={isImporting}
        preselectedAccountId={selectedAccount}
      />

      {conciliateId && (
        <ConciliateDialog
          open={!!conciliateId}
          onOpenChange={() => setConciliateId(null)}
          transaction={transactions?.find((t) => t.id === conciliateId) ?? null}
          payables={payables ?? []}
          receivables={receivables ?? []}
          onConciliate={(withType, withId, conciliatedAmount) => {
            conciliate({ transactionId: conciliateId, withType, withId, conciliatedAmount });
            setConciliateId(null);
          }}
        />
      )}

      <AutoConciliationDialog
        open={autoOpen}
        onOpenChange={setAutoOpen}
        matches={autoMatches}
        transactions={transactions ?? []}
        onConfirm={handleConfirmAuto}
        isProcessing={isBatchConciliating}
      />
    </div>
  );
};
