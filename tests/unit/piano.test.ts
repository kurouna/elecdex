import { describe, expect, it } from 'vitest'
import { roomResponse, soundboardResponse } from '../../src/renderer/plugins/piano/body.js'
import { contactSteps, MODE_BUDGET, PianoEngine } from '../../src/renderer/plugins/piano/engine.js'
import {
  contactIntegral,
  coupledModes,
  FIRST_UNDAMPED,
  fundamental,
  keyModel,
  longitudinalOf,
  modelMade,
  stringsOf,
  unisonCents,
} from '../../src/renderer/plugins/piano/model.js'

/**
 * The physical piano (renderer/plugins/piano, docs/plugins.md section 13.8): the physics it
 * rests on, read back from the model, and the engine's behaviour, read from what it renders.
 * Nothing here is heard; `node scripts/piano-wav.mjs` writes the same code to WAV files.
 */

const RATE = 48000
const BLOCK = 128

interface Take {
  strikes?: { at: number; pitch: number; level: number; release?: number }[]
  pedal?: { at: number; on: boolean }[]
  seconds: number
  engine?: PianoEngine
}

/** Renders a take, mono (left + right), with the engine's peak mode count. */
function render(take: Take): { out: Float32Array; engine: PianoEngine; modes: number } {
  const engine = take.engine ?? new PianoEngine(RATE)
  take.strikes?.forEach((s, i) => {
    engine.strike(i + 1, s.pitch, s.level, 0, Math.round(s.at * RATE))
    if (s.release !== undefined) engine.release(i + 1, Math.round(s.release * RATE))
  })
  for (const p of take.pedal ?? []) engine.pedal(p.on, Math.round(p.at * RATE))
  const frames = Math.ceil((take.seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  let modes = 0
  for (let f = 0; f < frames; f += BLOCK) {
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, f)
    modes = Math.max(modes, engine.modes)
  }
  return { out: left.map((x, i) => x + (right[i] as number)), engine, modes }
}

/** The energy of a stretch of samples, in dB. */
function level(x: Float32Array, from: number, to: number): number {
  let sum = 0
  const a = Math.round(from * RATE)
  const b = Math.round(to * RATE)
  for (let i = a; i < b; i++) sum += (x[i] as number) ** 2
  return 10 * Math.log10(sum / (b - a) + 1e-30)
}

/** The share of a stretch's energy above a frequency, by a first difference's gain. */
function brightness(x: Float32Array, from: number, to: number): number {
  let all = 0
  let high = 0
  for (let i = Math.round(from * RATE) + 1; i < Math.round(to * RATE); i++) {
    all += (x[i] as number) ** 2
    high += ((x[i] as number) - (x[i - 1] as number)) ** 2
  }
  return high / all
}

describe('the strings', () => {
  it('are stretched: each partial a little sharper than a whole multiple, more so up high', () => {
    /** The partials as multiples of the fundamental: the modes of a unison, a hair apart, as one. */
    const partials = (pitch: number) => {
      const f0 = fundamental(pitch)
      const ratios = [...keyModel(pitch, RATE).omega].map((w) => w / (2 * Math.PI) / f0)
      return ratios.filter((r, i) => i === 0 || r - (ratios[i - 1] as number) > 0.2)
    }
    for (const pitch of [36, 60, 84]) {
      const stretch = partials(pitch).map((r, i) => r / (i + 1))
      for (let k = 1; k < stretch.length; k++) {
        expect(stretch[k], `key ${pitch} partial ${k + 1}`).toBeGreaterThan(
          stretch[k - 1] as number,
        )
      }
    }
    expect((partials(84)[3] as number) / 4).toBeGreaterThan((partials(60)[3] as number) / 4)
  })

  it('are one wound string in the bass, pairs above, then three, each unison a hair apart', () => {
    expect(stringsOf(21)).toBe(1)
    expect(stringsOf(40)).toBe(2)
    expect(stringsOf(60)).toBe(3)
    for (let pitch = 31; pitch <= 108; pitch++) {
      const cents = unisonCents(pitch)
      expect(new Set(cents).size, `key ${pitch}`).toBe(cents.length)
      expect(Math.max(...cents) - Math.min(...cents), `key ${pitch}`).toBeLessThan(1)
    }
    // The same slightly imperfect piano every time.
    expect(unisonCents(60)).toEqual(unisonCents(60))
  })

  it('coupled through the bridge are the eigenmodes of their matrix', () => {
    const poles: [number, number][] = [
      [-0.3, 1644.2],
      [-0.3, 1645.1],
      [-0.3, 1643.7],
    ]
    const eta: [number, number] = [0.5, 0.08]
    for (const { lambda, vector } of coupledModes(poles, eta)) {
      // (D - eta J) v = lambda v, entry by entry.
      const sum = vector.reduce<[number, number]>((s, x) => [s[0] + x[0], s[1] + x[1]], [0, 0])
      const times = (
        a: readonly [number, number],
        b: readonly [number, number],
      ): [number, number] => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
      vector.forEach((x, i) => {
        const dv = times(poles[i] as [number, number], x)
        const ej = times(eta, sum)
        const lv = times(lambda, x)
        expect(dv[0] - ej[0]).toBeCloseTo(lv[0], 6)
        expect(dv[1] - ej[1]).toBeCloseTo(lv[1], 6)
      })
    }
  })

  it('in tune, lose their energy together quickly and apart slowly: the two-stage decay', () => {
    const modes = coupledModes(
      [
        [-0.3, 1644],
        [-0.3, 1644.01],
      ],
      [0.6, 0],
    )
    const decays = modes.map((m) => -m.lambda[0]).sort((a, b) => a - b)
    expect(decays[0]).toBeCloseTo(0.3, 2)
    expect(decays[1]).toBeCloseTo(0.3 + 2 * 0.6, 2)
  })

  it('ring longitudinally some fifteen to twenty-five times above the fundamental', () => {
    for (const pitch of [21, 33, 45, 60, 72]) {
      const ratio = longitudinalOf(pitch).freq / fundamental(pitch)
      expect(ratio, `key ${pitch}`).toBeGreaterThan(12)
      expect(ratio, `key ${pitch}`).toBeLessThan(26)
    }
  })
})

describe('the engine', () => {
  it('renders every key at every blow, finite and within bounds', () => {
    for (let pitch = 0; pitch <= 127; pitch += 3) {
      for (const lvl of [0, 0.5, 1]) {
        const { out } = render({ strikes: [{ at: 0, pitch, level: lvl }], seconds: 0.15 })
        const bad = out.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 20)
        expect(bad, `key ${pitch} level ${lvl}`).toBe(-1)
      }
    }
  })

  it('renders the same take the same way', () => {
    const take = { strikes: [{ at: 0.01, pitch: 64, level: 0.6 }], seconds: 0.2 }
    expect(render(take).out).toEqual(render(take).out)
  })

  it('is louder and brighter for a harder blow, from the felt alone', () => {
    const soft = render({ strikes: [{ at: 0, pitch: 60, level: 0.2 }], seconds: 0.3 }).out
    const hard = render({ strikes: [{ at: 0, pitch: 60, level: 0.9 }], seconds: 0.3 }).out
    expect(level(hard, 0, 0.3)).toBeGreaterThan(level(soft, 0, 0.3) + 15)
    expect(brightness(hard, 0.01, 0.2)).toBeGreaterThan(brightness(soft, 0.01, 0.2) * 1.5)
  })

  it('fades fast then slowly, and darkens as it rings', () => {
    const { out } = render({ strikes: [{ at: 0, pitch: 60, level: 0.7 }], seconds: 6 })
    const early = level(out, 0.1, 0.3) - level(out, 1.1, 1.3)
    const late = level(out, 4.1, 4.3) - level(out, 5.1, 5.3)
    expect(early).toBeGreaterThan(late)
    expect(late).toBeGreaterThan(0)
    expect(brightness(out, 0.05, 0.25)).toBeGreaterThan(brightness(out, 3, 3.2))
  })

  it('damps a key when it is let go, except at the top, which has no dampers', () => {
    const held = render({ strikes: [{ at: 0, pitch: 60, level: 0.7 }], seconds: 1.2 }).out
    const released = render({
      strikes: [{ at: 0, pitch: 60, level: 0.7, release: 0.4 }],
      seconds: 1.2,
    }).out
    expect(level(released, 1, 1.2)).toBeLessThan(level(held, 1, 1.2) - 30)
    const top = FIRST_UNDAMPED + 2
    const topHeld = render({ strikes: [{ at: 0, pitch: top, level: 0.7 }], seconds: 1.2 }).out
    const topLet = render({
      strikes: [{ at: 0, pitch: top, level: 0.7, release: 0.2 }],
      seconds: 1.2,
    }).out
    expect(level(topLet, 1, 1.2)).toBeCloseTo(level(topHeld, 1, 1.2), 3)
  })

  it('strikes the same strings again when a ringing key is struck, where they are', () => {
    const once = render({ strikes: [{ at: 0, pitch: 60, level: 0.7 }], seconds: 0.5 })
    const twice = render({
      strikes: [
        { at: 0, pitch: 60, level: 0.7 },
        { at: 0.25, pitch: 60, level: 0.7 },
      ],
      seconds: 0.5,
    })
    // The first note is not cut: the sound runs unbroken into the second blow.
    expect(level(twice.out, 0.24, 0.25)).toBeCloseTo(level(once.out, 0.24, 0.25), 3)
    expect(level(twice.out, 0.25, 0.26)).toBeGreaterThan(level(twice.out, 0.24, 0.25) - 3)
    // One key's strings, not two notes' worth.
    expect(twice.modes).toBeLessThanOrEqual(keyModel(60, RATE).count)
  })

  it('ignores a late release of a key that has been struck again', () => {
    const engine = new PianoEngine(RATE)
    engine.strike(1, 60, 0.7, 0, 0)
    engine.strike(2, 60, 0.7, 0, Math.round(0.1 * RATE))
    engine.release(1, Math.round(0.2 * RATE))
    const { out } = render({ seconds: 1, engine })
    const reference = render({
      strikes: [
        { at: 0, pitch: 60, level: 0.7 },
        { at: 0.1, pitch: 60, level: 0.7 },
      ],
      seconds: 1,
    }).out
    expect(level(out, 0.8, 1)).toBeCloseTo(level(reference, 0.8, 1), 3)
  })

  it('cuts a note short on stop, and falls idle once everything is still', () => {
    const engine = new PianoEngine(RATE)
    engine.strike(1, 48, 0.8, 0, 0)
    engine.stop(1, Math.round(0.2 * RATE))
    const { out } = render({ seconds: 0.5, engine })
    // All that is left is the faint ring of the undamped strings the blow set going.
    expect(level(out, 0.4, 0.5)).toBeLessThan(level(out, 0.1, 0.2) - 60)
    const silenced = new PianoEngine(RATE)
    silenced.strike(1, 60, 0.8, 0, 0)
    render({ seconds: 0.1, engine: silenced })
    silenced.stopAll()
    render({ seconds: 0.3, engine: silenced })
    expect(silenced.busy).toBe(false)
  })

  it('drops the modes that have died, and keeps every note together within its budget', () => {
    const { engine, modes } = render({
      strikes: Array.from({ length: 80 }, (_, i) => ({ at: i * 0.01, pitch: 30 + i, level: 0.8 })),
      seconds: 1,
    })
    expect(modes).toBeLessThanOrEqual(MODE_BUDGET)
    // Half a second on is enough to see them go (about 2,100 left of a peak near 4,500);
    // three seconds cost two more of rendering and past vitest's 5 s under a full run.
    const later = render({ seconds: 0.5, engine })
    expect(later.engine.modes).toBeLessThan(modes * 0.8)
  })

  it('stretches the strings in proportion to the square of a blow: heard in a hard one only', () => {
    const push = (lvl: number) => {
      const with_ = render({ strikes: [{ at: 0, pitch: 28, level: lvl }], seconds: 0.4 }).out
      const model = keyModel(28, RATE)
      const force = model.longitudinal.force
      model.longitudinal.force = 0
      const without = render({ strikes: [{ at: 0, pitch: 28, level: lvl }], seconds: 0.4 }).out
      model.longitudinal.force = force
      const diff = with_.map((x, i) => x - (without[i] as number))
      return level(diff, 0, 0.4) - level(without, 0, 0.4)
    }
    // Twice the force across is four times the push along: the phantom partials grow twice as fast.
    expect(push(1)).toBeGreaterThan(push(0.3) + 10)
    expect(push(0.3)).toBeLessThan(-25)
  })

  it('rings the strings nobody struck while the pedal is down, and the undamped top always', () => {
    const chord = (pedal: boolean) =>
      render({
        strikes: [60, 64, 67].map((pitch) => ({ at: 0, pitch, level: 0.6 })),
        pedal: pedal ? [{ at: 0, on: true }] : [],
        seconds: 2,
      })
    const dry = chord(false)
    const wet = chord(true)
    const halo = wet.out.map((x, i) => x - (dry.out[i] as number))
    expect(level(halo, 0.5, 2)).toBeGreaterThan(level(dry.out, 0.5, 2) - 40)
    expect(level(halo, 0.5, 2)).toBeLessThan(level(dry.out, 0.5, 2) - 15)
    // Without the pedal only the top keys, which have no dampers, answer - and they do.
    expect(dry.engine.busy).toBe(true)
  })
})

