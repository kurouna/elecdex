<script lang="ts">
import { paneDrag } from './pane-drag.svelte.ts'

/**
 * What a pane drag would do: the dragged pane's title beside the pointer, and
 * the area it would take if dropped now. Never a hit target itself, so the pane
 * under the pointer is always what is found.
 */
const target = $derived(paneDrag.target)

// Grabbing cursor everywhere for the whole drag, whatever is under the pointer.
$effect(() => {
  if (paneDrag.source === null) return
  document.documentElement.dataset.paneDrag = ''
  return () => delete document.documentElement.dataset.paneDrag
})
</script>

{#if paneDrag.source !== null}
  <div class="drag-layer" data-testid="pane-drag">
    {#if target !== null}
      <div
        class="preview"
        class:as-tab={target.placement === 'tab'}
        style:left="{target.preview.left}px"
        style:top="{target.preview.top}px"
        style:width="{target.preview.width}px"
        style:height="{target.preview.height}px"
        data-testid="pane-drop-preview"
        data-placement={target.placement}
      ></div>
    {/if}
    <div class="label" style:left="{paneDrag.pointer.x}px" style:top="{paneDrag.pointer.y}px">
      {paneDrag.label}
    </div>
  </div>
{/if}

<style>
:global(:root[data-pane-drag]),
:global(:root[data-pane-drag] *) {
  cursor: grabbing !important;
}

.drag-layer {
  position: fixed;
  inset: 0;
  /* Above the panes and the status bar, below dialogs (900). */
  z-index: 100;
  pointer-events: none;
}

.preview {
  position: fixed;
  border: var(--rule-width) solid var(--accent);
  background: var(--accent-faint);
  transition:
    left var(--dur-fast) var(--ease-out),
    top var(--dur-fast) var(--ease-out),
    width var(--dur-fast) var(--ease-out),
    height var(--dur-fast) var(--ease-out);
}

/* A tab joins the group rather than taking part of it: an inset outline, not a fill. */
.preview.as-tab {
  background: transparent;
  outline: var(--rule-width) dashed var(--accent);
  outline-offset: calc(-1 * var(--space-2));
}

.label {
  position: fixed;
  transform: translate(var(--space-3), var(--space-3));
  padding: 1px var(--space-2);
  border: var(--rule-width) solid var(--accent);
  background: var(--app-bg);
  color: var(--accent);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
