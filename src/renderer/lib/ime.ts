/**
 * Whether a key belongs to an IME conversion: the Enter that commits one, the Escape that
 * cancels it, or any key while it goes on (some IMEs send only keyCode 229). Those keys are the
 * IME's, never a field's or a pane's: an Enter that added a task, launched an application or
 * stepped a search, and an Escape that closed a popup, were the conversion's (found in review).
 * tests/unit/ime-keys.test.ts holds every key handler beside a text field to it.
 */
export const composing = (event: KeyboardEvent): boolean =>
  event.isComposing || event.keyCode === 229
