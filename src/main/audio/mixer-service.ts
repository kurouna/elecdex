import {
  applyMixerCommand,
  EMPTY_MIXER,
  type MixerCommand,
  type MixerPeaks,
  type MixerState,
  type MixerUpdate,
  validMixerCommand,
} from '@shared/audio'

/**
 * The system mixer, read and changed through a platform backend while any mixer
 * pane is showing. Electron-free: the backend and the clock are injected, so the
 * rules below are unit-tested.
 *
 *  - Nothing runs without a subscriber: start() starts the backend, stop() stops it.
 *  - A command is checked against the channels the backend last reported, shown
 *    at once, and passed on. Until the backend reports the change - or a short
 *    grace period passes - its readings of that channel are overlaid with the
 *    command, so a fader does not jump back while the system catches up.
 */

export interface MixerBackend {
  start(events: { state(state: MixerState): void; peaks(peaks: MixerPeaks): void }): void
  stop(): void
  apply(command: MixerCommand): void
}

/** How long a command overrides readings that do not show it yet. */
export const COMMAND_GRACE_MS = 1500

export class MixerService {
  readonly #backend: MixerBackend
  readonly #publish: (update: MixerUpdate) => void
  readonly #now: () => number
  #state: MixerState = EMPTY_MIXER
  #running = false
  readonly #pending = new Map<string, { command: MixerCommand; until: number }>()

  constructor(deps: {
    backend: MixerBackend
    publish: (update: MixerUpdate) => void
    now?: () => number
  }) {
    this.#backend = deps.backend
    this.#publish = deps.publish
    this.#now = deps.now ?? Date.now
  }

  state(): MixerState {
    return this.#state
  }

  start(): void {
    if (this.#running) return
    this.#running = true
    this.#backend.start({
      state: (state) => {
        if (!this.#running) return
        this.#state = this.#overlay(state)
        this.#publish({ t: 'state', state: this.#state })
      },
      peaks: (peaks) => {
        if (this.#running) this.#publish({ t: 'peaks', peaks })
      },
    })
  }

  stop(): void {
    if (!this.#running) return
    this.#running = false
    this.#backend.stop()
    this.#pending.clear()
  }

  /** Applies a command if it is valid for the current channels; false when refused. */
  command(raw: unknown): boolean {
    if (!this.#running) return false
    const command = validMixerCommand(raw, this.#state)
    if (command === null) return false
    this.#pending.set(`${command.t}:${command.id}`, {
      command,
      until: this.#now() + COMMAND_GRACE_MS,
    })
    this.#state = applyMixerCommand(this.#state, command)
    this.#publish({ t: 'state', state: this.#state })
    this.#backend.apply(command)
    return true
  }

  /** A reading with the commands it does not show yet laid over it. */
  #overlay(reading: MixerState): MixerState {
    let state = reading
    const now = this.#now()
    for (const [key, { command, until }] of this.#pending) {
      const channel =
        reading.master?.id === command.id
          ? reading.master
          : reading.apps.find((a) => a.id === command.id)
      const shown =
        channel !== undefined &&
        (command.t === 'volume'
          ? Math.abs(channel.volume - command.volume) < 0.011
          : channel.muted === command.muted)
      if (channel === undefined || shown || now >= until) {
        this.#pending.delete(key)
        continue
      }
      state = applyMixerCommand(state, command)
    }
    return state
  }
}
