import { LOG_LIMITS, type LogFormat, type LogLevel } from './types.js'

/**
 * Reading a log line in the dialects logs are written in (docs/logwatch.md §5): JSON lines,
 * logfmt, syslog, the access logs of Apache and nginx, IIS's W3C files, and the common
 * "time [level] text". Pure: the clock comes in as `now`, for a line that names no year or
 * no date.
 *
 * A time without a zone is taken as this machine's own, as the program that wrote it most
 * likely did; the card says so (`zoned`).
 */

/** A line that starts an entry, read. */
export interface Head {
  /** Epoch ms, or null when the line names no time. */
  at: number | null
  zoned: boolean
  level: LogLevel
  source: string
  text: string
  fields: [string, string][]
}

/** What reading a dialect carries from line to line: IIS's `#Fields:`. */
export interface FormatState {
  format: LogFormat
  w3cFields: string[] | null
}

export const formatState = (format: LogFormat): FormatState => ({ format, w3cFields: null })

/* ---- Levels ---- */

const LEVEL_WORDS: Record<string, LogLevel> = {
  trace: 'TRC',
  trc: 'TRC',
  verbose: 'TRC',
  vrb: 'TRC',
  debug: 'DBG',
  dbg: 'DBG',
  fine: 'DBG',
  info: 'INF',
  inf: 'INF',
  information: 'INF',
  notice: 'INF',
  warn: 'WRN',
  wrn: 'WRN',
  warning: 'WRN',
  error: 'ERR',
  err: 'ERR',
  eror: 'ERR',
  severe: 'ERR',
  fatal: 'FTL',
  ftl: 'FTL',
  critical: 'FTL',
  crit: 'FTL',
  emerg: 'FTL',
  emergency: 'FTL',
  alert: 'FTL',
  panic: 'FTL',
}

/** A level's name in any dialect's spelling, or null. */
export function levelFromWord(word: string): LogLevel | null {
  return LEVEL_WORDS[word.toLowerCase()] ?? null
}

/** pino and bunyan count in tens. */
function levelFromNumber(n: number): LogLevel | null {
  if (n >= 60) return 'FTL'
  if (n >= 50) return 'ERR'
  if (n >= 40) return 'WRN'
  if (n >= 30) return 'INF'
  if (n >= 20) return 'DBG'
  if (n >= 10) return 'TRC'
  return null
}

/** syslog's severity, 0 (emergency) to 7 (debug). */
export function levelFromSeverity(severity: number): LogLevel {
  if (severity <= 2) return 'FTL'
  if (severity === 3) return 'ERR'
  if (severity === 4) return 'WRN'
  if (severity === 7) return 'DBG'
  return 'INF'
}

/** An HTTP status read as a level: a server error is an error, a refusal a warning. */
function levelFromStatus(status: number): LogLevel {
  if (status >= 500) return 'ERR'
  if (status >= 400) return 'WRN'
  return 'INF'
}

const LEVEL_TOKEN =
  /^[[(<]?(trace|trc|verbose|vrb|debug|dbg|fine|info|inf|information|notice|warn|wrn|warning|error|err|eror|severe|fatal|ftl|critical|crit|emerg|emergency|alert|panic)[\])>]?(?::|\s*[|-])?(?:\s+|$)/i

/** A level written at the start of a text, and what follows it. */
function leadingLevel(text: string): { level: LogLevel; rest: string } | null {
  const m = LEVEL_TOKEN.exec(text)
  const word = m?.[1]
  if (m === null || word === undefined) return null
  const level = levelFromWord(word)
  return level === null ? null : { level, rest: text.slice(m[0].length) }
}

/* ---- Times ---- */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const msOf = (fraction: string | undefined): number =>
  fraction === undefined ? 0 : Math.round(Number(`0.${fraction}`) * 1000)

/** "+09:00", "-0700", "Z" in minutes east, or null for none. */
function zoneMinutes(zone: string | undefined): number | null {
  if (zone === undefined || zone === '') return null
  if (zone === 'Z' || zone === 'z') return 0
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(zone)
  if (m === null) return null
  const minutes = Number(m[2]) * 60 + Number(m[3])
  return m[1] === '-' ? -minutes : minutes
}

