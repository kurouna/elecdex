import {
  APU_REG,
  type ApuFrame,
  ApuSynth,
  apuFrame,
  CHANNEL_LEVEL,
  CHANNELS,
  createApuState,
  ENV_MS,
  WAVE,
  WAVE_TABLES_AT,
  waveAt,
} from '@shared/elec16/apu'
import { assemble, romImage } from '@shared/elec16/asm'
import { Elec16 } from '@shared/elec16/machine'
import { MODEL_IDS, MODELS, type ModelId } from '@shared/elec16/map'
import { decodeSnapshot } from '@shared/elec16/snapshot'
import { describe, expect, it } from 'vitest'

/**
 * PLAY-320's sixteen channels (docs/elec16-play.md section 5, G6): the registers a program
 * writes, keying on and off, the snapshot - and the synth that makes the samples: pitch, the
 * waves, the envelope, left and right, the slide, noise and the wave tables.
 */

const RATE = 48_000

function boot(model: ModelId = 'play-320'): Elec16 {
  return Elec16.boot(romImage(assemble('.org 0x8000\nebreak')), model)
}

const sel = (m: Elec16, ch: number) => m.bus.write16(APU_REG.sel, ch)

describe('the sound registers', () => {
  it('hold each channel apart, the one CHSEL chooses, in their widths', () => {
    const m = boot()
    sel(m, 3)
    m.bus.write16(APU_REG.wave, 0xff)
    m.bus.write16(APU_REG.freq, 0x1234)
    m.bus.write16(APU_REG.vol, 0x1f)
    m.bus.write16(APU_REG.pan, 0x13)
    m.bus.write16(APU_REG.env, 0xabcd)
    m.bus.write16(APU_REG.mod, 0x0ff0)
    expect(
      [APU_REG.wave, APU_REG.freq, APU_REG.vol, APU_REG.pan, APU_REG.env, APU_REG.mod].map((a) =>
        m.bus.read16(a),
      ),
    ).toEqual([15, 0x1234, 15, 3, 0xabcd, 0x0ff0])
    sel(m, 4)
    expect(m.bus.read16(APU_REG.freq)).toBe(440 * 4)
    sel(m, 19)
    expect(m.bus.read16(APU_REG.sel)).toBe(3)
    expect(m.bus.read16(APU_REG.wave)).toBe(15)
    m.bus.write16(APU_REG.master, 0x27)
    expect(m.bus.read16(APU_REG.master)).toBe(7)
  })

  it('key a note on and off, counting each, and a reset lets every one go', () => {
    const m = boot()
    sel(m, 2)
    m.bus.write16(APU_REG.key, 1)
    m.bus.write16(APU_REG.key, 1)
    const c = m.state.apu?.ch[2]
    expect([m.bus.read16(APU_REG.key), c?.ons, c?.offs]).toEqual([1, 2, 0])
    m.bus.write16(APU_REG.key, 0)
    m.bus.write16(APU_REG.key, 0)
    // Let go once: a second 0 lets go of nothing.
    expect([m.bus.read16(APU_REG.key), c?.offs]).toEqual([0, 1])
    m.bus.write16(APU_REG.key, 1)
    m.bus.write16(APU_REG.master, 3)
    m.reset()
    expect([c?.gate, c?.offs, m.state.apu?.master]).toEqual([false, 2, 15])
  })

  it('count every write, so the page sends only a frame that changed', () => {
    const m = boot()
    const before = m.state.apu?.revision ?? 0
    m.bus.write16(APU_REG.vol, 9)
    expect(m.state.apu?.revision).toBe(before + 1)
  })

  it('are kept in a snapshot, every channel let go, and come back from one older', () => {
    const m = boot()
    sel(m, 5)
    m.bus.write16(APU_REG.freq, 777)
    m.bus.write16(APU_REG.env, 0x1234)
    m.bus.write16(APU_REG.key, 1)
    m.bus.write16(APU_REG.master, 9)
    const back = decodeSnapshot(m.snapshot())?.apu
    expect([
      back?.sel,
      back?.master,
      back?.ch[5]?.freq,
      back?.ch[5]?.env,
      back?.ch[5]?.gate,
    ]).toEqual([5, 9, 777, 0x1234, false])
  })
})

