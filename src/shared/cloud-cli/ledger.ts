import type { CliProblem } from './errors.js'
import type { ProbeCost } from './probe.js'

/**
 * The ledger of what a CLI pane asked for (docs/cloud-cli.md §3.2): per probe, today's starts and
 * API requests, and this month's paid requests. Numbers only - no argument, no answer. Pure:
 * main keeps the day's counts in memory (a restart starts them again), the month's paid count
 * per account on disk in `aws-billing.json`; the page shows a summary.
 */

export type CostKind = 'free' | 'free-tier' | 'metered-tiny' | 'paid'

export const costKind = (cost: ProbeCost): CostKind =>
  typeof cost === 'string' ? cost : 'metered' in cost ? 'metered-tiny' : 'paid'

export interface ProbeCount {
  /** CLI starts today. */
  calls: number
  /** API requests today: a start can page, and a GraphQL query is one request. */
  requests: number
  /** Answers that said "unchanged" (GitHub's 304), which cost no rate limit. */
  notModified: number
  failed: number
}

export interface LedgerState {
  /** The local day the `today` counts belong to (YYYY-MM-DD). */
  day: string
  /** The UTC month the paid counts belong to (YYYY-MM): AWS bills by the UTC month. */
  month: string
  today: Record<string, ProbeCount>
  paidRequests: number
  paidUsd: number
}

export const emptyLedger = (now: number): LedgerState => ({
  day: localDay(now),
  month: utcMonth(now),
  today: {},
  paidRequests: 0,
  paidUsd: 0,
})

export function localDay(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function utcMonth(now: number): string {
  return new Date(now).toISOString().slice(0, 7)
}

/** The ledger brought to `now`: a new day starts today's counts again, a new UTC month the paid ones. */
export function rollLedger(state: LedgerState, now: number): LedgerState {
  const day = localDay(now)
  const month = utcMonth(now)
  if (day === state.day && month === state.month) return state
  return {
    day,
    month,
    today: day === state.day ? state.today : {},
    paidRequests: month === state.month ? state.paidRequests : 0,
    paidUsd: month === state.month ? state.paidUsd : 0,
  }
}

export interface LedgerEntry {
  probe: string
  cost: ProbeCost
  requests: number
  notModified?: boolean
  failed?: boolean
}

/** One finished reading counted in. */
export function recordReading(state: LedgerState, entry: LedgerEntry, now: number): LedgerState {
  const rolled = rollLedger(state, now)
  const before = rolled.today[entry.probe] ?? { calls: 0, requests: 0, notModified: 0, failed: 0 }
  const after: ProbeCount = {
    calls: before.calls + 1,
    requests: before.requests + entry.requests,
    notModified: before.notModified + (entry.notModified === true ? 1 : 0),
    failed: before.failed + (entry.failed === true ? 1 : 0),
  }
  // Only a price by the request is counted here: a price by the metric is counted by its probe,
  // which alone knows how many metrics a request asked for (aws.md §14.4a).
  const paid = typeof entry.cost !== 'string' && 'perRequestUsd' in entry.cost ? entry.cost : null
  return {
    ...rolled,
    today: { ...rolled.today, [entry.probe]: after },
    paidRequests: rolled.paidRequests + (paid ? entry.requests : 0),
    paidUsd: rolled.paidUsd + (paid ? entry.requests * paid.perRequestUsd : 0),
  }
}

/** What the page's foot and its card show. */
export interface LedgerSummary {
  requests: number
  free: number
  freeTier: number
  notModified: number
  paidRequests: number
  paidUsd: number
  /** Today's requests of the metered-tiny calls (S3's ListBuckets). */
  meteredTiny: number
  /** GetMetricData this UTC month: the metrics asked for (aws.md §14.4a); 0 for GitHub. */
  paidMetrics: number
  /** What the paid column says besides its numbers, e.g. "GMD CAP REACHED". */
  paidNotes: string[]
  probes: { id: string; every: number; cost: CostKind; requests: number }[]
}

export function summarize(
  state: LedgerState,
  probes: readonly { id: string; every: number; cost: ProbeCost }[],
): LedgerSummary {
  let requests = 0
  let free = 0
  let freeTier = 0
  let notModified = 0
  let meteredTiny = 0
  const rows = probes.map((probe) => {
    const count = state.today[probe.id]
    const n = count?.requests ?? 0
    requests += n
    notModified += count?.notModified ?? 0
    const kind = costKind(probe.cost)
    if (kind === 'free') free += n
    else if (kind === 'free-tier') freeTier += n
    else if (kind === 'metered-tiny') meteredTiny += n
    return { id: probe.id, every: probe.every, cost: kind, requests: n }
  })
  return {
    requests,
    free,
    freeTier,
    notModified,
    paidRequests: state.paidRequests,
    paidUsd: Math.round(state.paidUsd * 100) / 100,
    meteredTiny,
    paidMetrics: 0,
    paidNotes: [],
    probes: rows,
  }
}

/** The link word of a board (docs/cloud-cli.md §4), from what its probes last met. */
export type CliLink =
  | 'standby'
  | 'linking'
  | 'linked'
  | 'partial'
  | 'no-cli'
  | 'signed-out'
  | 'throttled'
  | 'offline'
  | 'error'

/**
 * The worst of the probes' problems decides: no CLI, then signed out, then throttled, offline,
 * an error, and denials (which leave the rest readable) last. No problem and a reading: linked.
 * A service a region does not offer is no problem at all (aws.md §14.4): its tile leaves that
 * region out.
 */
export function linkOf(problems: readonly (CliProblem | null)[], anyReading: boolean): CliLink {
  const kinds = new Set(problems.filter((p): p is CliProblem => p !== null).map((p) => p.kind))
  if (kinds.has('no-cli')) return 'no-cli'
  if (kinds.has('signed-out')) return 'signed-out'
  if (kinds.has('throttled')) return 'throttled'
  if (kinds.has('offline') || kinds.has('timeout')) return 'offline'
  if (kinds.has('error')) return 'error'
  if (kinds.has('denied')) return 'partial'
  return anyReading ? 'linked' : 'linking'
}
