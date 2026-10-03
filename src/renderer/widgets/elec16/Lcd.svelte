<script lang="ts">
import { screenText } from '@shared/elec16/font'
import { MODELS } from '@shared/elec16/map'
import { ANNUNCIATORS } from '@shared/elec16/state'
import { untrack } from 'svelte'
import { onBoundary } from '../../lib/frame-loop.ts'
import { deviceRoom, drawDotGrid, type Room } from '../emu/screen.ts'
import { type Cursor, type LcdColours, LcdPainter } from './lcd-painter.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * The ELEC-16's LCD (docs/elec16.md section 7): its glass in the ground's colour with the
 * annunciators printed on it, and the dots at a whole number of device pixels each, centred
 * in the room it is given. Three layers: the dots' shadow, the dots, and the gaps between
 * them - the first two a canvas of the machine's own resolution scaled up crisp, the gaps a
 * bitmap drawn once for the size (lcd-painter.ts says why). Drawn when the machine changed
 * the screen, while dots fade out, when the cursor blinks, and once when the size or the
 * colours change - never otherwise.
 *
 * The text it shows is there too, unseen, for a screen reader: the dots read back through the
 * font, at most once a second and only when it changed, so a program drawing every frame
 * does not keep the accessibility tree busy.
 */
interface Props {
  runner: Elec16Runner
  colours: LcdColours
  ghost: boolean
  /** Added to the machine's own contrast. */
  contrast: number
  /** The pane is seen: the cursor blinks only then. */
  seen: boolean
}

const { runner, colours, ghost, contrast, seen }: Props = $props()

let host = $state<HTMLDivElement | null>(null)
let dotsCanvas = $state<HTMLCanvasElement | null>(null)
let shadowCanvas = $state<HTMLCanvasElement | null>(null)
let gridCanvas = $state<HTMLCanvasElement | null>(null)
let room = $state<Room>({ w: 0, h: 0, ratio: 1 })
let text = $state('')

const model = $derived(MODELS[runner.model])
/** The glass round the dots, and the annunciators' line on it, in CSS pixels. */
const PAD = 8
const MARKS = 14
/** Device pixels a dot: as many whole ones as the room less the glass takes, at least one. */
const scale = $derived(
  Math.max(
    1,
    Math.floor(
      Math.min(
        (room.w - 2 * PAD * room.ratio) / model.width,
        (room.h - (2 * PAD + MARKS + 4) * room.ratio) / model.height,
      ),
    ),
  ),
)
const css = $derived({
  w: (model.width * scale) / room.ratio,
  h: (model.height * scale) / room.ratio,
})
/** The gaps show where a dot is three device pixels or more. */
const grid = $derived(scale >= 3)
/** How far the shadow falls, in device pixels: past the gap, onto the ground beside. */
const shadowAt = $derived(scale >= 3 ? Math.max(2, Math.round(scale / 4) + 1) : 0)
const rgb = ([r, g, b]: readonly number[]): string => `rgb(${r} ${g} ${b})`

const painter = new LcdPainter()
let dots: ImageData | null = null
let shadows: ImageData | null = null
let dotsCtx: CanvasRenderingContext2D | null = null
let shadowCtx: CanvasRenderingContext2D | null = null
let pixels = new Uint8Array(0)
/** The cursor's half of a blink: shown, or not. */
let blinkOn = true
/** The machine's contrast the dots were made for: a program that changes it redraws them. */
let madeFor = -1
/** The screen's count of changes when the text was last read. */
let readAt = -1

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

/** New colours for the size, colours and contrast; every dot is drawn on the next paint. */
function remake(): void {
  if (dots === null || shadows === null) return
  madeFor = runner.machine?.state.lcd.contrast ?? 8
  painter.configure(dots, shadows, model.width, model.height, colours, madeFor + contrast)
}

/** The cursor as the machine asks for it, in this half of the blink; null when none shows. */
function cursorNow(): Cursor | null {
  const lcd = runner.machine?.state.lcd
  if (lcd === undefined || (lcd.cursorMode & 3) === 0) return null
  if ((lcd.cursorMode & 4) !== 0 && !blinkOn) return null
  return { column: lcd.cursor & 0xff, row: lcd.cursor >> 8, shape: lcd.cursorMode & 3 }
}

/** Paints what changed; true while dots are still fading. */
function draw(): boolean {
  const machine = runner.machine
  if (machine === null || dotsCtx === null || dots === null || shadows === null) return false
  const s = machine.state
  if (s.lcd.contrast !== madeFor) remake()
  const shown = s.lcd.on && !s.off
  if (shown) machine.pixels(pixels)
  else pixels.fill(0)
  // Stopped, no frames come to finish a fade: the picture is drawn exact.
  const fade = ghost && runner.status === 'running'
  const { dirty, fading } = painter.paint(pixels, model.depth, fade, shown ? cursorNow() : null)
  if (dirty !== null) {
    dotsCtx.putImageData(dots, 0, 0, dirty.x, dirty.y, dirty.w, dirty.h)
    // Too small to fall past the gap, the shadow would lie under the dots: not drawn.
    if (shadowAt > 0) shadowCtx?.putImageData(shadows, 0, 0, dirty.x, dirty.y, dirty.w, dirty.h)
  }
  return fading
}

