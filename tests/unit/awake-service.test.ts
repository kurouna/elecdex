import {
  AWAKE_EXTEND_MS,
  type AwakeHold,
  type AwakeState,
  type BlockerKind,
  RELEASED,
} from '@shared/utility'
import { describe, expect, it } from 'vitest'
import { stubCodec } from '../../src/main/ai/keys.js'
import { AwakeService } from '../../src/main/awake/service.js'
import { seal, unseal } from '../../src/main/secrets/seal.js'

const MIN = 60_000
const T0 = Date.UTC(2026, 8, 27, 5, 0, 0)

/** The service on a clock of its own, a blocker that records, and a file in memory. */
function harness(saved: AwakeHold = RELEASED) {
  let now = T0
  let battery = false
  let file = saved
  let writes = 0
  const held = new Map<number, BlockerKind>()
  const log: string[] = []
  let nextId = 1
  const timers = new Map<number, { at: number; fn: () => void }>()
  let nextTimer = 1
  const published: AwakeState[] = []
  const service = new AwakeService({
    blocker: {
      start: (kind) => {
        const id = nextId
        nextId += 1
        held.set(id, kind)
        log.push(`start ${kind}`)
        return id
      },
      stop: (id) => {
        log.push(`stop ${held.get(id)}`)
        held.delete(id)
      },
      isStarted: (id) => held.has(id),
    },
    load: () => file,
    save: (hold) => {
      file = hold
      writes += 1
    },
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextTimer
      nextTimer += 1
      timers.set(id, { at: now + ms, fn })
      return id
    },
    clearTimer: (handle) => {
      timers.delete(handle as number)
    },
    onBattery: () => battery,
    publish: (state) => published.push(state),
  })
  /** Moves the clock on, firing the timers that come due. */
  const advance = (ms: number): void => {
    now += ms
    for (const [id, timer] of [...timers]) {
      if (timer.at <= now) {
        timers.delete(id)
        timer.fn()
      }
    }
  }
  return {
    service,
    advance,
    jump: (ms: number) => {
      now += ms
    },
    held: () => [...held.values()],
    log,
    file: () => file,
    writes: () => writes,
    timers: () => timers.size,
    published,
    setBattery: (on: boolean) => {
      battery = on
    },
  }
}

describe('the AWAKE service', () => {
  it('holds the level asked for, and lets go when turned off', () => {
    const h = harness()
    h.service.start()
    expect(h.service.state()).toEqual({ ...RELEASED, held: false, onBattery: false })
    const on = h.service.set({ level: 'system', forMs: null })
    expect(on).toMatchObject({ level: 'system', until: null, since: T0, held: true })
    expect(h.held()).toEqual(['prevent-app-suspension'])
    expect(h.service.set({ level: 'off' })).toMatchObject({ level: 'off', held: false })
    expect(h.held()).toEqual([])
    expect(h.file()).toEqual(RELEASED)
  })

  it('takes the new request before letting go of the old one', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: null })
    h.service.set({ level: 'display', forMs: null })
    expect(h.log).toEqual([
      'start prevent-app-suspension',
      'start prevent-display-sleep',
      'stop prevent-app-suspension',
    ])
    expect(h.held()).toEqual(['prevent-display-sleep'])
  })

  it('keeps the request when only the length changes', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: 30 * MIN })
    h.service.set({ level: 'system', forMs: null })
    expect(h.log).toEqual(['start prevent-app-suspension'])
  })

  it('lets go at the end, on one timer', () => {
    const h = harness()
    h.service.set({ level: 'display', forMs: 30 * MIN })
    expect(h.timers()).toBe(1)
    h.advance(30 * MIN - 1)
    expect(h.held()).toEqual(['prevent-display-sleep'])
    h.advance(1)
    expect(h.held()).toEqual([])
    expect(h.service.state().level).toBe('off')
    expect(h.timers()).toBe(0)
    expect(h.published.at(-1)?.level).toBe('off')
  })

  it('waits again when its timer fires before the end', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: 30 * MIN })
    // The timer runs on another clock than the wall's: here it fires a minute early.
    h.jump(29 * MIN)
    h.service.check()
    expect(h.held()).toEqual(['prevent-app-suspension'])
    expect(h.timers()).toBe(1)
  })

  it('lets go after a sleep that went past the end', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: 30 * MIN })
    h.jump(3 * 60 * MIN)
    h.service.check()
    expect(h.service.state().level).toBe('off')
  })

  it('extends a timed hold and moves its timer', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: 30 * MIN })
    expect(h.service.extend(AWAKE_EXTEND_MS).until).toBe(T0 + 60 * MIN)
    h.advance(45 * MIN)
    expect(h.service.state().level).toBe('system')
    h.advance(15 * MIN)
    expect(h.service.state().level).toBe('off')
  })

  it('writes nothing when there is nothing to extend', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: null })
    const writes = h.writes()
    h.service.extend(AWAKE_EXTEND_MS)
    expect(h.writes()).toBe(writes)
  })

  it('takes up the hold saved last time', () => {
    const h = harness({ level: 'display', until: T0 + 10 * MIN, since: T0 - 20 * MIN })
    h.service.start()
    expect(h.service.state()).toMatchObject({ level: 'display', until: T0 + 10 * MIN, held: true })
    expect(h.held()).toEqual(['prevent-display-sleep'])
    h.advance(10 * MIN)
    expect(h.service.state().level).toBe('off')
  })

  it('writes off a hold that ended while elecdex was not running', () => {
    const h = harness({ level: 'system', until: T0 - 1, since: T0 - 30 * MIN })
    h.service.start()
    expect(h.held()).toEqual([])
    expect(h.file()).toEqual(RELEASED)
  })

  it('writes nothing at the start of an idle machine', () => {
    const h = harness()
    h.service.start()
    expect(h.writes()).toBe(0)
    expect(h.published).toEqual([])
  })

  it('lets go of the system on quit but keeps the hold for the next start', () => {
    const h = harness()
    h.service.set({ level: 'system', forMs: 60 * MIN })
    h.service.dispose()
    expect(h.held()).toEqual([])
    expect(h.timers()).toBe(0)
    expect(h.file()).toMatchObject({ level: 'system', until: T0 + 60 * MIN })
  })

  it('says when the power source changes', () => {
    const h = harness()
    h.setBattery(true)
    h.service.powerChanged()
    expect(h.published.at(-1)?.onBattery).toBe(true)
  })
})

describe('a sealed secret', () => {
  const refusing = { ...stubCodec, available: () => false }
  const broken = {
    ...stubCodec,
    decrypt: () => {
      throw new Error('another machine')
    },
  }

  it('opens again as it was', () => {
    const sealed = seal(stubCodec, 'pa;ss "word"')
    expect(sealed).toMatch(/^v1:/)
    expect(unseal(stubCodec, sealed)).toBe('pa;ss "word"')
  })

  it('is not made where the system cannot encrypt', () => {
    expect(seal(refusing, 'secret')).toBeNull()
  })

  it('opens to nothing when it is not ours, or will not decrypt', () => {
    expect(unseal(stubCodec, 'secret')).toBeNull()
    expect(unseal(stubCodec, 42)).toBeNull()
    expect(unseal(broken, seal(stubCodec, 'secret'))).toBeNull()
  })
})
