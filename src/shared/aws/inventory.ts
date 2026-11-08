import { localDay } from '../cloud-cli/ledger.js'
import { bytesText } from './active.js'
import { AWS_LIMITS } from './facts.js'
import { forgotten, seriesKey, USE } from './forgotten.js'
import { TILE } from './labels.js'
import { HOURS_A_MONTH } from './list-prices.js'
import { lastPart } from './parse-resources.js'
import type { AwsReadings } from './readings.js'
import type { InventoryMemory } from './resource-readings.js'
import {
  allResources,
  elsewhereRows,
  GLOBAL,
  notOfferedIn,
  type Res,
  readIn,
  readState,
  resKey,
  SERVICES,
} from './resources.js'
import { billedNotListed } from './service-names.js'
import type {
  AwsService,
  BedrockTile,
  ForgottenRow,
  ResourcesView,
  ResourceTile,
  TileGroup,
  TileSegment,
} from './types.js'

/**
 * RESOURCES' first step (aws.md §14.2): the figures, the tiles by group, Also here, ELSEWHERE,
 * BILLED NOT LISTED and NEW 7 D, from one reading and main's memory of the account. Pure; main
 * sends the result as the board's `resources` and keeps the memory with `memoryAfter`.
 */

const DAY = 86_400_000
const WEEK = 7 * DAY

/** The tiles' groups in their fixed order: the order that breaks ties of forgotten money. */
export const GROUPS: readonly { group: TileGroup; services: readonly AwsService[] }[] = [
  { group: 'COMPUTE', services: ['ec2', 'ecs', 'eks', 'lambda'] },
  { group: 'STORAGE', services: ['s3', 'ebs', 'snapshots', 'amis', 'ecr'] },
  { group: 'DATABASE', services: ['rds', 'dynamodb', 'elasticache', 'opensearch', 'redshift'] },
  { group: 'NETWORK', services: ['nat', 'elb', 'eip', 'vpce', 'tgw', 'vpn'] },
  { group: 'AI', services: ['bedrock', 'aoss', 'sagemaker'] },
  { group: 'EDGE & API', services: ['cloudfront', 'apigw'] },
  { group: 'INTEGRATION', services: ['sqs', 'sns', 'kinesis', 'transfer'] },
  { group: 'SECURITY', services: ['kms', 'route53'] },
  { group: 'LOGS', services: ['logs'] },
]

export { TILE } from './labels.js'

/** What costs nothing and belongs to ATTENTION's side: one line under the tiles (§14.2 C). */
export const ALSO_HERE: readonly AwsService[] = ['vpc', 'acm', 'stacks', 'alarms']

/**
 * The IAM prefix of each service's reads, to sort the board's refusals onto its tiles. Every
 * tiled service has its row, the ones ACTIVE reads too: a refused list with no row here left its
 * tile "reading…" for good.
 */
const IAM: Partial<Record<AwsService, readonly string[]>> = {
  ec2: ['ec2:DescribeInstances'],
  ebs: ['ec2:DescribeVolumes'],
  eip: ['ec2:DescribeAddresses'],
  nat: ['ec2:DescribeNatGateways'],
  elb: ['elasticloadbalancing:'],
  rds: ['rds:'],
  lambda: ['lambda:'],
  s3: ['s3:'],
  ecs: ['ecs:'],
  dynamodb: ['dynamodb:'],
  sqs: ['sqs:'],
  sns: ['sns:'],
  apigw: ['apigateway:'],
  cloudfront: ['cloudfront:'],
  bedrock: ['bedrock:', 'bedrock-agentcore:'],
  aoss: ['aoss:'],
  logs: ['logs:'],
  vpce: ['ec2:DescribeVpcEndpoints'],
  tgw: ['ec2:DescribeTransitGatewayAttachments'],
  vpn: ['ec2:DescribeVpnConnections'],
  sagemaker: ['sagemaker:'],
  snapshots: ['ec2:DescribeSnapshots'],
  amis: ['ec2:DescribeImages'],
  ecr: ['ecr:'],
  elasticache: ['elasticache:'],
  opensearch: ['es:'],
  redshift: ['redshift:', 'redshift-serverless:'],
  kinesis: ['kinesis:'],
  transfer: ['transfer:'],
  kms: ['kms:'],
  route53: ['route53:'],
  eks: ['eks:'],
}

const count = (rows: readonly Res[], test: (x: Res) => boolean) => rows.filter(test).length

