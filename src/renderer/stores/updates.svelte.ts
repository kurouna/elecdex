import type { UpdateStatus } from '@shared/updates'

/** The update check's status, kept in step with main. */
class UpdatesStore {
  status = $state.raw<UpdateStatus>({ state: 'idle' })
  /** The notice was closed for this version; it comes back for a newer one. */
  dismissed = $state<string | null>(null)
  private started = false

  init(): void {
    if (this.started) return
    this.started = true
    void window.elecdex.updates.status().then((status) => {
      this.status = status
    })
    window.elecdex.updates.onChange((status) => {
      this.status = status
    })
  }

  check(): Promise<UpdateStatus> {
    return window.elecdex.updates.check()
  }
}

export const updates = new UpdatesStore()
