<script lang="ts">
import type { SpecItem } from './cluster-view.ts'

/**
 * What the machine is, on one line, like a vehicle's type plate: the same facts the
 * standard layout's system column gives, which the cockpit preset leaves out. Set
 * quieter than the live figures, so what does not change does not read as a reading;
 * a value too long for its room is cut, and the card has it whole.
 */
interface Props {
  items: readonly SpecItem[]
  /**
   * One line (0), or a grid of this many columns: four in a medium pane, two in a narrow one,
   * where the OS and the CPU take a whole row.
   */
  columns?: number
  onhover: (event: { box: DOMRect; x: number | null } | null) => void
}

const { items, columns = 0, onhover }: Props = $props()

let el = $state<HTMLElement | null>(null)
const enter = (x: number | null): void => {
  if (el !== null) onhover({ box: el.getBoundingClientRect(), x })
}
</script>

<!-- Focusable so the keyboard reaches its card, as a pointer resting on it does. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<dl
  bind:this={el}
  class="spec"
  class:grid={columns > 0}
  class:two={columns === 2}
  style:--columns={columns > 0 ? columns : undefined}
  data-testid="cluster-spec"
  aria-label="this machine"
  tabindex="0"
  onpointerenter={(event) => enter(event.clientX)}
  onpointerleave={() => onhover(null)}
  onfocus={(event) => {
    if (event.currentTarget.matches(':focus-visible')) enter(null)
  }}
  onblur={() => onhover(null)}
>
  {#each items as item (item.key)}
    <div class="item" data-spec={item.key}>
      <dt>{item.label}</dt>
      <dd>{item.value}</dd>
    </div>
  {/each}
</dl>

<style>
/* One line, each item as wide as what it says and the room left over spread between them.
   A line too short for all of them cuts them, the OS first and most (the card has it whole).
   Medium and narrow panes set them out as a grid instead. */
.spec {
  display: flex;
  justify-content: space-between;
  gap: 0.3rem 1.6rem;
  margin: 0;
  padding: 0.45rem 0 0.1rem;
  border-top: 1px solid var(--panel-rule);
}

.spec:focus-visible {
  outline: 1px solid var(--accent-strong);
  outline-offset: 2px;
}

.spec.grid {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: 0.35rem 1.2rem;
}

/* Two columns: the OS and the CPU a row each, the short ones paired in the cells left over. */
.spec.two {
  grid-auto-flow: row dense;
}

.spec.two .item[data-spec='os'],
.spec.two .item[data-spec='cpu'] {
  grid-column: 1 / -1;
}

.item {
  display: grid;
  flex: 0 1 auto;
  gap: 0.15rem;
  min-width: 0;
  max-width: 100%;
}

.item[data-spec='os'] {
  flex-shrink: 4;
}

dt {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 500;
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
  white-space: nowrap;
}

dd {
  margin: 0;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