/** The big number, its noun, the state line and the legend of each kind (§14.2 C). */
function tileFacts(
  service: AwsService,
  rows: readonly Res[],
  idle: number,
): Pick<ResourceTile, 'count' | 'noun' | 'segments' | 'legend' | 'size' | 'usageBased'> {
  const seg = (n: number, tone: TileSegment['tone'], label: string): TileSegment => ({
    n,
    tone,
    label,
  })
  const base = { count: rows.length, noun: TILE[service].noun, size: null, usageBased: false }
  switch (service) {
    case 'ec2': {
      const running = count(rows, (x) => x.state === 'running')
      return {
        ...base,
        count: running,
        segments: [
          seg(running - idle, 'ok', 'busy'),
          seg(idle, 'warn', 'idle'),
          seg(rows.length - running, 'off', 'stopped'),
        ],
        legend: [
          { text: `${running - idle} busy`, tone: null },
          { text: `${idle} idle`, tone: idle > 0 ? 'warn' : null },
          { text: `${rows.length - running} stopped`, tone: null },
        ],
      }
    }
    case 's3': {
      const bytes = rows.reduce(
        (s, x) => s + (typeof x.cells.bytes === 'number' ? x.cells.bytes : 0),
        0,
      )
      const empty = count(rows, (x) => x.cells.empty === 'yes')
      return {
        ...base,
        size: bytesText(bytes),
        segments: [seg(rows.length - empty, 'ok', 'stored'), seg(empty, 'off', 'empty')],
        legend: [
          { text: bytesText(bytes), tone: null },
          { text: `${empty} empty`, tone: null },
        ],
      }
    }
    case 'logs': {
      const forever = count(rows, (x) => x.cells.retention === 'never')
      const gb = rows.reduce((s, x) => s + (typeof x.cells.gb === 'number' ? x.cells.gb : 0), 0)
      return {
        ...base,
        size: bytesText(gb * 1024 ** 3),
        segments: [
          seg(rows.length - forever, 'ok', 'with retention'),
          seg(forever, 'second', 'kept forever'),
        ],
        legend: [
          { text: `${bytesText(gb * 1024 ** 3)} stored`, tone: null },
          { text: `${forever} kept forever`, tone: null },
        ],
      }
    }
    case 'rds': {
      const on = count(rows, (x) => x.state === 'available')
      return {
        ...base,
        count: on,
        segments: [seg(on, 'ok', 'available'), seg(rows.length - on, 'off', 'stopped')],
        legend: [{ text: `${rows.length - on} stopped`, tone: null }],
      }
    }
    case 'ecs': {
      const services = rows.filter((x) => x.cells.kind === 'service')
      const tasks = services.reduce(
        (s, x) => s + (typeof x.cells.running === 'number' ? x.cells.running : 0),
        0,
      )
      return {
        ...base,
        count: services.length,
        segments: [
          seg(
            count(services, (x) => x.cells.desired !== 0),
            'ok',
            'running',
          ),
          seg(
            count(services, (x) => x.cells.desired === 0),
            'off',
            'desired 0',
          ),
        ],
        legend: [
          { text: `${tasks} tasks`, tone: null },
          {
            text: `${count(services, (x) => x.cells.launch === 'FARGATE')} on Fargate`,
            tone: null,
          },
        ],
      }
    }
    case 'sagemaker': {
      const on = count(rows, (x) => x.state === 'InService')
      return {
        ...base,
        count: on,
        segments: [seg(on, 'ok', 'in service'), seg(rows.length - on, 'off', 'other')],
        legend: [{ text: `${rows.length} in all`, tone: null }],
      }
    }
    case 'lambda':
    case 'sqs':
    case 'sns':
    case 'apigw':
    case 'cloudfront':
      return { ...base, usageBased: true, segments: [seg(rows.length, 'ok', 'listed')], legend: [] }
    default:
      return { ...base, segments: [seg(rows.length, 'ok', 'listed')], legend: [] }
  }
}

