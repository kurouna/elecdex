import { onExtendedSupport, stoppedAt } from './facts.js'
import { HOURS_A_MONTH, prices } from './list-prices.js'
import { ms } from './parse.js'
import { type DdbReading, lastPart } from './parse-resources.js'
import { type AwsReadings, everywhere, type PerRegion } from './readings.js'
import type { AwsService } from './types.js'

/**
 * RESOURCES' one model of what is there (aws.md §14): every kind's readings turned into the
 * same row - its id, region, name, state, creation and ≈ $ a month at list price - which the
 * tiles count, the forgotten predicates judge (forgotten.ts) and the drill-down lists. Pure.
 * Only the pane's regions are here; the weekly sweep's are `elsewhereRows`.
 */

/** Global services are asked, and placed, in us-east-1. */
export const GLOBAL = 'us-east-1'

export type Cell = string | number | null

export interface Res {
  service: AwsService
  /** Unique within the service and region; what the page sends back. */
  id: string
  region: string
  name: string
  state: string | null
  created: number | null
  /** ≈ USD a month now at list price; null when billed by use only, or not priced. */
  monthly: number | null
  /** Billed by the hour, or the month, without a price in the table. */
  notPriced: boolean
  /** Billed by the hour now (BILLED BY THE HOUR). */
  hourly: boolean
  /** Asked in us-east-1 for the whole account (CloudFront, Route 53, S3's list). */
  global?: boolean
  /** The drill-down's cells, and the facts the predicates read. */
  cells: Record<string, Cell>
}

const month = (hour: number | null): number | null => (hour === null ? null : hour * HOURS_A_MONTH)
const GB = 1024 ** 3

/** The rows of a per-region reading in the pane's regions, each with its region. */
function inRegions<T>(r: AwsReadings, per: PerRegion<T>): [string, T][] {
  return r.regions.flatMap((region) => {
    const value = per[region]
    return value === null || value === undefined ? [] : [[region, value] as [string, T]]
  })
}

const res = (over: Pick<Res, 'service' | 'id' | 'region' | 'name'> & Partial<Res>): Res => ({
  state: null,
  created: null,
  monthly: null,
  notPriced: false,
  hourly: false,
  cells: {},
  ...over,
})

/* ---- What the pane read before RESOURCES ---- */

function ec2Rows(r: AwsReadings): Res[] {
  return everywhere(r.instances).map((i) => {
    const running = i.state === 'running'
    const billed = running && i.life !== 'spot'
    const hour = billed ? prices.ec2Hour(i.type, i.region) : null
    return res({
      service: 'ec2',
      id: i.id,
      region: i.region,
      name: i.name ?? i.id,
      state: i.state,
      // LaunchTime changes with every start: an instance is new by main's first sight of it.
      monthly: month(hour),
      notPriced: billed && hour === null,
      hourly: billed,
      cells: { type: i.type, life: i.life ?? null, stoppedAt: stoppedAt(i.reason) },
    })
  })
}

function ebsRows(r: AwsReadings): Res[] {
  return everywhere(r.volumes).map((v) => {
    const monthly = prices.ebsMonth(v.type, v.size, v.iops ?? null, v.region)
    return res({
      service: 'ebs',
      id: v.id,
      region: v.region,
      name: v.name ?? v.id,
      state: v.state,
      created: ms(v.created ?? null),
      monthly,
      notPriced: monthly === null,
      cells: { gib: v.size, type: v.type, attached: v.at ?? null },
    })
  })
}

const eipRows = (r: AwsReadings): Res[] =>
  everywhere(r.addresses).map((a) =>
    res({
      service: 'eip',
      id: a.ip,
      region: a.region,
      name: a.ip,
      state: a.associated ? 'associated' : 'not associated',
      monthly: prices.hour('ipv4', a.region) * HOURS_A_MONTH,
      hourly: true,
      cells: { associated: a.associated ? 'yes' : 'no', instance: a.instance },
    }),
  )

const natRows = (r: AwsReadings): Res[] =>
  everywhere(r.nats).map((n) => {
    const on = n.state === 'available' || n.state === 'pending'
    return res({
      service: 'nat',
      id: n.id,
      region: n.region,
      name: n.name ?? n.id,
      state: n.state,
      monthly: on ? prices.hour('nat', n.region) * HOURS_A_MONTH : null,
      hourly: on,
      cells: { vpc: n.vpc },
    })
  })

const ELB_KIND: Record<string, 'alb' | 'nlb' | 'gwlb' | 'clb'> = {
  application: 'alb',
  network: 'nlb',
  gateway: 'gwlb',
  classic: 'clb',
}

/** The ARN's suffix CloudWatch names a load balancer by ("app/web-alb/50dc…"). */
export const balancerDimension = (arn: string): string =>
  /:loadbalancer\/(.+)$/.exec(arn)?.[1] ?? lastPart(arn)

