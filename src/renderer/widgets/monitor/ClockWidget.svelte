<script lang="ts">
import { formatClock } from '../../lib/format.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's clock: large light digits, each in a fixed-width cell so the time
 * does not jitter as numerals change width.
 *
 * Ticks on its own timer aligned to the second boundary, rather than an
 * unaligned setInterval that would drift visibly behind the system clock.
 */
const { paneId }: WidgetProps = $props()

let now = $state(new Date())

$effect(() => {
  let timer: ReturnType<typeof setTimeout>
  const schedule = (): void => {
    timer = setTimeout(
      () => {
        now = new Date()
        schedule()
      },
      1000 - (Date.now() % 1000) + 5,
    )
  }
  schedule()
  return () => clearTimeout(timer)
})

const parts = $derived(formatClock(now))
const digits = $derived([...parts.hh, ':', ...parts.mm, ':', ...parts.ss])
</script>

<div class="clock" data-testid="clock" data-pane-id={paneId}>
  <time datetime={now.toISOString()}>
    {#each digits as char, i (i)}
      {#if char === ':'}<em>:</em>{:else}<span>{char}</span>{/if}
    {/each}
  </time>
</div>

<style>
.clock {
  container-type: size;
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 2rem;
}

time {
  display: flex;
  align-items: center;
  font-family: var(--font-ui);
  font-weight: 300;
  /* Fill the pane: bounded by both its height and its width. */
  font-size: min(92cqh, 19cqw);
  line-height: 1;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

span {
  display: inline-block;
  width: 0.62em;
  text-align: center;
}

em {
  display: inline-block;
  width: 0.4em;
  text-align: center;
  font-style: normal;
  opacity: 0.8;
}
</style>
