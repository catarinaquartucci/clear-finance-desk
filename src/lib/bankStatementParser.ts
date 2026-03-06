import * as pdfjsLib from "pdfjs-dist";
import type { BankTransactionInsert } from "@/hooks/useBankTransactions";

// Use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface ParseResult {
  transactions: BankTransactionInsert[];
  detectedBank: string | null;
}

/**
 * Detect if OFX content is from Itaú (BANKID 341)
 */
function detectItauOFX(content: string): boolean {
  return /<BANKID>341/i.test(content);
}

/**
 * Detect if CSV content is from Itaú by header pattern
 */
function detectItauCSV(headerLine: string): boolean {
  const lower = headerLine.toLowerCase();
  return (
    (lower.includes("lançamento") || lower.includes("lancamento")) &&
    (lower.includes("ag./origem") || lower.includes("ag.") || lower.includes("origem"))
  );
}

/**
 * Extract a tag value from a block of SGML-like content (no closing tags needed)
 */
function getValue(block: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<\\n]+)`, "i");
  const m = block.match(regex);
  return m ? m[1].trim() : null;
}

/**
 * Parse OFX file content (with closing tags) into bank transactions
 */
export function parseOFX(content: string, bankAccountId: string): ParseResult {
  const transactions: BankTransactionInsert[] = [];
  const isItau = detectItauOFX(content);

  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];

    const dtPosted = getValue(block, "DTPOSTED");
    const trnAmt = getValue(block, "TRNAMT");
    const memo = getValue(block, "MEMO") || getValue(block, "NAME") || "Sem descrição";
    const fitId = getValue(block, "FITID");
    const checkNum = getValue(block, "CHECKNUM");

    if (!dtPosted || !trnAmt) continue;

    const dateStr = `${dtPosted.substring(0, 4)}-${dtPosted.substring(4, 6)}-${dtPosted.substring(6, 8)}`;
    const amount = parseFloat(trnAmt);
    const type = amount >= 0 ? "credit" : "debit";

    const hash = `${bankAccountId}-${fitId || `${dateStr}-${amount}-${memo}`}`;

    transactions.push({
      bank_account_id: bankAccountId,
      date: dateStr,
      description: memo,
      amount: Math.abs(amount),
      type,
      reference: fitId || checkNum || undefined,
      import_hash: hash,
    });
  }

  return { transactions, detectedBank: isItau ? "itau" : null };
}

/**
 * Parse OFC file content (without closing tags) into bank transactions.
 * OFC 1.x uses <STMTTRN> to delimit each transaction without </STMTTRN>.
 */
export function parseOFC(content: string, bankAccountId: string): ParseResult {
  const transactions: BankTransactionInsert[] = [];
  const isItau = detectItauOFX(content);

  // Split by <STMTTRN> occurrences; first element is header/preamble
  const blocks = content.split(/<STMTTRN>/i);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    const dtPosted = getValue(block, "DTPOSTED");
    const trnAmt = getValue(block, "TRNAMT");
    const memo = getValue(block, "MEMO") || getValue(block, "NAME") || "Sem descrição";
    const fitId = getValue(block, "FITID");
    const checkNum = getValue(block, "CHECKNUM");

    if (!dtPosted || !trnAmt) continue;

    const dateStr = `${dtPosted.substring(0, 4)}-${dtPosted.substring(4, 6)}-${dtPosted.substring(6, 8)}`;
    const amount = parseFloat(trnAmt);
    const type = amount >= 0 ? "credit" : "debit";

    const hash = `${bankAccountId}-${fitId || `${dateStr}-${amount}-${memo}`}`;

    transactions.push({
      bank_account_id: bankAccountId,
      date: dateStr,
      description: memo,
      amount: Math.abs(amount),
      type,
      reference: fitId || checkNum || undefined,
      import_hash: hash,
    });
  }

  return { transactions, detectedBank: isItau ? "itau" : null };
}

/**
 * Parse Itaú-specific CSV format.
 * Layout: Data;Lançamento;Ag./Origem;Valor;Saldo
 */
export function parseItauCSV(content: string, bankAccountId: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { transactions: [], detectedBank: "itau" };

  const transactions: BankTransactionInsert[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 4) continue;

    const rawDate = cols[0];
    const description = cols[1] || "Sem descrição";
    const agOrigem = cols[2] || "";
    const rawAmount = cols[3].replace(/\./g, "").replace(",", ".");
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || !rawDate) continue;

    // Parse DD/MM/YYYY
    let dateStr: string;
    if (rawDate.includes("/")) {
      const parts = rawDate.split("/");
      dateStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    } else {
      dateStr = rawDate;
    }

    const type = amount >= 0 ? "credit" : "debit";
    const descWithOrigin = agOrigem ? `${description} [${agOrigem}]` : description;
    const hash = `${bankAccountId}-itau-${dateStr}-${amount}-${description.substring(0, 50)}-${i}`;

    transactions.push({
      bank_account_id: bankAccountId,
      date: dateStr,
      description: descWithOrigin,
      amount: Math.abs(amount),
      type,
      import_hash: hash,
    });
  }

  return { transactions, detectedBank: "itau" };
}

/**
 * Parse generic CSV file content into bank transactions.
 */
export function parseCSV(content: string, bankAccountId: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { transactions: [], detectedBank: null };

  // Check if it's Itaú format
  if (detectItauCSV(lines[0])) {
    return parseItauCSV(content, bankAccountId);
  }

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ""));

  const dateIdx = headers.findIndex(h => ["data", "date", "dt_movimento", "dt"].includes(h));
  const descIdx = headers.findIndex(h => ["descricao", "description", "desc", "historico", "memo", "descrição", "histórico"].includes(h));
  const amountIdx = headers.findIndex(h => ["valor", "amount", "value", "vlr_movimento", "vlr"].includes(h));

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error("CSV inválido: colunas 'data' e 'valor' são obrigatórias");
  }

  const transactions: BankTransactionInsert[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length <= Math.max(dateIdx, amountIdx)) continue;

    const rawDate = cols[dateIdx];
    const rawAmount = cols[amountIdx].replace(/\./g, "").replace(",", ".");
    const description = descIdx >= 0 ? cols[descIdx] : "Sem descrição";
    const amount = parseFloat(rawAmount);

    if (isNaN(amount)) continue;

    let dateStr: string;
    if (rawDate.includes("/")) {
      const parts = rawDate.split("/");
      dateStr = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    } else {
      dateStr = rawDate;
    }

    const type = amount >= 0 ? "credit" : "debit";
    const hash = `${bankAccountId}-${dateStr}-${amount}-${description.substring(0, 50)}-${i}`;

    transactions.push({
      bank_account_id: bankAccountId,
      date: dateStr,
      description,
      amount: Math.abs(amount),
      type,
      import_hash: hash,
    });
  }

  return { transactions, detectedBank: null };
}

/**
 * Auto-detect format and parse
 */
export function parseStatement(content: string, bankAccountId: string, fileName: string): ParseResult {
  const ext = fileName.toLowerCase();

  if (ext.endsWith(".ofc")) {
    return parseOFC(content, bankAccountId);
  }

  if (ext.endsWith(".ofx")) {
    // Some OFX files lack closing tags (SGML-style) — detect and use OFC parser
    const hasClosingTags = /<\/STMTTRN>/i.test(content);
    return hasClosingTags
      ? parseOFX(content, bankAccountId)
      : parseOFC(content, bankAccountId);
  }

  if (ext.endsWith(".csv") || ext.endsWith(".txt")) {
    return parseCSV(content, bankAccountId);
  }

  throw new Error("Formato não suportado. Use OFX, OFC, CSV, PDF ou TXT.");
}

/**
 * Parse a PDF bank statement by extracting text and running CSV parser
 */
export async function parsePDFStatement(buffer: ArrayBuffer, bankAccountId: string): Promise<ParseResult> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    lines.push(pageText);
  }

  const fullText = lines.join("\n");

  if (!fullText.trim()) {
    throw new Error("Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.");
  }

  // Try to parse the extracted text as CSV
  return parseCSV(fullText, bankAccountId);
}
