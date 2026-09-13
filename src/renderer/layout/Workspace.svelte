<script lang="ts">
import { chordFromEvent, type KeybindingAction, keymap } from '@shared/keybindings'
import { appearance } from '../stores/appearance.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sessions } from '../stores/sessions.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import '../widgets/builtins.ts'
import LayoutNodeView from './LayoutNodeView.svelte'
import PaneDropOverlay from './PaneDropOverlay.svelte'

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

const bindings = $derived(keymap(appearance.settings.keybindings))

/** An action returns false when it does not apply, leaving the key to the focused pane. */
// biome-ignore lint/suspicious/noConfusingVoidType: most actions return nothing
const ACTIONS: Record<KeybindingAction, () => boolean | void> = {
  // Add a pane: brings back any widget that was closed.
  'pane.add': () => ui.openPanePicker(),
  // Split vertically: the new pane sits to the right.
  'pane.splitRight': () => layout.splitFocused('right'),
  // Split horizontally: the new pane sits below.
  'pane.splitDown': () => layout.splitFocused('down'),
  'pane.newTab': () => layout.addTabToFocused(),
  'pane.close': () => layout.closeFocused(),
  'focus.next': () => layout.cycleFocus(1),
  'focus.previous': () => layout.cycleFocus(-1),
  'layout.reset': () => void layout.reset(),
  'launcher.focus': () => focusLauncher(),
  'shell.focus': () => focusShell(),
  // Only in a tab group: elsewhere a shell keeps the keys (PSReadLine selects by word).
  'tab.next': () => layout.cycleTab(1),
  'tab.previous': () => layout.cycleTab(-1),
  'settings.open': () => ui.openSettings(),
  'window.fullscreen': () => window.elecdex.system.toggleFullscreen(),
  // Fullscreen has no window frame and no close button; this is the way out.
  'app.quit': () => window.elecdex.system.quit(),
}

/** Focuses the launcher's search box, or adds a launcher pane first when there is none. */
function focusLauncher(): void {
  const pane = layout.paneWith('launcher')
  if (pane === null) layout.addPane('launcher', 'right')
  else layout.focus(pane)
  ui.focusLauncher()
}

/** Focuses the shell in its selected tab, or adds a shell pane first when there is none. */
function focusShell(): void {
  const pane = layout.shellToFocus()
  if (pane === null) layout.addPane('terminal', 'right')
  else layout.focus(pane)
  ui.focusShell()
}

/** Shortcuts that still work with a dialog open. */
const THROUGH_DIALOGS = new Set<KeybindingAction>(['app.quit', 'window.fullscreen'])

function onKeydown(event: KeyboardEvent): void {
  // While a shortcut is being recorded in the settings, every key goes there.
  if (ui.recordingShortcut) return
  const chord = chordFromEvent(event)
  if (chord === null) return
  const action = bindings.get(chord)
  if (action === undefined) return
  // A dialog over the workspace: nothing behind it should change unseen.
  if (ui.dialogOpen && !THROUGH_DIALOGS.has(action)) return
  if (ACTIONS[action]() === false) return
  claim(event)
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
<PaneDropOverlay />

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
