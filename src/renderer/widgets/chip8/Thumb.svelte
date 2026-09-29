<script lang="ts">
import { decodePreview, type Preview } from '@shared/chip8/preview'
import type { Rotation } from '@shared/chip8-library'
import { paintStill } from './painter.ts'
import type { Palette } from './palette.ts'

/**
 * A program's preview in the library (docs/architecture.md section 5.18): the frame
 * gen-chip8 chose, drawn in the colours the pane shows, turned as the program's screen is,
 * inside a box of `width` x `height` CSS pixels. A preview that cannot be read is an empty
 * frame.
 */
interface Props {
  preview: Preview | undefined
  palette: Palette
  rotation: Rotation
  width: number
  height: number
}

const { preview, palette, rotation, width, height }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
const frame = $derived(preview === undefined ? null : decodePreview(preview))
const turned = $derived(rotation === 90 || rotation === 270)

/** The canvas's own box before it is turned, fitted to the box it is given. */
const size = $derived.by(() => {
  if (frame === null) return { w: width, h: height }
  const across = turned ? frame.h : frame.w
  const down = turned ? frame.w : frame.h
  const scale = Math.min(width / across, height / down)
  return { w: frame.w * scale, h: frame.h * scale }
})
/** Whole dots come out crisp; a hires preview in a lores box is smoothed rather than thinned. */
const whole = $derived(frame !== null && Number.isInteger(size.w / frame.w))

$effect(() => {
  const ctx = canvas?.getContext('2d') ?? null
  if (ctx === null || canvas === null || frame === null) return
  canvas.width = frame.w
  canvas.height = frame.h
  const image = ctx.createImageData(frame.w, frame.h)
  paintStill({ width: frame.w, height: frame.h, pixels: frame.pixels }, palette, image)
  ctx.putImageData(image, 0, 0)
})
</script>

<span class="thumb" style:width="{width}px" style:height="{height}px" aria-hidden="true">
  {#if frame !== null}
    <canvas
      bind:this={canvas}
      class:whole
      style:width="{size.w}px"
      style:height="{size.h}px"
      style:transform="translate(-50%, -50%) rotate({rotation}deg)"
    ></canvas>
  {/if}
</span>

<style>
.thumb {
  position: relative;
  display: block;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--panel-rule);
  background: var(--surface-0);
}

/* Centred whatever its turn (see Screen.svelte). */
canvas {
  position: absolute;
  left: 50%;
  top: 50%;
  display: block;
}

canvas.whole {
  image-rendering: pixelated;
}
</style>
