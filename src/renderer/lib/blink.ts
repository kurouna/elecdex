import { appearance } from '../stores/appearance.svelte.ts'

/**
 * The press that blinks, as the launcher's tiles and the layouts dialog's choices do
 * (docs/architecture.md section 7): the accent flashes on a 100 ms beat while a button is
 * held (CSS, `:active`), and a press that changes what is shown blinks three beats before
 * it happens, so the eye can follow where it came from. With motion reduced it happens at
 * once.
 *
 * `afterBlink` marks the element with `blinking` for the three beats and then runs the
 * action. One at a time per element: a second press while it blinks is dropped, as it is
 * already on its way.
 */

export const BLINK_BEAT_MS = 100
export const CHOICE_BLINK_MS = 3 * BLINK_BEAT_MS

export function afterBlink(element: HTMLElement | null, action: () => void): void {
  if (element === null || appearance.reducedMotion) {
    action()
    return
  }
  if (element.classList.contains('blinking')) return
  element.classList.add('blinking')
  setTimeout(() => {
    element.classList.remove('blinking')
    action()
  }, CHOICE_BLINK_MS)
}
