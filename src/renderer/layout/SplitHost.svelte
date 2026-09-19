<script lang="ts">
import type { SplitNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import LayoutNodeView from './LayoutNodeView.svelte'
import { sizesWithDelta, startDividerDrag } from './split-drag.ts'

interface Props {
  node: SplitNode
}

const { node }: Props = $props()

const isRow = $derived(node.direction === 'row')

let container = $state<HTMLDivElement | null>(null)

/** The gesture itself is in split-drag.ts, where it can be driven by tests. */
function startDrag(event: PointerEvent, index: number): void {
  const el = container
  if (el === null) return
  startDividerDrag(event, {
    node,
    index,
    row: isRow,
    total: isRow ? el.clientWidth : el.clientHeight,
  })
}

/** Keyboard resizing, so a divider is not mouse-only. */
function onHandleKeydown(event: KeyboardEvent, index: number): void {
  const step = event.shiftKey ? 0.05 : 0.01
  const decrease = isRow ? 'ArrowLeft' : 'ArrowUp'
  const increase = isRow ? 'ArrowRight' : 'ArrowDown'
  if (event.key !== decrease && event.key !== increase) return

  event.preventDefault()
  const delta = event.key === increase ? step : -step
  layout.resize(node.id, sizesWithDelta(node, index, delta))
}
</script>

<div
  class="split"
  class:row={isRow}
  bind:this={container}
  data-testid="split"
  data-node-id={node.id}
  data-direction={node.direction}
>
  {#each node.children as child, index (child.id)}
    <div class="slot" style="flex-basis: {(node.sizes[index] ?? 0) * 100}%">
      <LayoutNodeView node={child} />
    </div>

    {#if index < node.children.length - 1}
      <!-- A focusable separator IS interactive per WAI-ARIA (a window splitter); Svelte classifies
           the separator role as static, so its heuristics are silenced here deliberately. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        class="handle"
        role="separator"
        tabindex="0"
        aria-orientation={isRow ? 'vertical' : 'horizontal'}
        aria-label="Resize panes"
        aria-valuenow={Math.round((node.sizes[index] ?? 0) * 100)}
        aria-valuemin={5}
        aria-valuemax={95}
        data-testid="split-handle"
        onpointerdown={(e) => startDrag(e, index)}
        onkeydown={(e) => onHandleKeydown(e, index)}
      ></div>
    {/if}
  {/each}
</div>

<style>
.split {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  width: 100%;
  gap: 0;
}

.split.row {
  flex-direction: row;
}

.slot {
  display: flex;
  flex-grow: 0;
  flex-shrink: 1;
  min-width: 0;
  min-height: 0;
}

.slot > :global(*) {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.handle {
  flex: 0 0 var(--space-2);
  position: relative;
  background: transparent;
  transition: background var(--dur-fast) var(--ease-out);
}

.split.row > .handle {
  cursor: col-resize;
}

.split:not(.row) > .handle {
  cursor: row-resize;
}

.handle:hover,
.handle:focus-visible {
  background: transparent;
}

/* The seam only appears when the divider is being used: eDEX-UI has no lines
   between modules, and a permanent one doubles up with each module's own rule. */
.handle::after {
  content: '';
  position: absolute;
  background: var(--accent);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.handle:hover::after,
.handle:focus-visible::after {
  opacity: 0.6;
}

.split.row > .handle::after {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
}

.split:not(.row) > .handle::after {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}
</style>
