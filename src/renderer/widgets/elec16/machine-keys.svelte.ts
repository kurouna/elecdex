import { untrack } from 'svelte'
import { onFrame } from '../../lib/frame-loop.ts'
import { kanaLit, pcKeyFate } from './pc-keys.ts'
import { gamepadBits, playKeyFate } from './play-input.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * The PC's keys and gamepads as the ELEC-16 pane gives them to its machine (docs/elec16.md
 * section 9, docs/elec16-play.md section 6): on the pocket models a key of the machine's
 * keyboard (pc-keys.ts), on PLAY-320 a button of the pad (play-input.ts) - and BRK on either.
 * A key is held until its own key-up, and every key goes up when the pane no longer listens,
 * as no key-up will come. The gamepads are read only while PLAY-320's pane is seen and has
 * the focus: each tick the machine runs (the runner reads them), and on the shared 10 fps
 * loop while it sleeps.
 *
 * Made while the pane's component is set up: its effects are the component's.
 */
export interface MachineKeysOptions {
  /** The pane has the focus in a focused window, and shows the machine. */
  listening: () => boolean
  /** The machine is a PLAY-320: the pad's buttons, not a keyboard. */
  play: () => boolean
  /** The machine is in sight (the gamepads are read only then). */
  seen: () => boolean
}

export class MachineKeys {
  readonly #runner: Elec16Runner
  readonly #options: MachineKeysOptions
  /** PC keys held, by their code, with the machine key each pressed. */
  readonly #held = new Map<string, number>()
  /** On PLAY-320: PC keys held, by their code, with the pad button each pressed. */
  readonly #padKeys = new Map<string, number>()

  constructor(runner: Elec16Runner, options: MachineKeysOptions) {
    this.#runner = runner
    this.#options = options
    // The keyboard left: every key goes up, as no key-up will come.
    $effect(() => {
      if (options.listening()) return
      untrack(() => {
        this.#held.clear()
        this.#padKeys.clear()
        runner.releaseAll()
      })
    })
    $effect(() => {
      if (!options.play() || !options.listening() || !options.seen()) return
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
    if (this.#options.play()) {
      this.#padDown(event)
      return
    }
    const runner = this.#runner
    const fate = pcKeyFate(event, kanaLit(runner.annunciators))
    if (fate.kind === 'pass') return
    event.preventDefault()
    if (fate.kind === 'brk') {
      runner.brk()
      return
    }
    this.#held.set(event.code, fate.code)
    runner.down(fate.code, fate.shift)
  }

  /** A key went up: whatever else is held by then, the machine never keeps it down. */
  up(event: KeyboardEvent): void {
    const runner = this.#runner
    if (this.#padKeys.delete(event.code)) {
      event.preventDefault()
      runner.padFrom('keys', this.#padHeld())
      return
    }
    const code = this.#held.get(event.code)
    if (code === undefined) return
    this.#held.delete(event.code)
    event.preventDefault()
    runner.release(code)
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
}
