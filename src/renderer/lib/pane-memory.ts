import { isPopupPaneId } from '../layout/popup.ts'

/**
 * What a widget keeps in the page's memory by pane id, past its own mount - a moved pane
 * remounts, and finds it again - let go once the pane is gone. The workspace's reaper, which
 * knows the panes, tells every keeper which are still there; it never knows what they keep, so
 * the shared part names no widget.
 */
type Forget = (alive: ReadonlySet<string>) => void

const keepers = new Set<Forget>()

/** A widget's keeping: `forget` drops whatever it holds for panes not in `alive`. */
export function keepsByPane(forget: Forget): void {
  keepers.add(forget)
}

/** The reaper's word: these panes are all there are. */
export function forgetGonePanes(alive: ReadonlySet<string>): void {
  for (const forget of keepers) forget(alive)
}

/**
 * Short fields a person types in - a filter, a symbol to add, a task's title - by pane and
 * field: a move remounts the pane, and what was typed was lost (found in the sweep after the
 * chat's composer). A popped-up pane is never moved, and starts afresh each time it opens.
 */
const typed = new Map<string, string>()
const SEP = '\u0000'

keepsByPane((alive) => {
  for (const key of typed.keys()) if (!alive.has(key.slice(0, key.indexOf(SEP)))) typed.delete(key)
})

/** What was typed in a pane's field before it was last remounted, or ''. */
export function recallTyped(paneId: string, field: string): string {
  return typed.get(`${paneId}${SEP}${field}`) ?? ''
}

/** Keeps what is typed now; an empty field keeps nothing. */
export function keepTyped(paneId: string, field: string, value: string): void {
  const key = `${paneId}${SEP}${field}`
  if (value === '' || isPopupPaneId(paneId)) typed.delete(key)
  else typed.set(key, value)
}
