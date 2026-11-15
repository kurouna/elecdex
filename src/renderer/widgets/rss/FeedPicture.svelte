<script lang="ts">
import { feedImage } from './feed-images.ts'

/**
 * An article's picture, or, while it comes or when there is none, a plate in its feed's hue:
 * scan lines over a glow, so a card without a picture still reads as one of the feed's.
 */
interface Props {
  src: string | undefined
  turn: number
  /** Varies the plate's glow so neighbouring cards do not look alike. */
  seed: string
}

const { src, turn, seed }: Props = $props()

let data = $state<string | null>(null)
$effect(() => {
  data = null
  if (src === undefined) return
  let live = true
  void feedImage(src).then((url) => {
    if (live) data = url
  })
  return () => {
    live = false
  }
})

/** Where the plate's glow sits, from the item's key: the same card always draws the same plate. */
const glow = $derived.by(() => {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return { x: 20 + (hash % 60), y: 25 + ((hash >>> 8) % 50) }
})
</script>

<span class="pic" style:--mark-turn={turn} data-testid="rss-picture" data-loaded={data !== null || undefined}>
  <span class="plate" style:--gx="{glow.x}%" style:--gy="{glow.y}%"></span>
  {#if data !== null}<img src={data} alt="" draggable="false" />{/if}
</span>

<style>
.pic {
  --tone: hsl(calc(var(--mark-h) + var(--mark-turn, 0)) var(--mark-s) var(--mark-l));
  position: relative;
  display: block;
  overflow: hidden;
  background: var(--surface-2);
}

.plate {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0 2px, rgb(0 0 0 / 0.22) 2px 3px),
    radial-gradient(circle at var(--gx) var(--gy), color-mix(in srgb, var(--tone) 50%, transparent), transparent 60%),
    linear-gradient(135deg, color-mix(in srgb, var(--tone) 20%, var(--surface-2)), var(--surface-2));
}

img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