describe('the other models, without sound', () => {
  it('have none: its registers read 0 and writes do nothing', () => {
    for (const id of MODEL_IDS.filter((x) => !MODELS[x].apu)) {
      const m = boot(id)
      m.bus.write16(APU_REG.vol, 7)
      m.bus.write16(APU_REG.key, 1)
      expect([m.state.apu, m.bus.read16(APU_REG.vol), m.bus.read16(APU_REG.key)], id).toEqual([
        null,
        0,
        0,
      ])
    }
    expect(MODEL_IDS.filter((x) => MODELS[x].apu)).toEqual(['play-320'])
  })
})

/* ---------------- the synth ---------------- */

/** A frame with one channel set, the rest as a new machine's (silent: never keyed). */
function frame(change: Partial<ApuFrame['ch'][number]>, tables = new Uint8Array(128)): ApuFrame {
  const a = createApuState()
  Object.assign(a.ch[0] ?? {}, change)
  return { master: 15, ch: a.ch, tables }
}

/** Seconds of sound from the synth. */
function play(synth: ApuSynth, seconds: number): { left: Float32Array; right: Float32Array } {
  const n = Math.round(seconds * RATE)
  const left = new Float32Array(n)
  const right = new Float32Array(n)
  synth.render(left, right)
  return { left, right }
}

/** Rises through zero a second, from samples. */
function pitchOf(samples: Float32Array): number {
  let rises = 0
  for (let i = 1; i < samples.length; i++)
    if ((samples[i - 1] ?? 0) <= 0 && (samples[i] ?? 0) > 0) rises++
  return rises / (samples.length / RATE)
}

const peak = (samples: Float32Array) => samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

