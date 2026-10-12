import { maskText, SECRET_NAME, signatureText } from '@shared/logwatch/text'
import {
  ENCODING_NAMES,
  FORMAT_NAMES,
  groupOf,
  isEncodingChoice,
  isLogId,
  LEVEL_GROUP_IDS,
  type LevelGroup,
  LOG_LIMITS,
  type LogEncodingChoice,
  type LogFileRef,
  type LogItem,
  type LogLevel,
  type LogLine,
  type LogMark,
  type LogStatus,
} from '@shared/logwatch/types'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What the LOG WATCH pane shows, decided apart from drawing it (docs/logwatch.md §6): the pane's
 * choices read from its state, the rows the items make under the filter, how tall each row is,
 * the patterns and the card. Pure; the components only draw.
 */

export type TimeMode = 'abs' | 'rel' | 'delta'
export type LogTab = 'stream' | 'patterns'

export interface LogPaneChoices {
  /** The file followed, by main's id. */
  file: string | null
  encoding: LogEncodingChoice
  time: TimeMode
  wrap: boolean
  /** Repeats in a row folded into one (×n). */
  fold: boolean
  /** The five minutes' lanes. */
  chart: boolean
  /** The marks of errors and warnings on the right. */
  errorBar: boolean
  /** Level groups switched off. */
  hidden: LevelGroup[]
  /** Patterns not shown. */
  muted: string[]
  tab: LogTab
  mask: boolean
  /** EXPLAIN's provider and model, as the AI chat pane keeps them. */
  provider: string
  model: string
}

const TIME_MODES: readonly TimeMode[] = ['abs', 'rel', 'delta']

/** The pane's state as choices, every unknown or missing value its default. */
export function readLogPane(state: Record<string, unknown> | undefined): LogPaneChoices {
  const s = state ?? {}
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  return {
    file: isLogId(s.file) ? s.file : null,
    encoding: isEncodingChoice(s.encoding) ? s.encoding : 'auto',
    time: TIME_MODES.includes(s.time as TimeMode) ? (s.time as TimeMode) : 'abs',
    wrap: s.wrap === true,
    fold: s.fold !== false,
    chart: s.chart !== false,
    errorBar: s.errorBar !== false,
    hidden: Array.isArray(s.hidden)
      ? strings(s.hidden).filter((g): g is LevelGroup => (LEVEL_GROUP_IDS as string[]).includes(g))
      : ['DBG'],
    muted: strings(s.muted).slice(0, LOG_LIMITS.muted),
    tab: s.tab === 'patterns' ? 'patterns' : 'stream',
    mask: s.mask === true,
    provider: typeof s.provider === 'string' ? s.provider : '',
    model: typeof s.model === 'string' ? s.model : '',
  }
}

/** A text filter, or `/regex/flags`; a bad expression keeps the last good one. */
export function compileFilter(text: string): { match: RegExp | null; bad: boolean } {
  const trimmed = text.trim()
  if (trimmed === '') return { match: null, bad: false }
  const slashed = /^\/(.+)\/([a-z]*)$/.exec(trimmed)
  try {
    if (slashed !== null) {
      // g and y make test() remember where it stopped: every other line would be missed.
      const flags = (slashed[2] ?? '').replace(/[gy]/g, '')
      return { match: new RegExp(slashed[1] ?? '', flags), bad: false }
    }
    return { match: new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), bad: false }
  } catch {
    return { match: null, bad: true }
  }
}

export interface Row {
  item: LogItem
  /** Lines folded into this row, itself included. */
  reps: number
  /** The latest of them: its time is shown. COPY and EXPLAIN take `item`, the first. */
  last: LogItem
  /** The row's line before, for the time since it. */
  prev: LogLine | null
}

export interface RowFilter {
  hidden: ReadonlySet<LevelGroup>
  muted: ReadonlySet<string>
  match: RegExp | null
  fold: boolean
}