/** The text for a screen reader, when the screen changed since it was last read. */
function readText(): void {
  const s = runner.machine?.state
  if (s === undefined || s.screenRevision === readAt) return
  readAt = s.screenRevision
  const now = s.lcd.on && !s.off ? screenText(s.vram, model.width, model.height).join('\n') : ''
  if (now !== text) text = now
}

// A new size, model, colours or contrast: everything drawn again.
// Only then: a new machine on the same LCD (BRK, a step) is drawn as the dots that differ.
$effect(() => {
  const dotsEl = dotsCanvas
  const shadowEl = shadowCanvas
  const w = model.width
  const h = model.height
  void colours
  void contrast
  if (dotsEl === null || shadowEl === null) return
  untrack(() => {
    for (const el of [dotsEl, shadowEl]) {
      el.width = w
      el.height = h
    }
    dotsCtx = dotsEl.getContext('2d')
    shadowCtx = shadowEl.getContext('2d')
    dots = dotsCtx?.createImageData(w, h) ?? null
    shadows = shadowCtx?.createImageData(w, h) ?? null
    pixels = new Uint8Array(w * h)
    remake()
    draw()
    readAt = -1
    readText()
  })
})

// The gaps: a bitmap of the picture's device pixels in the ground's colour, drawn when the
// size or the ground changes and never again.
$effect(() => {
  const el = gridCanvas
  if (el === null) return
  drawDotGrid(el, model.width * scale, model.height * scale, scale, rgb(colours.ground))
})

// Every tick the machine changed the screen, and each frame of a fade.
$effect(() => runner.onFrame(draw))

// Paused, stopped or switched off: drawn once more as it now is.
$effect(() => {
  void runner.status
  void runner.off
  void runner.asleep
  void ghost
  untrack(() => {
    draw()
    readText()
  })
})

// The cursor blinks on the page's half-second beat, the machine asleep or not; the text for a
// screen reader is read on the second. Only while seen.
$effect(() => {
  if (!seen || runner.status === 'empty') return
  return onBoundary(500, () => {
    blinkOn = !blinkOn
    const s = runner.machine?.state
    if (s === undefined || s.off || !s.lcd.on) return
    if ((s.lcd.cursorMode & 4) !== 0) draw()
    if (blinkOn) readText()
  })
})

const marks = $derived(
  ANNUNCIATORS.map((name, bit) => ({ name, on: (runner.annunciators & (1 << bit)) !== 0 })),
)
</script>

<div class="lcd" data-testid="elec16-lcd">
  <div class="room" bind:this={host}>
    <!-- The glass: the LCD's ground round the dots, the annunciators printed on it. -->
    <div
      class="glass"
      style:padding="{PAD}px"
      style:background={rgb(colours.ground)}
      style:color={rgb(colours.dot)}
    >
      <div class="marks" style:height="{MARKS}px" aria-hidden="true">
        {#each marks as mark (mark.name)}
          <span class="mark" class:on={mark.on && !runner.off} data-mark={mark.name}
            >{mark.name === 'KANA' ? 'カナ' : mark.name === 'SOUND' ? '♪' : mark.name}</span
          >
        {/each}
      </div>
      <div class="stack" style:width="{css.w}px" style:height="{css.h}px">
        <canvas
          class="shadow"
          bind:this={shadowCanvas}
          style:transform="translate({shadowAt / room.ratio}px, {shadowAt / room.ratio}px)"
          aria-hidden="true"
        ></canvas>
        <canvas bind:this={dotsCanvas} data-testid="elec16-screen" data-scale={scale}></canvas>
        {#if grid}
          <canvas class="grid" bind:this={gridCanvas} aria-hidden="true"></canvas>
        {/if}
      </div>
    </div>
  </div>
  <pre class="read" aria-live="polite" data-testid="elec16-text">{text}</pre>
</div>

<style>
.lcd {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.room {
  flex: 1;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.glass {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--e16-edge);
  border-radius: var(--e16-radius);
}

.marks {
  display: flex;
  gap: 0 0.7em;
  overflow: hidden;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  line-height: 1.2;
}

.mark {
  opacity: 0;
}

.mark.on {
  opacity: 1;
}

.stack {
  position: relative;
  overflow: hidden;
}

canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.grid {
  pointer-events: none;
}

/* For a screen reader only: the text the dots show. */
.read {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: pre;
  margin: 0;
}
</style>