/** A wall-clock time in a zone (or this machine's) as epoch ms; NaN when it is no date. */
function wallTime(
  parts: [number, number, number, number, number, number, number],
  zone: number | null,
): number {
  const [y, mo, d, h, mi, s, ms] = parts
  if (mo < 0 || mo > 11 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 60) return Number.NaN
  if (zone === null) return new Date(y, mo, d, h, mi, s, ms).getTime()
  return Date.UTC(y, mo, d, h, mi, s, ms) - zone * 60_000
}

const ISO =
  /^(\d{4})[-/](\d{2})[-/](\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:[.,](\d{1,9}))?\s?(Z|z|[+-]\d{2}:?\d{2})?$/
const CLF_TIME = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})(?:\s+([+-]\d{4}))?$/
const CLOCK = /^(\d{2}):(\d{2}):(\d{2})(?:[.,](\d{1,9}))?$/

export interface ParsedTime {
  at: number
  zoned: boolean
}

/** A date and time in any of the forms logs write, or null. */
export function parseTime(text: string, now: number): ParsedTime | null {
  const iso = ISO.exec(text)
  if (iso !== null) {
    const zone = zoneMinutes(iso[8])
    const at = wallTime(
      [
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        Number(iso[4]),
        Number(iso[5]),
        Number(iso[6]),
        msOf(iso[7]),
      ],
      zone,
    )
    return Number.isNaN(at) ? null : { at, zoned: zone !== null }
  }
  const clf = CLF_TIME.exec(text)
  if (clf !== null) {
    const month = MONTHS.indexOf((clf[2] ?? '').toLowerCase())
    const zone = zoneMinutes(clf[7])
    const at = wallTime(
      [Number(clf[3]), month, Number(clf[1]), Number(clf[4]), Number(clf[5]), Number(clf[6]), 0],
      zone,
    )
    return Number.isNaN(at) ? null : { at, zoned: zone !== null }
  }
  const clock = CLOCK.exec(text)
  if (clock !== null) return timeToday(clock, now)
  return null
}

/** A time of day alone: today's, or yesterday's when today's would be ahead of now. */
function timeToday(m: RegExpExecArray, now: number): ParsedTime | null {
  const today = new Date(now)
  const parts = (day: Date): [number, number, number, number, number, number, number] => [
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
    msOf(m[4]),
  ]
  let at = wallTime(parts(today), null)
  if (Number.isNaN(at)) return null
  if (at > now + 60_000) at = wallTime(parts(new Date(now - 86_400_000)), null)
  return { at, zoned: false }
}

/** syslog's "Oct 12 12:04:01", which names no year: this year's, or last year's if that is ahead. */
function syslogTime(month: string, day: string, clock: string, now: number): ParsedTime | null {
  const mo = MONTHS.indexOf(month.toLowerCase())
  const c = /^(\d{2}):(\d{2}):(\d{2})$/.exec(clock)
  if (mo < 0 || c === null) return null
  const year = new Date(now).getFullYear()
  const at = (y: number): number =>
    wallTime([y, mo, Number(day), Number(c[1]), Number(c[2]), Number(c[3]), 0], null)
  let when = at(year)
  if (Number.isNaN(when)) return null
  if (when > now + 86_400_000) when = at(year - 1)
  return { at: when, zoned: false }
}

/** A JSON value as a time: an ISO string, or epoch seconds or milliseconds. */
function timeFromValue(value: unknown, now: number): ParsedTime | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e12) return { at: Math.round(value), zoned: true }
    if (value > 1e9) return { at: Math.round(value * 1000), zoned: true }
    return null
  }
  return typeof value === 'string' ? parseTime(value.trim(), now) : null
}

/* ---- Fields ---- */

const TIME_KEYS = ['time', 'timestamp', 'ts', '@t', '@timestamp', 'date', 't', 'datetime']
const LEVEL_KEYS = ['level', 'lvl', 'severity', '@l', 'loglevel', 'log.level', 'levelname']
const TEXT_KEYS = ['msg', 'message', '@m', '@mt', 'text', 'event']
const SOURCE_KEYS = [
  'name',
  'logger',
  'svc',
  'service',
  'module',
  'component',
  'category',
  'SourceContext',
  'app',
]

function valueText(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return (text ?? '').slice(0, LOG_LIMITS.fieldChars)
}

