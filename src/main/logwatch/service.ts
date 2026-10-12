import { badChars, detectEncoding, looksGarbled } from '@shared/logwatch/encoding'
import { countBreaks, lineStart, matchesPattern } from '@shared/logwatch/files'
import { detectFormat } from '@shared/logwatch/formats'
import { charsOf, trimHeld } from '@shared/logwatch/held'
import { LogReader, splitLines } from '@shared/logwatch/reader'
import {
  keyOf,
  LOG_LIMITS,
  type LogEncoding,
  type LogEncodingChoice,
  type LogItem,
  type LogLine,
  type LogStatus,
  type LogSubscribeRequest,
  type LogWatchEvent,
} from '@shared/logwatch/types'
import { BoundaryTimer } from '../boundary-timer.js'
import type { LogEntryRecord } from './catalog.js'

/**
 * Following log files for the pages that show them (docs/logwatch.md §4). Free of Electron:
 * the file system, the clock and the pages come in, so the tests drive it with real files in a
 * temporary folder and a fake clock.
 *
 * One `Source` per file id: it watches the file while a pane shows it, and reads only where it
 * grew. One `Channel` per id and encoding: it decodes, reads entries and keeps the last of them
 * for the pages - two panes on one file in one encoding share everything. A source nobody shows
 * any more stops watching but keeps its place, so a pane shown again reads what was written
 * while it was hidden, and nothing else is done meanwhile.
 */

export interface FileFacts {
  size: number
  /** The file's identity: a new file at the same name has another. */
  ino: number
  birth: number
  mtime: number
}

export type StatResult = FileFacts | { missing: true } | { denied: true } | { failed: string }

export interface LogFs {
  stat(file: string): Promise<StatResult>
  /** Opens, reads `length` bytes from `start` (fewer at the end), closes. */
  read(file: string, start: number, length: number): Promise<Uint8Array>
  /** The names in a folder, or null when it cannot be listed. */
  list(folder: string): Promise<string[] | null>
  join(folder: string, name: string): string
  dirname(file: string): string
  basename(file: string): string
  /**
   * Calls back on a change in a folder, with the name changed when the system says; null when
   * it cannot watch (the look each second still reads).
   */
  watch(folder: string, onChange: (name: string | null) => void): { close(): void } | null
}

export interface LogWatchDeps<P> {
  fs: LogFs
  entry(id: string): LogEntryRecord | null
  keepLines(): number
  initialLines(): number
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  send(page: P, event: LogWatchEvent): void
}

/** Pages see what was read on the quarter seconds. */
export const DELIVER_MS = 250
/** Each second the file is looked at without a watch event too (Windows reports appends late). */
export const LOOK_MS = 1000
/** A burst of changes is read once, this long after the first. */
export const SETTLE_MS = 200
/** A pattern's folder is listed again at least this often, in looks. */
const RESCAN_LOOKS = 10
/** Sources kept with their place after the last pane went. */
const DORMANT_KEPT = 8
/** Numbers per channel: a channel made again starts far beyond the last one's. */
const SEQ_ROOM = 1_000_000_000
/** The opening reads back this much at a time, counting line breaks. */
const BACK_STEP = 64 * 1024
/**
 * A file with no line yet when opened (new, or not written to yet) is judged - its encoding and
 * dialect - once it has this many lines, or this many bytes, or has gone quiet with one.
 */
const JUDGE_LINES = 20
const JUDGE_BYTES = 16 * 1024

/** A page to bring up to date: the last item it holds, and the state it was last told. */
interface Waiting {
  since: number
  told: string
}

interface Channel<P> {
  key: string
  choice: LogEncodingChoice
  encoding: LogEncoding
  reader: LogReader | null
  decoder: TextDecoder
  /** In the order of their numbers. */
  items: LogItem[]
  /** Characters held in `items` (shared/logwatch/held.ts). */
  held: number
  /**
   * The number of the last item delivered: the ones after it are read and not yet sent. A page
   * brought up to date gets those up to it; the next delivery, which every page gets, the rest.
   */
  sentSeq: number
  pages: Set<P>
  /** Pages to be brought up to date. */
  waiting: Map<P, Waiting>
  /** Bytes held until there is enough to judge the encoding and the dialect by; null once judged. */
  sample: Uint8Array | null
  /** Bytes came since the last delivery: the open entry may still grow. */
  fed: boolean
  bad: number
  chars: number
  /** The status last sent, so a change of it alone is sent too. */
  sentStatus: string
}

