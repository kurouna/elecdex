<script lang="ts">
import {
  barScale,
  CHART_RANGES,
  type ChartRange,
  chartKey,
  DEFAULT_RANGE,
  DEFAULT_WATCHLIST,
  dividerIndices,
  formatChange,
  formatPrice,
  formatWatchlist,
  isChartRange,
  isSymbol,
  labelFor,
  labelLanguage,
  type MarketUpdate,
  parseWatchlist,
  rangeChange,
  rangeSpec,
  type WatchSymbol,
} from '@shared/markets'
import { untrack } from 'svelte'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import Digits from '../common/Digits.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import ViewToggle, { type ChartView } from '../common/ViewToggle.svelte'
import type { WidgetProps } from '../registry.ts'
import { boardLayout } from './board-layout.ts'
import Candlestick from './Candlestick.svelte'
import DetailChart from './DetailChart.svelte'
import Sparkline from './Sparkline.svelte'

/**
 * A market board: indices, currencies and whatever else the user lists, from
 * Yahoo Finance, refreshed about once a minute by main.
 *
 *  - Line view: each symbol's range as a sparkline against its base (the
 *    previous close for 1D), with the price and the change over the range.
 *  - Candle view: the range as candles under the name and the price, across
 *    the whole row - beside them, a side pane left room for a third of the bars.
 *  - Bar view: every symbol's change over the range as diverging bars on one
 *    scale, so the board's winners and losers read at a glance; in the list's
 *    order, or sorted by the change.
 *
 * The rows share the pane's height, in two columns when it is wide, and pack
 * themselves when they would not fit (board-layout.ts), so the charts get the
 * room there is rather than a fixed strip of it.
 *
 * A symbol that is clicked takes the whole pane for its chart (DetailChart),
 * with the ranges beside it; the arrow goes back to the board. Which symbol is
 * open is pane state, like the rest, so it survives a move and a restart. The
 * board's symbols stay subscribed meanwhile: main batches their quotes anyway,
 * and dropping and retaking them would ask Yahoo again on every visit.
 *
 * The range (1D to 5Y, each with its own bar width) is chosen above the board
 * and applies to all of it. Symbols, the range, the view and the bars' order
 * are pane state. Built-in names follow the app's locale (Japanese for ja, English
 * otherwise); labels the user types are kept as typed.
 * Quotes are unofficial and may be delayed, and the pane says so.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
/** Shown in its tab, with the window on screen: what the pane does for the eye runs only then. */
const visible = $derived(seen(inTab))

const VIEWS: readonly ChartView[] = ['line', 'candles', 'bars']
/** One symbol has nothing to compare: its chart is a line or candles. */
const DETAIL_VIEWS: readonly ChartView[] = ['line', 'candles']

const view = $derived<ChartView>(
  paneState?.view === 'bars' || paneState?.view === 'candles' ? paneState.view : 'line',
)
/** Panes saved before ranges existed have none: they show 1D, as they did. */
const range = $derived<ChartRange>(isChartRange(paneState?.range) ? paneState.range : DEFAULT_RANGE)
const spec = $derived(rangeSpec(range))

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

/** The symbol whose chart has the pane, while it is still on the list. */
const focus = $derived(watchlist.find((w) => w.symbol === paneState?.focus)?.symbol ?? null)
/** Its own choice, so that picking candles here does not take the board out of its bars. */
const detailView = $derived<'line' | 'candles'>(
  paneState?.detailView === 'line' || paneState?.detailView === 'candles'
    ? paneState.detailView
    : view === 'candles'
      ? 'candles'
      : 'line',
)

/** The bar view in order of the change rather than the list's. */
const sorted = $derived(paneState?.sort === 'change')

/** By chart key, so a range that was just left cannot show in the new one. */
let updates = $state.raw<Record<string, MarketUpdate>>({})
/** Symbols whose price just moved, and which way, for a brief flash. */
let flashes = $state.raw<Record<string, 'up' | 'down'>>({})
let settingsOpen = $state(false)
let draft = $state('')
/** The board powers on when it comes back from a chart, not when the pane opens (the pane does that). */
let cameBack = $state(false)

const REM = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
let root = $state<HTMLElement | null>(null)
let list = $state<HTMLElement | null>(null)
/** The pane's width and the list's height, in rem, as the observer reported them. */
let room = $state({ width: 0, height: 0 })

