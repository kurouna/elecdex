<script lang="ts">
import type { DiskVolume } from '@shared/metrics'
import { fillLevel, formatBytes, formatPercent, formatRate } from '../../lib/format.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * Disks: how full each volume is, and what the disks are doing now.
 *
 * Capacity moves too slowly for a graph to say anything, so each volume is a bar
 * of used against its size, turning amber from 90% and red from 97%, with the
 * space left spelled out and what kind of volume it is. Above them, activity:
 * read and write rates and how busy the disks are, which does change second to
 * second and is what explains a slow machine.
 */
const { paneId }: WidgetProps = $props()

const volumes = $derived(metrics.get('disk.volumes')?.volumes ?? [])
const io = $derived(metrics.get('disk.io'))

const fraction = (v: DiskVolume): number => (v.total > 0 ? Math.min(1, v.used / v.total) : 0)

const name = (v: DiskVolume): string => (v.label ? `${v.mount} ${v.label}` : v.mount)

$effect(() => {
  const total = volumes.reduce((sum, v) => sum + v.total, 0)
  const free = volumes.reduce((sum, v) => sum + (v.total - v.used), 0)
  paneMeta.set(paneId, {
    subtitle: volumes.length === 0 ? '' : `${formatBytes(free)} FREE OF ${formatBytes(total)}`,
  })
})
</script>

<div class="disk" data-testid="disk">
  <div class="hud-cells io">
    <div class="hud-cell">
      <span class="label">read</span>
      <span class="value" data-testid="disk-read">{io ? formatRate(io.readSec) : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">write</span>
      <span class="value" data-testid="disk-write">{io ? formatRate(io.writeSec) : '--'}</span>
    </div>
    <div class="hud-cell">
      <span class="label">busy</span>
      <span class="value">{io?.busy != null ? formatPercent(io.busy) : '--'}</span>
    </div>
  </div>

  <ul class="volumes">
    {#each volumes as v (v.mount)}
      {@const used = fraction(v)}
      <li
        class={fillLevel(used)}
        data-testid="disk-volume"
        data-mount={v.mount}
        data-fraction={used.toFixed(3)}
      >
        <span class="name" title={v.mount}>{name(v)}</span>
        <span class="meta">{[v.fs, v.kind === 'fixed' ? '' : v.kind].filter(Boolean).join(' · ')}</span>
        <span class="pct">{formatPercent(used * 100)}</span>
        <span class="bar"><span class="fill" style:transform={`scaleX(${used})`}></span></span>
        <span class="amount">{formatBytes(v.used)} / {formatBytes(v.total)}</span>
        <span class="free">{formatBytes(v.total - v.used)} free</span>
      </li>
    {:else}
      <li class="empty">reading volumes…</li>
    {/each}
  </ul>
</div>

<style>
.disk {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
}

.io {
  padding-top: 0;
}

.io .value {
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
}

.volumes {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0 var(--space-1);
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.volumes li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas:
    'name meta pct'
    'bar bar bar'
    'amount amount free';
  align-items: baseline;
  column-gap: var(--space-2);
  padding: 0.15rem 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.volumes li + li {
  border-top: 1px solid var(--panel-rule);
}

.name {
  grid-area: name;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.meta {
  grid-area: meta;
  overflow: hidden;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--step--2);
  text-transform: uppercase;
}

.pct {
  grid-area: pct;
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

.amount,
.free {
  color: var(--text-muted);
  font-size: var(--step--2);
  font-variant-numeric: tabular-nums;
}

.amount {
  grid-area: amount;
}

.free {
  grid-area: free;
}

/* The memory pane's two-part bar: a thin track and a thicker value, with an end cap. */
.bar {
  grid-area: bar;
  position: relative;
  height: 0.45rem;
  margin: 0.1rem 0;
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
  top: 20%;
  height: 60%;
  background: var(--accent);
  /* Scaled, not resized: a width change would re-run layout on every animation frame. */
  width: 100%;
  transform-origin: left;
  transition: transform var(--dur-panel) var(--ease-out);
}

.warn .fill {
  background: var(--warn);
}

.full .fill {
  background: var(--danger);
}

.warn .pct {
  color: var(--warn);
}

.full .pct {
  color: var(--danger);
}

.empty {
  color: var(--text-muted);
  font-size: var(--step--1);
}
</style>
