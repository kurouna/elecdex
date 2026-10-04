import { PAD_BUTTONS } from '@shared/elec16/pad'
import { BITMAP_HEIGHT, BITMAP_WIDTH } from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import {
  BODIES,
  bodyFor,
  DISH,
  dpadCross,
  legendOf,
  PLAY_SKIN_COLOURS,
  PLAY_SKINS,
  type PlayBody,
  playScale,
  type Rect,
  recess,
  SPEAKER_TURN,
  TALL,
  turned,
  WELL,
  WIDE,
} from '../../src/renderer/widgets/elec16/play-body'

/**
 * PLAY-320's two bodies (docs/elec16-play.md section 8): one geometry for both, held here -
 * the screen whole in its frame, every button on the body and none over another, the bar or
 * the screen - and how a body is sized and chosen for the room.
 */

const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h

const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const all = (b: PlayBody): Rect => ({ x: 0, y: 0, w: b.width, h: b.height })

describe.each([
  ['tall', TALL],
  ['wide', WIDE],
])('the %s body', (_, b) => {
  it('holds the 320 x 288 screen whole, in its frame, in the case, under the bar', () => {
    expect([b.screen.w, b.screen.h]).toEqual([BITMAP_WIDTH, BITMAP_HEIGHT])
    expect(Number.isInteger(b.screen.x) && Number.isInteger(b.screen.y)).toBe(true)
    expect(inside(b.screen, b.frame)).toBe(true)
    expect(inside(b.frame, b.body)).toBe(true)
    expect(inside(b.bar, b.body)).toBe(true)
    expect(overlap(b.bar, b.frame)).toBe(false)
    expect(inside(b.body, all(b))).toBe(true)
  })

  it('has all twelve buttons, each on the case (the shoulders on its top edge)', () => {
    expect(Object.keys(b.buttons).sort()).toEqual([...PAD_BUTTONS].sort())
    for (const [name, r] of Object.entries(b.buttons)) {
      expect(inside(r, all(b)), name).toBe(true)
      if (r.shape === 'shoulder') {
        // Above the top, reaching down onto it, and clear of the bar's name and lamp.
        expect(r.y, name).toBeLessThan(b.body.y)
        expect(r.y + r.h, name).toBeGreaterThan(b.body.y)
        expect(r.y + r.h, name).toBeLessThanOrEqual(b.bar.y)
      } else {
        expect(inside(r, b.body), name).toBe(true)
      }
    }
  })

  it('puts no button over another, the d-pad middle, the bar, the screen, a legend or the speaker as turned', () => {
    const speaker = turned(b.speaker, SPEAKER_TURN)
    expect(inside(speaker, b.body)).toBe(true)
    const parts: [string, Rect][] = [
      ...Object.entries(b.buttons),
      ['hub', b.hub],
      ['bar', b.bar],
      ['frame', b.frame],
      ['speaker', speaker],
      ['select legend', legendOf(b.buttons.select)],
      ['start legend', legendOf(b.buttons.start)],
    ]
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const [p, q] = [parts[i], parts[j]] as [[string, Rect], [string, Rect]]
        expect(overlap(p[1], q[1]), `${p[0]} and ${q[0]}`).toBe(false)
      }
    }
  })

  it('lays the d-pad round its middle and the face buttons as the mock: X above, Y left, A right, B below', () => {
    const { up, down, left, right, x, y, a, b: bb } = b.buttons
    const centre = (r: Rect) => [r.x + r.w / 2, r.y + r.h / 2] as const
    const [hx, hy] = centre(b.hub)
    expect(centre(up)[0]).toBe(hx)
    expect(centre(down)[0]).toBe(hx)
    expect(centre(left)[1]).toBe(hy)
    expect(centre(right)[1]).toBe(hy)
    expect(up.y + up.h).toBe(b.hub.y)
    expect(down.y).toBe(b.hub.y + b.hub.h)
    expect(left.x + left.w).toBe(b.hub.x)
    expect(right.x).toBe(b.hub.x + b.hub.w)
    expect(centre(x)[1]).toBeLessThan(centre(a)[1])
    expect(centre(y)[0]).toBeLessThan(centre(x)[0])
    expect(centre(a)[0]).toBeGreaterThan(centre(x)[0])
    expect(centre(bb)[1]).toBeGreaterThan(centre(a)[1])
    expect(centre(x)[0]).toBe(centre(bb)[0])
    expect(centre(y)[1]).toBe(centre(a)[1])
    // The d-pad on the left, the face buttons on the right.
    expect(hx).toBeLessThan(centre(y)[0])
  })
})