// Sizes come from the observer's entries, never from measuring inside the callback:
// a pane just brought forward still answers with the size it had in the layout.
$effect(() => {
  const [pane, rows] = [root, list]
  if (pane === null) return
  const observer = new ResizeObserver((entries) => {
    let { width, height } = room
    for (const entry of entries ?? []) {
      if (entry.target === pane) width = entry.contentRect.width / REM
      else height = entry.contentRect.height / REM
    }
    if (width !== room.width || height !== room.height) room = { width, height }
  })
  observer.observe(pane)
  if (rows !== null) observer.observe(rows)
  return () => observer.disconnect()
})

const arrangement = $derived(
  boardLayout(watchlist.length, view === 'candles' ? 'candles' : 'line', room.width, room.height),
)

/**
 * One timer per flashing symbol. Kept outside the subscription effect so that
 * editing the watchlist does not cancel a timer and leave its flash lit.
 */
const flashTimers = new Map<string, ReturnType<typeof setTimeout>>()

function flash(symbol: string, direction: 'up' | 'down'): void {
  flashes = { ...flashes, [symbol]: direction }
  // A second move restarts the flash, rather than the first move's timer ending it early.
  clearTimeout(flashTimers.get(symbol))
  flashTimers.set(
    symbol,
    setTimeout(() => {
      flashTimers.delete(symbol)
      const { [symbol]: _done, ...rest } = flashes
      flashes = rest
    }, 900),
  )
}

// Runs its teardown only when the pane goes away.
$effect(() => () => {
  for (const timer of flashTimers.values()) clearTimeout(timer)
  flashTimers.clear()
})

/**
 * The symbols as one string: pane state is a new object with every click (the
 * detail view, the sort), and the subscriptions must follow the list itself,
 * not each new array of it - or every click would drop and take them all again.
 */
const symbolKey = $derived(watchlist.map((w) => w.symbol).join('\n'))

