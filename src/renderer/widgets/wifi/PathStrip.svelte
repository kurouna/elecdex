<script lang="ts">
import {
  CAUSE_LABELS,
  culpritStation,
  type Diagnosis,
  type Health,
  type PathFigures,
  type WifiPoint,
} from '@shared/wifi'
import { untrack } from 'svelte'
import { nextFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { drawRibbons, megabits, type Palette, readPalette, sparkPath } from './draw.ts'

/**
 * The way a packet goes - this machine, the radio, the access point's gateway,
 * the internet - as four stations on a line, each lit by how its segment is
 * doing, with the verdict of where the trouble is beneath them.
 *
 * Each second's echoes run along the line as packets: to the gateway when it
 * answered, on to the internet when that did. A lost one does not run; its
 * wire breaks into dashes instead. Under it the ribbons keep the last minute of
 * echoes, one cell a second, so a burst of loss is seen as a burst.
 *
 * Each wire carries its segment's last minute as a sparkline - the signal on
 * the radio's, the round trips on the gateway's and the internet's - so the
 * room between the stations, wide when the pane is brought forward, says
 * something rather than nothing.
 *
 * The station the verdict blames is singled out - filled in its colour and a
 * size up - so in a pane as narrow as the network preset's the eye finds it
 * before it reads a word.
 *
 * The packets step, a quarter of the wire a second, rather than glide: a
 * gliding one was a 0.7 s CSS animation per wire every second, which kept the
 * compositor drawing at the display's rate for most of every second - measured
 * at 1920x1080 on an i5-1335U, 10.6% of one core for three dots, against 1%
 * for the rest of the pane. Stepping, they cost one repaint a second.
 */
interface Props {
  diagnosis: Diagnosis
  figures: PathFigures
  /** The newest second, which the packets run for. */
  latest: WifiPoint | null
  points: readonly WifiPoint[]
}

const { diagnosis, figures, latest, points }: Props = $props()

const culprit = $derived(culpritStation(diagnosis))

const RIBBON_SECONDS = 60
/** Where on its wire this second's packet sits: a quarter further each second. */
const STEPS = 4
const step = $derived(latest === null ? 0 : Math.floor(latest.at / 1000) % STEPS)

let canvas = $state<HTMLCanvasElement | null>(null)
let size = { width: 0, height: 0, ratio: 1 }
let palette: Palette | null = null

const fmt = (v: number | null, unit: string, digits = 0): string =>
  v === null ? '—' : `${v.toFixed(digits)}${unit}`

const hop = (s: PathFigures['gateway']): string =>
  s.sent === 0
    ? 'no echo'
    : s.received === 0
      ? 'silent'
      : `${fmt(s.median, ' ms')} ±${fmt(s.jitter, '')}`

const loss = (s: PathFigures['gateway']): string =>
  s.sent === 0 ? '' : `loss ${s.loss < 10 ? s.loss.toFixed(1) : Math.round(s.loss)}%`

interface Station {
  id: 'pc' | 'radio' | 'gateway' | 'internet'
  name: string
  health: Health
  main: string
  sub: string
}

const stations = $derived<Station[]>([
  {
    id: 'pc',
    name: 'PC',
    health: diagnosis.segments.pc,
    main: figures.up === null ? '—' : `↑ ${megabits(figures.up)}`,
    sub: figures.down === null ? '' : `↓ ${megabits(figures.down)}`,
  },
  {
    id: 'radio',
    name: 'RADIO',
    health: diagnosis.segments.radio,
    main: fmt(figures.rssi, ' dBm'),
    sub: figures.retry === null ? '' : `retry ${figures.retry.toFixed(1)}%`,
  },
  {
    id: 'gateway',
    name: 'GATEWAY',
    health: diagnosis.segments.gateway,
    main: hop(figures.gateway),
    sub: loss(figures.gateway),
  },
  {
    id: 'internet',
    name: 'INTERNET',
    health: diagnosis.segments.internet,
    main: hop(figures.internet),
    sub: loss(figures.internet),
  },
])

/** Each wire's last minute: the values, and the range they are drawn in. */
const SPARK_W = 100
const SPARK_H = 20
const sparks = $derived.by(() => {
  const last = points.slice(-RIBBON_SECONDS)
  const top = (values: (number | null | undefined)[], floor: number): number =>
    Math.max(floor, ...values.filter((v): v is number => typeof v === 'number')) * 1.1
  const gateway = last.map((p) => p.gateway)
  const internet = last.map((p) => p.internet)
  return {
    radio: sparkPath(
      last.map((p) => p.rssi),
      -90,
      -30,
      SPARK_W,
      SPARK_H,
    ),
    gateway: sparkPath(gateway, 0, top(gateway, 20), SPARK_W, SPARK_H),
    internet: sparkPath(internet, 0, top(internet, 120), SPARK_W, SPARK_H),
  }
})

/** Which segments carried this second's echo: machine to radio always, then as far as it got. */
const runs = $derived({
  radio: latest !== null && latest.state === 'connected',
  gateway: typeof latest?.gateway === 'number',
  internet: typeof latest?.internet === 'number',
  lostGateway: latest?.gateway === null,
  lostInternet: latest?.internet === null,
})

$effect(() => {
  void appearance.revision
  const el = canvas
  if (el === null) return
  palette = readPalette(el)
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box === undefined) return
    const ratio = window.devicePixelRatio || 1
    size = { width: box.width, height: box.height, ratio }
    el.width = Math.max(1, Math.round(box.width * ratio))
    el.height = Math.max(1, Math.round(box.height * ratio))
    palette = readPalette(el)
    paint()
  })
  observer.observe(el)
  return () => observer.disconnect()
})

