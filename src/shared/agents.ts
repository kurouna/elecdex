/**
 * The AI AGENT pane: coding agents at work on this machine, as their own local
 * records tell it. Experimental - the records belong to the agents and are not
 * documented, so a new version of one may change what can be read.
 *
 * The pane talks to one layer (main/agents/hub.ts), never to an agent's files:
 * the layer asks each source the settings turn on (`agents.sources`) and hands
 * the page one board in one shape. A source is an adapter behind
 * `AgentSource` (main/agents/source.ts); Claude Code is the first. Adding
 * another agent is adding an adapter and an id here, not touching the pane.
 */

export const AGENT_SOURCE_IDS = ['claude-code'] as const
export type AgentSourceId = (typeof AGENT_SOURCE_IDS)[number]

export const AGENT_SOURCE_NAMES: Record<AgentSourceId, string> = {
  'claude-code': 'Claude Code',
}

export const isAgentSource = (value: unknown): value is AgentSourceId =>
  typeof value === 'string' && (AGENT_SOURCE_IDS as readonly string[]).includes(value)

/** What a session is doing, as its agent says; `unknown` for a word this version does not know. */
export type AgentStatus = 'busy' | 'idle' | 'waiting' | 'ended' | 'unknown'

export interface AgentActivity {
  /** The tool the agent last called: Bash, Edit, Read… or `reply` for plain text. */
  tool: string
  /** What it was called on, short: a file's name, a command's description. */
  detail: string
  at: number
}

export interface AgentFile {
  /** A key the page hands back to ask for the file's diff; opaque to the page. */
  key: string
  /** The path as shown: relative to the session's folder when inside it. */
  path: string
  /** The session created it (there was no file before its first edit). */
  created: boolean
  /** A subagent of the session changed it, and the session itself did not. */
  subagent: boolean
}

/** A subagent the session started, or a command it left running in the background. */
export type AgentTaskKind = 'agent' | 'shell'

/**
 * How a task stands. `unknown` is a task still running when its session went:
 * nothing in the record says how it ended, so the pane does not guess.
 */
export type AgentTaskState = 'running' | 'done' | 'failed' | 'stopped' | 'unknown'

export interface AgentTask {
  /** The tool call that started it; opaque to the page. */
  id: string
  kind: AgentTaskKind
  /** What the session called it: the subagent's description, the command's. */
  title: string
  /** A subagent's type (general-purpose, Explore…); empty for a command. */
  type: string
  /** Started to run on its own while the session went on. */
  background: boolean
  state: AgentTaskState
  startedAt: number
  endedAt: number | null
  /** A subagent's last step, from its own record. */
  activity: AgentActivity | null
  /** Tool calls a subagent has made so far. */
  steps: number
}

export interface AgentSession {
  source: AgentSourceId
  id: string
  title: string
  /** The folder it works in, by name, and in full for the tooltip. */
  project: string
  cwd: string
  status: AgentStatus
  /** Still running: its process is there. */
  live: boolean
  startedAt: number
  updatedAt: number
  model: string
  activity: AgentActivity | null
  /** Tokens in the model's view at the last answer: the context the session carries now. */
  context: number | null
  /** Tokens the model wrote, and answers it gave, counted from the part of the record read. */
  output: number
  turns: number
  tools: { name: string; count: number }[]
  files: AgentFile[]
  /** Running first, then the newest; a finished one stays for ENDED_KEPT_MS. */
  tasks: AgentTask[]
  /** Only the end of a long record was read, so the counts are the recent ones. */
  partial: boolean
}

export interface AgentSourceState {
  id: AgentSourceId
  name: string
  enabled: boolean
  /** The agent's records are on this machine. */
  found: boolean
  problem: string | null
}

export interface AgentBoard {
  sources: AgentSourceState[]
  sessions: AgentSession[]
  readAt: number
}

/** The files a session changed, and the diff of one of them. */
export interface AgentDiffRequest {
  source: AgentSourceId
  sessionId: string
  key: string
}

export function parseAgentDiffRequest(raw: unknown): AgentDiffRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { source, sessionId, key } = raw as Record<string, unknown>
  if (!isAgentSource(source)) return null
  if (typeof sessionId !== 'string' || !/^[0-9a-f-]{8,64}$/i.test(sessionId)) return null
  if (typeof key !== 'string' || !/^[0-9a-f]{16}$/.test(key)) return null
  return { source, sessionId, key }
}

/** Sessions and tasks that ended stay on the board this long, so a finished one is seen finishing. */
export const ENDED_KEPT_MS = 10 * 60_000
