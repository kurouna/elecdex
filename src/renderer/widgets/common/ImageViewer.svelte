<script lang="ts">
import type { TransitionConfig } from 'svelte/transition'
import { fitView, panBy, type Size, type View, wheelFactor, zoomAt } from '../../lib/image-view.ts'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * One image filling the diff's body, to be looked at closely: the wheel zooms
 * about the pointer, a drag pans, a double-click goes between the whole picture
 * and its own size, and the keys do the same (+ − 0 1, the arrows, Escape to go
 * back). It opens fitted, and stays fitted as the pane is resized until the
 * user zooms or pans. Another image of the same size (the other side of the
 * change) keeps the view, so the two can be compared at one place.
 */
interface Props {
  src: string
  alt: string
  /** The scale now, for the bar's readout. */
  scale?: number
  onback: () => void
}

let { src, alt, scale = $bindable(1), onback }: Props = $props()

let box = $state.raw<Size>({ w: 0, h: 0 })
let natural = $state.raw<Size | null>(null)
let view = $state.raw<View>({ x: 0, y: 0, scale: 1 })
/** Whether the view is still the fitted one, which follows the pane's size. */
let fitted = true
let area = $state<HTMLDivElement | null>(null)
let drag: { id: number; x: number; y: number } | null = null
let dragging = $state(false)

$effect(() => {
  scale = view.scale
})

// Opened by a click on the picture: the keys work at once, and Escape goes back.
$effect(() => {
  area?.focus({ preventScroll: true })
})

// The size comes from the observer's own rectangle, never from measuring inside it (CLAUDE.md).
$effect(() => {
  const el = area
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const rect = entries[0]?.contentRect
    if (rect === undefined) return
    box = { w: rect.width, h: rect.height }
    if (fitted && natural !== null) view = fitView(natural, box)
  })
  observer.observe(el)
  return () => observer.disconnect()
})

// The wheel has to be taken from the page's scrolling, which a passive listener cannot do.
$effect(() => {
  const el = area
  if (el === null) return
  const onwheel = (event: WheelEvent): void => {
    event.preventDefault()
    zoom(wheelFactor(event.deltaY, event.deltaMode), pointerIn(event))
  }
  el.addEventListener('wheel', onwheel, { passive: false })
  return () => el.removeEventListener('wheel', onwheel)
})

function loaded(event: Event): void {
  const img = event.currentTarget as HTMLImageElement
  const next = { w: img.naturalWidth, h: img.naturalHeight }
  const same = natural !== null && natural.w === next.w && natural.h === next.h
  natural = next
  if (!same || fitted) showWhole()
}

const pointerIn = (event: MouseEvent): { x: number; y: number } => {
  const rect = (area as HTMLDivElement).getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const middle = (): { x: number; y: number } => ({ x: box.w / 2, y: box.h / 2 })

export function showWhole(): void {
  if (natural === null) return
  fitted = true
  view = fitView(natural, box)
}

export function showActual(at = middle()): void {
  if (natural === null) return
  fitted = false
  view = zoomAt(view, 1 / view.scale, at, natural, box)
}

export function zoom(factor: number, at = middle()): void {
  if (natural === null) return
  fitted = false
  view = zoomAt(view, factor, at, natural, box)
}

function pan(dx: number, dy: number): void {
  if (natural === null) return
  fitted = false
  view = panBy(view, dx, dy, natural, box)
}

function down(event: PointerEvent): void {
  if (event.button !== 0) return
  area?.setPointerCapture(event.pointerId)
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
  dragging = true
}

function move(event: PointerEvent): void {
  if (drag === null || drag.id !== event.pointerId) return
  pan(event.clientX - drag.x, event.clientY - drag.y)
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
}

function up(event: PointerEvent): void {
  if (drag?.id !== event.pointerId) return
  drag = null
  dragging = false
}

function toggle(event: MouseEvent): void {
  if (natural === null) return
  if (Math.abs(view.scale - fitView(natural, box).scale) < 1e-3) showActual(pointerIn(event))
  else showWhole()
}

const STEP = 40

function key(event: KeyboardEvent): void {
  const actions: Record<string, () => void> = {
    '+': () => zoom(1.25),
    '=': () => zoom(1.25),
    '-': () => zoom(0.8),
    0: () => showWhole(),
    1: () => showActual(),
    ArrowLeft: () => pan(STEP, 0),
    ArrowRight: () => pan(-STEP, 0),
    ArrowUp: () => pan(0, STEP),
    ArrowDown: () => pan(0, -STEP),
    Escape: () => onback(),
  }
  const action = event.ctrlKey || event.altKey || event.metaKey ? undefined : actions[event.key]
  if (action === undefined) return
  event.preventDefault()
  event.stopPropagation()
  action()
}

/** Comes out of where it was, a little smaller and faint: transform and opacity only. */
function open(_node: Element): TransitionConfig {
  if (appearance.reducedMotion) return { duration: 0 }
  return {
    duration: 180,
    easing: (t) => 1 - (1 - t) ** 3,
    css: (t) => `opacity: ${t}; transform: scale(${0.96 + 0.04 * t})`,
  }
}
</script>

<!-- A surface the pointer and the keys move the picture on: it takes both on purpose. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
<div
  class="viewer"
  class:dragging
  bind:this={area}
  tabindex="0"
  role="application"
  aria-label="{alt}. Wheel or + and - to zoom, drag or the arrows to move, 0 to fit, Escape to go back."
  data-testid="image-viewer"
  data-scale={view.scale.toFixed(3)}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  ondblclick={toggle}
  onkeydown={key}
  in:open
>
  <img
    {src}
    alt=""
    draggable="false"
    class:pixels={view.scale >= 2}
    style:width="{natural?.w ?? 0}px"
    style:height="{natural?.h ?? 0}px"
    style:transform="translate({view.x}px, {view.y}px) scale({view.scale})"
    style:visibility={natural === null ? 'hidden' : 'visible'}
    onload={loaded}
  />
</div>

<style>
/*
 * The checkerboard fills the viewer, so a transparent part reads as one at any
 * zoom; the image is placed by a transform from its top-left corner.
 */
.viewer {
  position: relative;
  overflow: hidden;
  height: 100%;
  min-height: 8rem;
  outline: none;
  cursor: grab;
  touch-action: none;
  user-select: none;
  background:
    repeating-conic-gradient(
      color-mix(in srgb, var(--text-muted) 18%, transparent) 0 25%,
      transparent 0 50%
    )
    0 0 / 16px 16px;
}

.viewer:focus-visible {
  box-shadow: inset 0 0 0 1px var(--accent);
}

.viewer.dragging {
  cursor: grabbing;
}

img {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  transform-origin: 0 0;
  pointer-events: none;
}

/* Magnified past twice its size, a pixel is drawn as a square: that is what one looks at it for. */
img.pixels {
  image-rendering: pixelated;
}
</style>