export function shows(line: LogLine, filter: RowFilter): boolean {
  if (filter.hidden.has(groupOf(line.level))) return false
  if (filter.muted.has(line.sig)) return false
  if (filter.match !== null && !filter.match.test(line.text) && !filter.match.test(line.source)) {
    return false
  }
  return true
}

/**
 * The rows of the stream: the lines the filter lets through, a run of one pattern folded into
 * its first line (a NEW one starts its own), and every mark.
 */
export function buildRows(items: readonly LogItem[], filter: RowFilter): Row[] {
  const rows: Row[] = []
  let prev: LogLine | null = null
  for (const item of items) {
    if (item.kind === 'mark') {
      rows.push({ item, reps: 1, last: item, prev: null })
      continue
    }
    if (!shows(item, filter)) continue
    const top = rows.at(-1)
    if (
      filter.fold &&
      top !== undefined &&
      top.item.kind === 'line' &&
      top.item.sig === item.sig &&
      !item.fresh
    ) {
      top.reps++
      top.last = item
    } else {
      rows.push({ item, reps: 1, last: item, prev })
    }
    prev = item
  }
  return rows
}

/** Columns a text takes in a monospaced font: East Asian wide characters take two. */
export function columns(text: string): number {
  let n = 0
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    n +=
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1f300 && code <= 0x1faff) ||
      (code >= 0x20000 && code <= 0x3fffd)
        ? 2
        : 1
  }
  return n
}

/**
 * A line's columns, counted once: the rows are laid out again on every delivery, and counting
 * every character of every line held, four times a second, was the most of it with WRAP on.
 */
const counted = new WeakMap<LogLine, number>()
function columnsOf(line: LogLine): number {
  let n = counted.get(line)
  if (n === undefined) {
    n = columns(line.text)
    counted.set(line, n)
  }
  return n
}

/** Lines a row takes: one, or its text wrapped to `cols`, and its trace when open. */
export function rowLines(row: Row, open: boolean, wrap: boolean, cols: number): number {
  const item = row.item
  if (item.kind === 'mark') return 1
  const own = wrap && cols > 0 ? Math.max(1, Math.ceil(columnsOf(item) / cols)) : 1
  if (!open) return own
  return own + item.more.length + (item.moreCut > 0 ? 1 : 0)
}

/** Each row's top and the whole height, in lines: the virtual list's map. */
export function rowOffsets(heights: readonly number[]): Float64Array {
  const offsets = new Float64Array(heights.length + 1)
  for (let i = 0; i < heights.length; i++) offsets[i + 1] = (offsets[i] ?? 0) + (heights[i] ?? 0)
  return offsets
}

/** The first row whose bottom is below `y` (binary search in `rowOffsets`). */
export function rowAt(offsets: Float64Array, y: number): number {
  let lo = 0
  let hi = offsets.length - 2
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((offsets[mid + 1] ?? 0) <= y) lo = mid + 1
    else hi = mid
  }
  return Math.max(0, lo)
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0')

/** A moment as hours, minutes and seconds. */
export function clockText(at: number): string {
  const t = new Date(at)
  return `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`
}

