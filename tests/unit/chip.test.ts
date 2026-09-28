import { describe, expect, it } from 'vitest'
import { ChipEngine, pulseHz, triangleHz } from '../../src/renderer/plugins/chip/engine.js'

/**
 * The chip voice (renderer/plugins/chip, docs/plugins.md section 13.12): the console's sound
 * chip - its timer's pitches, its sixteen volume steps a frame apart, the triangle's bass.
 */

const RATE = 48000
const BLOCK = 128

function play(
  notes: { at: number; pitch: number; level: number; release: number }[],
  seconds: number,
) {
  const engine = new ChipEngine(RATE)
  notes.forEach((n, i) => {
    engine.strike(i + 1, n.pitch, n.level, 0, Math.round(n.at * RATE))
    engine.release(i + 1, Math.round(n.release * RATE))
  })
  const frames = Math.ceil((seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let f = 0; f < frames; f += BLOCK)
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, f)
  return { out: left.map((x, i) => x + (right[i] as number)), engine }
}

const cents = (a: number, b: number) => 1200 * Math.log2(a / b)
const hz = (pitch: number) => 440 * 2 ** ((pitch - 69) / 12)

describe('the chip', () => {
  it('plays the pitch its 11-bit timer can make: close in the middle, a little off up high', () => {
    expect(Math.abs(cents(pulseHz(57), hz(57)))).toBeLessThan(3)
    const high = [96, 98, 100, 103, 105].map((p) => Math.abs(cents(pulseHz(p), hz(p))))
    expect(Math.max(...high)).toBeGreaterThan(5)
    expect(Math.max(...high)).toBeLessThan(60)
    // The timer's pitches are CPU / (16 (t + 1)): an integer t for every key.
    for (const p of [60, 72, 90]) expect((1_789_773 / (16 * pulseHz(p))) % 1).toBeCloseTo(0, 6)
    expect((1_789_773 / (32 * triangleHz(40))) % 1).toBeCloseTo(0, 6)
  })

  it('steps its volume a video frame at a time, in sixteen steps', () => {
    const { out } = play([{ at: 0, pitch: 69, level: 1, release: 0.4 }], 0.6)
    // The level across a frame (800 samples) is flat within it and falls between frames.
    const frameLevel = (i: number) => {
      let peak = 0
      const a = Math.round(i * (RATE / 60.0988)) + 200
      for (let k = a; k < a + 300; k++) peak = Math.max(peak, Math.abs(out[k] as number))
      return peak
    }
    const levels = [2, 4, 6, 8].map(frameLevel)
    expect(levels[3]).toBeLessThan((levels[0] as number) * 0.95)
  })

  it('plays low notes on the triangle, which stops the moment it is let go', () => {
    const { out, engine } = play([{ at: 0, pitch: 40, level: 0.4, release: 0.3 }], 0.5)
    let loud = 0
    for (let i = Math.round(0.1 * RATE); i < Math.round(0.2 * RATE); i++)
      loud = Math.max(loud, Math.abs(out[i] as number))
    // No volume: a soft note is as loud as a hard one would be.
    const hard = play([{ at: 0, pitch: 40, level: 1, release: 0.3 }], 0.5).out
    let loudHard = 0
    for (let i = Math.round(0.1 * RATE); i < Math.round(0.2 * RATE); i++)
      loudHard = Math.max(loudHard, Math.abs(hard[i] as number))
    expect(loud).toBeCloseTo(loudHard, 3)
    expect(engine.busy).toBe(false)
  })

  it('renders every key, finite and bounded', () => {
    for (let pitch = 20; pitch <= 120; pitch += 5) {
      const { out } = play([{ at: 0, pitch, level: 1, release: 0.1 }], 0.2)
      expect(
        out.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 2),
        `key ${pitch}`,
      ).toBe(-1)
    }
  })
})
