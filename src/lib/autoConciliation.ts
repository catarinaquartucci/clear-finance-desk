import type { BankTransaction } from "@/hooks/useBankTransactions";

export interface MatchCandidate {
  transactionId: string;
  withType: "payable" | "receivable";
  withId: string;
  withDescription: string;
  withAmount: number;
  withDate: string;
  score: number; // 0-100
  reason: string;
}

interface Payable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  supplier_id?: string | null;
}

interface Receivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  customer_id?: string | null;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T12:00:00");
  const db = new Date(b + "T12:00:00");
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function wordOverlap(a: string, b: string): number {
  const wa = new Set(normalize(a).split(" ").filter(w => w.length > 2));
  const wb = new Set(normalize(b).split(" ").filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  let matches = 0;
  for (const w of wa) {
    if (wb.has(w)) matches++;
  }
  return matches / Math.max(wa.size, wb.size);
}

/**
 * Find best matches for pending bank transactions against open payables/receivables.
 */
export function findMatches(
  transactions: BankTransaction[],
  payables: Payable[],
  receivables: Receivable[],
  options: { dateWindowDays?: number; minScore?: number } = {}
): MatchCandidate[] {
  const { dateWindowDays = 3, minScore = 50 } = options;

  // Only match debit transactions (outflows) against payables
  const pendingTxns = transactions.filter(t => !t.conciliated && t.type === "debit");
  const candidates: MatchCandidate[] = [];

  // Track already-matched counterparts to avoid duplicates
  const matchedIds = new Set<string>();

  for (const txn of pendingTxns) {
    const isDebit = txn.type === "debit";
    const items = isDebit ? payables : receivables;
    const withType = isDebit ? "payable" : "receivable";

    let bestMatch: MatchCandidate | null = null;

    for (const item of items) {
      if (matchedIds.has(item.id)) continue;
      if (item.status !== "open" && item.status !== "pending" && item.status !== "pendente") continue;

      const amountDiff = Math.abs(Math.abs(Number(txn.amount)) - Math.abs(Number(item.amount)));
      const amountMatch = amountDiff < 0.01;
      const amountClose = amountDiff / Math.max(Number(item.amount), 1) < 0.05; // within 5%

      if (!amountMatch && !amountClose) continue;

      const days = daysBetween(txn.date, item.due_date);
      if (days > dateWindowDays && !amountMatch) continue;

      // Calculate score
      let score = 0;
      let reasons: string[] = [];

      if (amountMatch) {
        score += 50;
        reasons.push("valor exato");
      } else if (amountClose) {
        score += 30;
        reasons.push("valor próximo");
      }

      if (days === 0) {
        score += 30;
        reasons.push("mesma data");
      } else if (days <= 1) {
        score += 25;
        reasons.push("±1 dia");
      } else if (days <= 3) {
        score += 15;
        reasons.push(`±${days} dias`);
      } else if (days <= 7) {
        score += 5;
        reasons.push(`±${days} dias`);
      }

      const descOverlap = wordOverlap(txn.description, item.description);
      if (descOverlap > 0.5) {
        score += 20;
        reasons.push("descrição similar");
      } else if (descOverlap > 0.2) {
        score += 10;
        reasons.push("descrição parcial");
      }

      if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          transactionId: txn.id,
          withType: withType as "payable" | "receivable",
          withId: item.id,
          withDescription: item.description,
          withAmount: Number(item.amount),
          withDate: item.due_date,
          score,
          reason: reasons.join(", "),
        };
      }
    }

    if (bestMatch) {
      candidates.push(bestMatch);
      matchedIds.add(bestMatch.withId);
    }
  }

  // Sort by score descending
  return candidates.sort((a, b) => b.score - a.score);
}