const pick = (
  record: Record<string, unknown>,
  keys: readonly string[],
): [string, unknown] | null => {
  for (const key of keys) if (key in record) return [key, record[key]]
  return null
}

function levelFromValue(value: unknown): LogLevel | null {
  if (typeof value === 'number') return levelFromNumber(value)
  return typeof value === 'string' ? levelFromWord(value.trim()) : null
}

/** A record of named values (a JSON line, a logfmt line) read as an entry. */
function headFromRecord(
  record: Record<string, unknown>,
  now: number,
  defaultLevel: LogLevel,
): Head {
  const time = pick(record, TIME_KEYS)
  const level = pick(record, LEVEL_KEYS)
  const text = pick(record, TEXT_KEYS)
  const source = pick(record, SOURCE_KEYS)
  const used = new Set([time?.[0], level?.[0], text?.[0], source?.[0]])
  const parsed = time === null ? null : timeFromValue(time[1], now)
  const fields: [string, string][] = []
  for (const [key, value] of Object.entries(record)) {
    if (used.has(key) || fields.length >= LOG_LIMITS.fields) continue
    fields.push([key.slice(0, 80), valueText(value)])
  }
  return {
    at: parsed?.at ?? null,
    zoned: parsed?.zoned ?? false,
    level: (level === null ? null : levelFromValue(level[1])) ?? defaultLevel,
    source: source === null ? '' : valueText(source[1]),
    text:
      text === null
        ? fields.map(([k, v]) => `${k}=${v}`).join(' ')
        : typeof text[1] === 'string'
          ? text[1]
          : valueText(text[1]),
    fields,
  }
}

/* ---- Dialects ---- */

function jsonHead(line: string, now: number): Head | null {
  if (!line.startsWith('{')) return null
  let record: unknown
  try {
    record = JSON.parse(line)
  } catch {
    return null
  }
  if (typeof record !== 'object' || record === null || Array.isArray(record)) return null
  // Serilog's compact form leaves out the level of an Information event.
  const serilog = '@t' in record && !('@l' in record)
  return headFromRecord(record as Record<string, unknown>, now, serilog ? 'INF' : 'LOG')
}

/**
 * A key starts the line or follows white space: unanchored, a long run without "=" was scanned
 * again from every place in it (seconds on one 64 KB line).
 */
const LOGFMT_PAIR = /(?<!\S)([\w.@/-]{1,128})=("(?:[^"\\]|\\.)*"|\S*)/g

/** key=value pairs, read only when they make most of the line. */
export function logfmtPairs(line: string): Record<string, string> | null {
  const record: Record<string, string> = {}
  let covered = 0
  let count = 0
  for (const m of line.matchAll(LOGFMT_PAIR)) {
    const key = m[1] ?? ''
    let value = m[2] ?? ''
    if (value.startsWith('"')) value = value.slice(1, -1).replace(/\\(.)/g, '$1')
    record[key] = value
    covered += m[0].length
    count++
  }
  const solid = line.replace(/\s+/g, '').length
  if (count < 2 || covered < solid * 0.7) return null
  return record
}

function logfmtHead(line: string, now: number): Head | null {
  const record = logfmtPairs(line)
  return record === null ? null : headFromRecord(record, now, 'LOG')
}

