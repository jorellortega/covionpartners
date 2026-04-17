export type PeriodMode = "month" | "ytd" | "full_year"

/** Inclusive start, exclusive end — use with `.gte(created_at, start).lt(created_at, end)` */
export function getPeriodBounds(
  mode: PeriodMode,
  monthFilter: string,
  calendarYear: number
): { start: string; end: string } | null {
  if (mode === "month") {
    if (!monthFilter) return null
    const [year, month] = monthFilter.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)
    return { start: startDate.toISOString(), end: endDate.toISOString() }
  }
  if (mode === "ytd") {
    const now = new Date()
    const y = now.getFullYear()
    const startDate = new Date(y, 0, 1)
    const endDate = new Date(y, now.getMonth(), now.getDate() + 1)
    return { start: startDate.toISOString(), end: endDate.toISOString() }
  }
  const y = calendarYear
  const startDate = new Date(y, 0, 1)
  const endDate = new Date(y + 1, 0, 1)
  return { start: startDate.toISOString(), end: endDate.toISOString() }
}

export function formatPeriodHint(mode: PeriodMode, monthFilter: string, calendarYear: number): string {
  if (mode === "month") {
    if (!monthFilter) return "All dates (no month selected)"
    const [y, m] = monthFilter.split("-").map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }
  if (mode === "ytd") {
    return `Year to date — Jan 1–today, ${new Date().getFullYear()}`
  }
  return `Full year — Jan 1–Dec 31, ${calendarYear}`
}
