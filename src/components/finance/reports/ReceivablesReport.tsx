import { useState } from "react";
import { ReportFilters } from "./ReportFilters";
import { useReceivablesReport } from "@/hooks/useReportQueries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { exportToExcel, exportToPDF, formatCurrency, formatDate } from "@/lib/exportUtils";
import { format } from "date-fns";

export const ReceivablesReport = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [companyId, setCompanyId] = useState("3d37326f-bedc-4a16-b81f-0213c826d423");

  const df = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
  const dt = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
  const { data, isLoading } = useReceivablesReport(df, dt, companyId);

  const total = (data || []).reduce((s, r: any) => s + Number(r.amount), 0);

  const handleExcel = () => {
    exportToExcel((data || []).map((r: any) => ({
      Descrição: r.description, Cliente: (r.customers as any)?.name || "-", Valor: Number(r.amount),
      Vencimento: r.due_date, Status: r.status, Filial: (r.group_companies as any)?.name || "-",
    })), "contas-a-receber");
  };

  const handlePDF = () => {
    exportToPDF("Contas a Receber",
      ["Descrição", "Cliente", "Valor", "Vencimento", "Status"],
      (data || []).map((r: any) => [r.description, (r.customers as any)?.name || "-", formatCurrency(Number(r.amount)), formatDate(r.due_date), r.status])
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
                <TableRow><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead>Filial</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(data || []).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.description}</TableCell>
                    <TableCell>{(r.customers as any)?.name || "-"}</TableCell>
                    <TableCell>{(r.group_companies as any)?.name || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.amount))}</TableCell>
                    <TableCell>{formatDate(r.due_date)}</TableCell>
                    <TableCell><Badge variant={r.status === "overdue" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(data || []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
