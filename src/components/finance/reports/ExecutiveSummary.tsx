import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { useExecutiveSummary } from "@/hooks/useReportQueries";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, exportToPDF } from "@/lib/exportUtils";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, AlertTriangle, TrendingUp, Wallet, BarChart3 } from "lucide-react";

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

  const kpis = data ? [
    { label: "Total a Pagar", value: formatCurrency(data.totalPagar), icon: ArrowDown, color: "text-destructive" },
    { label: "Total a Receber", value: formatCurrency(data.totalReceber), icon: ArrowUp, color: "text-primary" },
    { label: "Saldo Líquido", value: formatCurrency(data.saldoLiquido), icon: Wallet, color: data.saldoLiquido >= 0 ? "text-primary" : "text-destructive" },
    { label: "Total Vencido", value: formatCurrency(data.totalVencido + data.totalReceberVencido), icon: AlertTriangle, color: "text-yellow-500" },
    { label: "Inadimplência", value: `${data.taxaInadimplencia.toFixed(1)}%`, icon: TrendingUp, color: data.taxaInadimplencia > 10 ? "text-destructive" : "text-muted-foreground" },
    { label: "Ticket Médio Pagar", value: formatCurrency(data.ticketMedioPagar), icon: BarChart3, color: "text-muted-foreground" },
  ] : [];

  return (
    <div>
      <ReportFilters dateFrom={dateFrom} dateTo={dateTo} companyId={companyId}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo} onCompanyChange={setCompanyId}
        onExportPDF={handlePDF} />

      {isLoading ? <p className="text-muted-foreground py-8 text-center">Carregando...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="bg-card border-subtle">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
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