describe('the voicing', () => {
  it('evens the scale: the treble, which the soundboard favours, is voiced down, the bass up', () => {
    // Found in review (2026-09-28): a mezzo-forte C7 was 9 dB louder than C4 once heard
    // through the soundboard, so a hard treble note reached the limiter.
    const dry = (pitch: number) =>
      level(render({ strikes: [{ at: 0, pitch, level: 0.5 }], seconds: 0.4 }).out, 0.05, 0.35)
    expect(dry(96)).toBeLessThan(dry(60) - 8)
    expect(Math.abs(dry(36) - dry(60))).toBeLessThan(3)
  })
})

describe('the audio thread', () => {
  it('lets the hammer go as soon as it rebounds, not a fixed window later', () => {
    // Found in review (2026-09-28): the hammer was stepped four times a sample for 12 ms after
    // every blow, which made a chord's first blocks cost eight times the strings alone.
    for (const pitch of [36, 60, 96]) {
      const engine = new PianoEngine(RATE)
      engine.strike(1, pitch, 0.6, 0, 0)
      render({ seconds: 0.006, engine })
      expect(engine.hammers, `key ${pitch}`).toBe(0)
    }
  })

  it('steps the contact finely only where it is short', () => {
    expect(contactSteps(keyModel(21, RATE), RATE)).toBe(1)
    expect(contactSteps(keyModel(60, RATE), RATE)).toBe(2)
    expect(contactSteps(keyModel(108, RATE), RATE)).toBe(4)
  })

  it('makes every key ready ahead of time while it is quiet', () => {
    // Found in review: a key's model was made when it was first struck, a millisecond or two
    // each on the audio thread - a chord of new keys overran the block.
    const rate = 44_000
    const engine = new PianoEngine(rate)
    const left = new Float32Array(BLOCK)
    const right = new Float32Array(BLOCK)
    for (let f = 0; f < 100 * BLOCK; f += BLOCK) engine.render(left, right, BLOCK, f)
    for (let pitch = 21; pitch <= 108; pitch++)
      expect(modelMade(pitch, rate), `key ${pitch}`).toBe(true)
  })

  it('calibrates the felt by the closed form of the contact integral', () => {
    for (const p of [2.3, 2.8, 3.4]) {
      let sum = 0
      const steps = 20000
      for (let i = 0; i < steps; i++) {
        const s = (i + 0.5) / steps
        sum += (2 * s) / Math.sqrt(1 - (1 - s * s) ** (p + 1))
      }
      expect(contactIntegral(p)).toBeCloseTo(sum / steps, 5)
    }
  })
})

describe('the soundboard and the room', () => {
  it('are two channels a little apart, of unit energy, the same every time', () => {
    for (const make of [() => soundboardResponse(RATE), () => roomResponse(RATE)]) {
      const [left, right] = make() as [Float32Array, Float32Array]
      for (const channel of [left, right]) {
        const energy = channel.reduce((s, x) => s + x * x, 0)
        expect(energy).toBeCloseTo(1, 3)
      }
      expect(left).not.toEqual(right)
      expect(make()[0]).toEqual(left)
    }
  })
})
