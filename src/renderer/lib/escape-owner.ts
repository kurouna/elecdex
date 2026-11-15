/**
 * Escape inside a widget that closes something of its own (the RSS pane's article view): the
 * element marks itself `data-owns-escape`, and the workspace's own Escape - putting a pane
 * that is forward back, closing a popped-up pane - leaves a key pressed inside it alone, so
 * the widget's handler gets it. Pressed again once the widget's thing has gone, Escape does
 * what it always does. Before, a popped-up RSS pane closed whole instead of its article
 * (found in review).
 */
export function escapeOwned(event: KeyboardEvent): boolean {
  const target = event.target
  return target instanceof Element && target.closest('[data-owns-escape]') !== null
}