function elbRows(r: AwsReadings): Res[] {
  const v2 = everywhere(r.balancers).map((b) => {
    const on = b.state === null || b.state === 'active'
    return res({
      service: 'elb',
      id: b.arn,
      region: b.region,
      name: b.name,
      state: b.state,
      created: b.created,
      monthly: on ? prices.hour(ELB_KIND[b.type] ?? 'alb', b.region) * HOURS_A_MONTH : null,
      hourly: on,
      cells: { type: b.type, scheme: b.scheme, dimension: balancerDimension(b.arn) },
    })
  })
  const classic = inRegions(r, r.res.elbTargets).flatMap(([region, reading]) =>
    reading.classic.map((c) =>
      res({
        service: 'elb',
        id: c.n,
        region,
        name: c.n,
        state: 'active',
        created: ms(c.c ?? null),
        monthly: prices.hour('clb', region) * HOURS_A_MONTH,
        hourly: true,
        cells: { type: 'classic', scheme: c.s ?? null, instances: c.i ?? 0, dimension: c.n },
      }),
    ),
  )
  return [...v2, ...classic]
}

const rdsRows = (r: AwsReadings): Res[] =>
  everywhere(r.databases).map((d) => {
    const on = d.state === 'available'
    const hour = on ? prices.rdsHour(d.class, d.region, d.multi === true) : null
    return res({
      service: 'rds',
      id: d.id,
      region: d.region,
      name: d.id,
      state: d.state,
      created: ms(d.created ?? null),
      monthly: month(hour),
      notPriced: on && hour === null,
      hourly: on,
      cells: { engine: d.engine, class: d.class, support: d.support ?? null },
    })
  })

function eksRows(r: AwsReadings): Res[] {
  const nodes = new Map(
    inRegions(r, r.res.eksNodes).flatMap(([region, rows]) =>
      rows.map((row) => [`${region}:${row.cluster}`, row] as const),
    ),
  )
  return everywhere(r.clusters).map((c) => {
    const extended = onExtendedSupport(c, r.now)
    const n = nodes.get(`${c.region}:${c.name}`)
    return res({
      service: 'eks',
      id: c.name,
      region: c.region,
      name: c.name,
      state: c.status,
      monthly: prices.hour(extended ? 'eksExtended' : 'eks', c.region) * HOURS_A_MONTH,
      hourly: true,
      cells: {
        version: c.version,
        support: extended ? 'extended' : 'standard',
        nodegroups: n?.nodegroups?.length ?? null,
        fargate: n?.fargate?.length ?? null,
      },
    })
  })
}

const lambdaRows = (r: AwsReadings): Res[] =>
  everywhere(r.functions).map((f) =>
    res({
      service: 'lambda',
      id: f.name,
      region: f.region,
      name: f.name,
      state: 'active',
      // LastModified is not a creation date: a function is new by main's first sight of it.
      cells: { runtime: f.runtime, memory: f.memory, modified: f.modified },
    }),
  )

/** A bucket's sizes by class (the BucketSizeBytes read in its region), or null when not read there. */
function bucketSizes(r: AwsReadings, region: string, bucket: string) {
  const sizes = r.buckets[region]
  if (sizes === null || sizes === undefined) return null
  return sizes.filter((s) => s.bucket === bucket)
}

function s3Rows(r: AwsReadings): Res[] {
  const listed: (readonly [
    string,
    (string | number | null | undefined)?,
    (string | null | undefined)?,
  ])[] =
    r.res.buckets ??
    [...new Set(everywhere(r.buckets).map((b) => `${b.region}\u0000${b.bucket}`))].map((k) => {
      const [region, name] = k.split('\u0000') as [string, string]
      return [name, null, region] as const
    })
  return listed
    .filter(([, , region]) => r.regions.includes(region ?? GLOBAL))
    .map(([name, created, bucketRegion]) => bucketRow(r, name, created, bucketRegion ?? GLOBAL))
}

/** A bucket: listed, its size by class where its region's BucketSizeBytes was read. */
function bucketRow(
  r: AwsReadings,
  name: string,
  created: string | number | null | undefined,
  region: string,
): Res {
  const sizes = bucketSizes(r, region, name)
  if (sizes === null)
    return res({
      service: 's3',
      id: name,
      region,
      name,
      created: ms(created ?? null),
      cells: { gb: null, bytes: null, standardShare: null, empty: 'unknown' },
    })
  const bytes = sizes.reduce((sum, x) => sum + x.bytes, 0)
  const standard = sizes
    .filter((x) => x.storage === 'StandardStorage')
    .reduce((sum, x) => sum + x.bytes, 0)
  return res({
    service: 's3',
    id: name,
    region,
    name,
    state: sizes.length === 0 ? 'empty' : 'stored',
    created: ms(created ?? null),
    monthly: sizes.reduce((sum, x) => sum + (prices.s3Month(x.storage, x.bytes, region) ?? 0), 0),
    cells: {
      gb: Math.round((bytes / GB) * 10) / 10,
      bytes,
      standardShare: bytes > 0 ? standard / bytes : null,
      empty: sizes.length === 0 ? 'yes' : 'no',
    },
  })
}

function alarmRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.alarmsAll).flatMap(([region, rows]) =>
    rows.map((a) =>
      res({
        service: 'alarms',
        id: a.n,
        region,
        name: a.n,
        state: a.s ?? null,
        monthly: prices.month('alarm', region),
        cells: { namespace: a.ns ?? null, dimName: a.d ?? null, dimValue: a.v ?? null },
      }),
    ),
  )
}

const vpcRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.vpcs).flatMap(([region, rows]) =>
    rows.map((v) =>
      res({
        service: 'vpc',
        id: v.id,
        region,
        name: v.id,
        state: v.d ? 'default' : 'custom',
        cells: { default: v.d ? 'yes' : 'no' },
      }),
    ),
  )

/**
 * Every certificate read: us-east-1's too when the pane does not show it, since those are
 * CloudFront's (the probe reads them for it) and the drill-down and ATTENTION list them.
 */
const acmRows = (r: AwsReadings): Res[] =>
  everywhere(r.certificates).map((c) =>
    res({
      service: 'acm',
      id: c.arn,
      region: c.region,
      name: c.domain ?? lastPart(c.arn),
      state: c.status,
      ...(r.regions.includes(c.region) ? {} : { global: true }),
      cells: { inUse: c.inUse ? 'yes' : 'no' },
    }),
  )

const stackRows = (r: AwsReadings): Res[] =>
  everywhere(r.stacks).map((s) =>
    res({ service: 'stacks', id: s.name, region: s.region, name: s.name, state: s.status }),
  )

/* ---- RESOURCES' own reads (aws.md §14.4) ---- */

function ecsRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.ecs).flatMap(([region, reading]) => [
    ...reading.clusters.map((c) =>
      res({
        service: 'ecs',
        id: c.n,
        region,
        name: c.n,
        state: c.s ?? null,
        cells: { kind: 'cluster', services: c.svc ?? 0, tasks: (c.run ?? 0) + (c.pend ?? 0) },
      }),
    ),
    ...reading.services.map((s) =>
      res({
        service: 'ecs',
        id: `${s.cl}/${s.n}`,
        region,
        name: s.n,
        state: (s.d ?? 0) === 0 ? 'desired 0' : 'active',
        created: ms(s.c ?? null),
        // Fargate tasks bill by the hour by their size, which the list does not say.
        hourly: s.l === 'FARGATE' && (s.r ?? 0) > 0,
        notPriced: s.l === 'FARGATE' && (s.r ?? 0) > 0,
        cells: {
          kind: 'service',
          cluster: s.cl,
          desired: s.d ?? 0,
          running: s.r ?? 0,
          launch: s.l ?? null,
        },
      }),
    ),
  ])
}

function ddbRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.ddb).flatMap(([region, reading]) => {
    const described = new Map(reading.tables.map((t) => [t.n, t]))
    return reading.names.map((name) => tableRow(region, name, described.get(name)))
  })
}

type Table = DdbReading['tables'][number]

/**
 * A table: storage by its class, and provisioned capacity by the hour. One listed beyond the
 * fifty described is counted with nothing known of it.
 */
function tableRow(region: string, name: string, t: Table | undefined): Res {
  if (t === undefined)
    return res({ service: 'dynamodb', id: name, region, name, cells: { mode: null } })
  const provisioned = t.m !== 'PAY_PER_REQUEST'
  const gb = (t.b ?? 0) / GB
  const storage = prices.perGb(
    t.k === 'STANDARD_INFREQUENT_ACCESS' ? 'ddbIa' : 'ddbStandard',
    gb,
    region,
  )
  const capacity = provisioned
    ? ((t.r ?? 0) * prices.hour('ddbRcu', region) + (t.w ?? 0) * prices.hour('ddbWcu', region)) *
      HOURS_A_MONTH
    : 0
  return res({
    service: 'dynamodb',
    id: name,
    region,
    name,
    state: t.s ?? null,
    created: ms(t.c ?? null),
    monthly: storage + capacity,
    hourly: provisioned,
    cells: {
      mode: provisioned ? 'PROVISIONED' : 'ON-DEMAND',
      rcu: t.r ?? null,
      wcu: t.w ?? null,
      gb: Math.round(gb * 100) / 100,
      items: t.i ?? null,
      class: t.k ?? null,
    },
  })
}

function sqsRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.sqs).flatMap(([region, queues]) => {
    const targets = new Set(queues.flatMap((q) => (q.dlq ? [q.dlq] : [])))
    return queues.map((q) =>
      res({
        service: 'sqs',
        id: q.n,
        region,
        name: q.n,
        state: 'active',
        created: ms(q.c ?? null),
        cells: {
          type: targets.has(q.n) ? 'dlq' : q.n.endsWith('.fifo') ? 'fifo' : 'standard',
          waiting: q.m ?? 0,
        },
      }),
    )
  })
}

const snsRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.sns).flatMap(([region, reading]) =>
    reading.topics.map((t) =>
      res({
        service: 'sns',
        id: t,
        region,
        name: t,
        state: 'active',
        cells: { subs: reading.subs[t] ?? 0 },
      }),
    ),
  )

const apiRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.apis).flatMap(([region, reading]) => [
    ...reading.rest.map((a) =>
      res({
        service: 'apigw',
        id: a.id,
        region,
        name: a.n ?? a.id,
        state: 'active',
        created: ms(a.c ?? null),
        cells: { type: 'REST' },
      }),
    ),
    ...reading.v2.map((a) =>
      res({
        service: 'apigw',
        id: a.id,
        region,
        name: a.n ?? a.id,
        state: 'active',
        created: ms(a.c ?? null),
        cells: { type: a.p === 'WEBSOCKET' ? 'WebSocket' : 'HTTP' },
      }),
    ),
  ])

const cloudfrontRows = (r: AwsReadings): Res[] =>
  (r.res.distributions ?? []).map(([id, enabled, status, modified, alias]) =>
    res({
      service: 'cloudfront',
      id,
      region: GLOBAL,
      global: true,
      name: alias ?? id,
      state: enabled === false ? 'disabled' : (status ?? 'Deployed'),
      cells: {
        enabled: enabled === false ? 'no' : 'yes',
        alias: alias ?? null,
        modified: ms(modified ?? null),
      },
    }),
  )

function bedrockPlaced(
  region: string,
  b: NonNullable<AwsReadings['res']['bedrock'][string]>,
): Res[] {
  const kind = (k: string, id: string, name: string | null | undefined, over: Partial<Res>) =>
    res({
      service: 'bedrock',
      id: `${k}:${id}`,
      region,
      name: name ?? id,
      ...over,
      cells: { kind: k, ...over.cells },
    })
  return [
    ...b.pts.map((p) =>
      kind('pt', p.id, p.n, {
        state: p.s ?? null,
        created: ms(p.c ?? null),
        hourly: p.s === 'InService',
        notPriced: p.s === 'InService',
        cells: {
          model: p.m ?? null,
          base: p.f ?? null,
          units: p.u ?? null,
          commitment: p.d ?? null,
          commitmentEnds: ms(p.e ?? null),
        },
      }),
    ),
    ...b.custom.map((m) =>
      kind('custom', m.id, m.n, {
        state: 'stored',
        created: ms(m.c ?? null),
        monthly: prices.month('customModel', region),
        cells: { base: m.b ?? null },
      }),
    ),
    ...b.imported.map((m) =>
      kind('imported', m.id, m.n, { state: 'stored', created: ms(m.c ?? null) }),
    ),
    ...b.kbs.map((k) =>
      kind('kb', k.id, k.n, {
        state: k.s ?? null,
        cells: { store: k.store ?? null, collection: k.collection ?? null },
      }),
    ),
    ...b.agents.map((a) => kind('agent', a.id, a.n, { state: a.s ?? null })),
    ...b.guardrails.map((g) =>
      kind('guardrail', g.id, g.n, { state: g.s ?? null, created: ms(g.c ?? null) }),
    ),
    ...b.profiles.map((p) =>
      kind('profile', p.id, p.n, { state: p.s ?? null, cells: { model: p.m[0] ?? null } }),
    ),
    ...b.runtimes.map((x) => kind('runtime', x.id, x.n, { state: x.s ?? null })),
  ]
}

const bedrockRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.bedrock).flatMap(([region, b]) => (b.offered ? bedrockPlaced(region, b) : []))

/**
 * OpenSearch Serverless bills OCUs per group of collections sharing a KMS key (aws.md §14.3),
 * read at the account level (AWS/AOSS SearchOCU and IndexingOCU): a collection's share is the
 * region's OCUs over its collections, by key.
 */
function aossRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.aoss).flatMap(([region, reading]) => {
    if (!reading.offered) return []
    const ocu = aossOcu(r, region)
    const groups = new Map<string, number>()
    for (const c of reading.collections) groups.set(c.k ?? '', (groups.get(c.k ?? '') ?? 0) + 1)
    const keys = groups.size || 1
    return reading.collections.map((c) => {
      const peers = groups.get(c.k ?? '') ?? 1
      const share = ocu === null ? null : ocu / keys / peers
      return res({
        service: 'aoss',
        id: c.id,
        region,
        name: c.n,
        state: c.s ?? null,
        created: ms(c.c ?? null),
        monthly: share === null ? null : share * prices.hour('aossOcu', region) * HOURS_A_MONTH,
        notPriced: share === null,
        hourly: true,
        cells: {
          type: c.t ?? null,
          ocu: share === null ? null : Math.round(share * 10) / 10,
          peers: peers - 1,
          key: c.k ?? null,
        },
      })
    })
  })
}

