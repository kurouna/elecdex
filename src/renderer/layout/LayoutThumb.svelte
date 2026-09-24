<script lang="ts">
import { LEFT_COLUMN } from '@shared/default-layout'
import type { ShapeRect } from '@shared/layout-shape'

/**
 * An arrangement in miniature, for the LAYOUTS dialog: a rectangle per place a
 * pane shows, at the window's proportions. The system column is drawn faint -
 * every preset has it - so what tells one layout from another stands out.
 *
 * Plain SVG from rectangles main has already worked out (shared/layout-shape.ts):
 * no canvas, and nothing that lasts beyond the dialog.
 */
interface Props {
  shape: readonly ShapeRect[]
  /** Width in CSS pixels; the height follows at 16:9. */
  width?: number
}

const { shape, width = 48 }: Props = $props()

const W = 160
const H = 90
/** The gap left between neighbours, in viewBox units. */
const GAP = 1.2
const SYSTEM = new Set(LEFT_COLUMN)

const rects = $derived(
  shape.map((rect) => ({
    x: rect.x * W + GAP / 2,
    y: rect.y * H + GAP / 2,
    w: Math.max(rect.w * W - GAP, 0.5),
    h: Math.max(rect.h * H - GAP, 0.5),
    system: SYSTEM.has(rect.widget),
    tabs: rect.tabs,
  })),
)
</script>

<svg
  class="thumb"
  viewBox="0 0 {W} {H}"
  width={width}
  height={(width * H) / W}
  aria-hidden="true"
  data-testid="layout-thumb"
>
  {#each rects as rect, i (i)}
    <rect
      class="place"
      class:system={rect.system}
      x={rect.x}
      y={rect.y}
      width={rect.w}
      height={rect.h}
    />
    {#if rect.tabs > 1}
      <!-- A tab group: a notch per tab along its top edge. -->
      {#each { length: Math.min(rect.tabs, 6) } as _, t (t)}
        <rect class="tab" x={rect.x + 1.5 + t * 7} y={rect.y + 1.2} width="5.5" height="2.2" />
      {/each}
    {/if}
  {/each}
</svg>

<style>
.thumb {
  display: block;
  flex: none;
  background: var(--app-bg);
  border: 1px solid var(--panel-border);
}

.place {
  fill: var(--accent-dim);
  stroke: var(--accent);
  stroke-width: 0.7;
}

.place.system {
  fill: transparent;
  stroke: var(--panel-rule);
}

.tab {
  fill: var(--accent-strong);
}
</style>
