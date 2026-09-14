<script lang="ts">
/** "↑ 3 new": over the top of a scrolled list, taking the user back up to what arrived. */
interface Props {
  count: number
  onjump: () => void
  testid: string
}

const { count, onjump, testid }: Props = $props()
</script>

{#if count > 0}
  <button type="button" class="pill fx-rise" onclick={onjump} data-testid={testid}>
    <span aria-hidden="true">↑</span> {count} new
  </button>
{/if}

<style>
.pill {
  position: absolute;
  top: var(--space-1);
  left: 50%;
  z-index: 2;
  translate: -50% 0;
  padding: 0 var(--space-2);
  border: 1px solid var(--accent);
  background: var(--app-bg);
  box-shadow: 0 0 8px var(--accent-dim);
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
}

.pill:hover {
  background: var(--accent);
  color: var(--text-inverse);
}
</style>
