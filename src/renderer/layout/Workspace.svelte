<script lang="ts">
import {
  chordFromEvent,
  KEYBINDING_ACTIONS,
  type KeybindingAction,
  keymap,
} from '@shared/keybindings'
import { WEB_WIDGET_PREFIX } from '@shared/web'
import { appearance } from '../stores/appearance.svelte.ts'
import { boot } from '../stores/boot.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sessions } from '../stores/sessions.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import '../widgets/builtins.ts'
import { backdropShade } from '../lib/crt-transitions.ts'
import LayoutNodeView from './LayoutNodeView.svelte'
import PaneDropOverlay from './PaneDropOverlay.svelte'
import { frameOfPane, measureFrames } from './pane-close.ts'
import { goToPreset } from './presets.ts'
import { sessionsToReap } from './reap.ts'

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
/** The workspace element, which a pane brought forward is placed inside. */
let workspace = $state<HTMLDivElement | null>(null)

$effect(() => {
  void layout.load()
  // The names only: the trees stay in main. Read at startup because the
  // shortcuts for the first slots work without the dialog ever being opened.
  void layout.loadSaved()
})

// Closing animates only in a workspace that is on screen and moving: never with
// motion reduced, nor while the boot reveal is still powering panes on.
$effect(() => {
  layout.closeMotion = {
    animates: () => !appearance.reducedMotion && boot.phase === 'done',
    frames: () => measureFrames(),
  }
  // A close still powering off then just ends, with nothing to measure.
  return () => {
    layout.closeMotion = null
  }
})

// Bringing a pane forward measures the workspace it is pinned over, and the
// place the pane came out of, which is where it flies from and back to.
$effect(() => {
  layout.zoomMotion = {
    animates: () => !appearance.reducedMotion && boot.phase === 'done',
    area: () => {
      const box = workspace?.getBoundingClientRect()
      if (box === undefined) return null
      const { top, right, bottom, left } = box
      return { top, right, bottom, left }
    },
    frameOf: (paneId) => frameOfPane(paneId),
  }
  return () => {
    layout.zoomMotion = null
  }
})

// Re-arm the reaper whenever the set of panes changes.
$effect(() => {
  // Touch the dependency explicitly so the effect re-runs on layout changes.
  void layout.panes.length

  armReaper()

  return () => {
    if (reapTimer !== null) clearTimeout(reapTimer)
    reapTimer = null
  }
})

function armReaper(): void {
  if (reapTimer !== null) clearTimeout(reapTimer)
  reapTimer = setTimeout(() => {
    reapTimer = null
    void reapOrphanSessions()
  }, REAP_DELAY_MS)
}

async function reapOrphanSessions(): Promise<void> {
  if (!layout.loaded) return

  // Forget store entries for panes that are gone, so the store does not grow.
  const paneIds = new Set(layout.panes.map((p) => p.id))
  sessions.retainOnly(paneIds)

  // Web pages whose pane is gone, closed while this page was away (a reload).
  for (const paneId of await window.elecdex.web.list()) {
    if (!paneIds.has(paneId)) window.elecdex.web.close(paneId, null)
  }

  const alive = await window.elecdex.pty.list()
  // The claims are taken after the list, not before it: a pane that created its
  // shell while the list was on its way has recorded it by now, or is about to -
  // which is what `sessionsToReap` waits for.
  const { reap, later } = sessionsToReap(alive, claimedSessions(), Date.now(), REAP_DELAY_MS)
  for (const id of reap) await window.elecdex.pty.dispose(id)
  // A shell too new to judge is looked at again, even if the panes do not change.
  if (later && reapTimer === null) armReaper()
}

/**
 * The shells the panes claim. Claims come only from panes that still exist in
 * the layout. Consulting the session store as a whole would be wrong: a closed
 * pane's entry lingers there, so its shell would count as claimed forever and
 * never be reaped.
 */
function claimedSessions(): Set<string> {
  const claimed = new Set<string>()
  for (const node of layout.panes) {
    // The live adoption, and the id recorded in layout state - the latter covers
    // a pane that restored its session but has not re-adopted it yet.
    const live = sessions.get(node.id).sessionId
    if (live !== null) claimed.add(live)
    const recorded = node.state?.sessionId
    if (typeof recorded === 'string') claimed.add(recorded)
  }
  return claimed
}

