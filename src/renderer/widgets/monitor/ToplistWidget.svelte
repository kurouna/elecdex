<script lang="ts">
import { formatPercent } from '../../lib/format.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's top-processes table: PID, name, CPU and memory for the busiest
 * programs. As many rows as fit are shown; the collector already groups a
 * program's processes into one entry.
 */
const { paneId }: WidgetProps = $props()

const list = $derived(metrics.get('proc.list'))

$effect(() => {
  paneMeta.set(paneId, { subtitle: 'PID | NAME | CPU | MEM' })
})
</script>

<div class="toplist" data-testid="toplist">
  <table>
    <tbody>
      {#each list?.top ?? [] as proc (proc.name)}
        <tr data-testid="toplist-row">
          <td class="pid">{proc.pid}</td>
          <td class="name">{proc.name}</td>
          <td class="num">{formatPercent(proc.cpu)}</td>
          <td class="num">{formatPercent(proc.mem)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
.toplist {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  /* More rows than fit: fade the last one out rather than slicing it in half. */
  mask-image: linear-gradient(to bottom, #000 calc(100% - 1.6rem), transparent);
  padding: var(--space-1) var(--space-1) 0;
}

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-family: var(--font-ui);
  font-size: var(--step-0);
  font-variant-numeric: tabular-nums;
}

td {
  padding: 0.05rem 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pid {
  width: 3.2em;
  font-weight: 300;
}

.name {
  padding-left: var(--space-1);
}

.num {
  width: 3.6em;
  text-align: right;
  font-weight: 300;
}
</style>
