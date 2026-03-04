import { Download } from "lucide-react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { CashFlowRow, StatusFilter } from "@/hooks/useCashFlowData";

interface CashFlowExportButtonProps {
  rows: CashFlowRow[];
  months: string[];
  year: number;
  statusFilter: StatusFilter;
}

const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const CashFlowExportButton = ({
  rows,
  months,
  year,
  statusFilter,
}: CashFlowExportButtonProps) => {
  const handleExport = async () => {
    const exportData: Record<string, string | number>[] = [];

    const flattenRows = (rowList: CashFlowRow[], level = 0) => {
      rowList.forEach((row) => {
        const indent = "  ".repeat(level);
        const rowData: Record<string, string | number> = {
          Categoria: `${indent}${row.code !== "GCO" && row.code !== "GCP" && row.code !== "SF" && row.code !== "00" ? `${row.code} - ` : ""}${row.name}`,
        };

        months.forEach((month, index) => {
          const monthValue = row.values[month] || { realized: 0, projected: 0 };
          
          if (statusFilter === "both") {
            rowData[`${MONTH_LABELS[index]} (R)`] = monthValue.realized;
            rowData[`${MONTH_LABELS[index]} (P)`] = monthValue.projected;
          } else if (statusFilter === "realized") {
            rowData[MONTH_LABELS[index]] = monthValue.realized;
          } else {
            rowData[MONTH_LABELS[index]] = monthValue.projected;
          }
        });

        if (statusFilter === "both") {
          rowData["Total (R)"] = row.total.realized;
          rowData["Total (P)"] = row.total.projected;
        } else {
          rowData["Total"] = statusFilter === "realized" ? row.total.realized : row.total.projected;
        }

        exportData.push(rowData);

        if (row.children && row.children.length > 0) {
          flattenRows(row.children, level + 1);
        }
      });
    };

    flattenRows(rows);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fluxo de Caixa");

    if (exportData.length > 0) {
      const headers = Object.keys(exportData[0]);
      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };

      exportData.forEach((row) => {
        worksheet.addRow(headers.map((h) => row[h]));
      });

      // Set column widths
      worksheet.getColumn(1).width = 40;
      for (let i = 2; i <= headers.length; i++) {
        worksheet.getColumn(i).width = 15;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxo_caixa_${year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <Download className="w-4 h-4" />
      Exportar Excel
    </Button>
  );
};
