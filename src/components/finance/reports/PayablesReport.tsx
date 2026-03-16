import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { usePayablesReport } from "@/hooks/useReportQueries";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/lib/exportUtils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Hash, TrendingUp, ArrowUpRight, FileX } from "lucide-react";

const statusMap: Record<string, { label: string; variant: "destructive" | "secondary" | "default" | "outline" }> = {
  overdue: { label: "Vencido", variant: "destructive" },
  pending: { label: "Pendente", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
};

export const PayablesReport = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [companyId, setCompanyId] = useState("3d37326f-bedc-4a16-b81f-0213c826d423");

  const df = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dt = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
  const { data, isLoading } = usePayablesReport(df, dt, companyId);

  const items = data || [];
  const total = items.reduce((s, p: any) => s + Number(p.amount), 0);
  const maxVal = items.length ? Math.max(...items.map((p: any) => Number(p.amount))) : 0;
  const avgVal = items.length ? total / items.length : 0;

  const handleExcel = () => {
    const rows = items.map((p: any) => ({
      Descrição: p.description, Fornecedor: (p.suppliers as any)?.name || "-", Valor: Number(p.amount),
      Vencimento: p.due_date, Status: p.status, "Centro Custo": (p.cost_centers as any)?.name || "-",
      Filial: (p.group_companies as any)?.name || "-",
    }));
    rows.push({ Descrição: "TOTAL", Fornecedor: "", Valor: total, Vencimento: "", Status: "", "Centro Custo": "", Filial: "" });
    exportToExcel(rows, "contas-a-pagar");
  };

  const handlePDF = () => {
    const pdfRows = items.map((p: any) => [p.description, (p.suppliers as any)?.name || "-", formatCurrency(Number(p.amount)), formatDate(p.due_date), statusMap[p.status]?.label || p.status]);
    pdfRows.push(["TOTAL", "", formatCurrency(total), "", ""]);
    exportToPDF("Contas a Pagar", ["Descrição", "Fornecedor", "Valor", "Vencimento", "Status"], pdfRows, {
      highlightLastRow: true,
      summaryCards: [
        { label: "Total", value: formatCurrency(total) },
        { label: "Quantidade", value: String(items.length) },
        { label: "Maior Valor", value: formatCurrency(maxVal) },
        { label: "Valor Médio", value: formatCurrency(avgVal) },
      ],
    });
  };

  const summaryCards = [
    { label: "Total", value: formatCurrency(total), icon: DollarSign, color: "text-primary" },
    { label: "Quantidade", value: String(items.length), icon: Hash, color: "text-muted-foreground" },
    { label: "Maior Valor", value: formatCurrency(maxVal), icon: ArrowUpRight, color: "text-destructive" },
    { label: "Valor Médio", value: formatCurrency(avgVal), icon: TrendingUp, color: "text-muted-foreground" },
  ];

  return (
    <div>
      <ReportFilters dateFrom={dateFrom} dateTo={dateTo} companyId={companyId}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo} onCompanyChange={setCompanyId}
        onExportExcel={handleExcel} onExportPDF={handlePDF} />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {summaryCards.map((c, i) => (
              <Card key={c.label} className="bg-card animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60">
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-lg font-bold text-foreground">{c.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Detalhamento
                <Badge variant="outline" className="font-normal">{items.length} registros</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-xl">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Descrição</TableHead><TableHead>Fornecedor</TableHead><TableHead>Centro Custo</TableHead><TableHead>Filial</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((p: any) => (
                      <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-medium">{p.description}</TableCell>
                        <TableCell>{(p.suppliers as any)?.name || "-"}</TableCell>
                        <TableCell>{(p.cost_centers as any)?.name || "-"}</TableCell>
                        <TableCell>{(p.group_companies as any)?.name || "-"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                        <TableCell>{formatDate(p.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[p.status]?.variant || "secondary"}>
                            {statusMap[p.status]?.label || p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileX className="w-10 h-10" />
                            <p className="text-sm">Nenhum registro encontrado</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {items.length > 0 && (
                    <TableFooter>
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={4}>TOTAL</TableCell>
                        <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
