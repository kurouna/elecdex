/**
 * before-quit, held for the shells: the first quit ends at once what ends at once (TRANSLATE's
 * engine and fetch), closes the shells, and holds the quit until their output workers have ended
 * (PtyManager.disposeAll: ended with them still being torn down, the process crashed on its way
 * out); then it quits again, and that quit goes through. A quit asked while it waits (the tray,
 * the window, Ctrl+Shift+Q) is held too, never let through early (found in review).
 */

export interface QuitGateParts {
  /** Closes the shells; null when there are none to close (the IPC is gone). */
  closeShells: () => Promise<void> | null
  /** What ends with the app at once, without waiting. Called once. */
  endAtOnce: () => void
  /** Asks the app to quit again (app.quit). */
  quit: () => void
}

export function quitGate(parts: QuitGateParts): (event: { preventDefault(): void }) => void {
  let phase: 'running' | 'closing' | 'closed' = 'running'
  return (event) => {
    if (phase === 'closed') return
    if (phase === 'closing') {
      event.preventDefault()
      return
    }
    parts.endAtOnce()
    const shells = parts.closeShells()
    if (shells === null) {
      phase = 'closed'
      return
    }
    phase = 'closing'
    event.preventDefault()
    void shells.then(() => {
      phase = 'closed'
      parts.quit()
    })
  }
}
