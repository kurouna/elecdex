/**
 * Escape inside a widget that closes something of its own (an article, a search bar, a menu,
 * a line being edited): the element marks itself `data-owns-escape` while its Escape does
 * something, and the workspace's own Escape - putting a pane that is forward back, closing a
 * popped-up pane - leaves a key pressed inside it alone, so the widget's handler gets it.
 * Pressed again once the widget's thing has gone, Escape does what it always does.
 *
 * `data-owns-escape="anywhere"` is for what has the key wherever the keyboard is: a menu opened
 * by the pointer, a drag going on. The workspace's handlers run in the capture phase on the
 * window, before any widget's, so without this a popped-up or forward pane closed whole instead
 * (found in review: the RSS article, then the AI chat, TERMINAL search, TRANSLATE's language
 * picker, the snippet editor and every other widget with an Escape of its own).
 *
 * tests/unit/escape-owner.test.ts holds every widget with an Escape of its own to this.
 */
export function escapeOwned(event: KeyboardEvent): boolean {
  const target = event.target
  if (target instanceof Element && target.closest('[data-owns-escape]') !== null) return true
  return document.querySelector('[data-owns-escape="anywhere"]') !== null
}
