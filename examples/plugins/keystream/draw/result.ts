import type { Chart } from '../chart'
import { lampOf, type Rank, type Tally } from '../judge'
import type { Layout } from './layout'
import { hints } from './menu'
import { alpha, clamp, type Paint } from './paint'
import {
  analysis,
  type Emblem,
  header,
  judgements,
  REVEAL,
  type Reveal,
  rankEmblem,
  scoreBlock,
  summary,
  sweep,
  TUBE,
  tube,
} from './result-parts'

/**
 * The result, as a game ends a stage: the heading typed out, the score counting up, the
 * bars filling grade by grade, and then the rank slammed into its diamond and the lamp
 * stamped on - how the play ended, in the link's words. The parts are in result-parts.ts;
 * this lays them out, in a wide arrangement with an analysis panel or a compact one.
 */

export interface ResultView {
  chart: Chart
  index: number
  tally: Tally
  score: number
  rank: Rank
  newRecord: boolean
  failed: boolean
  /** The best score before this play, to set this one against; null on a first play. */
  previous: number | null
  /** The timing offset the play was judged with, for the one the play suggests. */
  offset: number
}

/** How long the reveal runs: the view draws every frame until then, and then stops. */
export const REVEAL_MS = REVEAL.done
/** How long a key pressed on the result takes to act: its hint's blink, and the close. */
export const EXIT_MS = TUBE.blink + TUBE.close
/** When the rank lands and the new record shows, for the sounds that go with them. */
export const RANK_AT = REVEAL.rank
export const RECORD_AT = REVEAL.record

interface Arrangement {
  w: number
  h: number
  emblem: Emblem
  /** The column of the score and the grades. */
  mid: { x: number; w: number }
  /** The analysis panel, where there is room for one. */
  side: { x: number; w: number } | null
}

const WIDE: Arrangement = {
  w: 960,
  h: 392,
  emblem: { cx: 116, cy: 236, r: 106 },
  mid: { x: 284, w: 366 },
  side: { x: 690, w: 270 },
}

const COMPACT: Arrangement = {
  w: 560,
  h: 404,
  emblem: { cx: 82, cy: 236, r: 74 },
  mid: { x: 188, w: 372 },
  side: null,
}

const easeOut = (t: number) => 1 - (1 - t) ** 3

export function drawResult(
  p: Paint,
  l: Layout,
  view: ResultView,
  age: number,
  labels: Readonly<Record<string, string>>,
  /** A key pressed to leave: which hint (0 MENU, 1 RETRY), and how long ago. */
  exit: { key: 0 | 1; age: number } | null = null,
): void {
  const reveal: Reveal = (start, ms) =>
    p.reduced ? 1 : easeOut(clamp((age - start) / Math.max(1, ms), 0, 1))
  const room = { w: l.w - l.pad * 2, top: l.pad, bottom: l.line - 44 }
  const a = room.w / WIDE.w >= 0.72 ? WIDE : COMPACT
  // Laid out in design units, then scaled and centred in the room above the keyboard.
  const s = clamp(Math.min(room.w / a.w, (room.bottom - room.top) / a.h), 0.5, 1.55)
  const g = p.g
  const power = p.reduced ? { open: 1, line: 0 } : tube(age, exit?.age ?? null)
  const mid = (room.top + room.bottom) / 2
  g.save()
  // The screen opens from a line of light, and closes back into it.
  g.translate(0, mid)
  g.scale(1, Math.max(0.01, power.open))
  g.translate(0, -mid)
  g.translate(l.w / 2 - (a.w * s) / 2, mid - (a.h * s) / 2)
  g.scale(s, s)
  sweep(p, a.w, a.h, age)
  header(p, a.w, view, lampOf(view.tally), age, reveal)
  rankEmblem(p, a.emblem, view, age, reveal)
  scoreBlock(p, a.mid.x, a.mid.w, view, age, reveal)
  judgements(p, a.mid.x, a.mid.w, view.tally, reveal)
  if (a.side) analysis(p, a.side.x, a.side.w, view, reveal)
  else summary(p, a.mid.x, 382, view, reveal)
  g.restore()
  if (power.line > 0) tubeLine(p, l.pad, l.w - l.pad * 2, mid, power.line)
  if (p.reduced || age >= REVEAL.hints || exit) {
    const lit = exit !== null && exit.age < TUBE.blink && Math.floor(exit.age / 50) % 2 === 0
    hints(
      p,
      l,
      [
        ['ENTER', 'MENU'],
        [labels.KeyR ?? 'R', 'RETRY'],
      ],
      l.line - 10,
      exit ? { index: exit.key, lit } : null,
    )
  }
}

/** The line of light the result opens from and closes into. */
function tubeLine(p: Paint, x: number, w: number, y: number, strength: number): void {
  const g = p.g
  const glow = g.createLinearGradient(0, y - 14, 0, y + 14)
  glow.addColorStop(0, alpha(p.c.accent, 0))
  glow.addColorStop(0.5, alpha(p.c.accent, (p.light ? 0.12 : 0.24) * strength))
  glow.addColorStop(1, alpha(p.c.accent, 0))
  g.fillStyle = glow
  g.fillRect(x, y - 14, w, 28)
  g.fillStyle = alpha(p.c.accentStrong, 0.9 * strength)
  g.fillRect(x, y - 0.75, w, 1.5)
}
