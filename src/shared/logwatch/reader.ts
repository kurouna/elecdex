import {
  type FormatState,
  formatState,
  isStackLine,
  parseHead,
  plainHead,
  STARTS_WITH_TIME,
} from './formats.js'
import { signature } from './text.js'
import { LOG_LIMITS, type LogFormat, type LogLine, type LogMark } from './types.js'

/**
 * Text decoded from a log, turned into entries (docs/logwatch.md §5). One reader follows one
 * file in one encoding; it keeps the half line a read ended in, the entry still taking
 * continuation lines, the count its entries are numbered by, and the patterns it has seen.
 * Pure: the time comes in with each call.
 */

/** Patterns seen, the least recently seen forgotten first. */
export class PatternMemory {
  readonly #seen = new Map<string, true>()
  readonly #max: number

  constructor(max: number = LOG_LIMITS.patterns) {
    this.#max = max
  }

  /** Remembers a pattern; true when it was not known. */
  see(sig: string): boolean {
    const known = this.#seen.delete(sig)
    this.#seen.set(sig, true)
    if (!known && this.#seen.size > this.#max) {
      const oldest = this.#seen.keys().next().value
      if (oldest !== undefined) this.#seen.delete(oldest)
    }
    return !known
  }

  get size(): number {
    return this.#seen.size
  }
}

/** A text's complete lines, and the unfinished one it ends in. */
export function splitLines(text: string): { lines: string[]; rest: string } {
  const parts = text.split('\n')
  const rest = parts.pop() ?? ''
  return { lines: parts.map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line)), rest }
}

export class LogReader {
  readonly format: LogFormat
  readonly #state: FormatState
  readonly #patterns = new PatternMemory()
  #rest = ''
  /** Dropping a too-long line's tail until its end. */
  #skipping = false
  #pending: LogLine | null = null
  #nextSeq: number

  constructor(format: LogFormat, firstSeq = 0) {
    this.format = format
    this.#state = formatState(format)
    this.#nextSeq = firstSeq
  }

  /** The number the next item will carry. */
  get nextSeq(): number {
    return this.#nextSeq
  }

  /** A number set aside now for an item made later, to sit before the lines read meanwhile. */
  reserve(): number {
    return this.#nextSeq++
  }

  /** A mark in the stream, numbered with the lines. */
  mark<M extends Omit<LogMark, 'seq'>>(mark: M): M & { seq: number } {
    return { ...mark, seq: this.#nextSeq++ }
  }

  /**
   * Reads decoded text. Answers the entries that are complete - a following line began
   * another - and keeps the last one open for continuation lines.
   *
   * `learning`: lines read to fill the screen on opening. Their patterns are remembered but
   * none is called new: everything would be, the first time.
   */
  read(text: string, now: number, learning: boolean): LogLine[] {
    const done: LogLine[] = []
    const { lines, rest } = splitLines(this.#rest + text)
    for (const line of lines) {
      if (this.#skipping) {
        this.#skipping = false
        continue
      }
      const cut = line.length > LOG_LIMITS.lineChars
      this.#line(cut ? line.slice(0, LOG_LIMITS.lineChars) : line, cut, now, learning, done)
    }
    this.#rest = rest
    if (this.#rest.length > LOG_LIMITS.lineChars) {
      this.#line(this.#rest.slice(0, LOG_LIMITS.lineChars), true, now, learning, done)
      this.#rest = ''
      this.#skipping = true
    }
    return done
  }

  /** The entry still open, given up for good: nothing came for it within a beat. */
  flush(): LogLine[] {
    const pending = this.#pending
    this.#pending = null
    return pending === null ? [] : [pending]
  }

  /** Forgets the half line and the open entry: the file was replaced. */
  restart(): void {
    this.#rest = ''
    this.#skipping = false
    this.#pending = null
  }

  #line(line: string, cut: boolean, now: number, learning: boolean, done: LogLine[]): void {
    if (line.trim() === '') return
    const pending = this.#pending
    if (pending !== null && isStackLine(line, pending.more.length > 0)) {
      this.#continue(pending, line)
      return
    }
    const head = parseHead(line, this.#state, now)
    if (head === 'skip') return
    if (head === null && pending !== null && STARTS_WITH_TIME.has(this.format)) {
      this.#continue(pending, line)
      return
    }
    const read = head ?? plainHead(line)
    if (pending !== null) done.push(pending)
    const sig = signature(read.level, read.source, read.text)
    const fresh = this.#patterns.see(sig) && !learning
    this.#pending = {
      kind: 'line',
      seq: this.#nextSeq++,
      at: read.at ?? now,
      timed: read.at !== null,
      zoned: read.zoned,
      level: read.level,
      source: read.source,
      text: read.text.slice(0, LOG_LIMITS.textChars),
      fields: read.fields,
      more: [],
      moreCut: 0,
      raw: line.slice(0, LOG_LIMITS.rawChars),
      sig,
      fresh,
      cut: cut || read.text.length > LOG_LIMITS.textChars,
    }
  }

  #continue(entry: LogLine, line: string): void {
    if (entry.more.length < LOG_LIMITS.moreLines)
      entry.more.push(line.slice(0, LOG_LIMITS.rawChars))
    else entry.moreCut++
  }
}
