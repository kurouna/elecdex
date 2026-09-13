<script lang="ts">
/**
 * A battery drawn to its charge: the body fills from the left, green from 20%
 * up and red below it, with a bolt over it while charging.
 */
interface Props {
  percent: number
  low: boolean
  charging: boolean
}

const { percent, low, charging }: Props = $props()
</script>

<span
  class="gauge"
  class:low
  role="img"
  aria-label={`battery ${percent}%${charging ? ', charging' : ''}`}
  data-testid="battery-gauge"
  data-level={low ? 'low' : 'ok'}
  data-charging={charging}
>
  <svg viewBox="0 0 26 12" aria-hidden="true">
    <rect class="body" x="0.5" y="0.5" width="22" height="11" rx="1.5" />
    <rect class="cap" x="23.2" y="3.5" width="2.3" height="5" rx="0.6" />
    <rect class="fill" x="2" y="2" height="8" width={(19 * percent) / 100} rx="0.6" />
    {#if charging}
      <path class="bolt" d="M12.8 1.2 7.6 6.6h3.6l-1.6 4.2 5.2-5.4h-3.6z" />
    {/if}
  </svg>
</span>

<style>
.gauge {
  --level: var(--ok);
  display: inline-block;
  width: 1.55em;
  height: 0.72em;
  vertical-align: -0.02em;
}

.gauge.low {
  --level: var(--danger);
}

svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.body {
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1;
}

.cap {
  fill: var(--text-muted);
}

.fill {
  fill: var(--level);
}

.bolt {
  fill: var(--text);
  stroke: var(--app-bg);
  stroke-width: 0.8;
  paint-order: stroke;
}
</style>
