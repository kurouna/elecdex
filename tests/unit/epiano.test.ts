import { describe, expect, it } from 'vitest'
import { EPianoEngine } from '../../src/renderer/plugins/epiano/engine.js'

/**
 * The electric piano (renderer/plugins/epiano, docs/plugins.md section 13.11): a tine's
 * modes, a tonebar's long fundamental, and a pickup whose nonlinearity makes a hard note bark.
 */

const RATE = 48000
const BLOCK = 128

function play(
  notes: { at: number; pitch: number; level: number; release?: number }[],
  seconds: number,
  pedal: { at: number; on: boolean }[] = [],
  engine = new EPianoEngine(RATE),
): { out: Float32Array; engine: EPianoEngine } {
  notes.forEach((n, i) => {
    engine.strike(i + 1, n.pitch, n.level, 0, Math.round(n.at * RATE))
    if (n.release !== undefined) engine.release(i + 1, Math.round(n.release * RATE))
  })
  for (const p of pedal) engine.pedal(p.on, Math.round(p.at * RATE))
  const frames = Math.ceil((seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let f = 0; f < frames; f += BLOCK)
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, f)
  return { out: left.map((x, i) => x + (right[i] as number)), engine }
}

function level(x: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i++) sum += (x[i] as number) ** 2
  return 10 * Math.log10(sum / ((to - from) * RATE) + 1e-30)
}

/** The size of one frequency in a stretch, by a Hann-windowed correlation. */
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

const hz = (pitch: number) => 440 * 2 ** ((pitch - 69) / 12)

describe('the electric piano', () => {
  it('is round played softly and barks played hard: the pickup, not a filter', () => {
    const second = (lvl: number) => {
      const { out } = play([{ at: 0, pitch: 57, level: lvl }], 0.3)
      return component(out, hz(57) * 2, 0.05, 4800) / component(out, hz(57), 0.05, 4800)
    }
    expect(second(0.2)).toBeLessThan(0.25)
    expect(second(0.9)).toBeGreaterThan(0.6)
  })

  it('rings the tine’s inharmonic mode at the attack, and not after', () => {
    const { out } = play([{ at: 0, pitch: 55, level: 0.9 }], 0.6)
    const bell = (from: number) =>
      component(out, hz(55) * 6.267, from, 960) / component(out, hz(55), from, 960)
    expect(bell(0.002)).toBeGreaterThan(bell(0.4) * 20)
  })

  it('holds its fundamental on the tonebar, longer in the bass', () => {
    const fall = (pitch: number) => {
      const { out } = play([{ at: 0, pitch, level: 0.6 }], 2.2)
      return level(out, 0.2, 0.4) - level(out, 1.9, 2.1)
    }
    expect(fall(40)).toBeLessThan(fall(76))
    expect(fall(60)).toBeLessThan(25)
  })

  it('damps a key let go, unless the pedal holds it off', () => {
    const dry = play([{ at: 0, pitch: 60, level: 0.7, release: 0.3 }], 1).out
    const held = play([{ at: 0, pitch: 60, level: 0.7, release: 0.3 }], 1, [
      { at: 0, on: true },
    ]).out
    expect(level(dry, 0.8, 1)).toBeLessThan(level(held, 0.8, 1) - 30)
    // Lifting the pedal lets it go.
    const lifted = play([{ at: 0, pitch: 60, level: 0.7, release: 0.3 }], 1.5, [
      { at: 0, on: true },
      { at: 0.8, on: false },
    ])
    expect(level(lifted.out, 1.3, 1.5)).toBeLessThan(level(held, 0.8, 1) - 30)
    expect(lifted.engine.busy).toBe(false)
  })

  it('is voiced even across the keyboard, a little softer at its ends', () => {
    // Found in review (2026-09-28): the bass and the top were ten decibels under the middle.
    const at = (pitch: number) => level(play([{ at: 0, pitch, level: 0.5 }], 0.4).out, 0.05, 0.35)
    const middle = at(60)
    for (const pitch of [36, 48, 72, 84])
      expect(Math.abs(at(pitch) - middle), `key ${pitch}`).toBeLessThan(4)
    expect(at(96)).toBeGreaterThan(middle - 8)
  })

  it('renders every key at every blow, finite and bounded', () => {
    for (let pitch = 20; pitch <= 110; pitch += 6) {
      for (const lvl of [0, 0.5, 1]) {
        const { out } = play([{ at: 0, pitch, level: lvl, release: 0.2 }], 0.25)
        expect(
          out.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 4),
          `key ${pitch} ${lvl}`,
        ).toBe(-1)
      }
    }
  })
})
