import { describe, expect, it, vi } from 'vitest'

/** The ELEC-16's buzzer (widgets/elec16/buzzer.ts) on a stand-in AudioContext. */

const events: string[] = []
const param = (name: string) => ({
  value: 0,
  setValueAtTime: (v: number, t: number) => events.push(`${name}=${v}@${t}`),
  cancelScheduledValues: () => events.push(`${name} cancel`),
})
const context = {
  currentTime: 10,
  createOscillator: () => ({
    type: '',
    frequency: param('freq'),
    connect: (node: unknown) => node,
    start: () => events.push('start'),
    stop: () => events.push('stop'),
    disconnect: () => {},
    context: { currentTime: 10 },
  }),
  createGain: () => ({
    gain: param('gain'),
    connect: () => ({}),
    disconnect: () => {},
    context: { currentTime: 10 },
  }),
  destination: {},
}
let made = 0
/** What the buzzer told the shared context: held awake (true) or let go. */
const holds: boolean[] = []
vi.mock('../../src/renderer/widgets/emu/audio.ts', () => ({
  emuAudio: {
    get: async () => {
      made++
      return context
    },
    wake: () => {},
    hold: (_voice: object, on: boolean) => holds.push(on),
  },
}))

const { Elec16Buzzer } = await import('../../src/renderer/widgets/elec16/buzzer.ts')

describe('the ELEC-16 buzzer', () => {
  it('makes no context while sounds are off or the volume is nothing', async () => {
    const off = new Elec16Buzzer({ enabled: () => false, volume: () => 1 })
    off.play(440, 100, 'a')
    const silent = new Elec16Buzzer({ enabled: () => true, volume: () => 0 })
    silent.play(440, 100, 'a')
    await Promise.resolve()
    expect(made).toBe(0)
  })

  it('plays a tone once however many frames see it, and stops it on the audio clock', async () => {
    events.length = 0
    const buzzer = new Elec16Buzzer({ enabled: () => true, volume: () => 1 })
    buzzer.play(880, 250, 'x')
    await vi.waitFor(() => expect(events).toContain('start'))
    expect(events).toEqual(['start', 'freq=880@10', 'gain cancel', 'gain=0.15@10', 'gain=0@10.25'])
    events.length = 0
    buzzer.play(880, 200, 'x')
    expect(events).toEqual([])
    // A gated tone holds until the machine lets it go.
    buzzer.play(440, Number.POSITIVE_INFINITY, 'y')
    expect(events).toEqual(['freq=440@10', 'gain cancel', 'gain=0.15@10'])
    events.length = 0
    buzzer.play(440, 0, 'y')
    expect(events).toEqual(['gain cancel', 'gain=0@10'])
    buzzer.dispose()
  })

  it('holds the shared context awake while a gated tone sounds, however long', async () => {
    const buzzer = new Elec16Buzzer({ enabled: () => true, volume: () => 1 })
    holds.length = 0
    buzzer.play(440, Number.POSITIVE_INFINITY, 'held')
    await vi.waitFor(() => expect(holds).toContain(true))
    // Nothing more comes while BEEP's gate stays on: the context must not sleep under it.
    expect(holds.at(-1)).toBe(true)
    buzzer.play(440, 0, 'held')
    expect(holds.at(-1)).toBe(false)
    buzzer.dispose()
  })
})
