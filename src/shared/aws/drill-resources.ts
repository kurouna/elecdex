import type { ColumnKind, DrillColumn, DrillDef } from './drill.js'
import { forgotten, seriesKey, USE, useOf } from './forgotten.js'
import { changes7d } from './inventory.js'
import { TILE } from './labels.js'
import { prices } from './list-prices.js'
import type { AwsReadings } from './readings.js'
import { allResources, elsewhereRows, type Res, resourcesOf } from './resources.js'
import type { AwsList, AwsService, DrillRow } from './types.js'

/**
 * The drill-down of RESOURCES' kinds (aws.md §14.5): each new service's facets and columns, and
 * the three lists across services (FORGOTTEN, NEW, ELSEWHERE). Rows come from RESOURCES' one
 * model (resources.ts), so a tile's count and its list never disagree.
 */

const f = (key: string, label: string) => ({ key, label })
const c = (key: string, label: string, kind: ColumnKind = 'text', masked = false): DrillColumn =>
  masked ? { key, label, kind, masked: true } : { key, label, kind }
const NAME = (label: string) => c('name', label, 'text', true)
const MONEY = c('monthly', '≈ $/month', 'money')
const USE_COL = c('use', 'use', 'text')

const def = (
  service: AwsService,
  facets: DrillDef['facets'],
  columns: DrillDef['columns'],
  sort = 'monthly',
): DrillDef => ({ label: TILE[service].label, facets, columns, sort })

