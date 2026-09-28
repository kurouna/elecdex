import type { Shelf } from '../genres'
import type { Rect } from './layout'

/**
 * How the menu moves, in elecdex's own manners. A tab changed is the tube: the list pressed
 * into a line and the new one opening from it, as a pane powers off and on. The rows then
 * come in one after another, as the launcher's tiles do; the light behind a chosen tab or
 * level slides to it, and the cursor sweeps to its row with a streak behind it; the chosen
 * track's title decodes, its details are typed out again and its stars light one
 * by one. A track chosen opens its levels on a panel over the list, as a pane powers on - a
 * line opening out - and closes back into a line when it is left; the light behind the
 * chosen level sweeps to it as the cursor does to a row. A track started blinks first, as a
 * launched tile does. Nothing here draws: this
 * is the timing, and the menu's drawing asks it where things stand. With motion reduced the
 * menu is simply still.
 */

export const MOTION = {
  /** The list pressed into a line, then the new one opening from it. */
  tabOff: 110,
  tabOn: 190,
  /** The light behind a chip moving to the chosen one. */
  slide: 160,
  /** The cursor sweeping to its row, a streak behind it. */
  glide: 150,
  /** The chosen title's letters settling, left to right. */
  decode: 240,
  /** The chosen track's details typed out again. */
  type: 320,
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

/**
 * The levels' panel `age` into its opening or its closing: how far open it is (0 a line, 1
 * open) and how bright the line across it is. It opens as a tab's list does, and closes as
 * that list is pressed away.
 */
export function panelPower(age: number, closing: boolean): { open: number; line: number } {
  if (closing) {
    const t = Math.min(1, age / MOTION.tabOff)
    return { open: 1 - t * t, line: t < 1 ? t : 0 }
  }
  const t = Math.min(1, age / MOTION.tabOn)
  return { open: easeOut(t), line: t < 1 ? 1 - t : 0 }
}

/** How far row `i` has come in, `age` after the rows began to: 0 to 1. */
export const rowIn = (age: number, i: number): number =>
  easeOut((age - i * MOTION.rowStep) / MOTION.rowIn)

/** Whether a blinking row is lit at `age`: on and off each 50 ms of the beat. */
export const blinkLit = (age: number): boolean => Math.floor(age / (MOTION.blinkBeat / 2)) % 2 === 0

/** Where the sweeping cursor is, 0 to 1: quick off the mark, easing in at its row. */
export const sweep = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * Math.max(0, t)))

/**
 * The streak the cursor leaves as it sweeps from `from` to where it is (`at`), `t` into the
 * sweep: a few fading copies of its bar back along the way it came.
 */
export function streak(from: number, at: number, t: number): { y: number; alpha: number }[] {
  if (t >= 1 || from === at) return []
  return [0.2, 0.45, 0.7].map((k) => ({ y: at + (from - at) * k, alpha: 0.28 * (1 - t) * (1 - k) }))
}

const GLYPHS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%&$'

/** A title as it decodes `age` into the choice: letters settling from the left, the rest in flux. */
export function decoded(text: string, age: number): string {
  if (age >= MOTION.decode) return text
  const settled = Math.floor((Math.max(0, age) / MOTION.decode) * text.length)
  const tick = Math.floor(Math.max(0, age) / 40)
  return [...text]
    .map((char, i) => {
      if (i < settled || char === ' ') return char
      return GLYPHS[(i * 7 + tick * 13 + char.charCodeAt(0)) % GLYPHS.length] ?? char
    })
    .join('')
}

/** How many of `total` characters are typed `age` into the choice. */
export const typed = (total: number, age: number): number =>
  age >= MOTION.type ? total : Math.max(0, Math.ceil((total * age) / MOTION.type))

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
  /** The level chips under the list; none on FREE PLAY. */
  levels: Rect[]
  /** The levels' rows on their panel, when it is open. */
  panel: Rect[]
  /** The top of the cursor's row, or null when no row had it. */
  cursor: number | null
}

