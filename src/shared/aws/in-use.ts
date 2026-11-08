import { AWS_LIMITS } from './facts.js'
import { type Res, resKey } from './resources.js'
import type { AwsService, ForgottenRow, ServiceUse } from './types.js'

/**
 * CARDS (aws.md §14.12): each service as "in use / all". In use is what is neither stopped nor
 * judged forgotten or quiet - LOOKS FORGOTTEN's own rows, so a card never disagrees with the list
 * - counted over the pane's regions only: what the weekly sweep found elsewhere stays in the
 * ELSEWHERE line. Pure; main sends it on each tile, and the page only words it.
 */

/** The services that get a tile (ALSO_HERE's go in one line under them). */
type TiledService = Exclude<AwsService, 'vpc' | 'acm' | 'stacks' | 'alarms'>

const days = AWS_LIMITS.quietDays

/** What "in use" means for each kind, in one grammar: `<noun> <predicate>`. */
export const IN_USE_WORD: Record<TiledService, string> = {
  ec2: 'instances running, not idle',
  ecs: 'services and clusters in use',
  eks: 'clusters with nodes',
  lambda: `functions invoked in ${days} d`,
  s3: 'buckets not empty, not stale',
  ebs: 'volumes attached',
  snapshots: 'snapshots of a volume or image',
  amis: 'images launched lately',
  ecr: 'repositories pulled lately',
  rds: 'databases available, connected',
  dynamodb: 'tables with requests',
  elasticache: 'caches available, connected',
  opensearch: 'domains searched',
  redshift: 'clusters, workgroups connected',
  nat: 'gateways with traffic',
  elb: 'balancers with targets',
  eip: 'addresses attached',
  vpce: 'endpoints with traffic',
  tgw: 'attachments with traffic',
  vpn: 'connections up',
  bedrock: `placed, used in ${days} d`,
  aoss: 'collections searched',
  sagemaker: 'endpoints, notebooks, apps used',
  cloudfront: 'distributions with requests',
  apigw: 'APIs with requests',
  sqs: 'queues with messages',
  sns: 'topics with subscribers',
  kinesis: 'streams with records',
  transfer: 'servers with transfers',
  kms: 'customer keys enabled',
  route53: 'hosted zones with records',
  logs: 'log groups receiving',
}

export const inUseWord = (service: AwsService): string =>
  (IN_USE_WORD as Partial<Record<AwsService, string>>)[service] ?? 'in use'

/**
 * Off by its own state: not running, available, online or desired. Such a resource bills little
 * or nothing, so the predicates mostly leave it unjudged; it is "stopped" unless they judged it.
 */
const OFF: Partial<Record<AwsService, (x: Res) => boolean>> = {
  ec2: (x) => x.state !== 'running',
  rds: (x) => x.state !== 'available',
  ecs: (x) => x.cells.kind === 'service' && x.cells.desired === 0,
  nat: (x) => x.state !== 'available' && x.state !== 'pending',
  elb: (x) => x.state !== null && x.state !== 'active',
  vpce: (x) => x.state !== 'available',
  tgw: (x) => x.state !== 'available',
  vpn: (x) => x.state !== 'available',
  sagemaker: (x) => x.state !== 'InService',
  elasticache: (x) => x.state !== 'available',
  redshift: (x) => x.cells.kind === 'cluster' && x.state !== 'available',
  kinesis: (x) => x.state !== 'ACTIVE' && x.state !== 'UPDATING',
  transfer: (x) => x.state !== 'ONLINE',
  cloudfront: (x) => x.state === 'disabled',
  kms: (x) => x.state === 'Disabled' || x.state === 'PendingDeletion',
  bedrock: (x) => x.cells.kind === 'pt' && x.state !== 'InService',
}

type Part = 'inUse' | 'forgotten' | 'stopped' | 'quiet' | 'kept'

/**
 * Which part one resource is in: judged first (LOOKS FORGOTTEN's row decides), then its own
 * state, then KEEP - a kept one is off the list but not in use either.
 */
function partOf(f: ForgottenRow | undefined, off: boolean, isKept: boolean): Part {
  if (f !== undefined) return f.billed ? 'forgotten' : 'quiet'
  if (off) return 'stopped'
  return isKept ? 'kept' : 'inUse'
}

/**
 * One service's count. `found` is LOOKS FORGOTTEN's rows and `kept` the ones marked KEEP; a
 * resource is matched by its key, so a row of another region (ELSEWHERE) never counts here.
 */
export function serviceUse(
  service: AwsService,
  rows: readonly Res[],
  found: readonly ForgottenRow[],
  kept: readonly ForgottenRow[],
): ServiceUse {
  const judged = new Map(found.map((f) => [f.key, f]))
  const keptKeys = new Set(kept.map((f) => f.key))
  const off = OFF[service] ?? (() => false)
  const byRegion = new Map<string, number>()
  const n: Record<Part, number> = { inUse: 0, forgotten: 0, stopped: 0, quiet: 0, kept: 0 }
  let usd = 0
  let notPriced = false
  for (const x of rows) {
    byRegion.set(x.region, (byRegion.get(x.region) ?? 0) + 1)
    const key = resKey(x)
    const f = judged.get(key)
    const part = partOf(f, off(x), keptKeys.has(key))
    n[part]++
    if (part === 'forgotten') {
      usd += f?.monthly ?? 0
      notPriced ||= f?.notPriced === true
    }
  }
  return {
    total: rows.length,
    ...n,
    inUseWord: inUseWord(service),
    usd,
    notPriced,
    frame:
      usd >= AWS_LIMITS.forgottenDangerUsd
        ? 'danger'
        : usd >= AWS_LIMITS.tileWarnUsd || notPriced
          ? 'warn'
          : null,
    regions: [...byRegion.entries()]
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => a.region.localeCompare(b.region)),
  }
}