describe.each([
  ['tall', TALL],
  ['wide', WIDE],
])('the recesses of the %s body', (_, b) => {
  it('sits the d-pad on its plate in a dish, and each round button and pill in a well, all on the case', () => {
    const cross = dpadCross(b)
    for (const k of ['up', 'down', 'left', 'right'] as const)
      expect(inside(b.buttons[k], cross), k).toBe(true)
    expect(inside(b.hub, cross)).toBe(true)
    const dish = recess(cross, DISH)
    expect(inside(dish, b.body)).toBe(true)
    const wells = (['a', 'b', 'x', 'y', 'select', 'start'] as const).map(
      (k) => [k, recess(b.buttons[k], WELL)] as [string, Rect],
    )
    for (const [k, w] of wells) expect(inside(w, b.body), k).toBe(true)
    // Nothing else lies in them: the frame, the bar, the speaker turned, the legends, each other.
    const others: [string, Rect][] = [
      ['frame', b.frame],
      ['bar', b.bar],
      ['speaker', turned(b.speaker, SPEAKER_TURN)],
      ['select legend', legendOf(b.buttons.select)],
      ['start legend', legendOf(b.buttons.start)],
    ]
    for (const [k, r] of [['dish', dish] as [string, Rect], ...wells]) {
      for (const [o, q] of others) expect(overlap(r, q), `${k} and ${o}`).toBe(false)
    }
    for (const [k, w] of wells) expect(overlap(dish, w), `dish and ${k}`).toBe(false)
  })

  it('keeps the round wells apart: circles, farther between their middles than their radii', () => {
    const round = (['a', 'b', 'x', 'y'] as const).map((k) => recess(b.buttons[k], WELL))
    for (let i = 0; i < round.length; i++) {
      for (let j = i + 1; j < round.length; j++) {
        const [p, q] = [round[i], round[j]] as [Rect, Rect]
        const d = Math.hypot(p.x + p.w / 2 - (q.x + q.w / 2), p.y + p.h / 2 - (q.y + q.h / 2))
        expect(d).toBeGreaterThan(p.w / 2 + q.w / 2)
      }
    }
  })
})

describe('the bodies told apart', () => {
  it('is tall standing up and wide lying down', () => {
    expect(TALL.height).toBeGreaterThan(TALL.width)
    expect(WIDE.width).toBeGreaterThan(WIDE.height)
    expect(BODIES).toEqual({ tall: TALL, wide: WIDE })
    // The tall one has the buttons under the screen, the wide one beside it.
    expect(TALL.buttons.a.y).toBeGreaterThan(TALL.frame.y + TALL.frame.h)
    expect(WIDE.buttons.a.x).toBeGreaterThan(WIDE.frame.x + WIDE.frame.w)
    expect(WIDE.buttons.left.x + WIDE.buttons.left.w).toBeLessThan(WIDE.frame.x)
  })

  it('puts SELECT left of START, and the shoulders L left and R right', () => {
    for (const b of [TALL, WIDE]) {
      expect(b.buttons.select.x).toBeLessThan(b.buttons.start.x)
      expect(b.buttons.l.x).toBeLessThan(b.buttons.r.x)
      // Mirrored about the middle.
      expect(b.buttons.l.x).toBe(b.width - (b.buttons.r.x + b.buttons.r.w))
    }
  })
})

describe('sizing and choosing a body', () => {
  it('takes whole device pixels a dot where one fits, else what fits, never stretched', () => {
    expect(playScale({ w: 384, h: 688, ratio: 1 }, 384, 688)).toBe(1)
    expect(playScale({ w: 800, h: 1400, ratio: 1 }, 384, 688)).toBe(2)
    expect(playScale({ w: 800, h: 700, ratio: 1 }, 384, 688)).toBe(1)
    // Device pixels: a display at 1.5 gives 1.5 times as many.
    expect(playScale({ w: 600, h: 1000, ratio: 1.5 }, 384, 688)).toBe(2)
    expect(playScale({ w: 192, h: 344, ratio: 1 }, 384, 688)).toBeCloseTo(0.5)
    expect(playScale({ w: 10, h: 10, ratio: 1 }, 384, 688)).toBe(0.1)
    expect(playScale({ w: 0, h: 500, ratio: 1 }, 384, 688)).toBe(0)
  })

  it('chooses the body whose screen comes out larger, the tall one on a tie', () => {
    expect(bodyFor({ w: 500, h: 1000, ratio: 1 })).toBe('tall')
    expect(bodyFor({ w: 1800, h: 600, ratio: 1 })).toBe('wide')
    expect(bodyFor({ w: 1000, h: 1000, ratio: 1 })).toBe('tall')
    // Exactly as large either way: the wide one's width and the tall one's height.
    expect(bodyFor({ w: WIDE.width, h: TALL.height, ratio: 1 })).toBe('tall')
    expect(bodyFor({ w: WIDE.width * 2, h: TALL.height, ratio: 1 })).toBe('wide')
  })

  it('has the three colours of the mock, each with every part', () => {
    expect(PLAY_SKINS).toEqual(['graphite', 'ivory', 'coral'])
    for (const id of PLAY_SKINS) {
      const c = PLAY_SKIN_COLOURS[id]
      for (const v of [c.case, c.edge, c.print, c.name, c.lamp, ...c.ab, ...c.xy, ...c.dark]) {
        expect(v, id).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })
})

describe('turning a rectangle', () => {
  it('covers its corners as they turn, and is itself unturned', () => {
    const r = { x: 10, y: 20, w: 40, h: 20 }
    expect(turned(r, 0)).toEqual(r)
    const right = turned(r, 90)
    expect(right.w).toBeCloseTo(20)
    expect(right.h).toBeCloseTo(40)
    expect(right.x + right.w / 2).toBeCloseTo(30)
    expect(right.y + right.h / 2).toBeCloseTo(30)
    const tilted = turned(r, -24)
    expect(tilted.w).toBeGreaterThan(r.w)
    expect(tilted.h).toBeGreaterThan(r.h)
  })
})