function tileOf(
  service: AwsService,
  rows: readonly Res[],
  found: readonly ForgottenRow[],
  delta: { added: number; removed: number },
): ResourceTile {
  const mine = found.filter((f) => f.service === service)
  const billed = mine.filter((f) => f.billed)
  const usd = billed.reduce((s, f) => s + (f.monthly ?? 0), 0)
  const idle = mine.filter((f) => f.reason === 'low-use').length
  const facts = tileFacts(service, rows, idle)
  const quiet = mine.length - billed.length
  // The state line marks what looks forgotten when the kind has no states of its own.
  const segments =
    facts.segments.length === 1 && mine.length > 0
      ? [
          { n: rows.length - mine.length, tone: 'ok' as const, label: 'in use' },
          { n: billed.length, tone: 'warn' as const, label: 'forgotten?' },
          { n: quiet, tone: 'off' as const, label: 'quiet' },
        ]
      : facts.segments
  const priced = rows.filter((x) => x.monthly !== null)
  return {
    service,
    label: TILE[service].label,
    ...facts,
    segments: segments.filter((s) => s.n > 0),
    regions: [...new Set(rows.map((x) => x.region))].sort(),
    forgottenBilled: billed.length,
    forgottenQuiet: quiet,
    forgottenUsd: usd,
    frame:
      usd >= AWS_LIMITS.forgottenDangerUsd
        ? 'danger'
        : usd >= AWS_LIMITS.tileWarnUsd || billed.some((f) => f.notPriced)
          ? 'warn'
          : null,
    monthly: priced.length === 0 ? null : priced.reduce((s, x) => s + (x.monthly ?? 0), 0),
    added: delta.added,
    removed: delta.removed,
  }
}

/* ---- NEW 7 D (aws.md §14.2 A) ---- */

/** A Lambda function's own log group, folded into the function when counting what is new. */
const ownLogGroup = (x: Res, functions: ReadonlySet<string>) =>
  x.service === 'logs' &&
  functions.has(`${x.region}:${/^\/aws\/lambda\/(.+)$/.exec(x.id)?.[1] ?? ''}`)

/**
 * When a resource appeared: its creation date when the kind has one, else the day main first saw
 * it - never the day main first read its kind, when everything would look new.
 */
function appearedAt(x: Res, memory: InventoryMemory): number | null {
  if (x.created !== null) return x.created
  const seen = memory.seen[resKey(x)]
  const first = memory.firstAt[x.service]
  if (seen === undefined || first === undefined || localDay(seen) === localDay(first)) return null
  return seen
}

export interface Changes7d {
  added: { service: AwsService; region: string; id: string; name: string; at: number }[]
  removed: { service: AwsService; key: string; name: string; at: number }[]
}

export function changes7d(r: AwsReadings, all: ReadonlyMap<AwsService, Res[]>): Changes7d {
  const memory = r.res.memory
  const functions = new Set((all.get('lambda') ?? []).map((f) => `${f.region}:${f.id}`))
  const added: Changes7d['added'] = []
  for (const rows of all.values())
    for (const x of rows) {
      const at = appearedAt(x, memory)
      if (at !== null && r.now - at <= WEEK && !ownLogGroup(x, functions))
        added.push({ service: x.service, region: x.region, id: x.id, name: x.name, at })
    }
  const removed = Object.entries(memory.gone)
    .filter(([, g]) => r.now - g.at <= WEEK)
    .map(([key, g]) => ({ service: key.split(':')[0] as AwsService, key, name: g.name, at: g.at }))
  return { added: added.sort((a, b) => b.at - a.at), removed: removed.sort((a, b) => b.at - a.at) }
}

/* ---- What main remembers (aws.md §14.4) ---- */

/**
 * The account's memory after a reading: first sightings, what went (only for kinds read again,
 * so a failed read is never "everything went"), unattached-since, the buckets' size history,
 * when each usage metric was last listed, and what is forgotten after 30 days.
 */
export function memoryAfter(r: AwsReadings, before: InventoryMemory): InventoryMemory {
  const next: InventoryMemory = {
    firstAt: { ...before.firstAt },
    seen: { ...before.seen },
    gone: {},
    // Kept whole and taken off only where its kind was read again (`forgetAttached`): a build
    // before the volumes have read, a failed read or a pane of other regions forgets nothing.
    unattached: { ...before.unattached },
    lastMetric: { ...before.lastMetric },
    s3: { ...before.s3 },
    keep: { ...before.keep },
  }
  const { present, loose } = rememberRows(next, before, r)
  markGone(next, before, r, present)
  forgetAttached(next, r, loose)
  return next
}

