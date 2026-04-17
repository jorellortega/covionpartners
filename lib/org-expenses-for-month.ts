import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Sums organization expenses for a calendar month (local YYYY-MM).
 * - Includes any status except Rejected (matches expenses users track in Manage Expenses).
 * - If due_date is set, the expense is attributed to that month (accrual-style).
 * - If due_date is null, created_at is used (same window as revenue/transactions in Partner Financials).
 */
export async function sumOrganizationExpensesForMonth(
  supabase: SupabaseClient,
  organizationId: string,
  year: number,
  month: number
): Promise<{ total: number; rows: { id: string; amount: number }[] }> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)
  const startDateStr = startDate.toISOString()
  const endDateStr = endDate.toISOString()

  const pad = (n: number) => String(n).padStart(2, "0")
  const ymdStart = `${year}-${pad(month)}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const ymdEnd = `${nextYear}-${pad(nextMonth)}-01`

  const [{ data: byDueDate, error: errDue }, { data: byCreatedAt, error: errCreated }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("id, amount")
        .eq("organization_id", organizationId)
        .not("status", "eq", "Rejected")
        .not("due_date", "is", null)
        .gte("due_date", ymdStart)
        .lt("due_date", ymdEnd),
      supabase
        .from("expenses")
        .select("id, amount")
        .eq("organization_id", organizationId)
        .not("status", "eq", "Rejected")
        .is("due_date", null)
        .gte("created_at", startDateStr)
        .lt("created_at", endDateStr),
    ])

  if (errDue) console.error("[sumOrganizationExpensesForMonth] due_date query:", errDue)
  if (errCreated) console.error("[sumOrganizationExpensesForMonth] created_at query:", errCreated)

  const byId = new Map<string, number>()
  for (const row of [...(byDueDate || []), ...(byCreatedAt || [])]) {
    const id = row.id as string
    const amt = parseFloat(String(row.amount)) || 0
    byId.set(id, amt)
  }

  const rows = [...byId.entries()].map(([id, amount]) => ({ id, amount }))
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return { total, rows }
}