// Quoted only while the pane is seen: behind another tab main asks Yahoo nothing, and the board
// keeps the last quotes. Main asks again on a return only for what is no longer this minute's.
$effect(() => {
  const symbols = symbolKey === '' ? [] : symbolKey.split('\n')
  const chosen = range
  // A range or symbol no longer shown keeps no bars here.
  const keys = new Set(symbols.map((symbol) => chartKey(symbol, chosen)))
  untrack(() => {
    updates = Object.fromEntries(Object.entries(updates).filter(([key]) => keys.has(key)))
  })
  if (!visible) return
  const offs = symbols.map((symbol) =>
    window.elecdex.markets.subscribe(symbol, chosen, (update) => {
      const key = chartKey(symbol, chosen)
      const before = updates[key]?.quote?.price
      const after = update.quote?.price
      updates = { ...updates, [key]: update }
      if (before !== undefined && after !== undefined && before !== after) {
        flash(symbol, after > before ? 'up' : 'down')
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
  /** The change over the range, once both ends are known. */
  move: { change: number; percent: number } | null
}

const rows = $derived<Row[]>(
  watchlist.map((w) => {
    const update = updates[chartKey(w.symbol, range)]
    return {
      symbol: w.symbol,
      label: labelFor(w, language, update?.quote?.name),
      update,
      move: update ? rangeChange(update) : null,
    }
  }),
)

const focused = $derived(rows.find((r) => r.symbol === focus) ?? null)

/** The bar view's rows: best first when sorted, those with no figure yet last. */
const barRows = $derived(
  sorted
    ? [...rows].sort(
        (a, b) =>
          (b.move?.percent ?? Number.NEGATIVE_INFINITY) -
          (a.move?.percent ?? Number.NEGATIVE_INFINITY),
      )
    : rows,
)

/** Narrower than this, the extremes would take a line of their own from the chart. */
const EXTREMES_MIN_REM = 30

/** The open chart's extremes over the range, for the figures beside its price. */
const extremes = $derived.by(() => {
  const candles = focused?.update?.candles ?? []
  if (candles.length === 0 || room.width < EXTREMES_MIN_REM) return null
  return {
    high: Math.max(...candles.map((c) => c.h)),
    low: Math.min(...candles.map((c) => c.l)),
  }
})

/** The bar scale in percent, shared by every row (see barScale). */
const scale = $derived(barScale(rows.flatMap((r) => (r.move ? [r.move.percent] : []))))

const dateLabel = (t: number): string =>
  new Date(t).toLocaleDateString(navigator.language, { month: 'numeric', day: 'numeric' })

/** A bar row's tooltip: what the move is measured from, and to. */
function baseTitle(row: Row): string {
  const base = row.update?.base
  const price = row.update?.quote?.price
  if (base == null || price === undefined) return row.symbol
  const baseTime = row.update?.baseTime
  const when =
    range === '1d' || baseTime == null ? 'previous close' : `${dateLabel(baseTime)} close`
  return `${row.symbol} · base ${formatPrice(base)} (${when}) → ${formatPrice(price)}`
}

$effect(() => {
  const quotes = rows.map((r) => r.update?.quote).filter((q) => q != null)
  const open = quotes.filter((q) => q.state === 'open').length
  const latest = Math.max(0, ...rows.map((r) => r.update?.updatedAt ?? 0))
  const time = latest ? new Date(latest).toTimeString().slice(0, 5) : null
  const error = rows.find((r) => r.update?.error)?.update?.error
  paneMeta.set(paneId, {
    subtitle: time ? `${spec.label} · ${open} open · updated ${time}` : 'connecting…',
    ...(error ? { badge: 'stale', badgeKind: 'warn' as const } : {}),
  })
})

function setView(next: ChartView): void {
  // A list made by this change of view has not come back from anywhere.
  cameBack = false
  layout.setPaneState(paneId, { ...paneState, view: next })
}

function setDetailView(next: ChartView): void {
  if (next !== 'bars') layout.setPaneState(paneId, { ...paneState, detailView: next })
}

function openDetail(symbol: string): void {
  layout.setPaneState(paneId, { ...paneState, focus: symbol })
}

function closeDetail(): void {
  const { focus: _left, ...rest } = paneState ?? {}
  cameBack = true
  layout.setPaneState(paneId, rest)
}

function toggleSort(): void {
  const { sort: _order, ...rest } = paneState ?? {}
  layout.setPaneState(paneId, sorted ? rest : { ...rest, sort: 'change' })
}

function setRange(next: ChartRange): void {
  layout.setPaneState(paneId, { ...paneState, range: next })
}

function toggleSettings(): void {
  if (!settingsOpen) draft = formatWatchlist(watchlist)
  settingsOpen = !settingsOpen
}

function saveDraft(): void {
  const parsed = parseWatchlist(draft)
  layout.setPaneState(paneId, {
    ...paneState,
    symbols: parsed.length ? parsed : [...DEFAULT_WATCHLIST],
  })
  settingsOpen = false
}

const tone = (row: Row) => {
  const change = row.move?.change ?? 0
  return change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
}

const signed = (percent: number): string =>
  `${percent >= 0 ? '+' : '−'}${Math.abs(percent).toFixed(2)}%`
</script>


{#snippet identity(row: Row)}
  {@const q = row.update?.quote}
  <span class="id">
    <span class="label">{row.label}</span>
    <span class="symbol">
      <i class="state {q?.state ?? 'closed'}" title={q?.state ?? 'no data'}></i><span class="ticker">{row.symbol}</span>
    </span>
  </span>
{/snippet}

<!-- The change in full, and as the percentage alone for a packed row: the styles show one of them. -->
{#snippet change(row: Row)}
  <span class="change">
    {#if row.move}
      {row.move.change >= 0 ? '▲' : '▼'}
      <span class="full">{formatChange(row.move.change, row.move.percent)}</span><span class="short">{signed(row.move.percent)}</span>
    {:else}
      {row.update?.quote ? '—' : (row.update?.error ?? 'loading')}
    {/if}
  </span>
{/snippet}

<div
  class="markets"
  bind:this={root}
  data-testid="markets"
  data-view={view}
  data-range={range}
  data-focus={focus ?? ''}
>
  <SettingsButton
    open={settingsOpen}
    label="markets settings"
    testid="markets-settings-toggle"
    ontoggle={toggleSettings}
  />
  <div class="tools">
    {#if focused}
      <button
        type="button"
        class="back"
        aria-label="back to the list"
        title="Back to the list"
        onclick={closeDetail}
        data-testid="markets-back"
      >←</button>
    {/if}
    <div class="ranges" role="radiogroup" aria-label="Range" data-testid="markets-ranges">
      {#each CHART_RANGES as option (option.id)}
        <button
          type="button"
          role="radio"
          aria-checked={range === option.id}
          title={`${option.label} · ${option.bar} bars`}
          onclick={() => setRange(option.id)}
          data-range={option.id}
        >{option.label}</button>
      {/each}
    </div>
    <span class="bar-width" title="Bar width" data-testid="markets-range">{spec.bar}</span>
    {#if focused}
      <ViewToggle view={detailView} views={DETAIL_VIEWS} onchange={setDetailView} testid="markets-view" />
    {:else}
      <ViewToggle {view} views={VIEWS} onchange={setView} testid="markets-view" />
    {/if}
  </div>

  {#if settingsOpen}
    <form
      class="settings"
      data-testid="markets-settings"
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

  {#if focused}
    {@const q = focused.update?.quote}
    <div class="detail crt-on {tone(focused)}" data-testid="markets-detail" data-symbol={focused.symbol}>
      <div
        class="detail-head"
        class:flash-up={flashes[focused.symbol] === 'up'}
        class:flash-down={flashes[focused.symbol] === 'down'}
      >
        {@render identity(focused)}
        <span class="price" data-testid="market-detail-price"
          >{#if q}<Digits value={formatPrice(q.price)} />{:else}—{/if}</span
        >
        {@render change(focused)}
        {#if extremes}
          <span class="extremes" data-testid="market-detail-extremes">
            <span><b>H</b> {formatPrice(extremes.high)}</span>
            <span><b>L</b> {formatPrice(extremes.low)}</span>
            {#if focused.update?.base != null}
              <span><b>BASE</b> {formatPrice(focused.update.base)}</span>
            {/if}
          </span>
        {/if}
      </div>
      <div class="detail-body">
        <DetailChart
          candles={focused.update?.candles ?? []}
          baseline={focused.update?.base ?? null}
          {range}
          view={detailView}
          up={(focused.move?.change ?? 0) >= 0}
        />
      </div>
    </div>
  {:else if view !== 'bars'}
    <ul
      class="board"
      class:tall={view === 'candles'}
      class:two={arrangement.columns === 2}
      class:dense={arrangement.dense}
      class:crt-on={cameBack}
      bind:this={list}
      data-columns={arrangement.columns}
      data-dense={arrangement.dense}
    >
      {#each rows as row (row.symbol)}
        {@const q = row.update?.quote}
        <li
          class="row {tone(row)}"
          class:flash-up={flashes[row.symbol] === 'up'}
          class:flash-down={flashes[row.symbol] === 'down'}
          data-testid="market-row"
          data-symbol={row.symbol}
        >
          <button
            type="button"
            class="hit"
            title={`${row.symbol} · open the chart`}
            onclick={() => openDetail(row.symbol)}
            data-testid="market-open"
          >
            {@render identity(row)}
            <span class="chart">
              {#if view === 'candles'}
                <Candlestick candles={row.update?.candles ?? []} baseline={row.update?.base ?? null} {range} />
              {:else}
                {@const candles = row.update?.candles ?? []}
                <Sparkline
                  points={candles.map((c) => ({ t: c.t, v: c.c }))}
                  baseline={row.update?.base ?? null}
                  up={(row.move?.change ?? 0) >= 0}
                  dividers={dividerIndices(candles, range)}
                />
              {/if}
            </span>
            <span class="figures">
              <span class="price" data-testid="market-price"
                >{#if q}<Digits value={formatPrice(q.price)} />{:else}—{/if}</span
              >
              {@render change(row)}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="scale">
      <button
        type="button"
        class="sort"
        aria-pressed={sorted}
        title={sorted ? 'In order of the change: back to the order of the list' : 'Sort by the change'}
        onclick={toggleSort}
        data-testid="markets-sort"
      >{sorted ? '▾ change' : '▾ list'}</button>
      <span class="ticks" aria-hidden="true"><span>−{scale}%</span><span>0</span><span>+{scale}%</span></span>
      <span></span>
    </div>
    <ul class="bars" class:crt-on={cameBack} bind:this={list} data-testid="markets-bars">
      {#each barRows as row (row.symbol)}
        {@const pct = row.move?.percent ?? 0}
        {@const clipped = Math.abs(pct) > scale}
        <li
          class="bar-row {tone(row)}"
          title={baseTitle(row)}
          data-testid="market-bar"
          data-symbol={row.symbol}
          data-pct={pct.toFixed(2)}
          data-clipped={clipped}
        >
          <button
            type="button"
            class="hit"
            onclick={() => openDetail(row.symbol)}
            data-testid="market-open"
          >
            <span class="label">{row.label}</span>
            <span class="track">
              <span class="axis"></span>
              <span
                class="bar"
                style:width={`${(Math.min(Math.abs(pct), scale) / scale) * 50}%`}
                style:left={pct >= 0 ? '50%' : undefined}
                style:right={pct < 0 ? '50%' : undefined}
              ></span>
              {#if clipped}
                <span class="more" class:neg={pct < 0} aria-hidden="true">{pct < 0 ? '◂' : '▸'}</span>
              {/if}
            </span>
            <span class="pct">{row.move ? signed(pct) : '—'}</span>
          </button>
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
  /* Mixed towards the background like the calendar's weekend colours: the board reads
     up and down at a glance without the full-strength status colours shouting. */
  --up: color-mix(in srgb, var(--ok) 72%, var(--app-bg));
  --down: color-mix(in srgb, var(--danger) 72%, var(--app-bg));
}

/* ---- the controls above the board ---- */

/* The right padding clears the settings button in the corner. */
.tools {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 1.1rem;
  padding-right: 1.5rem;
}

.tools :global([data-testid='markets-view']) {
  position: static;
  margin-left: auto;
}

.back,
.ranges button,
.sort,
.settings button {
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.1rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.back {
  font-size: var(--step--1);
}

.back:hover,
.ranges button:hover:not([aria-checked='true']),
.sort:hover,
.settings button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

/* One strip of cells, like the view switch beside it. */
.ranges {
  display: flex;
}

.ranges button + button {
  border-left: 0;
}

.ranges button[aria-checked='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.bar-width {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
}

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
}

.settings textarea {
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
  gap: var(--space-2);
  font-size: var(--step--2);
  color: var(--text-muted);
}

/* Both lists take the space left above the credit and scroll when the watchlist
   is longer than fits, rather than running over the credit. */
.board,
.bars {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

/* ---- line and candle views ---- */

/*
 * One grid for the whole board, its rows subgrids of it: the name and the
 * figures take what the widest of them needs and no more, the charts take the
 * rest, and every chart starts and ends on the same line. The rows share the
 * height between them, down to their minimum, below which the board scrolls.
 */
.board {
  display: grid;
  grid-template-columns: fit-content(9rem) minmax(0, 1fr) fit-content(11rem);
  grid-auto-rows: minmax(2.4rem, 1fr);
  column-gap: var(--space-2);
}

.board.two {
  grid-template-columns: repeat(2, fit-content(9rem) minmax(0, 1fr) fit-content(11rem));
}

.row {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid;
  min-height: 0;
  border-bottom: 1px solid var(--panel-rule);
  transition: background 700ms var(--ease-out);
}

/* The whole row is the button that opens the symbol's chart. Not `.open`: that is a market's state. */
.hit {
  min-width: 0;
  min-height: 0;
  display: grid;
  align-items: center;
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

/* Lit from the left edge, like a selected line on a console. */
.hit:hover,
.hit:focus-visible {
  background: linear-gradient(to right, var(--accent-faint), transparent 70%);
  box-shadow: inset 2px 0 0 var(--accent);
  outline: none;
}

.row .hit {
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  padding: 0.15rem var(--space-1);
}

/* Two columns stand apart by more than the gap between a row's own cells. */
.board.two .hit {
  padding-inline: var(--space-2);
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
  flex: none;
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
  display: block;
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
  min-width: 0;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

/*
 * The figures roll as they change, so a price that has moved is seen to move
 * even after its flash has gone. Only the digits that changed play it, which on
 * a quote is usually the last one or two.
 */
.price {
  font-family: var(--font-display);
  font-size: var(--step-1);
  color: var(--accent-strong);
}

/* An error in place of the change can be a sentence: it is cut, not given the chart's room. */
.change {
  max-width: 100%;
  overflow: hidden;
  font-size: var(--step--2);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.short {
  display: none;
}

.up .change,
.bar-row.up .pct {
  color: var(--up);
}

.down .change,
.bar-row.down .pct {
  color: var(--down);
}

/*
 * Candles: the name and the figures on one line, the chart under them across
 * the whole row. Beside them, as the line is, a side pane left the chart a
 * third of its width, and a day's 78 bars were merged into 38.
 */
.board.tall {
  grid-auto-rows: minmax(4.8rem, 1fr);
}

.board.tall .hit {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr);
  column-gap: var(--space-2);
}

.board.tall .id {
  grid-area: 1 / 1;
  flex-direction: row;
  align-items: baseline;
  gap: var(--space-2);
}

.board.tall .figures {
  grid-area: 1 / 2;
  flex-direction: row;
  align-items: baseline;
  gap: var(--space-2);
}

.board.tall .price {
  font-size: var(--step-0);
}

.board.tall .chart {
  grid-area: 2 / 1 / 3 / 3;
  margin: 0.1rem 0 0.15rem;
}

/*
 * Packed, when the rows would not fit at their full height: one line of text a
 * row - the market's light before the name, the ticker left to the tooltip, the
 * change as its percentage - so fewer symbols are out of sight.
 */
.board.dense {
  grid-auto-rows: minmax(1.7rem, 1fr);
}

.board.dense.tall {
  grid-auto-rows: minmax(3.8rem, 1fr);
}

.board.dense .id {
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
}

.board.dense .symbol {
  order: -1;
}

.board.dense .ticker,
.board.dense .full {
  display: none;
}

.board.dense .short {
  display: inline;
}

.board.dense .figures {
  flex-direction: row;
  align-items: baseline;
  gap: var(--space-2);
}

.board.dense .price {
  font-size: var(--step-0);
}

.board.dense .chart {
  min-height: 1.1rem;
  margin: 0.1rem 0;
}

/* ---- one symbol's chart ---- */

.detail {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--space-3);
  padding: 0 var(--space-1);
  transition: background 700ms var(--ease-out);
}

.detail-head.flash-up {
  background: color-mix(in srgb, var(--up) 22%, transparent);
  transition: none;
}

.detail-head.flash-down {
  background: color-mix(in srgb, var(--down) 22%, transparent);
  transition: none;
}

.detail-head .id {
  flex-direction: row;
  align-items: baseline;
  gap: var(--space-2);
}

.detail-head .label {
  font-size: var(--step-0);
}

.detail-head .price {
  font-size: var(--step-2);
}

.detail-head .change {
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
}

/* The range's extremes and its base, at the far end of the line (only a pane wide enough has them). */
.extremes {
  display: flex;
  gap: var(--space-3);
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.extremes b {
  font-weight: 400;
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
}

.detail-body {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* ---- bar view ---- */

/* The scale shares the rows' columns and their gap, so its zero stands on their axis. */
.scale,
.bar-row .hit {
  display: grid;
  grid-template-columns: minmax(5.5rem, 26%) 1fr 4.2rem;
  align-items: center;
  gap: var(--space-2);
}

/* Both keep room for the list's scrollbar, whether or not it shows: a scale as wide
   as the pane over rows a scrollbar narrower would put its zero beside their axis. */
.scale,
.bars {
  scrollbar-gutter: stable;
}

.scale {
  overflow: hidden;
  scrollbar-width: thin;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.sort {
  justify-self: start;
  line-height: 1rem;
}

.sort[aria-pressed='true'] {
  color: var(--accent);
  border-color: var(--accent-dim);
}

.ticks {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
}

.ticks span:last-child {
  text-align: right;
}

/* Spread out when there is room. Overflowing, space-evenly falls back to a safe
   start, so the first row stays at the top and the rest scroll. */
.bars {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.bar-row {
  display: flex;
  min-height: 1.3rem;
}

.bar-row .hit {
  flex: 1;
  padding: 0;
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

.more {
  position: absolute;
  top: 50%;
  right: -0.1rem;
  transform: translate(100%, -50%);
  font-size: var(--step--2);
  line-height: 1;
}

.more.neg {
  right: auto;
  left: -0.1rem;
  transform: translate(-100%, -50%);
}

.up .more {
  color: var(--up);
}

.down .more {
  color: var(--down);
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
