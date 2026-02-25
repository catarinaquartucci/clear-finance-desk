import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Send, CheckCircle, Ban, Trash2, Search, Copy } from "lucide-react";
import { useBoletos } from "@/hooks/useBoletos";
import { BoletoForm } from "./BoletoForm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  generated: { label: "Gerado", variant: "secondary" },
  sent: { label: "Enviado", variant: "outline" },
  paid: { label: "Pago", variant: "default" },
  overdue: { label: "Vencido", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export const BoletosList = () => {
  const { boletos, isLoading, stats, markSent, markPaid, cancelBoleto, deleteBoleto } = useBoletos();
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const filtered = boletos.filter(
    (b) =>
      b.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.our_number?.includes(search) ||
      b.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (b: typeof boletos[0]) => {
    if (b.status === "cancelled" || b.status === "paid") return b.status;
    if (["generated", "sent"].includes(b.status) && b.due_date < today) return "overdue";
    return b.status;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Gerados</p><p className="text-xl font-bold">{stats.generated}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Enviados</p><p className="text-xl font-bold">{stats.sent}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-xl font-bold">{stats.paid}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground text-destructive">Vencidos</p><p className="text-xl font-bold text-destructive">{stats.overdue}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total em Aberto</p><p className="text-xl font-bold">{fmt(stats.totalOpen)}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Boletos</CardTitle>
              <CardDescription>Controle interno de boletos bancários</CardDescription>
            </div>
            <BoletoForm />
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente, nosso número..." className="pl-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum boleto encontrado</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nosso Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Código de Barras</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => {
                    const displayStatus = getStatus(b);
                    const st = STATUS_MAP[displayStatus] || STATUS_MAP.generated;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-sm">{b.our_number || "—"}</TableCell>
                        <TableCell>{b.customers?.name || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(Number(b.amount))}</TableCell>
                        <TableCell className={cn("tabular-nums", displayStatus === "overdue" && "text-destructive font-medium")}>
                          {new Date(b.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell>
                          {b.barcode ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs font-mono"
                              onClick={() => {
                                navigator.clipboard.writeText(b.barcode!);
                                toast.success("Código copiado");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              {b.barcode.slice(0, 20)}...
                            </Button>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {b.status === "generated" && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markSent(b.id)} title="Marcar enviado">
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {["generated", "sent"].includes(b.status) && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markPaid(b.id)} title="Marcar pago">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {["generated", "sent"].includes(b.status) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Cancelar"><Ban className="w-3.5 h-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancelar boleto?</AlertDialogTitle>
                                    <AlertDialogDescription>O boleto #{b.our_number} será cancelado.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => cancelBoleto(b.id)}>Cancelar Boleto</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {b.status === "generated" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir boleto?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteBoleto(b.id)}>Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
