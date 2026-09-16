<script lang="ts">
import type { ChartSeries, Tone } from '@shared/plugin-api'
import { appearance } from '../stores/appearance.svelte.ts'
import { drawChart } from './chart-draw.ts'
import { axisTime } from './ticker.svelte.ts'

/**
 * A plugin's chart: series over fixed axes, with limit lines and labels, drawn on a canvas
 * in the theme's colours. It is drawn when its data, size or theme changes - never on a
 * loop - since a plugin sends a new chart whenever it has something new to show.
 */
interface Props {
  height?: number | undefined
  x: { min: number; max: number; time?: boolean | undefined }
  y: { min: number; max: number; unit?: string | undefined }
  series: readonly ChartSeries[]
  rules?:
    | readonly {
        x?: number | undefined
        y?: number | undefined
        label?: string | undefined
        tone?: Tone | undefined
      }[]
    | undefined
  labels?: readonly { x: number; y: number; text: string; tone?: Tone | undefined }[] | undefined
}

const { height = 96, x, y, series, rules = [], labels = [] }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let width = $state(0)

$effect(() => {
  void appearance.revision
  if (canvas !== null) drawChart(canvas, width, height, { x, y, series, rules, labels })
})

const unit = $derived(y.unit ?? '')
const fmt = (v: number) => (x.time ? axisTime(v, x.max - x.min) : String(Math.round(v * 100) / 100))
</script>

<div class="chart" data-testid="plugin-chart">
  <div class="plot" bind:clientWidth={width} style:height={`${height}px`}>
    <canvas bind:this={canvas} style:width={`${width}px`} style:height={`${height}px`}></canvas>
    <span class="y top">{y.max}{unit}</span>
    <span class="y bottom">{y.min}{unit}</span>
  </div>
  <div class="x"><span>{fmt(x.min)}</span><span>{fmt(x.max)}</span></div>
</div>

<style>
.chart {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.plot {
  position: relative;
  border-bottom: 1px solid var(--panel-rule);
}

canvas {
  display: block;
}

.y {
  position: absolute;
  right: 0.1rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  pointer-events: none;
}

.top {
  top: 0;
}

.bottom {
  bottom: 0.1rem;
}

.x {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
