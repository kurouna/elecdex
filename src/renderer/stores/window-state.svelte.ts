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
  /**
   * Whether the window is on screen: false while it is minimised or put away in
   * the notification area. A pane that fetches or writes only for the eye stops
   * then, as it does behind another tab (`seen`).
   */
  onScreen = $state(true)
  #started = false

  /** Starts following the window. Safe to call from every component that reads it. */
  follow(): void {
    if (this.#started) return
    this.#started = true
    // A page with no window of its own to ask about (a component test's stub) keeps the assumptions.
    const system = window.elecdex?.system
    if (typeof system?.windowState !== 'function' || typeof system.onWindowState !== 'function')
      return
    const apply = (state: WindowState): void => {
      this.fullscreen = state.fullscreen
      this.onScreen = !state.hidden
      // Put away or minimised: the frame loop stops until the window is back.
      setWindowHidden(state.hidden)
    }
    let pushed = false
    // The first answer may come back after main has already reported a change (the
    // window put away as the page loads): the event is the newer of the two.
    void window.elecdex.system.windowState().then((state) => {
      if (!pushed) apply(state)
    })
    window.elecdex.system.onWindowState((state) => {
      pushed = true
      apply(state)
    })
  }
}

export const windowState = new WindowStateStore()

/**
 * Whether a pane is seen: shown in its tab group, and the window on screen. The
 * panes that fetch or write only for the eye (the forecast, quotes, feeds,
 * orbits, a repository, agents' records, the monitors' figures) run on this,
 * and take up again when it is true once more.
 */
export function seen(visible: boolean): boolean {
  windowState.follow()
  return visible && windowState.onScreen
}
