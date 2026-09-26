/**
 * The clipboard pane (architecture.md §5.14): what was copied lately, to put
 * back on the clipboard.
 *
 * Main reads the system clipboard only while a clipboard pane is seen, keeps
 * what it read in memory - never on disk - and hands the page previews. The
 * decisions are here, pure: when to read next, whether an application marked a
 * copy as private, how a copy joins the history, what a row shows.
 */

/** How often main looks at the clipboard while a pane is seen, on the wall clock's quarter seconds. */
export const CLIP_PERIOD_MS = 250
/** Entries kept; the oldest goes first. */
export const CLIP_MAX_ENTRIES = 50
/**
 * The longest text kept to put back. A longer copy is listed, with its
 * beginning, but cannot be put back: half of it would be worse than none.
 */
export const CLIP_MAX_CHARS = 200_000
/**
 * The longest HTML, or RTF, kept beside a text; a longer one is dropped and the
 * text kept. Word's RTF carries its pictures, and can run to megabytes.
 */
export const CLIP_MAX_HTML_CHARS = 400_000
export const CLIP_MAX_RTF_CHARS = 400_000
/** How much of an entry the page is given to show. */
export const CLIP_PREVIEW_CHARS = 600
/**
 * A copy that contains the newest entry, or is contained by it, this soon after
 * it changed replaces it rather than joining the list: the shell copies on every
 * change of a selection being dragged, and "npm", "npm ins", "npm install" is
 * one copy. Only between looks in a row: after a pause, or a pane that was not
 * seen, a copy that contains the last is a copy of its own.
 */
export const CLIP_ABSORB_MS = 1500
/**
 * A text on the clipboard this long is read again only every so often while it
 * stays: reading it is a copy of the whole of it, four times a second.
 */
export const CLIP_LARGE_CHARS = 1_000_000
export const CLIP_LARGE_PERIOD_MS = 2000

/** The next moment on the wall clock's grid of `period`, strictly after `now`. */
export function nextTick(now: number, period: number = CLIP_PERIOD_MS): number {
  return (Math.floor(now / period) + 1) * period
}

/**
 * Clipboard formats an application adds to say "do not keep this": password
 * managers put them beside a password they copy. Windows' own clipboard history
 * honours the first two; the others are macOS's and KDE's conventions.
 */
const PRIVATE_FORMATS = new Set([
  'ExcludeClipboardContentFromMonitorProcessing',
  'Clipboard Viewer Ignore',
  'org.nspasteboard.ConcealedType',
  'org.nspasteboard.TransientType',
  'x-kde-passwordManagerHint',
])
/** Windows' history flag: a DWORD, and 0 means leave it out. Its value must be read. */
export const HISTORY_FLAG_FORMAT = 'CanIncludeInClipboardHistory'

/** The name of a raw platform format, from the MIME type Electron lists it under. */
export function rawFormatName(type: string): string | null {
  const match = /^electron application\/osclipboard;format="(.*)"$/.exec(type)
  return match?.[1] ?? null
}

/** The MIME type Electron reads a raw platform format under. */
export function rawFormatType(name: string): string {
  return `electron application/osclipboard;format="${name}"`
}

/**
 * Whether the formats on the clipboard say its content is private: 'yes', 'no',
 * or 'ask' when only Windows' history flag is there and its value decides.
 */
export function privateMark(types: readonly string[]): 'yes' | 'no' | 'ask' {
  let ask = false
  for (const type of types) {
    const name = rawFormatName(type) ?? type
    if (PRIVATE_FORMATS.has(name)) return 'yes'
    if (name === HISTORY_FLAG_FORMAT) ask = true
  }
  return ask ? 'ask' : 'no'
}

/** Windows' history flag's value: four bytes, little-endian; 0 leaves the copy out. */
export function historyFlagSaysPrivate(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0 && bytes[3] === 0
}

/** What main found on the clipboard at one look. */
export type ClipRead =
  /** `rtf` is what Word, Outlook and WordPad copy besides HTML (WordPad only it). */
  | { kind: 'text'; text: string; html: string | null; rtf?: string | null }
  /** Marked private by the application that copied it: not kept, not even looked at. */
  | { kind: 'private' }
  /** Nothing, or nothing this pane keeps (an image, files). */
  | { kind: 'other' }

