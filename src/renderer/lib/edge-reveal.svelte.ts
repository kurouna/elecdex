/**
 * A control strip that stays out of the way: shown when the pointer reaches a
 * hot zone at the window's edge, and hidden again shortly after the pointer
 * leaves both that zone and the strip - unless something in the strip has
 * keyboard focus (an open list, an armed confirm).
 *
 * Judged from the pointer position on every move rather than from enter/leave
 * events on the strip: the strip slides in under a pointer that is standing
 * still, which never enters it, so it would never be told the pointer left
 * either.
 *
 * Used by the status bar (bottom edge) and the window controls (top-right
 * corner, in fullscreen).
 */
export class EdgeReveal {
  shown = $state(false)
  /** The strip, once mounted; bind it with bind:this. */
  element = $state<HTMLElement | null>(null)

  readonly #inHotZone: (x: number, y: number) => boolean
  readonly #hideDelayMs: number
  #hideTimer: ReturnType<typeof setTimeout> | undefined

  constructor(inHotZone: (x: number, y: number) => boolean, hideDelayMs = 500) {
    this.#inHotZone = inHotZone
    this.#hideDelayMs = hideDelayMs
  }

  /** Feed every window pointermove here. */
  track(x: number, y: number): void {
    if (this.#inHotZone(x, y) || (this.shown && this.#overStrip(x, y))) this.show()
    else if (this.shown) this.hideSoon()
  }

  show(): void {
    clearTimeout(this.#hideTimer)
    this.#hideTimer = undefined
    if (!this.shown) this.shown = true
  }

  hideSoon(): void {
    if (this.#hideTimer !== undefined) return
    this.#hideTimer = setTimeout(() => {
      this.#hideTimer = undefined
      if (this.element?.matches(':focus-within')) return
      this.shown = false
    }, this.#hideDelayMs)
  }

  /** Hides at once, as when the strip no longer applies. */
  hide(): void {
    clearTimeout(this.#hideTimer)
    this.#hideTimer = undefined
    this.shown = false
  }

  #overStrip(x: number, y: number): boolean {
    const box = this.element?.getBoundingClientRect()
    return box !== undefined && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
  }
}
