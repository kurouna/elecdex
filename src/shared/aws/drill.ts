import { RESOURCE_DRILL, resourceRows } from './drill-resources.js'
import { onExtendedSupport, stoppedAt } from './facts.js'
import { forgotten, forgottenOf } from './forgotten.js'
import { HOURS_A_MONTH, prices } from './list-prices.js'
import type { Instance } from './parse.js'
import { type AwsReadings, type CpuWeek, everywhere } from './readings.js'
import { elsewhereRows, resourcesOf, SERVICES } from './resources.js'
import type { AttentionItem, AwsService, DrillItem, DrillRow, Weight } from './types.js'

/**
 * The drill-down (aws.md §5): a service's list with its facets (the second step), and one
 * resource (the third). Main builds the rows from its own last reading; facets, cross-filtering
 * and sorting are pure and run in the page.
 */

export type ColumnKind = 'text' | 'num' | 'money' | 'date' | 'gib'

export interface DrillColumn {
  key: string
  label: string
  kind: ColumnKind
  /** MASK hides it (addresses, names that say who). */
  masked?: boolean
}

export interface DrillDef {
  label: string
  facets: { key: string; label: string }[]
  columns: DrillColumn[]
  /** The column it is sorted by at first, dearest or biggest first. */
  sort: string
}

/** The services RESOURCES added (aws.md §14.5): their lists come from resources.ts. */
const ADDED = SERVICES.filter((s) => RESOURCE_DRILL[s] !== undefined)

