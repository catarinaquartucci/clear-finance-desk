import type { BankTransactionInsert } from "@/hooks/useBankTransactions";

/**
 * Parse OFX file content into bank transactions
 */
export function parseOFX(content: string, bankAccountId: string): BankTransactionInsert[] {
  const transactions: BankTransactionInsert[] = [];

  // Extract STMTTRN blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];

    const getValue = (tag: string): string | null => {
      const regex = new RegExp(`<${tag}>([^<\\n]+)`, "i");
      const m = block.match(regex);
      return m ? m[1].trim() : null;
    };

    const trnType = getValue("TRNTYPE"); // DEBIT, CREDIT
    const dtPosted = getValue("DTPOSTED"); // YYYYMMDD or YYYYMMDDHHMMSS
    const trnAmt = getValue("TRNAMT");
    const memo = getValue("MEMO") || getValue("NAME") || "Sem descrição";
    const fitId = getValue("FITID");

    if (!dtPosted || !trnAmt) continue;

    const dateStr = `${dtPosted.substring(0, 4)}-${dtPosted.substring(4, 6)}-${dtPosted.substring(6, 8)}`;
    const amount = parseFloat(trnAmt);
    const type = amount >= 0 ? "credit" : "debit";

    // Generate hash for dedup
    const hash = `${bankAccountId}-${fitId || `${dateStr}-${amount}-${memo}`}`;

    transactions.push({
      bank_account_id: bankAccountId,
      date: dateStr,
      description: memo,
      amount: Math.abs(amount),
      type,
      reference: fitId,
      import_hash: hash,
    });
  }

  return transactions;
}

/**
 * Parse CSV file content into bank transactions.
 * Expects headers: date, description, amount (or value), type (optional)
 * Common Brazilian bank formats are handled.
 */
export function parseCSV(content: string, bankAccountId: string): BankTransactionInsert[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ""));

  // Find column indices
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

    // Parse date (DD/MM/YYYY or YYYY-MM-DD)
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

  return transactions;
}
