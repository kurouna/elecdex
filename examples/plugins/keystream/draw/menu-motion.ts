import type { Shelf } from '../genres'
import type { Rect } from './layout'

/**
 * How the menu moves, in elecdex's own manners. A tab changed is the tube: the list pressed
 * into a line and the new one opening from it, as a pane powers off and on. The rows then
 * come in one after another, as the launcher's tiles do; the light behind a chosen tab or
 * level slides to it, and the cursor glides to its row; the chosen track's stars light one
 * by one. A track started blinks first, as a launched tile does. Nothing here draws: this
 * is the timing, and the menu's drawing asks it where things stand. With motion reduced the
 * menu is simply still.
 */

export const MOTION = {
  /** The list pressed into a line, then the new one opening from it. */
  tabOff: 110,
  tabOn: 190,
  /** The light behind a chip moving to the chosen one. */
  slide: 160,
  /** The cursor moving to its row. */
  glide: 110,
  /** Each row coming in, and the delay from one row to the next. */
  rowIn: 180,
  rowStep: 24,
  /** Each of the chosen track's stars lighting. */
  star: 55,
  /** A track chosen: its row blinks, 100 ms a beat as eDEX's tiles did, and then it loads. */
  blink: 520,
  blinkBeat: 100,
} as const

const easeOut = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3

/**
 * The list's tube at `age` into a tab change: which list is on it, how far open it is
 * (0 a line, 1 open) and how bright the line across it is.
 */
export function tabPower(age: number): { showing: 'before' | 'after'; open: number; line: number } {
  if (age < MOTION.tabOff) {
    const t = age / MOTION.tabOff
    return { showing: 'before', open: 1 - t * t, line: t }
  }
  const t = (age - MOTION.tabOff) / MOTION.tabOn
  if (t >= 1) return { showing: 'after', open: 1, line: 0 }
  return { showing: 'after', open: easeOut(t), line: 1 - t }
}

/** How far row `i` has come in, `age` after the rows began to: 0 to 1. */
export const rowIn = (age: number, i: number): number =>
  easeOut((age - i * MOTION.rowStep) / MOTION.rowIn)

/** Whether a blinking row is lit at `age`: on and off each 50 ms of the beat. */
export const blinkLit = (age: number): boolean => Math.floor(age / (MOTION.blinkBeat / 2)) % 2 === 0

/** How many of `stars` are lit at `age`, and how far the last lit one has popped in. */
export function starsLit(age: number, stars: number): { lit: number; pop: number } {
  const lit = Math.min(stars, Math.floor(age / MOTION.star) + 1)
  const pop = lit >= stars && age >= stars * MOTION.star ? 1 : (age % MOTION.star) / MOTION.star
  return { lit, pop: Math.min(1, pop) }
}

/** A rectangle on its way from one to another, eased. */
export function slideRect(from: Rect, to: Rect, t: number): Rect {
  const e = easeOut(t)
  return {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e,
    w: from.w + (to.w - from.w) * e,
    h: from.h + (to.h - from.h) * e,
  }
}

/** Where the menu's movable parts were drawn last, to move from when they change. */
export interface Drawn {
  tabs: Rect[]
  levels: Rect[]
  /** The top of the cursor's row, or null when no row had it. */
  cursor: number | null
}

/** What moves in this frame; null where nothing does. */
export interface MenuFrame {
  tab: { age: number; from: Rect | null } | null
  level: { age: number; from: Rect | null } | null
  cursor: { age: number; from: number } | null
  /** Since the rows began to come in. */
  rows: number | null
  /** Since the chosen track's stars began to light. */
  stars: number | null
  /** Since the chosen row began to blink. */
  blink: number | null
}

const NEVER = Number.NEGATIVE_INFINITY
const ROWS_MS = MOTION.rowIn + MOTION.rowStep * 12

/** The menu's movements under way, started by what the view does and read by each frame. */
export class MenuMotion {
  /** The shelf a tab change came from: its list is what powers off. */
  before: Shelf = 'all'
  private drawn: Drawn = { tabs: [], levels: [], cursor: null }
  private tabAt = NEVER
  private tabFrom: Rect | null = null
  private levelAt = NEVER
  private levelFrom: Rect | null = null
  private cursorAt = NEVER
  private cursorFrom: number | null = null
  private rowsAt = NEVER
  private starsAt = NEVER
  private blinkAt = NEVER

  /** The tabs changed from the one at `index`, showing `shelf`. */
  tab(now: number, index: number, shelf: Shelf): void {
    this.before = shelf
    this.tabFrom = this.drawn.tabs[index] ?? null
    this.tabAt = now
    this.rowsAt = now + MOTION.tabOff
    this.starsAt = now + MOTION.tabOff + MOTION.tabOn
    this.cursorAt = NEVER
  }

  /** The level changed from the one at `index`: the stars are the new level's. */
  level(now: number, index: number): void {
    this.levelFrom = this.drawn.levels[index] ?? null
    this.levelAt = now
    this.starsAt = now
  }

  /** The cursor moved to another row. */
  moved(now: number): void {
    this.cursorFrom = this.drawn.cursor
    this.cursorAt = now
    this.starsAt = now
  }

  /** The menu came on: its rows come in. */
  shown(now: number): void {
    this.rowsAt = now
    this.starsAt = now + ROWS_MS
    this.blinkAt = NEVER
  }

  /** A row was chosen to start. */
  chosen(now: number): void {
    this.blinkAt = now
  }

  /** Whether the chosen row has blinked its time. */
  blinked(now: number): boolean {
    return now - this.blinkAt >= MOTION.blink
  }

  remember(drawn: Drawn): void {
    this.drawn = drawn
  }

  frame(now: number, reduced: boolean): MenuFrame {
    const since = (at: number, ms: number) => (!reduced && now - at < ms ? now - at : null)
    const tab = since(this.tabAt, MOTION.tabOff + MOTION.tabOn)
    const level = since(this.levelAt, MOTION.slide)
    const cursor = since(this.cursorAt, MOTION.glide)
    const rows = since(this.rowsAt, ROWS_MS)
    return {
      tab: tab === null ? null : { age: tab, from: this.tabFrom },
      level: level === null ? null : { age: level, from: this.levelFrom },
      cursor:
        cursor === null || this.cursorFrom === null ? null : { age: cursor, from: this.cursorFrom },
      rows: now < this.rowsAt && !reduced ? 0 : rows,
      stars: since(this.starsAt, MOTION.star * 6),
      blink: since(this.blinkAt, MOTION.blink),
    }
  }

  /** Whether anything is still moving: the view draws every frame until nothing is. */
  alive(now: number, reduced: boolean): boolean {
    if (reduced) return false
    const f = this.frame(now, false)
    return (
      f.tab !== null ||
      f.level !== null ||
      f.cursor !== null ||
      f.rows !== null ||
      f.stars !== null ||
      f.blink !== null ||
      now < this.rowsAt ||
      now < this.starsAt
    )
  }
}
