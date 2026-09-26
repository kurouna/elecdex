<script lang="ts">
import { untrack } from 'svelte'
import { formatPercent } from '../../lib/format.ts'
import { CHART_WINDOW_MS } from '../../lib/frame-loop.ts'
import { TimeSeries } from '../../lib/time-series.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import StreamChart from '../common/StreamChart.svelte'
import ViewToggle, { type ChartView } from '../common/ViewToggle.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's CPU module: the cores split into two halves, each with its average
 * load and a scrolling graph, then a dashed row of temperature (or core count
 * where temperature is unavailable), minimum and maximum frequency and task
 * count.
 *
 * A toggle switches to a bar per logical core, as Task Manager shows them; the
 * choice is kept in the pane state.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
/** Shown in its tab, with the window on screen: what the pane does for the eye runs only then. */
const visible = $derived(seen(inTab))

const view = $derived<ChartView>(paneState?.view === 'bars' ? 'bars' : 'line')

function setView(next: ChartView): void {
  widgetState.patch(paneId, { view: next })
}

/** Above this, a core's bar is drawn in the warning colour. */
const HOT_CORE = 85

/**
 * The load goes on being sampled behind another tab or with the window put
 * away, so the graph has no gap when the pane is seen again (`keepWhileHidden`);
 * everything written on the pane follows the readings only while it is seen,
 * since nobody reads it meanwhile - not even the last reading that lands as a
 * source is let go.
 */
const liveLoad = $derived(metrics.sample('cpu.load'))
const live = $derived({
  info: metrics.get('cpu.info'),
  load: liveLoad,
  speed: metrics.get('cpu.speed'),
  temperature: metrics.get('cpu.temperature'),
  processes: metrics.get('proc.list'),
})
let shown = $state.raw(untrack(() => live))
$effect(() => {
  const next = live
  if (visible) shown = next
})
const info = $derived(shown.info)
const load = $derived(shown.load)
const speed = $derived(shown.speed)
const temperature = $derived(shown.temperature)
const processes = $derived(shown.processes)

const firstHalf = new TimeSeries(CHART_WINDOW_MS + 5000)
const secondHalf = new TimeSeries(CHART_WINDOW_MS + 5000)

const cores = $derived(load?.data.cores ?? [])
const half = $derived(Math.max(1, Math.ceil(cores.length / 2)))

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

const firstAvg = $derived(average(cores.slice(0, half)))
const secondAvg = $derived(average(cores.slice(half)))

$effect(() => {
  const sample = liveLoad
  if (sample === null) return
  const all = sample.data.cores
  const middle = Math.max(1, Math.ceil(all.length / 2))
  firstHalf.push(sample.at, average(all.slice(0, middle)))
  secondHalf.push(sample.at, average(all.slice(middle)))
})

// eDEX-UI printed the brand in the module title's right-hand slot.
$effect(() => {
  // systeminformation's brand usually already names the maker ("Gen Intel® Core™
  // i5"), so prefixing the manufacturer would say it twice.
  const brand = info
    ? info.brand.toLowerCase().includes(info.manufacturer.toLowerCase())
      ? info.brand
      : `${info.manufacturer} ${info.brand}`.trim()
    : ''
  paneMeta.set(paneId, { subtitle: brand.length > 30 ? `${brand.slice(0, 30)}…` : brand })
})

const temperatureAvailable = $derived(temperature !== null && temperature.main !== null)
</script>

