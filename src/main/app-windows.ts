import { BrowserWindow } from 'electron'

/**
 * The windows people see, as opposed to hidden helper windows (the audio capture
 * window). Code that means "the elecdex window" - bringing it forward, telling
 * whether it is in front, broadcasting to pages - asks here, so a helper window
 * is never taken for it.
 */
const helpers = new WeakSet<BrowserWindow>()

/** Marks a window as a hidden helper, for as long as it exists. */
export function markHelperWindow(win: BrowserWindow): void {
  helpers.add(win)
}

export function appWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows().filter((win) => !helpers.has(win))
}
