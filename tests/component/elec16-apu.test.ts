import { createApuState } from '@shared/elec16/apu'
import { describe, expect, it, vi } from 'vitest'

/** PLAY-320's sound in the page (widgets/elec16/apu.ts) on a stand-in AudioContext. */

const posted: unknown[] = []
const events: string[] = []
class FakeNode {
  readonly port = { postMessage: (m: unknown) => void posted.push(m) }
  constructor(_ac: unknown, name: string, options: { outputChannelCount: number[] }) {
    events.push(`node ${name} ${options.outputChannelCount.join()}`)
  }
  connect(node: unknown) {
    return node
  }
  disconnect() {
    events.push('disconnect')
  }
}
vi.stubGlobal('AudioWorkletNode', FakeNode)
const context = {
  createGain: () => ({ gain: { value: 0 }, connect: () => ({}), disconnect: () => {} }),
  destination: {},
}
let made = 0
vi.mock('../../src/renderer/widgets/emu/audio.ts', () => ({
  emuAudio: {
    get: async () => {
      made++
      return context
    },
    wake: () => {},
  },
}))

const { Elec16Apu } = await import('../../src/renderer/widgets/elec16/apu.ts')

const frame = (keyed: boolean) => {
  const a = createApuState()
  if (keyed && a.ch[0] !== undefined) a.ch[0].ons = 1
  return { master: 15, ch: a.ch, tables: new Uint8Array(128) }
}

describe("PLAY-320's sound in the page", () => {
  it('opens nothing while sounds are off, the volume is nothing, or nothing was keyed', async () => {
    new Elec16Apu({ enabled: () => false, volume: () => 1 }).play(frame(true))
    new Elec16Apu({ enabled: () => true, volume: () => 0 }).play(frame(true))
    new Elec16Apu({ enabled: () => true, volume: () => 1 }).play(frame(false))
    await Promise.resolve()
    expect(made).toBe(0)
  })

  it('makes one stereo voice, sends it the frames, silences it and lets it go', async () => {
    const apu = new Elec16Apu({ enabled: () => true, volume: () => 1 })
    const first = frame(true)
    apu.play(first)
    apu.play(first)
    await vi.waitFor(() => expect(posted.length).toBeGreaterThan(0))
    expect(made).toBe(1)
    expect(events).toEqual(['node elec16-apu 2'])
    expect(posted).toEqual([first])
    apu.play(frame(false))
    expect(posted.length).toBe(2)
    apu.silence()
    expect(posted.at(-1)).toBe('stop')
    apu.dispose()
    expect(posted.slice(-2)).toEqual(['stop', 'dispose'])
    expect(events).toContain('disconnect')
    apu.play(frame(true))
    expect(posted.at(-1)).toBe('dispose')
  })
})
