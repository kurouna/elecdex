import type { z } from 'zod'
import { ms, parseWith, safeJson, TrailInnerSchema, TrailSchema } from './parse.js'
import type { PulseBin, TrailEvent } from './types.js'

/**
 * ACTIVITY and the PULSE (aws.md §4.2): CloudTrail's write events, reduced in main to a few
 * fields. The event's own JSON (CloudTrailEvent) carries addresses, ARNs and request
 * parameters; only who, what, the error, and a console sign-in's result and MFA are kept.
 */

export const TRAIL_MAX = 50

const MARKED_SOURCES = /^(iam|kms|sts)\.amazonaws\.com$/
const SG_CHANGES = /SecurityGroup(Ingress|Egress)|CreateSecurityGroup|DeleteSecurityGroup/

function markOf(event: Omit<TrailEvent, 'mark'>): TrailEvent['mark'] {
  if (event.whoType === 'Root') return 'root'
  if (event.login !== null && !event.login.ok) return 'failed'
  if (event.login !== null && !event.login.mfa) return 'nomfa'
  if (event.error !== null && /AccessDenied|Unauthorized/i.test(event.error)) return 'denied'
  if (MARKED_SOURCES.test(event.source) || SG_CHANGES.test(event.name)) return 'iam'
  return null
}

type TrailRow = z.infer<typeof TrailSchema>[number]

/** One event, or null for AWS's own automation and a row without a time. */
function eventOf(row: TrailRow, region: string): TrailEvent | null {
  const inner = TrailInnerSchema.safeParse(safeJson(row.e ?? ''))
  const data = inner.success ? inner.data : null
  const whoType = data?.userIdentity?.type ?? 'Unknown'
  const at = ms(row.t)
  if (whoType === 'AWSService' || at === null) return null
  const loginResult = data?.responseElements?.ConsoleLogin ?? null
  const base = {
    id: row.id,
    at,
    name: row.n,
    source: row.s ?? '',
    region: data?.awsRegion ?? region,
    who: whoType === 'Root' ? 'root' : (row.u ?? data?.userIdentity?.userName ?? whoType),
    whoType,
    error: data?.errorCode ?? null,
    login:
      row.n === 'ConsoleLogin' && loginResult !== null
        ? { ok: loginResult === 'Success', mfa: data?.additionalEventData?.MFAUsed === 'Yes' }
        : null,
  }
  return { ...base, mark: markOf(base) }
}

/** One region's lookup-events answer, AWS's own automation dropped. */
export function parseTrail(text: string, region: string): TrailEvent[] {
  const out: TrailEvent[] = []
  for (const row of parseWith(TrailSchema, text) ?? []) {
    const event = eventOf(row, region)
    if (event !== null) out.push(event)
  }
  return out
}

const QUARTER = 15 * 60_000

/** The last 24 hours in 96 quarters, oldest first (aws.md §6). */
export function pulseBins(events: readonly TrailEvent[], now: number): PulseBin[] {
  const end = Math.floor(now / QUARTER) * QUARTER + QUARTER
  const start = end - 96 * QUARTER
  const bins: PulseBin[] = Array.from({ length: 96 }, (_, i) => ({
    at: start + i * QUARTER,
    writes: 0,
    errors: 0,
    logins: 0,
  }))
  for (const event of events) {
    const i = Math.floor((event.at - start) / QUARTER)
    const bin = bins[i]
    if (bin === undefined) continue
    if (event.login !== null) bin.logins += 1
    else bin.writes += 1
    if (event.error !== null || event.mark === 'failed') bin.errors += 1
  }
  return bins
}
