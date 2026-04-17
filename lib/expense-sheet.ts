/** Matches the tag prefix saved with monthly sheet lines (see `expenseSheetTag` in business-expense). */
export const EXPENSE_SHEET_TAG_RE = /\[Expense sheet: \d{4}-\d{2}\]\s*/g;

const SHEET_YM_FROM_NOTES_RE = /\[Expense sheet: (\d{4}-\d{2})\]/;

export function extractExpenseSheetYmFromNotes(notes: string | null | undefined): string | null {
  if (!notes || typeof notes !== "string") return null;
  const m = notes.match(SHEET_YM_FROM_NOTES_RE);
  return m ? m[1] : null;
}

export function cleanExpenseSheetNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  return notes.replace(EXPENSE_SHEET_TAG_RE, "").trim();
}

export type MonthlyExpenseSheetGroup = {
  ym: string;
  lineCount: number;
  totalAmount: number;
};

export function groupExpensesIntoMonthlySheets(expenses: unknown[]): MonthlyExpenseSheetGroup[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const e of expenses) {
    const row = e as { notes?: string | null; amount?: unknown };
    const ym = extractExpenseSheetYmFromNotes(row.notes);
    if (!ym) continue;
    const prev = map.get(ym) || { total: 0, count: 0 };
    prev.count += 1;
    prev.total += Number(row.amount || 0);
    map.set(ym, prev);
  }
  const rows: MonthlyExpenseSheetGroup[] = [];
  for (const [ym, v] of map) {
    rows.push({ ym, lineCount: v.count, totalAmount: v.total });
  }
  rows.sort((a, b) => (a.ym < b.ym ? 1 : a.ym > b.ym ? -1 : 0));
  return rows;
}

export function formatYmLongLabel(ym: string): string {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return ym;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return ym;
  return new Date(y, mo - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function isValidSheetYm(ym: string): boolean {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return false;
  const mo = Number(m[2]);
  return mo >= 1 && mo <= 12;
}
