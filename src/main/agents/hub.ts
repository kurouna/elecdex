import {
  AGENT_SOURCE_IDS,
  AGENT_SOURCE_NAMES,
  type AgentBoard,
  type AgentDiffRequest,
  type AgentSourceId,
} from '@shared/agents'
import type { GitDiff } from '@shared/git'
import type { AgentSource } from './source.js'

/**
 * The AGENT pane's one layer: the page asks it, and it asks each agent source
 * the settings turn on. It knows nothing of any agent's files - adding an agent
 * is adding a source - and it runs only while a page is subscribed: the first
 * subscriber starts the sources' watches, the last one leaving stops them.
 *
 * A board goes out a short while after a change, and only when it differs from
 * the last one sent, so a busy session writing its record many times a second
 * costs the page a few updates a second at most.
 */

export interface AgentHubDeps {
  sources: Record<AgentSourceId, AgentSource>
  enabled(): readonly AgentSourceId[]
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(board: AgentBoard): void
}

/** Changes within this long go out as one board. */
export const PUBLISH_MS = 300

export class AgentHub {
  private readonly deps: AgentHubDeps
  private running = new Set<AgentSourceId>()
  private timer: unknown = null
  private last = ''

  constructor(deps: AgentHubDeps) {
    this.deps = deps
  }

  get active(): boolean {
    return this.running.size > 0 || this.last !== ''
  }

  /** Starts the enabled sources, and stops the rest; called on subscribe and on a settings change. */
  sync(subscribed: boolean): void {
    const wanted = new Set(subscribed ? this.deps.enabled() : [])
    for (const id of [...this.running]) {
      if (wanted.has(id)) continue
      this.deps.sources[id].stop()
      this.running.delete(id)
    }
    for (const id of wanted) {
      if (this.running.has(id)) continue
      this.running.add(id)
      this.deps.sources[id].start(() => this.changed())
    }
    if (!subscribed) {
      if (this.timer !== null) this.deps.clearTimer(this.timer)
      this.timer = null
      this.last = ''
      return
    }
    this.changed()
  }

  board(): AgentBoard {
    const now = this.deps.now()
    const enabled = new Set(this.deps.enabled())
    return {
      sources: AGENT_SOURCE_IDS.map((id) => ({
        id,
        name: AGENT_SOURCE_NAMES[id],
        enabled: enabled.has(id),
        found: this.deps.sources[id].found(),
        problem: null,
      })),
      sessions: [...this.running].flatMap((id) => this.deps.sources[id].sessions(now)),
      readAt: now,
    }
  }

  async diff(request: AgentDiffRequest): Promise<GitDiff | null> {
    if (!this.running.has(request.source)) return null
    return this.deps.sources[request.source].diff(request.sessionId, request.key)
  }

  private changed(): void {
    // A reading that was under way when the last pane went reports in late: nobody is asking.
    if (this.timer !== null || this.running.size === 0) return
    this.timer = this.deps.setTimer(() => {
      this.timer = null
      if (this.running.size === 0) return
      const board = this.board()
      const shape = JSON.stringify({ ...board, readAt: 0 })
      if (shape === this.last) return
      this.last = shape
      this.deps.publish(board)
    }, PUBLISH_MS)
  }
}
