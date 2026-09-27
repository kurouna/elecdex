import { untrack } from 'svelte'
import { ui } from '../stores/ui.svelte.ts'

/**
 * A request made this recently is still for a pane that mounts in answer to it
 * (a popup opened by the shortcut); an older one is not, or a layout reset
 * would have a pane coming back take the keyboard from the shell being typed in.
 */
const FRESH_MS = 2000

/**
 * Answers the pane's shortcut (layout/summon.ts): `answer` runs each time the
 * pane is called up, with `again` when it was up already. Called while the
 * component is set up; the pane's id is read, not followed.
 *
 * The answer comes a microtask late: a popup notes where the keyboard was when
 * it opened, to give it back when it goes (PopupPane.svelte), and a widget
 * taking the keyboard while it mounts would be noted in its place.
 */
export function onSummoned(paneId: () => string, answer: (again: boolean) => void): void {
  const id = untrack(paneId)
  const first = ui.summoned
  let seen =
    first !== null && first.paneId === id && Date.now() - first.at < FRESH_MS
      ? -1
      : (first?.seq ?? 0)
  $effect(() => {
    const request = ui.summoned
    if (request === null || request.seq === seen) return
    seen = request.seq
    if (request.paneId === id) queueMicrotask(() => answer(request.again))
  })
}
