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
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import Digits from '../common/Digits.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import ViewToggle, { type ChartView } from '../common/ViewToggle.svelte'
import type { WidgetProps } from '../registry.ts'
import Candlestick from './Candlestick.svelte'
import DetailChart from './DetailChart.svelte'
import Sparkline from './Sparkline.svelte'

/**
 * A market board: indices, currencies and whatever else the user lists, from
 * Yahoo Finance, refreshed about once a minute by main.
 *
 *  - Line view: each symbol's range as a sparkline against its base (the
 *    previous close for 1D), with the price and the change over the range.
 *  - Candle view: the same rows with the range as candles.
 *  - Bar view: every symbol's change over the range as diverging bars on one
 *    scale, so the board's winners and losers read at a glance.
 *
 * A symbol that is clicked takes the whole pane for its chart (DetailChart),
 * with the ranges beside it; the arrow goes back to the board. Which symbol is
 * open is pane state, like the rest, so it survives a move and a restart. The
 * board's symbols stay subscribed meanwhile: main batches their quotes anyway,
 * and dropping and retaking them would ask Yahoo again on every visit.
 *
 * The range (1D to 5Y, each with its own bar width) is chosen in the settings
 * and applies to the whole board. Symbols, the range and the view are pane
 * state. Built-in names follow the app's locale (Japanese for ja, English
 * otherwise); labels the user types are kept as typed.
 * Quotes are unofficial and may be delayed, and the pane says so.
 */
const { paneId, state: paneState }: WidgetProps = $props()

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

/** By chart key, so a range that was just left cannot show in the new one. */
let updates = $state.raw<Record<string, MarketUpdate>>({})
/** Symbols whose price just moved, and which way, for a brief flash. */
let flashes = $state.raw<Record<string, 'up' | 'down'>>({})
let settingsOpen = $state(false)
let draft = $state('')
/** The board powers on when it comes back from a chart, not when the pane opens (the pane does that). */
let cameBack = $state(false)

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

