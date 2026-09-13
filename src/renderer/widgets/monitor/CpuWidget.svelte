<script lang="ts">
import { formatPercent } from '../../lib/format.ts'
import { TimeSeries } from '../../lib/time-series.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import StreamChart from '../common/StreamChart.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's CPU module: the cores split into two halves, each with its average
 * load and a scrolling graph, then a dashed row of temperature (or core count
 * where temperature is unavailable), minimum and maximum frequency and task
 * count.
 */
const { paneId }: WidgetProps = $props()

const WINDOW_MS = 60_000

const info = $derived(metrics.get('cpu.info'))
const load = $derived(metrics.sample('cpu.load'))
const speed = $derived(metrics.get('cpu.speed'))
const temperature = $derived(metrics.get('cpu.temperature'))
const processes = $derived(metrics.get('proc.list'))

const firstHalf = new TimeSeries(WINDOW_MS + 5000)
const secondHalf = new TimeSeries(WINDOW_MS + 5000)

const cores = $derived(load?.data.cores ?? [])
const half = $derived(Math.max(1, Math.ceil(cores.length / 2)))

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length

const firstAvg = $derived(average(cores.slice(0, half)))
const secondAvg = $derived(average(cores.slice(half)))

$effect(() => {
  if (load === null) return
  firstHalf.push(load.at, firstAvg)
  secondHalf.push(load.at, secondAvg)
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

<div class="cpu" data-testid="cpu">
  <div class="row">
    <div class="legend">
      <span class="range"># <em>1</em> - <em>{half}</em></span>
      <span class="avg" data-testid="cpu-avg-1">Avg. {formatPercent(firstAvg)}</span>
    </div>
    <div class="graph">
      <StreamChart series={[{ points: firstHalf.points }]} min={0} max={100} windowMs={WINDOW_MS} />
    </div>
  </div>

  {#if cores.length > 1}
    <div class="row">
      <div class="legend">
        <span class="range"># <em>{half + 1}</em> - <em>{cores.length}</em></span>
        <span class="avg">Avg. {formatPercent(secondAvg)}</span>
      </div>
      <div class="graph">
        <StreamChart series={[{ points: secondHalf.points }]} min={0} max={100} windowMs={WINDOW_MS} />
      </div>
    </div>
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
  </div>
</div>

<style>
.cpu {
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
  font-size: var(--step--2);
  color: var(--text-muted);
}

.graph {
  height: 100%;
  min-height: 0;
  padding: var(--space-1) 0;
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