describe('the synth', () => {
  it('is silent until a channel is keyed on, then plays its pitch', () => {
    const synth = new ApuSynth(RATE)
    synth.set(frame({ freq: 440 * 4, ons: 0 }))
    expect(peak(play(synth, 0.1).left)).toBe(0)
    expect(synth.sounding).toBe(false)
    synth.set(frame({ freq: 440 * 4, ons: 1, gate: true }))
    const { left } = play(synth, 1)
    expect(pitchOf(left)).toBeCloseTo(440, -1)
    expect(peak(left)).toBeCloseTo(CHANNEL_LEVEL / 2, 3)
  })

  it('takes FREQ in quarters of a hertz', () => {
    const synth = new ApuSynth(RATE)
    synth.set(frame({ freq: 1001, ons: 1, gate: true }))
    expect(pitchOf(play(synth, 2).left)).toBeCloseTo(250.25, 0)
  })

  it('places a channel left to right by PAN', () => {
    for (const [pan, l, r] of [
      [0, 1, 0],
      [15, 0, 1],
    ] as const) {
      const synth = new ApuSynth(RATE)
      synth.set(frame({ pan, ons: 1, gate: true }))
      const { left, right } = play(synth, 0.2)
      expect(peak(left) > 0, `pan ${pan}`).toBe(l === 1)
      expect(peak(right) > 0, `pan ${pan}`).toBe(r === 1)
    }
  })

  it('scales by VOL and MASTER, and makes nothing at VOL 0', () => {
    const level = (vol: number, master: number) => {
      const synth = new ApuSynth(RATE)
      synth.set({ ...frame({ vol, ons: 1, gate: true }), master })
      return peak(play(synth, 0.1).left)
    }
    expect(level(15, 15) / level(5, 15)).toBeCloseTo(3, 1)
    expect(level(15, 15) / level(15, 5)).toBeCloseTo(3, 1)
    expect(level(0, 15)).toBe(0)
  })

  it('runs its envelope: up through the attack, down to the sustain, out on release', () => {
    const synth = new ApuSynth(RATE)
    // Attack 10 ms, decay 40 ms, sustain 8/15, release 120 ms.
    synth.set(frame({ env: 0x7853, wave: WAVE.square50, ons: 1, gate: true }))
    expect(ENV_MS[3]).toBe(10)
    const attack = play(synth, 0.005).left
    expect(peak(attack)).toBeLessThan((CHANNEL_LEVEL / 2) * 0.55)
    play(synth, 0.2)
    const sustain = peak(play(synth, 0.05).left)
    // Half of it on the left, at the centre.
    expect(sustain / (CHANNEL_LEVEL / 2)).toBeCloseTo(8 / 15, 1)
    synth.set(frame({ env: 0x7853, ons: 1, offs: 1, gate: false }))
    play(synth, 0.06)
    expect(peak(play(synth, 0.01).left)).toBeLessThan(sustain * 0.6)
    play(synth, 0.2)
    expect(synth.sounding).toBe(false)
    expect(peak(play(synth, 0.05).left)).toBe(0)
  })

  it('starts the envelope again when keyed on again', () => {
    const synth = new ApuSynth(RATE)
    synth.set(frame({ env: 0x0f0a, ons: 1, gate: true }))
    play(synth, 1)
    synth.set(frame({ env: 0x0f0a, ons: 2, gate: true }))
    expect(peak(play(synth, 0.01).left)).toBeLessThan(CHANNEL_LEVEL * 0.3)
  })

  it('slides the pitch by MOD, a quarter semitone a second a step', () => {
    const synth = new ApuSynth(RATE)
    // +48 quarter semitones a second: an octave up after a second.
    synth.set(frame({ freq: 220 * 4, mod: 48, ons: 1, gate: true }))
    play(synth, 1)
    expect(pitchOf(play(synth, 0.05).left)).toBeGreaterThan(400)
  })

  it('makes noise from its LFSR, the same each time', () => {
    const noise = () => {
      const synth = new ApuSynth(RATE)
      synth.set(frame({ wave: WAVE.noise, freq: 8000 * 4, ons: 1, gate: true }))
      return play(synth, 0.05).left
    }
    const a = noise()
    expect(a).toEqual(noise())
    expect(new Set(Array.from(a.subarray(2000, 3000)).map((v) => Math.sign(v))).size).toBe(2)
  })

  it('draws the waves: duties, triangle, saw and a wave table', () => {
    expect([0.1, 0.2].map((p) => waveAt(WAVE.square12, p, new Uint8Array()))).toEqual([1, -1])
    expect([0.7, 0.8].map((p) => waveAt(WAVE.square75, p, new Uint8Array()))).toEqual([1, -1])
    expect([0, 0.25, 0.5, 0.75].map((p) => waveAt(WAVE.triangle, p, new Uint8Array()))).toEqual([
      -1, 0, 1, 0,
    ])
    expect([0, 0.5].map((p) => waveAt(WAVE.saw, p, new Uint8Array()))).toEqual([-1, 0])
    expect(waveAt(7, 0.3, new Uint8Array())).toBe(0)
    const tables = new Uint8Array(128)
    tables[16] = 0xf0 // table 1: its first point 15, its second 0
    expect([waveAt(WAVE.table + 1, 0, tables), waveAt(WAVE.table + 1, 1 / 32, tables)]).toEqual([
      1, -1,
    ])
  })

  it('reads the wave tables from video memory for the page to send', () => {
    const m = boot()
    const v = m.state.video
    if (v === null) throw new Error('no video')
    v.mem[WAVE_TABLES_AT] = 0xab
    const sent = apuFrame(m.state.apu ?? createApuState(), v.mem)
    expect([sent.tables.length, sent.tables[0], sent.ch.length]).toEqual([128, 0xab, CHANNELS])
  })
})
