import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { usePayablesReport } from "@/hooks/useReportQueries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/lib/exportUtils";
import { format } from "date-fns";

export const PayablesReport = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [companyId, setCompanyId] = useState("all");

  const df = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dt = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
  const { data, isLoading } = usePayablesReport(df, dt, companyId);

  const total = (data || []).reduce((s, p: any) => s + Number(p.amount), 0);

  const handleExcel = () => {
    exportToExcel((data || []).map((p: any) => ({
      Descrição: p.description, Fornecedor: (p.suppliers as any)?.name || "-", Valor: Number(p.amount),
      Vencimento: p.due_date, Status: p.status, "Centro Custo": (p.cost_centers as any)?.name || "-",
      Filial: (p.group_companies as any)?.name || "-",
    })), "contas-a-pagar");
  };

  const handlePDF = () => {
    exportToPDF("Contas a Pagar",
      ["Descrição", "Fornecedor", "Valor", "Vencimento", "Status"],
      (data || []).map((p: any) => [p.description, (p.suppliers as any)?.name || "-", formatCurrency(Number(p.amount)), formatDate(p.due_date), p.status])
    );
  };

  return (
    <div>
      <ReportFilters dateFrom={dateFrom} dateTo={dateTo} companyId={companyId}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo} onCompanyChange={setCompanyId}
        onExportExcel={handleExcel} onExportPDF={handlePDF} />

      {isLoading ? <p className="text-muted-foreground py-8 text-center">Carregando...</p> : (
        <>
          <div className="text-sm text-muted-foreground mb-2">{(data || []).length} registros · Total: {formatCurrency(total)}</div>
          <div className="border border-subtle rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Descrição</TableHead><TableHead>Fornecedor</TableHead><TableHead>Centro Custo</TableHead><TableHead>Filial</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(data || []).map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.description}</TableCell>
                    <TableCell>{(p.suppliers as any)?.name || "-"}</TableCell>
                    <TableCell>{(p.cost_centers as any)?.name || "-"}</TableCell>
                    <TableCell>{(p.group_companies as any)?.name || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell>{formatDate(p.due_date)}</TableCell>
                    <TableCell><Badge variant={p.status === "overdue" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(data || []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
