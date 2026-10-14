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
