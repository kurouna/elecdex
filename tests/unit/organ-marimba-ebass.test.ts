import { describe, expect, it } from 'vitest'
import { BassEngine, bassFret } from '../../src/renderer/plugins/ebass/engine.js'
import type { Instrument } from '../../src/renderer/plugins/instruments/host.js'
import { MarimbaEngine } from '../../src/renderer/plugins/marimba/engine.js'
import { OrganEngine } from '../../src/renderer/plugins/organ/engine.js'

/**
 * The organ, the marimba and the electric bass (renderer/plugins/organ, marimba, ebass;
 * docs/plugins.md sections 13.14-13.16): the behaviours that make each itself.
 */

const RATE = 48000
const BLOCK = 128

function play(
  engine: Instrument,
  notes: { at: number; pitch: number; level?: number; release?: number }[],
  seconds: number,
  pedal: { at: number; on: boolean }[] = [],
  from = 0,
): Float32Array {
  notes.forEach((n, i) => {
    engine.strike(i + 1, n.pitch, n.level ?? 0.7, 0, Math.round(n.at * RATE))
    if (n.release !== undefined) engine.release(i + 1, Math.round(n.release * RATE))
  })
  for (const p of pedal) engine.pedal(p.on, Math.round(p.at * RATE))
  const frames = Math.ceil((seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let f = 0; f < frames; f += BLOCK)
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, from + f)
  return left
}

function level(x: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i++) sum += (x[i] as number) ** 2
  return 10 * Math.log10(sum / ((to - from) * RATE) + 1e-30)
}

function component(x: Float32Array, freq: number, from: number, samples: number): number {
  let re = 0
  let im = 0
  const a = Math.round(from * RATE)
  for (let i = 0; i < samples; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / samples)
    re += (x[a + i] as number) * w * Math.cos((2 * Math.PI * freq * i) / RATE)
    im += (x[a + i] as number) * w * Math.sin((2 * Math.PI * freq * i) / RATE)
  }
  return Math.hypot(re, im)
}

describe('the organ', () => {
  it('sounds while a key is held, at one level, and stops when it is let go', () => {
    const x = play(new OrganEngine(RATE), [{ at: 0, pitch: 60, release: 1 }], 1.4)
    expect(Math.abs(level(x, 0.5, 0.6) - level(x, 0.8, 0.9))).toBeLessThan(3)
    expect(level(x, 1.25, 1.4)).toBeLessThan(level(x, 0.8, 0.9) - 30)
  })

  it('strikes its percussion only on a key played when none is held', () => {
    const third = (x: Float32Array, at: number, pitch: number) =>
      component(x, 440 * 2 ** ((pitch - 69) / 12) * 3, at + 0.01, 2400) /
      component(x, 440 * 2 ** ((pitch - 69) / 12), at + 0.01, 2400)
    const alone = play(new OrganEngine(RATE), [{ at: 0, pitch: 60, release: 0.5 }], 0.6)
    const legato = play(
      new OrganEngine(RATE),
      [
        { at: 0, pitch: 60, release: 0.6 },
        { at: 0.5, pitch: 62, release: 1 },
      ],
      1.1,
    )
    expect(third(legato, 0.5, 62)).toBeLessThan(third(alone, 0, 60) * 0.5)
  })

  it('turns its rotors faster while the pedal is held, and lets them coast back', () => {
    const organ = new OrganEngine(RATE)
    const notes = [{ at: 0, pitch: 60, release: 9 }]
    play(organ, notes, 3, [
      { at: 0, on: true },
      { at: 3, on: false },
    ])
    // The light horn is up to speed within a few seconds; the heavy drum is still getting there.
    expect(organ.rotors.horn).toBeGreaterThan(6)
    expect(organ.rotors.drum).toBeGreaterThan(3)
    expect(organ.rotors.drum).toBeLessThan(organ.rotors.horn)
    play(organ, [], 3, [], 3 * RATE)
    expect(organ.rotors.horn).toBeLessThan(1.5)
    expect(organ.rotors.drum).toBeGreaterThan(organ.rotors.horn)
  })
})

describe('the marimba', () => {
  it('has no dampers: letting go changes nothing', () => {
    const held = play(new MarimbaEngine(RATE), [{ at: 0, pitch: 60 }], 1)
    const letGo = play(new MarimbaEngine(RATE), [{ at: 0, pitch: 60, release: 0.05 }], 1)
    expect(letGo).toEqual(held)
  })

  it('loses its two-octave overtone long before its note, and a harder mallet wakes it more', () => {
    const f = 440 * 2 ** ((60 - 69) / 12)
    const hard = play(new MarimbaEngine(RATE), [{ at: 0, pitch: 60, level: 1 }], 1)
    const over = (x: Float32Array, at: number) =>
      component(x, f * 3.98, at, 2400) / component(x, f, at, 2400)
    expect(over(hard, 0.005)).toBeGreaterThan(over(hard, 0.5) * 5)
    const soft = play(new MarimbaEngine(RATE), [{ at: 0, pitch: 60, level: 0.15 }], 0.2)
    expect(over(hard, 0.005)).toBeGreaterThan(over(soft, 0.005) * 2)
  })
})

describe('the electric bass', () => {
  it('plays a note low on the neck, one note a string, and mutes it when let go', () => {
    expect(bassFret(28)).toEqual({ string: 0, fret: 0 })
    expect(bassFret(40)).toEqual({ string: 2, fret: 2 })
    expect(bassFret(50)).toEqual({ string: 3, fret: 7 })
    const x = play(new BassEngine(RATE), [{ at: 0, pitch: 33, release: 0.5 }], 1)
    expect(level(x, 0.8, 1)).toBeLessThan(level(x, 0.2, 0.4) - 40)
  })

  it('is brighter plucked harder, and finite and bounded everywhere', () => {
    const top = (lvl: number) => {
      const x = play(new BassEngine(RATE), [{ at: 0, pitch: 36, level: lvl }], 0.3)
      let all = 0
      let hi = 0
      for (let i = 2000; i < 12000; i++) {
        all += (x[i] as number) ** 2
        hi += ((x[i] as number) - (x[i - 1] as number)) ** 2
      }
      return hi / all
    }
    expect(top(1)).toBeGreaterThan(top(0.2) * 1.3)
    for (let pitch = 20; pitch <= 80; pitch += 6) {
      const x = play(new BassEngine(RATE), [{ at: 0, pitch, level: 1, release: 0.2 }], 0.3)
      expect(
        x.findIndex((v) => !Number.isFinite(v) || Math.abs(v) > 2),
        `key ${pitch}`,
      ).toBe(-1)
    }
  })
})