export const RESOURCE_DRILL: Partial<Record<AwsService, DrillDef>> = {
  ecs: def(
    'ecs',
    [f('kind', 'KIND'), f('launch', 'LAUNCH'), f('state', 'STATE')],
    [
      NAME('name'),
      c('kind', 'kind'),
      c('cluster', 'cluster', 'text', true),
      c('desired', 'desired', 'num'),
      c('running', 'running', 'num'),
      c('launch', 'launch'),
    ],
    'running',
  ),
  dynamodb: def(
    'dynamodb',
    [f('mode', 'BILLING'), f('class', 'CLASS'), f('size', 'SIZE'), f('use', 'USE')],
    [
      NAME('table'),
      c('mode', 'billing'),
      c('gb', 'GB', 'gib'),
      c('items', 'items', 'num'),
      c('rcu', 'RCU', 'num'),
      c('wcu', 'WCU', 'num'),
      USE_COL,
      MONEY,
    ],
  ),
  sqs: def(
    'sqs',
    [f('type', 'TYPE'), f('wait', 'WAITING'), f('use', 'USE')],
    [
      NAME('queue'),
      c('type', 'type'),
      c('waiting', 'waiting', 'num'),
      c('created', 'created', 'date'),
      USE_COL,
    ],
    'waiting',
  ),
  sns: def(
    'sns',
    [f('subscribers', 'SUBSCRIBERS'), f('use', 'USE')],
    [NAME('topic'), c('subs', 'subscribers', 'num'), USE_COL],
    'subs',
  ),
  apigw: def(
    'apigw',
    [f('type', 'TYPE'), f('use', 'USE')],
    [NAME('API'), c('type', 'type'), c('created', 'created', 'date'), USE_COL],
    'created',
  ),
  cloudfront: def(
    'cloudfront',
    [f('enabled', 'ENABLED'), f('use', 'USE')],
    [
      NAME('alias'),
      c('id', 'id', 'text', true),
      c('enabled', 'enabled'),
      c('modified', 'modified', 'date'),
      USE_COL,
    ],
    // A distribution's list says when it last changed, not when it was made.
    'modified',
  ),
  bedrock: def(
    'bedrock',
    [f('kind', 'KIND'), f('model', 'MODEL'), f('state', 'STATE')],
    [
      NAME('name'),
      c('kind', 'kind'),
      c('model', 'model'),
      c('state', 'state'),
      c('created', 'created', 'date'),
      MONEY,
    ],
  ),
  aoss: def(
    'aoss',
    [f('type', 'TYPE'), f('use', 'USE')],
    [NAME('collection'), c('type', 'type'), c('ocu', 'OCU', 'num'), USE_COL, MONEY],
  ),
  logs: def(
    'logs',
    [
      f('retention', 'RETENTION'),
      f('class', 'CLASS'),
      f('size', 'STORED'),
      f('ingested', 'INGESTED 14 D'),
      f('source', 'SOURCE'),
    ],
    [
      NAME('log group'),
      c('retention', 'retention'),
      c('gb', 'stored GB', 'gib'),
      c('class', 'class'),
      c('created', 'created', 'date'),
      c('ingest', '≈ $ ingested 30 d', 'money'),
      MONEY,
    ],
  ),
  vpce: def(
    'vpce',
    [f('state', 'STATE'), f('service', 'SERVICE'), f('use', 'USE')],
    [
      NAME('endpoint'),
      c('service', 'service'),
      c('azs', 'AZs', 'num'),
      c('vpc', 'vpc', 'text', true),
      USE_COL,
      MONEY,
    ],
  ),
  tgw: def(
    'tgw',
    [f('state', 'STATE'), f('type', 'TYPE'), f('use', 'USE')],
    [
      NAME('attachment'),
      c('tgw', 'transit gateway', 'text', true),
      c('type', 'type'),
      USE_COL,
      MONEY,
    ],
  ),
  vpn: def(
    'vpn',
    [f('state', 'STATE'), f('tunnels', 'TUNNELS UP')],
    [NAME('connection'), c('state', 'state'), c('tunnelsUp', 'tunnels up', 'num'), MONEY],
  ),
  sagemaker: def(
    'sagemaker',
    [f('kind', 'KIND'), f('state', 'STATE')],
    [
      NAME('name'),
      c('kind', 'kind'),
      c('type', 'instance'),
      c('state', 'state'),
      c('created', 'created', 'date'),
      MONEY,
    ],
  ),
  snapshots: def(
    'snapshots',
    [f('state', 'TIER'), f('ami', 'AN IMAGE USES IT'), f('age', 'AGE')],
    [
      NAME('snapshot'),
      c('volume', 'volume', 'text', true),
      c('gib', 'GiB', 'gib'),
      c('created', 'created', 'date'),
      MONEY,
    ],
  ),
  amis: def(
    'amis',
    [f('state', 'STATE'), f('launched', 'LAST LAUNCH')],
    [
      NAME('image'),
      c('gib', 'GiB', 'gib'),
      c('created', 'created', 'date'),
      c('lastLaunched', 'last launched', 'date'),
      MONEY,
    ],
  ),
  ecr: def(
    'ecr',
    [f('use', 'USE')],
    [
      NAME('repository'),
      c('gb', 'GB', 'gib'),
      c('images', 'images', 'num'),
      c('pushed', 'pushed', 'date'),
      c('pulled', 'pulled', 'date'),
      MONEY,
    ],
  ),
  elasticache: def(
    'elasticache',
    [f('kind', 'KIND'), f('type', 'TYPE'), f('engine', 'ENGINE')],
    [
      NAME('cache'),
      c('kind', 'kind'),
      c('type', 'type'),
      c('nodes', 'nodes', 'num'),
      USE_COL,
      MONEY,
    ],
  ),
  opensearch: def(
    'opensearch',
    [f('type', 'TYPE'), f('use', 'USE')],
    [
      NAME('domain'),
      c('type', 'type'),
      c('nodes', 'nodes', 'num'),
      c('engine', 'engine'),
      USE_COL,
      MONEY,
    ],
  ),
  redshift: def(
    'redshift',
    [f('kind', 'KIND'), f('state', 'STATE')],
    [
      NAME('name'),
      c('kind', 'kind'),
      c('type', 'type'),
      c('nodes', 'nodes', 'num'),
      c('state', 'state'),
      MONEY,
    ],
  ),
  kinesis: def(
    'kinesis',
    [f('mode', 'MODE'), f('state', 'STATE'), f('use', 'USE')],
    [NAME('stream'), c('mode', 'mode'), c('shards', 'shards', 'num'), USE_COL, MONEY],
  ),
  transfer: def(
    'transfer',
    [f('state', 'STATE'), f('endpoint', 'ENDPOINT')],
    [
      NAME('server'),
      c('endpoint', 'endpoint'),
      c('users', 'users', 'num'),
      c('state', 'state'),
      MONEY,
    ],
  ),
  kms: def(
    'kms',
    [f('state', 'STATE'), f('spec', 'SPEC')],
    [NAME('key'), c('state', 'state'), c('spec', 'spec'), c('created', 'created', 'date'), MONEY],
  ),
  route53: def(
    'route53',
    [f('private', 'PRIVATE')],
    [NAME('zone'), c('records', 'records', 'num'), c('private', 'private'), MONEY],
  ),
  vpc: def('vpc', [f('default', 'DEFAULT')], [NAME('vpc'), c('default', 'default')], 'name'),
}

/** The lists across services (aws.md §14.5). */
export const LIST_DRILL: Record<AwsList, DrillDef> = {
  forgotten: {
    label: 'Looks forgotten',
    facets: [
      f('service', 'SERVICE'),
      f('reason', 'REASON'),
      f('region', 'REGION'),
      f('billed', 'BILLED'),
    ],
    columns: [
      NAME('name'),
      c('service', 'service'),
      c('why', 'why'),
      c('quietFor', 'quiet for'),
      MONEY,
    ],
    sort: 'monthly',
  },
  new: {
    label: 'New in 7 days',
    facets: [f('service', 'SERVICE'), f('change', 'CHANGE')],
    columns: [
      NAME('name'),
      c('service', 'service'),
      c('change', 'change'),
      c('at', 'when', 'date'),
    ],
    sort: 'at',
  },
  elsewhere: {
    label: 'Outside the regions shown',
    facets: [f('region', 'REGION'), f('service', 'SERVICE')],
    columns: [NAME('name'), c('service', 'service'), c('state', 'state'), MONEY],
    sort: 'monthly',
  },
}

export const isAwsList = (raw: unknown): raw is AwsList =>
  raw === 'forgotten' || raw === 'new' || raw === 'elsewhere'

