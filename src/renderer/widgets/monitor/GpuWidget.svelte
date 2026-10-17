<script lang="ts">
import { untrack } from 'svelte'
import { formatPercent } from '../../lib/format.ts'
import { CHART_WINDOW_MS } from '../../lib/frame-loop.ts'
import { TimeSeries } from '../../lib/time-series.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import StreamChart from '../common/StreamChart.svelte'
import type { WidgetProps } from '../registry.ts'
import { engineFigures, memoryFraction, memoryText } from './gpu-view.ts'

/**
 * The GPU over the last minute, drawn as the memory pane is: its load as a
 * scrolling line, the share of its own memory in use as a dimmer one, the
 * engine kinds' loads under them, and bars for the memory now - what a model
 * run locally, a game or a video encode leans on, and the CPU pane never saw.
 *
 * The busiest engine is the load, as Task Manager counts it. A machine whose
 * GPU cannot be read (macOS, most of Linux) is told so, not shown zeros.
 */
const { paneId, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

/** Sampled behind a tab for the chart (`keepWhileHidden`); the figures follow only while seen. */
const live = $derived(metrics.sample('gpu.usage'))
let usage = $state.raw(untrack(() => live))
$effect(() => {
  const next = live
  if (visible) usage = next
})

const loadSeries = new TimeSeries(CHART_WINDOW_MS + 5000)
const vramSeries = new TimeSeries(CHART_WINDOW_MS + 5000)

$effect(() => {
  const sample = live
  if (sample === null || sample.data.load === null) return
  const vram = memoryFraction(sample.data.vramUsed, sample.data.vramTotal)
  untrack(() => {
    loadSeries.push(sample.at, sample.data.load ?? 0)
    if (vram !== null) vramSeries.push(sample.at, vram * 100)
  })
})

const data = $derived(usage?.data ?? null)
/** Known only once a reading has said so: before it, the pane waits rather than says none. */
const none = $derived(data !== null && data.name === null)
const vram = $derived(memoryFraction(data?.vramUsed ?? null, data?.vramTotal ?? null))
const shared = $derived(memoryFraction(data?.sharedUsed ?? null, data?.sharedTotal ?? null))
const engines = $derived(engineFigures(data))

$effect(() => {
  paneMeta.set(paneId, { subtitle: data?.name ?? '' })
})
</script>

<div class="gpu" data-testid="gpu">
  {#if none}
    <p class="none" data-testid="gpu-none">NO GPU READING ON THIS MACHINE</p>
  {:else}
    <div class="row">
      <div class="legend">
        <span class="range">load</span>
        <span class="pct" data-testid="gpu-load">{data?.load != null ? formatPercent(data.load) : '--'}</span>
        <span class="vram-key">vram {vram !== null ? formatPercent(vram * 100) : '--'}</span>
      </div>
      <div class="graph" data-testid="gpu-chart">
        <StreamChart
          series={[{ points: loadSeries.points }, { points: vramSeries.points, tone: 'dim' }]}
          min={0}
          max={100}
        />
      </div>
    </div>

    {#if engines.length > 0}
      <div class="engines" data-testid="gpu-engines">
        {#each engines as engine (engine.key)}
          <span class="engine"><span class="label">{engine.label}</span> {Math.round(engine.value)}</span>
        {/each}
      </div>
    {/if}

    <div class="bars">
      <span class="label">vram</span>
      <span class="bar" data-testid="gpu-vram-bar" data-fraction={(vram ?? 0).toFixed(3)}
        ><span class="fill" style:transform={`scaleX(${vram ?? 0})`}></span></span
      >
      <span class="amount" data-testid="gpu-vram">{memoryText(data?.vramUsed ?? null, data?.vramTotal ?? null)}</span>
      <span class="label">shared</span>
      <span class="bar"><span class="fill" style:transform={`scaleX(${shared ?? 0})`}></span></span>
      <span class="amount">{memoryText(data?.sharedUsed ?? null, data?.sharedTotal ?? null)}</span>
    </div>
  {/if}
</div>

<style>
.gpu {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: 0 var(--space-1);
}

.none {
  margin: auto;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  color: var(--text-muted);
  text-align: center;
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
  text-transform: uppercase;
}

.pct {
  font-family: var(--font-display);
  font-size: var(--step-0);
  font-variant-numeric: tabular-nums;
}

.vram-key {
  font-size: var(--step--2);
  color: var(--text-muted);
  text-transform: uppercase;
}

.graph {
  height: 100%;
  min-height: 0;
  padding: var(--space-1) 0;
}

.engines {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-3);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
}

.engine .label {
  color: var(--text-muted);
}

/* One grid for both rows, as the memory pane's. */
.bars {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.1rem var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.label {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.amount {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.bar {
  position: relative;
  height: 0.4rem;
  border-right: 1px solid var(--panel-border);
}

.bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--accent-dim);
}

/* Scaled, not resized, and not animated: as the memory pane's, a glide each second costs a core's few percent. */
.fill {
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  width: 100%;
  background: var(--accent);
  transform-origin: left;
}
</style>
