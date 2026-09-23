import path from 'node:path'
import type { AgentActivity, AgentTaskKind, AgentTaskState } from '@shared/agents'

/**
 * Reading a Claude Code session's record (`projects/<folder>/<session>.jsonl`),
 * a line at a time, into the few things the AGENT pane shows. Pure: the lines
 * come in as text, so it is tested on records shaped as Claude Code wrote them.
 *
 * The record is the whole conversation, tool output included - a line can be a
 * megabyte - and only the model's own lines matter here. A line is parsed only
 * when a quick look says it is one of those, so the tool results are skipped
 * as text; and the record is read from where the last reading stopped
 * (main/agents/claude/source.ts), never again from the start.
 */

export interface Tally {
  title: string
  model: string
  /** Tokens in view at the last answer: what the session carries now. */
  context: number | null
  output: number
  turns: number
  tools: Map<string, number>
  /** Files the session wrote, by full path, with the backup Claude Code took before the first edit. */
  files: Map<string, { backup: string | null; seen: boolean }>
  activity: AgentActivity | null
  /** Subagents and background commands the session started, by the id of the call. */
  tasks: Map<string, TaskMark>
  /** The answer the last line was part of: one answer is written as several lines. */
  message: string
}

/** A task as the record tells it; the source adds what the subagent's own record says. */
export interface TaskMark {
  kind: AgentTaskKind
  title: string
  type: string
  /** The call asked for it to run in the background. */
  background: boolean
  startedAt: number
  /** The answer that started it. */
  message: string
  /** When the next answer began: a subagent the session waited for has finished by then. */
  answeredAt: number | null
  /** The call's own result has been read: nothing more is looked for in the tool results. */
  resulted: boolean
  /** The id Claude Code gave the running task, which TaskStop names. */
  taskId: string | null
  /** What Claude Code's notice of its end said. */
  ended: { state: AgentTaskState; at: number } | null
}

export const emptyTally = (): Tally => ({
  title: '',
  model: '',
  context: null,
  output: 0,
  turns: 0,
  tools: new Map(),
  files: new Map(),
  activity: null,
  tasks: new Map(),
  message: '',
})

const WRITES = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])
const DETAIL_LIMIT = 80

const clip = (text: string): string => {
  const one = text.replace(/\s+/g, ' ').trim()
  return one.length > DETAIL_LIMIT ? `${one.slice(0, DETAIL_LIMIT - 1)}…` : one
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '')

/** What a tool was called on, in a few words. */
export function toolDetail(name: string, input: Record<string, unknown>): string {
  const file = str(input.file_path) || str(input.notebook_path)
  if (file !== '') return path.basename(file.replaceAll('\\', '/'))
  if (name === 'Bash' || name === 'PowerShell')
    return clip(str(input.description) || str(input.command))
  if (name === 'WebFetch') {
    try {
      return new URL(str(input.url)).host
    } catch {
      return ''
    }
  }
  const text = str(input.description) || str(input.pattern) || str(input.query) || str(input.prompt)
  return clip(text)
}

/** A tool's name as the pane shows it: an MCP tool by its own name, not its server's. */
export const toolName = (name: string): string =>
  name.startsWith('mcp__') ? (name.split('__').at(-1) ?? name) : name

/** A new answer begins: the session only answers again once every call of the last one has returned. */
function noteAnswer(id: string, at: number, tally: Tally): void {
  if (id === '' || id === tally.message) return
  tally.message = id
  for (const task of tally.tasks.values()) {
    if (task.message !== id && task.answeredAt === null) task.answeredAt = at
  }
}

function readUsage(usage: Record<string, unknown> | undefined, tally: Tally): void {
  if (usage === undefined) return
  const n = (key: string) => (typeof usage[key] === 'number' ? (usage[key] as number) : 0)
  tally.context =
    n('input_tokens') + n('cache_read_input_tokens') + n('cache_creation_input_tokens')
  tally.output += n('output_tokens')
}

function readAssistant(line: Record<string, unknown>, tally: Tally): void {
  const message = line.message as Record<string, unknown> | undefined
  if (message === undefined) return
  const at = Date.parse(str(line.timestamp)) || 0
  noteAnswer(str(message.id), at, tally)
  if (typeof message.model === 'string' && message.model !== '<synthetic>')
    tally.model = message.model
  readUsage(message.usage as Record<string, unknown> | undefined, tally)
  if (message.stop_reason === 'end_turn') tally.turns += 1
  const content = Array.isArray(message.content) ? message.content : []
  for (const block of content as Record<string, unknown>[]) {
    if (block.type === 'tool_use') readTool(block, at, tally)
    else if (block.type === 'text' && message.stop_reason === 'end_turn') {
      tally.activity = { tool: 'reply', detail: clip(str(block.text)), at }
    }
  }
}

