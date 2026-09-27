/**
 * The notes a pane's keys hold (docs/plugins.md section 13): a key bound with `hold` starts
 * its note when it goes down and lets it go when it comes up - unless the plugin has the
 * sustain pedal down, in which case the note rings on until the pedal is lifted. Striking a
 * key again lets go of its note still ringing, as a piano's damper would.
 *
 * Kept apart from the synthesiser, which it drives through two functions, so the rules can
 * be tested without one.
 */

interface PaneKeys<H> {
  /** The note under each key that is down. */
  down: Map<string, H>
  /** Notes whose keys are up, ringing under the pedal, with the key each came from. */
  ringing: Map<H, string>
  pedal: boolean
}

export class HeldNotes<N, H> {
  private readonly panes = new Map<string, PaneKeys<H>>()
  private readonly start: (pane: string, note: N) => H | null
  private readonly release: (held: H) => void

  constructor(start: (pane: string, note: N) => H | null, release: (held: H) => void) {
    this.start = start
    this.release = release
  }

  /** A key went down: its note starts. Answers whether one did. */
  down(pane: string, code: string, note: N): boolean {
    const keys = this.keys(pane)
    const before = keys.down.get(code)
    if (before !== undefined) this.release(before)
    for (const [held, from] of keys.ringing) {
      if (from !== code) continue
      keys.ringing.delete(held)
      this.release(held)
    }
    const held = this.start(pane, note)
    if (held === null) {
      keys.down.delete(code)
      return false
    }
    keys.down.set(code, held)
    return true
  }

  /** A key came up: its note goes, or rings on under the pedal. */
  up(pane: string, code: string): void {
    const keys = this.panes.get(pane)
    const held = keys?.down.get(code)
    if (keys === undefined || held === undefined) return
    keys.down.delete(code)
    if (keys.pedal) keys.ringing.set(held, code)
    else this.release(held)
  }

  /** The pedal: lifting it lets go of every note whose key is up. */
  sustain(pane: string, on: boolean): void {
    const keys = this.keys(pane)
    keys.pedal = on
    if (on) return
    for (const held of keys.ringing.keys()) this.release(held)
    keys.ringing.clear()
  }

  /** Forgets a pane: its sound is stopped whole elsewhere. */
  clear(pane: string): void {
    this.panes.delete(pane)
  }

  private keys(pane: string): PaneKeys<H> {
    let keys = this.panes.get(pane)
    if (keys === undefined) {
      keys = { down: new Map(), ringing: new Map(), pedal: false }
      this.panes.set(pane, keys)
    }
    return keys
  }
}
