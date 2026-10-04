<script lang="ts">
import { BITMAP_HEIGHT, BITMAP_WIDTH } from '@shared/elec16/video'
import { untrack } from 'svelte'
import { onBoundary } from '../../lib/frame-loop.ts'
import { deviceRoom, type Room } from '../emu/screen.ts'
import { playScale } from './play-body.ts'
import { paintPlay, playText, screenShows } from './play-painter.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * PLAY-320's screen alone (docs/elec16-play.md, G2: the body comes in G3), as PLAIN draws its
 * LCD: no case, the 320 x 288 picture at the machine's resolution, scaled up crisp by CSS to
 * a whole number of device pixels a dot when there is room (less, smoothly, when there is
 * not), centred. Drawn when the machine changed what it shows - at most sixty times a
 * second, the loop's rate for this model - and once when stopped or switched off.
 *
 * The text on it is there too, unseen, for a screen reader: read back through the font at
 * most once a second, and only when it changed.
 */
interface Props {
  runner: Elec16Runner
  /** The pane is seen: the text is read only then. */
  seen: boolean
  /**
   * Device pixels a dot, when a body has sized the screen (PlayDevice.svelte, play-body.ts);
   * without it, the screen fits the room it is given.
   */
  fixed?: { scale: number; ratio: number } | undefined
}

const { runner, seen, fixed }: Props = $props()

let host = $state<HTMLDivElement | null>(null)
let canvas = $state<HTMLCanvasElement | null>(null)
let room = $state<Room>({ w: 0, h: 0, ratio: 1 })
let text = $state('')

/** Device pixels a dot: the body's, or a whole number where it fits, else as much as fits. */
const scale = $derived.by(() => {
  if (fixed !== undefined) return fixed.scale
  return playScale(room, BITMAP_WIDTH, BITMAP_HEIGHT)
})
const ratio = $derived(fixed?.ratio ?? room.ratio)
const css = $derived({
  w: (BITMAP_WIDTH * scale) / ratio,
  h: (BITMAP_HEIGHT * scale) / ratio,
})

let ctx: CanvasRenderingContext2D | null = null
let image: ImageData | null = null
/** The screen's count of changes at the last paint and the last reading of its text. */
let paintedAt = -1
let readAt = -1

$effect(() => {
  const el = host
  if (el === null || fixed !== undefined) return
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

/** Paints the picture when what it shows changed (or `always`). */
function draw(always = false): void {
  const machine = runner.machine
  if (machine === null || ctx === null || image === null) return
  const s = machine.state
  if (!always && s.screenRevision === paintedAt) return
  paintedAt = s.screenRevision
  paintPlay(s.video, s.off, image.data)
  ctx.putImageData(image, 0, 0)
}

/** The text for a screen reader, when the screen changed since it was last read. */
function readText(): void {
  const s = runner.machine?.state
  if (s === undefined || s.screenRevision === readAt) return
  readAt = s.screenRevision
  const now =
    screenShows(s.video, s.off) === 'bitmap'
      ? playText(s.video?.mem ?? [])
          .join('\n')
          .trimEnd()
      : ''
  if (now !== text) text = now
}

$effect(() => {
  const el = canvas
  if (el === null) return
  untrack(() => {
    el.width = BITMAP_WIDTH
    el.height = BITMAP_HEIGHT
    ctx = el.getContext('2d')
    image = ctx?.createImageData(BITMAP_WIDTH, BITMAP_HEIGHT) ?? null
    draw(true)
    readAt = -1
    readText()
  })
})

// Every tick the machine changed the screen.
$effect(() => runner.onFrame(() => draw()))

// Paused, stopped, switched off or another machine: drawn once more as it now is.
$effect(() => {
  void runner.status
  void runner.off
  void runner.asleep
  void runner.stepped
  untrack(() => {
    draw(true)
    readText()
  })
})

// The text for a screen reader, on the second, while seen.
$effect(() => {
  if (!seen || runner.status === 'empty') return
  return onBoundary(1000, readText)
})
</script>

<div class="play" class:fixed={fixed !== undefined} data-testid="elec16-play">
  <div class="room" bind:this={host}>
    <canvas
      bind:this={canvas}
      class:smooth={scale < 1}
      style:width="{css.w}px"
      style:height="{css.h}px"
      data-testid="elec16-play-screen"
      data-scale={scale}
    ></canvas>
  </div>
  <pre class="read" aria-live="polite" data-testid="elec16-text">{text}</pre>
</div>

<style>
.play {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.play.fixed {
  height: auto;
}

.room {
  flex: 1;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

canvas {
  display: block;
  image-rendering: pixelated;
}

/* Smaller than the machine's own pixels: a dot cannot stay whole, so it is not kept hard. */
canvas.smooth {
  image-rendering: auto;
}

/* For a screen reader only. */
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
