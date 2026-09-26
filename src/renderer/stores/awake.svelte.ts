import { type AwakeRequest, type AwakeState, RELEASED } from '@shared/utility'

/**
 * AWAKE's hold as main has it (docs/architecture.md section 5.16): one for the
 * machine, followed by the status bar and every UTILITY pane.
 *
 * Main sends each change to every window, so this only listens - nothing is
 * polled, and nothing is subscribed per pane - and asks once at the start.
 */
class AwakeStore {
  state = $state.raw<AwakeState>({ ...RELEASED, held: false, onBattery: false })
  private ready: Promise<void> | null = null

  /** Reads the hold once and follows it; the promise is the first answer. Safe to call again. */
  init(): Promise<void> {
    if (this.ready !== null) return this.ready
    window.elecdex.utility.awake.onChange((next) => {
      this.state = next
    })
    this.ready = window.elecdex.utility.awake.state().then(
      (next) => {
        this.state = next
      },
      (error: unknown) => console.error('[elecdex] could not read the awake hold', error),
    )
    return this.ready
  }

  get holding(): boolean {
    return this.state.level !== 'off'
  }

  async set(request: AwakeRequest): Promise<void> {
    this.state = await window.elecdex.utility.awake.set(request)
  }

  async extend(): Promise<void> {
    this.state = await window.elecdex.utility.awake.extend()
  }
}

export const awake = new AwakeStore()
