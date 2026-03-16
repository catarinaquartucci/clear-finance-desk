import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { useCostCenterDashboard } from "@/hooks/useReportQueries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { exportToExcel, exportToPDF, formatCurrency } from "@/lib/exportUtils";
import { format } from "date-fns";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6",
];

export const CostCenterDashboard = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [companyId, setCompanyId] = useState("3d37326f-bedc-4a16-b81f-0213c826d423");

  const df = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dt = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
  const { data, isLoading } = useCostCenterDashboard(df, dt, companyId);

  const grandTotal = (data || []).reduce((s, d) => s + d.total, 0);

  const totalPaid = (data || []).reduce((s, d) => s + d.paid, 0);
  const totalOpen = (data || []).reduce((s, d) => s + d.open, 0);
  const totalCount = (data || []).reduce((s, d) => s + d.count, 0);

  const handleExcel = () => {
    const rows = (data || []).map(d => ({
      Código: d.code, "Centro de Custo": d.name, Total: d.total, Pago: d.paid, "Em Aberto": d.open, Qtd: d.count,
    }));
    rows.push({ Código: "", "Centro de Custo": "TOTAL", Total: grandTotal, Pago: totalPaid, "Em Aberto": totalOpen, Qtd: totalCount });
    exportToExcel(rows, "gastos-centro-custo");
  };

  const handlePDF = () => {
    const rows = (data || []).map(d => [d.code, d.name, formatCurrency(d.total), formatCurrency(d.paid), formatCurrency(d.open), String(d.count)]);
    rows.push(["", "TOTAL", formatCurrency(grandTotal), formatCurrency(totalPaid), formatCurrency(totalOpen), String(totalCount)]);
    exportToPDF("Gastos por Centro de Custo",
      ["Código", "Centro de Custo", "Total", "Pago", "Em Aberto", "Qtd"],
      rows
    );
  };

  return (
    <div>
      <ReportFilters dateFrom={dateFrom} dateTo={dateTo} companyId={companyId}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo} onCompanyChange={setCompanyId}
        onExportExcel={handleExcel} onExportPDF={handlePDF} />

      {isLoading ? <p className="text-muted-foreground py-8 text-center">Carregando...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card className="bg-card border-subtle">
            <CardHeader><CardTitle className="text-lg">Distribuição por Centro de Custo</CardTitle></CardHeader>
            <CardContent>
              {(data || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={(data || []).map(d => ({ name: d.name, value: d.total }))} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={2}>
                      {(data || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="bg-card border-subtle">
            <CardHeader><CardTitle className="text-lg">Detalhamento</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">Total geral: {formatCurrency(grandTotal)}</div>
              <div className="border border-subtle rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Código</TableHead><TableHead>Centro de Custo</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Pago</TableHead><TableHead className="text-right">Aberto</TableHead><TableHead className="text-right">Qtd</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data || []).map(d => (
                      <TableRow key={d.id}>
                        <TableCell>{d.code}</TableCell>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.total)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.paid)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.open)}</TableCell>
                        <TableCell className="text-right">{d.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
