/**
 * The LOG WATCH pane (docs/logwatch.md, architecture.md §5.21): one log file a pane, watched
 * while it is seen, read only where it grew, parsed in main and drawn by the page.
 *
 * What travels between main and the page, and the checks main makes of what the page sends.
 * The page names a file only by the id main gave it; a path never comes back.
 */

/** Levels, folded from every dialect's names. `LOG` is a line that named none. */
export const LOG_LEVELS = ['TRC', 'DBG', 'LOG', 'INF', 'WRN', 'ERR', 'FTL'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

/** The four switches of the filter row, and which levels each one stands for. */
export const LEVEL_GROUPS = {
  DBG: ['TRC', 'DBG'],
  INF: ['LOG', 'INF'],
  WRN: ['WRN'],
  ERR: ['ERR', 'FTL'],
} as const satisfies Record<string, readonly LogLevel[]>
export type LevelGroup = keyof typeof LEVEL_GROUPS
export const LEVEL_GROUP_IDS = Object.keys(LEVEL_GROUPS) as LevelGroup[]

export function groupOf(level: LogLevel): LevelGroup {
  for (const group of LEVEL_GROUP_IDS) {
    if ((LEVEL_GROUPS[group] as readonly LogLevel[]).includes(level)) return group
  }
  return 'INF'
}

export const LOG_FORMATS = ['jsonl', 'logfmt', 'syslog', 'clf', 'w3c', 'generic', 'plain'] as const
export type LogFormat = (typeof LOG_FORMATS)[number]

export const FORMAT_NAMES: Record<LogFormat, string> = {
  jsonl: 'JSON lines',
  logfmt: 'logfmt',
  syslog: 'syslog',
  clf: 'access log',
  w3c: 'W3C (IIS)',
  generic: 'text',
  plain: 'plain',
}

/** What a pane may ask for; `auto` is decided from the bytes (`detectEncoding`). */
export const LOG_ENCODINGS = [
  'auto',
  'utf-8',
  'utf-16le',
  'utf-16be',
  'shift_jis',
  'euc-jp',
  'windows-1252',
] as const
export type LogEncodingChoice = (typeof LOG_ENCODINGS)[number]
export type LogEncoding = Exclude<LogEncodingChoice, 'auto'>

export const ENCODING_NAMES: Record<LogEncodingChoice, string> = {
  auto: 'auto',
  'utf-8': 'UTF-8',
  'utf-16le': 'UTF-16LE',
  'utf-16be': 'UTF-16BE',
  shift_jis: 'Shift_JIS',
  'euc-jp': 'EUC-JP',
  'windows-1252': 'Windows-1252',
}

export const LOG_LIMITS = {
  /** A line longer than this is cut, and says so. */
  lineChars: 65_536,
  /** The raw line kept for the card. */
  rawChars: 4000,
  /**
   * A line's text kept, and each continuation line: what is held is bounded by size as well as
   * by count, in main, over IPC and in the page.
   */
  textChars: 8000,
  /** Continuation lines kept under one entry (a stack trace); the rest are counted. */
  moreLines: 200,
  /** Fields of a structured line kept for the card, and the length of each value. */
  fields: 40,
  fieldChars: 300,
  /** The most read from the end on opening, and from the gap on coming back. */
  tailBytes: 4 * 1024 * 1024,
  /** One read; a file that grew more is read in several. */
  chunkBytes: 1024 * 1024,
  /** Patterns remembered per source for NEW; the least recently seen go first. */
  patterns: 2000,
  /** Patterns a pane may mute. */
  muted: 200,
  /** Lines that may be chosen for EXPLAIN at once. */
  explainLines: 200,
  /** EXPLAIN's whole text, at most: a longer choice is not sent (nothing of it is cut). */
  explainChars: 12_000,
} as const

export const KEEP_LINES = [1000, 5000, 20_000, 50_000] as const
export const INITIAL_LINES = [100, 500, 2000] as const
export const DEFAULT_KEEP_LINES = 5000
export const DEFAULT_INITIAL_LINES = 500

/** A file a pane watches, as the page may know it. */
export interface LogFileRef {
  id: string
  /** The file's name, or the pattern's when it follows the newest file like it. */
  name: string
  /** Where it is, for the eye only (home as `~`); never handed back to main. */
  folder: string
  /**
   * The whole of it - the file, or the folder and the pattern - for the card that says which
   * file the pane follows. For the eye only, like `folder`: main takes ids, never this.
   */
  path: string
  /** Set when the pane follows the newest file whose name matches. */
  pattern: string | null
  /** The dialect set for it by hand; null when it is detected. */
  format: LogFormat | null
}

/** One entry of the log: a line, and any continuation lines under it. */
export interface LogLine {
  kind: 'line'
  /** Counts up per source and encoding; the page asks again from the last it holds. */
  seq: number
  /** Epoch ms: the log's own time when it gave one, else when the line was read. */
  at: number
  /** Whether `at` came from the log. */
  timed: boolean
  /** Whether the log's time named its zone (else it is taken as this machine's). */
  zoned: boolean
  level: LogLevel
  /** The logger, service or program, when the line names one. */
  source: string
  text: string
  /** A structured line's other fields, for the card. */
  fields: [string, string][]
  /** Continuation lines (a stack trace), at most `moreLines`. */
  more: string[]
  /** Continuation lines beyond those kept. */
  moreCut: number
  /** The line as written (cut to `rawChars`). */
  raw: string
  /** The pattern: level, source and the text with its values taken out (`signature`). */
  sig: string
  /** The first time this pattern was seen since the pane started following. */
  fresh: boolean
  /** Kept shorter than written: the line, its text or a line of its trace past what is kept. */
  cut: boolean
}

/** A place in the stream where something happened to the file rather than in it. */
export type LogMark =
  | { kind: 'mark'; seq: number; at: number; mark: 'opened'; lines: number }
  | { kind: 'mark'; seq: number; at: number; mark: 'rotated' }
  | { kind: 'mark'; seq: number; at: number; mark: 'switched'; name: string }

export type LogItem = LogLine | LogMark

export type LogState =
  /** Following the file. */
  | 'reading'
  /** Not there (yet): rotated away, or a pattern nothing matches. */
  | 'waiting'
  /** There, but this user may not read it. */
  | 'denied'
  /** Something else went wrong; `problem` says what. */
  | 'error'
  /** The id is not one this machine knows: the pane asks for a file again. */
  | 'unknown'

export interface LogStatus {
  state: LogState
  problem: string | null
  /** The file being read now (a pattern's newest), by name. */
  file: string | null
  format: LogFormat
  /** What is being decoded with: the choice, or what auto decided. */
  encoding: LogEncoding
  /** Many replacement characters lately: the encoding is probably wrong. */
  garbled: boolean
  /** Bytes read since the pane started following. */
  read: number
}

/** Main to page: what to add, or (`reset`) what to hold instead of everything before. */
export interface LogWatchEvent {
  key: string
  reset: boolean
  items: LogItem[]
  status: LogStatus
}

/** Page to main: follow a file in an encoding, from after the last item the page holds. */
export interface LogSubscribeRequest {
  id: string
  encoding: LogEncodingChoice
  /** The last `seq` the page holds for this key, or -1. */
  since: number
}

/** What EXPLAIN would send, and whether it may: the pane says "too long" before SEND. */
export interface LogExplainPreview {
  text: string
  fits: boolean
}

export interface LogExplainRequest {
  id: string
  encoding: LogEncodingChoice
  /** The lines chosen, by number: only these are sent (user decision 2026-10-12). */
  seqs: number[]
  /** A provider of the AI settings, by id; empty for the first. */
  provider: string
  /** Empty for the provider's own. */
  model: string
  /** Whether values are masked (`maskText`) in what is sent. */
  mask: boolean
}

/** Main to page: an answer as it is written, whole each time (answers are short). */
export interface LogExplainEvent {
  token: string
  text: string
  done: boolean
  /** Set when it failed or was stopped, in the provider's words beside ours. */
  failure: string | null
  provider: string
  model: string
}

export const keyOf = (id: string, encoding: LogEncodingChoice): string => `${id}/${encoding}`

export const isLogId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{16}$/.test(value)

export const isEncodingChoice = (value: unknown): value is LogEncodingChoice =>
  typeof value === 'string' && (LOG_ENCODINGS as readonly string[]).includes(value)

export const isLogFormat = (value: unknown): value is LogFormat =>
  typeof value === 'string' && (LOG_FORMATS as readonly string[]).includes(value)

const isSeq = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= -1

export function parseSubscribeRequest(raw: unknown): LogSubscribeRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { id, encoding, since } = raw as Record<string, unknown>
  if (!isLogId(id) || !isEncodingChoice(encoding) || !isSeq(since)) return null
  return { id, encoding, since }
}

const isShortText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max

export function parseExplainRequest(raw: unknown): LogExplainRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { id, encoding, seqs, provider, model, mask } = raw as Record<string, unknown>
  if (!isLogId(id) || !isEncodingChoice(encoding) || !isSeqList(seqs)) return null
  if (!isShortText(provider, 100) || !isShortText(model, 120) || typeof mask !== 'boolean') {
    return null
  }
  return { id, encoding, seqs: [...new Set(seqs)], provider, model, mask }
}

const isSeqList = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= LOG_LIMITS.explainLines &&
  value.every((seq) => isSeq(seq) && seq >= 0)

export const isExplainToken = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-z-]{8,64}$/i.test(value)
