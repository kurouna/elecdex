<script lang="ts">
import type { Chip8 } from '@shared/chip8/machine'
import { HIRES } from '@shared/chip8/types'
import type { Rotation } from '@shared/chip8-library'
import { fitScreen } from '@shared/emu/fit'
import { Painter } from './painter.ts'
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
let room = $state({ w: 0, h: 0, ratio: 1 })

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

$effect(() => {
  scale = fit.scale
})

$effect(() => {
  const el = host
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const entry = entries[entries.length - 1]
    if (entry === undefined) return
    const ratio = window.devicePixelRatio || 1
    const device = entry.devicePixelContentBoxSize?.[0]
    const box = entry.contentBoxSize?.[0]
    const w = device?.inlineSize ?? (box?.inlineSize ?? entry.contentRect.width) * ratio
    const h = device?.blockSize ?? (box?.blockSize ?? entry.contentRect.height) * ratio
    // Behind a tab it measures nothing: the picture keeps its size for when it is back.
    if (w === 0 || h === 0) return
    if (w !== room.w || h !== room.h || ratio !== room.ratio) room = { w, h, ratio }
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
  painter.paint({ width: w, height: h, pixels: s.pixels }, palette, image, glow)
  ctx.putImageData(image, 0, 0)
  drawnMachine = machine
  drawnRevision = s.screenRevision
}

// Every frame the machine runs, or a step by hand.
$effect(() => runner.onFrame(() => draw(false)))

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
    <div class="turn" style:width="{css.w}px" style:height="{css.h}px" style:transform="rotate({rotation}deg)">
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
        <div
          class="grid"
          style:--dot="{fit.scale / room.ratio}px"
          style:--line="{1 / room.ratio}px"
          aria-hidden="true"
        ></div>
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

.turn {
  position: relative;
  flex: none;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* The gaps between dots, one device pixel wide, in the ground's colour: drawn once, never animated. */
.grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, var(--grid-ground) var(--line), transparent var(--line)) 0 0 / var(--dot) var(--dot),
    linear-gradient(var(--grid-ground) var(--line), transparent var(--line)) 0 0 / var(--dot) var(--dot);
  --grid-ground: color-mix(in srgb, var(--surface-0) 55%, transparent);
}

:global([data-mode='light']) .grid {
  --grid-ground: color-mix(in srgb, #ffffff 60%, transparent);
}
</style>
