<script lang="ts">
import { paneDrag } from './pane-drag.svelte.ts'

/**
 * What a pane drag would do: the dragged pane's title beside the pointer, and
 * the area it would take if dropped now. Never a hit target itself, so the pane
 * under the pointer is always what is found.
 *
 * The area is a faint field with a bracket at each corner, the zoom frame's
 * vocabulary (ZoomFrame.svelte). All five are placed by a transform alone - the
 * field is a box of `FIELD_PX` scaled to the area - so following the pointer
 * from one pane to the next is played by the compositor, with no layout per frame.
 */
const target = $derived(paneDrag.target)

/** The field's own size, which the transform scales to the area. */
const FIELD_PX = 100

const at = (x: number, y: number): string => `translate(${x}px, ${y}px)`

// Grabbing cursor everywhere for the whole drag, whatever is under the pointer.
$effect(() => {
  if (paneDrag.source === null) return
  document.documentElement.dataset.paneDrag = ''
  return () => delete document.documentElement.dataset.paneDrag
})
</script>

{#if paneDrag.source !== null}
  <div class="drag-layer" data-testid="pane-drag">
    <!-- A tab changing places in its own group joins nothing: the outline saying
         which group it would land in has no news, and the caret says it all. -->
    {#if target !== null && !target.reorder}
      {@const box = target.preview}
      {@const right = box.left + box.width}
      {@const bottom = box.top + box.height}
      <div
        class="preview"
        class:as-tab={target.placement === 'tab'}
        style:width="{FIELD_PX}px"
        style:height="{FIELD_PX}px"
        style:transform="{at(box.left, box.top)} scale({box.width / FIELD_PX}, {box.height / FIELD_PX})"
        data-testid="pane-drop-preview"
        data-placement={target.placement}
      ></div>
      <span class="bracket tl" style:transform={at(box.left, box.top)}></span>
      <span class="bracket tr" style:transform={at(right, box.top)}></span>
      <span class="bracket bl" style:transform={at(box.left, bottom)}></span>
      <span class="bracket br" style:transform={at(right, bottom)}></span>
    {/if}
    {#if target?.insertion}
      <div
        class="caret"
        style:left="{target.insertion.caret.left}px"
        style:top="{target.insertion.caret.top}px"
        style:height="{target.insertion.caret.height}px"
        data-testid="tab-drop-caret"
        data-index={target.insertion.index}
      ></div>
    {/if}
    <div class="label" style:left="{paneDrag.pointer.x}px" style:top="{paneDrag.pointer.y}px">
      {paneDrag.label}
      <span class="hint">{paneDrag.hint}</span>
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

.preview,
.bracket {
  position: fixed;
  left: 0;
  top: 0;
  transition: transform var(--dur-fast) var(--ease-out);
}

/* No border of its own: one would be scaled with it. The brackets draw the edge. */
.preview {
  transform-origin: 0 0;
  background: var(--accent-faint);
}

/* A tab joins the group rather than taking part of it: the brackets alone, no field. */
.preview.as-tab {
  background: transparent;
}

.bracket {
  --bracket: 0.9rem;
  width: var(--bracket);
  height: var(--bracket);
  border: 0 solid var(--accent);
}

/* Each set inside its corner, so the four meet the area's edges exactly. */
.bracket.tl {
  border-width: calc(var(--rule-width) * 2) 0 0 calc(var(--rule-width) * 2);
}
.bracket.tr {
  margin-left: calc(-1 * var(--bracket));
  border-width: calc(var(--rule-width) * 2) calc(var(--rule-width) * 2) 0 0;
}
.bracket.bl {
  margin-top: calc(-1 * var(--bracket));
  border-width: 0 0 calc(var(--rule-width) * 2) calc(var(--rule-width) * 2);
}
.bracket.br {
  margin: calc(-1 * var(--bracket)) 0 0 calc(-1 * var(--bracket));
  border-width: 0 calc(var(--rule-width) * 2) calc(var(--rule-width) * 2) 0;
}

/* On the gap between two tabs, skewed with them so it follows their slant. */
.caret {
  position: fixed;
  width: 0;
  border-left: calc(var(--rule-width) * 2) solid var(--accent);
  transform: skewX(var(--tab-skew));
  transition:
    left var(--dur-fast) var(--ease-out),
    top var(--dur-fast) var(--ease-out);
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

.hint {
  margin-left: var(--space-2);
  color: var(--text-muted);
  text-transform: none;
  letter-spacing: 0;
}
</style>
