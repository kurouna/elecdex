<script lang="ts">
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * A detail card's facts as rows: a small label, and what it says, wrapped where
 * it must (a path, a command). Under a card's heading, set off by a rule.
 */
interface Props {
  rows: readonly CardRow[]
}

const { rows }: Props = $props()
</script>

<dl data-testid="card-rows">
  {#each rows as row (row.label)}
    <dt>{row.label}</dt>
    <dd class:muted={row.muted === true} data-label={row.label}>{row.value}</dd>
  {/each}
</dl>

<style>
dl {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.1rem 0.7rem;
  margin: 0.35rem 0 0;
  padding-top: 0.3rem;
  border-top: 1px solid var(--panel-rule);
}

dt {
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
  line-height: 1.6;
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}

dd.muted {
  color: var(--text-muted);
}
</style>
