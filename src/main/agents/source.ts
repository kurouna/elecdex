import type { AgentSession, AgentSourceId } from '@shared/agents'
import type { GitDiff } from '@shared/git'

/**
 * One kind of coding agent, as the AI AGENT pane's layer (hub.ts) sees it. An
 * adapter reads that agent's own local records and answers in the pane's one
 * shape; the hub never knows whose records they are.
 */
export interface AgentSource {
  readonly id: AgentSourceId
  /** The agent's records are on this machine. */
  found(): boolean
  /** Starts watching the records; `changed` is called when something the board shows may have. */
  start(changed: () => void): void
  stop(): void
  sessions(now: number): AgentSession[]
  /** What a session did to one of its files, or null when that cannot be read. */
  diff(sessionId: string, key: string): Promise<GitDiff | null>
}
