import type { Voice } from '@shared/plugin-api'
import { PLUGIN_VOICES } from '@shared/plugin-sound'
import { describe, expect, it } from 'vitest'
import {
  BUSES,
  INSTRUMENTS,
  OUTPUTS,
  ROOM_SEND,
} from '../../src/renderer/plugins/instruments/catalog.js'
import { type Instrument, InstrumentHost } from '../../src/renderer/plugins/instruments/host.js'
import { PeakLimiter } from '../../src/renderer/plugins/instruments/limiter.js'
import { makers } from '../../src/renderer/plugins/instruments/makers.js'

/**
 * The instruments' host on the audio thread (renderer/plugins/instruments/host.ts): what it
 * does with what the page posts, and where it writes each instrument. The instruments are
 * stand-ins here that log what reaches them and write a constant.
 */

class Probe implements Instrument {
  readonly log: string[] = []
  busy = false
  readonly value: number
  constructor(value: number) {
    this.value = value
  }
  strike(id: number, pitch: number, level: number, _pan: number, at: number) {
    this.log.push(`strike ${id} ${pitch} ${level} @${at}`)
    this.busy = true
  }
  release(id: number, at: number) {
    this.log.push(`release ${id} @${at}`)
  }
  stop(id: number, at: number) {
    this.log.push(`stop ${id} @${at}`)
  }
  pedal(on: boolean, at: number) {
    this.log.push(`pedal ${on} @${at}`)
  }
  stopAll() {
    this.log.push('stopAll')
    this.busy = false
  }
  render(left: Float32Array, right: Float32Array, frames: number) {
    for (let k = 0; k < frames; k++) {
      left[k] = (left[k] as number) + this.value
      right[k] = (right[k] as number) + this.value
    }
  }
}

function hostWith(voices: Partial<Record<Voice, Probe>>) {
  const host = new InstrumentHost(
    1000,
    Object.fromEntries(Object.entries(voices).map(([v, p]) => [v, () => p])),
  )
  return host
}

const outputs = () =>
  Array.from(
    { length: OUTPUTS },
    () => [new Float32Array(4), new Float32Array(4)] as [Float32Array, Float32Array],
  )

describe('the instruments host', () => {
  it('strikes the voice named, and lets go of a strike by its id alone', () => {
    const piano = new Probe(1)
    const host = hostWith({ piano })
    host.receive({ t: 'strike', voice: 'piano', id: 7, pitch: 60, level: 0.5, pan: 0, at: 0.5 })
    host.receive({ t: 'release', id: 7, at: 1 })
    host.receive({ t: 'stop', id: 7, at: 2 })
    host.receive({ t: 'release', id: 99, at: 1 })
    expect(piano.log).toEqual(['strike 7 60 0.5 @500', 'release 7 @1000', 'stop 7 @2000'])
  })

  it('ignores what it cannot play, and junk, without throwing', () => {
    const piano = new Probe(1)
    const host = hostWith({ piano })
    for (const junk of [null, 3, 'strike', { t: 'strike', voice: 'kazoo', id: 1 }, { t: 'nope' }]) {
      expect(() => host.receive(junk)).not.toThrow()
    }
    host.receive({ t: 'strike', voice: 'piano', id: 1, pitch: Number.NaN, level: 'loud', at: null })
    expect(piano.log).toEqual(['strike 1 0 0 @0'])
  })

  it('tells every instrument of the pedal, even one made after it went down', () => {
    const piano = new Probe(1)
    const epiano = new Probe(1)
    const host = hostWith({ piano, epiano })
    host.receive({ t: 'strike', voice: 'piano', id: 1, pitch: 60, level: 1, pan: 0, at: 0 })
    host.receive({ t: 'pedal', on: true, at: 0.25 })
    host.receive({ t: 'strike', voice: 'epiano', id: 2, pitch: 60, level: 1, pan: 0, at: 0.5 })
    expect(piano.log).toContain('pedal true @250')
    expect(epiano.log[0]).toBe('pedal true @0')
    host.receive({ t: 'silence' })
    expect(piano.log.at(-1)).toBe('stopAll')
    expect(epiano.log.at(-1)).toBe('stopAll')
    expect(host.busy).toBe(false)
  })

  it('writes each instrument to its bus, and a plain one to the room by its share too', () => {
    const piano = new Probe(0.5)
    const host = hostWith({ piano })
    host.receive({ t: 'strike', voice: 'piano', id: 1, pitch: 60, level: 1, pan: 0, at: 0 })
    const out = outputs()
    host.render(out, 4, 0)
    // Every output is late by the limiters' look-ahead (two samples at this rate), in step.
    expect([...(out[BUSES.piano]?.[0] ?? [])]).toEqual([0, 0, 0.5, 0.5])
    expect([...(out[BUSES.plain]?.[0] ?? [])]).toEqual([0, 0, 0, 0])
    // The piano's share of the room is taken after its soundboard, on the page.
    expect([...(out[BUSES.room]?.[0] ?? [])]).toEqual([0, 0, 0, 0])
  })

  it('makes one instrument ahead of time per quiet block', () => {
    const made: Voice[] = []
    const host = new InstrumentHost(1000, {
      piano: () => {
        made.push('piano')
        return new Probe(0)
      },
      epiano: () => {
        made.push('epiano')
        return new Probe(0)
      },
    })
    host.warm()
    expect(made).toEqual(['piano'])
    host.warm()
    host.warm()
    expect(made).toEqual(['piano', 'epiano'])
  })
})

