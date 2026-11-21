<script lang="ts">
import type { Rgb } from '@shared/qr'
import { untrack } from 'svelte'
import { colourReader } from '../../../../lib/css-colour.ts'
import { formatClock } from '../../../../lib/format.ts'
import { onFrame } from '../../../../lib/frame-loop.ts'
import { appearance } from '../../../../stores/appearance.svelte.ts'
import type { ClockFaceProps } from '../../types.ts'
import { karmanText } from './layout.ts'
import { maskFromAlpha, paintSmoke, Tunnel, tunnelGrid } from './solver.ts'

/**
 * KARMAN: the pane is a wind tunnel and HH:MM:SS stands in it. Wind and streaks of smoke
 * enter at the left, part round the digits and shed a Kármán vortex street behind them; as a
 * second changes, the obstacle changes shape and the wake rearranges. The flow is solved for
 * real (solver.ts, Stable Fluids) on a coarse grid and painted at the grid's size into a plain
 * 2D canvas that CSS stretches over the pane; the digits are drawn crisp on top for reading.
 *
 * The cost is the point of the face and is kept to the shared 10 fps loop: one or two steps a
 * frame, only while the pane is seen, nothing at all behind a tab or in a minimised window.
 * With motion reduced the smoke moves only as the second changes, a few steps at once, and
 * otherwise stands still.
 */
const { now, zone, visible }: ClockFaceProps = $props()

/** Each step advances the flow this far; the steps per frame follow the grid's size. */
const DT = 0.6
/** Steps run before a new tunnel is first painted, so the flow has met the digits. */
const WARM_UP = 20
/** Steps run as the second changes with motion reduced. */
const STILL_STEPS = 4
/** A grid larger than this takes one step a frame instead of two. */
const BIG_GRID = 8000

let box = $state<HTMLDivElement | null>(null)
let canvas = $state<HTMLCanvasElement | null>(null)
let width = $state(0)
let height = $state(0)

const parts = $derived(formatClock(now))
const text = $derived(`${parts.hh}:${parts.mm}:${parts.ss}`)
const place = $derived(karmanText(width, height))
const grid = $derived(tunnelGrid(width, height))
// The grid's size apart, as numbers: a resize of a pixel or two that leaves the grid as it was
// must not make a new tunnel and lose the flow.
const gridW = $derived(grid.W)
const gridH = $derived(grid.H)
const sized = $derived(width > 0 && height > 0)

/** The theme as the canvas paints it: read once, and again when the theme changes. */
let dye = $state.raw<Rgb>([128, 200, 210])
let font = $state('sans-serif')

// The tunnel and what paints it are plain variables: the simulation changes them every frame
// and nothing in the page should react to that. `tunnelId` says a new one was made.
let tunnel: Tunnel | null = null
let image: ImageData | null = null
let mask: CanvasRenderingContext2D | null = null
let tunnelId = $state(0)

$effect(() => {
  const el = box
  if (el === null) return
  const observer = new ResizeObserver(([entry]) => {
    if (entry === undefined) return
    const w = Math.round(entry.contentRect.width)
    const h = Math.round(entry.contentRect.height)
    if (w !== width) width = w
    if (h !== height) height = h
  })
  observer.observe(el)
  return () => observer.disconnect()
})

$effect(() => {
  void appearance.revision
  const el = box
  if (el === null) return
  dye = colourReader(el)('var(--accent)', [128, 200, 210])
  font = getComputedStyle(el).getPropertyValue('--font-ui').trim() || 'sans-serif'
})

function paint(): void {
  const ctx = canvas?.getContext('2d')
  if (!ctx || tunnel === null || image === null) return
  paintSmoke(tunnel, image.data, dye)
  ctx.putImageData(image, 0, 0)
}

/** The digits as the wind meets them: drawn at the grid's size and taken where they cover a cell. */
function setObstacle(): void {
  if (tunnel === null || mask === null || place.fs <= 0) return
  const { W, H } = tunnel
  // Drawn in the pane's pixels and scaled to the grid's cells, which are not quite square once
  // the pane's size is rounded to whole cells.
  mask.setTransform(1, 0, 0, 1, 0, 0)
  mask.clearRect(0, 0, W, H)
  mask.setTransform(W / width, 0, 0, H / height, 0, 0)
  mask.fillStyle = '#000'
  mask.font = `600 ${place.fs}px ${font}`
  mask.fillText(text, place.x, place.y)
  tunnel.setSolid(maskFromAlpha(mask.getImageData(0, 0, W, H).data, W, H))
}

// A new grid is a new tunnel: a pane resized past a cell's width or a different kind of pane.
$effect(() => {
  const el = canvas
  const W = gridW
  const H = gridH
  if (el === null || !sized) return
  el.width = W
  el.height = H
  tunnel = new Tunnel(W, H)
  image = new ImageData(W, H)
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = W
  maskCanvas.height = H
  mask = maskCanvas.getContext('2d', { willReadFrequently: true })
  // Read untracked: this effect must not depend on what it writes.
  tunnelId = untrack(() => tunnelId) + 1
})

// The obstacle follows the second (and the font, once it has loaded, and the layout). With
// motion reduced this is also the only time the smoke moves.
$effect(() => {
  void text
  void place
  void font
  const id = tunnelId
  if (id === 0 || tunnel === null) return
  setObstacle()
  if (tunnel.elapsed === 0) {
    for (let n = 0; n < WARM_UP; n++) tunnel.step(DT)
  } else if (appearance.reducedMotion && visible) {
    for (let n = 0; n < STILL_STEPS; n++) tunnel.step(DT)
  }
  paint()
})

// A new theme repaints the smoke in its colour at once, even when it is standing still.
$effect(() => {
  void dye
  paint()
})

$effect(() => {
  void tunnelId
  if (!visible || appearance.reducedMotion || tunnel === null) return
  const steps = gridW * gridH > BIG_GRID ? 1 : 2
  return onFrame(() => {
    if (tunnel === null) return
    for (let n = 0; n < steps; n++) tunnel.step(DT)
    paint()
  })
})
</script>

<div class="face" bind:this={box} style:--fs="{place.fs}px">
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  {#if width > 0 && height > 0}
    <svg {width} {height} aria-hidden="true">
      <text class="time" x={place.x} y={place.y}>{text}</text>
      {#if zone}<text class="zone" x={width - 6} y={height - 5} data-testid="clock-zone">{zone}</text>{/if}
    </svg>
  {/if}
</div>

<style>
.face {
  position: relative;
  height: 100%;
  overflow: hidden;
}

canvas,
svg {
  position: absolute;
  inset: 0;
  display: block;
}

canvas {
  width: 100%;
  height: 100%;
}

text {
  font-family: var(--font-ui);
}

/* The same face, weight and place as the obstacle mask, so what is read is what the wind
   meets. */
.time {
  font-size: var(--fs);
  font-weight: 600;
  fill: var(--text);
}

.zone {
  font-size: max(calc(var(--fs) * 0.22), var(--step--2));
  letter-spacing: 0.1em;
  text-anchor: end;
  fill: var(--text-muted);
}
</style>
