<script lang="ts">
import {
  DEFAULT_WATCHLIST,
  formatChange,
  formatPrice,
  formatWatchlist,
  isSymbol,
  labelFor,
  labelLanguage,
  type MarketUpdate,
  parseWatchlist,
  type WatchSymbol,
} from '@shared/markets'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import ViewToggle, { type ChartView } from '../common/ViewToggle.svelte'
import type { WidgetProps } from '../registry.ts'
import Sparkline from './Sparkline.svelte'

/**
 * A market board: indices, currencies and whatever else the user lists, from
 * Yahoo Finance, refreshed about once a minute by main.
 *
 *  - Line view: each symbol's session as a sparkline against the previous close,
 *    with the price and the day's change.
 *  - Bar view: the day's change of every symbol as diverging bars on one scale,
 *    so the board's winners and losers read at a glance.
 *
 * Symbols and the view are pane state. Built-in names follow the app's locale
 * (Japanese for ja, English otherwise); labels the user types are kept as typed.
 * Quotes are unofficial and may be delayed, and the pane says so.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const view = $derived<ChartView>(paneState?.view === 'bars' ? 'bars' : 'line')

/** Electron sets navigator.language from the OS display language (or --lang). */
const language = labelLanguage(navigator.language)

const watchlist = $derived.by((): WatchSymbol[] => {
  const raw = paneState?.symbols
  if (!Array.isArray(raw)) return [...DEFAULT_WATCHLIST]
  return raw
    .filter(
      (w): w is WatchSymbol =>
        typeof w === 'object' && w !== null && isSymbol((w as WatchSymbol).symbol),
    )
    .slice(0, 24)
})

let updates = $state.raw<Record<string, MarketUpdate>>({})
/** Symbols whose price just moved, and which way, for a brief flash. */
let flashes = $state.raw<Record<string, 'up' | 'down'>>({})
let editing = $state(false)
let draft = $state('')

$effect(() => {
  const symbols = watchlist.map((w) => w.symbol)
  const offs = symbols.map((symbol) =>
    window.elecdex.markets.subscribe(symbol, (update) => {
      const before = updates[symbol]?.quote?.price
      const after = update.quote?.price
      updates = { ...updates, [symbol]: update }
      if (before !== undefined && after !== undefined && before !== after) {
        flashes = { ...flashes, [symbol]: after > before ? 'up' : 'down' }
        setTimeout(() => {
          const { [symbol]: _done, ...rest } = flashes
          flashes = rest
        }, 900)
      }
    }),
  )
  return () => {
    for (const off of offs) off()
  }
})

interface Row {
  symbol: string
  label: string
  update: MarketUpdate | undefined
}

const rows = $derived<Row[]>(
  watchlist.map((w) => {
    const update = updates[w.symbol]
    return { symbol: w.symbol, label: labelFor(w, language, update?.quote?.name), update }
  }),
)

/** The bar scale: the largest move on the board, at least 1%, rounded up to a half. */
const scale = $derived.by(() => {
  const moves = rows.map((r) => Math.abs(r.update?.quote?.changePercent ?? 0))
  return Math.max(1, Math.ceil(Math.max(0, ...moves) * 2) / 2)
})

$effect(() => {
  const quotes = rows.map((r) => r.update?.quote).filter((q) => q != null)
  const open = quotes.filter((q) => q.state === 'open').length
  const latest = Math.max(0, ...rows.map((r) => r.update?.updatedAt ?? 0))
  const time = latest ? new Date(latest).toTimeString().slice(0, 5) : null
  const error = rows.find((r) => r.update?.error)?.update?.error
  paneMeta.set(paneId, {
    subtitle: time ? `${open} open · updated ${time}` : 'connecting…',
    ...(error ? { badge: 'stale', badgeKind: 'warn' as const } : {}),
  })
})

function setView(next: ChartView): void {
  layout.setPaneState(paneId, { ...paneState, view: next })
}

function startEditing(): void {
  draft = formatWatchlist(watchlist)
  editing = true
}

function saveDraft(): void {
  const parsed = parseWatchlist(draft)
  layout.setPaneState(paneId, {
    ...paneState,
    symbols: parsed.length ? parsed : [...DEFAULT_WATCHLIST],
  })
  editing = false
}

const tone = (row: Row) => {
  const change = row.update?.quote?.change ?? 0
  return change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
}
</script>