/** Takes a shortcut away from whatever is focused, including a terminal. */
function claim(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

const bindings = $derived(keymap(appearance.settings.keybindings, window.elecdex.system.platform))

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
  // Brings the focused pane forward, or puts back the pane that is forward. A
  // widget that is not brought forward leaves the keys to the pane, as a pane
  // outside a tab group leaves the tab keys to the shell.
  'pane.zoom': () => {
    const target = layout.zoomedPaneId ?? layout.focusedPaneId
    if (target === null || layout.zoomModeFor(target) === null) return false
    layout.toggleZoom(target)
  },
  'focus.next': () => layout.cycleFocus(1),
  'focus.previous': () => layout.cycleFocus(-1),
  'layout.reset': () => void layout.reset(),
  'layout.saved': () => ui.openLayouts(),
  // A slot with nothing saved in it leaves the keys to the focused pane.
  'layout.saved1': () => applySavedSlot(0),
  'layout.saved2': () => applySavedSlot(1),
  'layout.saved3': () => applySavedSlot(2),
  'layout.saved4': () => applySavedSlot(3),
  'layout.saved5': () => applySavedSlot(4),
  'layout.saved6': () => applySavedSlot(5),
  'layout.saved7': () => applySavedSlot(6),
  'layout.saved8': () => applySavedSlot(7),
  'layout.saved9': () => applySavedSlot(8),
  // The presets' keys: the layout made from each, or a new one (layout/presets.ts).
  'layout.preset.standard': () => void goToPreset('standard'),
  'layout.preset.network': () => void goToPreset('network'),
  'layout.preset.earth': () => void goToPreset('earth'),
  'layout.preset.dev': () => void goToPreset('dev'),
  'layout.preset.media': () => void goToPreset('media'),
  'layout.preset.desk': () => void goToPreset('desk'),
  'launcher.focus': () => focusLauncher(),
  'shell.focus': () => focusShell(),
  // Searches the shell that has the keyboard, or the one the keys would go to.
  'shell.find': () => findInShell(),
  // Only in a tab group: elsewhere a shell keeps the keys (PSReadLine selects by word).
  'tab.next': () => layout.cycleTab(1),
  'tab.previous': () => layout.cycleTab(-1),
  // Only from a shell, and only when there is another shell pane to go to.
  'shell.next': () => cycleShell(1),
  'shell.previous': () => cycleShell(-1),
  'settings.open': () => ui.openSettings(),
  'window.fullscreen': () => window.elecdex.system.toggleFullscreen(),
  'window.minimize': () => window.elecdex.system.minimize(),
  // Fullscreen has no window frame and no close button; this is the way out.
  'app.quit': () => window.elecdex.system.quit(),
  // System-wide: main registers it with the OS, so the page never receives it.
  'window.toggle': () => false,
}

/**
 * Focuses the launcher's search box: the launcher pane's, or with none in the
 * layout, one popped up over it (layout/popup.ts) - starting an application
 * should not rearrange the screen. Pressed again over it, the box takes the
 * keyboard again.
 */
function focusLauncher(): void {
  const pane = layout.paneWith('launcher')
  if (pane === null) ui.openPopup('launcher')
  else {
    // Another widget popped up goes, as it would for the launcher's.
    ui.closePopup()
    layout.focus(pane)
  }
  ui.focusLauncher()
}

/** Focuses the shell in its selected tab, or adds a shell pane first when there is none. */
function focusShell(): void {
  const pane = layout.shellToFocus()
  if (pane === null) layout.addPane('terminal', 'right')
  else layout.focus(pane)
  ui.focusShell()
}

/**
 * Applies the saved layout in a slot; false when nothing is saved there, so the
 * keys go to the focused pane instead.
 */
function applySavedSlot(index: number): boolean {
  const entry = layout.savedLayouts[index]
  if (entry === undefined) return false
  void layout.switchTo(entry.id)
  return true
}

/**
 * Opens the search bar of the shell that has the keyboard, or of the shell the
 * keys would go to when another widget is focused. With no shell pane at all it
 * does nothing: unlike `shell.focus`, a search over a shell that had to be
 * created first would have nothing to find.
 */
