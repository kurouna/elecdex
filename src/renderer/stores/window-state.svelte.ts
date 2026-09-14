/**
 * Whether the window is fullscreen, as main reports it. Shared by the title bar
 * (drawn only in a window) and the corner controls (shown only in fullscreen),
 * so the page asks and subscribes once.
 */
class WindowStateStore {
  /** Assumed until main answers: elecdex starts fullscreen. */
  fullscreen = $state(true)
  #started = false

  /** Starts following the window. Safe to call from every component that reads it. */
  follow(): void {
    if (this.#started) return
    this.#started = true
    void window.elecdex.system.windowState().then((state) => {
      this.fullscreen = state.fullscreen
    })
    window.elecdex.system.onWindowState((state) => {
      this.fullscreen = state.fullscreen
    })
  }
}

export const windowState = new WindowStateStore()
