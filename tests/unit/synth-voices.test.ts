import { describe, expect, it } from 'vitest'
import { AnalogEngine, type Patch } from '../../src/renderer/plugins/synth/engine.js'

/**
 * The synthesiser voices (renderer/plugins/synth, docs/plugins.md section 13.13): one analogue
 * path - band-limited oscillators, a saturating ladder, envelopes - in four patches; the lead
 * glides as a monophonic synthesiser does, and the pad's chorus spreads it.
 */

const RATE = 48000
const BLOCK = 128
const PATCHES: Patch[] = ['lead', 'bass', 'pad', 'pluck']

function play(
  patch: Patch,
  notes: { at: number; pitch: number; level?: number; release: number }[],
  seconds: number,
) {
  const engine = new AnalogEngine(RATE, patch)
  notes.forEach((n, i) => {
    engine.strike(i + 1, n.pitch, n.level ?? 0.8, 0, Math.round(n.at * RATE))
    engine.release(i + 1, Math.round(n.release * RATE))
  })
  const frames = Math.ceil((seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let f = 0; f < frames; f += BLOCK)
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, f)
  return { left, right, engine }
}

function level(x: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i++) sum += (x[i] as number) ** 2
  return 10 * Math.log10(sum / ((to - from) * RATE) + 1e-30)
}

/**
 * The period near an expected frequency, by autocorrelation over a stretch, as a frequency:
 * searched within a factor of `within` either way.
 */
function pitchNear(x: Float32Array, from: number, to: number, hz: number, within = 1.4): number {
  const a = Math.round(from * RATE)
  const n = Math.round((to - from) * RATE)
  let best = -2
  let lag = 0
  for (let L = Math.floor(RATE / (hz * within)); L <= Math.ceil((RATE * within) / hz); L++) {
    let s = 0
    let e1 = 0
    let e2 = 0
    for (let i = 0; i < n; i++) {
      s += (x[a + i] as number) * (x[a + i + L] as number)
      e1 += (x[a + i] as number) ** 2
      e2 += (x[a + i + L] as number) ** 2
    }
    const c = s / Math.sqrt(e1 * e2 + 1e-30)
    if (c > best) {
      best = c
      lag = L
    }
  }
  return RATE / lag
}

describe('the analogue voices', () => {
  it('render every key, finite and bounded, and fall idle after their release', () => {
    for (const patch of PATCHES) {
      for (let pitch = 24; pitch <= 108; pitch += 12) {
        const { left, engine } = play(patch, [{ at: 0, pitch, release: 0.3 }], 3)
        expect(
          left.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 3),
          `${patch} ${pitch}`,
        ).toBe(-1)
        expect(engine.busy, `${patch} ${pitch}`).toBe(false)
      }
    }
  })

  it('open the ladder with the envelope: a pluck is bright at once and dark soon after', () => {
    const { left } = play('pluck', [{ at: 0, pitch: 60, release: 1 }], 0.6)
    const bright = (from: number) => {
      let all = 0
      let top = 0
      for (let i = Math.round(from * RATE) + 1; i < Math.round((from + 0.03) * RATE); i++) {
        all += (left[i] as number) ** 2
        top += ((left[i] as number) - (left[i - 1] as number)) ** 2
      }
      return top / all
    }
    expect(bright(0.005)).toBeGreaterThan(bright(0.3) * 4)
  })

  it('glide the lead from a held note to the next, without starting it again', () => {
    const { left } = play(
      'lead',
      [
        { at: 0, pitch: 57, release: 0.55 },
        { at: 0.5, pitch: 69, release: 1.2 },
      ],
      1.2,
    )
    // Its sub-octave oscillator makes the period an octave below the key: 110 Hz, then 220.
    expect(pitchNear(left, 0.2, 0.3, 110, 1.3) / 110).toBeCloseTo(1, 1)
    expect(pitchNear(left, 0.7, 0.8, 220, 1.3) / 220).toBeCloseTo(1, 1)
    const between = pitchNear(left, 0.51, 0.525, 155, 1.35)
    expect(between).toBeGreaterThan(118)
    expect(between).toBeLessThan(205)
    // Legato: the envelope carries on, so there is no dip where the second note came.
    expect(level(left, 0.49, 0.51)).toBeGreaterThan(level(left, 0.3, 0.4) - 3)
  })

  it('spreads the pad by its chorus, left from right', () => {
    const { left, right } = play('pad', [{ at: 0, pitch: 60, release: 1 }], 1)
    let diff = 0
    for (let i = Math.round(0.5 * RATE); i < Math.round(0.8 * RATE); i++)
      diff += ((left[i] as number) - (right[i] as number)) ** 2
    expect(10 * Math.log10(diff / (0.3 * RATE))).toBeGreaterThan(level(left, 0.5, 0.8) - 20)
  })
})
