import { useState } from "react";
import { format } from "date-fns";
import {
  Plus, Search, AlertTriangle, Clock, CheckCircle2, XCircle,
  MoreHorizontal, Trash2, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useReceivables } from "@/hooks/useReceivables";
import { ReceivableForm } from "./ReceivableForm";
import { ReceivableReceiveDialog } from "./ReceivableReceiveDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  open: { label: "Aberto", variant: "outline", icon: Clock },
  received: { label: "Recebido", variant: "default", icon: CheckCircle2 },
  overdue: { label: "Vencido", variant: "destructive", icon: AlertTriangle },
  cancelled: { label: "Cancelado", variant: "secondary", icon: XCircle },
};

export const ReceivablesList = () => {
  const { hasFinanceViewOnly } = useAuth();
  const { selectedCompanyId } = useAppPreferences();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [receiveDialogId, setReceiveDialogId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { receivables, isLoading, stats, createReceivable, deleteReceivable, markAsReceived } = useReceivables(statusFilter, selectedCompanyId);

  const today = new Date().toISOString().split("T")[0];

  const filtered = receivables?.filter((r) =>
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.customer?.name?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const getDisplayStatus = (r: { status: string; due_date: string }) => {
    if (r.status === "open" && r.due_date < today) return "overdue";
    return r.status;
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Inadimplentes</p><p className="text-xl font-bold text-destructive">{fmt(stats.totalOverdue)}</p><p className="text-xs text-muted-foreground">{stats.overdue} título(s)</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Vence Hoje</p><p className="text-xl font-bold text-amber-500">{stats.dueToday}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Próx. 7 dias</p><p className="text-xl font-bold">{stats.dueThisWeek}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-xs text-muted-foreground">Total a Receber</p><p className="text-xl font-bold">{fmt(stats.totalOpen)}</p></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="received">Recebidos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
            </Select>
        </div>
        {!hasFinanceViewOnly && (
          <Button onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova Conta</Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Status</TableHead>
              {!hasFinanceViewOnly && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada</TableCell></TableRow>
            ) : (
              filtered.map((r) => {
                const ds = getDisplayStatus(r);
                const cfg = STATUS_CONFIG[ds] ?? STATUS_CONFIG.open;
                const Icon = cfg.icon;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.description}</TableCell>
                    <TableCell className="text-muted-foreground">{r.customer?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(Number(r.amount))}</TableCell>
                    <TableCell>{format(new Date(r.due_date + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {r.installment_total > 1 ? `${r.installment_number}/${r.installment_total}` : "—"}
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
                            {r.status === "open" && (
                              <DropdownMenuItem onClick={() => setReceiveDialogId(r.id)}>
                                <Banknote className="w-4 h-4 mr-2" /> Dar Baixa
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(r.id)}>
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

      {/* Dialogs */}
      <ReceivableForm open={formOpen} onOpenChange={setFormOpen} onSubmit={createReceivable} />

      {receiveDialogId && (
        <ReceivableReceiveDialog
          open={!!receiveDialogId}
          onOpenChange={() => setReceiveDialogId(null)}
          onConfirm={(data) => {
            markAsReceived({ id: receiveDialogId, ...data });
            setReceiveDialogId(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta a receber?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteReceivable(deleteId!); setDeleteId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
