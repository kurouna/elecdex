import { CE_PRICE_USD as CE_PRICE } from '@shared/aws/billing'
import type { AttentionItem, AwsBoard, Weight } from '@shared/aws/types'
import type { Tone } from '../cloud/cloud-view.ts'
import { MASKED } from '../cloud/cloud-view.ts'

/** What AWS STATUS's page computes for itself: words, amounts, the badge. Pure. */

/** ≈ $1,234 (whole dollars from ten up, cents below). */
export function money(usd: number | null, approx = true): string {
  if (usd === null) return '—'
  const text = usd >= 10 ? `$${Math.round(usd).toLocaleString('en-US')}` : `$${usd.toFixed(2)}`
  return approx ? `≈ ${text}` : text
}

/** ap-northeast-1 → ap-ne-1, us-east-1 → us-e-1 (the region lamps). */
export function regionShort(region: string): string {
  const [area, direction, n] = region.split('-')
  if (area === undefined || direction === undefined || n === undefined) return region
  const dir = direction
    .replace('northeast', 'ne')
    .replace('southeast', 'se')
    .replace('northwest', 'nw')
    .replace('southwest', 'sw')
    .replace('north', 'n')
    .replace('south', 's')
    .replace('east', 'e')
    .replace('west', 'w')
    .replace('central', 'c')
  return `${area}-${dir}-${n}`
}

const RANK: Record<Weight, number> = { danger: 0, warn: 1, info: 2, quiet: 3 }

/** A region lamp's colour: its heaviest finding, or none. */
export function regionTone(items: readonly AttentionItem[], region: string): Weight | null {
  return (
    items
      .filter((item) => item.region === region)
      .map((item) => item.weight)
      .sort((a, b) => RANK[a] - RANK[b])[0] ?? null
  )
}

/** The account as the header says it: alias (id), masked by MASK. */
export function accountLabel(board: AwsBoard | null, masked: boolean): string {
  const account = board?.account
  if (account === null || account === undefined) return board?.profile ?? ''
  if (masked) return `${board?.profile ?? ''} · ${MASKED}`
  const id = account.id.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')
  return `${board?.profile ?? ''} · ${account.alias ?? 'no alias'} (${id})`
}

/** The heaviest thing for the pane's header (cloud-cli.md §12.4): alarms, the quota, an incident, the link. */
export function awsBadge(
  board: AwsBoard,
  link: { word: string; tone: Tone },
): { badge?: string; badgeKind?: 'danger' | 'warn' } {
  if (board.alarms > 0)
    return { badge: `${board.alarms} alarm${board.alarms === 1 ? '' : 's'}`, badgeKind: 'danger' }
  const share = board.cost.quota.share
  if (share !== null && share >= 1) return { badge: 'over quota', badgeKind: 'danger' }
  const incident = board.incidents.find((i) => !i.stale)
  if (incident !== undefined)
    return { badge: 'AWS incident', badgeKind: incident.weight === 'danger' ? 'danger' : 'warn' }
  if (link.tone === 'warn' || link.tone === 'danger')
    return { badge: link.word.toLowerCase(), badgeKind: link.tone }
  return {}
}

/** A month of Cost Explorer at a frequency: two requests a reading (aws.md §3.3). */
export function ceEstimate(
  every: 'manual' | 'day' | '12h',
  cap: number,
): { requests: number; usd: number; stopsOn: number | null } {
  const requests = every === 'manual' ? 0 : every === 'day' ? 60 : 120
  const perDay = every === 'day' ? 2 : every === '12h' ? 4 : 0
  return {
    requests,
    usd: requests * CE_PRICE,
    stopsOn: perDay > 0 && requests > cap ? Math.floor(cap / perDay) : null,
  }
}

/** `$1.00 = 100` - the cap said both ways, everywhere it is chosen. */
export const capText = (cap: number): string => `$${(cap * CE_PRICE).toFixed(2)} = ${cap}`

/** The attention tags in the order the filter row offers them. */
export const ATTENTION_TAGS = [
  'ALARM',
  'HEALTH',
  'STACK',
  'SECURITY',
  'EXPIRY',
  'SUPPORT',
  'COST',
  'BUDGET',
  'PLAN',
] as const

/** A Unix-ish age in days, for a date cell. */
export function dateCell(at: number | null, now: number): string {
  if (at === null) return '—'
  const days = Math.round((at - now) / 86_400_000)
  const date = new Date(at).toISOString().slice(0, 10)
  if (Math.abs(days) <= 90) return `${date} · ${days >= 0 ? `in ${days}d` : `${-days}d ago`}`
  return date
}

/** Bytes as GiB a column shows. */
export const gibText = (gib: number | null): string =>
  gib === null
    ? '—'
    : gib >= 1024
      ? `${(gib / 1024).toFixed(1)} TiB`
      : `${Math.round(gib).toLocaleString('en-US')} GiB`

/**
 * PARTIAL's COPY POLICY: an IAM policy that allows exactly the reads this role was refused, to
 * paste into the IAM console (or attach AWS's ReadOnlyAccess instead). Actions only, sorted and
 * once each; never the account, the user or an ARN, which the page does not have.
 */
export function refusedPolicy(actions: readonly string[]): string {
  const allowed = [...new Set(actions)].sort((a, b) => a.localeCompare(b))
  return JSON.stringify(
    {
      Version: '2012-10-17',
      Statement: [
        { Sid: 'ElecdexAwsStatusReads', Effect: 'Allow', Action: allowed, Resource: '*' },
      ],
    },
    null,
    2,
  )
}