/** The region's OCUs (search and indexing, the last day's maximum), or null when not read. */
function aossOcu(r: AwsReadings, region: string): number | null {
  const usage = r.res.usage[region]
  if (usage === null || usage === undefined) return null
  const last = (metric: string) => {
    const series = Object.entries(usage).find(([k]) => k.startsWith(`AWS/AOSS|${metric}|`))?.[1]
    return series === undefined ? null : (series.v.at(-1) ?? 0)
  }
  const search = last('SearchOCU')
  const indexing = last('IndexingOCU')
  return search === null && indexing === null ? null : (search ?? 0) + (indexing ?? 0)
}

const logRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.logGroups).flatMap(([region, rows]) =>
    rows.map(([name, created, retention, stored, cls]) => {
      const gb = (stored ?? 0) / GB
      return res({
        service: 'logs',
        id: name,
        region,
        name,
        state: retention ? `${retention} d retention` : 'kept forever',
        created: ms(created ?? null),
        monthly: prices.perGb('logsStored', gb, region),
        cells: {
          retention: retention ? `${retention} d` : 'never',
          gb: Math.round(gb * 10) / 10,
          class: cls ?? 'STANDARD',
        },
      })
    }),
  )

const vpceRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.vpce).flatMap(([region, rows]) =>
    rows.map((e) => {
      const on = e.s === 'available'
      return res({
        service: 'vpce',
        id: e.id,
        region,
        name: e.name ?? e.id,
        state: e.s ?? null,
        created: ms(e.c ?? null),
        monthly: on ? (e.azs ?? 1) * prices.hour('vpceAz', region) * HOURS_A_MONTH : null,
        hourly: on,
        cells: { service: e.svc ? lastPart(e.svc) : null, azs: e.azs ?? null, vpc: e.vpc ?? null },
      })
    }),
  )

const tgwRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.tgw).flatMap(([region, rows]) =>
    rows.map((a) => {
      const on = a.s === 'available'
      return res({
        service: 'tgw',
        id: a.id,
        region,
        name: a.id,
        state: a.s ?? null,
        created: ms(a.c ?? null),
        monthly: on ? prices.hour('tgwAttachment', region) * HOURS_A_MONTH : null,
        hourly: on,
        cells: { tgw: a.tgw ?? null, type: a.t ?? null },
      })
    }),
  )

function vpnRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.vpn).flatMap(([region, rows]) =>
    rows.map((v) => {
      const on = v.s === 'available'
      const up = (v.st ?? []).filter((s) => s === 'UP').length
      const changes = (v.ch ?? []).map((t) => ms(t ?? null) ?? 0)
      return res({
        service: 'vpn',
        id: v.id,
        region,
        name: v.name ?? v.id,
        state: v.s ?? null,
        monthly: on ? prices.hour('vpn', region) * HOURS_A_MONTH : null,
        hourly: on,
        cells: {
          tunnelsUp: up,
          tunnels: (v.st ?? []).length,
          lastChange: changes.length ? Math.max(...changes) : null,
        },
      })
    }),
  )
}

function sagemakerRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.sagemaker).flatMap(([region, s]) => [
    ...s.endpoints.map((e) =>
      res({
        service: 'sagemaker',
        id: `endpoint:${e.n}`,
        region,
        name: e.n,
        state: e.s ?? null,
        created: ms(e.c ?? null),
        hourly: e.s === 'InService',
        notPriced: e.s === 'InService',
        cells: { kind: 'endpoint', since: ms(e.m ?? null) },
      }),
    ),
    ...s.notebooks.map((n) => {
      const on = n.s === 'InService'
      const hour = on ? prices.nodeHour('sagemaker', n.t, region) : null
      return res({
        service: 'sagemaker',
        id: `notebook:${n.n}`,
        region,
        name: n.n,
        state: n.s ?? null,
        created: ms(n.c ?? null),
        monthly: month(hour),
        hourly: on,
        notPriced: on && hour === null,
        cells: { kind: 'notebook', type: n.t ?? null, since: ms(n.m ?? null) },
      })
    }),
    ...s.apps.map((a) => {
      const on = a.s === 'InService'
      const hour = on ? prices.nodeHour('sagemaker', a.it, region) : null
      return res({
        service: 'sagemaker',
        id: `app:${a.d ?? ''}/${a.u ?? a.sp ?? ''}/${a.t ?? ''}/${a.n}`,
        region,
        name: `${a.u ?? a.sp ?? ''} ${a.t ?? ''} ${a.n}`.trim(),
        state: a.s ?? null,
        created: ms(a.c ?? null),
        monthly: month(hour),
        hourly: on,
        notPriced: on && hour === null,
        cells: { kind: 'app', type: a.it ?? null, since: ms(a.c ?? null) },
      })
    }),
  ])
}

function snapshotRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.images).flatMap(([region, reading]) => {
    const backing = new Set(
      reading.images.flatMap((i) => (i.s ?? []).filter((x): x is string => x !== null)),
    )
    return reading.snapshots.map((s) => {
      const archive = s.t === 'archive'
      return res({
        service: 'snapshots',
        id: s.id,
        region,
        name: s.id,
        state: archive ? 'archive' : 'standard',
        created: ms(s.c ?? null),
        // The volume's size: a snapshot stores only changed blocks, so this is at most.
        monthly: prices.perGb(archive ? 'snapshotArchive' : 'snapshot', s.g ?? 0, region),
        cells: { volume: s.v ?? null, gib: s.g ?? 0, ami: backing.has(s.id) ? 'yes' : 'no' },
      })
    })
  })
}

function amiRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.images).flatMap(([region, reading]) => {
    const sizes = new Map(reading.snapshots.map((s) => [s.id, s.g ?? 0]))
    return reading.images.map((i) => {
      const gib = (i.s ?? []).reduce((sum, id) => sum + (id === null ? 0 : (sizes.get(id) ?? 0)), 0)
      return res({
        service: 'amis',
        id: i.id,
        region,
        name: i.n ?? i.id,
        state: i.st ?? null,
        created: ms(i.c ?? null),
        // What an image costs is its snapshots'; counted here, not under them.
        monthly: prices.perGb('snapshot', gib, region),
        cells: { gib, lastLaunched: ms(i.l ?? null) },
      })
    })
  })
}

const ecrRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.ecr).flatMap(([region, rows]) =>
    rows.map((repo) => {
      const gb = (repo.b ?? 0) / GB
      return res({
        service: 'ecr',
        id: repo.n,
        region,
        name: repo.n,
        state: 'active',
        created: ms(repo.c ?? null),
        monthly: prices.perGb('ecr', gb, region),
        cells: {
          gb: Math.round(gb * 10) / 10,
          images: repo.k ?? null,
          pushed: ms(repo.p ?? null),
          pulled: ms(repo.l ?? null),
        },
      })
    }),
  )

function cacheRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.caches).flatMap(([region, reading]) => [
    ...reading.clusters.map((c) => {
      const on = c.s === 'available'
      const hour = prices.nodeHour('cache', c.t, region)
      return res({
        service: 'elasticache',
        id: c.id,
        region,
        name: c.g ?? c.id,
        state: c.s ?? null,
        created: ms(c.c ?? null),
        monthly: on && hour !== null ? hour * (c.n ?? 1) * HOURS_A_MONTH : null,
        hourly: on,
        notPriced: on && hour === null,
        cells: { kind: 'node cluster', type: c.t ?? null, engine: c.e ?? null, nodes: c.n ?? 1 },
      })
    }),
    ...reading.serverless.map((c) =>
      res({
        service: 'elasticache',
        id: `serverless:${c.n}`,
        region,
        name: c.n,
        state: c.s ?? null,
        created: ms(c.c ?? null),
        hourly: c.s === 'available',
        notPriced: c.s === 'available',
        cells: { kind: 'serverless', engine: c.e ?? null },
      }),
    ),
  ])
}

const osRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.osDomains).flatMap(([region, rows]) =>
    rows
      .filter((d) => d.d !== true)
      .map((d) => {
        const hour = prices.nodeHour('search', d.t, region)
        return res({
          service: 'opensearch',
          id: d.n,
          region,
          name: d.n,
          state: d.cr === false ? 'creating' : 'active',
          monthly: hour === null ? null : hour * (d.k ?? 1) * HOURS_A_MONTH,
          hourly: true,
          notPriced: hour === null,
          cells: { type: d.t ?? null, nodes: d.k ?? 1, engine: d.e ?? null },
        })
      }),
  )

function redshiftRows(r: AwsReadings): Res[] {
  return inRegions(r, r.res.redshift).flatMap(([region, reading]) => [
    ...reading.clusters.map((c) => {
      const on = c.s === 'available'
      const hour = prices.nodeHour('redshift', c.t, region)
      return res({
        service: 'redshift',
        id: c.id,
        region,
        name: c.id,
        state: c.s ?? null,
        created: ms(c.c ?? null),
        monthly: on && hour !== null ? hour * (c.n ?? 1) * HOURS_A_MONTH : null,
        hourly: on,
        notPriced: on && hour === null,
        cells: { kind: 'cluster', type: c.t ?? null, nodes: c.n ?? 1 },
      })
    }),
    // Serverless bills RPU-hours only while it works: usage-based.
    ...reading.workgroups.map((w) =>
      res({
        service: 'redshift',
        id: `workgroup:${w.n}`,
        region,
        name: w.n,
        state: w.s ?? null,
        created: ms(w.c ?? null),
        cells: { kind: 'serverless', rpu: w.b ?? null },
      }),
    ),
  ])
}

const kinesisRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.kinesis).flatMap(([region, rows]) =>
    rows.map((k) => {
      const onDemand = k.m === 'ON_DEMAND'
      const on = k.s === 'ACTIVE' || k.s === 'UPDATING'
      const hour = onDemand
        ? prices.hour('kinesisOnDemand', region)
        : (k.sh ?? 1) * prices.hour('kinesisShard', region)
      return res({
        service: 'kinesis',
        id: k.n,
        region,
        name: k.n,
        state: k.s ?? null,
        created: ms(k.c ?? null),
        monthly: on ? hour * HOURS_A_MONTH : null,
        hourly: on,
        cells: { mode: onDemand ? 'on-demand' : 'provisioned', shards: k.sh ?? null },
      })
    }),
  )

const transferRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.transfer).flatMap(([region, rows]) =>
    rows.map((t) => {
      const on = t.s === 'ONLINE'
      return res({
        service: 'transfer',
        id: t.id,
        region,
        name: t.id,
        state: t.s ?? null,
        monthly: on ? prices.hour('transfer', region) * HOURS_A_MONTH : null,
        hourly: on,
        cells: { endpoint: t.e ?? null, users: t.u ?? null },
      })
    }),
  )

const kmsRows = (r: AwsReadings): Res[] =>
  inRegions(r, r.res.kms).flatMap(([region, rows]) =>
    rows
      .filter((k) => k.m === 'CUSTOMER')
      .map((k) =>
        res({
          service: 'kms',
          id: k.id,
          region,
          name: k.id,
          state: k.s ?? null,
          created: ms(k.c ?? null),
          monthly: k.s === 'PendingDeletion' ? null : prices.month('kmsKey', region),
          cells: { spec: k.sp ?? null, deletion: ms(k.d ?? null) },
        }),
      ),
  )

const zoneRows = (r: AwsReadings): Res[] =>
  (r.res.zones ?? []).map((z) =>
    res({
      service: 'route53',
      id: lastPart(z.id),
      region: GLOBAL,
      global: true,
      name: z.n ?? z.id,
      state: z.p ? 'private' : 'public',
      monthly: prices.month('route53Zone', GLOBAL),
      cells: { records: z.c ?? null, private: z.p ? 'yes' : 'no' },
    }),
  )

const ROWS: Record<AwsService, (r: AwsReadings) => Res[]> = {
  ec2: ec2Rows,
  ebs: ebsRows,
  eip: eipRows,
  s3: s3Rows,
  nat: natRows,
  elb: elbRows,
  rds: rdsRows,
  eks: eksRows,
  lambda: lambdaRows,
  stacks: stackRows,
  acm: acmRows,
  alarms: alarmRows,
  ecs: ecsRows,
  dynamodb: ddbRows,
  sqs: sqsRows,
  sns: snsRows,
  apigw: apiRows,
  cloudfront: cloudfrontRows,
  bedrock: bedrockRows,
  aoss: aossRows,
  logs: logRows,
  vpce: vpceRows,
  tgw: tgwRows,
  vpn: vpnRows,
  sagemaker: sagemakerRows,
  snapshots: snapshotRows,
  amis: amiRows,
  ecr: ecrRows,
  elasticache: cacheRows,
  opensearch: osRows,
  redshift: redshiftRows,
  kinesis: kinesisRows,
  transfer: transferRows,
  kms: kmsRows,
  route53: zoneRows,
  vpc: vpcRows,
}

export const SERVICES = Object.keys(ROWS) as AwsService[]

/** One service's resources in the pane's regions (and the global ones). */
export const resourcesOf = (service: AwsService, r: AwsReadings): Res[] => ROWS[service](r)

const built = new WeakMap<AwsReadings, Map<AwsService, Res[]>>()

/**
 * Every resource, by service: built once a reading, since the view, the forgotten list, main's
 * memory and the usage probes each take it from the same readings.
 */
export function allResources(r: AwsReadings): Map<AwsService, Res[]> {
  const known = built.get(r)
  if (known !== undefined) return known
  const all = new Map(SERVICES.map((service) => [service, ROWS[service](r)]))
  built.set(r, all)
  return all
}

/** The key a resource is remembered and kept by. */
export const resKey = (row: { service: AwsService; region: string; id: string }): string =>
  `${row.service}:${row.region}:${row.id}`

const swept = new WeakMap<AwsReadings, Res[]>()

/**
 * The resources the weekly sweep found outside the pane's regions (describe only, aws.md §14.2
 * D), once a reading: the view, the drill-down and the console links each ask for them.
 */
export function elsewhereRows(r: AwsReadings): Res[] {
  const known = swept.get(r)
  if (known !== undefined) return known
  const rows = sweptRows(r)
  swept.set(r, rows)
  return rows
}