function readTool(block: Record<string, unknown>, at: number, tally: Tally): void {
  const name = str(block.name)
  const input = (block.input ?? {}) as Record<string, unknown>
  const shown = toolName(name)
  tally.tools.set(shown, (tally.tools.get(shown) ?? 0) + 1)
  tally.activity = { tool: shown, detail: toolDetail(name, input), at }
  const written = str(input.file_path) || str(input.notebook_path)
  // Normalised as the backups' paths are, so one file is one entry however it was written.
  const file = written === '' ? '' : path.resolve(written)
  if (WRITES.has(name) && file !== '' && !tally.files.has(file)) {
    tally.files.set(file, { backup: null, seen: false })
  }
  const kind = taskKind(name, input)
  const id = str(block.id)
  if (kind !== null && id !== '' && !tally.tasks.has(id)) {
    tally.tasks.set(id, {
      kind,
      title: toolDetail(name, input) || name,
      type: kind === 'agent' ? str(input.subagent_type) || 'general-purpose' : '',
      background: input.run_in_background === true,
      startedAt: at,
      message: tally.message,
      answeredAt: null,
      resulted: false,
      taskId: null,
      ended: null,
    })
  }
  if (STOPS.has(name)) stopTask(str(input.task_id) || str(input.shell_id), at, tally)
}

/** The tools that stop a background task by the id Claude Code gave it. */
const STOPS = new Set(['TaskStop', 'KillShell', 'KillBash'])

function stopTask(taskId: string, at: number, tally: Tally): void {
  if (taskId === '') return
  for (const task of tally.tasks.values()) {
    if (task.taskId === taskId && task.ended === null) task.ended = { state: 'stopped', at }
  }
}

/**
 * A line that carries the result of a call whose task is still waiting for it. Tool
 * results are otherwise never parsed; these are few, and say how a call went: refused,
 * interrupted, or launched with the id a stop will name. The quotes are the record's
 * own, so an output that only quotes the id (escaped) is not taken.
 */
function resultFor(raw: string, tally: Tally): boolean {
  if (!raw.includes('"tool_use_id":"')) return false
  for (const [id, task] of tally.tasks) {
    if (!task.resulted && task.ended === null && raw.includes(`"tool_use_id":"${id}"`)) return true
  }
  return false
}

const resultText = (content: unknown): string =>
  typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((part) => str((part as Record<string, unknown>)?.text)).join('\n')
      : ''

function readResult(line: Record<string, unknown>, tally: Tally): void {
  const content = (line.message as Record<string, unknown> | undefined)?.content
  if (!Array.isArray(content)) return
  const at = Date.parse(str(line.timestamp)) || 0
  for (const block of content as Record<string, unknown>[]) {
    const task = block.type === 'tool_result' ? tally.tasks.get(str(block.tool_use_id)) : undefined
    if (task === undefined || task.resulted) continue
    task.resulted = true
    settle(task, resultText(block.content), block.is_error === true, at)
  }
}

/** What a call's result says of its task: ended, or running on its own under an id. */
function settle(task: TaskMark, text: string, error: boolean, at: number): void {
  if (task.ended !== null) return
  if (error) {
    task.ended = { state: /interrupted/i.test(text) ? 'stopped' : 'failed', at }
    return
  }
  const launched = /^Async agent launched/.test(text)
  const id = /agentId: ([0-9a-z]+)/i.exec(text)?.[1] ?? /with ID: ([0-9a-z]+)/i.exec(text)?.[1]
  if (launched) task.background = true
  if (id !== undefined && (launched || task.kind === 'shell')) task.taskId = id
  // A subagent the session waited for answers with its report: it has finished.
  else if (task.kind === 'agent' && !task.background) task.ended = { state: 'done', at }
}

/** A call that starts a task: any subagent, and a command left to run in the background. */
function taskKind(name: string, input: Record<string, unknown>): AgentTaskKind | null {
  // `Task` is the tool's older name.
  if (name === 'Agent' || name === 'Task') return 'agent'
  if ((name === 'Bash' || name === 'PowerShell') && input.run_in_background === true) return 'shell'
  return null
}

/** Claude Code's words for how a task ended; `running` (a progress notice) and the rest end nothing. */
const ENDINGS: Record<string, AgentTaskState> = {
  completed: 'done',
  failed: 'failed',
  stopped: 'stopped',
  killed: 'stopped',
}

