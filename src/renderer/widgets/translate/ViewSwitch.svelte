<script lang="ts">
/** TEXT and HISTORY (docs/translate.md §3): the switch at the start of either view's toolbar. */
interface Props {
  view: 'text' | 'history'
  onchange: (view: 'text' | 'history') => void
}

const { view, onchange }: Props = $props()
</script>

<div class="vt" role="tablist" aria-label="Text or history">
  <button type="button" role="tab" aria-selected={view === 'text'} data-testid="translate-view-text" onclick={() => onchange('text')}>Text</button>
  <button type="button" role="tab" aria-selected={view === 'history'} data-testid="translate-view-history" onclick={() => onchange('history')}>History</button>
</div>

<style>
.vt { display: flex; }
.vt button { background: transparent; border: 1px solid var(--panel-rule); padding: 0.05rem 0.55rem; margin-left: -1px; font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.vt button[aria-selected="true"] { color: var(--text); border-color: var(--accent-dim); background: var(--accent-faint); position: relative; z-index: 1; }
.vt button:hover { color: var(--accent); }
</style>
