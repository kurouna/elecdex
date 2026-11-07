/**
 * The billing metric's month (aws.md §5.3, §5.6). `EstimatedCharges` is AWS's month to date in
 * USD, read as each day's maximum; AWS starts it again at 00:00 UTC on the first, so the month is
 * the UTC one (in Japan the count restarts at 09:00 on the 1st). Pure.
 */

const DAY = 86_400_000

const utcMonthStart = (at: number): number => {
  const d = new Date(at)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}

const daysIn = (monthStart: number): number => {
  const d = new Date(monthStart)
  return (
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).getTime() / DAY -
    monthStart / DAY
  )
}

export interface BillingMonth {
  mtd: number | null
  lastSameDay: number | null
  /** A straight line to the month's end from full days only, or null before one. */
  projected: number | null
  /** Month to date by day of the month (index 0 is the 1st), this month and last. */
  daily: number[]
  lastDaily: number[]
}

/** The running maximum by day of the month, for the points inside [start, start + days). */
function byDay(points: readonly [number, number][], start: number): number[] {
  const out: number[] = []
  for (const [at, usd] of points) {
    if (at < start) continue
    const day = Math.floor((at - start) / DAY)
    if (day >= daysIn(start)) continue
    out[day] = Math.max(out[day] ?? 0, usd)
  }
  // Month to date only grows: a gap or a late point takes the day before's.
  let last = 0
  for (let i = 0; i < out.length; i++) {
    last = Math.max(last, out[i] ?? 0)
    out[i] = last
  }
  return out
}

export function billingMonth(
  points: readonly [number, number][] | null,
  now: number,
): BillingMonth {
  if (points === null || points.length === 0)
    return { mtd: null, lastSameDay: null, projected: null, daily: [], lastDaily: [] }
  const start = utcMonthStart(now)
  const lastStart = utcMonthStart(start - 1)
  const daily = byDay(points, start)
  const lastDaily = byDay(points, lastStart)
  const today = Math.floor((now - start) / DAY)
  const mtd = daily.length > 0 ? (daily.at(-1) ?? null) : 0
  const sameDay = Math.min(today, lastDaily.length - 1)
  // Full days: those before today. Their last value is the month to the end of that day.
  const fullDays = Math.min(today, daily.length)
  const atFullDays = fullDays > 0 ? (daily[fullDays - 1] ?? null) : null
  return {
    mtd,
    lastSameDay: sameDay >= 0 ? (lastDaily[sameDay] ?? null) : null,
    projected: atFullDays === null ? null : (atFullDays / fullDays) * daysIn(start),
    daily,
    lastDaily,
  }
}

/** The quota's steps, in order. */
export const QUOTA_STEPS = { '80-100': [0.8, 1], '100': [1] } as const

/** The steps the month to date has passed, given what was already said this month. */
export function quotaCrossed(
  mtd: number | null,
  quotaUsd: number,
  steps: '80-100' | '100',
  said: readonly number[],
): number | null {
  if (mtd === null || quotaUsd <= 0) return null
  const passed = QUOTA_STEPS[steps].filter((step) => mtd >= quotaUsd * step)
  const top = passed.at(-1)
  // Only the highest new one: set over the quota already, it says 100% once, not 80% and 100%.
  return top !== undefined && !said.includes(top) ? top : null
}

/** The UTC month an amount belongs to (YYYY-MM). */
export const billingMonthKey = (now: number): string => new Date(now).toISOString().slice(0, 7)

/** Cost Explorer: USD a request, and the monthly caps offered, in requests (aws.md §3.3). */
export const CE_PRICE_USD = 0.01
export const CE_CAPS = [10, 50, 100, 200, 500, 1000] as const
export const CE_DEFAULT_CAP = 100
