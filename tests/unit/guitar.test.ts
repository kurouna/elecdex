import { describe, expect, it } from 'vitest'
import { Amp } from '../../src/renderer/plugins/guitar/amp.js'
import { cabinetResponse } from '../../src/renderer/plugins/guitar/cabinet.js'
import { GuitarEngine } from '../../src/renderer/plugins/guitar/engine.js'
import { fretFor, modesOf, STRINGS } from '../../src/renderer/plugins/guitar/model.js'

/**
 * The lead guitar (renderer/plugins/guitar, docs/plugins.md section 13.9): where a note is
 * played, the string's physics, the amplifier and the cabinet, and how the strings answer a
 * player - one note a string, legato, muting, feedback. Nothing here is heard;
 * `node scripts/instruments-wav.mjs out guitar` writes the same code to WAV files.
 */

const RATE = 48000
const BLOCK = 128

interface Take {
  notes: { at: number; pitch: number; level?: number; release?: number }[]
  seconds: number
  engine?: GuitarEngine
}

function render(take: Take): { out: Float32Array; engine: GuitarEngine; strings: number[] } {
  const engine = take.engine ?? new GuitarEngine(RATE)
  take.notes.forEach((n, i) => {
    engine.strike(i + 1, n.pitch, n.level ?? 0.7, 0, Math.round(n.at * RATE))
    if (n.release !== undefined) engine.release(i + 1, Math.round(n.release * RATE))
  })
  const frames = Math.ceil((take.seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  const strings: number[] = []
  for (let f = 0; f < frames; f += BLOCK) {
    engine.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, f)
    strings.push(engine.sounding)
  }
  return { out: left.map((x, i) => x + (right[i] as number)), engine, strings }
}

function level(x: Float32Array, from: number, to: number): number {
  let sum = 0
  const a = Math.round(from * RATE)
  const b = Math.round(to * RATE)
  for (let i = a; i < b; i++) sum += (x[i] as number) ** 2
  return 10 * Math.log10(sum / (b - a) + 1e-30)
}

const at = (seconds: number) => Math.floor((seconds * RATE) / BLOCK)

describe('the guitar neck', () => {
  it('plays a note where a lead player would: up the neck on the plain strings', () => {
    expect(fretFor(40)).toMatchObject({ string: 0, fret: 0 })
    expect(fretFor(60)).toMatchObject({ string: 3, fret: 5 })
    expect(fretFor(64)).toMatchObject({ string: 4, fret: 5 })
    expect(fretFor(81)).toMatchObject({ string: 5, fret: 17 })
    // Past the guitar's ends: the nearest it has.
    expect(fretFor(20).string).toBe(0)
    expect(fretFor(100)).toMatchObject({ string: 5, fret: 22 })
    for (let p = 40; p <= 86; p++) {
      const { string, fret, length } = fretFor(p)
      expect((STRINGS[string]?.open ?? 0) + fret, `key ${p}`).toBe(p)
      expect(length, `key ${p}`).toBeLessThanOrEqual(0.648)
    }
  })

  it('stretches the partials a little, and the pickup hears a comb of them', () => {
    const modes = modesOf(64, RATE)
    const f0 = modes.f0
    const tenth = (modes.omega[9] as number) / (2 * Math.PI) / f0
    expect(tenth).toBeGreaterThan(10)
    expect(tenth).toBeLessThan(10.2)
    // The pickup, a few centimetres from the bridge, hears a mode whose node sits on it barely.
    const notch = Math.round(modes.length / 0.041)
    const near = Math.abs(modes.pickup[notch - 1] as number)
    const peak = Math.max(...[...modes.pickup].slice(0, notch).map(Math.abs))
    expect(near).toBeLessThan(peak * 0.2)
  })
})

describe('the amplifier and the cabinet', () => {
  it('keeps silence silent and lets no DC through', () => {
    const amp = new Amp(RATE)
    const quiet = new Float64Array(BLOCK)
    amp.process(quiet, BLOCK)
    expect(quiet.every((x) => x === 0)).toBe(true)
    const steady = new Float64Array(RATE).fill(0.3)
    amp.process(steady, RATE)
    expect(Math.abs(steady[RATE - 1] as number)).toBeLessThan(1e-3)
  })

  it('clips: ten times the input is nowhere near ten times the output', () => {
    const tone = (gain: number) => {
      const amp = new Amp(RATE)
      const data = Float64Array.from(
        { length: RATE / 2 },
        (_, i) => gain * Math.sin((2 * Math.PI * 330 * i) / RATE),
      )
      amp.process(data, data.length)
      return Math.sqrt(data.slice(RATE / 4).reduce((s, x) => s + x * x, 0) / (RATE / 4))
    }
    expect(tone(1) / tone(0.1)).toBeLessThan(2)
  })

  it('is a cabinet: unit energy, and almost nothing above eight kilohertz', () => {
    for (const channel of cabinetResponse(RATE)) {
      expect(channel.reduce((s, x) => s + x * x, 0)).toBeCloseTo(1, 3)
      // A first difference weighs the top: a speaker's is a small share.
      let top = 0
      for (let i = 1; i < channel.length; i++)
        top += ((channel[i] as number) - (channel[i - 1] as number)) ** 2
      expect(top).toBeLessThan(0.25)
    }
  })
})

describe('the strings', () => {
  it('render every note at every level, finite and within bounds', () => {
    for (let pitch = 30; pitch <= 100; pitch += 5) {
      for (const lvl of [0, 0.5, 1]) {
        const { out } = render({
          notes: [{ at: 0, pitch, level: lvl, release: 0.2 }],
          seconds: 0.3,
        })
        expect(
          out.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 4),
          `key ${pitch} level ${lvl}`,
        ).toBe(-1)
      }
    }
  })

  it('play one note a string: a second on the same string stops the first', () => {
    // C4 and C#4 both fall on the G string; E4 on the B string.
    const same = render({
      notes: [
        { at: 0, pitch: 60 },
        { at: 0.1, pitch: 61 },
      ],
      seconds: 0.3,
    })
    expect(same.strings[at(0.2)]).toBe(1)
    const chord = render({
      notes: [40, 47, 52].map((pitch, k) => ({ at: k * 0.01, pitch })),
      seconds: 0.3,
    })
    expect(chord.strings[at(0.2)]).toBe(3)
  })

  it('play a note held into the next legato, on the same string, without picking it again', () => {
    const picked = render({
      notes: [
        { at: 0, pitch: 69, release: 0.3 },
        { at: 0.35, pitch: 72, release: 0.8 },
      ],
      seconds: 0.8,
    })
    const legato = render({
      notes: [
        { at: 0, pitch: 69, release: 0.5 },
        { at: 0.35, pitch: 72, release: 0.8 },
      ],
      seconds: 0.8,
    })
    expect(legato.strings[at(0.45)]).toBe(1)
    // A hammer-on adds a little; a pick starts the string again from its top.
    const jump = (out: Float32Array) => level(out, 0.35, 0.37) - level(out, 0.32, 0.34)
    expect(jump(legato.out)).toBeLessThan(jump(picked.out))
    // Beyond an octave it is picked on another string.
    const far = render({
      notes: [
        { at: 0, pitch: 52, release: 0.5 },
        { at: 0.3, pitch: 76 },
      ],
      seconds: 0.4,
    })
    expect(far.strings[at(0.35)]).toBe(2)
  })

  it('mute when let go, and fall idle once still', () => {
    const { out, engine } = render({ notes: [{ at: 0, pitch: 64, release: 0.5 }], seconds: 1.2 })
    expect(level(out, 0.9, 1.1)).toBeLessThan(level(out, 0.3, 0.5) - 40)
    expect(engine.busy).toBe(false)
    const cut = render({ notes: [{ at: 0, pitch: 64 }], seconds: 0.2 })
    cut.engine.stopAll()
    render({ notes: [], seconds: 0.6, engine: cut.engine })
    expect(cut.engine.busy).toBe(false)
  })

  it('sustain while held, fed back by the amplifier, and stay bounded', () => {
    const { out } = render({ notes: [{ at: 0, pitch: 81, level: 0.8 }], seconds: 6 })
    expect(level(out, 5, 5.5)).toBeGreaterThan(level(out, 0.2, 0.7) - 6)
    expect(out.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 2)).toBe(-1)
  })
})