const sizeClass = (gb: number) =>
  gb < 1 ? '< 1 GB' : gb < 10 ? '< 10 GB' : gb < 50 ? '< 50 GB' : '≥ 50 GB'
const ageClass = (now: number, at: number | null) => {
  if (at === null) return '—'
  const d = (now - at) / 86_400_000
  return d <= 30 ? '≤ 30 d' : d <= 90 ? '≤ 90 d' : '> 90 d'
}

/** The use column's word: what the judgement read (aws.md §14.5). */
function useWord(r: AwsReadings, x: Res): string {
  const specs = USE[x.service]?.(x) ?? []
  if (specs.length === 0) return '—'
  const use =
    x.service === 'cloudfront'
      ? useOf(r, x.region, specs, r.res.cloudfrontPresence)
      : useOf(r, x.region, specs)
  return use.state === 'active'
    ? 'in use'
    : use.state === 'quiet'
      ? `quiet ${use.quietFor}`
      : 'not read'
}

/** A log group's facets: its size, its ingestion's ≈ $ in 30 days, its source still there. */
function logCells(r: AwsReadings, x: Res, gb: number): Record<string, string | number | null> {
  const key = seriesKey({
    ns: 'AWS/Logs',
    metric: 'IncomingBytes',
    dim: 'LogGroupName',
    value: x.id,
  })
  const bytes = r.res.usage[x.region]?.[key]?.v.reduce((s, v) => s + v, 0) ?? null
  const fn = /^\/aws\/lambda\/(.+)$/.exec(x.id)?.[1]
  const half = x.cells.class === 'INFREQUENT_ACCESS' ? 0.5 : 1
  return {
    size: sizeClass(gb),
    ingest:
      bytes === null ? null : prices.perGb('logsIngested', bytes / 1024 ** 3, x.region) * half,
    source:
      fn === undefined ? '—' : r.functions[x.region]?.some((f) => f.name === fn) ? 'there' : 'gone',
    ingested: useWord(r, x) === 'in use' ? 'yes' : 'no',
  }
}

const EXTRA: Partial<
  Record<AwsService, (r: AwsReadings, x: Res, gb: number) => Record<string, string | number | null>>
> = {
  dynamodb: (_r, _x, gb) => ({ size: sizeClass(gb) }),
  sqs: (_r, x) => ({ wait: (x.cells.waiting ?? 0) === 0 ? 'none' : 'some' }),
  sns: (_r, x) => ({ subscribers: x.cells.subs === 0 ? '0' : '1+' }),
  logs: logCells,
  snapshots: (r, x) => ({ age: ageClass(r.now, x.created) }),
  amis: (r, x) => ({
    launched: ageClass(
      r.now,
      typeof x.cells.lastLaunched === 'number' ? x.cells.lastLaunched : null,
    ),
  }),
  vpn: (_r, x) => ({ tunnels: String(x.cells.tunnelsUp ?? 0) }),
}

/** Cells the facets need beyond the model's own. */
function extraCells(r: AwsReadings, x: Res): Record<string, string | number | null> {
  const gb = typeof x.cells.gb === 'number' ? x.cells.gb : 0
  return EXTRA[x.service]?.(r, x, gb) ?? {}
}

/** A RESOURCES kind's rows for its list. */
export function resourceRows(service: AwsService, r: AwsReadings): Omit<DrillRow, 'weight'>[] {
  return resourcesOf(service, r).map((x) => ({
    id: x.id,
    region: x.region,
    name: x.name,
    cells: {
      ...x.cells,
      name: x.name,
      id: x.id,
      state: x.state,
      created: x.created,
      monthly: x.monthly,
      use: useWord(r, x),
      ...extraCells(r, x),
    },
  }))
}

/** A list across services: every row says the service its id belongs to. */
export function listRows(which: AwsList, r: AwsReadings): DrillRow[] {
  if (which === 'forgotten')
    return forgotten(r).rows.map((row) => ({
      id: row.id,
      service: row.service,
      region: row.region,
      name: row.name,
      names: row.names,
      weight: row.weight,
      cells: {
        name: row.name,
        service: TILE[row.service].label,
        why: row.why,
        reason: row.reason,
        quietFor: row.quietFor,
        billed: row.billed ? 'yes' : 'no',
        monthly: row.monthly,
      },
    }))
  if (which === 'new') {
    const changes = changes7d(r, allResources(r))
    return [
      ...changes.added.map((a) => ({
        id: a.id,
        service: a.service,
        region: a.region,
        name: a.name,
        weight: null,
        cells: { name: a.name, service: TILE[a.service].label, change: 'new', at: a.at },
      })),
      ...changes.removed.map((g) => ({
        id: g.key,
        region: g.key.split(':')[1] ?? '',
        name: g.name,
        weight: null,
        cells: { name: g.name, service: TILE[g.service].label, change: 'gone', at: g.at },
      })),
    ]
  }
  return elsewhereRows(r).map((x) => ({
    id: x.id,
    service: x.service,
    region: x.region,
    name: x.name,
    weight: 'warn' as const,
    cells: { name: x.name, service: TILE[x.service].label, state: x.state, monthly: x.monthly },
  }))
}