describe('the catalog', () => {
  it('gives every voice a share of the room, and every instrument a bus that exists', () => {
    for (const voice of PLUGIN_VOICES) {
      expect(ROOM_SEND[voice], voice).toBeGreaterThanOrEqual(0)
      expect(ROOM_SEND[voice], voice).toBeLessThan(0.5)
    }
    for (const traits of Object.values(INSTRUMENTS)) expect(BUSES[traits.bus]).toBeLessThan(OUTPUTS)
  })

  it('has an instrument on the audio thread for every voice, and the traits the page needs', () => {
    const made = makers()
    for (const voice of PLUGIN_VOICES) {
      expect(made[voice], voice).toBeDefined()
      expect(INSTRUMENTS[voice], voice).toBeDefined()
    }
  })
})

describe('the limiter on each output', () => {
  const RATE = 48000
  const run = (x: Float32Array, ceiling = 0.9) => {
    const limiter = new PeakLimiter(RATE, ceiling)
    const l = Float32Array.from(x)
    const r = Float32Array.from(x)
    for (let f = 0; f < l.length; f += 128)
      limiter.process(l.subarray(f, f + 128), r.subarray(f, f + 128), 128)
    return { out: l, delay: limiter.delay }
  }

  it('passes what stays under its ceiling untouched, only late by its look-ahead', () => {
    const x = Float32Array.from({ length: 4096 }, (_, i) => 0.7 * Math.sin(i / 7))
    const { out, delay } = run(x)
    expect(delay).toBe(72)
    for (let i = delay; i < x.length; i++) expect(out[i]).toBeCloseTo(x[i - delay] as number, 6)
  })

  it('brings a spike down to its ceiling before it leaves, and lets go after', () => {
    // A quiet tone, a two-millisecond spike three times the ceiling, the quiet tone again.
    const x = Float32Array.from(
      { length: RATE },
      (_, i) => (i >= 10000 && i < 10096 ? 2.7 : 0.3) * Math.sin(i / 5),
    )
    const { out, delay } = run(x)
    expect(Math.max(...out.map(Math.abs))).toBeLessThanOrEqual(0.9 + 1e-6)
    // Half a second on, the quiet tone is back at its own level.
    for (let i = 40000; i < 40100; i++) expect(out[i]).toBeCloseTo(x[i - delay] as number, 3)
  })
})
