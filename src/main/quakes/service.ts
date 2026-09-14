import {
  parseQuakeList,
  QUAKE_INTERVAL_MS,
  type Quake,
  type QuakeAlert,
  type QuakeAlertRule,
  type QuakeSource,
  type QuakeState,
  quakesToAlert,
} from '@shared/quakes'
import { parseUsgsFeed, USGS_FEED_PATH } from '@shared/quakes-usgs'
import {
  latestJmaTsunamiReport,
  parseJmaTsunamiReport,
  parseNoaaTsunamiFeed,
  strongestTsunami,
  type Tsunami,
  tsunamiAlertKey,
  tsunamiCurrent,
  tsunamiNeedsAlert,
} from '@shared/tsunami'

/**
 * Keeps the earthquake list and any tsunami in effect current while something
 * needs them, and decides what to announce.
 *
 *  - Active only while alerts are on or a quakes pane is open; off, it holds no
 *    timer and makes no request.
 *  - Once a minute (the services' max-age) it asks the chosen source for its
 *    earthquake list and its tsunami information: JMA's two lists for Japan, the
 *    USGS feed and NOAA's two tsunami centres for the world. Every request is
 *    conditional, so with nothing new each answer is a 304 with no body and
 *    nothing is parsed or sent. A JMA tsunami report's details are fetched only
 *    when a new report appears.
 *  - A failed earthquake list keeps the last one and retries with backoff; a
 *    failed tsunami check keeps the last tsunami state and is tried again on the
 *    next tick.
 *  - An earthquake is announced once, only while recent; a tsunami once per event
 *    and level, so a raised level is announced again. The keys are kept on disk.
 *
 * Electron-free: the network, clock, timers and storage are injected.
 */

export interface HttpResponse {
  status: number
  headers: { get(name: string): string | null }
  text(): Promise<string>
}

export interface QuakeDeps {
  fetch(url: string, init: { headers: Record<string, string> }): Promise<HttpResponse>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  /** Bases of the services, overridable so tests never touch the real sites. */
  urls: { jma: string; usgs: string; noaa: string }
  userAgent: string
  loadAlerted(): string[]
  saveAlerted(ids: string[]): void
  /** The state changed: list, tsunami, source, activity or error. */
  publish(state: QuakeState): void
  /** What to announce. */
  alert(alert: QuakeAlert): void
}

export interface QuakeConfig {
  active: boolean
  source: QuakeSource
  /** Earthquake alerts, or null when alerts are off. */
  rule: QuakeAlertRule | null
  /** Tsunami alerts, while alerts are on. */
  tsunami: boolean
}

/** Delays after consecutive failures, capped at the last. */
export const RETRY_BACKOFF_MS = [60_000, 2 * 60_000, 5 * 60_000, 10 * 60_000]
/** Announced keys remembered: far more than an alert window can hold. */
export const ALERTED_KEPT = 200
/** Announcements of this run kept for pages that open later. */
export const ANNOUNCED_KEPT = 10
/** NOAA's centres: Pacific (Honolulu) and National (Palmer, for North America). */
export const NOAA_FEEDS = ['PHEBAtom.xml', 'PAAQAtom.xml'] as const

export class QuakeService {
  private readonly deps: QuakeDeps
  private config: QuakeConfig = { active: false, source: 'jma', rule: null, tsunami: false }
  private quakes: Quake[] = []
  private tsunami: Tsunami | null = null
  private fetchedAt: number | null = null
  private error: string | null = null
  private failures = 0
  private timer: unknown = null
  private inFlight = false
  /**
   * Bumped whenever the source starts over. A check that began before cannot
   * apply what it read: after a quick switch away and back it would even have
   * asked conditionally, and its 304 would leave the fresh start empty.
   */
  private generation = 0
  /** Validators per URL, for conditional requests. */
  private readonly validators = new Map<
    string,
    { etag: string | null; lastModified: string | null }
  >()
  /** Per tsunami feed: JMA's latest report file and its reading, or a NOAA centre's bulletin. */
  private readonly tsunamiFeeds = new Map<
    string,
    { report: string | null; tsunami: Tsunami | null }
  >()
  /** Read from disk when first needed, so an app with alerts off never touches the file. */
  private alertedKeys: Set<string> | null = null
  /** Announced in this run, newest first; a page that opens later shows the recent ones. */
  private announced: string[] = []

