<script lang="ts">
import type { HistoryRow } from '@shared/translate/history'
import { onBoundary } from '../../lib/frame-loop.ts'
import { historyDays, historyPair, historyTime } from './translate-view.ts'

/**
 * HISTORY (docs/translate.md §3, §7): main's entries, newest first, by day, filtered by what they
 * say. A row opens in TEXT; CLEAR asks by its second press. The list is asked for when the view
 * opens and again when main says the history changed (the board's `library`).
 */
interface Props {
  revision: number
  saving: boolean
  onopen: (row: HistoryRow) => void
}

const { revision, saving, onopen }: Props = $props()
const api = window.elecdex.translate

let rows = $state.raw<HistoryRow[] | null>(null)
let filter = $state('')
let armed = $state(false)
let armTimer: ReturnType<typeof setTimeout> | null = null

$effect(() => {
  void revision
  let live = true
  void api.history().then((next) => {
    if (live) rows = next
  })
  return () => {
    live = false
  }
})

$effect(() => () => {
  if (armTimer !== null) clearTimeout(armTimer)
})

// Today and Yesterday move on at midnight: checked on the hour, assigned only when the day changed.
let today = $state(new Date().toDateString())
$effect(() =>
  onBoundary(3_600_000, () => {
    const now = new Date().toDateString()
    if (now !== today) today = now
  }),
)
const days = $derived.by(() => {
  void today
  return historyDays(rows ?? [], filter, Date.now())
})

function clear(): void {
  if (armTimer !== null) clearTimeout(armTimer)
  if (!armed) {
    armed = true
    armTimer = setTimeout(() => (armed = false), 3000)
    return
  }
  armed = false
  void api.historyClear()
}
</script>

<div class="history" data-testid="translate-history">
  <div class="bar">
    <input class="search" bind:value={filter} placeholder="filter" aria-label="Filter the history" spellcheck="false" />
    <span class="count">{rows?.length ?? 0} / 200{saving ? '' : ' · not saving'}</span>
    <button type="button" class="btn" class:warn={armed} disabled={(rows?.length ?? 0) === 0} data-testid="translate-history-clear" onclick={clear}>{armed ? 'Clear all?' : 'Clear'}</button>
  </div>
  <div class="list">
    {#each days as day (day.label)}
      <div class="sep">{day.label}</div>
      {#each day.rows as row (row.id)}
        <div class="row" data-testid="translate-history-row">
          <button type="button" class="open" onclick={() => onopen(row)}>
            <span class="t">{historyTime(row.updatedAt)}</span>
            <span class="p">{historyPair(row)}</span>
            <span class="f">{row.form ?? ''}{row.partial ? ` ${row.partial.done}/${row.partial.total}` : ''}</span>
            <span class="x">{row.source}</span>
            <span class="n">{row.chars.toLocaleString('en-US')} ch</span>
          </button>
          <button type="button" class="rm" aria-label="Remove this entry" onclick={() => void api.historyRemove(row.id)}>×</button>
        </div>
      {/each}
    {:else}
      <p class="empty">{rows === null ? '' : filter ? 'Nothing matches.' : 'Nothing translated yet.'}</p>
    {/each}
  </div>
</div>

<style>
.history { container-type: inline-size; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--space-1); }
.bar { display: flex; align-items: center; gap: var(--space-2); }
.search { flex: 1 1 10rem; min-width: 0; background: transparent; border: 1px solid var(--panel-rule); color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); padding: 0.1rem 0.4rem; outline: none; }
.search:focus { border-color: var(--accent); }
.count { font-family: var(--font-mono); font-size: var(--step--2); color: var(--text-muted); }
.list { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--accent-dim) transparent; }
.sep { display: flex; align-items: center; gap: 0.6rem; margin: 0.5rem 0.2rem 0.25rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.sep::after { content: ""; flex: 1; border-top: 1px dashed var(--panel-rule); }
.row { display: flex; align-items: stretch; }
.open { flex: 1; min-width: 0; display: grid; grid-template-columns: 3rem 6.4rem 4.2rem minmax(0, 1fr) 4.6rem; gap: 0.7rem; align-items: baseline; padding: 0.25rem 0.4rem; border: 0; border-left: 2px solid transparent; background: transparent; text-align: left; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text); }
.open:hover, .open:focus-visible { background: var(--accent-faint); border-left-color: var(--accent); outline: none; }
.t, .n { color: var(--text-muted); font-size: var(--step--2); }
.n { text-align: right; }
.p { color: var(--accent-strong); font-weight: 500; white-space: nowrap; }
.f { font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); text-transform: uppercase; }
.x { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-ui); font-size: var(--step--1); }
.rm { border: 0; background: transparent; color: var(--text-muted); padding: 0 0.5rem; }
.rm:hover { color: var(--danger); }
.empty { margin: 1rem; color: var(--text-muted); font-size: var(--step--1); }
.btn { background: transparent; border: 1px solid var(--panel-border); padding: 0.05rem 0.55rem; color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; white-space: nowrap; }
.btn:not(:disabled):hover { color: var(--accent); border-color: var(--accent); }
.btn:disabled { opacity: 0.45; }
.btn.warn { border-color: var(--warn); color: var(--warn); }
@container (max-width: 34rem) {
  .open { grid-template-columns: 2.8rem 5.6rem minmax(0, 1fr); }
  .f, .n { display: none; }
}
</style>
