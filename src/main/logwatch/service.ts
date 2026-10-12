import { badChars, detectEncoding, looksGarbled } from '@shared/logwatch/encoding'
import { countBreaks, lineStart, matchesPattern } from '@shared/logwatch/files'
import { detectFormat } from '@shared/logwatch/formats'
import { LogReader, splitLines } from '@shared/logwatch/reader'
import {
  keyOf,
  LOG_LIMITS,
  type LogEncoding,
  type LogEncodingChoice,
  type LogFormat,
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
  items: LogItem[]
  /** Read, and not yet sent. */
  outbox: LogItem[]
  pages: Set<P>
  /** Pages to be brought up to date. */
  waiting: Map<P, Waiting>
  /** Bytes held until there is enough to judge the encoding and the dialect by; null once judged. */
  sample: Uint8Array | null
  /**
   * What came while no pane showed the file, counted as it is read (after the number set aside for
   * the banner): the lines kept may be fewer than came.
   */
  tally: { after: number; lines: number; err: number; warn: number; fresh: number } | null
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
  /**
   * Reading what came while no pane showed it: nothing is delivered until the banner that sums it
   * up is in place, so what was read before the banner never goes out ahead of it.
   */
  gathering: boolean
  /** When the last pane went; null while one shows it or before any did. */
  dormantSince: number | null
  read: number
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

  /** The line and the lines before it, for EXPLAIN; null when it is no longer held. */
  context(
    id: string,
    encoding: LogEncodingChoice,
    seq: number,
  ): { target: LogLine; before: LogLine[]; file: string; format: LogFormat } | null {
    const source = this.#sources.get(id)
    const channel = source?.channels.get(encoding)
    const reader = channel?.reader ?? null
    if (source === undefined || channel === undefined || reader === null) return null
    const at = channel.items.findIndex((item) => item.seq === seq)
    const target = channel.items[at]
    if (target === undefined || target.kind !== 'line') return null
    const before = channel.items
      .slice(0, at)
      .filter((item): item is LogLine => item.kind === 'line')
      .slice(-LOG_LIMITS.explainBefore)
    const file = this.#deps.fs.basename(source.file ?? source.entry.path)
    return { target, before, file, format: reader.format }
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
      gathering: false,
      dormantSince: null,
      read: 0,
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
      outbox: [],
      pages: new Set(),
      waiting: new Map(),
      sample: null,
      tally: null,
      fed: false,
      bad: 0,
      chars: 0,
      sentStatus: '',
    }
  }

  /** A pane shows it: watching, and reading what was written while none did. */
  #wake(source: Source<P>): void {
    if (source.awake) return
    source.awake = true
    const away = source.dormantSince
    source.dormantSince = null
    const folder =
      source.entry.pattern === null ? this.#deps.fs.dirname(source.entry.path) : source.entry.path
    const name = source.entry.pattern === null ? this.#deps.fs.basename(source.entry.path) : null
    // A file is watched through its folder: a rotation replaces the file a watch would be on.
    source.watcher = this.#deps.fs.watch(folder, (changed) => this.#heard(source, name, changed))
    this.#deliver.start()
    this.#look.start()
    if (away !== null && source.offset !== null) {
      void this.#queue(source, () => this.#pull(source, away))
    }
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
      void this.#queue(source, () => this.#pull(source, null))
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
    channel.sentStatus = said
    this.#deps.send(page, { key: channel.key, ...this.#since(channel, wait.since), status })
  }

  /**
   * What a page holding up to `since` lacks: the rest, or everything when it holds a gap. The
   * outbox - always the end of the items - is left to the next delivery, which every page gets.
   */
  #since(channel: Channel<P>, since: number): { reset: boolean; items: LogItem[] } {
    const sent = channel.items.slice(0, channel.items.length - channel.outbox.length)
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
    channel.outbox = []
    if (countBreaks(bytes) === 0 && start === 0) {
      // Nothing to judge by yet: a reader in waiting, and the bytes kept until there is.
      channel.reader = new LogReader(source.entry.format ?? 'plain', this.#takeSeqs())
      channel.sample = bytes.slice()
      channel.items = [channel.reader.mark({ kind: 'mark', at: now, mark: 'opened', lines: 0 })]
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
    channel.items = [
      ...lines,
      reader.mark({ kind: 'mark', at: now, mark: 'opened', lines: lines.length }),
    ]
    this.#trim(channel)
    source.read += body.length
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
    if (lines === 0 || (!force && lines < JUDGE_LINES && sample.length < JUDGE_BYTES)) return
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

  /** Reads where the file grew, for every channel shown; `away` when coming back to it. */
  async #pull(source: Source<P>, away: number | null): Promise<void> {
    if (this.#disposed || !source.awake) return
    // A channel nobody shows misses what is read now: it opens afresh when shown again.
    for (const [choice, channel] of source.channels) {
      if (channel.pages.size === 0) source.channels.delete(choice)
    }
    const facts = await this.#stat(source)
    const file = source.file
    if (facts === null || source.offset === null || file === null) return
    this.#noticeRotation(source, facts)
    source.facts = facts
    const from = source.offset ?? 0
    if (facts.size === from) return
    const partial = facts.size - from > LOG_LIMITS.tailBytes
    const reserved = new Map<Channel<P>, number>()
    if (away !== null) {
      this.#shown(source, (channel, reader) => {
        const after = reader.reserve()
        reserved.set(channel, after)
        channel.tally = { after, lines: 0, err: 0, warn: 0, fresh: 0 }
      })
    }
    source.gathering = away !== null
    try {
      source.offset = await this.#readRange(
        source,
        file,
        partial ? facts.size - LOG_LIMITS.tailBytes : from,
        facts.size,
        partial,
      )
      if (away !== null) this.#markAway(source, reserved, away, partial)
    } finally {
      source.gathering = false
      for (const channel of source.channels.values()) channel.tally = null
    }
  }

  /** A file replaced (another identity) or cut short: read again from its start, said in the stream. */
  #noticeRotation(source: Source<P>, facts: FileFacts): void {
    const before = source.facts
    const replaced = before !== null && (facts.ino !== before.ino || facts.birth !== before.birth)
    if (!replaced && facts.size >= (source.offset ?? 0)) return
    source.offset = 0
    this.#restartAll(source, (reader) =>
      reader.mark({ kind: 'mark', at: this.#deps.now(), mark: 'rotated' }),
    )
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
  ): Promise<number> {
    let at = start
    while (at < end) {
      const chunk = await this.#deps.fs.read(file, at, Math.min(LOG_LIMITS.chunkBytes, end - at))
      if (chunk.length === 0) break
      if (at === start && inside) {
        this.#shown(source, (channel, reader) => {
          for (const line of reader.flush()) this.#emit(channel, line)
          reader.restart()
          channel.decoder = new TextDecoder(channel.encoding)
        })
        // Each channel from the first whole line in its own encoding: UTF-16 breaks lie on even places.
        this.#feed(source, chunk, (channel) => lineStart(chunk, false, channel.encoding, at))
      } else {
        this.#feed(source, chunk, () => 0)
      }
      at += chunk.length
      source.read += chunk.length
    }
    return at
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

  /** What came while no pane showed the file, said once before it, where anything came. */
  #markAway(
    source: Source<P>,
    reserved: Map<Channel<P>, number>,
    from: number,
    partial: boolean,
  ): void {
    const now = this.#deps.now()
    this.#shown(source, (channel, reader) => {
      const seq = reserved.get(channel)
      if (seq === undefined) return
      // The open entry is part of what came: given up now, it is counted with the rest.
      for (const line of reader.flush()) this.#emit(channel, line)
      channel.fed = false
      const tally = channel.tally
      if (tally === null || tally.lines === 0) return
      const mark: LogItem = {
        kind: 'mark',
        seq,
        at: now,
        mark: 'away',
        from,
        lines: tally.lines,
        err: tally.err,
        warn: tally.warn,
        fresh: tally.fresh,
        partial,
      }
      insertBySeq(channel.items, mark)
      insertBySeq(channel.outbox, mark)
    })
  }

  /** Every channel shown starts its reading afresh, after a mark saying why. */
  #restartAll(source: Source<P>, mark: (reader: LogReader) => LogItem): void {
    this.#shown(source, (channel, reader) => {
      for (const line of reader.flush()) this.#emit(channel, line)
      reader.restart()
      channel.decoder = new TextDecoder(channel.encoding)
      this.#emit(channel, mark(reader))
    })
  }

  #shown(source: Source<P>, run: (channel: Channel<P>, reader: LogReader) => void): void {
    for (const channel of source.channels.values()) {
      if (channel.reader !== null && channel.pages.size > 0) run(channel, channel.reader)
    }
  }

  #emit(channel: Channel<P>, item: LogItem): void {
    const tally = channel.tally
    if (tally !== null && item.kind === 'line' && item.seq > tally.after) {
      tally.lines++
      if (item.level === 'ERR' || item.level === 'FTL') tally.err++
      if (item.level === 'WRN') tally.warn++
      if (item.fresh) tally.fresh++
    }
    channel.items.push(item)
    channel.outbox.push(item)
    this.#trim(channel)
  }

  #trim(channel: Channel<P>): void {
    const keep = this.#deps.keepLines()
    trimFront(channel.items, keep)
    trimFront(channel.outbox, keep)
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
      void this.#queue(source, () => (unopened ? this.#catchUp(source) : this.#pull(source, null)))
    }
  }

  #deliverAll(): void {
    for (const source of this.#sources.values()) {
      if (!source.awake || source.gathering) continue
      for (const channel of source.channels.values()) this.#deliverChannel(source, channel)
    }
  }

  #deliverChannel(source: Source<P>, channel: Channel<P>): void {
    if (channel.reader === null || channel.pages.size === 0) return
    // Pages still waiting get all of it when they are brought up to date: the outbox is kept, so
    // it stays the end of the items and nothing goes to nobody.
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
    if (channel.outbox.length === 0 && said === channel.sentStatus) return
    const event: LogWatchEvent = { key: channel.key, reset: false, items: channel.outbox, status }
    channel.outbox = []
    channel.sentStatus = said
    for (const page of channel.pages) if (!channel.waiting.has(page)) this.#deps.send(page, event)
  }
}

/**
 * Drops the oldest items past `keep` - but a banner of what came while hidden, once it is the
 * oldest, stays: what it sums up is often more than the lines kept.
 */
function trimFront(items: LogItem[], keep: number): void {
  const over = items.length - keep
  if (over <= 0) return
  const lead = items[0]
  if (lead?.kind === 'mark' && lead.mark === 'away' && items.length > 1) items.splice(1, over)
  else items.splice(0, over)
}

/** Puts an item among others in the order of their numbers. */
function insertBySeq(items: LogItem[], item: LogItem): void {
  const at = items.findIndex((other) => other.seq > item.seq)
  if (at < 0) items.push(item)
  else items.splice(at, 0, item)
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