interface Source<P> {
  id: string
  entry: LogEntryRecord
  /** The file being read: the entry's, or a pattern's newest. */
  file: string | null
  facts: FileFacts | null
  /** Where the next read starts; null before the first. */
  offset: number | null
  head: Uint8Array
  state: LogStatus['state']
  problem: string | null
  channels: Map<LogEncodingChoice, Channel<P>>
  /** Watching and looking, for the panes that show it. */
  awake: boolean
  watcher: { close(): void } | null
  settle: unknown
  looks: number
  /** Reads one at a time. */
  busy: Promise<void>
  /** When the last pane went; null while one shows it or before any did. */
  dormantSince: number | null
  read: number
  /**
   * The byte just before `offset`, as it was read. A file cut short and written past that place
   * again before the next look (logrotate's copytruncate, an app that rewrites its log) has the
   * same identity and is no shorter; that byte having changed is what tells.
   */
  lastByte: number | null
}

const isFacts = (result: StatResult): result is FileFacts => 'size' in result

export class LogWatchService<P> {
  readonly #deps: LogWatchDeps<P>
  readonly #sources = new Map<string, Source<P>>()
  readonly #deliver: BoundaryTimer
  readonly #look: BoundaryTimer
  #nextSeq = 0
  #disposed = false

  constructor(deps: LogWatchDeps<P>) {
    this.#deps = deps
    this.#deliver = new BoundaryTimer(deps, DELIVER_MS, () => this.#deliverAll())
    this.#look = new BoundaryTimer(deps, LOOK_MS, () => this.#lookAll())
  }

