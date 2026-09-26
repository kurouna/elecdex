<script lang="ts">
import { formatClock } from '@shared/now-playing'

/**
 * Where the track is, and - when the player takes a new position - where to
 * move it. A player that does not is shown a plain meter with no head, so
 * nothing looks as if it could be dragged. Dragged, the bar follows the pointer
 * and the time says where it would land; the seek is sent once, on release.
 * The keyboard moves it five seconds at a time (Home and End to the ends).
 */
interface Props {
  position: number | null
  duration: number | null
  seekable: boolean
  onseek: (seconds: number) => void
}

const { position, duration, seekable, onseek }: Props = $props()

/** The fraction under the pointer while dragging, else null. */
let dragging = $state<number | null>(null)
let bar = $state<HTMLDivElement | null>(null)

const can = $derived(seekable && duration !== null && duration > 0)
const fraction = $derived.by(() => {
  if (dragging !== null) return dragging
  if (position === null || duration === null || duration <= 0) return null
  return Math.min(1, Math.max(0, position / duration))
})
const shown = $derived(dragging !== null && duration !== null ? dragging * duration : position)

function fractionAt(clientX: number): number {
  const box = bar?.getBoundingClientRect()
  if (!box || box.width <= 0) return 0
  return Math.min(1, Math.max(0, (clientX - box.left) / box.width))
}

function down(event: PointerEvent): void {
  if (!can || event.button !== 0) return
  event.preventDefault()
  bar?.setPointerCapture?.(event.pointerId)
  dragging = fractionAt(event.clientX)
}

function move(event: PointerEvent): void {
  if (dragging !== null) dragging = fractionAt(event.clientX)
}

function up(event: PointerEvent): void {
  if (dragging === null || duration === null) return
  const to = fractionAt(event.clientX) * duration
  dragging = null
  onseek(to)
}

function key(event: KeyboardEvent): void {
  if (!can || duration === null) return
  const at = position ?? 0
  const to =
    event.key === 'ArrowRight'
      ? at + 5
      : event.key === 'ArrowLeft'
        ? at - 5
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? duration
            : null
  if (to === null) return
  event.preventDefault()
  onseek(Math.max(0, Math.min(duration, to)))
}
</script>

<div class="track">
  {#if fraction !== null}
    {#if can}
      <div
        class="bar seekable"
        class:dragging={dragging !== null}
        bind:this={bar}
        role="slider"
        tabindex="0"
        aria-label="position"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration ?? 0)}
        aria-valuenow={Math.round(shown ?? 0)}
        aria-valuetext={formatClock(shown ?? 0)}
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={() => (dragging = null)}
        onkeydown={key}
        data-testid="np-bar"
        data-seekable="true"
      >
        <span class="rail"><span class="fill" style:transform="scaleX({fraction})"></span></span>
        <span class="head" style:left="{fraction * 100}%"></span>
      </div>
    {:else}
      <div class="bar" data-testid="np-bar" data-seekable="false">
        <span class="rail"><span class="fill" style:transform="scaleX({fraction})"></span></span>
      </div>
    {/if}
  {/if}
  {#if shown !== null}
    <span class="times" class:dragging={dragging !== null} data-testid="np-time">
      {formatClock(shown)}{#if duration !== null}<span class="of">{` / ${formatClock(duration)}`}</span>{/if}
    </span>
  {/if}
</div>

<style>
.track {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* The element is taller than the rail it draws, so the pointer need not find a hairline. */
.bar {
  position: relative;
  flex: 1;
  height: 0.9rem;
}

.rail {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: 2px;
  translate: 0 -50%;
  overflow: hidden;
  background: var(--accent-faint);
}

.fill {
  position: absolute;
  inset: 0;
  background: var(--accent-dim);
  transform-origin: left center;
}

.seekable {
  cursor: pointer;
  touch-action: none;
}

.seekable .rail {
  height: 3px;
}

.seekable .fill {
  background: var(--accent);
}

.head {
  position: absolute;
  top: 50%;
  width: 0.5rem;
  height: 0.5rem;
  translate: -50% -50%;
  rotate: 45deg;
  background: var(--accent-strong);
  box-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--accent);
}

.seekable:hover .head,
.seekable.dragging .head,
.seekable:focus-visible .head {
  width: 0.65rem;
  height: 0.65rem;
}

.seekable:focus-visible {
  outline: 1px solid var(--accent-strong);
  outline-offset: 2px;
}

.times {
  flex: none;
  margin-left: auto;
  font-family: var(--font-display);
  font-size: var(--step--1);
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.times.dragging {
  color: var(--accent-strong);
}

.times .of {
  color: var(--text-muted);
}
</style>