<div class="markets" data-testid="markets" data-view={view}>
  <div class="tools">
    <button
      type="button"
      class="edit"
      aria-expanded={editing}
      onclick={() => (editing ? (editing = false) : startEditing())}
      data-testid="markets-edit"
    >
      symbols
    </button>
    <ViewToggle {view} onchange={setView} testid="markets-view" />
  </div>

  {#if editing}
    <form
      class="editor"
      onsubmit={(e) => {
        e.preventDefault()
        saveDraft()
      }}
    >
      <textarea bind:value={draft} rows="3" spellcheck="false" data-testid="markets-symbols"></textarea>
      <div class="editor-bar">
        <span>Yahoo symbols, comma separated, each optionally followed by a label · <code>^N225 日経平均, JPY=X ドル円</code></span>
        <button type="submit" data-testid="markets-save">save</button>
      </div>
    </form>
  {/if}

  {#if view === 'line'}
    <ul class="board">
      {#each rows as row (row.symbol)}
        {@const q = row.update?.quote}
        <li
          class="row {tone(row)}"
          class:flash-up={flashes[row.symbol] === 'up'}
          class:flash-down={flashes[row.symbol] === 'down'}
          data-testid="market-row"
          data-symbol={row.symbol}
        >
          <div class="id">
            <span class="label">{row.label}</span>
            <span class="symbol">
              <i class="state {q?.state ?? 'closed'}" title={q?.state ?? 'no data'}></i>{row.symbol}
            </span>
          </div>
          <div class="chart">
            <Sparkline points={row.update?.series ?? []} baseline={q?.previousClose ?? null} up={(q?.change ?? 0) >= 0} />
          </div>
          <div class="figures">
            <span class="price" data-testid="market-price">{q ? formatPrice(q.price) : '—'}</span>
            <span class="change">{q ? `${q.change >= 0 ? '▲' : '▼'} ${formatChange(q.change, q.changePercent)}` : row.update?.error ?? 'loading'}</span>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="scale" aria-hidden="true">
      <span>−{scale}%</span><span>0</span><span>+{scale}%</span>
    </div>
    <ul class="bars" data-testid="markets-bars">
      {#each rows as row (row.symbol)}
        {@const q = row.update?.quote}
        {@const pct = q?.changePercent ?? 0}
        <li class="bar-row {tone(row)}" data-testid="market-bar" data-symbol={row.symbol} data-pct={pct.toFixed(2)}>
          <span class="label" title={row.symbol}>{row.label}</span>
          <span class="track">
            <span class="axis"></span>
            <span
              class="bar"
              style:width={`${(Math.min(Math.abs(pct), scale) / scale) * 50}%`}
              style:left={pct >= 0 ? '50%' : undefined}
              style:right={pct < 0 ? '50%' : undefined}
            ></span>
          </span>
          <span class="pct">{q ? `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(2)}%` : '—'}</span>
        </li>
      {/each}
    </ul>
  {/if}

  <p class="credit">Yahoo Finance via yahoo-finance2 · unofficial, may be delayed · not investment advice</p>
</div>

<style>
.markets {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
  font-family: var(--font-ui);
  --up: var(--ok);
  --down: var(--danger);
}

.tools {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  min-height: 1.1rem;
}

.tools :global([data-testid='markets-view']) {
  position: static;
}

.edit,
.editor button {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.edit[aria-expanded='true'],
.edit:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.editor textarea {
  resize: none;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: var(--space-1);
}

.editor-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--step--2);
  color: var(--text-muted);
}

/* ---- line view ---- */

.board {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.row {
  flex: 1 0 2.4rem;
  max-height: 4rem;
  display: grid;
  grid-template-columns: minmax(5.5rem, 28%) 1fr minmax(6.5rem, auto);
  align-items: center;
  gap: var(--space-2);
  padding: 0.15rem var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
  transition: background 700ms var(--ease-out);
}

.row.flash-up {
  background: color-mix(in srgb, var(--up) 22%, transparent);
  transition: none;
}

.row.flash-down {
  background: color-mix(in srgb, var(--down) 22%, transparent);
  transition: none;
}

.id {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;
}

.label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--step--1);
  font-weight: 600;
}

.symbol {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.state {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--text-muted);
  opacity: 0.5;
}

.state.open {
  background: var(--up);
  opacity: 1;
  box-shadow: 0 0 0.35rem var(--up);
}

.state.pre,
.state.post {
  background: var(--warn);
  opacity: 0.9;
}

/* The canvas is taken out of flow so its default 150px height cannot size the row. */
.chart {
  position: relative;
  align-self: stretch;
  min-height: 1.6rem;
  margin: 0.2rem 0;
}

.chart :global(canvas) {
  position: absolute;
  inset: 0;
}

.figures {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.price {
  font-family: var(--font-display);
  font-size: var(--step-1);
  color: var(--accent-strong);
}

.change {
  font-size: var(--step--2);
  white-space: nowrap;
}

.up .change,
.bar-row.up .pct {
  color: var(--up);
}

.down .change,
.bar-row.down .pct {
  color: var(--down);
}

/* ---- bar view ---- */

.scale {
  display: grid;
  grid-template-columns: minmax(5.5rem, 26%) 1fr 1fr 1fr 4.2rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.scale span:nth-child(1) {
  grid-column: 2;
}

.scale span:nth-child(2) {
  text-align: center;
}

.scale span:nth-child(3) {
  text-align: right;
}

.bars {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bar-row {
  display: grid;
  grid-template-columns: minmax(5.5rem, 26%) 1fr 4.2rem;
  align-items: center;
  gap: var(--space-2);
  min-height: 1.3rem;
}

.track {
  position: relative;
  height: 0.9rem;
  background: repeating-linear-gradient(
    to right,
    transparent 0 calc(12.5% - 1px),
    var(--accent-faint) calc(12.5% - 1px) 12.5%
  );
}

.axis {
  position: absolute;
  top: -0.2rem;
  bottom: -0.2rem;
  left: 50%;
  width: 1px;
  background: var(--panel-border);
}

.bar {
  position: absolute;
  top: 0;
  bottom: 0;
  transition: width 600ms var(--ease-out);
}

.up .bar {
  background: linear-gradient(to right, color-mix(in srgb, var(--up) 35%, transparent), var(--up));
  box-shadow: 0 0 0.4rem color-mix(in srgb, var(--up) 45%, transparent);
}

.down .bar {
  background: linear-gradient(to left, color-mix(in srgb, var(--down) 35%, transparent), var(--down));
  box-shadow: 0 0 0.4rem color-mix(in srgb, var(--down) 45%, transparent);
}

.pct {
  text-align: right;
  font-family: var(--font-display);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
}

.credit {
  margin: 0;
  padding-bottom: 0.1rem;
  font-size: var(--step--2);
  color: var(--text-muted);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
