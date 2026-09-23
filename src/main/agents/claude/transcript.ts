import path from 'node:path'
import type { AgentActivity } from '@shared/agents'

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

function readAssistant(line: Record<string, unknown>, tally: Tally): void {
  const message = line.message as Record<string, unknown> | undefined
  if (message === undefined) return
  const at = Date.parse(str(line.timestamp)) || 0
  if (typeof message.model === 'string' && message.model !== '<synthetic>')
    tally.model = message.model
  const usage = message.usage as Record<string, unknown> | undefined
  if (usage !== undefined) {
    const n = (key: string) => (typeof usage[key] === 'number' ? (usage[key] as number) : 0)
    tally.context =
      n('input_tokens') + n('cache_read_input_tokens') + n('cache_creation_input_tokens')
    tally.output += n('output_tokens')
  }
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

/** The kinds of line worth parsing, told apart before parsing: a tool result never is. */
const WANTED = /"role":"assistant"|"type":"custom-title"|"type":"file-history-(snapshot|delta)"/

/** A line longer than this (a tool's output, an image) is never one worth parsing. */
export const LINE_LIMIT = 4 * 1024 * 1024

/** Reads whole lines into the tally; returns what is left of a line not yet finished. */
export function readLines(text: string, cwd: string, tally: Tally): string {
  const lines = text.split('\n')
  const rest = lines.pop() ?? ''
  for (const raw of lines) {
    if (raw.length > LINE_LIMIT || !WANTED.test(raw)) continue
    let line: Record<string, unknown>
    try {
      line = JSON.parse(raw) as Record<string, unknown>
    } catch {
      continue
    }
    if (line.type === 'assistant') readAssistant(line, tally)
    else if (line.type === 'custom-title') tally.title = str(line.customTitle).slice(0, 120)
    else if (str(line.type).startsWith('file-history-')) readBackups(line, cwd, tally)
  }
  return rest
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
