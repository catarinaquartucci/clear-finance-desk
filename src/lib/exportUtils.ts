export async function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = "Relatório") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(title: string, headers: string[], rows: string[][]) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .date { font-size: 12px; color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #ddd; font-weight: 600; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #fafafa; }
        .currency { text-align: right; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="date">Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </body>
    </html>
  `;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