function paint(): void {
  const ctx = canvas?.getContext('2d')
  if (!ctx || palette === null || size.width <= 0) return
  const now = points[points.length - 1]?.at ?? Date.now()
  drawRibbons({ ctx, ...size }, palette, points, now, RIBBON_SECONDS)
}

// A new second: the ribbons move on in the next shared frame.
$effect(() => {
  void points
  untrack(() => nextFrame(paint))
})
</script>

<section class="path" data-testid="wifi-path" data-cause={diagnosis.cause}>
  <ol class="stations">
    {#each stations as station, i (station.id)}
      {#if i > 0}
        {@const segment = station.id as 'radio' | 'gateway' | 'internet'}
        <li
          class="wire"
          data-health={station.health}
          data-hint="station-{segment}"
          class:lost={(segment === 'gateway' && runs.lostGateway) ||
            (segment === 'internet' && runs.lostInternet)}
          aria-hidden="true"
        >
          <svg class="spark" viewBox="0 0 {SPARK_W} {SPARK_H}" preserveAspectRatio="none">
            <path d={sparks[segment]} />
          </svg>
          {#if runs[segment]}
            <span class="packet" style:--at={step / (STEPS - 1)}></span>
          {/if}
        </li>
      {/if}
      <li
        class="station"
        class:culprit={station.id === culprit}
        data-culprit={station.id === culprit ? 'true' : undefined}
        data-health={station.health}
        data-testid="wifi-station"
        data-station={station.id}
        data-hint="station-{station.id}"
      >
        <span class="node"><span class="name">{station.name}</span></span>
        <span class="main">{station.main}</span>
        <span class="sub">{station.sub}</span>
      </li>
    {/each}
  </ol>

  <p class="verdict" class:loud={culprit !== null} data-health={diagnosis.health} data-testid="wifi-verdict" data-hint="cause">
    <span class="tag">CAUSE ▸</span>
    <span class="cause">{CAUSE_LABELS[diagnosis.cause]}</span>
    <span class="evidence">{diagnosis.evidence}</span>
  </p>
  <!-- What the figures above and the ribbons below are, so none has to be guessed. -->
  <p class="legend" data-hint="legend" data-testid="wifi-legend">
    <span><b>18 ms ±2</b> median ± jitter</span>
    <span><b>loss</b> echoes lost</span>
    <span class="tones"><i class="ok"></i>fine <i class="warn"></i>watch <i class="bad"></i>cause</span>
    <span><b>▮</b> 1 s <b class="x">☒</b> lost</span>
  </p>

  <div class="ribbons" data-hint="ribbons">
    <canvas bind:this={canvas} aria-label="the last minute of echoes, one cell a second"></canvas>
  </div>
</section>

<style>
.path {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stations {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto 1fr auto;
  align-items: start;
  margin: 0;
  padding: 0;
  list-style: none;
}

.station {
  --tone: var(--accent);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  font-family: var(--font-mono);
  text-align: center;
}

[data-health='warn'] {
  --tone: var(--warn);
}

[data-health='bad'] {
  --tone: var(--danger);
}

[data-health='idle'] {
  --tone: var(--accent-dim);
}

/* A station: a chamfered plate, lit in its segment's colour. */
.node {
  display: grid;
  place-items: center;
  min-width: 4.6rem;
  height: 1.55rem;
  padding: 0 0.5rem;
  border: 1px solid var(--tone);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  box-shadow: inset 0 0 calc(var(--glow) * 0.6rem) color-mix(in srgb, var(--tone) 45%, transparent);
}

.name {
  font-family: var(--font-display);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
  text-shadow: 0 0 calc(var(--glow) * 0.45rem) var(--tone);
}

.main {
  margin-top: 0.2rem;
  font-size: var(--step--1);
  color: var(--text);
  white-space: nowrap;
}

.sub {
  min-height: 1.2em;
  font-size: var(--step--1);
  color: var(--text-muted);
  white-space: nowrap;
}

/*
 * The station to blame: its plate filled with its colour and a size up, drawn
 * over its neighbours. A transform, so nothing around it moves; set once, not
 * animated.
 */
.station.culprit {
  position: relative;
  z-index: 1;
}

.station.culprit .node {
  background: var(--tone);
  transform: scale(1.18);
}

.station.culprit .name {
  color: var(--app-bg);
  font-weight: 600;
  text-shadow: none;
}

.station.culprit .main {
  margin-top: 0.35rem;
  font-weight: 600;
  color: var(--tone);
}

.station.culprit .sub {
  color: var(--tone);
}

.verdict.loud .cause {
  font-size: var(--step-1);
}

/* The strip between two stations: its line at the plates' middle, its sparkline over it. */
.wire {
  --tone: var(--accent);
  position: relative;
  height: 1.55rem;
  margin: 0 0.25rem;
  overflow: hidden;
}

.wire::before {
  content: '';
  position: absolute;
  inset: calc(50% - 1px) 0 auto;
  height: 2px;
  background: color-mix(in srgb, var(--tone) 55%, transparent);
}

.wire.lost::before {
  background: repeating-linear-gradient(90deg, var(--danger) 0 4px, transparent 4px 7px);
}

.spark {
  position: absolute;
  inset: 0.1rem 0;
  width: 100%;
  height: calc(100% - 0.2rem);
  opacity: 0.55;
}

.spark path {
  fill: none;
  stroke: var(--tone);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* This second's echo, a quarter further along its wire than the last one (see above). */
.packet {
  position: absolute;
  inset: calc(50% - 1px) 0 auto;
  height: 2px;
  transform: translateX(calc(var(--at) * (100% - 14px)));
}

.packet::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  width: 14px;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--accent-strong));
  box-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--accent-strong);
}

.verdict {
  --tone: var(--accent);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0;
  padding: 0.2rem 0.5rem;
  border-left: 3px solid var(--tone);
  background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 14%, transparent), transparent 70%);
  min-width: 0;
}

.tag {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.cause {
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
  white-space: nowrap;
}

.evidence {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem 0.9rem;
  margin: -0.15rem 0 0;
  padding-left: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.legend b {
  font-weight: 400;
  color: var(--text);
}

.legend b.x {
  color: var(--danger);
}

.tones i {
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  margin: 0 0.2rem 0 0.35rem;
  vertical-align: -0.05rem;
  background: var(--accent);
}

.tones i:first-child {
  margin-left: 0;
}

.tones i.warn {
  background: var(--warn);
}

.tones i.bad {
  background: var(--danger);
}

.ribbons {
  height: 1.9rem;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* A narrow path keeps its figures' size and gives up room instead: the plates narrow, and a
   long figure is cut rather than shrunk. */
@container (max-width: 26rem) {
  .node {
    min-width: 3.4rem;
    padding: 0 0.3rem;
  }

  .main,
  .sub {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
