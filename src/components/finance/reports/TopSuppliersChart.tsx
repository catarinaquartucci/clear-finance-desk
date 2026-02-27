import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { useTopSuppliersReport } from "@/hooks/useReportQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { exportToExcel, exportToPDF, formatCurrency } from "@/lib/exportUtils";
import { format } from "date-fns";

export const TopSuppliersChart = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [companyId, setCompanyId] = useState("all");

  const df = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dt = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
  const { data, isLoading } = useTopSuppliersReport(df, dt, companyId);

  const handleExcel = () => {
    exportToExcel((data || []).map(d => ({ Fornecedor: d.name, "Total Pago": d.total, Quantidade: d.count })), "top-fornecedores");
  };

  const handlePDF = () => {
    exportToPDF("Top Fornecedores", ["Fornecedor", "Total Pago", "Qtd"],
      (data || []).map(d => [d.name, formatCurrency(d.total), String(d.count)]));
  };

  return (
    <Card className="bg-card border-subtle">
      <CardHeader><CardTitle className="text-lg">Top Fornecedores por Valor Pago</CardTitle></CardHeader>
      <CardContent>
        <ReportFilters dateFrom={dateFrom} dateTo={dateTo} companyId={companyId}
          onDateFromChange={setDateFrom} onDateToChange={setDateTo} onCompanyChange={setCompanyId}
          onExportExcel={handleExcel} onExportPDF={handlePDF} />

        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          (data || []).length === 0 ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
            <ResponsiveContainer width="100%" height={Math.max(300, (data || []).length * 40)}>
              <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" name="Total Pago" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
};
