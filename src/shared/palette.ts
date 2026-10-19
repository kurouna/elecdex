import type { KeybindingAction } from './keybindings.js'

/**
 * The action palette's rows and their order (docs/palette.md): the shortcuts' actions, the
 * saved layouts, the presets, the themes, the panes and the settings' sections, found by
 * typing. Pure: where the rows come from is the page's (renderer/palette/sources.ts), and
 * what choosing one does is renderer/palette/run.ts.
 */

/** The kinds of row, in the order their headings come with nothing typed. */
export const PALETTE_KINDS = ['action', 'layout', 'preset', 'theme', 'pane', 'settings'] as const
export type PaletteKind = (typeof PALETTE_KINDS)[number]

/**
 * Whether choosing a row does anything now: a row that cannot run stays, set back with its
 * reason, as the picker keeps a widget that cannot pop up; the theme or layout in use does
 * nothing either, being already there.
 */
export type PaletteState = { kind: 'ready' } | { kind: 'current' } | { kind: 'off'; reason: string }

export interface PaletteItem {
  /** Unique across every kind: `action:pane.zoom`, `layout:<id>`, `theme:<id>`... */
  key: string
  kind: PaletteKind
  label: string
  /** What it does, for the description column and the footer. */
  detail: string
  /** Found by typing as written, beside the name: an id, a kind's name, a synonym. */
  words: readonly string[]
  /** The chord it is on now, as the keyboard prints it; null with none. */
  chord: string | null
  /** A word at the row's end saying what Enter does there (a pane: pop up, add, focus). */
  note: string | null
  state: PaletteState
  /** Enter twice: the first press only arms it (`armsFirst`). */
  arm: boolean
}

export interface PaletteRow {
  item: PaletteItem
  /** Where the name matched what was typed, for underlining. */
  spans: number[]
  /** The heading over this row, on the first row of each group with nothing typed. */
  heading?: PaletteKind | 'recent'
}

/** How many rows the palette remembers having run, for the top of the list. */
export const RECENT_MAX = 5