<div class="cpu" data-testid="cpu" data-view={view}>
  {#if view === 'bars'}
    <div class="bars-head">
      <span class="range">all <em>{cores.length}</em> cores</span>
      <span class="avg">Avg. {formatPercent(average(cores))}</span>
    </div>
    <ol
      class="bars"
      style:--columns={Math.min(cores.length, cores.length > 16 ? Math.ceil(cores.length / 2) : 16)}
      data-testid="cpu-bars"
    >
      {#each cores as value, i (i)}
        <li class:hot={value >= HOT_CORE} data-testid="cpu-core" data-load={Math.round(value)}>
          <span class="track">
            <span class="fill" style:transform={`scaleY(${Math.max(0, Math.min(100, value)) / 100})`}></span>
          </span>
          <span class="pct">{Math.round(value)}</span>
          <span class="index">{i + 1}</span>
        </li>
      {/each}
    </ol>
  {:else}
  <div class="row">
    <div class="legend">
      <span class="range"># <em>1</em> - <em>{half}</em></span>
      <span class="avg" data-testid="cpu-avg-1">Avg. {formatPercent(firstAvg)}</span>
    </div>
    <div class="graph">
      <StreamChart series={[{ points: firstHalf.points }]} min={0} max={100} />
    </div>
  </div>

  {#if cores.length > 1}
    <div class="row">
      <div class="legend">
        <span class="range"># <em>{half + 1}</em> - <em>{cores.length}</em></span>
        <span class="avg">Avg. {formatPercent(secondAvg)}</span>
      </div>
      <div class="graph">
        <StreamChart series={[{ points: secondHalf.points }]} min={0} max={100} />
      </div>
    </div>
  {/if}
  {/if}

  <div class="hud-cells hud-dashed stats">
    <div class="hud-cell">
      {#if temperatureAvailable}
        <span class="label">temp</span>
        <span class="value">{Math.round(temperature?.main ?? 0)}°C</span>
      {:else}
        <span class="label">cores</span>
        <span class="value">{info?.cores ?? cores.length ?? '--'}</span>
      {/if}
    </div>
    <div class="hud-cell">
      <span class="label">min</span>
      <span class="value">{speed ? `${speed.min.toFixed(2)}GHz` : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">max</span>
      <span class="value">{speed ? `${speed.max.toFixed(2)}GHz` : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">tasks</span>
      <span class="value" data-testid="cpu-tasks">{processes?.all ?? '--'}</span>
    </div>
    <!-- In the stats row, so it never covers a graph or a bar. -->
    <ViewToggle {view} onchange={setView} testid="cpu-view" inline />
  </div>
</div>

<style>
.cpu {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: 0 var(--space-1);
}

.row {
  display: grid;
  grid-template-columns: minmax(3.6rem, 24%) 1fr;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-height: 1.6rem;
}

.legend {
  display: flex;
  flex-direction: column;
  font-family: var(--font-ui);
  line-height: 1.15;
  white-space: nowrap;
}

.range {
  font-size: var(--step--1);
  letter-spacing: 0.08em;
}

.range em {
  font-style: normal;
  font-weight: 600;
}

.avg {
  font-size: var(--step--1);
  color: var(--text-muted);
}

.graph {
  height: 100%;
  min-height: 0;
  padding: var(--space-1) 0;
}

.bars-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  font-family: var(--font-ui);
  white-space: nowrap;
}

.bars {
  flex: 1;
  min-height: 3rem;
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: var(--space-1) 0.2rem;
  margin: 0;
  padding: var(--space-1) 0;
  list-style: none;
}

.bars li {
  display: grid;
  grid-template-rows: 1fr auto auto;
  justify-items: center;
  min-height: 0;
}

.track {
  position: relative;
  width: 100%;
  max-width: 1.4rem;
  height: 100%;
  min-height: 1rem;
  border: 1px solid var(--panel-rule);
  background: repeating-linear-gradient(
    to top,
    transparent 0 calc(10% - 1px),
    var(--accent-faint) calc(10% - 1px) 10%
  );
}

/* Scaled rather than resized, so an update is a compositor-only change. */
.fill {
  position: absolute;
  inset: 0;
  transform-origin: bottom;
  background: linear-gradient(to top, var(--accent), var(--accent-strong));
  transition: transform 600ms var(--ease-out);
}

.hot .fill {
  background: linear-gradient(to top, var(--warn), var(--danger));
}

.pct {
  font-family: var(--font-display);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.index {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  color: var(--text-muted);
  line-height: 1;
}

.stats {
  flex: 0 0 auto;
  margin: 0 var(--space-2);
  text-align: center;
}

.stats .hud-cell {
  align-items: center;
}
</style>
