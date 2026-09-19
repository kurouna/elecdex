import type { Repeat } from './tasks.js'

/**
 * Reading a deadline out of what the user typed, in Japanese or English.
 *
 * The rule this follows: **say what was understood, and never quietly eat text.**
 * A parser that guesses at prose is worse than no parser, because the user finds
 * out weeks later that "call 9 on Monday" lost its phone number. So only phrases
 * that are unmistakably a date or a repeat are taken, they are taken only from
 * the edges of the line, and what is taken is shown back as a chip the user can
 * dismiss before the task is added.
 */

const DAY_MS = 86_400_000

/** The hour an all-day task is announced at, when the user named no time. */
export const ALL_DAY_HOUR = 9

export interface ParsedTask {
  /** The line with the understood phrases removed. */
  title: string
  /** Epoch milliseconds, absent when nothing said when. */
  due?: number
  /** True when only a date was named; the pane shows no clock time. */
  allDay: boolean
  repeat: Repeat
  /** The phrases that were understood, as they appeared. Shown in the chip. */
  matched: readonly string[]
}

interface Phrase {
  /** What it matches. Anchored by the caller to the start or end of the line. */
  source: string
  /**
   * Reads the match into the state. Returning false means it only looked like a
   * date ("99:99"), and the text stays in the title where the user put it;
   * anything else - including nothing at all - means it was understood.
   */
  apply: (state: State, text: string) => unknown
}

interface State {
  base: Date
  /** Set when a date was named; the time is applied on top of it. */
  dated: boolean
  /** Set when a clock time was named. */
  timed: boolean
  repeat: Repeat
}

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  sunday: 0,
  日: 0,
  mon: 1,
  monday: 1,
  月: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  火: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  水: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  木: 4,
  fri: 5,
  friday: 5,
  金: 5,
  sat: 6,
  saturday: 6,
  土: 6,
}

/** Moves `date` forward to the next `weekday`, today excluded. */
function toWeekday(date: Date, weekday: number, weeksAhead = 0): void {
  const ahead = (weekday - date.getDay() + 7) % 7 || 7
  date.setDate(date.getDate() + ahead + weeksAhead * 7)
}

function setTime(date: Date, hour: number, minute: number): void {
  date.setHours(hour, minute, 0, 0)
}

/**
 * The phrases, longest first within each group so "明後日" is not read as "明日".
 *
 * Each is matched on its own against the head and the tail of the line; a phrase
 * in the middle of a sentence is left alone, which is what keeps prose intact.
 */
