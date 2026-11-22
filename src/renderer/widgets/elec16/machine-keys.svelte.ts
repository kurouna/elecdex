import { keyCode } from '@shared/elec16/keys'
import { sciKeyCode } from '@shared/elec16/sci-keys'
import { untrack } from 'svelte'
import { onFrame } from '../../lib/frame-loop.ts'
import { kanaLit, pcKeyFate } from './pc-keys.ts'
import { gamepadBits, playKeyFate } from './play-input.ts'
import type { Elec16Runner } from './runner.svelte.ts'
import { sciKeyFate } from './sci-input.ts'

/**
 * The PC's keys and gamepads as the ELEC-16 pane gives them to its machine (docs/elec16.md
 * section 9, docs/elec16-play.md section 6, docs/elec16-sci.md section 5.3): on the pocket
 * models a key of the machine's keyboard (pc-keys.ts), on PLAY-320 a button of the pad
 * (play-input.ts), on SCI-128 a calculator key (sci-input.ts) - and BRK on each.
 * A key is held until its own key-up, and every key goes up when the pane no longer listens
 * or the machine comes to be typed to another way, as no key-up will come. The gamepads are
 * read only while PLAY-320's pane is seen and has the focus: each tick the machine runs (the
 * runner reads them), and on the shared 10 fps loop while it sleeps.
 *
 * The keys the PC holds are drawn held on the body too (`pcDown`), as PLAY-320's pad shows its
 * buttons: by the machine's key codes, SHIFT beside a character that needs it, and BRK
 * (`BRK_SHOWN`) while Pause is down. That is only drawn: the machine gets its keys as before,
 * and PASTE's keys, pressed through the runner, are not drawn.
 *
 * Made while the pane's component is set up: its effects are the component's.
 */
export interface MachineKeysOptions {
  /** The pane has the focus in a focused window, and shows the machine. */
  listening: () => boolean
  /** How the machine is typed to (map.ts `input`): a keyboard, PLAY-320's pad, the calculator's keys. */
  input: () => 'keyboard' | 'pad' | 'calc'
  /** The machine is in sight (the gamepads are read only then). */
  seen: () => boolean
}

/** BRK/ON in `pcDown`: a line of its own, with no key code. */
export const BRK_SHOWN = -1

/** No keys held: the one empty set, so a body given none compares the same. */
export const NO_KEYS: ReadonlySet<number> = new Set()
const SHIFT = keyCode('shift')
const SCI_SHIFT = sciKeyCode('shift')
/**
 * PC keys an input method takes the key-up of: the JIS かな key (`KanaMode`) on Windows, seen
 * by hand (2026-11-22). They tap their machine key instead of holding it.
 */
const TAPPED: ReadonlySet<string> = new Set(['KanaMode'])

export class MachineKeys {
  /** The body's keys the PC holds down, by the machine's key codes (and `BRK_SHOWN`). */
  pcDown = $state.raw<ReadonlySet<number>>(NO_KEYS)

  readonly #runner: Elec16Runner
  readonly #options: MachineKeysOptions
  /** PC keys held, by their code, with the machine key each pressed. */
  readonly #held = new Map<string, number>()
  /** On PLAY-320: PC keys held, by their code, with the pad button each pressed. */
  readonly #padKeys = new Map<string, number>()
  /** What each held PC key shows held on the body, by its code: drawn only. */
  readonly #shownBy = new Map<string, readonly number[]>()

