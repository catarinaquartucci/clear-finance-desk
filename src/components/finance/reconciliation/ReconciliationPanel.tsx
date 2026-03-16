import { useState } from "react";
import { format } from "date-fns";
import {
  Upload, Search, CheckCircle2, Circle, Link2, Unlink, ArrowDownCircle, ArrowUpCircle, Wand2, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useBankTransactions } from "@/hooks/useBankTransactions";
import { usePayables } from "@/hooks/usePayables";
import { useReceivables } from "@/hooks/useReceivables";
import { ImportStatementDialog } from "./ImportStatementDialog";
import { ConciliateDialog } from "./ConciliateDialog";
import { AutoConciliationDialog } from "./AutoConciliationDialog";
import { useAuth } from "@/contexts/AuthContext";
import { findMatches, type MatchCandidate } from "@/lib/autoConciliation";
import { CompanyFilter } from "@/components/finance/CompanyFilter";

export const ReconciliationPanel = () => {
  const { hasFinanceViewOnly } = useAuth();
  const [companyFilter, setCompanyFilter] = useState("all");
  const { data: bankAccounts } = useBankAccounts(companyFilter);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [conciliateId, setConciliateId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState<"all" | "pending" | "conciliated">("all");
  const [typeFilter, setTypeFilter] = useState<"debit" | "credit" | "all">("debit");
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

  const filtered = transactions?.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = showFilter === "all" ||
      (showFilter === "pending" && !t.conciliated) ||
      (showFilter === "conciliated" && t.conciliated);
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  }) ?? [];

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
      selected.map(m => ({
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
      {/* Account & Month selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <CompanyFilter value={companyFilter} onChange={setCompanyFilter} />
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
            <SelectContent>
              {bankAccounts?.filter(b => b.active).map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name} - {b.bank_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!hasFinanceViewOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAutoConciliate}
              disabled={!selectedAccount || stats.pending === 0}
            >
              <Wand2 className="w-4 h-4 mr-1" /> Conciliar Automaticamente
            </Button>
            <Button onClick={() => setImportOpen(true)} disabled={!selectedAccount}>
              <Upload className="w-4 h-4 mr-1" /> Importar Extrato
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {selectedAccount && (
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
      )}

      {/* Toolbar */}
      {selectedAccount && (
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="debit">Débitos</SelectItem>
              <SelectItem value="credit">Créditos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={showFilter} onValueChange={(v) => setShowFilter(v as any)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="conciliated">Conciliados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      {selectedAccount ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                {!hasFinanceViewOnly && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {transactions?.length === 0 ? "Importe um extrato para começar" : "Nenhum lançamento encontrado"}
                </TableCell></TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className={t.conciliated ? "opacity-60" : ""}>
                    <TableCell>
                      {t.type === "credit" ? (
                        <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowDownCircle className="w-4 h-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(t.date + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">{t.description}</TableCell>
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
                    {!hasFinanceViewOnly && (
                      <TableCell>
                        <div className="flex gap-1">
                          {t.conciliated ? (
                            <Button variant="ghost" size="icon" title="Desfazer conciliação" onClick={() => unconciliate(t.id)}>
                              <Unlink className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" title="Conciliar" onClick={() => setConciliateId(t.id)}>
                                <Link2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Ignorar" onClick={() => markAsIgnored(t.id)}>
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
          transaction={transactions?.find(t => t.id === conciliateId) ?? null}
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
