<script lang="ts">
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'
import { popupPaneId } from './popup.ts'
import { holdWidgetMetrics } from './widget-metrics.svelte.ts'

/**
 * A pane popped up over the workspace (layout/popup.ts): the widget in `ui.popup`,
 * framed like a dialog with only a ×. It is not in the layout tree, so it has
 * no corner zoom, no drag handle and no tabs; closing it - ×, Escape, the
 * backdrop, or the widget saying it is done - leaves the layout as it was.
 *
 * The widget gets the props a pane would, with a pane id of its own, and is
 * always the visible, active one while it is up.
 */

const widget = $derived(ui.popup)
const definition = $derived(widget === null ? null : resolveWidget(widget))
const paneId = $derived(widget === null ? null : popupPaneId(widget))
const meta = $derived(paneId === null ? null : paneMeta.get(paneId))
const title = $derived(meta?.title ?? definition?.title ?? widget ?? '')

holdWidgetMetrics(
  () => definition,
  () => widget !== null,
)

// Where the keyboard was, given back when the popup goes (as the picker does):
// to the shell the shortcut was pressed in, say. A dialog opening in its place
// takes the keyboard after this, as it does from the picker.
$effect(() => {
  if (widget === null) return
  const back = document.activeElement instanceof HTMLElement ? document.activeElement : null
  return () => back?.focus()
})

// The keyboard goes into the popup, as into any dialog: to its first text field
// (the launcher's search), or else to the frame, so that nothing behind it keeps
// the keys. After the widget's own request for it (the launcher's shortcut puts
// the cursor in its search with the query selected), which is left as it is.
let frame = $state<HTMLElement | null>(null)
$effect(() => {
  const at = frame
  if (at === null) return
  void widget
  const timer = setTimeout(() => {
    if (at.contains(document.activeElement)) return
    const field = at.querySelector<HTMLElement>(
      'input:not([type]), input[type=text], input[type=search], textarea',
    )
    ;(field ?? at).focus()
  })
  return () => clearTimeout(timer)
})

// What the widget published about itself goes with it, as a closed pane's does.
$effect(() => {
  const id = paneId
  if (id === null) return
  return () => paneMeta.clear(id)
})

function onKeydown(event: KeyboardEvent): void {
  if (widget === null || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  ui.closePopup()
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if widget !== null && definition !== null && paneId !== null}
  {@const Widget = definition.component}
  <!-- The backdrop closes on click; the keyboard path is Escape, handled above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" transition:backdropShade onpointerdown={(e) => e.target === e.currentTarget && ui.closePopup()}>
    <div
      bind:this={frame}
      class="popup crt-on"
      tabindex="-1"
      style:--crt-delay={dialogDelay()}
      transition:crtPower
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="popup-pane"
      data-widget={widget}
    >
      <header class="hud-label head">
        <span class="title">{title}</span>
        <span class="sub" title={meta?.subtitle ?? ''}>{meta?.subtitle ?? ''}</span>
        <span class="hint">esc close</span>
        <button
          type="button"
          class="close"
          aria-label={`close ${title}`}
          title="Close (Esc)"
          onclick={() => ui.closePopup()}
          data-testid="popup-close">×</button
        >
      </header>
      <div class="shell-frame body">
        {#key widget}
          <Widget
            {paneId}
            title={definition.title}
            props={undefined}
            state={undefined}
            active={true}
            visible={true}
            transitioning={false}
            {widget}
            ondone={() => ui.closePopup()}
          />
        {/key}
      </div>
    </div>
  </div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.popup {
  --crt-duration: 380ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(52rem, 92vw);
  height: min(36rem, 80vh);
  background: var(--app-bg);
}

/* Holding the keyboard only so that nothing behind it does: no ring. */
.popup:focus {
  outline: none;
}

.head {
  align-items: center;
}

.title {
  flex: none;
}

.sub {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  text-transform: none;
}

.hint {
  flex: none;
  color: var(--text-muted);
}

.close {
  flex: none;
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  padding: 0;
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--1);
  line-height: 1;
  cursor: pointer;
}

.close:hover,
.close:focus-visible {
  color: var(--text-inverse);
  background: var(--danger);
  border-color: var(--danger);
}

.body {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: var(--space-2);
}
</style>
