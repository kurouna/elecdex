<script lang="ts">
import type { SplitNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import LayoutNodeView from './LayoutNodeView.svelte'

interface Props {
  node: SplitNode
}

const { node }: Props = $props()

const isRow = $derived(node.direction === 'row')

let container = $state<HTMLDivElement | null>(null)

/** Smallest fraction a child may be dragged to, so a pane cannot vanish. */
const MIN_FRACTION = 0.05

/**
 * Dragging a divider moves size between its two neighbours only.
 *
 * Redistributing across every child instead would make a drag feel like it
 * moves panes the user is not touching.
 */
function startDrag(event: PointerEvent, index: number): void {
  const el = container
  if (el === null) return

  event.preventDefault()
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture(event.pointerId)

  const total = isRow ? el.clientWidth : el.clientHeight
  if (total <= 0) return

  const start = isRow ? event.clientX : event.clientY
  const before = node.sizes[index] ?? 0
  const after = node.sizes[index + 1] ?? 0
  const pairTotal = before + after

  const onMove = (move: PointerEvent): void => {
    const delta = ((isRow ? move.clientX : move.clientY) - start) / total
    const nextBefore = Math.min(Math.max(before + delta, MIN_FRACTION), pairTotal - MIN_FRACTION)
    const sizes = [...node.sizes]
    sizes[index] = nextBefore
    sizes[index + 1] = pairTotal - nextBefore
    layout.resize(node.id, sizes)
  }

  const onUp = (): void => {
    handle.releasePointerCapture(event.pointerId)
    handle.removeEventListener('pointermove', onMove)
    handle.removeEventListener('pointerup', onUp)
    handle.removeEventListener('pointercancel', onUp)
  }

  handle.addEventListener('pointermove', onMove)
  handle.addEventListener('pointerup', onUp)
  handle.addEventListener('pointercancel', onUp)
}

/** Keyboard resizing, so a divider is not mouse-only. */
function onHandleKeydown(event: KeyboardEvent, index: number): void {
  const step = event.shiftKey ? 0.05 : 0.01
  const decrease = isRow ? 'ArrowLeft' : 'ArrowUp'
  const increase = isRow ? 'ArrowRight' : 'ArrowDown'
  if (event.key !== decrease && event.key !== increase) return

  event.preventDefault()
  const delta = event.key === increase ? step : -step
  const before = node.sizes[index] ?? 0
  const after = node.sizes[index + 1] ?? 0
  const pairTotal = before + after
  const nextBefore = Math.min(Math.max(before + delta, MIN_FRACTION), pairTotal - MIN_FRACTION)

  const sizes = [...node.sizes]
  sizes[index] = nextBefore
  sizes[index + 1] = pairTotal - nextBefore
  layout.resize(node.id, sizes)
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
  background: var(--accent-faint);
}

/* A thin rule so the divider reads as a seam rather than a gap. */
.handle::after {
  content: '';
  position: absolute;
  background: var(--panel-rule);
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
