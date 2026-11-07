/**
 * The public status of AWS and GitHub (docs/cloud-cli.md §12): read in main while a CLI pane is
 * shown, shown only while something is open. Pure, tested on saved real answers.
 */

export type IncidentWeight = 'danger' | 'warn' | 'info'

export interface StatusIncident {
  /** Its key and the moment it opened: the same incident across readings, a new one after it closes. */
  id: string
  source: 'aws' | 'github'
  weight: IncidentWeight
  /** "Amazon EC2 · Increased API error rates", "Actions, Pages · Delayed job starts". */
  title: string
  /** AWS: the region, or null for a global service. */
  region: string | null
  /** GitHub's components (none on AWS): what COMPONENTS filters on. */
  components: string[]
  /** GitHub: investigating, identified, monitoring; AWS: the title's head (disruption…). */
  status: string
  since: number
  updatedAt: number
  /** No update for seven days: shown faintly, never toasted. */
  stale: boolean
  /** The status page main opens for it. */
  url: string
}

const DAY = 86_400_000
export const STALE_AFTER_MS = 7 * DAY

/** An item of the AWS Health Dashboard's RSS, as main's XML reading gives it. */
export interface AwsRssItem {
  title: string
  guid: string
  description: string
}

const RESOLVED = /^service is operating normally/i
const HEADS: [RegExp, IncidentWeight, string][] = [
  [/^service disruption:/i, 'danger', 'disruption'],
  [/^service impact:/i, 'warn', 'impact'],
  [/^service degradation:/i, 'warn', 'degradation'],
  [/^informational message:/i, 'info', 'informational'],
]
const REGION = /-([a-z]{2}(-gov)?-[a-z]+-\d)$/

/**
 * What is open on the AWS feed (§12.2). The key is the guid between `#` and its last `_`, the
 * time the epoch after it (each update has its own). Per key, in time order, an incident is open
 * from its first item after the last resolution, until a resolution comes - never closed by age.
 */
export function awsStatusEvents(items: readonly AwsRssItem[], now: number): StatusIncident[] {
  const byKey = new Map<string, { at: number; item: AwsRssItem }[]>()
  for (const item of items) {
    const match = /#(.+)_(\d{9,11})$/.exec(item.guid)
    if (match === null) continue
    const [, key, epoch] = match as unknown as [string, string, string]
    const list = byKey.get(key) ?? []
    list.push({ at: Number(epoch) * 1000, item })
    byKey.set(key, list)
  }
  const open: StatusIncident[] = []
  for (const [key, list] of byKey) {
    list.sort((a, b) => a.at - b.at)
    const lastResolved = list.findLastIndex((entry) => RESOLVED.test(entry.item.title))
    const since = list.slice(lastResolved + 1)
    const first = since[0]
    const last = since.at(-1)
    if (first === undefined || last === undefined) continue
    const head = HEADS.find(([pattern]) => pattern.test(last.item.title))
    const title = last.item.title.replace(/^[^:]{0,40}:\s*/, '').trim()
    open.push({
      id: `aws:${key}:${first.at}`,
      source: 'aws',
      weight: head?.[1] ?? 'info',
      title: title === '' ? key : title,
      region: REGION.exec(key)?.[1] ?? null,
      components: [],
      status: head?.[2] ?? 'informational',
      since: first.at,
      updatedAt: last.at,
      stale: now - last.at > STALE_AFTER_MS,
      url: 'https://health.aws.amazon.com/health/status',
    })
  }
  return open.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Statuspage's unresolved incidents and active maintenances, as main reads them (§12.3). */
export interface GithubStatusAnswer {
  incidents: {
    id: string
    name: string
    impact: string
    status: string
    created_at: string
    updated_at: string
    components?: { name: string }[] | undefined
  }[]
}

const GITHUB_WEIGHT: Record<string, IncidentWeight> = {
  critical: 'danger',
  major: 'danger',
  minor: 'warn',
  none: 'info',
}

export function githubIncidents(
  answer: GithubStatusAnswer,
  maintenance: GithubStatusAnswer | null,
  now: number,
): StatusIncident[] {
  const one = (
    incident: GithubStatusAnswer['incidents'][number],
    planned: boolean,
  ): StatusIncident | null => {
    if (!/^[a-z0-9]{6,20}$/.test(incident.id)) return null
    const updated = Date.parse(incident.updated_at)
    const components = (incident.components ?? []).map((c) => c.name)
    return {
      id: `github:${incident.id}`,
      source: 'github',
      weight: planned ? 'info' : (GITHUB_WEIGHT[incident.impact] ?? 'warn'),
      title:
        components.length > 0
          ? `${components.slice(0, 3).join(', ')} · ${incident.name}`
          : incident.name,
      region: null,
      components,
      status: planned ? 'maintenance' : incident.status,
      since: Date.parse(incident.created_at) || now,
      updatedAt: Number.isFinite(updated) ? updated : now,
      stale: Number.isFinite(updated) && now - updated > STALE_AFTER_MS,
      url: `https://www.githubstatus.com/incidents/${incident.id}`,
    }
  }
  return [
    ...answer.incidents.map((incident) => one(incident, false)),
    ...(maintenance?.incidents ?? []).map((incident) => one(incident, true)),
  ]
    .filter((incident): incident is StatusIncident => incident !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/** An AWS pane shows its regions' incidents and the global ones. */
export function incidentsFor(
  incidents: readonly StatusIncident[],
  regions: readonly string[] | null,
): StatusIncident[] {
  return incidents.filter(
    (incident) => regions === null || incident.region === null || regions.includes(incident.region),
  )
}

const RANK: Record<IncidentWeight, number> = { info: 0, warn: 1, danger: 2 }

/**
 * GitHub's COMPONENTS filter (§12.3): an incident of skipped components only is left out; one
 * that names no component cannot be filtered, so it always passes.
 */
export const passesComponents = (incident: StatusIncident, skip: readonly string[]): boolean =>
  incident.components.length === 0 || incident.components.some((c) => !skip.includes(c))

/** Whether a toast is due: new, or heavier than when it was toasted; never a stale one. */
export function toastDue(
  incident: StatusIncident,
  toasted: Readonly<Record<string, IncidentWeight>>,
  minWeight: IncidentWeight,
): boolean {
  if (incident.stale || RANK[incident.weight] < RANK[minWeight]) return false
  const before = toasted[incident.id]
  return before === undefined || RANK[incident.weight] > RANK[before]
}
