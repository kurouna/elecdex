<script lang="ts">
import { effectiveBindings, formatChord, type KeybindingAction } from '@shared/keybindings'
import ConfirmButton from './ConfirmButton.svelte'
import { EdgeReveal } from './lib/edge-reveal.svelte.ts'
import { appearance } from './stores/appearance.svelte.ts'
import { windowState } from './stores/window-state.svelte.ts'

/**
 * Window controls for fullscreen, where there is no title bar: minimise, leave
 * fullscreen and quit, slid down from the top-right corner - where a window's
 * own controls sit - when the pointer reaches it.
 *
 * Only the corner calls them up, not the whole top edge: pane titles and the
 * shell's tabs sit just below that edge and are dragged and clicked all the
 * time. Windows and Linux only; macOS will not minimise a fullscreen window and
 * shows its own controls when the pointer reaches the top.
 */

/** How close to the top edge, in CSS pixels, counts as reaching it. */
const EDGE_PX = 8
/** How far in from the right edge the corner reaches when the strip is not yet measured. */
const CORNER_PX = 160

const enabled = $derived(window.elecdex.system.platform !== 'darwin' && windowState.fullscreen)

const reveal = new EdgeReveal((x, y) => {
  if (!enabled || y > EDGE_PX) return false
  const width = reveal.element?.offsetWidth || CORNER_PX
  return x >= window.innerWidth - width
})

windowState.follow()

const bindings = $derived(
  effectiveBindings(appearance.settings.keybindings, window.elecdex.system.platform),
)
/** A tooltip naming the shortcut in effect, which the user may have changed or removed. */
const titled = (label: string, action: KeybindingAction): string => {
  const chord = bindings[action]
  return chord === null ? label : `${label} (${formatChord(chord)})`
}

// Leaving fullscreen puts the native controls back; the strip goes at once.
$effect(() => {
  if (!enabled) reveal.hide()
})
</script>

<svelte:window onpointermove={(event) => reveal.track(event.clientX, event.clientY)} />
<svelte:body onmouseleave={() => reveal.hideSoon()} />

{#if enabled}
  <!-- A short tick in the corner while the controls are away, so they can be found. -->
  <span class="corner-handle" class:away={!reveal.shown} aria-hidden="true"></span>
  <div
    bind:this={reveal.element}
    class="window-corner"
    class:shown={reveal.shown}
    role="toolbar"
    aria-label="Window"
    onfocusin={() => reveal.show()}
    onfocusout={() => reveal.hideSoon()}
    data-testid="window-corner"
    data-shown={reveal.shown}
  >
    <button
      type="button"
      class="control"
      title={titled('Minimize', 'window.minimize')}
      aria-label="Minimize"
      onclick={() => window.elecdex.system.minimize()}
      data-testid="window-minimize"
    >
      <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 5.5h8" /></svg>
    </button>
    <button
      type="button"
      class="control"
      title={titled('Leave fullscreen', 'window.fullscreen')}
      aria-label="Leave fullscreen"
      onclick={() => window.elecdex.system.setFullscreen(false)}
      data-testid="window-leave-fullscreen"
    >
      <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5h5v5h-5z M3.5 3.5v-2h5v5h-2" /></svg>
    </button>
    <ConfirmButton
      label="✕"
      action="exit"
      title={titled('Quit elecdex', 'app.quit')}
      testid="window-quit"
      onconfirm={() => window.elecdex.system.quit()}
    />
  </div>
{/if}

<style>
.window-corner {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: stretch;
  gap: 1px;
  padding: var(--space-1);
  background: var(--app-bg);
  border: 1px solid var(--panel-border);
  border-top: 0;
  border-right: 0;
  box-shadow: 0 6px 18px hsl(0 0% 0% / 0.45);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
  transform: translateY(-100%);
  visibility: hidden;
  transition:
    transform var(--dur-base) var(--ease-out),
    visibility 0s linear var(--dur-base);
}

.window-corner.shown {
  transform: none;
  visibility: visible;
  transition:
    transform var(--dur-base) var(--ease-out),
    visibility 0s;
}

.control {
  display: grid;
  place-items: center;
  width: 2rem;
  padding: 0.15rem 0;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.control:hover,
.control:focus-visible {
  color: var(--accent);
  border-color: var(--accent);
  outline: none;
}

.control svg {
  width: 0.7rem;
  height: 0.7rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
}

.corner-handle {
  position: fixed;
  top: 2px;
  right: 2px;
  z-index: 19;
  width: 2rem;
  height: 2px;
  background: var(--panel-border);
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out);
  pointer-events: none;
}

.corner-handle.away {
  opacity: 0.6;
}
</style>