  constructor(deps: QuakeDeps) {
    this.deps = deps
  }

  state(): QuakeState {
    return {
      active: this.config.active,
      source: this.config.source,
      quakes: this.quakes,
      tsunami: this.tsunami,
      fetchedAt: this.fetchedAt,
      error: this.error,
      announced: this.announced,
    }
  }

  /**
   * Applies settings and activity. A new source starts from nothing; turning alerts
   * on (or lowering them) with a list at hand announces what now qualifies at once.
   */
  configure(next: QuakeConfig): void {
    const previous = this.config
    this.config = next
    const switched = next.source !== previous.source
    if (switched) this.reset()
    if (next.active && (!previous.active || switched)) {
      this.failures = 0
      this.check()
    } else if (!next.active && previous.active) {
      this.cancel()
    }
    if (switched || next.active !== previous.active) this.deps.publish(this.state())
    if (next.active && this.fetchedAt !== null) this.announce(this.deps.now())
  }

  dispose(): void {
    this.cancel()
    this.config = { ...this.config, active: false }
  }

  private get alerted(): Set<string> {
    this.alertedKeys ??= new Set(this.deps.loadAlerted().slice(-ALERTED_KEPT))
    return this.alertedKeys
  }

  private reset(): void {
    this.generation += 1
    this.quakes = []
    this.tsunami = null
    this.fetchedAt = null
    this.error = null
    this.tsunamiFeeds.clear()
  }

  private cancel(): void {
    if (this.timer !== null) this.deps.clearTimer(this.timer)
    this.timer = null
  }

  private schedule(delayMs: number): void {
    this.cancel()
    if (!this.config.active) return
    this.timer = this.deps.setTimer(() => {
      this.timer = null
      this.check()
    }, delayMs)
  }

  private check(): void {
    if (this.inFlight || !this.config.active) return
    this.inFlight = true
    const source = this.config.source
    const generation = this.generation
    void this.poll(source, generation)
      .then(
        () => {
          this.failures = 0
          this.schedule(QUAKE_INTERVAL_MS)
        },
        (cause: unknown) => {
          const delay =
            RETRY_BACKOFF_MS[Math.min(this.failures, RETRY_BACKOFF_MS.length - 1)] ?? 60_000
          this.failures += 1
          const error = cause instanceof Error ? cause.message : String(cause)
          if (this.current(source, generation) && error !== this.error) {
            this.error = error
            this.deps.publish(this.state())
          }
          this.schedule(delay)
        },
      )
      .finally(() => {
        this.inFlight = false
        // The source started over while this ran: the new start should not wait a minute.
        if (this.config.active && this.generation !== generation) this.check()
      })
  }

  /** Whether a check still matters: active, and the source not started over since it began. */
  private current(source: QuakeSource, generation: number): boolean {
    return this.config.active && this.config.source === source && this.generation === generation
  }

  private async poll(source: QuakeSource, generation: number): Promise<void> {
    const now = this.deps.now()
    // Conditional only once this source has data: after a switch it starts over.
    const list = await this.get(this.quakeUrl(source), this.fetchedAt !== null)
    const tsunamiChanged = await this.pollTsunami(source, generation, now)
    if (!this.current(source, generation)) return
    let changed = tsunamiChanged
    if (list !== null) {
      const body: unknown = JSON.parse(list)
      this.quakes = source === 'jma' ? parseQuakeList(body) : parseUsgsFeed(body)
      this.fetchedAt = now
      changed = true
    }
    if (this.error !== null) {
      this.error = null
      changed = true
    }
    if (!changed) return
    this.announce(now, false)
    this.deps.publish(this.state())
  }

  private quakeUrl(source: QuakeSource): string {
    return source === 'jma'
      ? `${this.deps.urls.jma}/quake/data/list.json`
      : `${this.deps.urls.usgs}${USGS_FEED_PATH}`
  }

