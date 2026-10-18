<script lang="ts">
import { type EtherEvent, type EtherPoint, etherBuckets, speedLabel } from '@shared/ethernet'
import { PATH_WINDOWS, pointAt, windowMs } from '@shared/netpath'
import { untrack } from 'svelte'
import { nextFrame, onFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  LABEL_WIDTH,
  labelsChanged,
  megabits,
  type Palette,
  readPalette,
  type TimelineLabels,
} from '../netpath/draw.ts'
import {
  drawEtherTimeline,
  ETHER_LANE_NAMES,
  etherL2Top,
  etherLaneBoxes,
  etherLatencyTop,
  etherTrafficTop,
} from './draw.ts'

/**
 * The last minutes, lane under lane on one time axis: the link's speed, damaged
 * and broadcast frames, round trips, loss, traffic, and the events that explain
 * them - the Wi-Fi pane's timeline with the cable where it has the radio. One
 * column per second for the short windows, a band per column for the long ones,
 * so a spike is never averaged away; the crosshair reads every lane at a moment.
 *
 * Redrawn once a second on the frame loop and when the pointer moves. The words
 * are HTML over the canvas, at steps of the type scale, where the draw says.
 */
interface Props {
  points: readonly EtherPoint[]
  events: readonly EtherEvent[]
  window: string
  onwindow: (id: string) => void
  bestSeen: number | null
  capMbps: number | null
  speedMbps: number | null
  /** Its own title, when it is not under a tab that says it already. */
  titled?: boolean
}

const {
  points,
  events,
  window: windowId,
  onwindow,
  bestSeen,
  capMbps,
  speedMbps,
  titled = true,
}: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let hoverX = $state<number | null>(null)
let width = $state(0)
let height = $state(0)
let labels = $state.raw<TimelineLabels | null>(null)
const boxes = $derived(etherLaneBoxes(height))
const eventsBox = $derived(boxes.find((b) => b.lane === 'events') ?? null)

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
    const buckets = etherBuckets(points, from, to, columns)
    const traffic = etherTrafficTop(buckets, speedMbps)
    const next = drawEtherTimeline({ ctx, width, height, ratio }, palette, {
      buckets,
      events,
      from,
      to,
      bestSeen,
      capMbps,
      latencyTop: etherLatencyTop(buckets),
      trafficTop: traffic.top,
      trafficIsLink: traffic.isLink,
      l2Top: etherL2Top(buckets),
      hoverX,
    })
    if (labelsChanged(labels, next)) labels = next
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

let drawNow: (() => void) | null = null

$effect(() => {
  void points
  void events
  void span
  void hoverX
  void bestSeen
  void speedMbps
  void capMbps
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
  v === undefined ? '—' : v === null ? 'lost' : v < 1 ? '<1 ms' : `${Math.round(v)} ms`
const LANE_HINTS: Record<string, string> = { latency: 'rtt' }
</script>

<section class="timeline" data-testid="ether-timeline">
  <header>
    {#if titled}<span class="title">TIMELINE</span>{/if}
    <span class="legend">
      <i class="net"></i>internet <i class="gw"></i>gateway <i class="up"></i>up <i class="down"></i>down
      <i class="fell"></i>fell <i class="crc"></i>crc <i class="lost"></i>link lost
    </span>
    <div class="spans" role="group" aria-label="how much time the timeline shows">
      {#each PATH_WINDOWS as w (w.id)}
        <button
          type="button"
          class:on={w.ms === span}
          aria-pressed={w.ms === span}
          data-testid="ether-window"
          data-window={w.id}
          onclick={() => onwindow(w.id)}>{w.label}</button
        >
      {/each}
    </div>
  </header>
  <div
    class="plot"
    role="img"
    aria-label="link speed, damaged and broadcast frames, round trips, loss, traffic and events over time"
    onpointermove={move}
    onpointerleave={() => {
      hoverX = null
    }}
  >
    <canvas bind:this={canvas}></canvas>
    {#each boxes as box (box.lane)}
      <span
        class="lane-name"
        style:top="{box.y}px"
        style:height="{box.h}px"
        data-hint="lane-{LANE_HINTS[box.lane] ?? box.lane}">{ETHER_LANE_NAMES[box.lane]}</span
      >
    {/each}
    {#if labels !== null}
      {#each labels.scales as scale (scale.y)}
        <span class="scale" style:top="{scale.y}px">{scale.text}</span>
      {/each}
      {#each labels.unwatched as run (run.x0)}
        {#if run.x1 - run.x0 >= 110}
          <span class="unwatched" style:left="{(run.x0 + run.x1) / 2}px" data-hint="not-watched">NOT WATCHED</span>
        {/if}
      {/each}
      {#if eventsBox !== null}
        {#each labels.events as mark (mark.key)}
          <span class="mark" data-tone={mark.tone} style:left="{mark.x}px" style:top="{eventsBox.y + eventsBox.h / 2}px"
            >{mark.glyph}</span
          >
        {/each}
      {/if}
    {/if}
    {#if hovered !== null}
      <div class="readout" class:left={hovered.left} style:--x="{hoverX}px" data-testid="ether-crosshair">
        <b>{clock(hovered.at)}</b>
        {#if hovered.point}
          <span
            >link {hovered.point.state === 'up'
              ? `${speedLabel(hovered.point.speed)} ${hovered.point.duplex ?? ''}`
              : (hovered.point.state ?? '—')}</span
          >
          <span>crc {hovered.point.errors === null ? '—' : Math.round(hovered.point.errors)}/s</span>
          <span>broadcast {hovered.point.broadcast === null ? '—' : Math.round(hovered.point.broadcast)}/s</span>
          <span>gateway {ms(hovered.point.gateway)}</span>
          <span>internet {ms(hovered.point.internet)}</span>
          <span
            >↑ {hovered.point.up === null ? '—' : megabits(hovered.point.up)} ↓ {hovered.point.down === null
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
  text-overflow: ellipsis;
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

.legend i.fell {
  height: 6px;
  background: var(--warn);
}

.legend i.crc {
  height: 6px;
  background: var(--danger);
}

.legend i.lost {
  height: 6px;
  background: repeating-linear-gradient(135deg, var(--danger) 0 1.5px, transparent 1.5px 4px);
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
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  line-height: 1.2;
  color: var(--text-muted);
  cursor: help;
}

.scale {
  position: absolute;
  right: 2px;
  padding: 0 0.15rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.2;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--app-bg) 75%, transparent);
  pointer-events: none;
}

.unwatched {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.mark {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1;
  color: var(--accent-strong);
  pointer-events: none;
}

.mark[data-tone='ok'] {
  color: var(--ok);
}

.mark[data-tone='warn'] {
  color: var(--warn);
}

.mark[data-tone='danger'] {
  color: var(--danger);
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