const PHRASES: Phrase[] = [
  // ---- repeats ----
  {
    source: '毎日',
    apply: (s) => {
      s.repeat = 'daily'
    },
  },
  {
    source: '毎週',
    apply: (s) => {
      s.repeat = 'weekly'
    },
  },
  {
    source: '毎月',
    apply: (s) => {
      s.repeat = 'monthly'
    },
  },
  {
    source: '平日毎日|毎平日',
    apply: (s) => {
      s.repeat = 'weekdays'
    },
  },
  {
    source: 'daily',
    apply: (s) => {
      s.repeat = 'daily'
    },
  },
  {
    source: 'weekly',
    apply: (s) => {
      s.repeat = 'weekly'
    },
  },
  {
    source: 'monthly',
    apply: (s) => {
      s.repeat = 'monthly'
    },
  },
  {
    source: 'weekdays',
    apply: (s) => {
      s.repeat = 'weekdays'
    },
  },

  // ---- relative days ----
  {
    source: '明後日',
    apply: (s) => {
      s.base.setDate(s.base.getDate() + 2)
      s.dated = true
    },
  },
  {
    source: '明日|あした',
    apply: (s) => {
      s.base.setDate(s.base.getDate() + 1)
      s.dated = true
    },
  },
  {
    source: '今日|本日',
    apply: (s) => {
      s.dated = true
    },
  },
  {
    source: 'today',
    apply: (s) => {
      s.dated = true
    },
  },
  {
    source: 'tomorrow|tmr',
    apply: (s) => {
      s.base.setDate(s.base.getDate() + 1)
      s.dated = true
    },
  },

  // ---- offsets ----
  {
    source: '(\\d{1,3})\\s*(分後|時間後|日後)',
    apply: (s, text) => {
      const amount = Number(/\d{1,3}/.exec(text)?.[0] ?? '0')
      const unit = text.includes('分') ? 60_000 : text.includes('時間') ? 3_600_000 : DAY_MS
      s.base.setTime(s.base.getTime() + amount * unit)
      s.dated = true
      s.timed = !text.includes('日後')
    },
  },
  {
    source: 'in\\s+(\\d{1,3})\\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?)',
    apply: (s, text) => {
      const amount = Number(/\d{1,3}/.exec(text)?.[0] ?? '0')
      const unit = /\b\d+\s*(m|min)/.test(text)
        ? 60_000
        : /\b\d+\s*(h|hr)/.test(text)
          ? 3_600_000
          : DAY_MS
      s.base.setTime(s.base.getTime() + amount * unit)
      s.dated = true
      s.timed = unit !== DAY_MS
    },
  },

  // ---- weekdays ----
  {
    source: '(来週|次の)?(日|月|火|水|木|金|土)曜日?',
    apply: (s, text) => {
      const key = /[日月火水木金土]曜/.exec(text)?.[0]?.[0] ?? ''
      const weekday = WEEKDAYS[key]
      if (weekday === undefined) return false
      toWeekday(s.base, weekday, /来週|次の/.test(text) ? 1 : 0)
      s.dated = true
      return true
    },
  },
  {
    source:
      '(next\\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues?|weds?|thur?s?|fri|sat)',
    apply: (s, text) => {
      const key = /[a-z]+$/.exec(text.toLowerCase())?.[0] ?? ''
      const weekday = WEEKDAYS[key]
      if (weekday === undefined) return false
      toWeekday(s.base, weekday, text.toLowerCase().startsWith('next') ? 1 : 0)
      s.dated = true
      return true
    },
  },
  {
    source: '来週',
    apply: (s) => {
      s.base.setDate(s.base.getDate() + 7)
      s.dated = true
    },
  },
  {
    source: 'next\\s+week',
    apply: (s) => {
      s.base.setDate(s.base.getDate() + 7)
      s.dated = true
    },
  },

  // ---- calendar dates ----
  {
    source: '(\\d{1,2})月(\\d{1,2})日',
    apply: (s, text) => {
      const [month, day] = (text.match(/\d{1,2}/g) ?? []).map(Number)
      if (month === undefined || day === undefined) return
      applyDate(s, month, day)
    },
  },
  {
    source: '(\\d{1,2})/(\\d{1,2})',
    apply: (s, text) => {
      const [month, day] = (text.match(/\d{1,2}/g) ?? []).map(Number)
      if (month === undefined || day === undefined) return false
      return applyDate(s, month, day)
    },
  },

  // ---- clock times ----
  {
    source: '(午前|午後)?(\\d{1,2})(時|:)(\\d{1,2})?分?',
    apply: (s, text) => {
      const numbers = (text.match(/\d{1,2}/g) ?? []).map(Number)
      let hour = numbers[0]
      const minute = numbers[1] ?? 0
      if (hour === undefined || hour > 23 || minute > 59) return false
      if (text.includes('午後') && hour < 12) hour += 12
      if (text.includes('午前') && hour === 12) hour = 0
      setTime(s.base, hour, minute)
      s.timed = true
      return true
    },
  },
  {
    source: '(\\d{1,2})(:(\\d{2}))?\\s*(am|pm)',
    apply: (s, text) => {
      const numbers = (text.match(/\d{1,2}/g) ?? []).map(Number)
      let hour = numbers[0]
      const minute = numbers[1] ?? 0
      if (hour === undefined || hour > 12 || minute > 59) return false
      const pm = /pm/i.test(text)
      if (pm && hour < 12) hour += 12
      if (!pm && hour === 12) hour = 0
      setTime(s.base, hour, minute)
      s.timed = true
      return true
    },
  },
]