/**
 * The notice Claude Code gives the session when a background task ends
 * (`<task-notification>`): queued while the session is busy, then handed to it
 * as a message. The first ends the task; one with a later time ends it again.
 */
function readNotice(line: Record<string, unknown>, tally: Tally): void {
  const message = line.message as Record<string, unknown> | undefined
  const text =
    line.type === 'queue-operation'
      ? line.operation === 'enqueue'
        ? str(line.content)
        : ''
      : (line.origin as Record<string, unknown> | undefined)?.kind === 'task-notification'
        ? str(message?.content)
        : ''
  if (!text.startsWith('<task-notification>')) return
  const id = /<tool-use-id>([^<]+)<\/tool-use-id>/.exec(text)?.[1] ?? ''
  const state = ENDINGS[/<status>([a-z_]+)<\/status>/.exec(text)?.[1] ?? '']
  const task = tally.tasks.get(id)
  if (task === undefined || state === undefined) return
  const at = Date.parse(str(line.timestamp)) || task.startedAt
  // A subagent sent another message runs again, and ends again: the latest notice is the one.
  if (task.ended === null || at > task.ended.at) task.ended = { state, at }
}

/**
 * Claude Code's own copies of a file from before the session first changed it
 * (`file-history-snapshot`, `file-history-delta`). The first copy of a path is
 * the one that says what the file was; a path with none was created.
 */
function readBackups(line: Record<string, unknown>, cwd: string, tally: Tally): void {
  const note = (tracked: string, backup: unknown) => {
    const full = path.resolve(cwd, tracked)
    const name = (backup as Record<string, unknown> | null)?.backupFileName
    const known = tally.files.get(full)
    if (known?.seen) return
    tally.files.set(full, { backup: typeof name === 'string' ? name : null, seen: true })
  }
  if (line.type === 'file-history-delta') note(str(line.trackingPath), line.backup)
  const snapshot = (line.snapshot as Record<string, unknown> | undefined)?.trackedFileBackups
  if (typeof snapshot === 'object' && snapshot !== null) {
    for (const [tracked, backup] of Object.entries(snapshot)) note(tracked, backup)
  }
}

/**
 * The kinds of line worth parsing, told apart before parsing: a tool result never is. The
 * quotes are the record's own, so a tool's output that mentions them (escaped) is not taken.
 */
const WANTED =
  /"role":"assistant"|"type":"custom-title"|"type":"file-history-(snapshot|delta)"|"type":"queue-operation"|"kind":"task-notification"/

/** A line longer than this (a tool's output, an image) is never one worth parsing. */
export const LINE_LIMIT = 4 * 1024 * 1024

/** Reads whole lines into the tally; returns what is left of a line not yet finished. */
export function readLines(text: string, cwd: string, tally: Tally): string {
  const lines = text.split('\n')
  const rest = lines.pop() ?? ''
  for (const raw of lines) {
    if (raw.length > LINE_LIMIT || !(WANTED.test(raw) || resultFor(raw, tally))) continue
    let line: Record<string, unknown>
    try {
      line = JSON.parse(raw) as Record<string, unknown>
    } catch {
      continue
    }
    if (line.type === 'assistant') readAssistant(line, tally)
    else if (line.type === 'custom-title') tally.title = str(line.customTitle).slice(0, 120)
    else if (str(line.type).startsWith('file-history-')) readBackups(line, cwd, tally)
    else {
      readNotice(line, tally)
      readResult(line, tally)
    }
  }
  return rest
}

/** A subagent as its `agent-<id>.meta.json` has it: which call started it, and how. */
export interface SubagentMeta {
  toolUseId: string
  background: boolean
}

export function readSubagentMeta(text: string): SubagentMeta | null {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
  const toolUseId = str(data.toolUseId)
  if (toolUseId === '') return null
  return { toolUseId, background: data.requestShape === 'background' }
}

/** A session as `sessions/<pid>.json` has it, or null for anything else. */
export interface LiveRecord {
  pid: number
  sessionId: string
  cwd: string
  name: string
  status: string
  startedAt: number
  updatedAt: number
}

export function readLiveRecord(text: string): LiveRecord | null {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
  const sessionId = str(data.sessionId)
  if (!/^[0-9a-f-]{8,64}$/i.test(sessionId) || typeof data.pid !== 'number') return null
  return {
    pid: data.pid,
    sessionId,
    cwd: str(data.cwd),
    name: str(data.name).slice(0, 120),
    status: str(data.status),
    startedAt: typeof data.startedAt === 'number' ? data.startedAt : 0,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  }
}
