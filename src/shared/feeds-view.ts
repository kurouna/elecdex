/**
 * How the RSS pane shows its feeds: the pane's own choices read from its state, each feed's
 * mark, the keyword rules, and the list cut into days. Pure, so the widget only draws.
 * (docs/architecture.md §5.27; the look is docs/rss-mock.)
 */

import type { FeedItem, ShownItem } from './feeds.js'

/** LIST: two lines a headline. CARD: a picture and a summary. TICKER: one headline at a time. */
export const FEED_VIEWS = ['list', 'card', 'ticker'] as const
export type FeedView = (typeof FEED_VIEWS)[number]

export function paneView(raw: unknown): FeedView {
  return FEED_VIEWS.includes(raw as FeedView) ? (raw as FeedView) : 'list'
}

/* ---- Marks ---- */

/**
 * A feed's mark: a short tag in a box, in a hue turned off the theme's accent. The turns are
 * spread round the colour wheel in the order feeds are added, so neighbours differ; with
 * more feeds than turns they repeat, and the tag still tells them apart.
 */
export const MARK_TURNS = [0, 140, 260, 320, 70, 200, 30, 100, 230, 290] as const
export const MARK_TAG_MAX = 3

export interface FeedMark {
  tag: string
  /** Degrees added to the accent's hue. */
  turn: number
}

/** What a pane keeps per feed: the turn always, the tag only when the user wrote one. */
export interface StoredMark {
  tag?: string
  turn: number
}

const LATIN_WORD = /[\p{Script=Latin}\d]+/gu

/**
 * A tag from a feed's title: the initials of its first two Latin words ("Kernel Notes" ->
 * KN), the first two letters of a single one ("Zenn" -> ZE), or its first two characters when
 * it has no Latin word ("技術ブログ" -> 技術).
 */
export function autoTag(title: string): string {
  const words = title.match(LATIN_WORD) ?? []
  const [first, second] = words
  if (first !== undefined && second !== undefined) {
    return `${[...first][0]}${[...second][0]}`.toUpperCase()
  }
  if (first !== undefined) return [...first].slice(0, 2).join('').toUpperCase()
  const letters = [...title.replace(/\s+/g, '')]
  return letters.length === 0 ? '··' : letters.slice(0, 2).join('')
}

/** A tag as the user typed it, or null when it is not one: one to three characters, no space. */
export function cleanTag(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const letters = [...raw.trim().replace(/\s+/g, '')]
  if (letters.length === 0 || letters.length > MARK_TAG_MAX) return null
  return letters.join('').toUpperCase()
}

/** The marks a pane keeps, dropping anything that is not one. */
export function storedMarks(raw: unknown): Record<string, StoredMark> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: Record<string, StoredMark> = {}
  for (const [url, value] of Object.entries(raw)) {
    if (typeof value !== 'object' || value === null) continue
    const turn = (value as { turn?: unknown }).turn
    if (typeof turn !== 'number' || !MARK_TURNS.includes(turn as never)) continue
    const tag = cleanTag((value as { tag?: unknown }).tag)
    out[url] = tag === null ? { turn } : { tag, turn }
  }
  return out
}

/** The first turn no listed feed holds, or the least used one when every turn is taken. */
export function freeTurn(taken: readonly number[]): number {
  const free = MARK_TURNS.find((turn) => !taken.includes(turn))
  if (free !== undefined) return free
  const uses = (turn: number) => taken.filter((t) => t === turn).length
  return [...MARK_TURNS].sort((a, b) => uses(a) - uses(b))[0] ?? 0
}

/**
 * Every listed feed's mark: its stored turn and tag where it has them, a free turn and a tag
 * from its title where not (a list written before marks, or a feed whose mark was lost).
 */
export function feedMarks(
  feeds: readonly string[],
  stored: Record<string, StoredMark>,
  titles: Record<string, string>,
): Record<string, FeedMark> {
  const taken = feeds.flatMap((url) => (stored[url] === undefined ? [] : [stored[url].turn]))
  const out: Record<string, FeedMark> = {}
  for (const url of feeds) {
    let turn = stored[url]?.turn
    if (turn === undefined) {
      turn = freeTurn(taken)
      taken.push(turn)
    }
    out[url] = { turn, tag: stored[url]?.tag ?? autoTag(titles[url] ?? hostName(url)) }
  }
  return out
}

function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/* ---- Keywords ---- */

export const WORDS_MAX = 20
export const WORD_MAX_LENGTH = 40

/** A pane's highlight or mute list: trimmed, distinct ignoring case, at most twenty. */
export function paneWords(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string') continue
    const word = value.trim().replace(/\s+/g, ' ')
    if (word === '' || word.length > WORD_MAX_LENGTH) continue
    if (out.some((w) => w.toLowerCase() === word.toLowerCase())) continue
    out.push(word)
    if (out.length === WORDS_MAX) break
  }
  return out
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * One pattern for a list of words, any case. A word that begins or ends with a Latin letter
 * or digit matches only as a whole word there ("CRT" is not in "sCRTipt"); other scripts have
 * no spaces between words, so there it matches anywhere ("宇宙" in "宇宙船").
 */