/** What a row is, for its tag. */
export type ClipKind = 'text' | 'url' | 'path' | 'color' | 'number'

/** An entry as main keeps it. */
export interface ClipEntry {
  id: string
  /** The whole text, or its beginning when it was too long to keep (`kept` false). */
  text: string
  /** The HTML and RTF copied with it, put back with the text. */
  html: string | null
  rtf: string | null
  /** Whether it can be put back as it was copied. */
  kept: boolean
  /** Its length as copied, in characters. */
  chars: number
  lines: number
  kind: ClipKind
  /** When it was first copied, and last. */
  firstAt: number
  at: number
  /** How many times it has been copied. */
  copies: number
}

/** A format kept beside the text. */
export type ClipFormat = 'html' | 'rtf'

/** An entry as the page sees it: a preview, never the whole text or its HTML. */
export interface ClipEntryView {
  id: string
  preview: string
  chars: number
  lines: number
  kind: ClipKind
  /** It was copied with its formatting (HTML or RTF), and is put back with it. */
  rich: boolean
  /** Which formats came with the text, for the card. */
  formats: ClipFormat[]
  kept: boolean
  firstAt: number
  at: number
  copies: number
}

/** The pane's whole picture, sent on every change. */
export interface ClipBoard {
  entries: ClipEntryView[]
  /** The entry that is on the clipboard now, or null when it holds something else. */
  current: string | null
  /** Whether main is reading the clipboard: a pane is seen and it is not paused. */
  watching: boolean
  paused: boolean
  /** Copies marked private by their application, left out since elecdex started. */
  skipped: number
}

/** How putting an entry back went: 'not-kept' for one too long to have been kept whole. */
export type ClipRestoreResult = 'ok' | 'missing' | 'not-kept' | 'failed'

export interface ClipHistory {
  entries: ClipEntry[]
  /** The text last seen on the clipboard, to tell a new copy from the same one. */
  last: string | null
  current: string | null
  skipped: number
}

export const emptyHistory = (): ClipHistory => ({
  entries: [],
  last: null,
  current: null,
  skipped: 0,
})

const URL_PATTERN = /^https?:\/\/\S+$/i
/**
 * A Windows path may hold spaces (C:\Program Files); a Unix one is taken only
 * without them, so a comment (// TODO) or a command (/help me) is not a path.
 */
const PATH_PATTERN = /^(?:[a-z]:[\\/]|\\\\[^\\\s]+\\|~?\/[^/\s]\S*$)/i
const COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const NUMBER_PATTERN = /^[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?$/

/** What a copied text is, judged on its trimmed single line; anything else is text. */
export function classifyClip(text: string): ClipKind {
  const line = text.trim()
  if (line === '' || line.includes('\n')) return 'text'
  if (URL_PATTERN.test(line)) return 'url'
  if (COLOR_PATTERN.test(line)) return 'color'
  if (NUMBER_PATTERN.test(line)) return 'number'
  if (PATH_PATTERN.test(line)) return 'path'
  return 'text'
}

function countLines(text: string): number {
  let lines = 1
  for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1)) lines += 1
  // A final line break ends the last line; it does not start another.
  return text.endsWith('\n') && lines > 1 ? lines - 1 : lines
}

/** A format kept beside the text: only with a text kept whole, and only up to its limit. */
const beside = (kept: boolean, value: string | null | undefined, max: number): string | null =>
  kept && value != null && value.length <= max ? value : null

function makeEntry(id: string, read: Extract<ClipRead, { kind: 'text' }>, now: number): ClipEntry {
  const { text } = read
  const kept = text.length <= CLIP_MAX_CHARS
  return {
    id,
    text: kept ? text : text.slice(0, CLIP_PREVIEW_CHARS),
    html: beside(kept, read.html, CLIP_MAX_HTML_CHARS),
    rtf: beside(kept, read.rtf, CLIP_MAX_RTF_CHARS),
    kept,
    chars: text.length,
    lines: countLines(text),
    kind: classifyClip(text),
    firstAt: now,
    at: now,
    copies: 1,
  }
}

/** Whether an entry is this text: whole, or for one too long to keep, its length and beginning. */
function sameText(entry: ClipEntry, text: string): boolean {
  return entry.kept
    ? entry.text === text
    : entry.chars === text.length && text.startsWith(entry.text)
}

