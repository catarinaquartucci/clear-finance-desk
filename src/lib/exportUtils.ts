import logoUrl from "@/assets/vantari-logo.png";

export async function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = "Relatório") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export interface PDFOptions {
  summaryCards?: { label: string; value: string }[];
  highlightLastRow?: boolean;
}

export function exportToPDF(title: string, headers: string[], rows: string[][], options?: PDFOptions) {
  const { summaryCards, highlightLastRow = false } = options || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR");

  const summaryHtml = summaryCards?.length
    ? `<div class="summary-cards">
        ${summaryCards.map(c => `<div class="summary-card"><span class="summary-label">${c.label}</span><span class="summary-value">${c.value}</span></div>`).join("")}
       </div>`
    : "";

  const lastIdx = rows.length - 1;
  const tableRows = rows.map((r, ri) => {
    const isLast = highlightLastRow && ri === lastIdx;
    const cls = isLast ? "total-row" : ri % 2 === 0 ? "even-row" : "";
    return `<tr class="${cls}">${r.map((c, ci) => {
      const tag = isLast ? "td" : "td";
      const style = headers[ci]?.toLowerCase().includes("valor") || headers[ci]?.toLowerCase().includes("total") || headers[ci]?.toLowerCase().includes("pago") || headers[ci]?.toLowerCase().includes("aberto")
        ? ' class="currency"' : '';
      // Color-code status values
      let content = c;
      const lower = c.toLowerCase();
      if (lower === "vencido") content = `<span class="status-overdue">${c}</span>`;
      else if (lower === "pago" || lower === "recebido") content = `<span class="status-paid">${c}</span>`;
      else if (lower === "pendente") content = `<span class="status-pending">${c}</span>`;
      return `<${tag}${style}>${content}</${tag}>`;
    }).join("")}</tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - Vantari</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #fff; }

    .header {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #fff;
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .header img { height: 44px; }
    .header-text { flex: 1; }
    .header-text h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header-text .date { font-size: 11px; opacity: 0.85; margin-top: 4px; }

    .content { padding: 24px 32px 16px; }

    .summary-cards {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .summary-card {
      flex: 1;
      min-width: 120px;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-label { font-size: 11px; color: #5f6b7a; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
    .summary-value { font-size: 16px; font-weight: 700; color: #0f766e; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
    thead th {
      background: #0d9488;
      color: #fff;
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border: none;
    }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child { border-radius: 0 6px 0 0; }
    
    td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
    .even-row { background: #f9fafb; }
    tr:hover { background: #f0fdfa; }
    .currency { text-align: right; font-variant-numeric: tabular-nums; }

    .total-row {
      background: #0f766e !important;
      color: #fff;
      font-weight: 700;
    }
    .total-row td { border-bottom: none; }

    .status-overdue { color: #dc2626; font-weight: 600; }
    .status-paid { color: #16a34a; font-weight: 600; }
    .status-pending { color: #d97706; font-weight: 600; }

    .footer {
      text-align: center;
      padding: 20px 32px 16px;
      font-size: 10px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      margin-top: 24px;
    }
    .footer strong { color: #0f766e; }

    @media print {
      body { margin: 0; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .total-row { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .summary-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="Vantari" />
    <div class="header-text">
      <h1>${title}</h1>
      <p class="date">Gerado em ${dateStr} às ${timeStr}</p>
    </div>
  </div>
  <div class="content">
    ${summaryHtml}
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  <div class="footer"><strong>Vantari</strong> — Confidencial</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (date: string) =>
  new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