const RFC5424 = /^<(\d{1,3})>1 (\S+) (\S+) (\S+) (\S+) (\S+) (-|\[.*?\])(?: (.*))?$/
const RFC3164 =
  /^(?:<(\d{1,3})>)?([A-Z][a-z]{2}) {1,2}(\d{1,2}) (\d{2}:\d{2}:\d{2}) (\S+) ([^:[\s]+)(?:\[(\d+)\])?:\s?(.*)$/

/** A field of syslog, where "-" says there is none. */
const given = (value: string | undefined): string =>
  value === undefined || value === '-' ? '' : value

function rfc5424Head(m: RegExpExecArray, now: number): Head {
  const time = given(m[2]) === '' ? null : parseTime(m[2] ?? '', now)
  const fields: [string, string][] = [['host', m[3] ?? '']]
  const named: [string, string][] = [
    ['pid', given(m[5])],
    ['msgid', given(m[6])],
    ['data', given(m[7]).slice(0, LOG_LIMITS.fieldChars)],
  ]
  for (const field of named) if (field[1] !== '') fields.push(field)
  return {
    at: time?.at ?? null,
    zoned: time?.zoned ?? false,
    level: levelFromSeverity(Number(m[1]) % 8),
    source: given(m[4]),
    text: (m[8] ?? '').replace(/^\uFEFF/, ''),
    fields,
  }
}

function rfc3164Head(m: RegExpExecArray, now: number): Head | null {
  const time = syslogTime(m[2] ?? '', m[3] ?? '', m[4] ?? '', now)
  if (time === null) return null
  const text = m[8] ?? ''
  const fields: [string, string][] = [['host', m[5] ?? '']]
  if (m[7] !== undefined) fields.push(['pid', m[7]])
  const level =
    m[1] !== undefined ? levelFromSeverity(Number(m[1]) % 8) : (leadingLevel(text)?.level ?? 'LOG')
  return { at: time.at, zoned: false, level, source: m[6] ?? '', text, fields }
}

function syslogHead(line: string, now: number): Head | null {
  const modern = RFC5424.exec(line)
  if (modern !== null) return rfc5424Head(modern, now)
  const old = RFC3164.exec(line)
  return old === null ? null : rfc3164Head(old, now)
}

const CLF =
  /^(\S+) \S+ (\S+) \[([^\]]+)\] "((?:[^"\\]|\\.)*)" (\d{3}) (\S+)(?: "((?:[^"\\]|\\.)*)" "((?:[^"\\]|\\.)*)")?/

function clfHead(line: string, now: number): Head | null {
  const m = CLF.exec(line)
  if (m === null) return null
  const time = parseTime(m[3] ?? '', now)
  const status = Number(m[5])
  const fields: [string, string][] = [['client', m[1] ?? '']]
  if (m[2] !== '-') fields.push(['user', m[2] ?? ''])
  if (m[7] !== undefined && m[7] !== '-')
    fields.push(['referer', m[7].slice(0, LOG_LIMITS.fieldChars)])
  if (m[8] !== undefined) fields.push(['agent', m[8].slice(0, LOG_LIMITS.fieldChars)])
  return {
    at: time?.at ?? null,
    zoned: time?.zoned ?? false,
    level: levelFromStatus(status),
    source: '',
    text: `${m[4] ?? ''} ${status} ${m[6] ?? ''}`,
    fields,
  }
}

/** IIS's request as a line: method, address and query, status, time taken. */
function w3cText(record: Record<string, string>, status: number): string {
  const query = record['cs-uri-query']
  const taken = record['time-taken']
  return [
    record['cs-method'] ?? '',
    `${record['cs-uri-stem'] ?? ''}${query !== undefined && query !== '-' ? `?${query}` : ''}`,
    Number.isFinite(status) ? String(status) : '',
    taken !== undefined ? `${taken}ms` : '',
  ]
    .filter((part) => part !== '')
    .join(' ')
}

const W3C_SHOWN = new Set(['date', 'time', 'cs-method', 'cs-uri-stem', 'cs-uri-query', 'sc-status'])

/** IIS: `#Fields:` names the columns; times are UTC. A directive line is read, not shown. */
function w3cHead(line: string, state: FormatState): Head | 'skip' | null {
  if (line.startsWith('#')) {
    if (line.startsWith('#Fields:')) state.w3cFields = line.slice(8).trim().split(/\s+/)
    return 'skip'
  }
  const names = state.w3cFields
  const values = line.split(' ')
  if (names === null || values.length !== names.length) return null
  const record: Record<string, string> = {}
  names.forEach((name, i) => {
    record[name] = values[i] ?? ''
  })
  const at = parseTime(`${record.date ?? ''} ${record.time ?? ''}Z`, 0)?.at ?? null
  const status = Number(record['sc-status'])
  const fields = Object.entries(record)
    .filter(([name, value]) => !W3C_SHOWN.has(name) && value !== '-')
    .slice(0, LOG_LIMITS.fields)
    .map(([name, value]): [string, string] => [name, value.slice(0, LOG_LIMITS.fieldChars)])
  return {
    at,
    zoned: at !== null,
    level: Number.isFinite(status) ? levelFromStatus(status) : 'LOG',
    source: record['s-sitename'] ?? '',
    text: w3cText(record, status),
    fields,
  }
}