/** Stands for private content in `last`; a copied text never starts with a NUL. */
const PRIVATE_MARK = '\u0000private'

/** Looks this close together are in a row; a look skipped while one was still reading does not break it. */
const IN_A_ROW_MS = CLIP_PERIOD_MS * 4

/** Whether a copy is the newest entry's selection still being dragged. */
function absorbs(
  history: ClipHistory,
  newest: ClipEntry | undefined,
  text: string,
  now: number,
  lookedBefore: number | null,
): newest is ClipEntry {
  if (newest === undefined || !newest.kept || newest.copies > 1) return false
  // What is being dragged is what the clipboard holds; one put back since is not.
  if (history.current !== newest.id) return false
  if (lookedBefore === null || now - lookedBefore > IN_A_ROW_MS) return false
  if (now - newest.at > CLIP_ABSORB_MS) return false
  return text.includes(newest.text) || newest.text.includes(text)
}

/**
 * The history after one look at the clipboard. The same text as last time
 * changes nothing; a text already in the list moves to the top rather than
 * appearing twice; a copy that grows or shrinks the newest entry within a
 * moment replaces it. `makeId` names a new entry; `lookedBefore` is when the
 * look before this one was, or null when this is the first since reading began.
 */
export function recordRead(
  history: ClipHistory,
  read: ClipRead,
  now: number,
  makeId: () => string,
  lookedBefore: number | null = null,
): ClipHistory {
  if (read.kind === 'private') {
    // Its content is never read, so two private copies in a row cannot be told
    // apart: a run of them counts once, and the same one seen again is not another.
    if (history.last === PRIVATE_MARK) return history
    return { ...history, last: PRIVATE_MARK, current: null, skipped: history.skipped + 1 }
  }
  if (read.kind === 'other') {
    return history.last === null && history.current === null
      ? history
      : { ...history, last: null, current: null }
  }
  const { text } = read
  if (text === '') return recordRead(history, { kind: 'other' }, now, makeId)
  if (text === history.last) return history
  const at = history.entries.findIndex((entry) => sameText(entry, text))
  let entries: ClipEntry[]
  let id: string
  if (at >= 0) {
    const found = history.entries[at] as ClipEntry
    // Copied again from somewhere with formatting, it takes that formatting.
    const again = makeEntry(found.id, read, now)
    const formatted = again.html !== null || again.rtf !== null
    const moved = {
      ...found,
      at: now,
      copies: found.copies + 1,
      ...(formatted ? { html: again.html, rtf: again.rtf } : {}),
    }
    entries = [moved, ...history.entries.filter((_, i) => i !== at)]
    id = found.id
  } else if (absorbs(history, history.entries[0], text, now, lookedBefore)) {
    const newest = history.entries[0] as ClipEntry
    const grown = makeEntry(newest.id, read, newest.firstAt)
    entries = [{ ...grown, at: now }, ...history.entries.slice(1)]
    id = newest.id
  } else {
    id = makeId()
    entries = [makeEntry(id, read, now), ...history.entries].slice(0, CLIP_MAX_ENTRIES)
  }
  return { ...history, entries, last: text, current: id }
}

/**
 * The history once an entry has been put back on the clipboard: it is what the
 * clipboard holds, and the next look must not take it for a new copy. It stays
 * where it is in the list, so the row the user just pressed does not move.
 */
export function restored(history: ClipHistory, id: string): ClipHistory {
  const entry = history.entries.find((e) => e.id === id)
  if (entry === undefined || !entry.kept) return history
  return { ...history, last: entry.text, current: id }
}

/** The history without one entry. What is on the clipboard is left alone. */
export function withoutEntry(history: ClipHistory, id: string): ClipHistory {
  if (!history.entries.some((e) => e.id === id)) return history
  return {
    ...history,
    entries: history.entries.filter((e) => e.id !== id),
    current: history.current === id ? null : history.current,
  }
}

/**
 * The history emptied, with the clipboard emptied beside it (the watcher does
 * that): nothing is known to be on it, so whatever is copied next - the same
 * text as before included - is a copy. Were the clipboard kept, a text copied
 * again could not be told from the one left on it, and would not be listed.
 */