/** What is there now: first sightings, unattached since, sizes, last listings. */
function rememberRows(
  next: InventoryMemory,
  before: InventoryMemory,
  r: AwsReadings,
): { present: Set<string>; loose: Set<string> } {
  const present = new Set<string>()
  const loose = new Set<string>()
  for (const [service, rows] of allResources(r)) {
    if (readState(service, r) === 'unread') continue
    next.firstAt[service] ??= r.now
    for (const x of rows) {
      const key = resKey(x)
      present.add(key)
      next.seen[key] ??= r.now
      if (
        (x.service === 'ebs' && x.state === 'available') ||
        (x.service === 'eip' && x.state === 'not associated')
      ) {
        loose.add(key)
        next.unattached[key] = before.unattached[key] ?? r.now
      }
      if (x.service === 's3') rememberSize(next, x, r.now)
      rememberMetrics(next, r, x)
    }
  }
  return { present, loose }
}

/** "Unattached since" goes only where its kind was read in its region and it is loose no more. */
function forgetAttached(next: InventoryMemory, r: AwsReadings, loose: ReadonlySet<string>): void {
  for (const key of Object.keys(next.unattached)) {
    const [service, region] = key.split(':') as [AwsService, string]
    if (!loose.has(key) && SERVICES.includes(service) && readIn(service, r, region))
      delete next.unattached[key]
  }
}

/**
 * Whether a remembered resource went: its list answered there and does not have it. S3's list
 * is the account's, so a bucket goes only when that list no longer has it - never because its
 * region is not one of this pane's.
 */
function isGone(key: string, r: AwsReadings, present: ReadonlySet<string>): boolean {
  if (present.has(key)) return false
  const [service, region] = key.split(':') as [AwsService, string]
  if (!SERVICES.includes(service) || !readIn(service, r, region)) return false
  if (service !== 's3') return true
  const name = key.split(':').slice(2).join(':')
  return !(r.res.buckets ?? []).some(([b, , at]) => b === name && (at ?? GLOBAL) === region)
}

/**
 * What went: only where its list answered again (a region not read is not a region emptied),
 * named by its id's last part (never an ARN with the account), forgotten after 30 days.
 */
function markGone(
  next: InventoryMemory,
  before: InventoryMemory,
  r: AwsReadings,
  present: ReadonlySet<string>,
): void {
  for (const key of Object.keys(before.seen)) {
    if (!isGone(key, r, present)) continue
    delete next.seen[key]
    next.gone[key] = before.gone[key] ?? {
      at: r.now,
      name: lastPart(key.split(':').slice(2).join(':')),
    }
  }
  for (const [key, g] of Object.entries(before.gone))
    if (r.now - g.at <= 30 * DAY && next.seen[key] === undefined) next.gone[key] ??= g
}

function rememberSize(next: InventoryMemory, x: Res, now: number): void {
  const bytes = typeof x.cells.bytes === 'number' ? x.cells.bytes : null
  if (bytes === null) return
  const kept = next.s3[x.id]
  // Within a thousandth: a bucket's daily size wobbles by its metadata alone.
  if (kept === undefined || Math.abs(kept.bytes - bytes) > Math.max(1, kept.bytes / 1000))
    next.s3[x.id] = { bytes, since: now }
}

/**
 * The day a metric was last listed is the day list-metrics answered, never the build's: a board
 * is built every few seconds, and the build's time would change the memory each time.
 */
function rememberMetrics(next: InventoryMemory, r: AwsReadings, x: Res): void {
  const cloudfront = x.service === 'cloudfront'
  const presence = cloudfront ? r.res.cloudfrontPresence : r.res.presence[x.region]
  const at = cloudfront ? r.res.cloudfrontPresenceAt : r.res.presenceAt[x.region]
  if (presence === null || presence === undefined || at === null || at === undefined) return
  for (const spec of USE[x.service]?.(x) ?? []) {
    const listed = presence[`${spec.ns} ${spec.metric}`]
    const key = `${x.region}|${seriesKey(spec)}`
    if (
      at > (next.lastMetric[key] ?? 0) &&
      listed?.some((dims) => dims.some((d) => d.Name === spec.dim && d.Value === spec.value))
    )
      next.lastMetric[key] = at
  }
}

/* ---- The view ---- */

