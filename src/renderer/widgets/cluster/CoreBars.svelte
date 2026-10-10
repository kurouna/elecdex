<script lang="ts">
import { cpuLevel, groupCores } from '@shared/cluster'

/**
 * Every logical core's load now - no history (user decision 2026-10-10) - a bar
 * each, numbered every fourth. Beyond MAX_CORE_BARS neighbours are put together
 * at their busiest. A bar steps to its new height in two frames of the loop.
 */
interface Props {
  cores: readonly number[]
}

const { cores }: Props = $props()

const bars = $derived(groupCores(cores))
/** How many cores each bar stands for, so its number is the first of them. */
const per = $derived(bars.length === 0 ? 1 : Math.ceil(cores.length / bars.length))
</script>

<div class="cores" data-testid="cluster-cores" role="img" aria-label="load of each core">
  {#each bars as load, i (i)}
    <span class="core" data-level={cpuLevel(load)}>
      <i style:--fill={Math.min(1, Math.max(0, load / 100))}></i>
      <em class:shown={i % 4 === 0}>{i * per}</em>
    </span>
  {/each}
</div>

<style>
.cores {
  display: grid;
  grid-auto-flow: column;
  /* Bars no wider than a lane's thin ones read: spread over the row, never slabs. */
  grid-auto-columns: minmax(0, 1.4rem);
  justify-content: space-between;
  gap: 3px;
  height: 100%;
  min-height: 0;
}

.core {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-height: 0;
}

.core::before,
.core i {
  grid-area: 1 / 1;
}

.core::before {
  content: '';
  border-bottom: 1px solid var(--panel-rule);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.core i {
  background: var(--accent);
  transform-origin: bottom;
  transform: scaleY(var(--fill, 0));
  transition: transform calc(200ms * var(--motion-scale)) steps(2, end);
}

.core[data-level='warn'] i {
  background: var(--warn);
}

.core[data-level='crit'] i {
  background: var(--danger);
}

em {
  visibility: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-style: normal;
  line-height: 1.3;
  text-align: center;
  color: var(--text-muted);
}

em.shown {
  visibility: visible;
}
</style>
