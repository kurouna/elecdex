import type { AwsBoardSpec, AwsService } from './types.js'

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

export type AwsTab = 'attention' | 'active' | 'cost' | 'activity' | 'account'

/** Where a pane has drilled to (aws.md §5.1): a service, its filters and sort, one item. */
export interface DrillPlace {
  service: AwsService
  filters: Record<string, string>
  sort: { column: string; down: boolean } | null
  item: string | null
}

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
]
export const isAwsService = (raw: unknown): raw is AwsService =>
  typeof raw === 'string' && (SERVICES as readonly string[]).includes(raw)

function readDrill(raw: unknown): DrillPlace | null {
  if (typeof raw !== 'object' || raw === null) return null
  const d = raw as Record<string, unknown>
  if (!isAwsService(d.service)) return null
  const filters: Record<string, string> = {}
  if (typeof d.filters === 'object' && d.filters !== null)
    for (const [k, v] of Object.entries(d.filters))
      if (typeof v === 'string' && k.length < 40 && v.length < 200) filters[k] = v
  const sort =
    typeof d.sort === 'object' &&
    d.sort !== null &&
    typeof (d.sort as { column?: unknown }).column === 'string'
      ? {
          column: (d.sort as { column: string }).column,
          down: (d.sort as { down?: unknown }).down === true,
        }
      : null
  return {
    service: d.service,
    filters,
    sort,
    item: typeof d.item === 'string' && d.item.length < 300 ? d.item : null,
  }
}

const TABS: readonly AwsTab[] = ['attention', 'active', 'cost', 'activity', 'account']

/** The pane's choices, read from its state with defaults. */
export function readAwsPane(state: Record<string, unknown> | undefined): {
  spec: AwsBoardSpec
  tab: AwsTab
  region: string | null
  mask: boolean
  pulse: boolean
  drill: DrillPlace | null
  /** Where the drill-down was entered from (ACTIVE or COST), for its crumbs. */
  from: 'active' | 'cost' | 'attention'
} {
  const s = state ?? {}
  const regions = Array.isArray(s.regions)
    ? [...new Set(s.regions.map(regionName).filter((r): r is string => r !== null))].slice(
        0,
        MAX_REGIONS,
      )
    : []
  const tab = TABS.includes(s.tab as AwsTab) ? (s.tab as AwsTab) : 'attention'
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
    drill: readDrill(s.drill),
    from: s.from === 'cost' || s.from === 'attention' ? s.from : 'active',
  }
}
