import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDREReport } from "@/hooks/useFinancialReports";
import { cn } from "@/lib/utils";

const fmt = (v: number, isPercent = false) => {
  if (isPercent) return `${v.toFixed(1)}%`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

export const DREReport = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { rows, isLoading } = useDREReport(year);
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  const isMarginRow = (label: string) => label.includes("Margem");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">DRE - Demonstração de Resultado</CardTitle>
            <CardDescription>Receitas, despesas e resultado operacional</CardDescription>
          </div>
          <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[90px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Conta</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Previsto (Aberto)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={cn(row.isResult && "bg-muted/50")}>
                  <TableCell
                    className={cn(
                      row.isBold && "font-semibold",
                      row.indent && "pl-8"
                    )}
                  >
                    {row.label}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", row.isBold && "font-semibold", row.realized < 0 && "text-destructive")}>
                    {fmt(row.realized, isMarginRow(row.label))}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", row.isBold && "font-semibold", row.projected < 0 && "text-destructive")}>
                    {fmt(row.projected, isMarginRow(row.label))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