function findInShell(): boolean {
  const focused = layout.panes.find((p) => p.id === layout.focusedPaneId)
  if (focused?.widget !== 'terminal') {
    const pane = layout.shellToFocus()
    if (pane === null) return false
    layout.focus(pane)
  }
  ui.findInShell()
  return true
}

/** Moves to the next or previous shell pane and puts the keyboard in its terminal. */
function cycleShell(delta: number): boolean {
  if (!layout.cycleShell(delta)) return false
  ui.focusShell()
  return true
}

/** Shortcuts that still work with a dialog open. */
const THROUGH_DIALOGS = new Set<KeybindingAction>(['app.quit', 'window.fullscreen'])
/**
 * And those that also work over a pane popped up, which is a dialog of its own:
 * the launcher's, which calls up the launcher in its place. A popup is only ever
 * up alone (ui.svelte.ts), so no other dialog is let through by this.
 */
const THROUGH_POPUP = new Set<KeybindingAction>(['launcher.focus'])

/** Runs a shortcut's action; false when it did not apply. */
function run(action: KeybindingAction): boolean {
  // A dialog over the workspace: nothing behind it should change unseen.
  if (ui.dialogOpen && !throughDialog(action)) return false
  return ACTIONS[action]() !== false
}

const throughDialog = (action: KeybindingAction): boolean =>
  THROUGH_DIALOGS.has(action) || (ui.popup !== null && THROUGH_POPUP.has(action))

function onKeydown(event: KeyboardEvent): void {
  // While a shortcut is being recorded in the settings, every key goes there.
  if (ui.recordingShortcut) return
  // Escape puts a pane that is forward back, as it closes a dialog. Not a
  // binding: a chord must hold Ctrl or Alt (keybindings.ts), so Escape cannot be
  // one, and a dialog over the workspace has the key first.
  if (event.key === 'Escape' && layout.zoomedPaneId !== null && !ui.dialogOpen) {
    layout.unzoom()
    claim(event)
    return
  }
  const chord = chordFromEvent(event)
  if (chord === null) return
  const action = bindings.get(chord)
  if (action !== undefined && run(action)) claim(event)
}

const isAction = (id: string): id is KeybindingAction => KEYBINDING_ACTIONS.some((a) => a.id === id)

// A web pane's page has the keyboard: main takes the shortcuts from it and sends them here.
// Unless the action left a web pane focused (which then keeps or takes the keyboard),
// the keyboard comes back to the workspace, where the action put the focus.
$effect(() =>
  window.elecdex.web.onShortcut((action) => {
    if (!isAction(action)) return
    run(action)
    const focused = layout.panes.find((p) => p.id === layout.focusedPaneId)
    if (ui.dialogOpen || !focused?.widget.startsWith(WEB_WIDGET_PREFIX)) {
      window.elecdex.web.focusWorkspace()
    }
  }),
)
$effect(() => window.elecdex.web.onFocused((paneId) => layout.focus(paneId)))

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
<svelte:window
  onkeydowncapture={onKeydown}
  onbeforeunload={onBeforeUnload}
  onresize={() => layout.repin()}
/>

<div
  class="workspace"
  bind:this={workspace}
  data-testid="workspace"
  data-loaded={layout.loaded}
  data-switching={layout.switching}
>
  {#if layout.loaded}
    <LayoutNodeView node={layout.tree.root} />
  {/if}
</div>
{#if layout.zoomedPaneId !== null}
  <!-- The shade behind the pane that is forward: clicking it puts the pane back,
       as clicking a dialog's backdrop closes the dialog. The keyboard path is
       Escape, handled above, and the shortcut. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="zoom-backdrop"
    transition:backdropShade
    onpointerdown={(e) => e.target === e.currentTarget && layout.unzoom()}
    data-testid="zoom-backdrop"
  ></div>
{/if}
<PaneDropOverlay />

<style>
.workspace {
  display: flex;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

/*
 * Behind the pane brought forward and above every other pane, so a press lands
 * here and puts the pane back rather than reaching what is underneath.
 */
.zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgb(0 0 0 / 0.45);
}

.workspace > :global(*) {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
