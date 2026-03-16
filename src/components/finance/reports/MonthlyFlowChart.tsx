import { useState } from "react";
import { useMonthlyFlowReport } from "@/hooks/useReportQueries";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ArrowUp, ArrowDown, Wallet } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";

const currentYear = new Date().getFullYear();
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const MonthlyFlowChart = () => {
  const [year, setYear] = useState(currentYear);
  const [companyId, setCompanyId] = useState("3d37326f-bedc-4a16-b81f-0213c826d423");
  const { data, isLoading } = useMonthlyFlowReport(year, companyId);

  const chartData = (data || []).map((d, i) => ({ ...d, label: MONTHS_PT[i] || d.month }));
  const totalReceitas = chartData.reduce((s, d) => s + (d.receitas || 0), 0);
  const totalDespesas = chartData.reduce((s, d) => s + (d.despesas || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  const summaryCards = [
    { label: "Total Receitas", value: formatCurrency(totalReceitas), icon: ArrowUp, color: "text-primary", border: "border-l-primary" },
    { label: "Total Despesas", value: formatCurrency(totalDespesas), icon: ArrowDown, color: "text-destructive", border: "border-l-destructive" },
    { label: "Saldo Acumulado", value: formatCurrency(saldo), icon: Wallet, color: saldo >= 0 ? "text-primary" : "text-destructive", border: saldo >= 0 ? "border-l-primary" : "border-l-destructive" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summaryCards.map((c, i) => (
            <Card key={c.label} className={`bg-card border-l-4 ${c.border} animate-in fade-in slide-in-from-bottom-2`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
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
      )}

      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">Fluxo Mensal — Receitas vs Despesas</CardTitle>
            <div className="flex gap-2 items-center">
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CompanyFilter value={companyId} onChange={setCompanyId} className="w-[160px]" />
              <Button variant="outline" size="sm" onClick={() => {
                const rows = chartData.map(d => ({ Mês: d.label, Receitas: d.receitas, Despesas: d.despesas, Saldo: d.receitas - d.despesas }));
                const totalRec = rows.reduce((s, r) => s + r.Receitas, 0);
                const totalDesp = rows.reduce((s, r) => s + r.Despesas, 0);
                rows.push({ Mês: "TOTAL", Receitas: totalRec, Despesas: totalDesp, Saldo: totalRec - totalDesp });
                exportToExcel(rows, `fluxo-mensal-${year}`);
              }}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[360px] w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