function bedrockTile(
  r: AwsReadings,
  rows: readonly Res[],
  found: readonly ForgottenRow[],
): BedrockTile | null {
  const names = r.res.bedrockNames
  const models = new Set(Object.values(r.res.bedrockUse).flatMap((ids) => ids ?? []))
  if (models.size === 0 && rows.length === 0) return null
  const sum = (id: string, metric: string): number | null => {
    let total: number | null = null
    for (const usage of Object.values(r.res.usage)) {
      const series = usage?.[seriesKey({ ns: 'AWS/Bedrock', metric, dim: 'ModelId', value: id })]
      if (series !== undefined) total = (total ?? 0) + series.v.reduce((s, v) => s + v, 0)
    }
    return total
  }
  const kinds = [
    'pt',
    'custom',
    'imported',
    'kb',
    'agent',
    'guardrail',
    'profile',
    'runtime',
  ] as const
  return {
    models: [...models]
      .map((id) => ({
        id,
        name:
          names?.profiles[id] ??
          names?.models[id] ??
          names?.models[id.replace(/^[a-z]{2,4}\./, '')] ??
          id,
        tokensIn: sum(id, 'InputTokenCount'),
        tokensOut: sum(id, 'OutputTokenCount'),
      }))
      .sort(
        (a, b) =>
          (b.tokensIn ?? 0) + (b.tokensOut ?? 0) - ((a.tokensIn ?? 0) + (a.tokensOut ?? 0)) ||
          a.id.localeCompare(b.id),
      ),
    placed: kinds.map((kind) => {
      const mine = rows.filter((x) => x.cells.kind === kind)
      const flagged = found.filter((f) => f.service === 'bedrock' && f.id.startsWith(`${kind}:`))
      return {
        kind,
        count: mine.length,
        weight: flagged.some((f) => f.weight === 'danger')
          ? 'danger'
          : flagged.some((f) => f.billed)
            ? 'warn'
            : flagged.length > 0
              ? 'quiet'
              : null,
      }
    }),
  }
}

function alsoHere(r: AwsReadings, all: ReadonlyMap<AwsService, Res[]>): ResourcesView['alsoHere'] {
  const notes: Partial<Record<AwsService, (rows: Res[]) => string | null>> = {
    stacks: (rows) => {
      const failed = count(rows, (x) => /_FAILED$/.test(x.state ?? ''))
      return failed > 0 ? `${failed} failed` : null
    },
    alarms: (rows) => {
      const on = count(rows, (x) => x.state === 'ALARM')
      return on > 0 ? `${on} in ALARM` : null
    },
  }
  return ALSO_HERE.flatMap((service) => {
    const rows = all.get(service) ?? []
    if (rows.length === 0 || readState(service, r) === 'unread') return []
    return [
      {
        service,
        count: rows.length,
        noun: TILE[service].noun,
        note: notes[service]?.(rows) ?? null,
      },
    ]
  })
}

function elsewhereView(r: AwsReadings): ResourcesView['elsewhere'] {
  const byRegion = new Map<string, Res[]>()
  for (const x of elsewhereRows(r)) byRegion.set(x.region, [...(byRegion.get(x.region) ?? []), x])
  const text: Partial<Record<AwsService, (n: number) => string>> = {
    ec2: (n) => `${n} EC2 running`,
    ebs: (n) => `${n} volume${n === 1 ? '' : 's'}`,
    nat: (n) => `${n} NAT`,
    eip: (n) => `${n} address${n === 1 ? '' : 'es'}`,
  }
  return {
    on: r.res.sweepOn,
    readAt: r.res.sweepAt,
    regions: [...byRegion.entries()]
      .map(([region, rows]) => ({
        region,
        parts: (['ec2', 'ebs', 'nat', 'eip'] as const).flatMap((service) => {
          const n = count(
            rows,
            (x) => x.service === service && (service !== 'ec2' || x.state === 'running'),
          )
          return n === 0 ? [] : [{ service, count: n, text: text[service]?.(n) ?? String(n) }]
        }),
      }))
      .filter((g) => g.parts.length > 0)
      .sort((a, b) => a.region.localeCompare(b.region)),
  }
}

function deniedOf(service: AwsService, denied: readonly string[]): string[] {
  const prefixes = IAM[service] ?? []
  return denied.filter((action) => prefixes.some((p) => action.startsWith(p)))
}

