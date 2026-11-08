import type { AwsBoardSpec, AwsList, AwsService } from './types.js'

/**
 * An AWS STATUS board's key: what a pane subscribes to and the only thing it sends. Main reads
 * it back with `parseAwsBoardKey`, which takes only the canonical form: a profile name of the
 * characters AWS CLI allows in one, regions of the region form, and two flags. A key cannot name
 * a file, a URL, an endpoint or an argument.
 */

export const MAX_REGIONS = 4

const PROFILE = /^[A-Za-z0-9_.@+-]{1,64}$/
const REGION = /^[a-z]{2}(-gov)?-[a-z]+-\d{1,2}$/

export const profileName = (raw: unknown): string | null =>
  typeof raw === 'string' && PROFILE.test(raw) && !raw.startsWith('-') ? raw : null

export const regionName = (raw: unknown): string | null =>
  typeof raw === 'string' && REGION.test(raw) ? raw : null

export function awsBoardKey(spec: AwsBoardSpec): string {
  const regions = [
    ...new Set(spec.regions.map(regionName).filter((r): r is string => r !== null)),
  ].slice(0, MAX_REGIONS)
  return JSON.stringify({
    profile: profileName(spec.profile) ?? 'default',
    regions,
    activity: spec.activity,
    slow: spec.slow,
  })
}

export function parseAwsBoardKey(raw: unknown): AwsBoardSpec | null {
  if (typeof raw !== 'string' || raw.length > 600) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const { profile, regions, activity, slow } = value as Record<string, unknown>
  const name = profileName(profile)
  if (name === null || typeof activity !== 'boolean' || typeof slow !== 'boolean') return null
  if (!Array.isArray(regions) || regions.length > MAX_REGIONS) return null
  if (regions.some((region) => regionName(region) === null)) return null
  const spec: AwsBoardSpec = { profile: name, regions: regions as string[], activity, slow }
  return awsBoardKey(spec) === raw ? spec : null
}

/** RESOURCES first: the tab a pane opens on when its state names none (aws.md §14.0). */
export type AwsTab = 'resources' | 'attention' | 'active' | 'cost' | 'activity' | 'account'

/**
 * Where a pane has drilled to (aws.md §5.1): a service or one of RESOURCES' lists across
 * services, its filters and sort, one item. A list's item carries its service before the id
 * (`ec2:i-0abc`, see `itemOf`), so the list stays the step above it. `direct` marks an item
 * opened from RESOURCES' first step (a LOOKS FORGOTTEN row): Back goes straight there.
 */
export interface DrillPlace {
  service: AwsService | AwsList
  filters: Record<string, string>
  sort: { column: string; down: boolean } | null
  item: string | null
  direct?: true
}

/** Where a drill-down was entered from: a tab, for its crumbs and for Back. */
export type DrillFrom = 'resources' | 'active' | 'cost' | 'attention'

const SERVICES: readonly AwsService[] = [
  'ec2',
  'ebs',
  'eip',
  's3',
  'nat',
  'elb',
  'rds',
  'eks',
  'lambda',
  'stacks',
  'acm',
  'alarms',
  'ecs',
  'dynamodb',
  'sqs',
  'sns',
  'apigw',
  'cloudfront',
  'bedrock',
  'aoss',
  'logs',
  'vpce',
  'tgw',
  'vpn',
  'sagemaker',
  'snapshots',
  'amis',
  'ecr',
  'elasticache',
  'opensearch',
  'redshift',
  'kinesis',
  'transfer',
  'kms',
  'route53',
  'vpc',
]
export const isAwsService = (raw: unknown): raw is AwsService =>
  typeof raw === 'string' && (SERVICES as readonly string[]).includes(raw)

/** As drill-resources.ts's `isAwsList`: kept here too, since what that file imports imports this. */
const isList = (raw: unknown): raw is AwsList =>
  raw === 'forgotten' || raw === 'new' || raw === 'elsewhere'

/** A list item's place: its service, then its id (`itemOf` reads it back). */
export const listItem = (service: AwsService, id: string): string => `${service}:${id}`

/** The resource a place's item is: a service's own, or a list's with its service in front. */
export function itemOf(place: DrillPlace): { service: AwsService; id: string } | null {
  if (place.item === null) return null
  if (isAwsService(place.service)) return { service: place.service, id: place.item }
  const at = place.item.indexOf(':')
  const service = place.item.slice(0, at)
  return at > 0 && isAwsService(service) ? { service, id: place.item.slice(at + 1) } : null
}

function readFilters(raw: unknown): Record<string, string> {
  const filters: Record<string, string> = {}
  if (typeof raw === 'object' && raw !== null)
    for (const [k, v] of Object.entries(raw))
      if (typeof v === 'string' && k.length < 40 && v.length < 200) filters[k] = v
  return filters
}

function readDrill(raw: unknown): DrillPlace | null {
  if (typeof raw !== 'object' || raw === null) return null
  const d = raw as Record<string, unknown>
  if (!isAwsService(d.service) && !isList(d.service)) return null
  const filters = readFilters(d.filters)
  const sort =
    typeof d.sort === 'object' &&
    d.sort !== null &&
    typeof (d.sort as { column?: unknown }).column === 'string'
      ? {
          column: (d.sort as { column: string }).column,
          down: (d.sort as { down?: unknown }).down === true,
        }
      : null
  const item = typeof d.item === 'string' && d.item.length < 300 ? d.item : null
  return {
    service: d.service,
    filters,
    sort,
    item,
    ...(d.direct === true && item !== null ? { direct: true as const } : {}),
  }
}

/** How RESOURCES shows the services: `in use / all` cards, or the tiles with their state lines. */
export type ResourcesViewChoice = 'cards' | 'detail'

const TABS: readonly AwsTab[] = ['resources', 'attention', 'active', 'cost', 'activity', 'account']
const FROM: readonly DrillFrom[] = ['resources', 'cost', 'attention']

/** The pane's choices, read from its state with defaults. */
export function readAwsPane(state: Record<string, unknown> | undefined): {
  spec: AwsBoardSpec
  tab: AwsTab
  region: string | null
  mask: boolean
  pulse: boolean
  /** RESOURCES' services as cards (the default) or as the detailed tiles (aws.md §14.12). */
  resView: ResourcesViewChoice
  drill: DrillPlace | null
  /** Where the drill-down was entered from, for its crumbs. */
  from: DrillFrom
} {
  const s = state ?? {}
  const regions = Array.isArray(s.regions)
    ? [...new Set(s.regions.map(regionName).filter((r): r is string => r !== null))].slice(
        0,
        MAX_REGIONS,
      )
    : []
  // No tab in the state is RESOURCES. The other tabs were saved by name and stay; ATTENTION, the
  // default before RESOURCES, was saved as none and opens on RESOURCES now (aws.md §14.0).
  const tab = TABS.includes(s.tab as AwsTab) ? (s.tab as AwsTab) : 'resources'
  const region = regionName(s.region)
  return {
    spec: {
      profile: profileName(s.profile) ?? 'default',
      regions,
      activity: s.activity !== false,
      slow: s.slow === true,
    },
    tab,
    region: region !== null && (regions.length === 0 || regions.includes(region)) ? region : null,
    mask: s.mask === true,
    pulse: s.pulse !== false,
    // CARDS, the default, is kept as nothing; only DETAIL is stored.
    resView: s.resView === 'detail' ? 'detail' : 'cards',
    drill: readDrill(s.drill),
    from: FROM.includes(s.from as DrillFrom) ? (s.from as DrillFrom) : 'active',
  }
}