  constructor(runner: Elec16Runner, options: MachineKeysOptions) {
    this.#runner = runner
    this.#options = options
    // The keyboard left: every key goes up, as no key-up will come.
    $effect(() => {
      if (options.listening()) return
      untrack(() => this.#letGoAll())
    })
    // Typed to another way (another model): what the last way held is let go too.
    let typedBy: string | null = null
    $effect(() => {
      const input = options.input()
      const before = typedBy
      typedBy = input
      if (before !== null && before !== input) untrack(() => this.#letGoAll())
    })
    $effect(() => {
      if (options.input() !== 'pad' || !options.listening() || !options.seen()) return
      const read = () => gamepadBits(navigator.getGamepads?.() ?? [])
      runner.gamepads = read
      const stop = onFrame(() => {
        if (runner.asleep) runner.padFrom('gamepad', read())
      })
      return () => {
        stop()
        runner.gamepads = null
        runner.padFrom('gamepad', 0)
      }
    })
  }

  /** A key went down on the pane itself (the caller has checked it is the pane's). */
  down(event: KeyboardEvent): void {
    if (!this.#options.listening()) return
    const input = this.#options.input()
    if (input === 'pad') {
      this.#padDown(event)
      return
    }
    if (input === 'calc') {
      this.#calcDown(event)
      return
    }
    const runner = this.#runner
    const fate = pcKeyFate(event, kanaLit(runner.annunciators))
    if (fate.kind === 'pass') return
    event.preventDefault()
    if (fate.kind === 'brk') {
      runner.brk()
      this.#show(event.code, [BRK_SHOWN])
      return
    }
    // A key whose key-up the input method keeps (かな on Windows) is pressed and let go at
    // once: held, it stayed down in the machine and on the body until the focus left.
    if (TAPPED.has(event.code)) {
      runner.down(fate.code, fate.shift)
      runner.release(fate.code)
      return
    }
    // The same PC key now pressing another machine key (Shift or KANA changed under it): the
    // first goes up, or nothing would ever let go of it.
    const before = this.#held.get(event.code)
    this.#held.set(event.code, fate.code)
    if (before !== undefined && before !== fate.code) this.#releaseIfFree(before)
    runner.down(fate.code, fate.shift)
    this.#show(event.code, fate.shift ? [SHIFT, fate.code] : [fate.code])
  }

  /** A key went up: whatever else is held by then, the machine never keeps it down. */
  up(event: KeyboardEvent): void {
    const runner = this.#runner
    if (this.#padKeys.delete(event.code)) {
      event.preventDefault()
      runner.padFrom('keys', this.#padHeld())
      return
    }
    this.#show(event.code, null)
    const code = this.#held.get(event.code)
    if (code === undefined) return
    this.#held.delete(event.code)
    event.preventDefault()
    this.#releaseIfFree(code)
  }

  /**
   * A key on SCI-128: a calculator key (sci-input.ts), BRK, or the app's. A SHIFT face (√, x!)
   * takes SHIFT first unless it is already waiting; any other key leaves SHIFT as the body
   * left it, so SHIFT pressed there and then `s` typed here is SIN⁻¹.
   */
  #calcDown(event: KeyboardEvent): void {
    const fate = sciKeyFate(event)
    if (fate.kind === 'pass') return
    event.preventDefault()
    if (fate.kind === 'brk') {
      this.#runner.brk()
      this.#show(event.code, [BRK_SHOWN])
      return
    }
    // A key the PC repeats while held is pressed once: the calculator does not repeat keys.
    if (this.#held.has(event.code)) return
    this.#held.set(event.code, fate.code)
    if (fate.shift) this.#runner.down(fate.code, true)
    else this.#runner.press(fate.code)
    this.#show(event.code, fate.shift ? [SCI_SHIFT, fate.code] : [fate.code])
  }

  /** A key on PLAY-320: a pad button (play-input.ts), BRK, or the app's. */
  #padDown(event: KeyboardEvent): void {
    const fate = playKeyFate(event)
    if (fate.kind === 'pass') return
    event.preventDefault()
    if (fate.kind === 'brk') {
      this.#runner.brk()
      return
    }
    this.#padKeys.set(event.code, fate.bit)
    this.#runner.padFrom('keys', this.#padHeld())
  }

  /** The pad buttons the PC's keys hold, together. */
  #padHeld(): number {
    let bits = 0
    for (const bit of this.#padKeys.values()) bits |= bit
    return bits
  }

  /** A machine key goes up, unless another PC key still holds it (Enter and the keypad's). */
  #releaseIfFree(code: number): void {
    for (const held of this.#held.values()) if (held === code) return
    this.#runner.release(code)
  }

  /** Every key up and nothing drawn held: the pane stopped listening, or the machine changed. */
  #letGoAll(): void {
    this.#held.clear()
    this.#padKeys.clear()
    this.#shownBy.clear()
    if (this.pcDown.size > 0) this.pcDown = NO_KEYS
    this.#runner.releaseAll()
  }

  /**
   * What the PC key `code` shows held on the body (null: nothing now). The set is made again
   * only when what it holds changed: a key the PC repeats draws nothing new.
   */
  #show(code: string, keys: readonly number[] | null): void {
    if (keys === null) {
      if (!this.#shownBy.delete(code)) return
    } else this.#shownBy.set(code, keys)
    const next = new Set<number>()
    for (const shown of this.#shownBy.values()) for (const k of shown) next.add(k)
    const now = this.pcDown
    if (next.size === now.size && [...next].every((k) => now.has(k))) return
    this.pcDown = next.size === 0 ? NO_KEYS : next
  }
}
