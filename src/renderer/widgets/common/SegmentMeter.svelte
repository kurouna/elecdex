<script lang="ts">
import { observeCanvas } from '../../lib/canvas.ts'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * A ladder of segments that empties as a quantity falls.
 *
 * Drawn rather than shaded on purpose. A smooth bar says "some" at a glance; a
 * ladder says how many are left, which is what a countdown and a deadline both
 * want - and it is the vocabulary the spectrum pane already uses, so the two
 * read as the same instrument.
 *
 * The segment that has just gone out is drawn once at full brightness before it
 * fades, which is what gives the ladder its step: the eye catches the moment a
 * segment goes rather than a bar creeping.
 */

interface Props {
  /** How much is left, 0 to 1. */
  value: number
  /** How many segments. The caller decides from its own size (shared/timer.ts). */
  segments: number
  /** Which way it fills: a column empties from the top, a ladder from the right. */
  direction?: 'up' | 'right'
  /** Colour token for the lit segments. */
  tone?: 'accent' | 'warn' | 'danger' | 'ok'
  /** The segment index that went out most recently, drawn bright for one frame. */
  flash?: number | null
  testid?: string
}

const { value, segments, direction = 'up', tone = 'accent', flash = null, testid }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let size = $state({ width: 0, height: 0, ratio: 1 })

/**
 * How many segments are lit: all the picture takes from `value`. A countdown's
 * value moves every frame and this only once in many, so the drawing below reads
 * this and not the value - it was drawn ten times a second for a picture that
 * had not changed.
 */
const count = $derived(Math.max(1, segments))
const alive = $derived(Math.min(count, Math.ceil(Math.max(0, Math.min(1, value)) * count)))

$effect(() => {
  const el = canvas
  if (el === null) return
  return observeCanvas(el, (next) => {
    size = next
  })
})

/**
 * How one segment is painted.
 *
 * Out and not the one that just went: dim. The one that just went: full
 * strength, for the single frame it is there. Otherwise lit, brightest towards
 * the end that is emptying, so the ladder has a direction even in a still.
 */
function paintOf(
  i: number,
  alive: number,
  flashed: number | null,
): { dark: boolean; alpha: number } {
  if (i === flashed) return { dark: false, alpha: 1 }
  if (i >= alive) return { dark: true, alpha: 1 }
  return { dark: false, alpha: 0.55 + 0.45 * (i / Math.max(1, alive - 1)) }
}

$effect(() => {
  // Re-read the colours when the theme changes under a drawn surface.
  void appearance.revision
  const el = canvas
  const { width, height, ratio } = size
  if (el === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return

  const style = getComputedStyle(el)
  const lit = style.getPropertyValue('--meter-lit').trim() || '#8cf'
  const dark = style.getPropertyValue('--meter-dark').trim() || '#234'

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const vertical = direction === 'up'
  const span = vertical ? height : width
  const thickness = vertical ? width : height
  // A gap of a fifth of the pitch, and never less than a whole pixel: below that
  // the gaps disappear into antialiasing and the ladder becomes a bar again.
  const pitch = span / count
  const gap = Math.max(1, Math.min(3, pitch * 0.2))
  const length = Math.max(1, pitch - gap)

  for (let i = 0; i < count; i += 1) {
    const paint = paintOf(i, alive, flash)
    ctx.fillStyle = paint.dark ? dark : lit
    ctx.globalAlpha = paint.alpha
    const offset = i * pitch
    if (vertical) ctx.fillRect(0, height - offset - length, thickness, length)
    else ctx.fillRect(offset, 0, length, thickness)
    ctx.globalAlpha = 1
  }
})
</script>

<canvas
  bind:this={canvas}
  class="meter {tone}"
  class:horizontal={direction === 'right'}
  data-testid={testid}
  data-lit={Math.min(segments, Math.ceil(Math.max(0, Math.min(1, value)) * segments))}
  aria-hidden="true"
></canvas>

<style>
.meter {
  display: block;
  width: 100%;
  height: 100%;
  --meter-lit: var(--accent);
  --meter-dark: var(--accent-faint);
}

.meter.warn { --meter-lit: var(--warn); }
.meter.danger { --meter-lit: var(--danger); }
.meter.ok { --meter-lit: var(--ok); }
</style>
