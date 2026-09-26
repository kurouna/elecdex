import { mergePaneState } from '@shared/layout-ops'
import { SvelteMap } from 'svelte/reactivity'
import { isPopupPaneId } from '../layout/popup.ts'
import { layout } from './layout.svelte.ts'

/**
 * Where a widget keeps its own choices (a view, a chosen repository, the
 * calculator's tape): the one way a widget writes them, wherever it is shown.
 *
 * A pane in the layout keeps them in its node, saved with the layout. A widget
 * popped up (layout/popup.ts) has no node, so its choices are kept here, one
 * set per widget, for as long as the app runs: put away and popped up again, it
 * comes back as it was left. They are never saved, as the popup itself is not.
 * The layout store knows nothing of this, and the widget need not know which
 * of the two it is in.
 */
class WidgetStateStore {
  private readonly popups = new SvelteMap<string, Record<string, unknown>>()

  /** A popped-up widget's choices, as a pane's `state` prop. Reactive. */
  popup(paneId: string): Record<string, unknown> | undefined {
    return this.popups.get(paneId)
  }

  /** Merges a change into the pane's state as it is now; undefined removes a key. */
  patch(paneId: string, change: Record<string, unknown>): void {
    if (!isPopupPaneId(paneId)) {
      layout.patchPaneState(paneId, change)
      return
    }
    const next = mergePaneState(this.popups.get(paneId), change)
    if (next !== null) this.popups.set(paneId, next)
  }
}

export const widgetState = new WidgetStateStore()
