/**
 * Keeping the selected row of a keyboard-driven listbox on screen.
 *
 * Both pickers (add pane, weather place) show more rows than fit and move the
 * selection with the arrow keys, so the scroller has to follow the selection
 * itself: nothing is focused but the filter box, so the browser never scrolls
 * for us.
 */
export function revealSelected(list: HTMLElement | null): void {
  list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}