$effect(() => {
  const symbols = watchlist.map((w) => w.symbol)
  const chosen = range
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

<div
  class="markets"
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
      <div class="ranges-quick" role="radiogroup" aria-label="Range" data-testid="markets-detail-ranges">
        {#each CHART_RANGES as option (option.id)}
          <button
            type="button"
            role="radio"
            aria-checked={range === option.id}
            title={`${option.label} · ${option.bar}`}
            onclick={() => setRange(option.id)}
            data-range={option.id}
          >{option.label}</button>
        {/each}
      </div>
      <ViewToggle view={detailView} views={DETAIL_VIEWS} onchange={setDetailView} testid="markets-view" />
    {:else}
      <span class="range-label" data-testid="markets-range">{spec.label} · {spec.bar}</span>
      <ViewToggle {view} views={VIEWS} onchange={setView} testid="markets-view" />
    {/if}
  </div>

  {#if settingsOpen}
    <div class="settings" data-testid="markets-settings">
      <fieldset class="ranges">
        <legend>range</legend>
        {#each CHART_RANGES as option (option.id)}
          <label>
            <input
              type="radio"
              name={`markets-range-${paneId}`}
              checked={range === option.id}
              onchange={() => setRange(option.id)}
              data-testid={`markets-range-${option.id}`}
            />
            <span>{option.label} <small>· {option.bar}</small></span>
          </label>
        {/each}
      </fieldset>
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
    </div>
  {/if}

  {#if focused}
    {@const q = focused.update?.quote}
    <div class="detail crt-on {tone(focused)}" data-testid="markets-detail" data-symbol={focused.symbol}>
      <div
        class="detail-head"
        class:flash-up={flashes[focused.symbol] === 'up'}
        class:flash-down={flashes[focused.symbol] === 'down'}
      >
        <span class="id">
          <span class="label">{focused.label}</span>
          <span class="symbol">
            <i class="state {q?.state ?? 'closed'}" title={q?.state ?? 'no data'}></i>{focused.symbol}
          </span>
        </span>
        <span class="price" data-testid="market-detail-price"
          >{#if q}<Digits value={formatPrice(q.price)} />{:else}—{/if}</span
        >
        <span class="change">{#if focused.move}{focused.move.change >= 0 ? '▲' : '▼'} {formatChange(focused.move.change, focused.move.percent)}{:else}{q ? '—' : (focused.update?.error ?? 'loading')}{/if}</span>
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
    <ul class="board" class:tall={view === 'candles'} class:crt-on={cameBack}>
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
            title={`${row.label} · open the chart`}
            onclick={() => openDetail(row.symbol)}
            data-testid="market-open"
          >
          <span class="id">
            <span class="label">{row.label}</span>
            <span class="symbol">
              <i class="state {q?.state ?? 'closed'}" title={q?.state ?? 'no data'}></i>{row.symbol}
            </span>
          </span>
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
            <span class="change">{#if row.move}{row.move.change >= 0 ? '▲' : '▼'} {formatChange(row.move.change, row.move.percent)}{:else}{q ? '—' : (row.update?.error ?? 'loading')}{/if}</span>
          </span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="scale" aria-hidden="true">
      <span>{spec.label}</span><span>−{scale}%</span><span>0</span><span>+{scale}%</span>
    </div>
    <ul class="bars" class:crt-on={cameBack} data-testid="markets-bars">
      {#each rows as row (row.symbol)}
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

/* The right padding clears the settings button in the corner. */
.tools {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-2);
  min-height: 1.1rem;
  padding-right: 1.5rem;
}

.range-label {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
}

.tools :global([data-testid='markets-view']) {
  position: static;
}

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

.editor button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
}

.ranges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  margin: 0;
  padding: 0;
  border: 0;
  font-size: var(--step--1);
  text-transform: uppercase;
}

.ranges legend {
  float: left;
  padding: 0;
  margin-right: var(--space-1);
  color: var(--text-muted);
}

.ranges label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text);
  cursor: pointer;
}

.ranges small {
  color: var(--text-muted);
  font-size: var(--step--2);
  text-transform: none;
}

.ranges input {
  margin: 0;
  accent-color: var(--accent);
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

/* Both views: the list takes the space left above the credit and scrolls when
   the watchlist is longer than fits, rather than running over the credit. */
.board,
.bars {
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

/* ---- line view ---- */

/* The name column stops at 9rem: in a wide pane a share of the width only put
   empty space between the names and the charts. */
.row {
  flex: 1 0 2.4rem;
  max-height: 4rem;
  display: flex;
  border-bottom: 1px solid var(--panel-rule);
  transition: background 700ms var(--ease-out);
}

/* The whole row is the button that opens the symbol's chart. Not `.open`: that is a market's state. */
.hit {
  flex: 1;
  min-width: 0;
  display: grid;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.hit:hover,
.hit:focus-visible {
  background: var(--accent-faint);
  outline: none;
}

.row .hit {
  grid-template-columns: minmax(5.5rem, min(28%, 9rem)) 1fr minmax(6.5rem, auto);
  padding: 0.15rem var(--space-1);
}

/* Candles need height to show their bodies and wicks: twice a line row. */
.board.tall .row {
  flex-basis: 4.8rem;
  max-height: 8rem;
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

/* ---- one symbol's chart ---- */

.back,
.ranges-quick button {
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.1rem;
  cursor: pointer;
}

/* The arrow stays at the left while the rest of the row keeps to the right. */
.back {
  margin-right: auto;
  font-size: var(--step--1);
}

.back:hover,
.ranges-quick button:hover:not([aria-checked='true']) {
  color: var(--accent);
  border-color: var(--accent);
}

.ranges-quick {
  display: flex;
}

.ranges-quick button + button {
  border-left: 0;
}

.ranges-quick button[aria-checked='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

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

.detail-body {
  position: relative;
  flex: 1;
  min-height: 0;
}

/* ---- bar view ---- */

.scale {
  display: grid;
  grid-template-columns: minmax(5.5rem, 26%) 1fr 1fr 1fr 4.2rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.scale span:nth-child(3) {
  text-align: center;
}

.scale span:nth-child(4) {
  text-align: right;
}

/* Spread out when there is room. Overflowing, space-evenly falls back to a safe
   start, so the first row stays at the top and the rest scroll. */
.bars {
  justify-content: space-evenly;
}

.bar-row {
  display: flex;
  min-height: 1.3rem;
}

.bar-row .hit {
  grid-template-columns: minmax(5.5rem, 26%) 1fr 4.2rem;
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