  /**
   * Checks the source's tsunami information; returns whether the tsunami in effect
   * changed. A failure keeps what was known, and the earthquakes are still shown.
   */
  private async pollTsunami(
    source: QuakeSource,
    generation: number,
    now: number,
  ): Promise<boolean> {
    const urls = this.tsunamiUrls(source)
    // One feed failing leaves the others, and what it said last, in place.
    await Promise.allSettled(
      urls.map((url) =>
        source === 'jma' ? this.pollJmaTsunami(url, now) : this.pollNoaaTsunami(url, now),
      ),
    )
    if (!this.current(source, generation)) return false
    // Only this source's feeds count: one switched away from may still have answered.
    const next = strongestTsunami(
      urls.map((url) => {
        const tsunami = this.tsunamiFeeds.get(url)?.tsunami ?? null
        return tsunami !== null && tsunamiCurrent(tsunami, now) ? tsunami : null
      }),
    )
    const changed = JSON.stringify(next) !== JSON.stringify(this.tsunami)
    this.tsunami = next
    return changed
  }

  private tsunamiUrls(source: QuakeSource): string[] {
    return source === 'jma'
      ? [`${this.deps.urls.jma}/tsunami/data/list.json`]
      : NOAA_FEEDS.map((feed) => `${this.deps.urls.noaa}/events/xml/${feed}`)
  }

  private async pollJmaTsunami(url: string, now: number): Promise<void> {
    const known = this.tsunamiFeeds.get(url)
    const list = await this.get(url, known !== undefined)
    if (list === null) return
    const report = latestJmaTsunamiReport(JSON.parse(list), now)
    if (report === null) {
      this.tsunamiFeeds.set(url, { report: null, tsunami: null })
      return
    }
    if (known?.report === report.json) return
    try {
      // A report's file is new and never changes: fetched once, unconditionally.
      const detail = await this.deps.fetch(`${this.deps.urls.jma}/tsunami/data/${report.json}`, {
        headers: { 'User-Agent': this.deps.userAgent },
      })
      if (detail.status !== 200) throw new Error(`tsunami report: HTTP ${detail.status}`)
      const tsunami = parseJmaTsunamiReport(JSON.parse(await detail.text()), report)
      this.tsunamiFeeds.set(url, { report: report.json, tsunami })
    } catch (error) {
      // The list said there is a new report; until it is read, the list must not
      // answer 304, or the report would never be asked for again.
      this.validators.delete(url)
      throw error
    }
  }

  private async pollNoaaTsunami(url: string, now: number): Promise<void> {
    const xml = await this.get(url, this.tsunamiFeeds.has(url))
    if (xml !== null) {
      this.tsunamiFeeds.set(url, { report: null, tsunami: parseNoaaTsunamiFeed(xml, now) })
    }
  }

  /** A GET, conditional when asked: the body when it changed, null for a 304; throws otherwise. */
  private async get(url: string, conditional: boolean): Promise<string | null> {
    const known = conditional ? this.validators.get(url) : undefined
    const headers: Record<string, string> = { 'User-Agent': this.deps.userAgent }
    if (known?.etag) headers['If-None-Match'] = known.etag
    if (known?.lastModified) headers['If-Modified-Since'] = known.lastModified
    const response = await this.deps.fetch(url, { headers })
    if (response.status === 304 && known !== undefined) return null
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
    const body = await response.text()
    this.validators.set(url, {
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
    })
    return body
  }

  /** Announces what is due; publishes the state itself unless the caller is about to. */
  private announce(now: number, publish = true): void {
    const rule = this.config.rule
    if (rule === null) return
    const quakes = quakesToAlert(this.quakes, { rule, now, alerted: this.alerted })
    const tsunami =
      this.config.tsunami && this.tsunami !== null && tsunamiNeedsAlert(this.tsunami, this.alerted)
        ? this.tsunami
        : null
    if (quakes.length === 0 && tsunami === null) return

    const keys = [
      ...(tsunami !== null ? [tsunamiAlertKey(tsunami)] : []),
      ...quakes.map((q) => q.id),
    ]
    const kept = [...this.alerted, ...keys].slice(-ALERTED_KEPT)
    this.alertedKeys = new Set(kept)
    this.announced = [...keys, ...this.announced].slice(0, ANNOUNCED_KEPT)
    try {
      this.deps.saveAlerted(kept)
    } catch (error) {
      console.warn('[elecdex] could not save announced alerts', error)
    }
    if (publish) this.deps.publish(this.state())
    this.deps.alert({ quakes, tsunami })
  }
}
