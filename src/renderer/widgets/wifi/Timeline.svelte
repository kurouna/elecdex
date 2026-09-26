<script lang="ts">
import {
  bucketize,
  pointAt,
  type TrackEvent,
  WIFI_WINDOWS,
  type WifiPoint,
  windowMs,
} from '@shared/wifi'
import { untrack } from 'svelte'
import { nextFrame, onFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  drawTimeline,
  LABEL_WIDTH,
  laneBoxes,
  latencyTop,
  megabits,
  type Palette,
  readPalette,
  trafficTop,
} from './draw.ts'

/**
 * The last minutes, lane under lane on one time axis: signal, retries, round
 * trips, loss, traffic, and the events that explain them. One column per
 * second for the short windows; for the long ones each column is a few
 * seconds, drawn as its lowest-to-highest band so a spike is never averaged
 * away. The crosshair reads every lane at one moment.
 *
 * Redrawn once a second on the frame loop - the wall clock's second, as every
 * timed screen update here - and when the pointer moves.
 */
interface Props {
  points: readonly WifiPoint[]
  events: readonly TrackEvent[]
  window: string
  onwindow: (id: string) => void
  /** Its own title, when it is not under a tab that says it already. */
  titled?: boolean
}

const { points, events, window: windowId, onwindow, titled = true }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let hoverX = $state<number | null>(null)
let width = $state(0)
let height = $state(0)

const span = $derived(windowMs(windowId))

/** The moment under the crosshair, and what every lane read then. */
const hovered = $derived.by(() => {
  if (hoverX === null || width <= LABEL_WIDTH || hoverX < LABEL_WIDTH) return null
  const to = Math.floor(Date.now() / 1000) * 1000
  const at = to - span + ((hoverX - LABEL_WIDTH) / (width - LABEL_WIDTH)) * span
  const tolerance = Math.max(1000, span / Math.max(1, (width - LABEL_WIDTH) / 2))
  const point = pointAt(points, at, tolerance)
  const event = events.find((e) => Math.abs(e.at - at) <= tolerance)
  return { at, point, event, left: hoverX > width / 2 }
})

$effect(() => {
  void appearance.revision
  const el = canvas
  if (el === null) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  let palette: Palette = readPalette(el)
  let ratio = 1

  const draw = (): void => {
    if (width <= 0 || height <= 0) return
    const to = Math.floor(Date.now() / 1000) * 1000
    const from = to - span
    const columns = Math.max(1, Math.min(span / 1000, Math.floor((width - LABEL_WIDTH) / 2)))
    const buckets = bucketize(points, from, to, columns)
    drawTimeline({ ctx, width, height, ratio }, palette, {
      buckets,
      events,
      from,
      to,
      latencyTop: latencyTop(buckets),
      trafficTop: trafficTop(buckets),
      hoverX,
    })
  }

  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box === undefined) return
    ratio = window.devicePixelRatio || 1
    width = box.width
    height = box.height
    el.width = Math.max(1, Math.round(width * ratio))
    el.height = Math.max(1, Math.round(height * ratio))
    palette = readPalette(el)
    draw()
  })
  observer.observe(el)
  drawNow = draw
  const stop = onFrame(draw, 1000)
  return () => {
    stop()
    drawNow = null
    observer.disconnect()
  }
})

/** The draw of the canvas now mounted, for the effect below. */
let drawNow: (() => void) | null = null

// Whatever the draw reads - the points, the window, the crosshair - asks for a frame.
$effect(() => {
  void points
  void events
  void span
  void hoverX
  untrack(() => {
    if (drawNow !== null) nextFrame(drawNow)
  })
})

function move(event: PointerEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  hoverX = event.clientX - rect.left
}

const clock = (at: number): string => new Date(at).toTimeString().slice(0, 8)
const ms = (v: number | null | undefined): string =>
  v === undefined ? '—' : v === null ? 'lost' : `${Math.round(v)} ms`
</script>

<section class="timeline" data-testid="wifi-timeline">
  <header>
    {#if titled}<span class="title">TIMELINE</span>{/if}
    <span class="legend">
      <i class="net"></i>internet <i class="gw"></i>gateway <i class="up"></i>up <i class="down"></i>down
    </span>
    <div class="spans" role="group" aria-label="how much time the timeline shows">
      {#each WIFI_WINDOWS as w (w.id)}
        <button
          type="button"
          class:on={w.ms === span}
          aria-pressed={w.ms === span}
          data-testid="wifi-window"
          data-window={w.id}
          onclick={() => onwindow(w.id)}>{w.label}</button
        >
      {/each}
    </div>
  </header>
  <div
    class="plot"
    role="img"
    aria-label="signal, retries, round trips, loss, traffic and events over time"
    onpointermove={move}
    onpointerleave={() => {
      hoverX = null
    }}
  >
    <canvas bind:this={canvas}></canvas>
    <!-- The lanes' names, drawn on the canvas, each with the card that explains its lane. -->
    {#each laneBoxes(height) as box (box.lane)}
      <span
        class="lane-name"
        style:top="{box.y}px"
        style:height="{box.h}px"
        data-hint="lane-{box.lane === 'latency' ? 'rtt' : box.lane}"
      ></span>
    {/each}
    {#if hovered !== null}
      <div
        class="readout"
        class:left={hovered.left}
        style:--x="{hoverX}px"
        data-testid="wifi-crosshair"
      >
        <b>{clock(hovered.at)}</b>
        {#if hovered.point}
          <span>signal {hovered.point.rssi ?? '—'} dBm</span>
          <span>retry {hovered.point.retry === null ? '—' : `${hovered.point.retry.toFixed(1)} %`}</span>
          <span>gateway {ms(hovered.point.gateway)}</span>
          <span>internet {ms(hovered.point.internet)}</span>
          <span
            >↑ {hovered.point.up === null ? '—' : megabits(hovered.point.up)} ↓ {hovered.point.down ===
            null
              ? '—'
              : megabits(hovered.point.down)}</span
          >
        {:else}
          <span class="gap">not watched</span>
        {/if}
        {#if hovered.event}<span class="event">{hovered.event.kind} · {hovered.event.detail}</span>{/if}
      </div>
    {/if}
  </div>
</section>

<style>
.timeline {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: 0.2rem;
}

.title {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}

.legend {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.legend i {
  display: inline-block;
  width: 0.9em;
  height: 2px;
  margin: 0 0.25em 0.2em 0.6em;
  vertical-align: middle;
  background: var(--accent);
}

.legend i.gw {
  background: repeating-linear-gradient(90deg, var(--text-muted) 0 2px, transparent 2px 4px);
}

.legend i.up {
  height: 6px;
  opacity: 0.7;
}

.legend i.down {
  height: 6px;
  background: var(--accent-dim);
}

.spans {
  display: flex;
}

.spans button {
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  cursor: pointer;
}

.spans button + button {
  border-left: none;
}

.spans button.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.plot {
  position: relative;
  flex: 1;
  min-height: 0;
  cursor: crosshair;
}

.lane-name {
  position: absolute;
  left: 0;
  width: 44px;
  cursor: help;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.readout {
  position: absolute;
  top: 0;
  left: calc(var(--x) + 8px);
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid var(--accent-dim);
  background: color-mix(in srgb, var(--app-bg) 88%, transparent);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  white-space: nowrap;
  pointer-events: none;
}

.readout.left {
  left: auto;
  right: calc(100% - var(--x) + 8px);
}

.readout b {
  color: var(--accent-strong);
  font-weight: 500;
}

.readout .gap {
  color: var(--text-muted);
}

.readout .event {
  color: var(--warn);
}
</style>
