<script lang="ts">
import { cpuLevel, groupCores } from '@shared/cluster'

/**
 * Every logical core's load now - no history (user decision 2026-10-10) - a bar
 * each, numbered every fourth. Beyond MAX_CORE_BARS neighbours are put together
 * at their busiest. A bar takes its new height as the reading arrives, without
 * animation, as the lanes do.
 */
interface Props {
  cores: readonly number[]
}

const { cores }: Props = $props()

const bars = $derived(groupCores(cores))
/** How many cores each bar stands for, so its number is the first of them. */
const per = $derived(bars.length === 0 ? 1 : Math.ceil(cores.length / bars.length))
</script>

<div
  class="cores"
  data-testid="cluster-cores"
  role="img"
  aria-label="load of each core"
  style:--count={Math.max(1, bars.length)}
>
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
  /* Each bar a little over half its core's share of the width, so they widen with the pane
     and the row reads as a set of gauges at any size (user's request 2026-10-10). */
  grid-auto-columns: minmax(0, 1fr);
  column-gap: max(3px, calc(45% / var(--count)));
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
}

.core[data-level='warn'] i {
  background: var(--cluster-warn, var(--warn));
}

.core[data-level='crit'] i {
  background: var(--cluster-crit, var(--danger));
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
