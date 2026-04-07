import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Plus, Search, AlertTriangle, Clock, CheckCircle2, XCircle,
  MoreHorizontal, Trash2, CreditCard, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { usePayables, type Payable } from "@/hooks/usePayables";
import { PayableForm } from "./PayableForm";
import { PayablePayDialog } from "./PayablePayDialog";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  open: { label: "Aberto", variant: "outline", icon: Clock },
  paid: { label: "Pago", variant: "default", icon: CheckCircle2 },
  overdue: { label: "Vencido", variant: "destructive", icon: AlertTriangle },
  cancelled: { label: "Cancelado", variant: "secondary", icon: XCircle },
};

export const PayablesList = () => {
  const { hasFinanceViewOnly } = useAuth();
  const { selectedCompanyId } = useAppPreferences();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editPayable, setEditPayable] = useState<Payable | null>(null);
  const [payDialogId, setPayDialogId] = useState<string | null>(null);
  const [batchPayOpen, setBatchPayOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { payables, isLoading, stats, createPayable, updatePayable, deletePayable, markAsPaid, markAsPaidBatch, isBatchPaying } = usePayables(statusFilter, selectedCompanyId);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = payables ?? [];

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        p.description.toLowerCase().includes(s) ||
        p.supplier?.name?.toLowerCase().includes(s)
      );
    }

    if (dateFrom) {
      list = list.filter(p => p.due_date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(p => p.due_date <= dateTo);
    }

    return list;
  }, [payables, search, dateFrom, dateTo]);

  // Only open items for selection
  const selectableIds = useMemo(() =>
    filtered.filter(p => p.status === "open").map(p => p.id),
    [filtered]
  );

  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getDisplayStatus = (p: { status: string; due_date: string }) => {
    if (p.status === "open" && p.due_date < today) return "overdue";
    return p.status;
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-xl font-bold text-destructive">{fmt(stats.totalOverdue)}</p><p className="text-xs text-muted-foreground">{stats.overdue} título(s)</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Vence Hoje</p><p className="text-xl font-bold text-amber-500">{stats.dueToday}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Próx. 7 dias</p><p className="text-xl font-bold">{stats.dueThisWeek}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total em Aberto</p><p className="text-xl font-bold">{fmt(stats.totalOpen)}</p></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && !hasFinanceViewOnly && (
              <Button variant="outline" onClick={() => setBatchPayOpen(true)}>
                <CreditCard className="w-4 h-4 mr-1" /> Baixa em {selectedIds.size} título(s)
              </Button>
            )}
            {!hasFinanceViewOnly && (
              <Button onClick={() => { setEditPayable(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Nova Conta</Button>
            )}
          </div>
        </div>

        {/* Date range filters */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-muted-foreground">Vencimento:</span>
          <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="De" />
          <span className="text-sm text-muted-foreground">até</span>
          <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Até" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Limpar</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {!hasFinanceViewOnly && (
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
              )}
              <TableHead>Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Status</TableHead>
              {!hasFinanceViewOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</TableCell></TableRow>
            ) : (
              filtered.map((p) => {
                const ds = getDisplayStatus(p);
                const cfg = STATUS_CONFIG[ds] ?? STATUS_CONFIG.open;
                const Icon = cfg.icon;
                const isOpen = p.status === "open";
                return (
                  <TableRow key={p.id}>
                    {!hasFinanceViewOnly && (
                      <TableCell>
                        {isOpen ? (
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleOne(p.id)}
                          />
                        ) : <div className="w-4" />}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{p.description}</TableCell>
                    <TableCell className="text-muted-foreground">{p.supplier?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{p.chart_account ? `${p.chart_account.code} - ${p.chart_account.name}` : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(Number(p.amount))}</TableCell>
                    <TableCell>{format(new Date(p.due_date + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.installment_total > 1 ? `${p.installment_number}/${p.installment_total}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant} className="gap-1">
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </Badge>
                    </TableCell>
                    {!hasFinanceViewOnly && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditPayable(p);
                              setFormOpen(true);
                            }}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            {isOpen && (
                              <DropdownMenuItem onClick={() => setPayDialogId(p.id)}>
                                <CreditCard className="w-4 h-4 mr-2" /> Dar Baixa
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit form */}
      <PayableForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditPayable(null); }}
        onSubmit={createPayable}
        onUpdate={updatePayable}
        defaultValues={editPayable ? {
          id: editPayable.id,
          description: editPayable.description,
          amount: Number(editPayable.amount),
          due_date: editPayable.due_date,
          supplier_id: editPayable.supplier_id,
          cost_center_id: editPayable.cost_center_id,
          bank_account_id: editPayable.bank_account_id,
          chart_account_id: editPayable.chart_account_id,
          payment_method: editPayable.payment_method,
          notes: editPayable.notes,
          installment_total: editPayable.installment_total,
        } : undefined}
      />

      {/* Single pay dialog */}
      {payDialogId && (
        <PayablePayDialog
          open={!!payDialogId}
          onOpenChange={() => setPayDialogId(null)}
          onConfirm={(data) => {
            markAsPaid({ id: payDialogId, ...data });
            setPayDialogId(null);
          }}
        />
      )}

      {/* Batch pay dialog */}
      {batchPayOpen && (
        <PayablePayDialog
          open={batchPayOpen}
          onOpenChange={() => setBatchPayOpen(false)}
          onConfirm={(data) => {
            markAsPaidBatch({ ids: Array.from(selectedIds), ...data });
            setBatchPayOpen(false);
            setSelectedIds(new Set());
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta a pagar?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deletePayable(deleteId!); setDeleteId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