  /** The ids being followed now, sorted (the diagnostics' `watching`). */
  watching(): string[] {
    return [...this.#sources.values()]
      .filter((source) => source.awake)
      .map((source) => source.id)
      .sort()
  }

  subscribe(page: P, request: LogSubscribeRequest): void {
    const source = this.#source(request.id)
    if (source === null) {
      const key = keyOf(request.id, request.encoding)
      this.#deps.send(page, { key, reset: true, items: [], status: unknownStatus() })
      return
    }
    let channel = source.channels.get(request.encoding)
    if (channel === undefined) {
      channel = this.#channel(source, request.encoding)
      source.channels.set(request.encoding, channel)
    }
    channel.pages.add(page)
    channel.waiting.set(page, { since: request.since, told: '' })
    this.#wake(source)
    void this.#queue(source, () => this.#catchUp(source))
  }

  unsubscribe(page: P, id: string, encoding: LogEncodingChoice): void {
    const source = this.#sources.get(id)
    const channel = source?.channels.get(encoding)
    if (source === undefined || channel === undefined) return
    channel.pages.delete(page)
    channel.waiting.delete(page)
    this.#settle(source)
  }

  /** A page went (reload, close): out of everything. */
  dropPage(page: P): void {
    for (const source of [...this.#sources.values()]) {
      for (const channel of source.channels.values()) {
        channel.pages.delete(page)
        channel.waiting.delete(page)
      }
      this.#settle(source)
    }
  }

  /** Reads the file again from its end in every encoding shown: its dialect was changed. */
  reload(id: string): void {
    const source = this.#sources.get(id)
    if (source === undefined) return
    const entry = this.#deps.entry(id)
    if (entry !== null) source.entry = entry
    for (const [choice, channel] of source.channels) {
      if (channel.pages.size === 0) {
        source.channels.delete(choice)
        continue
      }
      const next = this.#channel(source, choice)
      for (const page of channel.pages) {
        next.pages.add(page)
        next.waiting.set(page, { since: -1, told: '' })
      }
      source.channels.set(choice, next)
    }
    void this.#queue(source, () => this.#catchUp(source))
  }

  /**
   * The lines chosen for EXPLAIN, by number, and only those; null when any of them is no longer
   * held (sending the rest would send other than what was chosen).
   */
  lines(id: string, encoding: LogEncodingChoice, seqs: readonly number[]): LogLine[] | null {
    const channel = this.#sources.get(id)?.channels.get(encoding)
    if (channel === undefined || channel.reader === null) return null
    const wanted = new Set(seqs)
    const found = channel.items.filter(
      (item): item is LogLine => item.kind === 'line' && wanted.has(item.seq),
    )
    return found.length === wanted.size ? found : null
  }

  /** Once every read queued so far is done (the tests' wait). */
  async settled(): Promise<void> {
    await Promise.all([...this.#sources.values()].map((source) => source.busy))
  }

  dispose(): void {
    this.#disposed = true
    this.#deliver.stop()
    this.#look.stop()
    for (const source of this.#sources.values()) this.#stopWatching(source)
    this.#sources.clear()
  }

  /* ---- Sources and channels ---- */

  #source(id: string): Source<P> | null {
    const known = this.#sources.get(id)
    const entry = this.#deps.entry(id)
    if (entry === null) {
      if (known !== undefined) this.#forget(known)
      return null
    }
    if (known !== undefined) {
      known.entry = entry
      return known
    }
    const source: Source<P> = {
      id,
      entry,
      file: entry.pattern === null ? entry.path : null,
      facts: null,
      offset: null,
      head: new Uint8Array(),
      state: 'reading',
      problem: null,
      channels: new Map(),
      awake: false,
      watcher: null,
      settle: null,
      looks: 0,
      busy: Promise.resolve(),
      dormantSince: null,
      read: 0,
      lastByte: null,
    }
    this.#sources.set(id, source)
    return source
  }

  #channel(source: Source<P>, choice: LogEncodingChoice): Channel<P> {
    const encoding: LogEncoding = choice === 'auto' ? 'utf-8' : choice
    return {
      key: keyOf(source.id, choice),
      choice,
      encoding,
      reader: null,
      decoder: new TextDecoder(encoding),
      items: [],
      held: 0,
      sentSeq: -1,
      pages: new Set(),
      waiting: new Map(),
      sample: null,
      fed: false,
      bad: 0,
      chars: 0,
      sentStatus: '',
    }
  }

  /**
   * A pane shows it: watching, and reading what was written while none did - it comes as the
   * latest lines, as any others (user decision 2026-10-12: no banner of its own).
   */
  #wake(source: Source<P>): void {
    if (source.awake) return
    source.awake = true
    const wasHidden = source.dormantSince !== null
    source.dormantSince = null
    const folder =
      source.entry.pattern === null ? this.#deps.fs.dirname(source.entry.path) : source.entry.path
    const name = source.entry.pattern === null ? this.#deps.fs.basename(source.entry.path) : null
    // A file is watched through its folder: a rotation replaces the file a watch would be on.
    source.watcher = this.#deps.fs.watch(folder, (changed) => this.#heard(source, name, changed))
    this.#deliver.start()
    this.#look.start()
    if (wasHidden && source.offset !== null) void this.#queue(source, () => this.#pull(source))
  }

  /** No pane shows it any more: it stops watching, keeping its place. */
  #settle(source: Source<P>): void {
    for (const [choice, channel] of source.channels) {
      if (channel.pages.size === 0 && channel.reader === null) source.channels.delete(choice)
    }
    const shown = [...source.channels.values()].some((channel) => channel.pages.size > 0)
    if (shown || !source.awake) return
    this.#stopWatching(source)
    source.awake = false
    source.dormantSince = this.#deps.now()
    this.#trimDormant()
    if (this.watching().length === 0) {
      this.#deliver.stop()
      this.#look.stop()
    }
  }

  #stopWatching(source: Source<P>): void {
    source.watcher?.close()
    source.watcher = null
    if (source.settle !== null) this.#deps.clearTimer(source.settle)
    source.settle = null
  }

