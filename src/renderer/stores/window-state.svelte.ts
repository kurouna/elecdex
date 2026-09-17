import type { WindowState } from '@shared/api'
import { setWindowHidden } from '../lib/frame-loop.ts'

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
    const apply = (state: WindowState): void => {
      this.fullscreen = state.fullscreen
      // Put away or minimised: the frame loop stops until the window is back.
      setWindowHidden(state.hidden)
    }
    void window.elecdex.system.windowState().then(apply)
    window.elecdex.system.onWindowState(apply)
  }
}

export const windowState = new WindowStateStore()
