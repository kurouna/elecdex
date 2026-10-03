<script lang="ts">
import type { Chip8 } from '@shared/chip8/machine'
import { HIRES } from '@shared/chip8/types'
import type { Rotation } from '@shared/chip8-library'
import { fitScreen } from '@shared/emu/fit'
import { Painter } from '../emu/painter.ts'
import { deviceRoom, drawDotGrid, type Room } from '../emu/screen.ts'
import type { Palette } from './palette.ts'
import type { Chip8Runner } from './runner.svelte.ts'

/**
 * The CHIP-8 screen (docs/architecture.md section 5.18): a canvas at the machine's own
 * resolution, scaled by CSS to a whole number of device pixels a dot and centred in the
 * room, with a bezel whose edge lights while the buzzer sounds.
 *
 * The room is read from the ResizeObserver's entry, in device pixels where the browser
 * gives them - never by measuring the element inside the callback: a pane just brought
 * forward still answers with the size it had in the layout (CLAUDE.md, Panes).
 * It draws when the machine changed the screen, while the afterglow fades, and once when
 * the palette or the size changes; never otherwise.
 */
interface Props {
  runner: Chip8Runner
  palette: Palette
  glow: boolean
  dots: boolean
  mode: 'integer' | 'fit'
  rotation: Rotation
  /** The device pixels a dot comes to, for the strip to show. */
  scale?: number
}

let { runner, palette, glow, dots, mode, rotation, scale = $bindable(0) }: Props = $props()

let host = $state<HTMLDivElement | null>(null)
let canvas = $state<HTMLCanvasElement | null>(null)
/** The room in device pixels, and the ratio it was measured at. */
let room = $state<Room>({ w: 0, h: 0, ratio: 1 })

const painter = new Painter()
let image: ImageData | null = null
/** What was drawn last: which machine, at which count of its screen's changes. */
let drawnMachine: Chip8 | null = null
let drawnRevision = -1

/** Room kept round the picture for the bezel's frame and glow, in CSS pixels a side. */
const MARGIN = 10

const size = $derived({
  w: runner.hires ? HIRES.w : HIRES.w / 2,
  h: runner.hires ? HIRES.h : HIRES.h / 2,
})
const fit = $derived(
  fitScreen({ w: room.w - 2 * MARGIN * room.ratio, h: room.h - 2 * MARGIN * room.ratio }, size, {
    unit: HIRES,
    mode,
    rotation,
  }),
)
const turned = $derived(rotation === 90 || rotation === 270)
/** The picture in CSS pixels, before it is turned. */
const css = $derived({ w: fit.width / room.ratio, h: fit.height / room.ratio })
/** The grid between the dots: only where a dot is whole and big enough to show a gap. */
const grid = $derived(dots && fit.whole && fit.scale >= 4)
let gridCanvas = $state<HTMLCanvasElement | null>(null)

// The grid: a canvas of the picture's own device pixels, in the ground's colour, drawn when
// the size or the ground changes and never again (widgets/emu/screen.ts says why).
$effect(() => {
  const el = gridCanvas
  if (el === null) return
  const [r, g, b] = palette[0]
  drawDotGrid(
    el,
    Math.round(fit.width),
    Math.round(fit.height),
    fit.scale,
    `rgba(${r}, ${g}, ${b}, 0.55)`,
  )
})

$effect(() => {
  scale = fit.scale
})

$effect(() => {
  const el = host
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const entry = entries[entries.length - 1]
    if (entry === undefined) return
    const next = deviceRoom(entry, window.devicePixelRatio || 1)
    // Behind a tab it measures nothing: the picture keeps its size for when it is back.
    if (next === null) return
    if (next.w !== room.w || next.h !== room.h || next.ratio !== room.ratio) room = next
  })
  observer.observe(el)
  return () => observer.disconnect()
})

function draw(force: boolean): void {
  const machine = runner.machine
  const ctx = canvas?.getContext('2d') ?? null
  if (machine === null || ctx === null || canvas === null) return
  const s = machine.state
  const w = s.hires ? HIRES.w : HIRES.w / 2
  const h = s.hires ? HIRES.h : HIRES.h / 2
  // A new machine (a reset, a moved pane) counts its changes from the start again.
  const same = machine === drawnMachine && s.screenRevision === drawnRevision
  if (!force && same && !painter.fading) return
  if (canvas.width !== w || canvas.height !== h || image === null) {
    canvas.width = w
    canvas.height = h
    image = ctx.createImageData(w, h)
    painter.reset()
  }
  // A new machine (a reset, a moved pane) is not the old one's picture fading out.
  if (machine !== drawnMachine) painter.reset()
  // Stopped or stepped by hand, no frames come to finish a fade: the picture is exact.
  const glowing = glow && runner.status === 'running'
  painter.paint({ width: w, height: h, pixels: s.pixels }, palette, image, glowing)
  ctx.putImageData(image, 0, 0)
  drawnMachine = machine
  drawnRevision = s.screenRevision
}

// Every frame the machine runs, or a step by hand.
$effect(() => runner.onFrame(() => draw(false)))

// Paused or stopped: drawn once more, exact, so no half-faded trail is left standing.
$effect(() => {
  if (runner.status !== 'running') draw(true)
})

// A new palette, the glow switched, or a new machine: draw at once, from scratch.
$effect(() => {
  void palette
  void glow
  void runner.program
  void canvas
  painter.reset()
  draw(true)
})
</script>

<div class="room" bind:this={host} data-testid="chip8-room">
  <div
    class="bezel"
    class:buzz={runner.sounding}
    style:width="{turned ? css.h : css.w}px"
    style:height="{turned ? css.w : css.h}px"
    data-testid="chip8-bezel"
  >
    <div
      class="turn"
      style:width="{css.w}px"
      style:height="{css.h}px"
      style:transform="translate(-50%, -50%) rotate({rotation}deg)"
    >
      <canvas
        bind:this={canvas}
        width="64"
        height="32"
        data-testid="chip8-screen"
        data-scale={fit.scale}
        data-width={Math.round(fit.width)}
        data-hires={runner.hires}
      ></canvas>
      {#if grid}
        <canvas class="grid" bind:this={gridCanvas} aria-hidden="true"></canvas>
      {/if}
    </div>
  </div>
</div>

<style>
.room {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* A thin frame, its two corners marked in the accent; the frame lights while it beeps. */
.bezel {
  position: relative;
  display: grid;
  place-items: center;
  outline: 1px solid var(--panel-rule);
  outline-offset: 3px;
  transition: outline-color var(--dur-panel, 120ms) linear;
}

.bezel::before,
.bezel::after {
  content: '';
  position: absolute;
  width: 0.6rem;
  height: 0.6rem;
  border: 0 solid var(--accent);
  pointer-events: none;
}

.bezel::before {
  top: -4px;
  left: -4px;
  border-width: 2px 0 0 2px;
}

.bezel::after {
  right: -4px;
  bottom: -4px;
  border-width: 0 2px 2px 0;
}

.bezel.buzz {
  outline-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-faint);
}

/* Centred on the bezel whatever its turn: a picture turned a quarter is wider, before it
   turns, than the box it lands in, and laid out by the grid it would start at the left. */
.turn {
  position: absolute;
  left: 50%;
  top: 50%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* The gaps between dots, over the picture: a bitmap drawn once for the size. */
.grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  image-rendering: pixelated;
}
</style>