function sweptRows(r: AwsReadings): Res[] {
  return Object.entries(r.res.sweep).flatMap(([region, s]) => {
    if (s === null || r.regions.includes(region)) return []
    return [
      ...s.instances.map((i) => {
        const running = i.s === 'running'
        const hour = running ? prices.ec2Hour(i.type, region) : null
        return res({
          service: 'ec2',
          id: i.id,
          region,
          name: i.id,
          state: i.s,
          created: ms(i.l ?? null),
          monthly: month(hour),
          notPriced: running && hour === null,
          hourly: running,
          cells: { type: i.type },
        })
      }),
      ...s.volumes.map((v) =>
        res({
          service: 'ebs',
          id: v.id,
          region,
          name: v.id,
          state: v.s,
          monthly: prices.ebsMonth(v.t ?? 'gp3', v.g, null, region),
          cells: { gib: v.g, type: v.t ?? null },
        }),
      ),
      ...s.nats
        .filter((n) => n.s === 'available' || n.s === 'pending')
        .map((n) =>
          res({
            service: 'nat',
            id: n.id,
            region,
            name: n.id,
            state: n.s,
            monthly: prices.hour('nat', region) * HOURS_A_MONTH,
            hourly: true,
          }),
        ),
      ...s.addresses.map((a) =>
        res({
          service: 'eip',
          id: a.id,
          region,
          name: a.id,
          state: a.assoc ? 'associated' : 'not associated',
          monthly: prices.hour('ipv4', region) * HOURS_A_MONTH,
          hourly: true,
        }),
      ),
    ]
  })
}

/**
 * The reading a service's count comes from, per region, or its one global reading: what tells
 * "read, none there" from "not read yet" (aws.md §14.2 C) and lets a predicate trust that a
 * name missing from a list is gone, not unread.
 */
const READING: Record<AwsService, (r: AwsReadings) => PerRegion<unknown> | { global: unknown }> = {
  ec2: (r) => r.instances,
  ebs: (r) => r.volumes,
  eip: (r) => r.addresses,
  s3: (r) => ({ global: r.res.buckets }),
  nat: (r) => r.nats,
  elb: (r) => r.balancers,
  rds: (r) => r.databases,
  eks: (r) => r.clusters,
  lambda: (r) => r.functions,
  stacks: (r) => r.stacks,
  acm: (r) => r.certificates,
  alarms: (r) => r.res.alarmsAll,
  ecs: (r) => r.res.ecs,
  dynamodb: (r) => r.res.ddb,
  sqs: (r) => r.res.sqs,
  sns: (r) => r.res.sns,
  apigw: (r) => r.res.apis,
  cloudfront: (r) => ({ global: r.res.distributions }),
  bedrock: (r) => r.res.bedrock,
  aoss: (r) => r.res.aoss,
  logs: (r) => r.res.logGroups,
  vpce: (r) => r.res.vpce,
  tgw: (r) => r.res.tgw,
  vpn: (r) => r.res.vpn,
  sagemaker: (r) => r.res.sagemaker,
  snapshots: (r) => r.res.images,
  amis: (r) => r.res.images,
  ecr: (r) => r.res.ecr,
  elasticache: (r) => r.res.caches,
  opensearch: (r) => r.res.osDomains,
  redshift: (r) => r.res.redshift,
  kinesis: (r) => r.res.kinesis,
  transfer: (r) => r.res.transfer,
  kms: (r) => r.res.kms,
  route53: (r) => ({ global: r.res.zones }),
  vpc: (r) => r.res.vpcs,
}

const isGlobal = (v: PerRegion<unknown> | { global: unknown }): v is { global: unknown } =>
  Object.keys(v).length === 1 && 'global' in v

/** Whether the service's list answered in that region (or, global, at all). */
export function readIn(service: AwsService, r: AwsReadings, region: string): boolean {
  const reading = READING[service](r)
  if (isGlobal(reading)) return reading.global !== null && reading.global !== undefined
  const value = reading[region]
  return value !== null && value !== undefined
}

/** Where the service is read and where not yet, over the pane's regions. */
export function readState(service: AwsService, r: AwsReadings): 'read' | 'partly' | 'unread' {
  const reading = READING[service](r)
  if (isGlobal(reading))
    return reading.global === null || reading.global === undefined ? 'unread' : 'read'
  const read = r.regions.filter((region) => readIn(service, r, region)).length
  return read === r.regions.length ? 'read' : read === 0 ? 'unread' : 'partly'
}

/** The regions where a service is not offered (Bedrock, OpenSearch Serverless; aws.md §14.4). */
export function notOfferedIn(service: AwsService, r: AwsReadings): string[] {
  const per = service === 'bedrock' ? r.res.bedrock : service === 'aoss' ? r.res.aoss : null
  if (per === null) return []
  return r.regions.filter((region) => per[region]?.offered === false)
}