export function cleared(history: ClipHistory): ClipHistory {
  return { ...history, entries: [], current: null, last: null }
}

/** An entry as the page is given it. */
export function entryView(entry: ClipEntry): ClipEntryView {
  return {
    id: entry.id,
    preview: entry.text.slice(0, CLIP_PREVIEW_CHARS),
    chars: entry.chars,
    lines: entry.lines,
    kind: entry.kind,
    rich: entry.html !== null || entry.rtf !== null,
    formats: [
      ...(entry.html !== null ? (['html'] as const) : []),
      ...(entry.rtf !== null ? (['rtf'] as const) : []),
    ],
    kept: entry.kept,
    firstAt: entry.firstAt,
    at: entry.at,
    copies: entry.copies,
  }
}

export function boardOf(history: ClipHistory, watching: boolean, paused: boolean): ClipBoard {
  return {
    entries: history.entries.map(entryView),
    current: history.current,
    watching,
    paused,
    skipped: history.skipped,
  }
}

/**
 * Whether to read the clipboard's text at this look. A very long text stays
 * where it is most of the time, and reading it copies all of it: while one is
 * there it is read only every CLIP_LARGE_PERIOD_MS.
 */
export function shouldReadText(lastChars: number, lastReadAt: number, now: number): boolean {
  return lastChars < CLIP_LARGE_CHARS || now - lastReadAt >= CLIP_LARGE_PERIOD_MS
}

const ID_PATTERN = /^c[0-9a-z]{1,12}$/

export function isClipId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

// ---------------------------------------------------------------------------
// What a row shows (the page)
// ---------------------------------------------------------------------------

/**
 * A row's tags: what it is (TXT, URL, PATH, NUM, CLR), and RICH under it when it
 * was copied with its formatting, which is put back with it.
 */
export function clipTags(entry: Pick<ClipEntryView, 'kind' | 'rich'>): string[] {
  return entry.rich ? [KIND_TAGS[entry.kind], 'RICH'] : [KIND_TAGS[entry.kind]]
}

const KIND_TAGS: Record<ClipKind, string> = {
  text: 'TXT',
  url: 'URL',
  path: 'PATH',
  color: 'CLR',
  number: 'NUM',
}

/**
 * The lines a row shows: at most `max`, blank lines and indentation kept as
 * they are but tabs made spaces, and the rest counted rather than drawn.
 */
export function previewLines(preview: string, max: number): string[] {
  const lines = preview.replace(/\r\n?/g, '\n').replace(/\t/g, '  ').split('\n')
  // Leading and trailing blank lines say nothing in a row.
  while (lines.length > 1 && lines[0]?.trim() === '') lines.shift()
  while (lines.length > 1 && lines[lines.length - 1]?.trim() === '') lines.pop()
  return lines.slice(0, Math.max(1, max))
}

/** A preview with its characters hidden: its shape, and nothing of what it says. */
export function maskedPreview(entry: Pick<ClipEntryView, 'chars'>): string {
  return '•'.repeat(Math.min(Math.max(entry.chars, 4), 24))
}

/** How long ago, in a row's few characters: now, 12m, 3h, 2d. */
export function clipAge(at: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - at) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/** What came with the text, for the card: "text + HTML + RTF". */
export function clipFormats(entry: Pick<ClipEntryView, 'formats'>): string {
  return ['text', ...entry.formats.map((f) => f.toUpperCase())].join(' + ')
}

/** The size of an entry, for a row's second line: "3 lines · 1,204 chars". */
export function clipSize(entry: Pick<ClipEntryView, 'chars' | 'lines'>): string {
  const chars = `${entry.chars.toLocaleString('en-US')} ${entry.chars === 1 ? 'char' : 'chars'}`
  return entry.lines > 1 ? `${entry.lines} lines · ${chars}` : chars
}

/**
 * The entries a filter leaves: every word must appear, in any case. The pane
 * offers no filter while masked, where a guess that matched would say what a
 * hidden entry holds.
 */
export function filterEntries<T extends Pick<ClipEntryView, 'preview'>>(
  entries: readonly T[],
  query: string,
): T[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...entries]
  return entries.filter((entry) => {
    const text = entry.preview.toLowerCase()
    return words.every((word) => text.includes(word))
  })
}
