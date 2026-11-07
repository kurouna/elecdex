import { onExtendedSupport, stoppedAt } from './attention.js'
import { HOURS_A_MONTH, PRICES_AS_OF, prices } from './list-prices.js'
import { type AwsReadings, everywhere } from './readings.js'
import type { ActiveService, ActiveView, AwsService } from './types.js'

/**
 * ACTIVE (aws.md §5.0): what is switched on and billing now, at list prices, the dearest first.
 * Pure: `activeCost(readings)`. Every figure is an estimate (≈): On-Demand list prices from the
 * shipped table, nothing for Savings Plans, reservations, the free tier, discounts, requests or
 * data transfer.
 */

export const IDLE = {
  /** A running instance whose 7-day CPU stays under both is IDLE. */
  avgPercent: 2,
  maxPercent: 10,
} as const

interface Line {
  name: string
  monthly: number | null
  region: string
  detail: string
  idle?: boolean
  waste?: boolean
}

const LABEL: Record<AwsService, string> = {
  ec2: 'EC2',
  ebs: 'EBS',
  eip: 'Public IPv4',
  s3: 'S3',
  nat: 'NAT gateways',
  elb: 'Load balancers',
  rds: 'RDS',
  eks: 'EKS',
  lambda: 'Lambda',
  stacks: 'CloudFormation',
  acm: 'ACM',
  alarms: 'CloudWatch alarms',
}

const GB = 1024 ** 3

/** Whether a running instance's week of CPU says it is doing nothing. */
export function isIdle(week: { avg: number[]; max: number[] } | undefined): boolean {
  if (week === undefined || week.avg.length < 7) return false
  const avg = week.avg.reduce((s, v) => s + v, 0) / week.avg.length
  return avg < IDLE.avgPercent && Math.max(...week.max) < IDLE.maxPercent
}

function ec2Lines(r: AwsReadings, unpriced: Set<string>): Line[] {
  const cpu = new Map(Object.values(r.cpu).flatMap((per) => Object.entries(per ?? {})))
  return everywhere(r.instances)
    .filter((i) => i.state === 'running' && i.life !== 'spot')
    .map((i) => {
      const hour = prices.ec2Hour(i.type, i.region)
      if (hour === null) unpriced.add(i.type)
      const launched = Date.parse(i.launch ?? '')
      const up = Number.isFinite(launched) ? Math.floor((r.now - launched) / 86_400_000) : null
      return {
        name: i.name ?? i.id,
        monthly: hour === null ? null : hour * HOURS_A_MONTH,
        region: i.region,
        detail: `${i.type}${up === null ? '' : ` · up ${up}d`}`,
        idle: isIdle(cpu.get(i.id)),
      }
    })
}

function ebsLines(r: AwsReadings, unpriced: Set<string>): Line[] {
  const stopped = new Map(
    everywhere(r.instances)
      .filter((i) => i.state === 'stopped')
      .map((i) => [i.id, stoppedAt(i.reason)]),
  )
  return everywhere(r.volumes).map((v) => {
    const month = prices.ebsMonth(v.type, v.size, v.iops ?? null, v.region)
    if (month === null) unpriced.add(v.type)
    const since = v.at ? stopped.get(v.at) : undefined
    const onStopped = since !== undefined && since !== null && r.now - since > 30 * 86_400_000
    return {
      name: v.name ?? v.id,
      monthly: month,
      region: v.region,
      detail: `${v.size} GiB ${v.type}${v.state === 'available' ? ' · unattached' : ''}`,
      waste: v.state === 'available' || onStopped,
    }
  })
}

function s3Lines(r: AwsReadings, unpriced: Set<string>): Line[] {
  const byBucket = new Map<string, Line>()
  for (const size of everywhere(r.buckets)) {
    const month = prices.s3Month(size.storage, size.bytes, size.region)
    if (month === null) unpriced.add(size.storage)
    const line = byBucket.get(size.bucket) ?? {
      name: size.bucket,
      monthly: 0,
      region: size.region,
      detail: '',
      bytes: 0,
    }
    const kept = line as Line & { bytes: number }
    kept.monthly = (kept.monthly ?? 0) + (month ?? 0)
    kept.bytes += size.bytes
    kept.detail = bytesText(kept.bytes)
    byBucket.set(size.bucket, kept)
  }
  return [...byBucket.values()]
}

