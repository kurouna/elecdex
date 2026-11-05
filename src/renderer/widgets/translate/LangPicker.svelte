<script lang="ts">
import { crtPower } from '../../lib/crt-transitions.ts'
import { pickerRows } from './translate-view.ts'

/**
 * A language for one side (docs/translate.md §3): a filter, the recent ones first, then the 53
 * (and Easy Japanese under Japanese on the target side; AUTO on the source side). It belongs to the
 * pane, drawn inside it and powering on and off as everything over the workspace does.
 */
interface Props {
  side: 'src' | 'tgt'
  current: string
  recent: readonly string[]
  onpick: (code: string) => void
  onclose: () => void
}

const { side, current, recent, onpick, onclose }: Props = $props()

let filter = $state('')
let input = $state<HTMLInputElement | null>(null)
let pop = $state<HTMLDivElement | null>(null)
const rows = $derived(pickerRows(side, recent, filter))

$effect(() => {
  input?.focus()
})

/** A press anywhere but here and its own button (which toggles it) closes it. */
function outside(event: PointerEvent): void {
  const anchor = pop?.parentElement
  if (anchor && event.target instanceof Node && !anchor.contains(event.target)) onclose()
}

function onkey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    onclose()
    return
  }
  if (event.key === 'Enter' && !event.isComposing) {
    const first = rows[0]
    if (first) onpick(first.code)
  }
}
</script>

<svelte:window onpointerdown={outside} />

<div
  bind:this={pop}
  class="pop crt-on"
  data-testid="translate-lang-{side}"
  role="dialog"
  aria-label={side === 'src' ? 'Translate from' : 'Translate into'}
  tabindex="-1"
  transition:crtPower
  onkeydown={onkey}
>
  <input
    bind:this={input}
    bind:value={filter}
    class="filter"
    placeholder="filter: code or name"
    aria-label="Filter the languages"
    spellcheck="false"
  />
  <div class="list" role="listbox" aria-label="Languages">
    {#each rows as row, i (`${row.group}:${row.code}`)}
      {#if i === 0 || rows[i - 1]?.group !== row.group}
        <div class="g">{row.group === 'recent' ? 'Recent' : 'All'}</div>
      {/if}
      <button
        type="button"
        class="li"
        role="option"
        aria-selected={row.code === current}
        data-code={row.code}
        onclick={() => onpick(row.code)}
      >
        <span class="m">{row.code === current ? '◆' : ''}</span>
        <span class="c">{row.code === 'auto' ? 'auto' : row.code}</span>
        <span class="n">{row.native}</span>
        <span class="e">{row.english}</span>
      </button>
    {/each}
    {#if rows.length === 0}<div class="g">No language matches.</div>{/if}
  </div>
</div>

<style>
.pop {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  width: 19rem;
  max-height: min(22rem, 60vh);
  display: flex;
  flex-direction: column;
  background: var(--panel-bg-raised);
  border: 1px solid var(--panel-border);
  box-shadow: 0 0.5rem 1.8rem rgb(0 0 0 / 0.45);
}
.filter {
  margin: var(--space-1);
  flex: none;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  outline: none;
}
.filter:focus {
  border-color: var(--accent);
}
.list {
  overflow-y: auto;
  padding-bottom: 0.3rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}
.g {
  padding: 0.35rem 0.6rem 0.15rem;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
  text-transform: uppercase;
}
.li {
  display: grid;
  grid-template-columns: 0.7rem 4.2rem minmax(0, 1fr) auto;
  gap: 0.4rem;
  align-items: baseline;
  width: 100%;
  padding: 0.12rem 0.6rem;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
}
.li:hover,
.li:focus-visible {
  background: var(--accent-faint);
  outline: none;
}
.c {
  color: var(--accent-strong);
  font-weight: 700;
  text-transform: uppercase;
  font-size: var(--step--2);
}
.n {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.e {
  color: var(--text-muted);
  font-size: var(--step--2);
  font-family: var(--font-ui);
  letter-spacing: 0.04em;
}
.m {
  color: var(--accent);
  font-size: var(--step--2);
}
</style>
