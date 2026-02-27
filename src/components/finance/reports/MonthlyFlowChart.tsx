import { useState } from "react";
import { useMonthlyFlowReport } from "@/hooks/useReportQueries";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/exportUtils";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";

const currentYear = new Date().getFullYear();
const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const MonthlyFlowChart = () => {
  const [year, setYear] = useState(currentYear);
  const [companyId, setCompanyId] = useState("all");
  const { data, isLoading } = useMonthlyFlowReport(year, companyId);

  const chartData = (data || []).map((d, i) => ({ ...d, label: MONTHS_PT[i] || d.month }));

  return (
    <Card className="bg-card border-subtle">
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
            <Button variant="outline" size="sm" onClick={() => exportToExcel(chartData.map(d => ({ Mês: d.label, Receitas: d.receitas, Despesas: d.despesas, Saldo: d.receitas - d.despesas })), `fluxo-mensal-${year}`)}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-muted-foreground text-center py-8">Carregando...</p> : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