function hourlyLines(r: AwsReadings): Partial<Record<AwsService, Line[]>> {
  const elbKind = (type: string) =>
    type === 'network' ? 'nlb' : type === 'gateway' ? 'gwlb' : type === 'classic' ? 'clb' : 'alb'
  return {
    nat: everywhere(r.nats)
      .filter((n) => n.state === 'available' || n.state === 'pending')
      .map((n) => ({
        name: n.name ?? n.id,
        monthly: prices.hour('nat', n.region) * HOURS_A_MONTH,
        region: n.region,
        detail: n.connectivity ?? 'public',
      })),
    eip: everywhere(r.addresses).map((a) => ({
      name: a.ip,
      monthly: prices.hour('ipv4', a.region) * HOURS_A_MONTH,
      region: a.region,
      detail: a.associated ? 'attached' : 'unattached',
      waste: !a.associated,
    })),
    elb: everywhere(r.balancers)
      .filter((b) => b.state === null || b.state === 'active')
      .map((b) => ({
        name: b.name,
        monthly: prices.hour(elbKind(b.type), b.region) * HOURS_A_MONTH,
        region: b.region,
        detail: b.type,
      })),
    eks: everywhere(r.clusters).map((c) => {
      const extended = onExtendedSupport(c, r.now)
      return {
        name: c.name,
        monthly: prices.hour(extended ? 'eksExtended' : 'eks', c.region) * HOURS_A_MONTH,
        region: c.region,
        detail: `${c.version ?? ''}${extended ? ' · extended support' : ''}`,
        waste: extended,
      }
    }),
  }
}

function rdsLines(r: AwsReadings, unpriced: Set<string>): Line[] {
  return everywhere(r.databases)
    .filter((d) => d.state === 'available')
    .map((d) => {
      const hour = prices.rdsHour(d.class, d.region, d.multi === true)
      if (hour === null) unpriced.add(d.class)
      return {
        name: d.id,
        monthly: hour === null ? null : hour * HOURS_A_MONTH,
        region: d.region,
        detail: `${d.class}${d.multi ? ' · Multi-AZ' : ''}`,
      }
    })
}

export function bytesText(bytes: number): string {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TB`
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  return `${bytes} B`
}

function countText(service: AwsService, lines: Line[]): string {
  if (service === 'ec2') return `${lines.length} running`
  if (service === 's3') {
    const bytes = lines.reduce((s, l) => s + ((l as Line & { bytes?: number }).bytes ?? 0), 0)
    return `${lines.length} bucket${lines.length === 1 ? '' : 's'} · ${bytesText(bytes)}`
  }
  return `${lines.length}`
}

function serviceOf(service: AwsService, lines: Line[]): ActiveService {
  const priced = lines.filter((l) => l.monthly !== null)
  const sum = priced.reduce((s, l) => s + (l.monthly ?? 0), 0)
  return {
    service,
    label: LABEL[service],
    count: countText(service, lines),
    idle: lines.filter((l) => l.idle === true).length,
    waste: lines.filter((l) => l.waste === true).length,
    monthly: priced.length === 0 ? null : sum,
    regions: [...new Set(lines.map((l) => l.region))].sort(),
    top: [...priced]
      .sort((a, b) => (b.monthly ?? 0) - (a.monthly ?? 0))
      .slice(0, 5)
      .map((l) => ({ name: l.name, monthly: l.monthly ?? 0, detail: l.detail })),
  }
}

export function activeCost(r: AwsReadings): ActiveView {
  const unpriced = new Set<string>()
  const lines: Partial<Record<AwsService, Line[]>> = {
    ec2: ec2Lines(r, unpriced),
    ebs: ebsLines(r, unpriced),
    s3: s3Lines(r, unpriced),
    rds: rdsLines(r, unpriced),
    ...hourlyLines(r),
  }
  // Billed by use only: shown, never estimated (COST has the real amount).
  const functions = everywhere(r.functions)
  const services = Object.entries(lines)
    .filter(([, list]) => (list ?? []).length > 0)
    .map(([service, list]) => serviceOf(service as AwsService, list ?? []))
  if (functions.length > 0)
    services.push({
      service: 'lambda',
      label: LABEL.lambda,
      count: `${functions.length} · usage-based`,
      idle: 0,
      waste: 0,
      monthly: null,
      regions: [...new Set(functions.map((f) => f.region))].sort(),
      top: [],
    })
  services.sort((a, b) => (b.monthly ?? -1) - (a.monthly ?? -1) || a.label.localeCompare(b.label))
  const perMonth = services.reduce((s, x) => s + (x.monthly ?? 0), 0)
  const shown = new Set(services.map((s) => s.service))
  return {
    perHour: perMonth / HOURS_A_MONTH,
    perMonth,
    services,
    quiet: (['ec2', 'ebs', 's3', 'rds', 'nat', 'eip', 'elb', 'eks'] as AwsService[])
      .filter((s) => !shown.has(s))
      .map((s) => LABEL[s]),
    prices: { source: 'bundled', asOf: PRICES_AS_OF },
    unpriced: [...unpriced].sort(),
  }
}

export const serviceLabel = (service: AwsService): string => LABEL[service]
