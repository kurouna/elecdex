import {
  actionsFor,
  cpuPercent,
  DOCKER_RECONCILE_MS,
  DOCKER_SETTLE_MS,
  DOCKER_STATS_MS,
  type DockerAction,
  type DockerBoard,
  type DockerContainer,
  type DockerControlResult,
  type DockerLink,
  EMPTY_DOCKER_BOARD,
  linkProblem,
  MAX_STATS,
  readListing,
  readStats,
  STATS_PARALLEL,
  type StatsSample,
} from '@shared/docker'
import { BoundaryTimer } from '../boundary-timer.js'
import { type DockerEngine, EngineError } from './engine.js'

export interface DockerDeps {
  engine: DockerEngine
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(board: DockerBoard): void
}

/** What a container used at its last reading. */
interface Usage {
  cpu: number | null
  mem: number | null
  memLimit: number | null
}

/** A stream that ends sooner than this after it opened is not opened again at once. */
const SHORT_STREAM_MS = 1000

/**
 * The Docker engine, followed from main (architecture.md §5.17).
 *
 * It talks to the engine only while a pane wants it (`sync(true)`: a pane is
 * seen). Then it keeps one event stream open and reads the list at the next
 * quarter second after an event says a container changed, and on the wall
 * clock's ten seconds to put right what events cannot say and to link again
 * when the engine went; what running containers use is read on the five
 * seconds. Each is one timer armed for its next boundary, never an interval,
 * and a reading still running is not overlapped. When the last pane goes the
 * stream is closed and every timer stopped; the last list stays in memory to be
 * shown the moment a pane is back, and nothing is written anywhere.
 *
 * The page knows a container by its short id; the full id stays here, and only
 * a container of the last listing, in a state that takes the press, is pressed.
 */
export class DockerWatcher {
  readonly #deps: DockerDeps
  #board: DockerBoard = EMPTY_DOCKER_BOARD
  #wanted = false
  /** Bumped whenever the pane stops wanting the engine, or the link is dropped: late answers are ignored. */
  #generation = 0
  #linked = false
  #linking = false
  #closeEvents: (() => void) | null = null
  #openedAt = 0
  #listing = false
  #listAgain = false
  #statsBusy = false
  /** The list read again on the ten seconds, and after an event at the next quarter second. */
  readonly #reconcile: BoundaryTimer
  readonly #settle: BoundaryTimer
  /** What running containers use, on the five seconds. */
  readonly #stats: BoundaryTimer
  /** Short id to full id, of the last listing. */
  #ids = new Map<string, string>()
  #samples = new Map<string, StatsSample>()
  #usage = new Map<string, Usage>()

