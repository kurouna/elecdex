<script lang="ts">
/**
 * A handle between two parts of a widget that moves the line between them:
 * dragged, or with the arrow keys once focused; a double-click puts it back.
 *
 * It reports a share of `within` (the element the two parts divide), 0 to 1,
 * from the left or from the top. While dragging it calls `onmove` only, so the
 * widget redraws without saving; `ondone` comes once, when the pointer lets go,
 * so a widget that keeps the share in pane state writes the layout once per
 * drag, not once per pixel.
 */
interface Props {
  axis: 'x' | 'y'
  /** The share now, 0 to 1. */
  value: number
  min: number
  max: number
  /** Where a double-click puts it. */
  reset: number
  label: string
  within: () => HTMLElement | null
  onmove: (share: number) => void
  ondone: (share: number) => void
  testid?: string
  /**
   * Which edge of its parent it sits on, across: the right (`end`, the default) or
   * the left (`start`) - for a handle that must live in the part after the line,
   * because the part before it scrolls and would cut it off.
   */
  edge?: 'start' | 'end'
}

const {
  axis,
  value,
  min,
  max,
  reset,
  label,
  within,
  onmove,
  ondone,
  testid,
  edge = 'end',
}: Props = $props()

let dragging = $state(false)

const clamp = (share: number): number => Math.min(max, Math.max(min, share))

function shareAt(event: PointerEvent): number | null {
  const box = within()?.getBoundingClientRect()
  if (box === undefined || box.width === 0 || box.height === 0) return null
  return clamp(
    axis === 'x' ? (event.clientX - box.left) / box.width : (event.clientY - box.top) / box.height,
  )
}

function down(event: PointerEvent): void {
  if (event.button !== 0) return
  event.preventDefault()
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture(event.pointerId)
  dragging = true
  let last = value
  const move = (e: PointerEvent) => {
    const share = shareAt(e)
    if (share === null) return
    last = share
    onmove(share)
  }
  const up = () => {
    dragging = false
    handle.removeEventListener('pointermove', move)
    handle.removeEventListener('pointerup', up)
    handle.removeEventListener('pointercancel', up)
    ondone(last)
  }
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', up)
  handle.addEventListener('pointercancel', up)
}

function key(event: KeyboardEvent): void {
  const back = axis === 'x' ? 'ArrowLeft' : 'ArrowUp'
  const on = axis === 'x' ? 'ArrowRight' : 'ArrowDown'
  if (event.key !== back && event.key !== on) return
  event.preventDefault()
  ondone(clamp(value + (event.key === on ? 0.02 : -0.02)))
}
</script>

<!-- A focusable separator is the ARIA window-splitter pattern, which the checker does not know (as SplitHost). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="splitter {axis}"
  class:start={edge === 'start'}
  class:dragging
  role="separator"
  tabindex="0"
  aria-label={label}
  aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
  aria-valuenow={Math.round(value * 100)}
  aria-valuemin={Math.round(min * 100)}
  aria-valuemax={Math.round(max * 100)}
  title={`${label} - drag, or double-click for the default`}
  data-testid={testid}
  onpointerdown={down}
  onkeydown={key}
  ondblclick={() => ondone(reset)}
></div>

<style>
/* A thin band to grab, drawn only as a rule when it is found or used. */
.splitter {
  position: absolute;
  z-index: 2;
  touch-action: none;
}

.splitter.x {
  top: 0;
  right: -4px;
  bottom: 0;
  width: 7px;
  cursor: col-resize;
}

.splitter.x.start {
  right: auto;
  left: -4px;
}

.splitter.y {
  top: -4px;
  right: 0;
  left: 0;
  height: 7px;
  cursor: row-resize;
}

.splitter::after {
  content: '';
  position: absolute;
  background: transparent;
}

.splitter.x::after {
  top: 0;
  bottom: 0;
  left: 3px;
  width: 1px;
}

.splitter.y::after {
  top: 3px;
  right: 0;
  left: 0;
  height: 1px;
}

.splitter:hover::after,
.splitter:focus-visible::after,
.splitter.dragging::after {
  background: var(--accent);
}

.splitter:focus-visible {
  outline: none;
}
</style>
