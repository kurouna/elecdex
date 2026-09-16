<script lang="ts">
/**
 * A switch between the ways a widget can draw the same numbers: a line graph,
 * bars and, where the data has them, candles (CPU, markets).
 *
 * Sits in the top-right corner of the widget body, or inline where a widget has
 * a row for it; the widget keeps the choice in its pane state, so it survives a
 * restart. `views` picks the buttons and their order; by default line and bars.
 */
export type ChartView = 'line' | 'bars' | 'candles'

interface Props {
  view: ChartView
  onchange: (view: ChartView) => void
  views?: readonly ChartView[]
  testid?: string
  /** Flow with the surrounding content instead of floating in the corner. */
  inline?: boolean
}

const {
  view,
  onchange,
  views = ['line', 'bars'],
  testid = 'view-toggle',
  inline = false,
}: Props = $props()

const LABELS: Record<ChartView, string> = {
  line: 'Line graph',
  bars: 'Bar graph',
  candles: 'Candlestick chart',
}

/**
 * 16 x 16 strokes. A candle is a hollow body with its wick above and below: a
 * wick drawn through a body narrower than this fills it at the icon's size, and
 * the candles read as two solid bars.
 */
const ICONS: Record<ChartView, string> = {
  line: 'M1.5 12 L5 7.5 L8 10 L11 4 L14.5 6.5',
  bars: 'M3 14 V8 M6.5 14 V4 M10 14 V9.5 M13.5 14 V2.5',
  candles:
    'M4 1.5 V4.5 M2 4.5 H6 V11.5 H2 Z M4 11.5 V14.5 M12 1.5 V4.5 M10 4.5 H14 V9.5 H10 Z M12 9.5 V14.5',
}
</script>

<div class="toggle" class:inline role="radiogroup" aria-label="Chart style" data-testid={testid}>
  {#each views as option (option)}
    <button
      type="button"
      role="radio"
      aria-checked={view === option}
      aria-label={LABELS[option].toLowerCase()}
      title={LABELS[option]}
      onclick={() => onchange(option)}
      data-view={option}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d={ICONS[option]} />
      </svg>
    </button>
  {/each}
</div>

<style>
.toggle.inline {
  position: static;
  align-self: center;
  justify-self: end;
}

.toggle {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  display: flex;
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
}

button {
  display: grid;
  place-items: center;
  width: 1.3rem;
  height: 1.1rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

button + button {
  border-left: 1px solid var(--panel-border);
}

button[aria-checked='true'] {
  background: var(--accent);
  color: var(--text-inverse);
}

button:hover:not([aria-checked='true']) {
  color: var(--accent);
}

svg {
  width: 0.8rem;
  height: 0.8rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
