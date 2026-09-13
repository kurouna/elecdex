<script lang="ts">
import { formatTotal, toMegabytesPerSecond } from '../../lib/format.ts'
import { TimeSeries } from '../../lib/time-series.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import StreamChart from '../common/StreamChart.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's network traffic: running totals, then upload above the axis and
 * download mirrored below it, on a scrolling graph labelled in MB/s.
 */
const { paneId }: WidgetProps = $props()

const WINDOW_MS = 60_000

const sample = $derived(metrics.sample('net.throughput'))
const ping = $derived(metrics.get('net.ping'))

const up = new TimeSeries(WINDOW_MS + 5000)
const down = new TimeSeries(WINDOW_MS + 5000)

$effect(() => {
  if (sample === null) return
  up.push(sample.at, toMegabytesPerSecond(sample.data.txSec))
  down.push(sample.at, toMegabytesPerSecond(sample.data.rxSec))
})

$effect(() => {
  paneMeta.set(paneId, { subtitle: 'UP / DOWN, MB/S' })
})

const offline = $derived(ping !== null && ping.ms === null)

// Both halves share one scale, so the larger of the two directions sets it.
const peak = $derived(
  Math.max(0.01, ...up.points.map((p) => p.v), ...down.points.map((p) => p.v)) * 1.15,
)
</script>

<div class="throughput" data-testid="throughput">
  <div class="totals">
    <span>total</span>
    <span class="figures" data-testid="net-totals">
      {sample
        ? `${formatTotal(sample.data.txTotal)} OUT, ${formatTotal(sample.data.rxTotal)} IN`
        : '--'}
    </span>
  </div>

  <div class="charts">
    <!-- One graph, as in the original: upload above the zero axis, download mirrored below. -->
    <StreamChart
      series={[{ points: up.points }, { points: down.points, inverted: true }]}
      min={-peak}
      max={peak}
      windowMs={WINDOW_MS}
      delayMs={2000}
      divisions={4}
      zeroLine
      labels
      label={(v) => v.toFixed(2)}
    />
    {#if offline}<p class="offline" data-testid="net-offline">offline</p>{/if}
  </div>
</div>

<style>
.throughput {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: 0 var(--space-1);
}

.totals {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step-0);
  font-weight: 300;
  text-transform: uppercase;
  color: var(--text-muted);
  white-space: nowrap;
}

.figures {
  overflow: hidden;
  text-overflow: ellipsis;
}

.charts {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.offline {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: var(--step-2);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--danger);
  background: hsl(0 0% 0% / 0.55);
}
</style>
