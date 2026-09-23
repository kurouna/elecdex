import { createHash } from 'node:crypto'
import { existsSync, type FSWatcher, readdirSync, readFileSync, statSync, watch } from 'node:fs'
import { open, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { type AgentSession, type AgentStatus, ENDED_KEPT_MS } from '@shared/agents'
import { addedFileDiff, type GitDiff, looksBinary, MAX_UNTRACKED_BYTES } from '@shared/git'
import { cutHunks, diffLines, toHunks } from '@shared/text-diff'
import type { AgentSource } from '../source.js'
import {
  emptyTally,
  LINE_LIMIT,
  type LiveRecord,
  readLines,
  readLiveRecord,
  type Tally,
} from './transcript.js'

/**
 * Claude Code sessions, from Claude Code's own folder (`~/.claude`, or
 * CLAUDE_CONFIG_DIR; tests point ELECDEX_CLAUDE_DIR at a made-up one so no run
 * reads this machine's).
 *
 *  - `sessions/<pid>.json`: one small file per running session - its name,
 *    folder and status. Watched; the board's list comes from here.
 *  - `projects/<folder>/<session>.jsonl`: the session's record. Read from where
 *    the last reading stopped, when it grows. A record larger than
 *    FULL_READ_BYTES is read from its last TAIL_BYTES only, and the counts say
 *    they are partial. Measured on this machine: a 124 MB record parsed whole
 *    took 944 ms; the last 64 kB take 0.3 ms, and a busy session adds 20-160 kB
 *    a minute.
 *  - `file-history/<session>/<name>@v1`: a file as it was before the session
 *    first changed it, which is what a session's diff is taken against.
 */

const FULL_READ_BYTES = 32 * 1024 * 1024
const TAIL_BYTES = 512 * 1024
/** Read in pieces, so a long record never holds the main process in one go. */
const CHUNK_BYTES = 1024 * 1024
/** After the last change to a record, how long to wait before reading it. */
const SETTLE_MS = 400
/** How often to ask whether a session's process is still there (one can die without a word). */
const ALIVE_CHECK_MS = 60_000

interface Tracked {
  live: LiveRecord
  ended: number | null
  transcript: string | null
  offset: number
  /** Bytes to text across reads: a character split between two pieces stays one character. */
  decoder: StringDecoder
  rest: string
  /** Up to the next line's start is not a whole line: a tail's first, or one past LINE_LIMIT. */
  skipLine: boolean
  partial: boolean
  tally: Tally
  reading: boolean
  /** The record grew while it was being read: read again once this reading ends. */
  again: boolean
}

/** A record read from its start: nothing carried over. */
const fresh = (): Pick<
  Tracked,
  'offset' | 'decoder' | 'rest' | 'skipLine' | 'partial' | 'tally'
> => ({
  offset: 0,
  decoder: new StringDecoder('utf8'),
  rest: '',
  skipLine: false,
  partial: false,
  tally: emptyTally(),
})

export function claudeDir(): string {
  return (
    process.env.ELECDEX_CLAUDE_DIR ??
    process.env.CLAUDE_CONFIG_DIR ??
    path.join(homedir(), '.claude')
  )
}

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    // EPERM: there, but not ours to signal.
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

const STATUSES: Record<string, AgentStatus> = {
  busy: 'busy',
  idle: 'idle',
  waiting: 'waiting',
  'waiting-for-input': 'waiting',
  permission: 'waiting',
}

/** A file's key for the page: a short hash of its path, which the page hands back as it got it. */
const keyOf = (file: string): string => createHash('sha1').update(file).digest('hex').slice(0, 16)

export class ClaudeCodeSource implements AgentSource {
  readonly id = 'claude-code' as const
  private readonly dir: string
  private readonly tracked = new Map<string, Tracked>()
  private readonly watchers = new Map<'sessions' | 'projects', FSWatcher>()
  private presence: { at: number; found: boolean } | null = null
  private timers = new Map<string, NodeJS.Timeout>()
  private aliveTimer: NodeJS.Timeout | null = null
  private changed: () => void = () => {}

  constructor(dir = claudeDir()) {
    this.dir = dir
  }

  /** Asked with every board; the folders are looked for once a scan at most. */
  found(): boolean {
    const now = Date.now()
    if (this.presence === null || now - this.presence.at >= ALIVE_CHECK_MS) {
      const found =
        existsSync(path.join(this.dir, 'sessions')) || existsSync(path.join(this.dir, 'projects'))
      this.presence = { at: now, found }
    }
    return this.presence.found
  }

  start(changed: () => void): void {
    this.changed = changed
    this.watch()
    this.scan()
    this.aliveTimer = setInterval(() => {
      this.watch()
      this.scan()
    }, ALIVE_CHECK_MS)
    this.aliveTimer.unref()
  }

  /**
   * Watches the two folders, each once. One not there yet (Claude Code has not
   * run on this machine), or whose watch failed, is tried again with each scan,
   * so a first session started while the pane is open is still followed.
   */
  private watch(): void {
    for (const [folder, recursive] of [
      ['sessions', false],
      ['projects', true],
    ] as const) {
      if (this.watchers.has(folder)) continue
      try {
        const watcher = watch(
          path.join(this.dir, folder),
          { recursive, persistent: false },
          (_event, name) => this.onChange(folder, typeof name === 'string' ? name : ''),
        )
        watcher.on('error', () => {
          watcher.close()
          if (this.watchers.get(folder) === watcher) this.watchers.delete(folder)
        })
        this.watchers.set(folder, watcher)
        this.presence = null
      } catch {
        // Not there yet; the next scan tries again.
      }
    }
  }

  stop(): void {
    for (const watcher of this.watchers.values()) watcher.close()
    this.watchers.clear()
    for (const timer of this.timers.values()) clearTimeout(timer)
    this.timers.clear()
    if (this.aliveTimer !== null) clearInterval(this.aliveTimer)
    this.aliveTimer = null
    this.tracked.clear()
  }

  private onChange(folder: 'sessions' | 'projects', name: string): void {
    if (folder === 'sessions') {
      this.debounce('sessions', () => this.scan())
      return
    }
    const id = path.basename(name, '.jsonl')
    const entry = this.tracked.get(id)
    if (entry !== undefined && name.endsWith('.jsonl'))
      this.debounce(id, () => void this.read(entry))
  }

  private debounce(key: string, fn: () => void): void {
    clearTimeout(this.timers.get(key))
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key)
        fn()
      }, SETTLE_MS),
    )
  }

  /** The running sessions, from their small files; a session gone from there has ended. */
  private scan(): void {
    const now = Date.now()
    const seen = new Set<string>()
    let files: string[] = []
    try {
      files = readdirSync(path.join(this.dir, 'sessions')).filter((f) => f.endsWith('.json'))
    } catch {
      files = []
    }
    for (const file of files) {
      let text: string
      try {
        text = readFileSync(path.join(this.dir, 'sessions', file), 'utf8')
      } catch {
        continue
      }
      const live = readLiveRecord(text)
      if (live === null || !alive(live.pid)) continue
      seen.add(live.sessionId)
      const known = this.tracked.get(live.sessionId)
      if (known !== undefined) {
        known.live = live
        known.ended = null
        continue
      }
      const entry: Tracked = {
        live,
        ended: null,
        transcript: this.findTranscript(live.sessionId, live.cwd),
        ...fresh(),
        reading: false,
        again: false,
      }
      this.tracked.set(live.sessionId, entry)
      void this.read(entry)
    }
    for (const [id, entry] of this.tracked) {
      if (seen.has(id)) continue
      entry.ended ??= now
      if (now - entry.ended > ENDED_KEPT_MS) this.tracked.delete(id)
    }
    this.changed()
  }

  private findTranscript(sessionId: string, cwd: string): string | null {
    const projects = path.join(this.dir, 'projects')
    // Claude Code names a project's folder after its path, every other character a dash.
    const named = path.join(projects, cwd.replace(/[^A-Za-z0-9]/g, '-'), `${sessionId}.jsonl`)
    if (existsSync(named)) return named
    let folders: string[]
    try {
      folders = readdirSync(projects)
    } catch {
      return null
    }
    for (const folder of folders) {
      const candidate = path.join(projects, folder, `${sessionId}.jsonl`)
      if (existsSync(candidate)) return candidate
    }
    return null
  }

  /** Reads what the record gained since the last reading, a piece at a time. */
  private async read(entry: Tracked): Promise<void> {
    entry.transcript ??= this.findTranscript(entry.live.sessionId, entry.live.cwd)
    if (entry.transcript === null) return
    if (entry.reading) {
      entry.again = true
      return
    }
    entry.reading = true
    entry.again = false
    try {
      await this.readFrom(entry, entry.transcript)
    } catch {
      // The record went away mid-read; the next change reads it again.
    } finally {
      entry.reading = false
    }
    this.changed()
    // The last lines of a turn can land while the rest is read: they must not wait for the next turn.
    if (entry.again && this.tracked.get(entry.live.sessionId) === entry) void this.read(entry)
  }

  private async readFrom(entry: Tracked, transcript: string): Promise<void> {
    const size = statSync(transcript).size
    if (size < entry.offset) Object.assign(entry, fresh())
    if (entry.offset === 0 && size > FULL_READ_BYTES) {
      // A tail starts mid-line: that line is not whole, and is left out.
      Object.assign(entry, { offset: size - TAIL_BYTES, partial: true, skipLine: true })
    }
    const handle = await open(transcript, 'r')
    try {
      while (entry.offset < size) {
        const length = Math.min(CHUNK_BYTES, size - entry.offset)
        const buffer = Buffer.alloc(length)
        const { bytesRead } = await handle.read(buffer, 0, length, entry.offset)
        if (bytesRead === 0) break
        entry.offset += bytesRead
        this.take(entry, entry.decoder.write(buffer.subarray(0, bytesRead)))
      }
    } finally {
      await handle.close()
    }
  }

  /** Reads a piece of the record into the tally, carrying an unfinished line to the next. */
  private take(entry: Tracked, piece: string): void {
    let text = entry.rest + piece
    if (entry.skipLine) {
      const end = text.indexOf('\n')
      if (end < 0) {
        entry.rest = ''
        return
      }
      text = text.slice(end + 1)
      entry.skipLine = false
    }
    entry.rest = readLines(text, entry.live.cwd, entry.tally)
    // A line past the limit is skipped when whole anyway: stop gathering it now, not at its end.
    if (entry.rest.length > LINE_LIMIT) Object.assign(entry, { rest: '', skipLine: true })
  }

  sessions(_now: number): AgentSession[] {
    return [...this.tracked.values()]
      .map((entry) => this.session(entry))
      .sort((a, b) => Number(b.live) - Number(a.live) || b.updatedAt - a.updatedAt)
  }

  private session(entry: Tracked): AgentSession {
    const { live, tally } = entry
    const cwd = live.cwd
    const files = [...tally.files.entries()].slice(-60).map(([file, info]) => {
      const inside = path.relative(cwd, file)
      const shown =
        inside !== '' && !inside.startsWith('..') && !path.isAbsolute(inside) ? inside : file
      return {
        key: keyOf(file),
        path: shown.replaceAll('\\', '/'),
        created: info.seen && info.backup === null,
      }
    })
    return {
      source: this.id,
      id: live.sessionId,
      title: live.name || tally.title || path.basename(cwd),
      project: path.basename(cwd),
      cwd,
      status: entry.ended !== null ? 'ended' : (STATUSES[live.status] ?? 'unknown'),
      live: entry.ended === null,
      startedAt: live.startedAt,
      // Never the time of asking: that would make every board differ from the last.
      updatedAt:
        Math.max(live.updatedAt, tally.activity?.at ?? 0, entry.ended ?? 0) || live.startedAt,
      model: tally.model,
      activity: tally.activity,
      context: tally.context,
      output: tally.output,
      turns: tally.turns,
      tools: [...tally.tools.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      files,
      partial: entry.partial,
    }
  }

  /**
   * What a session did to one of its files: the copy Claude Code kept before
   * the first edit against the file as it is now. A file the session created is
   * all additions.
   */
  async diff(sessionId: string, key: string): Promise<GitDiff | null> {
    const found = this.fileOf(sessionId, key)
    if (found === null) return null
    const [file, info] = found
    const base = { repoId: sessionId, path: file }
    // Written, but no copy of what it was has been read (yet, or before a tail): not "all new".
    if (!info.seen)
      return blank(base, { problem: 'no copy of the file from before the session has been found' })
    const now = await readSmall(file)
    const before =
      info.backup === null ? null : await readSmall(this.firstCopy(sessionId, info.backup))
    if (now === 'too-large' || before === 'too-large') return blank(base, { tooLarge: true })
    if ((now !== null && looksBinary(now)) || (before !== null && looksBinary(before))) {
      return blank(base, { binary: true })
    }
    if (info.backup === null) return addedFileDiff(now ?? '', base)
    const { hunks, cut } = cutHunks(toHunks(diffLines(before ?? '', now ?? '')))
    return {
      ...blank(base, { cut, problem: now === null ? 'the file is no longer there' : null }),
      hunks,
    }
  }

  /** A file of a session by the key the page was given for it. */
  private fileOf(
    sessionId: string,
    key: string,
  ): [string, { backup: string | null; seen: boolean }] | null {
    const entry = this.tracked.get(sessionId)
    return [...(entry?.tally.files.entries() ?? [])].find(([file]) => keyOf(file) === key) ?? null
  }

  /** The first copy is the file before the session touched it; later ones are between its edits. */
  private firstCopy(sessionId: string, backup: string): string {
    return path.join(
      this.dir,
      'file-history',
      sessionId,
      path.basename(backup).replace(/@v\d+$/, '@v1'),
    )
  }
}

/** A diff with nothing to draw, and what to say instead. */
const blank = (base: { repoId: string; path: string }, patch: Partial<GitDiff>): GitDiff => ({
  ...base,
  binary: false,
  cut: false,
  tooLarge: false,
  hunks: [],
  problem: null,
  ...patch,
})

async function readSmall(file: string): Promise<string | 'too-large' | null> {
  try {
    if (statSync(file).size > MAX_UNTRACKED_BYTES) return 'too-large'
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}
