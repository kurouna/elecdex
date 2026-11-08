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

/** A period for the ledger's card: 60 s, 5 min, 1 h, 1 day. */
export function periodText(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)} h`
  return `${Math.round(ms / 86_400_000)} day`
}

/**
 * What MASK hides (docs/cloud-cli.md §7): logins and private repositories' names and titles on
 * GitHub; the account, alias, ARNs, names and addresses on AWS (aws-view.ts adds those).
 */
export const MASKED = '•••••'

export function maskName(name: string, masked: boolean): string {
  return masked ? MASKED : name
}
