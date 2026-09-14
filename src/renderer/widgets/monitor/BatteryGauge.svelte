<script lang="ts">
/**
 * A battery drawn to its charge: the outline in the text colour like everything
 * around it, and only the charge inside coloured - green from 20% up, red below.
 *
 * A bolt stands beside it while power is connected, charging or not: a bolt drawn
 * over the charge was lost in the fill at this size, and a laptop on mains at full
 * charge is not charging but still plugged in.
 */
interface Props {
  percent: number
  low: boolean
  charging: boolean
  plugged: boolean
}

const { percent, low, charging, plugged }: Props = $props()

const condition = $derived(charging ? ', charging' : plugged ? ', plugged in' : '')
</script>

<span
  class="gauge"
  class:low
  class:plugged
  role="img"
  aria-label={`battery ${percent}%${condition}`}
  title={`battery ${percent}%${condition}`}
  data-testid="battery-gauge"
  data-level={low ? 'low' : 'ok'}
  data-charging={charging}
  data-plugged={plugged}
>
  <!-- With the bolt, the view widens to the left to make room for it. -->
  <svg viewBox={plugged ? '-9 0 35 12' : '0 0 26 12'} aria-hidden="true">
    {#if plugged}
      <path class="bolt" d="M-3.4 0.4-8.6 6.9h3.5l-1.3 4.7 5.3-6.6h-3.5z" data-testid="battery-bolt" />
    {/if}
    <rect class="body" x="0.5" y="0.5" width="22" height="11" rx="1.5" />
    <rect class="cap" x="23.2" y="3.5" width="2.3" height="5" rx="0.6" />
    <rect class="fill" x="2" y="2" height="8" width={(19 * percent) / 100} rx="0.6" />
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

/* The bolt adds 9 units to the battery's 26. */
.gauge.plugged {
  width: calc(1.55em * 35 / 26);
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
  stroke: var(--text);
  stroke-width: 1;
}

.cap {
  fill: var(--text);
}

.fill {
  fill: var(--level);
}

.bolt {
  fill: var(--warn);
}
</style>
