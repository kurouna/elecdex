import { framesDue } from '@shared/emu/clock'
import { fitScreen } from '@shared/emu/fit'
import { describe, expect, it } from 'vitest'

const PERIOD = 1000 / 60
const LORES = { w: 64, h: 32 }
const HIRES = { w: 128, h: 64 }

describe('framesDue', () => {
  it('runs a 60 Hz machine once a frame on a 60 Hz display', () => {
    let carry = 0
    let total = 0
    for (let k = 0; k < 60; k++) {
      const due = framesDue(PERIOD, carry, PERIOD, 3)
      carry = due.carryMs
      total += due.frames
    }
    expect(total).toBe(60)
  })

  it('runs it every other frame on a 120 Hz display, carrying the rest', () => {
    const first = framesDue(PERIOD / 2, 0, PERIOD, 3)
    expect(first.frames).toBe(0)
    const second = framesDue(PERIOD / 2, first.carryMs, PERIOD, 3)
    expect(second.frames).toBe(1)
    expect(second.carryMs).toBeCloseTo(0)
  })

  it('drops a long gap rather than catching it up', () => {
    expect(framesDue(5000, 0, PERIOD, 3)).toEqual({ frames: 3, carryMs: 0 })
    expect(framesDue(PERIOD * 3.5, 0, PERIOD, 3).frames).toBe(3)
  })

  it('owes nothing new for a clock that went back or measured nothing', () => {
    expect(framesDue(-50, 4, PERIOD, 3)).toEqual({ frames: 0, carryMs: 4 })
    expect(framesDue(Number.NaN, 0, PERIOD, 3)).toEqual({ frames: 0, carryMs: 0 })
    expect(framesDue(100, 0, 0, 3)).toEqual({ frames: 0, carryMs: 0 })
  })
})

describe('fitScreen', () => {
  const integer = { unit: HIRES, mode: 'integer' } as const

  it('scales by whole device pixels, counted in hires dots', () => {
    // 1000 x 600 fits seven hires dots across (896) and nine down (576): seven.
    expect(fitScreen({ w: 1000, h: 600 }, HIRES, integer)).toEqual({
      scale: 7,
      width: 896,
      height: 448,
      whole: true,
    })
  })

  it('keeps the picture the same size when a program switches resolution', () => {
    const room = { w: 1000, h: 600 }
    const lores = fitScreen(room, LORES, integer)
    const hires = fitScreen(room, HIRES, integer)
    expect(lores.scale).toBe(14)
    expect([lores.width, lores.height]).toEqual([hires.width, hires.height])
  })

  it('fills the room at any ratio in fit mode', () => {
    const fit = fitScreen({ w: 1000, h: 600 }, LORES, { unit: HIRES, mode: 'fit' })
    expect(fit.scale).toBeCloseTo(1000 / 64)
    expect(fit.width).toBeCloseTo(1000)
    expect(fit.whole).toBe(false)
  })

  it('falls back to fit in a room too small for one whole hires dot', () => {
    const tiny = fitScreen({ w: 100, h: 40 }, LORES, integer)
    expect(tiny.scale).toBeCloseTo(40 / 32)
    expect(tiny.whole).toBe(false)
  })

  it('swaps the room for a screen turned a quarter', () => {
    const turned = fitScreen({ w: 300, h: 1000 }, HIRES, { ...integer, rotation: 90 })
    expect(turned.scale).toBe(4)
    expect(fitScreen({ w: 300, h: 1000 }, HIRES, { ...integer, rotation: 180 }).scale).toBe(2)
  })

  it('never goes below nothing', () => {
    expect(fitScreen({ w: 0, h: 0 }, LORES, integer).scale).toBe(0)
    expect(fitScreen({ w: -5, h: 10 }, LORES, integer).scale).toBe(0)
  })
})
