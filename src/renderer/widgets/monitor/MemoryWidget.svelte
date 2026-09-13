<script lang="ts">
import { untrack } from 'svelte'
import { formatBytes, formatPercent } from '../../lib/format.ts'
import { TimeSeries } from '../../lib/time-series.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import StreamChart from '../common/StreamChart.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * Memory over the last three minutes, drawn like the CPU graph: the share in use as a
 * scrolling line, swap as a dimmer one, and below them bars for the amounts now.
 *
 * eDEX-UI showed a field of 440 dots lit in a scattered order. They said no more
 * than the percentage did, and nothing about how it changed; the graph shows a
 * leak or a spike at a glance.
 */
const { paneId }: WidgetProps = $props()

/**
 * Three minutes: memory moves slowly, a longer window shows a trend better, and
 * the chart redraws a third as often as a one-minute one (about 2% of a core less).
 */
const WINDOW_MS = 180_000

const usage = $derived(metrics.sample('mem.usage'))
const swap = $derived(metrics.get('mem.swap'))

const usedSeries = new TimeSeries(WINDOW_MS + 5000)
const swapSeries = new TimeSeries(WINDOW_MS + 5000)

const usedFraction = $derived(
  usage && usage.data.total > 0 ? Math.min(1, usage.data.used / usage.data.total) : 0,
)
const swapFraction = $derived(swap && swap.total > 0 ? Math.min(1, swap.used / swap.total) : 0)

$effect(() => {
  if (usage === null) return
  const at = usage.at
  const used = usedFraction * 100
  // Swap is sampled less often; its line carries the last reading forward, on
  // the memory samples' clock rather than adding points of its own.
  untrack(() => {
    usedSeries.push(at, used)
    if (swap !== null) swapSeries.push(at, swapFraction * 100)
  })
})

const GIB = 1024 ** 3

// "USING 3.4 OUT OF 7.7 GIB", as in the original's title row.
$effect(() => {
  const data = usage?.data
  paneMeta.set(paneId, {
    subtitle: data
      ? `USING ${(data.used / GIB).toFixed(1)} OUT OF ${(data.total / GIB).toFixed(1)} GIB`
      : '',
  })
})
</script>

<div class="memory" data-testid="memory">
  <div class="row">
    <div class="legend">
      <span class="range">used</span>
      <span class="pct" data-testid="memory-used-pct">{usage ? formatPercent(usedFraction * 100) : '--'}</span>
      <span class="swap-key">swap {swap ? formatPercent(swapFraction * 100) : '--'}</span>
    </div>
    <div class="graph" data-testid="memory-chart">
      <StreamChart
        series={[{ points: usedSeries.points }, { points: swapSeries.points, tone: 'dim' }]}
        min={0}
        max={100}
        windowMs={WINDOW_MS}
        delayMs={1500}
      />
    </div>
  </div>

  <div class="bars">
    <span class="label">used</span>
    <span class="bar" data-testid="memory-used-bar" data-fraction={usedFraction.toFixed(3)}
      ><span class="fill" style:transform={`scaleX(${usedFraction})`}></span></span
    >
    <span class="amount">{usage ? formatBytes(usage.data.used) : '--'}</span>
    <span class="label">swap</span>
    <span class="bar"><span class="fill" style:transform={`scaleX(${swapFraction})`}></span></span>
    <span class="amount">{swap ? formatBytes(swap.used) : '--'}</span>
  </div>
</div>

<style>
.memory {
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
  text-transform: uppercase;
}

.pct {
  font-family: var(--font-display);
  font-size: var(--step-0);
  font-variant-numeric: tabular-nums;
}

.swap-key {
  font-size: var(--step--2);
  color: var(--text-muted);
  text-transform: uppercase;
}

.graph {
  height: 100%;
  min-height: 0;
  padding: var(--space-1) 0;
}

/* One grid for both rows, so the labels, bars and amounts line up. */
.bars {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.1rem var(--space-2);
  padding-bottom: var(--space-1);
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

/* The original's two-part bar: a thin track and a thicker value, with an end cap. */
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

.fill {
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  background: var(--accent);
  /* Scaled rather than resized, and not animated: memory is sampled every 1.5s,
     and a 420ms glide after each sample kept the compositor busy for a third of
     the time - about 4% of a core at idle, measured. */
  width: 100%;
  transform-origin: left;
}
</style>