/** What moves in this frame; null where nothing does. */
export interface MenuFrame {
  tab: { age: number; from: Rect | null } | null
  /** The light under the list moving to another level's chip. */
  level: { age: number; from: Rect | null } | null
  cursor: { age: number; from: number } | null
  /** Since the rows began to come in. */
  rows: number | null
  /** Since the choice changed: its stars light, its title decodes, its details are typed. */
  choice: number | null
  /** Since the chosen row began to blink. */
  blink: number | null
  /** The levels' panel opening or closing; null when it is still (open or away). */
  panel: { age: number; closing: boolean } | null
  /** The light on the panel moving to another level. */
  panelLevel: { age: number; from: Rect | null } | null
  /** Since the panel opened: its stars light and its lines are typed. */
  panelChoice: number | null
}

const NEVER = Number.NEGATIVE_INFINITY
const ROWS_MS = MOTION.rowIn + MOTION.rowStep * 12
const CHOICE_MS = Math.max(MOTION.star * 6, MOTION.decode, MOTION.type)

/** The menu's movements under way, started by what the view does and read by each frame. */
export class MenuMotion {
  /** The shelf a tab change came from: its list is what powers off. */
  before: Shelf = 'all'
  private drawn: Drawn = { tabs: [], levels: [], panel: [], cursor: null }
  private tabAt = NEVER
  private tabFrom: Rect | null = null
  private levelAt = NEVER
  private levelFrom: Rect | null = null
  private cursorAt = NEVER
  private cursorFrom: number | null = null
  private rowsAt = NEVER
  private starsAt = NEVER
  private blinkAt = NEVER
  private panelAt = NEVER
  private panelClosing = false
  private panelLevelAt = NEVER
  private panelFrom: Rect | null = null

  /** The tabs changed from the one at `index`, showing `shelf`. */
  tab(now: number, index: number, shelf: Shelf): void {
    this.before = shelf
    this.tabFrom = this.drawn.tabs[index] ?? null
    this.tabAt = now
    this.rowsAt = now + MOTION.tabOff
    this.starsAt = now + MOTION.tabOff + MOTION.tabOn
    this.cursorAt = NEVER
  }

  /**
   * The level changed from the one at `index`: its chip's light slides, and the stars are the
   * new level's.
   */
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

  /** A track's levels opened on their panel. */
  opened(now: number): void {
    this.panelAt = now
    this.panelClosing = false
    this.panelLevelAt = NEVER
  }

  /** The levels' panel closed, back to the list. */
  closed(now: number): void {
    this.panelAt = now
    this.panelClosing = true
  }

  /** The level changed on the panel, from the one at `index`. */
  panelLevel(now: number, index: number): void {
    this.panelFrom = this.drawn.panel[index] ?? null
    this.panelLevelAt = now
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
    const panel = since(this.panelAt, this.panelClosing ? MOTION.tabOff : MOTION.tabOn)
    const panelLevel = since(this.panelLevelAt, MOTION.glide)
    return {
      panel: panel === null ? null : { age: panel, closing: this.panelClosing },
      panelLevel: panelLevel === null ? null : { age: panelLevel, from: this.panelFrom },
      panelChoice: this.panelClosing ? null : since(this.panelAt, CHOICE_MS),
      tab: tab === null ? null : { age: tab, from: this.tabFrom },
      level: level === null ? null : { age: level, from: this.levelFrom },
      cursor:
        cursor === null || this.cursorFrom === null ? null : { age: cursor, from: this.cursorFrom },
      // Before the rows begin to come in (a tab's list still powering off) nothing is on its
      // way: the list on the tube then is the one that left, drawn as it stood.
      rows: now < this.rowsAt ? null : rows,
      choice: since(this.starsAt, CHOICE_MS),
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
      f.choice !== null ||
      f.blink !== null ||
      f.panel !== null ||
      f.panelLevel !== null ||
      f.panelChoice !== null ||
      now < this.rowsAt ||
      now < this.starsAt
    )
  }
}