const GENERIC_TIME =
  /^\[?(\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?(?:\s?(?:Z|z|[+-]\d{2}:?\d{2}))?|\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?)\]?(?:\s*[|-]?\s+|$)/
const BRACKETED = /^\[([^\]]{1,60})\]:?\s*/
const SEPARATOR = /^[|:-]\s+/

/** "time [level] [source] text", the level and source in either order and either optional. */
function genericHead(line: string, now: number): Head | null {
  const m = GENERIC_TIME.exec(line)
  if (m === null) return null
  const time = parseTime(m[1] ?? '', now)
  if (time === null) return null
  let rest = line.slice(m[0].length)
  let level: LogLevel | null = null
  let source = ''
  for (let i = 0; i < 2; i++) {
    const lead: { level: LogLevel; rest: string } | null =
      level === null ? leadingLevel(rest) : null
    if (lead !== null) {
      level = lead.level
      rest = lead.rest
      continue
    }
    const bracket = source === '' ? BRACKETED.exec(rest) : null
    if (bracket !== null) {
      source = bracket[1] ?? ''
      rest = rest.slice(bracket[0].length)
    }
  }
  rest = rest.replace(SEPARATOR, '')
  return { at: time.at, zoned: time.zoned, level: level ?? 'LOG', source, text: rest, fields: [] }
}

/** Any line at all: its level only if it starts with one. */
export function plainHead(line: string): Head {
  const lead = leadingLevel(line.trimStart())
  return {
    at: null,
    zoned: false,
    level: lead?.level ?? 'LOG',
    source: '',
    text: lead === null ? line : lead.rest,
    fields: [],
  }
}

/**
 * The line read as a head in the dialect, or null when it is not one (a continuation, or a
 * line of another kind), or 'skip' for a line that says something about the file (IIS's
 * directives) rather than happened in it.
 */
export function parseHead(line: string, state: FormatState, now: number): Head | 'skip' | null {
  switch (state.format) {
    case 'jsonl':
      return jsonHead(line, now)
    case 'logfmt':
      return logfmtHead(line, now)
    case 'syslog':
      return syslogHead(line, now)
    case 'clf':
      return clfHead(line, now)
    case 'w3c':
      return w3cHead(line, state)
    case 'generic':
      return genericHead(line, now)
    case 'plain':
      return plainHead(line)
  }
}

/** Dialects whose every entry starts with a time: a line without one belongs to the entry above. */
export const STARTS_WITH_TIME: ReadonlySet<LogFormat> = new Set(['syslog', 'generic'])

const STACK =
  /^(?:\s|at\s|Caused by\b|Traceback \(most recent call last\)|\.\.\. \d+ (?:more|common frames)|During handling of the above|The above exception)/
const EXCEPTION_LINE = /^[\w.$]+(?:Error|Exception)\b/

/** A line that goes under the entry above: a stack trace's frames, a traceback's lines. */
export function isStackLine(line: string, inTrace: boolean): boolean {
  return STACK.test(line) || (inTrace && EXCEPTION_LINE.test(line))
}

/** Detection's order: the strictest first, so a JSON line is not taken for "plain". */
const DETECT_ORDER: readonly LogFormat[] = ['jsonl', 'clf', 'syslog', 'logfmt', 'generic']

/**
 * The share of a sample a dialect reads as heads. Dialects with frames under their entries are
 * judged by the lines that are not frames.
 */
function shareOf(format: LogFormat, sample: readonly string[], now: number): number {
  const state = formatState(format)
  let heads = 0
  for (const line of sample) if (parseHead(line, state, now) !== null) heads++
  const frames = STARTS_WITH_TIME.has(format)
    ? sample.filter((line) => isStackLine(line, false)).length
    : 0
  const judged = sample.length - frames
  return judged === 0 ? 0 : heads / judged
}

/** The dialect most of a sample's lines are in; plain when none is. */
export function detectFormat(lines: readonly string[], now: number): LogFormat {
  const sample = lines.filter((line) => line.trim() !== '').slice(-200)
  if (sample.some((line) => line.startsWith('#Fields:'))) return 'w3c'
  let best: LogFormat = 'plain'
  let bestShare = 0
  for (const format of DETECT_ORDER) {
    const share = shareOf(format, sample, now)
    if (share >= 0.6 && share > bestShare) {
      best = format
      bestShare = share
    }
  }
  return best
}
