import type { Voice } from '@shared/plugin-api'
import { describe, expect, it } from 'vitest'
import { drumMakers } from '../../src/renderer/plugins/drums/machine.js'
import type { Instrument } from '../../src/renderer/plugins/instruments/host.js'

/**
 * The drums (renderer/plugins/drums, docs/plugins.md section 13.10): each drum is finite,
 * silent until struck and silent again after, tuned where it should be, and the hats choke as
 * the machine's do - within one pane only.
 */

const RATE = 48000
const BLOCK = 128
const DRUMS: Voice[] = ['kick', 'snare', 'clap', 'hat', 'openhat', 'crash', 'tom']

function play(drum: Instrument, seconds: number, from = 0): Float32Array {
  const frames = Math.ceil((seconds * RATE) / BLOCK) * BLOCK
  const left = new Float32Array(frames)
  const right = new Float32Array(frames)
  for (let f = 0; f < frames; f += BLOCK) {
    drum.render(left.subarray(f, f + BLOCK), right.subarray(f, f + BLOCK), BLOCK, from + f)
  }
  return left
}

function level(x: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i++) sum += (x[i] as number) ** 2
  return 10 * Math.log10(sum / ((to - from) * RATE) + 1e-30)
}

/** Zero crossings a second, over a stretch: twice the frequency of a sine. */
function frequency(x: Float32Array, from: number, to: number): number {
  let crossings = 0
  for (let i = Math.round(from * RATE) + 1; i < Math.round(to * RATE); i++) {
    if ((x[i - 1] as number) < 0 !== (x[i] as number) < 0) crossings++
  }
  return crossings / 2 / (to - from)
}

const make = (voice: Voice) => (drumMakers()[voice] as (rate: number) => Instrument)(RATE)

describe('the drums', () => {
  it('are silent until struck, finite and bounded, and silent and idle once they have rung', () => {
    for (const voice of DRUMS) {
      const drum = make(voice)
      drum.strike(1, 50, 1, 0, Math.round(0.1 * RATE))
      const out = play(drum, 3.2)
      expect(level(out, 0, 0.09), voice).toBeLessThan(-200)
      expect(level(out, 0.1, 0.2), voice).toBeGreaterThan(-40)
      expect(
        out.findIndex((x) => !Number.isFinite(x) || Math.abs(x) > 2),
        voice,
      ).toBe(-1)
      expect(level(out, 3, 3.2), voice).toBeLessThan(-90)
      expect(drum.busy, voice).toBe(false)
    }
  })

  it('sound the same every time', () => {
    for (const voice of DRUMS) {
      const once = make(voice)
      const again = make(voice)
      once.strike(1, 50, 0.8, 0, 0)
      again.strike(1, 50, 0.8, 0, 0)
      expect(play(once, 0.2), voice).toEqual(play(again, 0.2))
    }
  })

  it('sweep the kick down to its note, and tune the tom to the note it is given', () => {
    const kick = make('kick')
    kick.strike(1, 36, 1, 0, 0)
    const k = play(kick, 0.4)
    expect(frequency(k, 0.002, 0.012)).toBeGreaterThan(frequency(k, 0.2, 0.35) * 2)
    expect(frequency(k, 0.2, 0.35)).toBeGreaterThan(45)
    expect(frequency(k, 0.2, 0.35)).toBeLessThan(62)
    for (const pitch of [45, 50, 57]) {
      const tom = make('tom')
      tom.strike(1, pitch, 1, 0, 0)
      const f = frequency(play(tom, 0.5), 0.25, 0.45)
      expect(f / (440 * 2 ** ((pitch - 69) / 12)), `pitch ${pitch}`).toBeCloseTo(1, 1)
    }
  })

  it('let the closed hat choke the open one, as the machine does - but only in the same pane', () => {
    const ringing = (choke: boolean, apart: boolean) => {
      const one = drumMakers()
      const other = apart ? drumMakers() : one
      const open = (one.openhat as (r: number) => Instrument)(RATE)
      const closed = (other.hat as (r: number) => Instrument)(RATE)
      open.strike(1, 60, 1, 0, 0)
      if (choke) closed.strike(2, 60, 1, 0, Math.round(0.1 * RATE))
      play(closed, 0.4)
      return level(play(open, 0.4), 0.2, 0.3)
    }
    expect(ringing(true, false)).toBeLessThan(ringing(false, false) - 40)
    expect(ringing(true, true)).toBeCloseTo(ringing(false, true), 3)
  })

  it('fade a hit that is stopped', () => {
    const crash = make('crash')
    crash.strike(1, 60, 1, 0, 0)
    crash.stop(1, Math.round(0.2 * RATE))
    const out = play(crash, 0.5)
    expect(level(out, 0.35, 0.5)).toBeLessThan(level(out, 0.1, 0.2) - 60)
  })
})
