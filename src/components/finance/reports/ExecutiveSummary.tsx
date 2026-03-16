import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { useExecutiveSummary } from "@/hooks/useReportQueries";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, exportToPDF } from "@/lib/exportUtils";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, AlertTriangle, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const ExecutiveSummary = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [companyId, setCompanyId] = useState("3d37326f-bedc-4a16-b81f-0213c826d423");

  const df = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dt = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
  const { data, isLoading } = useExecutiveSummary(df, dt, companyId);

  const handlePDF = () => {
    if (!data) return;
    exportToPDF("Resumo Executivo Financeiro",
      ["Indicador", "Valor"],
      [
        ["Total a Pagar", formatCurrency(data.totalPagar)],
        ["Total a Receber", formatCurrency(data.totalReceber)],
        ["Saldo Líquido", formatCurrency(data.saldoLiquido)],
        ["Total Vencido (Pagar)", formatCurrency(data.totalVencido)],
        ["Total Vencido (Receber)", formatCurrency(data.totalReceberVencido)],
        ["Taxa Inadimplência", `${data.taxaInadimplencia.toFixed(1)}%`],
        ["Ticket Médio (Pagar)", formatCurrency(data.ticketMedioPagar)],
        ["Ticket Médio (Receber)", formatCurrency(data.ticketMedioReceber)],
      ]
    );
  };

  type BorderColor = "border-l-primary" | "border-l-destructive" | "border-l-yellow-500" | "border-l-muted-foreground";

  const kpis = data ? [
    { label: "Total a Pagar", value: formatCurrency(data.totalPagar), icon: ArrowDown, color: "text-destructive", border: "border-l-destructive" as BorderColor },
    { label: "Total a Receber", value: formatCurrency(data.totalReceber), icon: ArrowUp, color: "text-primary", border: "border-l-primary" as BorderColor },
    { label: "Saldo Líquido", value: formatCurrency(data.saldoLiquido), icon: Wallet, color: data.saldoLiquido >= 0 ? "text-primary" : "text-destructive", border: (data.saldoLiquido >= 0 ? "border-l-primary" : "border-l-destructive") as BorderColor },
    { label: "Total Vencido", value: formatCurrency(data.totalVencido + data.totalReceberVencido), icon: AlertTriangle, color: "text-yellow-500", border: "border-l-yellow-500" as BorderColor },
    { label: "Inadimplência", value: `${data.taxaInadimplencia.toFixed(1)}%`, icon: TrendingUp, color: data.taxaInadimplencia > 10 ? "text-destructive" : "text-muted-foreground", border: (data.taxaInadimplencia > 10 ? "border-l-destructive" : "border-l-muted-foreground") as BorderColor, progress: Math.min(data.taxaInadimplencia, 100) },
    { label: "Ticket Médio Pagar", value: formatCurrency(data.ticketMedioPagar), icon: BarChart3, color: "text-muted-foreground", border: "border-l-muted-foreground" as BorderColor },
  ] : [];

  return (
    <div>
      <ReportFilters dateFrom={dateFrom} dateTo={dateTo} companyId={companyId}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo} onCompanyChange={setCompanyId}
        onExportPDF={handlePDF} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, index) => (
            <Card
              key={kpi.label}
              className={`bg-card border-l-4 ${kpi.border} hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2`}
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-muted/60">
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground truncate">{kpi.value}</p>
                    {kpi.progress !== undefined && (
                      <Progress value={kpi.progress} className="h-1.5 mt-2" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
