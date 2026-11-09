import { PROBLEM_WORDS } from '@shared/cloud-cli/errors'
import type { CliLink, LedgerSummary } from '@shared/cloud-cli/ledger'

/**
 * What both CLI panes show alike (docs/cloud-cli.md §7): the link word and its tone, ages, the
 * ledger's line, and MASK. Pure, so the component tests and the unit tests reach it.
 */

export type Tone = 'ok' | 'warn' | 'danger' | 'muted' | 'accent'

const LINK: Record<CliLink, { word: string; tone: Tone }> = {
  standby: { word: 'STANDBY', tone: 'muted' },
  linking: { word: 'LINKING', tone: 'accent' },
  linked: { word: 'LINKED', tone: 'ok' },
  partial: { word: 'PARTIAL', tone: 'warn' },
  'no-cli': { word: 'NO CLI', tone: 'danger' },
  'signed-out': { word: 'SIGNED OUT', tone: 'warn' },
  throttled: { word: 'THROTTLED', tone: 'warn' },
  offline: { word: 'OFFLINE', tone: 'muted' },
  error: { word: 'LINK ERROR', tone: 'danger' },
}

export const linkView = (link: CliLink): { word: string; tone: Tone } => LINK[link]

/** A short age: now, 12m, 5h, 3d, 2mo, 1y. */
export function ageText(since: number, now: number): string {
  const s = Math.max(0, Math.round((now - since) / 1000))
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 60) return `${d}d`
  const mo = Math.floor(d / 30)
  return mo < 24 ? `${mo}mo` : `${Math.floor(d / 365)}y`
}

/** A clock time, 14:23, for "next" and "read". */
export function clockText(at: number | null): string {
  if (at === null || at <= 0) return '—'
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** The foot's line: requests today, the free ones, and the paid ones (always shown, 0 or not). */
export function ledgerLine(ledger: LedgerSummary, tool: 'aws' | 'gh'): string {
  const parts = [`requests today ${ledger.requests}`]
  if (tool === 'gh') parts.push(`304 free ${ledger.notModified}`)
  else {
    parts.push(`free ${ledger.free}`, `free tier ${ledger.freeTier}`)
    // S3's ListBuckets is metered (a fixed cap of 31 a month): counted on its own when it ran.
    if (ledger.meteredTiny > 0) parts.push(`metered ${ledger.meteredTiny}`)
  }
  // GetMetricData is counted by the metric, not the request (aws.md §14.4a): its own figure.
  const paid = [`paid APIs ${ledger.paidRequests}`]
  if (ledger.paidMetrics > 0) paid.push(`GMD ${ledger.paidMetrics.toLocaleString('en-US')} metrics`)
  if (ledger.paidRequests > 0 || ledger.paidMetrics > 0)
    paid.push(`$${ledger.paidUsd.toFixed(2)} this month`)
  parts.push(...paid, ...ledger.paidNotes)
  return parts.join(' · ')
}

/**
 * A probe's period for the ledger's card: every 60 s, 5 min, 1 h, 1 day; a reading made on
 * demand (HISTORY, a repository's inside) has none.
 */
export function periodText(ms: number): string {
  if (ms <= 0) return 'on demand'
  if (ms < 60_000) return `every ${Math.round(ms / 1000)} s`
  if (ms < 3_600_000) return `every ${Math.round(ms / 60_000)} min`
  if (ms < 86_400_000) return `every ${Math.round(ms / 3_600_000)} h`
  return `every ${Math.round(ms / 86_400_000)} day`
}

/**
 * A tab's count in the colour of the heaviest row behind it (danger, then warn), so the tab to
 * look at shows from the tab strip; none when only info and quiet rows are there.
 */
export function heaviest(rows: readonly { weight: string }[]): 'danger' | 'warn' | null {
  if (rows.some((row) => row.weight === 'danger')) return 'danger'
  return rows.some((row) => row.weight === 'warn') ? 'warn' : null
}

/** The ledger card's rows at most: the busiest probes, then one line for the rest. */
export const LEDGER_CARD_ROWS = 12

/**
 * The foot's card, a row a probe that called today: busiest first, at most `max` of them and a
 * line for the rest. AWS STATUS has some fifty probes; listed whole, the card ran past its pane
 * and lost the rows under the cut.
 */
export function ledgerCardRows(
  probes: LedgerSummary['probes'],
  max = LEDGER_CARD_ROWS,
): { label: string; value: string }[] {
  const called = probes
    .filter((p) => p.requests > 0)
    .sort((a, b) => b.requests - a.requests || a.id.localeCompare(b.id))
  const shown = called.length > max ? called.slice(0, max - 1) : called
  const rest = called.slice(shown.length)
  return [
    ...shown.map((p) => ({
      label: p.id,
      value: `${p.requests} · ${periodText(p.every)} · ${p.cost}`,
    })),
    ...(rest.length === 0
      ? []
      : [
          {
            label: `+ ${rest.length} more`,
            value: `${rest.reduce((sum, p) => sum + p.requests, 0)} requests`,
          },
        ]),
  ]
}

/**
 * What MASK hides (docs/cloud-cli.md §7): logins and private repositories' names and titles on
 * GitHub; the account, alias, ARNs, names and addresses on AWS (aws-view.ts adds those).
 */
export const MASKED = '•••••'

/**
 * The foot's problem under MASK: only its kind. A CLI's first line, redacted of ids and keys, can
 * still name a stack or a private repository ("Stack with id prod-billing does not exist").
 */
export const PROBLEM_MASKED = 'LINK ERROR · the CLI’s words are hidden under MASK'

/** The foot's problem as shown: elecdex's own words always, a CLI's only without MASK. */
export function shownProblem(problem: string, masked: boolean): string {
  const own: readonly string[] = Object.values(PROBLEM_WORDS)
  return masked && !own.includes(problem) ? PROBLEM_MASKED : problem
}
