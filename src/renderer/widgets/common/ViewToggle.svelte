<script lang="ts">
/**
 * A two-way switch between a line-graph view and a bar view, for widgets that
 * can show the same numbers either way (CPU, markets).
 *
 * Sits in the top-right corner of the widget body, or inline where a widget has
 * a row for it; the widget keeps the choice in its pane state, so it survives a
 * restart.
 */
export type ChartView = 'line' | 'bars'

interface Props {
  view: ChartView
  onchange: (view: ChartView) => void
  testid?: string
  /** Flow with the surrounding content instead of floating in the corner. */
  inline?: boolean
}

const { view, onchange, testid = 'view-toggle', inline = false }: Props = $props()
</script>

<div class="toggle" class:inline role="radiogroup" aria-label="Chart style" data-testid={testid}>
  <button
    type="button"
    role="radio"
    aria-checked={view === 'line'}
    aria-label="line graph"
    title="Line graph"
    onclick={() => onchange('line')}
    data-view="line"
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1.5 12 L5 7.5 L8 10 L11 4 L14.5 6.5" />
    </svg>
  </button>
  <button
    type="button"
    role="radio"
    aria-checked={view === 'bars'}
    aria-label="bar graph"
    title="Bar graph"
    onclick={() => onchange('bars')}
    data-view="bars"
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 14 V8 M6.5 14 V4 M10 14 V9.5 M13.5 14 V2.5" />
    </svg>
  </button>
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