  #forget(source: Source<P>): void {
    this.#stopWatching(source)
    this.#sources.delete(source.id)
  }

  #trimDormant(): void {
    const dormant = [...this.#sources.values()]
      .filter((source) => !source.awake)
      .sort((a, b) => (b.dormantSince ?? 0) - (a.dormantSince ?? 0))
    for (const source of dormant.slice(DORMANT_KEPT)) this.#forget(source)
  }

  /**
   * A change in the folder watched. A file's own name, or any name when the system gives none,
   * is read; for a pattern, a matching name other than the file being read may be a newer file,
   * and only then is the folder listed again - an append to the file itself is not a reason to.
   */
  #heard(source: Source<P>, name: string | null, changed: string | null): void {
    const { pattern } = source.entry
    if (pattern === null) {
      if (name !== null && changed !== null && changed.toLowerCase() !== name.toLowerCase()) return
    } else {
      const current = source.file === null ? null : this.#deps.fs.basename(source.file)
      const other = changed === null || changed.toLowerCase() !== current?.toLowerCase()
      if (other && (changed === null || matchesPattern(changed, pattern))) source.looks = 0
      else if (other) return
    }
    this.#changed(source)
  }

  #changed(source: Source<P>): void {
    if (source.settle !== null || !source.awake) return
    source.settle = this.#deps.setTimer(() => {
      source.settle = null
      void this.#queue(source, () => this.#pull(source))
    }, SETTLE_MS)
  }

  #queue(source: Source<P>, step: () => Promise<void>): Promise<void> {
    source.busy = source.busy.then(step).catch((error: unknown) => {
      source.state = 'error'
      source.problem = error instanceof Error ? error.message : String(error)
    })
    return source.busy
  }

  /* ---- Reading ---- */

  /** A pattern's newest match, the folder listed again now and then. */
  async #locate(source: Source<P>): Promise<void> {
    const { pattern, path: folder } = source.entry
    if (pattern === null) return
    if (source.file !== null && source.looks++ % RESCAN_LOOKS !== 0) return
    const names = await this.#deps.fs.list(folder)
    let newest: { file: string; mtime: number } | null = null
    // Names written with a date or a count sort the newest last: past 2000 matches, the last
    // 2000 by name are the ones looked at.
    const matching = (names ?? [])
      .filter((n) => matchesPattern(n, pattern))
      .sort()
      .slice(-2000)
    for (const name of matching) {
      const file = this.#deps.fs.join(folder, name)
      const facts = await this.#deps.fs.stat(file)
      // Names go in order, so of two written in the same moment the later name is taken.
      if (isFacts(facts) && (newest === null || facts.mtime >= newest.mtime)) {
        newest = { file, mtime: facts.mtime }
      }
    }
    // Listed now: the next listing is due after RESCAN_LOOKS looks, or a name heard in the folder.
    source.looks = 1
    const next = newest?.file ?? null
    if (next === source.file) return
    const before = source.file
    source.file = next
    if (before === null || next === null || source.offset === null) return
    // Another file: read from its start, said in the stream.
    source.offset = 0
    source.facts = null
    source.lastByte = null
    const name = this.#deps.fs.basename(next)
    this.#restartAll(source, (reader) =>
      reader.mark({ kind: 'mark', at: this.#deps.now(), mark: 'switched', name }),
    )
  }

  /** The file's facts now, setting the state the pages are told. */
  async #stat(source: Source<P>): Promise<FileFacts | null> {
    await this.#locate(source)
    if (source.file === null) {
      source.state = 'waiting'
      source.problem = `nothing matches ${source.entry.pattern ?? ''}`
      return null
    }
    const result = await this.#deps.fs.stat(source.file)
    if (isFacts(result)) {
      source.state = 'reading'
      source.problem = null
      return result
    }
    if ('missing' in result) {
      source.state = 'waiting'
      source.problem = null
    } else if ('denied' in result) {
      source.state = 'denied'
      source.problem = 'this user may not read the file'
    } else {
      source.state = 'error'
      source.problem = result.failed
    }
    return null
  }

  /** Brings the pages waiting up to date, opening the channels not yet open where it can. */
  async #catchUp(source: Source<P>): Promise<void> {
    if (this.#disposed) return
    await this.#openWaiting(source)
    for (const channel of source.channels.values()) {
      for (const [page, wait] of channel.waiting) this.#tell(source, channel, page, wait)
    }
  }

  /** Opens the channels a page shows that are not open yet, if the file is there. */
  async #openWaiting(source: Source<P>): Promise<void> {
    const opening = [...source.channels.values()].filter(
      (channel) => channel.reader === null && channel.pages.size > 0,
    )
    if (opening.length === 0) return
    const facts = await this.#stat(source)
    const file = source.file
    if (facts === null || file === null) return
    if (source.offset === null) {
      source.offset = facts.size
      source.facts = facts
      source.lastByte =
        facts.size > 0 ? ((await this.#deps.fs.read(file, facts.size - 1, 1))[0] ?? null) : null
    }
    source.head = await this.#deps.fs.read(file, 0, 4)
    for (const channel of opening) await this.#open(source, file, channel)
  }

  /**
   * A waiting page: what it lacks once its channel is open; until then the state alone, each time
   * it changes for that page - every page is told, not only the first to wait.
   */
  #tell(source: Source<P>, channel: Channel<P>, page: P, wait: Waiting): void {
    const status = this.#status(source, channel)
    const said = JSON.stringify(status)
    if (channel.reader === null) {
      if (said === wait.told) return
      wait.told = said
      this.#deps.send(page, { key: channel.key, reset: true, items: [], status })
      return
    }
    channel.waiting.delete(page)
    // Marked as sent only when no other page follows: one that does has not been told this state
    // yet, and the next delivery must tell it (found in review: a state changed in the same beat
    // a second page came was never sent to the first).
    const following = [...channel.pages].some((p) => p !== page && !channel.waiting.has(p))
    if (!following) channel.sentStatus = said
    this.#deps.send(page, { key: channel.key, ...this.#since(channel, wait.since), status })
  }

  /**
   * What a page holding up to `since` lacks: the rest, or everything when it holds a gap - of
   * what has been delivered. What has not is left to the next delivery, which every page gets.
   */
  #since(channel: Channel<P>, since: number): { reset: boolean; items: LogItem[] } {
    const sent = channel.items.filter((item) => item.seq <= channel.sentSeq)
    const first = channel.items[0]
    const last = channel.items.at(-1)
    const continues =
      since >= 0 &&
      first !== undefined &&
      last !== undefined &&
      first.seq <= since + 1 &&
      last.seq >= since
    return continues
      ? { reset: false, items: sent.filter((item) => item.seq > since) }
      : { reset: true, items: sent }
  }

  /** The opening: the last lines of the file, read back from where the source is. */
  async #open(source: Source<P>, file: string, channel: Channel<P>): Promise<void> {
    const end = source.offset ?? 0
    const want = this.#deps.initialLines()
    let start = end
    let breaks = 0
    while (start > 0 && breaks <= want && end - start < LOG_LIMITS.tailBytes) {
      const from = Math.max(0, start - BACK_STEP)
      breaks += countBreaks(await this.#deps.fs.read(file, from, start - from))
      start = from
    }
    const bytes = await this.#deps.fs.read(file, start, end - start)
    const now = this.#deps.now()
    if (countBreaks(bytes) === 0 && start === 0) {
      // Nothing to judge by yet: a reader in waiting, and the bytes kept until there is.
      channel.reader = new LogReader(source.entry.format ?? 'plain', this.#takeSeqs())
      channel.sample = bytes.slice()
      this.#hold(channel, [
        channel.reader.mark({ kind: 'mark', at: now, mark: 'opened', lines: 0 }),
      ])
      return
    }
    if (channel.choice === 'auto') channel.encoding = detectEncoding(source.head, bytes)
    channel.decoder = new TextDecoder(channel.encoding)
    const body = bytes.subarray(lineStart(bytes, start === 0, channel.encoding, start))
    const text = channel.decoder.decode(body, { stream: true })
    const format = source.entry.format ?? detectFormat(splitLines(text).lines, now)
    const reader = new LogReader(format, this.#takeSeqs())
    channel.reader = reader
    this.#count(channel, text)
    const lines = [...reader.read(text, now, true), ...reader.flush()].slice(-want)
    this.#hold(channel, [
      ...lines,
      reader.mark({ kind: 'mark', at: now, mark: 'opened', lines: lines.length }),
    ])
    source.read += body.length
  }

  /** The opening's items, all counted as sent: pages get them as they are brought up to date. */
  #hold(channel: Channel<P>, items: LogItem[]): void {
    channel.items = items
    channel.held = items.reduce((sum, item) => sum + charsOf(item), 0)
    channel.sentSeq = items.at(-1)?.seq ?? -1
    this.#trim(channel)
  }

  #takeSeqs(): number {
    const first = this.#nextSeq
    this.#nextSeq += SEQ_ROOM
    return first
  }

  /**
   * A channel opened on a file with no line: once enough has come (`force`: or it went quiet
   * with a line), the encoding and the dialect are judged on it and it is read as it would have
   * been from the start.
   */
  #judge(source: Source<P>, channel: Channel<P>, force: boolean): void {
    const sample = channel.sample
    const reader = channel.reader
    if (sample === null || reader === null) return
    const lines = countBreaks(sample)
    // Without a break it waits only until JUDGE_BYTES: a tool writing progress with \r alone would
    // otherwise grow the sample with the file, copied whole at every read.
    if (sample.length < JUDGE_BYTES && (lines === 0 || (!force && lines < JUDGE_LINES))) return
    channel.sample = null
    if (channel.choice === 'auto') {
      channel.encoding = detectEncoding(source.head.length > 0 ? source.head : sample, sample)
    }
    channel.decoder = new TextDecoder(channel.encoding)
    const text = channel.decoder.decode(sample, { stream: true })
    const now = this.#deps.now()
    const format = source.entry.format ?? detectFormat(splitLines(text).lines, now)
    const judged = new LogReader(format, reader.nextSeq)
    channel.reader = judged
    this.#count(channel, text)
    for (const line of judged.read(text, now, false)) this.#emit(channel, line)
  }

  /** Reads where the file grew, for every channel shown. */
  async #pull(source: Source<P>): Promise<void> {
    if (this.#disposed || !source.awake) return
    this.#dropUnshown(source)
    const facts = await this.#stat(source)
    const file = source.file
    if (facts === null || source.offset === null || file === null) return
    if (facts.size === source.offset && !this.#replaced(source, facts)) return
    await this.#noticeRotation(source, file, facts)
    source.facts = facts
    const from = source.offset ?? 0
    if (facts.size === from) return
    // Past 4 MB (a long time hidden, or a flood), only the end is read: the latest lines.
    const partial = facts.size - from > LOG_LIMITS.tailBytes
    await this.#readRange(
      source,
      file,
      partial ? facts.size - LOG_LIMITS.tailBytes : from,
      facts.size,
      partial,
    )
  }

  /** A channel nobody shows misses what is read now: it opens afresh when shown again. */
  #dropUnshown(source: Source<P>): void {
    for (const [choice, channel] of source.channels) {
      if (channel.pages.size === 0) source.channels.delete(choice)
    }
  }

  /**
   * A file replaced (another identity), cut short, or cut and written past where it was
   * (the byte before that place changed): read again from its start, said in the stream.
   */
  async #noticeRotation(source: Source<P>, file: string, facts: FileFacts): Promise<void> {
    const offset = source.offset ?? 0
    let rewritten = this.#replaced(source, facts) || facts.size < offset
    if (!rewritten && offset > 0 && source.lastByte !== null) {
      const probe = await this.#deps.fs.read(file, offset - 1, 1)
      rewritten = probe[0] !== source.lastByte
    }
    if (!rewritten) return
    source.offset = 0
    source.lastByte = null
    this.#restartAll(source, (reader) =>
      reader.mark({ kind: 'mark', at: this.#deps.now(), mark: 'rotated' }),
    )
  }

  #replaced(source: Source<P>, facts: FileFacts): boolean {
    const before = source.facts
    return before !== null && (facts.ino !== before.ino || facts.birth !== before.birth)
  }

  /**
   * Reads `start` to `end` a chunk at a time into every channel shown; `inside` when `start`
   * is not where the last read ended, so the reading starts at the first whole line, with nothing
   * of before. Answers where it stopped.
   */
  async #readRange(
    source: Source<P>,
    file: string,
    start: number,
    end: number,
    inside: boolean,
  ): Promise<void> {
    let at = start
    while (at < end) {
      const chunk = await this.#deps.fs.read(file, at, Math.min(LOG_LIMITS.chunkBytes, end - at))
      if (chunk.length === 0) break
      if (at === start && inside) {
        this.#shown(source, (channel, reader) => this.#restart(channel, reader))
        // Each channel from the first whole line in its own encoding: UTF-16 breaks lie on even places.
        this.#feed(source, chunk, (channel) => lineStart(chunk, false, channel.encoding, at))
      } else {
        this.#feed(source, chunk, () => 0)
      }
      at += chunk.length
      // Moved on chunk by chunk, not when the range is done: a read failing midway (the file
      // locked a moment on Windows) would otherwise read again what was already sent.
      source.offset = at
      source.read += chunk.length
      source.lastByte = chunk[chunk.length - 1] ?? source.lastByte
    }
  }

  /** Bytes to every channel shown, each from where `from` says it starts. */
  #feed(source: Source<P>, bytes: Uint8Array, from: (channel: Channel<P>) => number): void {
    const now = this.#deps.now()
    this.#shown(source, (channel, reader) => {
      const own = bytes.subarray(from(channel))
      channel.fed = true
      if (channel.sample !== null) {
        const joined = new Uint8Array(channel.sample.length + own.length)
        joined.set(channel.sample)
        joined.set(own, channel.sample.length)
        channel.sample = joined
        this.#judge(source, channel, false)
        return
      }
      const text = channel.decoder.decode(own, { stream: true })
      this.#count(channel, text)
      for (const line of reader.read(text, now, false)) this.#emit(channel, line)
    })
  }

  /** Every channel shown starts its reading afresh, after a mark saying why. */
  #restartAll(source: Source<P>, mark: (reader: LogReader) => LogItem): void {
    this.#shown(source, (channel, reader) => {
      this.#restart(channel, reader)
      this.#emit(channel, mark(reader))
    })
  }

  /**
   * A channel's reading starts afresh (another file, or a place inside it): the open entry is
   * complete, the half line and the decoder's half character are forgotten, and so are the bytes
   * of a file not yet judged - they were the old file's, or from before a gap.
   */
  #restart(channel: Channel<P>, reader: LogReader): void {
    for (const line of reader.flush()) this.#emit(channel, line)
    reader.restart()
    channel.decoder = new TextDecoder(channel.encoding)
    if (channel.sample !== null) channel.sample = new Uint8Array()
  }

  #shown(source: Source<P>, run: (channel: Channel<P>, reader: LogReader) => void): void {
    for (const channel of source.channels.values()) {
      if (channel.reader !== null && channel.pages.size > 0) run(channel, channel.reader)
    }
  }

  #emit(channel: Channel<P>, item: LogItem): void {
    channel.items.push(item)
    channel.held += charsOf(item)
    this.#trim(channel)
  }

  #trim(channel: Channel<P>): void {
    channel.held = trimHeld(channel.items, this.#deps.keepLines(), channel.held)
  }

  #count(channel: Channel<P>, text: string): void {
    // Halved now and then, so what came long ago does not outvote what comes now.
    if (channel.chars > 1_000_000) {
      channel.chars /= 2
      channel.bad /= 2
    }
    channel.chars += text.length
    channel.bad += badChars(text)
  }

  #status(source: Source<P>, channel: Channel<P>): LogStatus {
    return {
      state: source.state,
      problem: source.problem,
      file: source.file === null ? null : this.#deps.fs.basename(source.file),
      format: channel.reader?.format ?? source.entry.format ?? 'plain',
      encoding: channel.encoding,
      garbled: looksGarbled(channel.bad, channel.chars),
      read: source.read,
    }
  }

  /* ---- On the grid ---- */

  #lookAll(): void {
    for (const source of this.#sources.values()) {
      if (!source.awake) continue
      const unopened = [...source.channels.values()].some(
        (channel) => channel.reader === null && channel.pages.size > 0,
      )
      void this.#queue(source, () => (unopened ? this.#catchUp(source) : this.#pull(source)))
    }
  }

  #deliverAll(): void {
    for (const source of this.#sources.values()) {
      if (!source.awake) continue
      for (const channel of source.channels.values()) this.#deliverChannel(source, channel)
    }
  }

  #deliverChannel(source: Source<P>, channel: Channel<P>): void {
    if (channel.reader === null || channel.pages.size === 0) return
    // With every page still waiting, nothing is delivered: each gets it all when brought up to date.
    if (channel.waiting.size === channel.pages.size) return
    // What is held follows the setting at once, even with nothing new (the setting was lowered).
    this.#trim(channel)
    if (!channel.fed) {
      // A file opened empty, gone quiet with a line: judged on what there is.
      this.#judge(source, channel, true)
      // An entry that took no line in a whole beat is complete.
      for (const line of channel.reader.flush()) this.#emit(channel, line)
    }
    channel.fed = false
    const status = this.#status(source, channel)
    const said = JSON.stringify(status)
    let first = channel.items.length
    while (first > 0 && (channel.items[first - 1]?.seq ?? -1) > channel.sentSeq) first--
    const items = channel.items.slice(first)
    if (items.length === 0 && said === channel.sentStatus) return
    const event: LogWatchEvent = { key: channel.key, reset: false, items, status }
    channel.sentSeq = items.at(-1)?.seq ?? channel.sentSeq
    channel.sentStatus = said
    for (const page of channel.pages) if (!channel.waiting.has(page)) this.#deps.send(page, event)
  }
}

function unknownStatus(): LogStatus {
  return {
    state: 'unknown',
    problem: null,
    file: null,
    format: 'plain',
    encoding: 'utf-8',
    garbled: false,
    read: 0,
  }
}
