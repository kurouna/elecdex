/** How near the top of a list still counts as at the top, in pixels. */
const AT_TOP_PX = 4

/**
 * New rows arriving above a list the user has scrolled down: counted for the
 * "↑ n new" pill instead of moving what is being read. The browser's scroll
 * anchoring keeps the rows in view where they are; at the very top it does not
 * anchor, so new rows push the list down in sight and nothing is counted.
 */
export class NewAbove {
  count = $state(0)
  #list = $state<HTMLElement | null>(null)

  /**
   * The scrolling list; bind it with bind:this. Another list (or none) starts the count afresh:
   * a list drawn again starts at its top, with what the count stood for in sight. The RSS pane's
   * pill outlived its list behind the settings or another view (found in review).
   */
  get list(): HTMLElement | null {
    return this.#list
  }

  set list(element: HTMLElement | null) {
    if (element === this.#list) return
    this.#list = element
    this.count = 0
  }

  /** Call with the number of new rows before they are rendered. */
  arrived(rows: number): void {
    if (rows > 0 && this.list !== null && this.list.scrollTop > AT_TOP_PX) this.count += rows
  }

  /** Call on the list's scroll: back at the top, the new rows have been seen. */
  scrolled(): void {
    if (this.count > 0 && this.list !== null && this.list.scrollTop <= AT_TOP_PX) this.count = 0
  }

  /** Back to the top, to the new rows. */
  jump(smooth: boolean): void {
    this.list?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' })
    this.count = 0
  }

  clear(): void {
    this.count = 0
  }
}
