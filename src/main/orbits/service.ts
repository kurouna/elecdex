import {
  ORBIT_MAX_BYTES,
  ORBIT_OFFLINE_MS,
  ORBIT_REFRESH_MS,
  ORBIT_REFUSED_MS,
  type OrbitElements,
  type OrbitSet,
  type OrbitUpdate,
  orbitQuery,
  readOrbitSet,
} from '@shared/orbits'
import { z } from 'zod'

/**
 * Keeps the orbital elements an ORBIT pane shows, and asks CelesTrak for them
 * as its rules ask (shared/orbits.ts): only while a pane shows the set, at most
 * twice a day for the stations and once a day for Starlink, never again the
 * same day after anything but a 200, and from a copy on disk after a restart -
 * including the day's refusal, so a restart is not a way round it.
 *
 * Electron-free: the network, the clock, the timers and the files are injected.
 */

export interface OrbitResponse {
  status: number
  /** The body, cut off at `limit` bytes; null when it was longer. */
  text(limit: number): Promise<string | null>
  /** Lets go of a body that will not be read. */
  discard(): void
}

export interface OrbitDeps {
  baseUrl: string
  userAgent: string
  fetch(url: string, headers: Record<string, string>): Promise<OrbitResponse>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  load(set: OrbitSet): OrbitCache | null
  save(set: OrbitSet, cache: OrbitCache): void
  publish(update: OrbitUpdate): void
}

const ElementsSchema = z.object({
  id: z.number().int(),
  name: z.string().max(40),
  omm: z.record(z.string(), z.union([z.string(), z.number()])).nullable(),
  tle: z.tuple([z.string().max(80), z.string().max(80)]).nullable(),
})

export const OrbitCacheSchema = z.object({
  elements: z.array(ElementsSchema).max(20_000),
  fetchedAt: z.number().nullable(),
  error: z.string().nullable(),
  /** Asking is off until then: a refusal, or the network down. */
  quietUntil: z.number().nullable(),
})

export type OrbitCache = z.infer<typeof OrbitCacheSchema>

interface SetState {
  cache: OrbitCache
  watched: boolean
  timer: unknown
  fetching: boolean
}

const emptyCache = (): OrbitCache => ({
  elements: [],
  fetchedAt: null,
  error: null,
  quietUntil: null,
})

export class OrbitService {
  private readonly deps: OrbitDeps
  private readonly sets = new Map<OrbitSet, SetState>()

  constructor(deps: OrbitDeps) {
    this.deps = deps
  }

  snapshot(set: OrbitSet): OrbitUpdate {
    const { cache } = this.state(set)
    return {
      set,
      elements: cache.elements as OrbitElements[],
      fetchedAt: cache.fetchedAt,
      error: cache.error,
    }
  }

  watching(): OrbitSet[] {
    return [...this.sets].filter(([, s]) => s.watched).map(([set]) => set)
  }

  watch(set: OrbitSet): void {
    const state = this.state(set)
    if (state.watched) return
    state.watched = true
    this.schedule(set)
  }

  unwatch(set: OrbitSet): void {
    const state = this.sets.get(set)
    if (state === undefined || !state.watched) return
    state.watched = false
    if (state.timer !== null) this.deps.clearTimer(state.timer)
    state.timer = null
  }

  dispose(): void {
    for (const set of this.sets.keys()) this.unwatch(set)
  }

  /** When the set may next be asked for: when its copy is old enough, and not while told to wait. */
  dueAt(set: OrbitSet): number {
    const { cache } = this.state(set)
    const stale = cache.fetchedAt === null ? 0 : cache.fetchedAt + ORBIT_REFRESH_MS[set]
    return Math.max(stale, cache.quietUntil ?? 0)
  }

  private state(set: OrbitSet): SetState {
    let state = this.sets.get(set)
    if (state === undefined) {
      state = {
        cache: this.deps.load(set) ?? emptyCache(),
        watched: false,
        timer: null,
        fetching: false,
      }
      this.sets.set(set, state)
    }
    return state
  }

  private schedule(set: OrbitSet): void {
    const state = this.state(set)
    if (!state.watched || state.fetching) return
    if (state.timer !== null) this.deps.clearTimer(state.timer)
    const wait = this.dueAt(set) - this.deps.now()
    if (wait <= 0) {
      state.timer = null
      void this.download(set)
      return
    }
    // Timers past a day are not trusted to fire; wake up and look again instead.
    state.timer = this.deps.setTimer(
      () => {
        state.timer = null
        this.schedule(set)
      },
      Math.min(wait, 24 * 60 * 60_000),
    )
  }

  private async download(set: OrbitSet): Promise<void> {
    const state = this.state(set)
    state.fetching = true
    const before = state.cache
    let next: OrbitCache
    try {
      next = await this.ask(set, before)
    } finally {
      state.fetching = false
    }
    state.cache = next
    this.deps.save(set, next)
    this.deps.publish(this.snapshot(set))
    this.schedule(set)
  }

  private async ask(set: OrbitSet, before: OrbitCache): Promise<OrbitCache> {
    const now = this.deps.now()
    let response: OrbitResponse
    try {
      response = await this.deps.fetch(`${this.deps.baseUrl}${orbitQuery(set)}`, {
        'User-Agent': this.deps.userAgent,
        Accept: set === 'stations' ? 'application/json' : 'text/plain',
      })
    } catch {
      return {
        ...before,
        error: 'CelesTrak could not be reached',
        quietUntil: now + ORBIT_OFFLINE_MS,
      }
    }
    if (response.status !== 200) {
      response.discard()
      return {
        ...before,
        error: `CelesTrak answered ${response.status}; not asking again today`,
        quietUntil: now + ORBIT_REFUSED_MS,
      }
    }
    let text: string | null
    try {
      text = await response.text(ORBIT_MAX_BYTES)
    } catch {
      // The connection went while the body came (or the timeout struck): the network, not a refusal.
      return {
        ...before,
        error: 'CelesTrak could not be reached',
        quietUntil: now + ORBIT_OFFLINE_MS,
      }
    }
    const elements = text === null ? null : readOrbitSet(set, text)
    if (elements === null) {
      return {
        ...before,
        error: 'CelesTrak sent something that is not orbital elements',
        quietUntil: now + ORBIT_REFUSED_MS,
      }
    }
    return { elements, fetchedAt: now, error: null, quietUntil: null }
  }
}
