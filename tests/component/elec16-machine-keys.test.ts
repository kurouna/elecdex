import { keyCode } from '@shared/elec16/keys'
import { sciKeyCode } from '@shared/elec16/sci-keys'
import { ANNUNCIATORS } from '@shared/elec16/state'
import { flushSync } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BRK_SHOWN } from '../../src/renderer/widgets/elec16/machine-keys.svelte.ts'
import type { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import { machineKeysHost } from './elec16-machine-keys-host.svelte.ts'

/**
 * The PC's keys as the ELEC-16 pane gives them to its machine (machine-keys.svelte.ts), and
 * which of the body's keys they hold down (`pcDown`, the machine's key codes): every key the
 * PC holds is drawn pressed until its own key-up, and nothing is left held when the pane
 * stops listening or the machine is typed to another way.
 */

function fakeRunner() {
  return {
    annunciators: 0,
    asleep: false,
    gamepads: null,
    down: vi.fn(),
    press: vi.fn(),
    release: vi.fn(),
    releaseAll: vi.fn(),
    brk: vi.fn(),
    padFrom: vi.fn(),
  }
}

type Fake = ReturnType<typeof fakeRunner>

let stops: (() => void)[] = []
afterEach(() => {
  for (const stop of stops) stop()
  stops = []
})

function host(input: 'keyboard' | 'pad' | 'calc' = 'keyboard', fake: Fake = fakeRunner()) {
  const made = machineKeysHost(fake as unknown as Elec16Runner, input)
  stops.push(made.stop)
  flushSync()
  return { ...made, fake }
}

const key = (type: 'keydown' | 'keyup', code: string, k: string, more: KeyboardEventInit = {}) =>
  new KeyboardEvent(type, { code, key: k, cancelable: true, ...more })

const codes = (set: ReadonlySet<number>): number[] => [...set].sort((a, b) => a - b)

describe('the PC keys on a pocket model', () => {
  it('holds the body key a PC key presses until its own key-up', () => {
    const { keys, fake } = host()
    keys.down(key('keydown', 'KeyA', 'a'))
    expect(codes(keys.pcDown)).toEqual([keyCode('a')])
    expect(fake.down).toHaveBeenCalledWith(keyCode('a'), false)
    keys.up(key('keyup', 'KeyA', 'a'))
    expect(keys.pcDown.size).toBe(0)
    expect(fake.release).toHaveBeenCalledWith(keyCode('a'))
  })

  it('holds SHIFT down beside a character on a shifted face', () => {
    const { keys } = host()
    keys.down(key('keydown', 'Digit1', '!', { shiftKey: true }))
    expect(codes(keys.pcDown)).toEqual(codes(new Set([keyCode('shift'), keyCode('1')])))
    keys.up(key('keyup', 'Digit1', '!', { shiftKey: true }))
    expect(keys.pcDown.size).toBe(0)
  })

  it('in KANA mode, holds the key at the PC key place', () => {
    const fake = fakeRunner()
    fake.annunciators = 1 << ANNUNCIATORS.indexOf('KANA')
    const { keys } = host('keyboard', fake)
    keys.down(key('keydown', 'KeyQ', 'た'))
    expect(codes(keys.pcDown)).toEqual([keyCode('q')])
  })

  it('taps KANA from the PC kana key, whose key-up an input method keeps, and draws it held at no time', () => {
    const { keys, fake } = host()
    keys.down(key('keydown', 'KanaMode', 'KanaMode'))
    expect(fake.down).toHaveBeenCalledWith(keyCode('kana'), false)
    expect(fake.release).toHaveBeenCalledWith(keyCode('kana'))
    expect(keys.pcDown.size).toBe(0)
    // No key-up comes; the next key is held and let go as any other.
    keys.down(key('keydown', 'KeyQ', 'q'))
    expect([...keys.pcDown]).toEqual([keyCode('q')])
    keys.up(key('keyup', 'KeyQ', 'q'))
    expect(keys.pcDown.size).toBe(0)
  })

  it('does not set the held keys again while the PC repeats a key', () => {
    const { keys } = host()
    keys.down(key('keydown', 'KeyA', 'a'))
    const first = keys.pcDown
    keys.down(key('keydown', 'KeyA', 'a', { repeat: true }))
    expect(keys.pcDown).toBe(first)
  })

  it('lets go of the first key when a held PC key comes to press another (Shift pressed under it)', () => {
    const { keys, fake } = host()
    keys.down(key('keydown', 'Digit8', '8'))
    // Shift goes down while 8 is held: the repeat now types *, another machine key.
    keys.down(key('keydown', 'Digit8', '*', { shiftKey: true, repeat: true }))
    expect(fake.release).toHaveBeenCalledWith(keyCode('8'))
    expect(keys.pcDown.has(keyCode('8'))).toBe(false)
    keys.up(key('keyup', 'Digit8', '*', { shiftKey: true }))
    expect(fake.release).toHaveBeenCalledWith(keyCode('*'))
    expect(keys.pcDown.size).toBe(0)
  })

  it('keeps a machine key down while another PC key still holds it (Enter and the keypad Enter)', () => {
    const { keys, fake } = host()
    keys.down(key('keydown', 'Enter', 'Enter'))
    keys.down(key('keydown', 'NumpadEnter', 'Enter'))
    keys.up(key('keyup', 'Enter', 'Enter'))
    expect(fake.release).not.toHaveBeenCalled()
    expect(codes(keys.pcDown)).toEqual([keyCode('enter')])
    keys.up(key('keyup', 'NumpadEnter', 'Enter'))
    expect(fake.release).toHaveBeenCalledWith(keyCode('enter'))
    expect(keys.pcDown.size).toBe(0)
  })

  it('holds BRK down while Pause is; a repeat strikes BRK again, and nothing is released', () => {
    const { keys, fake } = host()
    keys.down(key('keydown', 'Pause', 'Pause'))
    keys.down(key('keydown', 'Pause', 'Pause', { repeat: true }))
    expect(fake.brk).toHaveBeenCalledTimes(2)
    expect(codes(keys.pcDown)).toEqual([BRK_SHOWN])
    keys.up(key('keyup', 'Pause', 'Pause'))
    expect(keys.pcDown.size).toBe(0)
    expect(fake.release).not.toHaveBeenCalled()
  })

  it('lets go of every key when the pane stops listening', () => {
    const { keys, fake, setListening } = host()
    keys.down(key('keydown', 'KeyA', 'a'))
    keys.down(key('keydown', 'Pause', 'Pause'))
    setListening(false)
    flushSync()
    expect(keys.pcDown.size).toBe(0)
    expect(fake.releaseAll).toHaveBeenCalled()
  })

  it('lets go of every key when the machine comes to be typed to another way', () => {
    const { keys, fake, setInput } = host()
    keys.down(key('keydown', 'KeyA', 'a'))
    fake.releaseAll.mockClear()
    setInput('calc')
    flushSync()
    expect(keys.pcDown.size).toBe(0)
    expect(fake.releaseAll).toHaveBeenCalledTimes(1)
    // A key-up of what was held then reaches nothing.
    keys.up(key('keyup', 'KeyA', 'a'))
    expect(fake.release).not.toHaveBeenCalled()
  })
})

describe('the PC keys on SCI-128', () => {
  it('holds the function key a letter presses', () => {
    const { keys, fake } = host('calc')
    keys.down(key('keydown', 'KeyS', 's'))
    expect(codes(keys.pcDown)).toEqual([sciKeyCode('sin')])
    expect(fake.press).toHaveBeenCalledTimes(1)
    keys.down(key('keydown', 'KeyS', 's', { repeat: true }))
    expect(fake.press).toHaveBeenCalledTimes(1)
    keys.up(key('keyup', 'KeyS', 's'))
    expect(keys.pcDown.size).toBe(0)
  })

  it('holds SHIFT beside a SHIFT face: ! is x!, on x⁻¹', () => {
    const { keys } = host('calc')
    keys.down(key('keydown', 'Digit1', '!', { shiftKey: true }))
    expect(codes(keys.pcDown)).toEqual(codes(new Set([sciKeyCode('shift'), sciKeyCode('inv')])))
  })

  it('holds ON down while Pause is', () => {
    const { keys } = host('calc')
    keys.down(key('keydown', 'Pause', 'Pause'))
    expect(codes(keys.pcDown)).toEqual([BRK_SHOWN])
  })
})

describe('the PC keys on PLAY-320', () => {
  it('holds no key of a keyboard: the pad shows its own', () => {
    const { keys, fake } = host('pad')
    keys.down(key('keydown', 'KeyZ', 'z'))
    expect(keys.pcDown.size).toBe(0)
    expect(fake.padFrom).toHaveBeenCalled()
  })
})