  constructor(deps: DockerDeps) {
    this.#deps = deps
    this.#reconcile = new BoundaryTimer(deps, DOCKER_RECONCILE_MS, () => {
      if (this.#linked) void this.#list()
      else void this.#connect()
    })
    this.#settle = new BoundaryTimer(deps, DOCKER_SETTLE_MS, () => void this.#list())
    this.#stats = new BoundaryTimer(deps, DOCKER_STATS_MS, () => void this.#readStats())
  }

  get active(): boolean {
    return this.#wanted
  }

  /** Diagnostics: whether an event stream is open. */
  get linked(): boolean {
    return this.#linked
  }

  board(): DockerBoard {
    return this.#board
  }

  sync(wanted: boolean): void {
    if (wanted === this.#wanted) return
    this.#wanted = wanted
    this.#generation += 1
    if (wanted) {
      this.#set({
        ...this.#board,
        watching: true,
        link: this.#board.link === 'standby' ? 'linking' : this.#board.link,
      })
      void this.#connect()
      this.#reconcile.start()
      this.#stats.start()
    } else {
      this.#drop()
      this.#stopTimers()
      this.#set({ ...this.#board, watching: false, link: 'standby' })
    }
  }

  /** A press on a container the page showed, passed on when its state takes it. */
  async control(id: string, action: DockerAction): Promise<DockerControlResult> {
    if (!this.#wanted) return 'unsupported'
    if (!this.#linked) return this.#board.link === 'denied' ? 'denied' : 'no-daemon'
    const fullId = this.#ids.get(id)
    const container = this.#board.containers.find((c) => c.id === id)
    if (fullId === undefined || container === undefined) return 'not-found'
    if (!actionsFor(container.state).includes(action)) return 'refused'
    const result = await this.#deps.engine.control(fullId, action)
    // The event is on its way; the list is read anyway, in case it is not.
    if (this.#wanted) this.#soon()
    return result
  }

  dispose(): void {
    this.sync(false)
    this.#deps.engine.close()
  }

  /* ---- Linking ---- */

  async #connect(): Promise<void> {
    if (this.#linking || this.#linked || !this.#wanted) return
    this.#linking = true
    const generation = this.#generation
    try {
      const { endpoint, engine } = await this.#deps.engine.link()
      if (generation !== this.#generation) return
      this.#openedAt = this.#deps.now()
      this.#closeEvents = this.#deps.engine.events(
        () => this.#soon(),
        () => this.#lost(generation),
      )
      this.#linked = true
      this.#set({ ...this.#board, endpoint, engine })
      await this.#list()
    } catch (error) {
      if (generation === this.#generation) this.#fail(error)
    } finally {
      this.#linking = false
    }
  }

  /** The event stream ended: the engine went, or dropped it. */
  #lost(generation: number): void {
    if (generation !== this.#generation || !this.#linked) return
    this.#closeEvents = null
    this.#linked = false
    this.#generation += 1
    // Linked again at once - it says at once when the engine is gone - unless the stream kept
    // ending as soon as it opened: then on the next ten seconds.
    if (this.#deps.now() - this.#openedAt >= SHORT_STREAM_MS) void this.#connect()
  }

  #drop(): void {
    const close = this.#closeEvents
    this.#closeEvents = null
    this.#linked = false
    close?.()
  }

  /** A request failed: how the link stands, and what is left on screen. */
  #fail(error: unknown): void {
    const link: DockerLink = error instanceof EngineError ? error.link : 'error'
    const detail = error instanceof Error ? error.message : null
    this.#drop()
    this.#generation += 1
    // With no engine there are no containers to show; a slow answer leaves the last list up.
    const gone = link !== 'error'
    if (gone) {
      this.#ids.clear()
      this.#samples.clear()
      this.#usage.clear()
    }
    this.#set({
      ...this.#board,
      link,
      problem: linkProblem(link, detail),
      ...(gone ? { containers: [], total: 0, truncated: false, engine: null } : {}),
    })
  }

  /* ---- The list ---- */

  #soon(): void {
    if (this.#wanted) this.#settle.once()
  }

  async #list(): Promise<void> {
    if (!this.#linked) return
    if (this.#listing) {
      this.#listAgain = true
      return
    }
    this.#listing = true
    const generation = this.#generation
    try {
      const raw = await this.#deps.engine.list()
      if (generation === this.#generation) this.#take(raw)
    } catch (error) {
      if (generation === this.#generation) this.#fail(error)
    } finally {
      this.#listing = false
      if (this.#listAgain) {
        this.#listAgain = false
        void this.#list()
      }
    }
  }

  #take(raw: unknown): void {
    const { listed, total, truncated } = readListing(raw)
    this.#ids = new Map(listed.map(({ fullId, container }) => [container.id, fullId]))
    for (const key of [...this.#usage.keys()]) if (!this.#ids.has(key)) this.#usage.delete(key)
    const alive = new Set(this.#ids.values())
    for (const key of [...this.#samples.keys()]) if (!alive.has(key)) this.#samples.delete(key)
    this.#set({
      ...this.#board,
      link: 'linked',
      problem: null,
      containers: listed.map(({ container }) => this.#withUsage(container)),
      total,
      truncated,
      sampledAt: this.#deps.now(),
    })
  }

  #withUsage(container: DockerContainer): DockerContainer {
    const usage = container.state === 'running' ? this.#usage.get(container.id) : undefined
    return usage === undefined ? container : { ...container, ...usage }
  }

  /* ---- What running containers use ---- */

  async #readStats(): Promise<void> {
    if (!this.#linked || this.#statsBusy) return
    const running = this.#board.containers.filter((c) => c.state === 'running').slice(0, MAX_STATS)
    if (running.length === 0) return
    this.#statsBusy = true
    const generation = this.#generation
    try {
      const queue = [...running]
      const worker = async (): Promise<void> => {
        for (let next = queue.shift(); next !== undefined; next = queue.shift())
          await this.#readOne(next.id)
      }
      await Promise.all(Array.from({ length: STATS_PARALLEL }, worker))
      if (generation === this.#generation)
        this.#set({
          ...this.#board,
          containers: this.#board.containers.map((c) => this.#withUsage(c)),
        })
    } finally {
      this.#statsBusy = false
    }
  }

  async #readOne(id: string): Promise<void> {
    const fullId = this.#ids.get(id)
    if (fullId === undefined) return
    try {
      const sample = readStats(await this.#deps.engine.stats(fullId))
      if (sample === null) return
      const cpu = cpuPercent(this.#samples.get(fullId), sample)
      this.#samples.set(fullId, sample)
      this.#usage.set(id, {
        cpu: cpu === null ? (this.#usage.get(id)?.cpu ?? null) : Math.round(cpu * 10) / 10,
        mem: sample.mem,
        memLimit: sample.memLimit,
      })
    } catch {
      // One container that did not answer (it stopped meanwhile) keeps its last figures.
    }
  }

  /* ---- Timers and publishing ---- */

  #stopTimers(): void {
    this.#reconcile.stop()
    this.#settle.stop()
    this.#stats.stop()
  }

  /** Publishes the board when what a pane draws changed; `sampledAt` alone is no change. */
  #set(board: DockerBoard): void {
    const before = this.#board
    this.#board = board
    if (JSON.stringify({ ...before, sampledAt: 0 }) !== JSON.stringify({ ...board, sampledAt: 0 }))
      this.#deps.publish(board)
  }
}
