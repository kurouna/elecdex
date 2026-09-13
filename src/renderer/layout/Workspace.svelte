<script lang="ts">
import { layout } from '../stores/layout.svelte.ts'
import { sessions } from '../stores/sessions.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import '../widgets/builtins.ts'
import LayoutNodeView from './LayoutNodeView.svelte'

/**
 * Renders the workspace and owns the layout-level keyboard shortcuts.
 *
 * Also reaps orphaned terminal sessions: unmounting a pane deliberately leaves
 * its shell running so a reload or a move cannot lose work, which means
 * something has to clean up the ones no pane claims any more. Doing it here,
 * after the layout has settled, keeps that policy in one place.
 */

/** How long after a layout change before unclaimed sessions are killed. */
const REAP_DELAY_MS = 4000

let reapTimer: ReturnType<typeof setTimeout> | null = null

$effect(() => {
  void layout.load()
})

// Re-arm the reaper whenever the set of panes changes.
$effect(() => {
  // Touch the dependency explicitly so the effect re-runs on layout changes.
  void layout.panes.length

  if (reapTimer !== null) clearTimeout(reapTimer)
  reapTimer = setTimeout(() => {
    reapTimer = null
    void reapOrphanSessions()
  }, REAP_DELAY_MS)

  return () => {
    if (reapTimer !== null) clearTimeout(reapTimer)
    reapTimer = null
  }
})

async function reapOrphanSessions(): Promise<void> {
  if (!layout.loaded) return

  // Claims come only from panes that still exist in the layout. Consulting the
  // session store as a whole would be wrong: a closed pane's entry lingers there,
  // so its shell would count as claimed forever and never be reaped.
  const claimed = new Set<string>()
  for (const node of layout.panes) {
    // The live adoption, and the id recorded in layout state - the latter covers
    // a pane that restored its session but has not re-adopted it yet.
    const live = sessions.get(node.id).sessionId
    if (live !== null) claimed.add(live)
    const recorded = node.state?.sessionId
    if (typeof recorded === 'string') claimed.add(recorded)
  }

  // Forget store entries for panes that are gone, so the store does not grow.
  sessions.retainOnly(new Set(layout.panes.map((p) => p.id)))

  const alive = await window.elecdex.pty.list()
  for (const session of alive) {
    if (!claimed.has(session.id)) await window.elecdex.pty.dispose(session.id)
  }
}

/** Takes a shortcut away from whatever is focused, including a terminal. */
function claim(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.code === 'F11' && !event.ctrlKey && !event.altKey && !event.metaKey) {
    claim(event)
    window.elecdex.system.toggleFullscreen()
    return
  }

  const mod = event.ctrlKey || event.metaKey
  if (!mod || !event.shiftKey) return

  switch (event.code) {
    case 'KeyA':
      // Add a pane: brings back any widget that was closed.
      claim(event)
      ui.openPanePicker()
      return
    case 'KeyQ':
      // Fullscreen has no window frame and no close button; this is the way out.
      claim(event)
      window.elecdex.system.quit()
      return
    case 'KeyT':
      claim(event)
      layout.addTabToFocused()
      return
    case 'KeyW':
      claim(event)
      layout.closeFocused()
      return
    case 'KeyE':
      // Split vertically: the new pane sits to the right.
      claim(event)
      layout.splitFocused('right')
      return
    case 'KeyO':
      // Split horizontally: the new pane sits below.
      claim(event)
      layout.splitFocused('down')
      return
    case 'BracketRight':
      claim(event)
      layout.cycleFocus(1)
      return
    case 'BracketLeft':
      claim(event)
      layout.cycleFocus(-1)
      return
    case 'Backspace':
      claim(event)
      void layout.reset()
      return
    default:
      return
  }
}

// A pending debounced save would be lost if the window went away first.
function onBeforeUnload(): void {
  if (layout.loaded) void layout.flush()
}
</script>

<!--
  Capture phase on purpose: xterm consumes keys like Backspace in its own keydown
  handler and stops propagation, so a bubbling listener never sees them. App-level
  shortcuts must be taken before the focused terminal gets the event.
-->
<svelte:window onkeydowncapture={onKeydown} onbeforeunload={onBeforeUnload} />

<div class="workspace" data-testid="workspace" data-loaded={layout.loaded}>
  {#if layout.loaded}
    <LayoutNodeView node={layout.tree.root} />
  {/if}
</div>

<style>
.workspace {
  display: flex;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.workspace > :global(*) {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