export const DRILL: Record<AwsService, DrillDef> = {
  ...(RESOURCE_DRILL as Record<AwsService, DrillDef>),
  ec2: {
    label: 'EC2',
    facets: [
      { key: 'activity', label: 'ACTIVITY' },
      { key: 'state', label: 'STATE' },
      { key: 'type', label: 'TYPE' },
      { key: 'az', label: 'AZ' },
    ],
    columns: [
      { key: 'name', label: 'name', kind: 'text' },
      { key: 'type', label: 'type', kind: 'text' },
      { key: 'state', label: 'state', kind: 'text' },
      { key: 'az', label: 'az', kind: 'text' },
      { key: 'up', label: 'running for', kind: 'date' },
      { key: 'cpu', label: 'cpu 7d', kind: 'num' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  ebs: {
    label: 'EBS',
    facets: [
      { key: 'state', label: 'STATE' },
      { key: 'type', label: 'TYPE' },
      { key: 'size', label: 'SIZE' },
    ],
    columns: [
      { key: 'name', label: 'name', kind: 'text' },
      { key: 'gib', label: 'GiB', kind: 'gib' },
      { key: 'type', label: 'type', kind: 'text' },
      { key: 'state', label: 'state', kind: 'text' },
      { key: 'attached', label: 'attached to', kind: 'text' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  eip: {
    label: 'Public IPv4',
    facets: [{ key: 'associated', label: 'ASSOCIATED' }],
    columns: [
      { key: 'name', label: 'address', kind: 'text', masked: true },
      { key: 'attached', label: 'attached to', kind: 'text' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  s3: {
    label: 'S3',
    facets: [
      { key: 'class', label: 'CLASS' },
      { key: 'size', label: 'SIZE' },
      { key: 'empty', label: 'EMPTY' },
    ],
    columns: [
      { key: 'name', label: 'bucket', kind: 'text', masked: true },
      { key: 'gib', label: 'GB', kind: 'gib' },
      { key: 'class', label: 'main class', kind: 'text' },
      { key: 'created', label: 'created', kind: 'date' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  nat: {
    label: 'NAT gateways',
    facets: [{ key: 'state', label: 'STATE' }],
    columns: [
      { key: 'name', label: 'name', kind: 'text' },
      { key: 'vpc', label: 'vpc', kind: 'text' },
      { key: 'state', label: 'state', kind: 'text' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  elb: {
    label: 'Load balancers',
    facets: [
      { key: 'type', label: 'TYPE' },
      { key: 'scheme', label: 'SCHEME' },
    ],
    columns: [
      { key: 'name', label: 'name', kind: 'text' },
      { key: 'type', label: 'type', kind: 'text' },
      { key: 'scheme', label: 'scheme', kind: 'text' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  rds: {
    label: 'RDS',
    facets: [
      { key: 'engine', label: 'ENGINE' },
      { key: 'class', label: 'CLASS' },
      { key: 'state', label: 'STATE' },
    ],
    columns: [
      { key: 'name', label: 'name', kind: 'text' },
      { key: 'engine', label: 'engine', kind: 'text' },
      { key: 'class', label: 'class', kind: 'text' },
      { key: 'state', label: 'state', kind: 'text' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  eks: {
    label: 'EKS',
    facets: [
      { key: 'version', label: 'VERSION' },
      { key: 'support', label: 'SUPPORT' },
    ],
    columns: [
      { key: 'name', label: 'cluster', kind: 'text' },
      { key: 'version', label: 'version', kind: 'text' },
      { key: 'ends', label: 'standard support ends', kind: 'date' },
      { key: 'monthly', label: '≈ $/month', kind: 'money' },
    ],
    sort: 'monthly',
  },
  lambda: {
    label: 'Lambda',
    facets: [
      { key: 'runtime', label: 'RUNTIME' },
      { key: 'memory', label: 'MEMORY' },
    ],
    columns: [
      { key: 'name', label: 'function', kind: 'text' },
      { key: 'runtime', label: 'runtime', kind: 'text' },
      { key: 'memory', label: 'MB', kind: 'num' },
      { key: 'modified', label: 'modified', kind: 'date' },
    ],
    sort: 'modified',
  },
  stacks: {
    label: 'CloudFormation',
    facets: [{ key: 'status', label: 'STATUS' }],
    columns: [
      { key: 'name', label: 'stack', kind: 'text' },
      { key: 'status', label: 'status', kind: 'text' },
      { key: 'at', label: 'updated', kind: 'date' },
      { key: 'drift', label: 'drift', kind: 'text' },
    ],
    sort: 'at',
  },
  acm: {
    label: 'ACM',
    facets: [
      { key: 'type', label: 'TYPE' },
      { key: 'use', label: 'IN USE' },
    ],
    columns: [
      { key: 'name', label: 'domain', kind: 'text', masked: true },
      { key: 'type', label: 'type', kind: 'text' },
      { key: 'expires', label: 'expires', kind: 'date' },
    ],
    sort: 'expires',
  },
  alarms: {
    label: 'Alarms',
    facets: [{ key: 'namespace', label: 'NAMESPACE' }],
    columns: [
      { key: 'name', label: 'alarm', kind: 'text' },
      { key: 'namespace', label: 'namespace', kind: 'text' },
      { key: 'since', label: 'since', kind: 'date' },
    ],
    sort: 'since',
  },
}

const sizeClass = (gib: number) =>
  gib < 100 ? '< 100 GiB' : gib < 1000 ? '100 GiB – 1 TiB' : '≥ 1 TiB'

const weightOf = (
  attention: readonly AttentionItem[],
  service: AwsService,
  id: string,
): Weight | null =>
  attention.find((a) => a.item?.service === service && a.item.id === id)?.weight ?? null

const month = (hour: number | null) => (hour === null ? null : hour * HOURS_A_MONTH)

type Builder = (r: AwsReadings) => Omit<DrillRow, 'weight'>[]

const weekAverage = (week: CpuWeek | undefined) =>
  week === undefined || week.avg.length === 0
    ? null
    : Math.round((week.avg.reduce((s, v) => s + v, 0) / week.avg.length) * 10) / 10

function ec2Row(
  i: Instance & { region: string },
  week: CpuWeek | undefined,
  idle: boolean,
): Omit<DrillRow, 'weight'> {
  const running = i.state === 'running'
  const activity = running ? (idle ? 'idle' : 'running') : 'stopped'
  return {
    id: i.id,
    region: i.region,
    name: i.name ?? i.id,
    cells: {
      name: i.name ?? i.id,
      type: i.type,
      state: i.state,
      az: i.az ?? null,
      activity,
      up: running ? Date.parse(i.launch ?? '') || null : stoppedAt(i.reason),
      cpu: weekAverage(week),
      monthly: running && i.life !== 'spot' ? month(prices.ec2Hour(i.type, i.region)) : null,
    },
  }
}

const ROWS: Record<AwsService, Builder> = {
  ...(Object.fromEntries(ADDED.map((s) => [s, (r: AwsReadings) => resourceRows(s, r)])) as Record<
    AwsService,
    Builder
  >),
  ec2: (r) => {
    const cpu = new Map(Object.values(r.cpu).flatMap((per) => Object.entries(per ?? {})))
    // IDLE is forgotten.ts's low use, as ACTIVE and RESOURCES say it (aws.md §14.1).
    const idle = new Set(
      forgotten(r)
        .rows.filter((f) => f.reason === 'low-use')
        .map((f) => `${f.region}:${f.id}`),
    )
    return everywhere(r.instances).map((i) =>
      ec2Row(i, cpu.get(i.id), idle.has(`${i.region}:${i.id}`)),
    )
  },
  ebs: (r) =>
    everywhere(r.volumes).map((v) => ({
      id: v.id,
      region: v.region,
      name: v.name ?? v.id,
      cells: {
        name: v.name ?? v.id,
        gib: v.size,
        type: v.type,
        state: v.state,
        size: sizeClass(v.size),
        attached: v.at ?? '—',
        monthly: prices.ebsMonth(v.type, v.size, v.iops ?? null, v.region),
      },
    })),
  eip: (r) =>
    everywhere(r.addresses).map((a) => ({
      id: a.ip,
      region: a.region,
      name: a.ip,
      cells: {
        name: a.ip,
        associated: a.associated ? 'yes' : 'no',
        attached: a.instance ?? (a.associated ? 'a network interface' : '—'),
        monthly: prices.hour('ipv4', a.region) * HOURS_A_MONTH,
      },
    })),
  s3: (r) => {
    const byBucket = new Map<string, DrillRow & { top: number }>()
    for (const size of everywhere(r.buckets)) {
      const row = byBucket.get(size.bucket) ?? {
        id: size.bucket,
        region: size.region,
        name: size.bucket,
        weight: null,
        top: -1,
        cells: { name: size.bucket, gib: 0, class: null, size: null, monthly: 0 },
      }
      const gib = size.bytes / 1024 ** 3
      row.cells.gib = Math.round(((row.cells.gib as number) + gib) * 10) / 10
      row.cells.monthly =
        (row.cells.monthly as number) + (prices.s3Month(size.storage, size.bytes, size.region) ?? 0)
      if (gib > row.top) {
        row.top = gib
        row.cells.class = size.storage.replace(/Storage$/, '')
      }
      row.cells.size = sizeClass(row.cells.gib as number)
      byBucket.set(size.bucket, row)
    }
    // The bucket list adds the empty ones and the creation dates (aws.md §14.5).
    for (const x of resourcesOf('s3', r)) {
      const row = byBucket.get(x.id) ?? {
        id: x.id,
        region: x.region,
        name: x.name,
        weight: null,
        top: -1,
        cells: { name: x.name, gib: null, class: null, size: null, monthly: null },
      }
      row.cells.created = x.created
      row.cells.empty = String(x.cells.empty ?? 'unknown')
      byBucket.set(x.id, row)
    }
    return [...byBucket.values()].map(({ top: _top, weight: _w, ...row }) => row)
  },
  nat: (r) =>
    everywhere(r.nats).map((n) => ({
      id: n.id,
      region: n.region,
      name: n.name ?? n.id,
      cells: {
        name: n.name ?? n.id,
        vpc: n.vpc,
        state: n.state,
        monthly: n.state === 'available' ? prices.hour('nat', n.region) * HOURS_A_MONTH : null,
      },
    })),
  elb: (r) =>
    everywhere(r.balancers).map((b) => ({
      id: b.arn,
      region: b.region,
      name: b.name,
      cells: {
        name: b.name,
        type: b.type,
        scheme: b.scheme,
        monthly:
          prices.hour(
            b.type === 'network' ? 'nlb' : b.type === 'gateway' ? 'gwlb' : 'alb',
            b.region,
          ) * HOURS_A_MONTH,
      },
    })),
  rds: (r) =>
    everywhere(r.databases).map((d) => ({
      id: d.id,
      region: d.region,
      name: d.id,
      cells: {
        name: d.id,
        engine: `${d.engine}${d.version ? ` ${d.version}` : ''}`,
        class: d.class,
        state: d.state,
        monthly:
          d.state === 'available'
            ? month(prices.rdsHour(d.class, d.region, d.multi === true))
            : null,
      },
    })),
  eks: (r) =>
    everywhere(r.clusters).map((c) => {
      const extended = onExtendedSupport(c, r.now)
      return {
        id: c.name,
        region: c.region,
        name: c.name,
        cells: {
          name: c.name,
          version: c.version,
          support: extended ? 'extended' : 'standard',
          ends: c.standardEnds,
          monthly: prices.hour(extended ? 'eksExtended' : 'eks', c.region) * HOURS_A_MONTH,
        },
      }
    }),
  lambda: (r) =>
    everywhere(r.functions).map((f) => ({
      id: f.name,
      region: f.region,
      name: f.name,
      cells: {
        name: f.name,
        runtime: f.runtime,
        memory: f.memory,
        modified: f.modified,
      },
    })),
  stacks: (r) =>
    everywhere(r.stacks).map((s) => ({
      id: s.name,
      region: s.region,
      name: s.name,
      cells: { name: s.name, status: s.status, at: s.at, drift: s.drift },
    })),
  acm: (r) =>
    everywhere(r.certificates).map((c) => ({
      id: c.arn,
      region: c.region,
      name: c.domain ?? c.arn,
      cells: {
        name: c.domain,
        type: c.type,
        use: c.inUse ? 'in use' : 'not in use',
        expires: c.expires,
      },
    })),
  alarms: (r) =>
    Object.entries(r.alarms).flatMap(([region, alarms]) => [
      ...(alarms?.metric ?? []).map((a) => ({
        id: a.name,
        region,
        name: a.name,
        cells: { name: a.name, namespace: a.namespace, since: a.since },
      })),
      ...(alarms?.composite ?? []).map((a) => ({
        id: a.name,
        region,
        name: a.name,
        cells: { name: a.name, namespace: 'composite', since: a.since },
      })),
    ]),
}

/** A service's rows from main's last reading, at most 1,000, each with its heaviest finding. */
export function drillRows(
  service: AwsService,
  r: AwsReadings,
  attention: readonly AttentionItem[],
): DrillRow[] {
  // A row's weight is its heaviest finding, or how it looks forgotten (no longer in ATTENTION).
  const judged = new Map(
    forgotten(r)
      .rows.filter((f) => f.service === service)
      .map((f) => [`${f.region}:${f.id}`, f.weight]),
  )
  return ROWS[service](r)
    .slice(0, 1000)
    .map((row) => ({
      ...row,
      weight: weightOf(attention, service, row.id) ?? judged.get(`${row.region}:${row.id}`) ?? null,
    }))
}

/** The value a facet counts a row under. */
const facetValue = (row: DrillRow, key: string): string => {
  if (key === 'region') return row.region
  const value = row.cells[key]
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

/** Rows that pass every filter but `except` (cross-filtering counts each group by the others). */
export function filterRows(
  rows: readonly DrillRow[],
  filters: Readonly<Record<string, string>>,
  except: string | null = null,
): DrillRow[] {
  return rows.filter((row) =>
    Object.entries(filters).every(
      ([key, value]) => key === except || facetValue(row, key) === value,
    ),
  )
}

export interface FacetGroup {
  key: string
  label: string
  bars: { value: string; count: number; share: number; on: boolean }[]
}

/**
 * The facet bars (§5.2): each group counted over the rows the other groups' filters leave, so a
 * bar pressed in one group re-counts the others; the most first, eight at most.
 */
export function facets(
  rows: readonly DrillRow[],
  def: DrillDef,
  filters: Readonly<Record<string, string>>,
): FacetGroup[] {
  return def.facets.map((facet) => {
    const pool = filterRows(rows, filters, facet.key)
    const counts = new Map<string, number>()
    for (const row of pool)
      counts.set(facetValue(row, facet.key), (counts.get(facetValue(row, facet.key)) ?? 0) + 1)
    const total = pool.length || 1
    return {
      key: facet.key,
      label: facet.label,
      bars: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 8)
        .map(([value, count]) => ({
          value,
          count,
          share: count / total,
          on: filters[facet.key] === value,
        })),
    }
  })
}

/** Sorted by a column: numbers and dates biggest first when `down`, text in order. */
export function sortRows(rows: readonly DrillRow[], column: string, down: boolean): DrillRow[] {
  const dir = down ? -1 : 1
  return [...rows].sort((a, b) => {
    const x = a.cells[column]
    const y = b.cells[column]
    if (x === y) return a.name.localeCompare(b.name)
    if (x === null || x === undefined) return 1
    if (y === null || y === undefined) return -1
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
    return String(x).localeCompare(String(y)) * dir
  })
}

const fmt = (value: string | number | null | undefined) =>
  value === null || value === undefined ? '—' : String(value)

/** One resource for the third step: its fields, what is related, and its findings. */
export function drillItem(
  service: AwsService,
  id: string,
  r: AwsReadings,
  attention: readonly AttentionItem[],
): DrillItem | null {
  // Outside the pane's regions only the sweep's describe is known: its few fields.
  const row =
    ROWS[service](r).find((entry) => entry.id === id) ??
    elsewhereRows(r)
      .filter((x) => x.service === service && x.id === id)
      .map((x) => ({
        id: x.id,
        region: x.region,
        name: x.name,
        cells: { ...x.cells, name: x.name, state: x.state, monthly: x.monthly } as Record<
          string,
          string | number | null
        >,
      }))[0]
  if (row === undefined) return null
  const judged = forgottenOf(r, service, row.region, id)
  const def = DRILL[service]
  const base: DrillItem = {
    service,
    id,
    region: row.region,
    name: row.name,
    state: typeof row.cells.state === 'string' ? row.cells.state : null,
    fields: [
      { label: 'id', value: id, masked: def.columns[0]?.masked === true },
      { label: 'region', value: row.region },
      ...def.columns
        .filter((c) => c.key !== 'name')
        .map((c) => ({
          label: c.label,
          value:
            c.kind === 'money' && typeof row.cells[c.key] === 'number'
              ? `≈ $${(row.cells[c.key] as number).toFixed(2)}`
              : c.kind === 'date' && typeof row.cells[c.key] === 'number'
                ? new Date(row.cells[c.key] as number).toISOString().slice(0, 10)
                : fmt(row.cells[c.key]),
          ...(c.masked ? { masked: true } : {}),
        })),
    ],
    related: [],
    attention: attention.filter((a) => a.item?.service === service && a.item.id === id),
    forgotten: judged?.row ?? null,
    kept: judged?.kept === true,
  }
  if (service === 'ec2') ec2Extra(base, r)
  if (service === 'ebs') {
    const volume = everywhere(r.volumes).find((v) => v.id === id)
    const instance = everywhere(r.instances).find((i) => i.id === volume?.at)
    if (instance)
      base.related.push({
        service: 'ec2',
        id: instance.id,
        name: instance.name ?? instance.id,
        note: instance.state,
      })
  }
  return base
}

function ec2Extra(item: DrillItem, r: AwsReadings): void {
  const instance = everywhere(r.instances).find((i) => i.id === item.id)
  if (instance === undefined) return
  item.fields.push(
    { label: 'platform', value: fmt(instance.platform) },
    { label: 'vpc / subnet', value: `${fmt(instance.vpc)} / ${fmt(instance.subnet)}` },
    { label: 'private ip', value: fmt(instance.ip), masked: true },
    { label: 'public ip', value: instance.pub ? 'yes' : 'no' },
    { label: 'security groups', value: String(instance.sgs?.length ?? 0) },
    { label: 'IMDSv2', value: instance.imds === 'required' ? 'required' : 'optional' },
  )
  for (const volume of everywhere(r.volumes).filter((v) => v.at === instance.id))
    item.related.push({
      service: 'ebs',
      id: volume.id,
      name: volume.name ?? volume.id,
      note: `${volume.size} GiB ${volume.type}`,
    })
  for (const address of everywhere(r.addresses).filter((a) => a.instance === instance.id))
    item.related.push({ service: 'eip', id: address.ip, name: address.ip, note: 'Elastic IP' })
  for (const [region, alarms] of Object.entries(r.alarms))
    for (const alarm of alarms?.metric ?? [])
      if (alarm.dim === instance.id && region === instance.region)
        item.related.push({ service: 'alarms', id: alarm.name, name: alarm.name, note: 'in ALARM' })
}