export function wordPattern(words: readonly string[]): RegExp | null {
  if (words.length === 0) return null
  const edge = /[\p{L}\p{N}]/u
  const latin = /[\p{Script=Latin}\d]/u
  const parts = [...words]
    .sort((a, b) => b.length - a.length)
    .map((word) => {
      const head = [...word][0] ?? ''
      const tail = [...word].at(-1) ?? ''
      const before = latin.test(head) && edge.test(head) ? '(?<![\\p{L}\\p{N}])' : ''
      const after = latin.test(tail) && edge.test(tail) ? '(?![\\p{L}\\p{N}])' : ''
      return `${before}${escapeRegExp(word)}${after}`
    })
  return new RegExp(parts.join('|'), 'giu')
}

/** Whether a headline holds a muted word. */
export function isMuted(item: Pick<FeedItem, 'title'>, mute: RegExp | null): boolean {
  if (mute === null) return false
  mute.lastIndex = 0
  return mute.test(item.title)
}

/** Whether a headline or its summary holds what is searched, any case. */
export function matchesFind(item: Pick<FeedItem, 'title' | 'summary'>, find: string): boolean {
  const needle = find.trim().toLowerCase()
  if (needle === '') return true
  return (
    item.title.toLowerCase().includes(needle) ||
    (item.summary?.toLowerCase().includes(needle) ?? false)
  )
}

export interface TextPart {
  text: string
  /** A highlighted word or what was searched. */
  lit: boolean
}

/** A headline cut into plain and lit parts, for the highlight words and the search. */
type Range = [number, number]

function wordRanges(text: string, highlight: RegExp | null): Range[] {
  if (highlight === null) return []
  highlight.lastIndex = 0
  return [...text.matchAll(highlight)]
    .filter((match) => match[0] !== '')
    .map((match): Range => [match.index, match.index + match[0].length])
}

function findRanges(text: string, find: string): Range[] {
  const needle = find.trim().toLowerCase()
  if (needle === '') return []
  const lower = text.toLowerCase()
  // Where lower case changes a character's length (İ), positions in it are not the text's: the
  // headline still matches, unlit, rather than lit in the wrong place (found in review).
  if (lower.length !== text.length) return []
  const ranges: Range[] = []
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, at + needle.length)) {
    ranges.push([at, at + needle.length])
  }
  return ranges
}

export function litParts(text: string, highlight: RegExp | null, find: string): TextPart[] {
  const ranges = [...wordRanges(text, highlight), ...findRanges(text, find)]
  if (ranges.length === 0) return [{ text, lit: false }]
  ranges.sort((a, b) => a[0] - b[0])
  const merged: Range[] = []
  for (const [start, end] of ranges) {
    const last = merged.at(-1)
    if (last !== undefined && start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  const parts: TextPart[] = []
  let at = 0
  for (const [start, end] of merged) {
    if (start > at) parts.push({ text: text.slice(at, start), lit: false })
    parts.push({ text: text.slice(start, end), lit: true })
    at = end
  }
  if (at < text.length) parts.push({ text: text.slice(at), lit: false })
  return parts
}

/* ---- Days and the last look ---- */

const DAY_MS = 24 * 60 * 60_000

/** Local midnight of the day `at` falls on. */
export function dayOf(at: number): number {
  const date = new Date(at)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export interface DaySection {
  /** Local midnight, or null for the items with no date. */
  day: number | null
  /** TODAY, YESTERDAY, the month and day, or UNDATED. */
  label: string
  /** The date beside a TODAY or YESTERDAY label; null for the others. */
  date: string | null
  items: ShownItem[]
}

const monthDay = (at: number) => {
  const date = new Date(at)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * The list cut at local midnights, newest first as given. Labels are relative to `now`'s
 * day only (the pane re-reads `now` at midnight); never "an hour ago", which would need a
 * timer to stay true.
 */
function dayLabel(day: number | null, today: number): Pick<DaySection, 'label' | 'date'> {
  if (day === null) return { label: 'undated', date: null }
  if (day === today) return { label: 'today', date: monthDay(day) }
  if (day === dayOf(today - DAY_MS / 2)) return { label: 'yesterday', date: monthDay(day) }
  return { label: monthDay(day), date: null }
}

export function daySections(items: readonly ShownItem[], now: number): DaySection[] {
  const today = dayOf(now)
  const sections: DaySection[] = []
  for (const item of items) {
    const day = item.at === null ? null : dayOf(item.at)
    let section = sections.at(-1)
    if (section === undefined || section.day !== day) {
      section = { day, ...dayLabel(day, today), items: [] }
      sections.push(section)
    }
    section.items.push(item)
  }
  return sections
}

/**
 * Where the LAST SEEN line goes: the key of the first item published before the pane was
 * last seen, or null when the line would mark nothing (no earlier look, or every item on
 * one side of it). Items with no date never get it.
 */
export function lastSeenKey(items: readonly ShownItem[], seenAt: number | null): string | null {
  if (seenAt === null) return null
  const at = items.findIndex((item) => item.at !== null && item.at < seenAt)
  if (at <= 0) return null
  return items[at]?.key ?? null
}

/** The pane's last look at the list, from its state: a time, or null. */
export function paneSeenAt(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null
}

/** TICKER's period: a headline every this long, on the wall clock's grid. */
export const TICKER_PERIOD_MS = 6000