/** A row's time as the pane is asked to show it. */
export function timeText(row: Row, mode: TimeMode, now: number): string {
  const at = row.last.at
  if (mode === 'rel') {
    const s = Math.max(0, Math.round((now - at) / 1000))
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86_400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86_400)}d ago`
  }
  if (mode === 'delta') {
    if (row.prev === null) return '+0.000'
    const d = (at - row.prev.at) / 1000
    return d >= 1000 ? `+${Math.round(d)}` : `${d < 0 ? '−' : '+'}${Math.abs(d).toFixed(3)}`
  }
  return `${clockText(at)}.${pad(new Date(at).getMilliseconds(), 3)}`
}

export interface PatternRow {
  sig: string
  level: LogLevel
  source: string
  text: string
  count: number
  last: number
  /** Lines in each of the last twelve five-second spans, oldest first. */
  recent: number[]
}

/** The patterns among the lines held: errors first, then the most frequent. */
export function tallyPatterns(items: readonly LogItem[], now: number): PatternRow[] {
  const rows = new Map<string, PatternRow>()
  const spanEnd = Math.floor(now / 5000)
  for (const item of items) {
    if (item.kind !== 'line') continue
    let row = rows.get(item.sig)
    if (row === undefined) {
      row = {
        sig: item.sig,
        level: item.level,
        source: item.source,
        text: signatureText(item.sig),
        count: 0,
        last: 0,
        recent: new Array<number>(12).fill(0),
      }
      rows.set(item.sig, row)
    }
    row.count++
    row.last = Math.max(row.last, item.at)
    const span = 11 - (spanEnd - Math.floor(item.at / 5000))
    if (span >= 0 && span < 12) row.recent[span] = (row.recent[span] ?? 0) + 1
  }
  const severe = (level: LogLevel): number => (groupOf(level) === 'ERR' ? 0 : 1)
  return [...rows.values()].sort(
    (a, b) => severe(a.level) - severe(b.level) || b.count - a.count || b.last - a.last,
  )
}

/** Where errors and warnings are, as fractions of the stream's height, for the bar on the right. */
export function errorMarks(
  rows: readonly Row[],
  offsets: Float64Array,
  /**
   * The lines the bar stands for: the stream's, or the view's when the stream is shorter - a
   * mark lies beside its row, not spread over the whole bar.
   */
  span: number = offsets[rows.length] ?? 0,
): { at: number; level: 'ERR' | 'WRN' }[] {
  const total = Math.max(span, offsets[rows.length] ?? 0)
  if (total === 0) return []
  const marks: { at: number; level: 'ERR' | 'WRN' }[] = []
  let lastAt = -1
  rows.forEach((row, i) => {
    if (row.item.kind !== 'line') return
    const group = groupOf(row.item.level)
    if (group !== 'ERR' && group !== 'WRN') return
    const at = (offsets[i] ?? 0) / total
    // Marks closer than a pixel's worth are one mark, an error if either is: a run of warnings
    // is one mark, not one element a row.
    const previous = marks.at(-1)
    if (previous !== undefined && at - lastAt < 0.002) {
      if (group === 'ERR') previous.level = 'ERR'
      return
    }
    lastAt = at
    marks.push({ at, level: group })
  })
  return marks
}

/** The card of a line: what the row has no room for. */
export function lineCardRows(row: Row, masked: boolean): CardRow[] {
  const item = row.item
  if (item.kind !== 'line') return []
  const when = new Date(row.last.at).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const rows: CardRow[] = [
    {
      label: 'time',
      value: item.timed
        ? item.zoned
          ? when
          : `${when} (no zone given: taken as this machine’s)`
        : `${when} (when read: the line has no time)`,
    },
  ]
  // Masked, everything the card says of the line is: the pattern keeps what is not a number or
  // an id - an address, a name - and the source is the line's own text too.
  const shown = (text: string): string => (masked ? maskText(text) : text)
  if (item.source !== '') rows.push({ label: 'source', value: shown(item.source) })
  for (const [key, value] of item.fields) {
    // Masked, a field named as a secret hides its value whatever it looks like.
    rows.push({ label: key, value: masked && SECRET_NAME.test(key) ? '•••' : shown(value) })
  }
  rows.push({
    label: 'pattern',
    value: `${shown(signatureText(item.sig))}${row.reps > 1 ? ` · ${row.reps} in a row` : ''}`,
    muted: true,
  })
  if (item.cut)
    rows.push({
      label: 'cut',
      value: 'longer than what is kept: COPY and EXPLAIN take it cut',
      muted: true,
    })
  return rows
}

/** What a mark says, in the stream. */
export function markText(mark: LogMark, clock: (at: number) => string): string {
  switch (mark.mark) {
    case 'opened':
      return `last ${mark.lines.toLocaleString()} lines · following`
    case 'rotated':
      return `${clock(mark.at)} · the file was replaced · reading the new one from its start`
    case 'switched':
      return `${clock(mark.at)} · switched to ${mark.name}`
  }
}

/** A text cut where the filter matches, for the matches to be marked. */
export function hitParts(text: string, match: RegExp | null): { text: string; hit: boolean }[] {
  if (match === null || text === '') return [{ text, hit: false }]
  const global = new RegExp(
    match.source,
    match.flags.includes('g') ? match.flags : `${match.flags}g`,
  )
  const parts: { text: string; hit: boolean }[] = []
  let last = 0
  for (const m of text.matchAll(global)) {
    const at = m.index ?? 0
    if (m[0] === '') break
    if (at > last) parts.push({ text: text.slice(last, at), hit: false })
    parts.push({ text: m[0], hit: true })
    last = at + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false })
  return parts
}

export function encodingLabel(choice: LogEncodingChoice, decided: string): string {
  const name = ENCODING_NAMES[decided as LogEncodingChoice] ?? decided
  return choice === 'auto' ? `auto · ${name}` : name
}

/**
 * The card of the file the pane follows (the name in the status row): where it is in full, what
 * a pattern is reading now, how it is read, and what is wrong with it, if anything.
 */
export function fileCardRows(
  file: LogFileRef,
  status: LogStatus | null,
  choice: LogEncodingChoice,
): CardRow[] {
  const rows: CardRow[] = [{ label: file.pattern === null ? 'file' : 'folder', value: file.path }]
  if (file.pattern !== null) {
    rows.push({ label: 'newest', value: status?.file ?? 'nothing matches yet' })
  }
  if (status !== null) {
    const how = file.format === null ? 'detected' : 'set by hand'
    rows.push({ label: 'format', value: `${FORMAT_NAMES[status.format]} (${how})` })
    rows.push({ label: 'encoding', value: encodingLabel(choice, status.encoding) })
    rows.push({
      label: 'read',
      value: `${Math.round(status.read / 1024).toLocaleString()} KB since opened`,
      muted: true,
    })
    if (status.problem !== null) rows.push({ label: 'problem', value: status.problem })
  }
  return rows
}

/** How a click chooses: the line alone, one more or one less (Ctrl/⌘), or a run (Shift). */
export type ChooseHow = 'one' | 'toggle' | 'range'

/**
 * The lines chosen after a click on `row`, by the number of each row's first line (a row's
 * number does not change as repeats fold into it), and the row a run starts from. A click on the
 * one line chosen lets it go.
 */
export function chooseRows(
  chosen: ReadonlySet<number>,
  anchor: number | null,
  rows: readonly Row[],
  row: Row,
  how: ChooseHow,
): { chosen: Set<number>; anchor: number | null } {
  const seq = row.item.seq
  if (how === 'toggle') {
    const next = new Set(chosen)
    if (next.has(seq)) next.delete(seq)
    else next.add(seq)
    return { chosen: next, anchor: seq }
  }
  const from = anchor === null ? -1 : rows.findIndex((r) => r.item.seq === anchor)
  if (how === 'range' && from >= 0) {
    const to = rows.indexOf(row)
    const [a, b] = from <= to ? [from, to] : [to, from]
    const run = rows.slice(a, b + 1).filter((r) => r.item.kind === 'line')
    return { chosen: new Set(run.map((r) => r.item.seq)), anchor }
  }
  const alone = chosen.size === 1 && chosen.has(seq)
  return { chosen: alone ? new Set() : new Set([seq]), anchor: alone ? null : seq }
}

/**
 * The lines chosen, among the rows shown, in their order: a line the levels or the filter hide
 * now is not sent or copied - only what can be seen chosen goes anywhere.
 */
export function chosenLines(rows: readonly Row[], chosen: ReadonlySet<number>): LogLine[] {
  if (chosen.size === 0) return []
  return rows.flatMap((row) =>
    row.item.kind === 'line' && chosen.has(row.item.seq) ? [row.item] : [],
  )
}
