import { describe, expect, it } from 'vitest'
import { karmanText } from '../../src/renderer/widgets/clock/faces/karman/layout.js'
import {
  MAX_CELLS,
  maskFromAlpha,
  paintSmoke,
  Tunnel,
  tunnelGrid,
} from '../../src/renderer/widgets/clock/faces/karman/solver.js'

/** A W x H mask with a solid block from (x0, y0), w x h cells. */
function block(W: number, H: number, x0: number, y0: number, w: number, h: number): Uint8Array {
  const mask = new Uint8Array(W * H)
  for (let j = y0; j < y0 + h; j++) for (let i = x0; i < x0 + w; i++) mask[j * W + i] = 1
  return mask
}

/** The root mean square divergence over the fluid cells away from the inlet, outlet and obstacles. */
function divergence(t: Tunnel): number {
  const div = t.divergence(new Float32Array(t.u.length))
  let sum = 0
  let n = 0
  for (let j = 2; j < t.H; j++) {
    for (let i = 3; i < t.W - 2; i++) {
      const k = t.ix(i, j)
      if (
        t.solid[k] ||
        t.solid[k + 1] ||
        t.solid[k - 1] ||
        t.solid[k + t.W + 2] ||
        t.solid[k - t.W - 2]
      )
        continue
      sum += (div[k] as number) ** 2
      n++
    }
  }
  return Math.sqrt(sum / n)
}

describe('KARMAN tunnel', () => {
  it('stays near the free stream with nothing in it', () => {
    const t = new Tunnel(60, 16)
    for (let n = 0; n < 60; n++) t.step(0.6)
    let sum = 0
    for (let j = 1; j <= t.H; j++) {
      for (let i = 1; i <= t.W; i++) {
        sum += t.u[t.ix(i, j)] as number
        // The inlet's wobble, meant to start shedding behind an obstacle, is all that stirs it:
        // a ripple of a tenth of the stream or so, never a flow of its own.
        expect(Math.abs((t.u[t.ix(i, j)] as number) - t.speed)).toBeLessThan(t.speed * 0.2)
        expect(Math.abs(t.v[t.ix(i, j)] as number)).toBeLessThan(t.speed * 0.2)
      }
    }
    expect(sum / (t.W * t.H)).toBeCloseTo(t.speed, 1)
  })

  it('holds the flow still inside an obstacle and parts it round', () => {
    const t = new Tunnel(60, 20)
    t.setSolid(block(60, 20, 20, 6, 6, 8))
    for (let n = 0; n < 40; n++) t.step(0.6)
    for (let k = 0; k < t.solid.length; k++) {
      if (!t.solid[k]) continue
      expect(t.u[k]).toBe(0)
      expect(t.v[k]).toBe(0)
      expect(t.dye[k]).toBe(0)
    }
    // Just before the obstacle the flow slows; beside it, it turns away.
    expect(t.u[t.ix(20, 10)]).toBeLessThan(t.speed * 0.8)
    expect(Math.abs(t.v[t.ix(19, 7)] as number)).toBeGreaterThan(0.01)
  })

  it('reduces the divergence by projection', () => {
    const t = new Tunnel(40, 20, { iterations: 40 })
    t.setSolid(block(40, 20, 15, 7, 4, 6))
    // A disturbance that is far from divergence-free. Stam's projection is not exact (its
    // gradient is wider than its Laplacian), so it is a smooth one, the kind it removes.
    for (let j = 1; j <= t.H; j++) {
      for (let i = 1; i <= t.W; i++) {
        t.u[t.ix(i, j)] = t.speed + Math.sin(i * 0.35) * Math.cos(j * 0.3) * 0.8
      }
    }
    const before = divergence(t)
    t.project()
    const after = divergence(t)
    expect(before).toBeGreaterThan(0.05)
    expect(after).toBeLessThan(before * 0.5)
  })

  it('keeps the smoke between 0 and 1', () => {
    const t = new Tunnel(80, 24)
    t.setSolid(block(80, 24, 25, 6, 8, 12))
    for (let n = 0; n < 80; n++) t.step(0.6)
    for (const d of t.dye) {
      expect(d).toBeGreaterThanOrEqual(0)
      expect(d).toBeLessThanOrEqual(1)
    }
    // And smoke still reaches the far end.
    let downstream = 0
    for (let j = 1; j <= t.H; j++) downstream += t.dye[t.ix(t.W - 2, j)] as number
    expect(downstream).toBeGreaterThan(0)
  })

  it('stays finite over a long run', () => {
    const t = new Tunnel(113, 11)
    t.setSolid(block(113, 11, 30, 2, 40, 7))
    for (let n = 0; n < 300; n++) t.step(0.6)
    expect(t.u.every(Number.isFinite)).toBe(true)
    expect(t.v.every(Number.isFinite)).toBe(true)
  })
})

describe('KARMAN grid', () => {
  it('is fine in a low strip and coarser in a big pane', () => {
    expect(tunnelGrid(340, 32)).toMatchObject({ cell: 3, W: 113, H: 11 })
    expect(tunnelGrid(720, 400).cell).toBeGreaterThanOrEqual(4)
  })

  it('caps the cells of a zoomed pane', () => {
    const g = tunnelGrid(1920, 1080)
    expect(g.W * g.H).toBeLessThanOrEqual(MAX_CELLS * 1.02)
    expect(g.W / g.H).toBeCloseTo(1920 / 1080, 1)
  })
})

describe('KARMAN digits', () => {
  it('stand in from the left and inside the pane', () => {
    for (const [w, h] of [
      [340, 32],
      [340, 48],
      [200, 48],
      [720, 400],
      [1920, 1080],
    ] as const) {
      const { fs, x, y } = karmanText(w, h)
      expect(x).toBeGreaterThanOrEqual(w * 0.18)
      expect(x + fs * 4.4).toBeLessThanOrEqual(w)
      expect(y).toBeLessThanOrEqual(h)
      expect(y - fs * 0.7).toBeGreaterThanOrEqual(0)
      expect(fs).toBeGreaterThan(h * 0.15)
    }
  })
})

describe('KARMAN mask and paint', () => {
  it('takes the cells that are mostly covered', () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 40, 0, 0, 0, 120, 0, 0, 0, 0])
    expect([...maskFromAlpha(rgba, 2, 2)]).toEqual([1, 0, 1, 0])
  })

  it('paints the smoke in the dye colour, clear where there is none', () => {
    const t = new Tunnel(4, 8, { streak: 2, streakWidth: 1 })
    const out = new Uint8ClampedArray(4 * 8 * 4)
    paintSmoke(t, out, [10, 20, 30], 0.5)
    // Row 0 is grid row 1: 1 % 2 = 1, no streak; row 1 is grid row 2, a streak.
    expect(out[3]).toBe(0)
    expect([...out.slice(16, 20)]).toEqual([10, 20, 30, 128])
  })
})
