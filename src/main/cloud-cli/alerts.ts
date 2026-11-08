import {
  type IncidentWeight,
  passesComponents,
  type StatusIncident,
  toastDue,
} from '@shared/cloud-cli/status'
import { z } from 'zod'
import type { CloudAlert } from '../aws/service.js'
import type { StatusSource } from './status.js'

/**
 * The CLI panes' toasts (docs/cloud-cli.md §12.5, aws.md §5.6): public incidents and the cost
 * QUOTA. Said once each, kept in `cloud-alerts.json` (30 days) so a restart does not say a
 * running incident again. The page's toast while elecdex is in front, else the system's
 * notification when asked for - which never names the account, whatever MASK is: the
 * notification centre keeps it where MASK cannot reach.
 */

export const AlertFileSchema = z.object({
  said: z.record(
    z.string(),
    z.object({ weight: z.enum(['info', 'warn', 'danger']), at: z.number() }),
  ),
  /** A source read once already: what was open at the very first reading stays a band. */
  seeded: z.object({ aws: z.boolean().optional(), github: z.boolean().optional() }),
  lastAt: z.object({ aws: z.number().optional(), github: z.number().optional() }),
})
export type AlertFile = z.infer<typeof AlertFileSchema>

const KEEP_MS = 30 * 86_400_000
/** Toasts of one source at most once in this long, the rest gathered into it. */
const GATHER_MS = 15 * 60_000

export interface IncidentChoice {
  notify: boolean
  system: boolean
  minSeverity: IncidentWeight
  skip?: string[]
}

export interface AlertDeps {
  load(): AlertFile
  save(file: AlertFile): void
  now(): number
  inFront(): boolean
  choice(source: StatusSource): IncidentChoice
  /** The page's toast. */
  toPage(alert: CloudAlert): void
  /** The system's notification; clicking it brings the window up. */
  toSystem(title: string, body: string): void
}

const NAME: Record<StatusSource, string> = { aws: 'AWS', github: 'GitHub' }

export class CloudAlerts {
  readonly #deps: AlertDeps
  #file: AlertFile | null = null
  /** The URLs of what the toasts showed, for OPEN STATUS. */
  readonly #urls = new Map<string, string>()

  constructor(deps: AlertDeps) {
    this.#deps = deps
  }

  urlOf(alertId: string): string | null {
    return this.#urls.get(alertId) ?? null
  }

  #load(): AlertFile {
    if (this.#file === null) {
      const file = this.#deps.load()
      const cut = this.#deps.now() - KEEP_MS
      file.said = Object.fromEntries(Object.entries(file.said).filter(([, v]) => v.at >= cut))
      this.#file = file
    }
    return this.#file
  }

  /** A source's incidents as just read: toast the new or heavier ones, gathered (§12.5). */
  incidents(
    source: StatusSource,
    incidents: readonly StatusIncident[],
    regions: readonly string[] | null,
  ): void {
    const file = this.#load()
    const now = this.#deps.now()
    const choice = this.#deps.choice(source)
    const shown = incidents.filter(
      (i) =>
        (regions === null || i.region === null || regions.includes(i.region)) &&
        passesComponents(i, choice.skip ?? []),
    )
    const said = Object.fromEntries(Object.entries(file.said).map(([id, v]) => [id, v.weight]))
    if (!file.seeded[source]) {
      // The very first reading: what is already open stays a band (no toast of an old incident).
      for (const incident of shown) file.said[incident.id] = { weight: incident.weight, at: now }
      file.seeded[source] = true
      this.#deps.save(file)
      return
    }
    const due = shown.filter((incident) => toastDue(incident, said, choice.minSeverity))
    if (due.length === 0) return
    if (!choice.notify) {
      // Toasts off: what came meanwhile counts as said, or turning them on later toasted it then,
      // however old - the band showed it all along.
      for (const incident of due) file.said[incident.id] = { weight: incident.weight, at: now }
      this.#deps.save(file)
      return
    }
    if (now - (file.lastAt[source] ?? 0) < GATHER_MS) return
    for (const incident of due) file.said[incident.id] = { weight: incident.weight, at: now }
    file.lastAt[source] = now
    this.#deps.save(file)
    const top = due.reduce((a, b) => (b.weight === 'danger' && a.weight !== 'danger' ? b : a))
    const title =
      due.length > 1
        ? `${due.length} ${NAME[source]} incidents`
        : `${NAME[source]} incident${top.region ? ` · ${top.region}` : ''}`
    const id = `incident:${top.id}`
    this.#urls.set(id, top.url)
    this.#send(
      {
        id,
        title,
        body: top.title,
        maskedBody: top.title,
        tone: top.weight === 'danger' ? 'danger' : 'warn',
        action: { kind: 'status', url: top.url },
      },
      choice.system,
    )
  }

  /** A QUOTA step (main's billing store already decided it is new this month). */
  quota(alert: CloudAlert): void {
    const file = this.#load()
    if (file.said[alert.id] !== undefined) return
    file.said[alert.id] = { weight: alert.tone, at: this.#deps.now() }
    this.#deps.save(file)
    this.#send(alert, this.#deps.choice('aws').system)
  }

  #send(alert: CloudAlert, system: boolean): void {
    if (this.#deps.inFront()) this.#deps.toPage(alert)
    else if (system) this.#deps.toSystem(alert.title, alert.maskedBody)
    else this.#deps.toPage(alert)
  }
}