/** Where a run of words begins: what makes "tab" start a word in "Next tab" or "pane.newTab". */
const WORD_EDGE = /[\s.:\-_(&/]/

const startsWord = (text: string, at: number): boolean =>
  at === 0 || WORD_EDGE.test(text[at - 1] ?? '')

/** A match of one typed word in a name: how good, and which letters. */
interface NameMatch {
  score: number
  spans: number[]
}

const range = (from: number, length: number): number[] => Array.from({ length }, (_, i) => from + i)

/** The word as one run of letters, best where a word of the name starts. */
function runIn(name: string, word: string): NameMatch | null {
  let first = -1
  for (let at = name.indexOf(word); at >= 0; at = name.indexOf(word, at + 1)) {
    if (startsWord(name, at)) {
      // The name's own start counts above any later word's.
      return { score: 30 + word.length * 3 + (at === 0 ? 10 : 0), spans: range(at, word.length) }
    }
    if (first < 0) first = at
  }
  return first < 0 ? null : { score: 20 + word.length * 3, spans: range(first, word.length) }
}

/** The word as its letters in order, spread through the name: each run and each word start counts. */
function lettersIn(name: string, word: string): NameMatch | null {
  const spans: number[] = []
  let score = 0
  let from = 0
  for (const letter of word) {
    const at = name.indexOf(letter, from)
    if (at < 0) return null
    const previous = spans.at(-1)
    score +=
      (previous !== undefined && at === previous + 1 ? 3 : 1) + (startsWord(name, at) ? 2 : 0)
    spans.push(at)
    from = at + 1
  }
  return { score, spans }
}

const matchName = (name: string, word: string): NameMatch | null =>
  runIn(name, word) ?? lettersIn(name, word)

/** How a row answers what was typed: null when some word is nowhere in it. */
function matchRow(item: PaletteItem, words: readonly string[]): NameMatch | null {
  const name = item.label.toLowerCase()
  // The words behind a row match only as written: letters spread through them found
  // everything in the mock ("tab" in the themes' words).
  const behind = [item.kind, item.detail, ...item.words].join(' ').toLowerCase()
  let score = 0
  const spans = new Set<number>()
  for (const word of words) {
    const inName = matchName(name, word)
    if (inName !== null) {
      score += inName.score
      for (const at of inName.spans) spans.add(at)
    } else if (behind.includes(word)) score += word.length
    else return null
  }
  return { score, spans: [...spans].sort((a, b) => a - b) }
}

/** Nothing typed: the recent rows, then each kind under its heading, in the sources' order. */
function grouped(
  items: readonly PaletteItem[],
  kind: PaletteKind | 'all',
  recent: readonly string[],
): PaletteRow[] {
  if (kind !== 'all')
    return items.filter((i) => i.kind === kind).map((item) => ({ item, spans: [] }))
  const rows: PaletteRow[] = []
  const recentItems = recent
    .map((key) => items.find((i) => i.key === key))
    .filter((i): i is PaletteItem => i !== undefined)
  recentItems.forEach((item, i) => {
    rows.push(i === 0 ? { item, spans: [], heading: 'recent' } : { item, spans: [] })
  })
  for (const k of PALETTE_KINDS) {
    items
      .filter((i) => i.kind === k)
      .forEach((item, i) => {
        rows.push(i === 0 ? { item, spans: [], heading: k } : { item, spans: [] })
      })
  }
  return rows
}

/**
 * The rows for what was typed, in `kind` or every kind. With nothing typed, `grouped`. With
 * words, each must be in the row - in its name as letters in order, or in the words behind it
 * as written - and the rows are ranked across kinds, a row that cannot run now below every one
 * that can, equal ones in the sources' order.
 */
export function rankItems(
  items: readonly PaletteItem[],
  query: string,
  kind: PaletteKind | 'all',
  recent: readonly string[],
): PaletteRow[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return grouped(items, kind, recent)
  const scoped = kind === 'all' ? items : items.filter((i) => i.kind === kind)
  const matched: Array<{ row: PaletteRow; score: number; off: boolean; order: number }> = []
  scoped.forEach((item, order) => {
    const match = matchRow(item, words)
    if (match === null) return
    matched.push({
      row: { item, spans: match.spans },
      score: match.score,
      off: item.state.kind === 'off',
      order,
    })
  })
  matched.sort((a, b) => Number(a.off) - Number(b.off) || b.score - a.score || a.order - b.order)
  return matched.map((m) => m.row)
}

/** The recent keys after `key` ran: it first, once, at most `RECENT_MAX`. */
export function remember(recent: readonly string[], key: string): string[] {
  return [key, ...recent.filter((k) => k !== key)].slice(0, RECENT_MAX)
}

/** The kind Tab (1) or Shift+Tab (-1) goes to, round every kind and back to all. */
export function nextKind(kind: PaletteKind | 'all', step: 1 | -1): PaletteKind | 'all' {
  const order: ReadonlyArray<PaletteKind | 'all'> = ['all', ...PALETTE_KINDS]
  const at = order.indexOf(kind)
  return order[(at + step + order.length) % order.length] ?? 'all'
}

/**
 * Why an action does nothing now, for each one `shortcutApplies` can refuse (a unit test holds
 * this to it): the palette shows the row set back with these words rather than hiding it.
 */
export const UNAVAILABLE_REASON: Partial<Record<KeybindingAction, string>> = {
  'pane.zoom': 'this pane does not come forward',
  'shell.find': 'no shell to search',
  'shell.clear': 'only from a shell',
  'shell.fontBigger': 'no shell open',
  'shell.fontSmaller': 'no shell open',
  'tab.next': 'not in a tab group',
  'tab.previous': 'not in a tab group',
  'shell.next': 'no other shell from here',
  'shell.previous': 'no other shell from here',
}

/** What an action does, where its label alone does not say. */
export const ACTION_DETAIL: Partial<Record<KeybindingAction, string>> = {
  'pane.add': 'any widget, from the add-pane picker',
  'pane.splitRight': 'a new pane right of the focused one',
  'pane.splitDown': 'a new pane below the focused one',
  'pane.newTab': 'a tab beside the focused pane',
  'pane.close': 'the focused pane',
  'pane.zoom': 'the focused pane over the others, or put it back',
  'layout.reset': 'back to the default layout, ending every shell',
  'layout.saved': 'keep this arrangement, or go back to one',
  'utility.focus': 'awake, QR codes, codecs',
  'shell.clear': 'cannot be undone',
  'app.quit': 'ends every shell',
}

/** What decides whether an action is armed first. */
export interface ArmFacts {
  /** The layout holds a shell pane. */
  anyShell: boolean
  /** The question before a switch or reset is on (settings `layout.confirmSwitch`). */
  confirmSwitch: boolean
}

/**
 * Whether Enter only arms an action, running it on the second: what cannot be undone, where
 * a word typed and Enter could run the first row by mistake. The reset is armed only when its
 * own question would not be asked (`mayReplace`), so it is confirmed once, never twice.
 */
export function armsFirst(action: KeybindingAction, facts: ArmFacts): boolean {
  switch (action) {
    case 'app.quit':
    case 'shell.clear':
      return true
    case 'layout.reset':
      return !facts.anyShell || !facts.confirmSwitch
    default:
      return false
  }
}

/** The word an armed row's second Enter does, for its "enter again to …". */
export function armVerb(action: string): string {
  switch (action) {
    case 'app.quit':
      return 'quit'
    case 'shell.clear':
      return 'clear'
    case 'layout.reset':
      return 'reset'
    default:
      return 'run'
  }
}

/** A name in runs of plain and matched letters, for underlining what was typed. */
export function nameParts(
  label: string,
  spans: readonly number[],
): Array<{ text: string; hit: boolean }> {
  const hits = new Set(spans)
  const parts: Array<{ text: string; hit: boolean }> = []
  for (let i = 0; i < label.length; i++) {
    const hit = hits.has(i)
    const last = parts.at(-1)
    if (last !== undefined && last.hit === hit) last.text += label[i]
    else parts.push({ text: label[i] ?? '', hit })
  }
  return parts
}
