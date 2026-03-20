import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Upload, Wand2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/contexts/AuthContext";
import { findMatches, type MatchCandidate } from "@/lib/autoConciliation";
import { CompanyFilter } from "@/components/finance/CompanyFilter";

export const ReconciliationPanel = () => {
  const { hasFinanceViewOnly } = useAuth();
  const [companyFilter, setCompanyFilter] = useState(() => sessionStorage.getItem("reconciliation_company") || "all");
  const { data: bankAccounts } = useBankAccounts(companyFilter);
  const [selectedAccount, setSelectedAccount] = useState<string>(() => sessionStorage.getItem("reconciliation_account") || "");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = sessionStorage.getItem("reconciliation_month");
    if (saved) return saved;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => { sessionStorage.setItem("reconciliation_company", companyFilter); }, [companyFilter]);
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

  // Last conciliation date
  const lastConciliationDate = useMemo(() => {
    if (!transactions) return null;
    const conciliated = transactions
      .filter((t) => t.conciliated && t.conciliated_at)
      .map((t) => new Date(t.conciliated_at!).getTime());
    if (conciliated.length === 0) return null;
    return new Date(Math.max(...conciliated));
  }, [transactions]);

  // Day transactions
  const dayTransactions = useMemo(() => {
    if (!transactions || selectedDay === null) return [];
    const dayStr = `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    return transactions.filter((t) => t.date === dayStr);
  }, [transactions, selectedDay, parsedYear, parsedMonth]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: format(d, "MMM yyyy"),
    };
  });

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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <CompanyFilter value={companyFilter} onChange={setCompanyFilter} />
          <Select value={selectedAccount} onValueChange={(v) => { setSelectedAccount(v); setSelectedDay(null); }}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
            <SelectContent>
              {bankAccounts?.filter((b) => b.active).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name} - {b.bank_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setSelectedDay(null); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!hasFinanceViewOnly && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAutoConciliate} disabled={!selectedAccount || stats.pending === 0}>
              <Wand2 className="w-4 h-4 mr-1" /> Conciliar Automaticamente
            </Button>
            <Button onClick={() => setImportOpen(true)} disabled={!selectedAccount}>
              <Upload className="w-4 h-4 mr-1" /> Importar Extrato
            </Button>
          </div>
        )}
      </div>

      {/* Last conciliation badge + Stats */}
      {selectedAccount && (
        <>
          {lastConciliationDate && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Clock className="w-3 h-3" />
                Última conciliação: {format(lastConciliationDate, "dd/MM/yyyy 'às' HH:mm")}
              </Badge>
            </div>
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
              <CardContent className="py-12 text-center text-muted-foreground">
                Importe um extrato para começar
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
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione uma conta bancária para visualizar a conciliação
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