/** A month and day, taken as the next time that date comes round. */
function applyDate(state: State, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = state.base
  const year = date.getFullYear()
  date.setFullYear(year, month - 1, day)
  // A date already past is next year's, which is what "1/5" means in December.
  if (date.getTime() < Date.now() - DAY_MS) date.setFullYear(year + 1)
  state.dated = true
  return true
}

/**
 * Whether a match stands on its own rather than being part of a longer word.
 *
 * Only Latin text needs this: "mon" inside "monitor" is a word, "月" inside
 * "月報" is not separable that way and is guarded by requiring 曜 after it.
 */
function standsAlone(line: string, start: number, end: number): boolean {
  const before = line[start - 1]
  const after = line[end]
  const latin = /[A-Za-z0-9]/
  if (before !== undefined && latin.test(before) && latin.test(line[start] ?? '')) return false
  if (after !== undefined && latin.test(after) && latin.test(line[end - 1] ?? '')) return false
  return true
}

/** How many times the phrase list is walked. Two is enough for every phrase we have. */
const PASSES = 3

/** One walk through the phrase list, taking at most one match per phrase. */
function scan(input: string, state: State, matched: string[]): string {
  let title = input
  for (const phrase of PHRASES) {
    // Only at an edge of what is left: a phrase buried in a sentence is prose.
    const head = new RegExp(`^s*(?:${phrase.source})s*`, 'i').exec(title)
    const tail = new RegExp(`s*(?:${phrase.source})s*$`, 'i').exec(title)
    const hit = head ?? tail
    if (hit === null || hit[0].trim() === '') continue
    const start = hit.index
    const end = start + hit[0].length
    if (!standsAlone(title, start, end)) continue
    if (phrase.apply(state, hit[0]) === false) continue

    matched.push(hit[0].trim())
    title = `${title.slice(0, start)} ${title.slice(end)}`.trim()
  }
  return title
}

/**
 * Reads the deadline and repeat out of a line.
 *
 * `now` is injectable so the tests are not written against the wall clock.
 */
export function parseTask(input: string, now = Date.now()): ParsedTask {
  const base = new Date(now)
  base.setSeconds(0, 0)
  const state: State = { base, dated: false, timed: false, repeat: 'none' }
  const matched: string[] = []

  let title = input
  // Several passes: "明日 9:00" hides the day behind the time, and the day only
  // reaches an edge once the time has been taken off. Bounded, so nothing spins.
  for (let pass = 0; pass < PASSES; pass += 1) {
    const before = title
    title = scan(title, state, matched)
    if (title === before) break
  }

  title = title.replace(/\s{2,}/g, ' ').trim()
  // Nothing but a date is not a task; give the line back untouched.
  if (title === '') return { title: input.trim(), allDay: false, repeat: 'none', matched: [] }

  if (!state.dated && !state.timed) {
    return state.repeat === 'none'
      ? { title, allDay: false, repeat: 'none', matched }
      : // A repeat with no date starts today, at the hour an all-day task uses.
        withDue(title, startingToday(base), true, state.repeat, matched)
  }

  if (!state.timed) setTime(base, ALL_DAY_HOUR, 0)
  // A bare time that has already gone by today means tomorrow.
  if (state.timed && !state.dated && base.getTime() <= now) base.setDate(base.getDate() + 1)

  return withDue(title, base.getTime(), !state.timed, state.repeat, matched)
}

function startingToday(base: Date): number {
  const date = new Date(base)
  setTime(date, ALL_DAY_HOUR, 0)
  if (date.getTime() <= base.getTime()) date.setDate(date.getDate() + 1)
  return date.getTime()
}

function withDue(
  title: string,
  due: number,
  allDay: boolean,
  repeat: Repeat,
  matched: readonly string[],
): ParsedTask {
  return { title, due, allDay, repeat, matched }
}