function groupsOf(
  all: ReadonlyMap<AwsService, Res[]>,
  found: readonly ForgottenRow[],
  changes: Changes7d,
): ResourcesView['groups'] {
  const delta = (service: AwsService) => ({
    added: changes.added.filter((x) => x.service === service).length,
    removed: changes.removed.filter((x) => x.service === service).length,
  })
  const money = (services: readonly AwsService[]) =>
    found
      .filter((f) => services.includes(f.service) && f.billed)
      .reduce((s, f) => s + (f.monthly ?? 0) + (f.notPriced ? 1e6 : 0), 0)
  return GROUPS.map((g, i) => ({ ...g, i, money: money(g.services) }))
    .sort((a, b) => b.money - a.money || a.i - b.i)
    .map((g) => ({
      group: g.group,
      tiles: g.services
        .filter((s) => (all.get(s) ?? []).length > 0)
        .map((s) => tileOf(s, all.get(s) ?? [], found, delta(s))),
    }))
    .filter((g) => g.tiles.length > 0)
}

function figures(
  all: ReadonlyMap<AwsService, Res[]>,
  list: ReturnType<typeof forgotten>,
  changes: Changes7d,
): ResourcesView['figures'] {
  const tiled = GROUPS.flatMap((g) => g.services)
  const rows = tiled.flatMap((s) => all.get(s) ?? [])
  const hourly = rows.filter((x) => x.hourly)
  const perMonth = hourly.reduce((s, x) => s + (x.monthly ?? 0), 0)
  const billed = list.rows.filter((f) => f.billed)
  const newest = changes.added[0]
  return {
    services: tiled.filter((s) => (all.get(s) ?? []).length > 0).length,
    resources: rows.length,
    regions: new Set(rows.filter((x) => x.global !== true).map((x) => x.region)).size,
    billedByHour: { perHour: perMonth / HOURS_A_MONTH, perMonth, count: hourly.length },
    forgotten: {
      billed: billed.length,
      usd: billed.reduce((s, f) => s + (f.monthly ?? 0), 0),
      notPriced: billed.filter((f) => f.notPriced).length,
      free: list.rows.length - billed.length,
      kept: list.kept.length,
    },
    added: changes.added.length,
    removed: changes.removed.length,
    newest:
      newest === undefined ? null : { service: newest.service, name: newest.name, at: newest.at },
  }
}

export interface ViewOptions {
  /** The board's refused operations (`denied`). */
  denied: readonly string[]
  /** GetMetricData's price a metric, for the ledger's ≈ $. */
  perMetricUsd: number
}

/** The board's `resources` (aws.md §14.2). */
export function resourcesView(r: AwsReadings, options: ViewOptions): ResourcesView {
  const all = allResources(r)
  const list = forgotten(r)
  const changes = changes7d(r, all)
  const tiled = GROUPS.flatMap((g) => g.services)
  const present = new Set<AwsService>([
    ...tiled.filter((s) => (all.get(s) ?? []).length > 0),
    ...elsewhereRows(r).map((x) => x.service),
  ])
  return {
    judging: r.res.judging,
    figures: figures(all, list, changes),
    forgotten: list.rows.slice(0, 20),
    forgottenTotal: list.rows.length,
    groups: groupsOf(all, list.rows, changes),
    bedrock: bedrockTile(r, all.get('bedrock') ?? [], list.rows),
    none: tiled.filter(
      (s) =>
        (all.get(s) ?? []).length === 0 &&
        readState(s, r) === 'read' &&
        deniedOf(s, options.denied).length === 0,
    ),
    pending: tiled.filter(
      (s) =>
        (all.get(s) ?? []).length === 0 &&
        readState(s, r) === 'unread' &&
        deniedOf(s, options.denied).length === 0,
    ),
    denied: tiled.flatMap((service) => {
      const actions = deniedOf(service, options.denied)
      return actions.length === 0 ? [] : [{ service, actions }]
    }),
    notOffered: (['bedrock', 'aoss'] as const).flatMap((service) => {
      const regions = notOfferedIn(service, r)
      return regions.length === 0 ? [] : [{ service, regions }]
    }),
    alsoHere: alsoHere(r, all),
    elsewhere: elsewhereView(r),
    billedNotListed: r.billingThere === true ? billedNotListed(r.billingServices, present) : [],
    kept: Object.entries(r.res.memory.keep)
      .map(([key, mark]) => ({
        key,
        service: key.split(':')[0] as AwsService,
        name: mark.name,
        at: mark.at,
        usd: mark.usd,
      }))
      .sort((a, b) => b.at - a.at),
    gmd: {
      on: r.res.gmd.on,
      cap: r.res.gmd.cap,
      used: r.res.gmd.used,
      usd: Math.round(r.res.gmd.used * options.perMetricUsd * 100) / 100,
      capReached: r.res.gmd.capReached,
    },
    quietDays: AWS_LIMITS.quietDays,
  }
}
