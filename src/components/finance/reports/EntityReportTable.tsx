import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupplierReport, useCustomerReport, useCostCenterReport } from "@/hooks/useFinancialReports";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const SupplierReportTable = () => {
  const { data, isLoading } = useSupplierReport();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Relatório por Fornecedor</CardTitle>
        <CardDescription>Valores pagos e em aberto por fornecedor</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Em Aberto</TableHead>
                <TableHead className="text-right">Vencido</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Títulos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.total_paid)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.total_open)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", row.total_overdue > 0 && "text-destructive font-medium")}>
                    {fmt(row.total_overdue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmt(row.total_paid + row.total_open + row.total_overdue)}
                  </TableCell>
                  <TableCell className="text-center">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export const CustomerReportTable = () => {
  const { data, isLoading } = useCustomerReport();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Relatório por Cliente</CardTitle>
        <CardDescription>Valores recebidos e em aberto por cliente</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Em Aberto</TableHead>
                <TableHead className="text-right">Vencido</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Títulos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.total_paid)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.total_open)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", row.total_overdue > 0 && "text-destructive font-medium")}>
                    {fmt(row.total_overdue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmt(row.total_paid + row.total_open + row.total_overdue)}
                  </TableCell>
                  <TableCell className="text-center">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export const CostCenterReportTable = () => {
  const { data, isLoading } = useCostCenterReport();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Relatório por Centro de Custo</CardTitle>
        <CardDescription>Despesas alocadas por centro de custo</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead className="text-right">Total Despesas</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Em Aberto</TableHead>
                <TableHead className="text-center">Títulos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmt(row.total_expenses)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.total_paid)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(row.total_open)}</TableCell>
                  <TableCell className="text-center">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
