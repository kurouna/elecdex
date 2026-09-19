<script lang="ts">
/**
 * Where this machine is talking to, as a bus of country tags.
 *
 * The globe pane answers the same question with a sphere; here it has to sit in
 * one line above a table, so each country is a tag whose bar is its share. It
 * is the first thing read in the pane - "seven of these are leaving the
 * country, and here is where to" - before any single row matters.
 *
 * Nothing animates on its own: the bars change when a reading arrives, which is
 * every few seconds, and a pane nobody can see is not drawing at all.
 */
interface Props {
  /** Country code and how many peers are in it, most first. */
  countries: readonly { code: string; count: number }[]
  /** Peers the database could not place, drawn as one tag at the end. */
  unplaced: number
  /** The code under the pointer, which the rows and the bus light up together. */
  hovered: string | null
  onhover: (code: string | null) => void
}

const { countries, unplaced, hovered, onhover }: Props = $props()

const most = $derived(Math.max(1, ...countries.map((entry) => entry.count)))
</script>

<div class="bus" data-testid="connections-bus">
  {#if countries.length === 0 && unplaced === 0}
    <span class="quiet">no peers outside this network</span>
  {:else}
    {#each countries as entry (entry.code)}
      <button
        type="button"
        class="tag"
        class:lit={hovered === entry.code}
        data-testid="connections-country"
        data-code={entry.code}
        onpointerenter={() => onhover(entry.code)}
        onpointerleave={() => onhover(null)}
        onfocus={() => onhover(entry.code)}
        onblur={() => onhover(null)}
      >
        <span class="code">{entry.code}</span>
        <span class="count">{entry.count}</span>
        <span class="bar" style:--share={`${(entry.count / most) * 100}%`}></span>
      </button>
    {/each}
    {#if unplaced > 0}
      <span class="tag unplaced" title="peers the bundled database could not place">
        <span class="code">··</span>
        <span class="count">{unplaced}</span>
        <span class="bar" style:--share={`${(unplaced / most) * 100}%`}></span>
      </span>
    {/if}
  {/if}
</div>

<style>
.bus {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: flex-end;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
  min-height: 1.6rem;
}

.quiet {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.tag {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.25em;
  padding: 0.1rem 0.35rem 0.25rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
  cursor: default;
}

/* The share, as a rule along the foot of the tag rather than a bar of its own:
   the tag is already the right width to compare, and a second shape in a row
   this small reads as clutter. */
.bar {
  position: absolute;
  inset: auto 0 0 0;
  height: 2px;
  background: linear-gradient(to right, var(--accent) var(--share), transparent var(--share));
  opacity: 0.55;
}

.code {
  color: var(--accent-strong);
  font-weight: 500;
}

.tag.lit {
  border-color: var(--accent);
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.tag.lit .bar {
  opacity: 1;
}

.unplaced .code {
  color: var(--text-muted);
}
</style>
