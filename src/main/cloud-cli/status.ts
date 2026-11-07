import {
  type AwsRssItem,
  awsStatusEvents,
  type GithubStatusAnswer,
  githubIncidents,
  type StatusIncident,
} from '@shared/cloud-cli/status'
import { z } from 'zod'

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

import { BoundaryTimer, type TimerDeps } from '../boundary-timer.js'

/**
 * The public status of AWS and GitHub (docs/cloud-cli.md §12), fetched in main while a pane of
 * its source is shown and only then: every five minutes on the grid, the last good answer kept
 * through a failure, 5, 10 … 30 minutes between tries after one. No CLI, no sign-in. The URLs
 * can be pointed at a stand-in (ELECDEX_AWS_STATUS_URL, ELECDEX_GITHUB_STATUS_URL).
 */

export type StatusSource = 'aws' | 'github'

export const STATUS_URLS = {
  aws: process.env.ELECDEX_AWS_STATUS_URL ?? 'https://status.aws.amazon.com/rss/all.rss',
  github:
    process.env.ELECDEX_GITHUB_STATUS_URL ??
    'https://www.githubstatus.com/api/v2/incidents/unresolved.json',
}
/** GitHub's planned maintenance, beside its incidents. */
const maintenanceUrl = (incidents: string) =>
  incidents.replace(/incidents\/unresolved\.json$/, 'scheduled-maintenances/active.json')

const PERIOD = 5 * 60_000
const MAX_BYTES = 512 * 1024

export interface StatusDeps extends TimerDeps {
  fetchText(url: string): Promise<{ status: number; text: string }>
  changed(source: StatusSource, incidents: StatusIncident[], first: boolean): void
}

const GithubSchema = z.object({
  incidents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      impact: z.string(),
      status: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      components: z.array(z.object({ name: z.string() })).optional(),
    }),
  ),
})
const MaintenanceSchema = z.object({ scheduled_maintenances: GithubSchema.shape.incidents })

/** The AWS feed's items: title, guid and description only. Main has no DOMParser. */
export async function rssItems(xml: string): Promise<AwsRssItem[]> {
  const { XMLParser } = await import('fast-xml-parser')
  const { plainText } = await import('../feeds/parse.js')
  const doc = new XMLParser({
    processEntities: false,
    parseTagValue: false,
    ignoreAttributes: true,
  }).parse(xml) as { rss?: { channel?: { item?: unknown } } }
  const raw = doc.rss?.channel?.item
  const items = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]
  return items.map((item) => {
    const node = item as Record<string, unknown>
    return {
      title: plainText(node.title),
      guid: plainText(node.guid),
      description: plainText(node.description),
    }
  })
}

export class StatusWatch {
  readonly #deps: StatusDeps
  readonly #timers = new Map<StatusSource, BoundaryTimer>()
  readonly #incidents: Record<StatusSource, StatusIncident[]> = { aws: [], github: [] }
  readonly #failures: Record<StatusSource, number> = { aws: 0, github: 0 }
  readonly #triedAt: Record<StatusSource, number> = { aws: 0, github: 0 }
  readonly #read: Record<StatusSource, number | null> = { aws: null, github: null }

  constructor(deps: StatusDeps) {
    this.#deps = deps
  }

  incidents(source: StatusSource): StatusIncident[] {
    return this.#incidents[source]
  }

  watching(): string[] {
    return [...this.#timers.keys()].map((source) => `status:${source}`).sort()
  }

  /** Starts (or stops) a source as its panes come and go. */
  set(source: StatusSource, shown: boolean): void {
    const timer = this.#timers.get(source)
    if (shown && timer === undefined) {
      const next = new BoundaryTimer(this.#deps, PERIOD, () => void this.#read1(source))
      this.#timers.set(source, next)
      next.start()
      const last = this.#read[source]
      if (last === null || this.#deps.now() - last >= PERIOD) void this.#read1(source)
    } else if (!shown && timer !== undefined) {
      timer.stop()
      this.#timers.delete(source)
    }
  }

  dispose(): void {
    for (const timer of this.#timers.values()) timer.stop()
    this.#timers.clear()
  }

  async #read1(source: StatusSource): Promise<void> {
    const now = this.#deps.now()
    const wait = Math.min(30, 5 * 2 ** Math.max(0, this.#failures[source] - 1)) * 60_000
    if (this.#failures[source] > 0 && now - this.#triedAt[source] < wait) return
    this.#triedAt[source] = now
    try {
      const incidents = source === 'aws' ? await this.#aws(now) : await this.#github(now)
      const first = this.#read[source] === null
      this.#failures[source] = 0
      this.#read[source] = now
      this.#incidents[source] = incidents
      if (this.#timers.has(source)) this.#deps.changed(source, incidents, first)
    } catch {
      this.#failures[source] += 1
    }
  }

  async #aws(now: number): Promise<StatusIncident[]> {
    const answer = await this.#deps.fetchText(STATUS_URLS.aws)
    if (answer.status !== 200 || answer.text.length > MAX_BYTES)
      throw new Error(`HTTP ${answer.status}`)
    return awsStatusEvents(await rssItems(answer.text), now)
  }

  async #github(now: number): Promise<StatusIncident[]> {
    const answer = await this.#deps.fetchText(STATUS_URLS.github)
    if (answer.status !== 200 || answer.text.length > MAX_BYTES)
      throw new Error(`HTTP ${answer.status}`)
    const incidents = GithubSchema.parse(JSON.parse(answer.text)) as GithubStatusAnswer
    const planned = await this.#deps.fetchText(maintenanceUrl(STATUS_URLS.github)).catch(() => null)
    // The maintenance list is extra: an answer that is not JSON leaves it out, not the incidents.
    const maintenance =
      planned?.status === 200 ? MaintenanceSchema.safeParse(safeJson(planned.text)) : null
    return githubIncidents(
      incidents,
      maintenance?.success ? { incidents: maintenance.data.scheduled_maintenances } : null,
      now,
    )
  }
}
