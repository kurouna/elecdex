import type { Chart } from '../chart'
import { lampOf, type Rank, type Tally } from '../judge'
import type { Layout } from './layout'
import { hints } from './menu'
import { clamp, type Paint } from './paint'
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
}

/** How long the reveal runs: the view draws every frame until then, and then stops. */
export const REVEAL_MS = REVEAL.done
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
): void {
  const reveal: Reveal = (start, ms) =>
    p.reduced ? 1 : easeOut(clamp((age - start) / Math.max(1, ms), 0, 1))
  const room = { w: l.w - l.pad * 2, top: l.pad, bottom: l.line - 44 }
  const a = room.w / WIDE.w >= 0.72 ? WIDE : COMPACT
  // Laid out in design units, then scaled and centred in the room above the keyboard.
  const s = clamp(Math.min(room.w / a.w, (room.bottom - room.top) / a.h), 0.5, 1.55)
  const g = p.g
  g.save()
  g.translate(l.w / 2 - (a.w * s) / 2, (room.top + room.bottom) / 2 - (a.h * s) / 2)
  g.scale(s, s)
  sweep(p, a.w, a.h, age)
  header(p, a.w, view, lampOf(view.tally), age, reveal)
  rankEmblem(p, a.emblem, view, age, reveal)
  scoreBlock(p, a.mid.x, a.mid.w, view, age, reveal)
  judgements(p, a.mid.x, a.mid.w, view.tally, reveal)
  if (a.side) analysis(p, a.side.x, a.side.w, view.tally, reveal)
  else summary(p, a.mid.x, 382, view.tally, reveal)
  g.restore()
  if (p.reduced || age >= REVEAL.hints) {
    hints(
      p,
      l,
      [
        ['ENTER', 'MENU'],
        [labels.KeyR ?? 'R', 'RETRY'],
      ],
      l.line - 10,
    )
  }
}
