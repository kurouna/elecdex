<script lang="ts">
import type { PaneNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'
import { dragHandle } from './pane-drag.svelte.ts'

/**
 * The strip of tabs along the top of a shell frame, with the + that opens another
 * tab of the first pane's widget.
 *
 * A tab group draws one over its panes, and so does a terminal pane on its own,
 * with its single tab: every shell can grow tabs from the pane itself. The + on a
 * lone pane turns it into a group (layout.addTab), as Ctrl+Shift+T does.
 */
interface Props {
  panes: readonly PaneNode[]
  activeIndex: number
}

const { panes, activeIndex }: Props = $props()

const titleOf = (widget: string): string => resolveWidget(widget)?.title ?? widget

/** Last two path segments are enough to orient without eating the tab. */
function shorten(text: string | undefined): string {
  if (text === undefined || text === '') return ''
  const parts = text.split(/[\\/]/).filter((p) => p !== '')
  if (parts.length <= 2) return text
  return `…/${parts.slice(-2).join('/')}`
}
</script>

<!--
  eDEX-UI's tab strip: every tab is a parallelogram (skewX) sharing the full
  width, separated by a slanted rule; the active one is filled with the
  accent and its label turns dark. The label is counter-skewed so the text
  stays upright.
-->
<ul class="tabs" data-testid="tab-strip">
  {#each panes as child, index (child.id)}
    {@const meta = paneMeta.get(child.id)}
    <li class="tab" class:active={index === activeIndex}>
      <button
        type="button"
        class="select"
        onclick={() => layout.focus(child.id)}
        {@attach dragHandle(child.id, () => meta.title ?? titleOf(child.widget))}
        data-testid="tab"
        data-pane-id={child.id}
      >
        <span class="upright">
          <span class="name">{meta.title ?? titleOf(child.widget)}</span>
          {#if meta.subtitle}<span class="sub">{shorten(meta.subtitle)}</span>{/if}
          {#if meta.badge}<span class="badge {meta.badgeKind ?? 'danger'}">{meta.badge}</span>{/if}
        </span>
      </button>
      <button
        type="button"
        class="close"
        aria-label={`Close ${meta.title ?? child.widget}`}
        onclick={() => layout.close(child.id)}
        data-testid="tab-close"
        data-pane-id={child.id}><span class="upright">×</span></button
      >
    </li>
  {/each}
  <li class="tab new-tab">
    <button
      type="button"
      class="select"
      aria-label="New tab"
      onclick={() => {
        const first = panes[0]
        if (first) layout.addTab(first.id, first.widget)
      }}
      data-testid="tab-new"><span class="upright">+</span></button
    >
  </li>
</ul>

<style>
.tabs {
  display: flex;
  align-items: stretch;
  list-style: none;
  height: 1.6rem;
  flex: 0 0 auto;
  /* The skewed ends of the first and last tab would poke out of the frame. */
  overflow: hidden;
  padding-right: calc(var(--frame-notch) * 0.6);
  border-bottom: var(--rule-width) solid var(--panel-border);
}

.tab {
  position: relative;
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  transform: skewX(var(--tab-skew));
  background: var(--app-bg);
  transition: background var(--dur-fast) var(--ease-out);
}

/* Push the first tab's slanted left edge outside the frame, as in the original. */
.tab:first-child {
  margin-left: -0.6rem;
  padding-left: 0.6rem;
}

.tab + .tab {
  border-left: var(--rule-width) solid var(--panel-border);
}

.tab.new-tab {
  flex: 0 0 2.4rem;
}

.tab.active {
  background: var(--accent);
}

.upright {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  min-width: 0;
  transform: skewX(calc(-1 * var(--tab-skew)));
}

.select {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  padding: 0 var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step-0);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
}

.tab.active .select {
  color: var(--text-inverse);
  font-weight: 700;
}

.select:hover {
  background: var(--accent-faint);
}

.tab.active .select:hover {
  background: transparent;
}

.name,
.sub {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.7;
}

.badge {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-weight: 700;
}

.badge.danger {
  color: var(--danger);
}
.badge.warn {
  color: var(--warn);
}
.badge.ok {
  color: var(--ok);
}

.close {
  flex: 0 0 auto;
  padding: 0 var(--space-2);
  font-size: var(--step-0);
  line-height: 1;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.tab:hover .close,
.tab.active .close,
.close:focus-visible {
  opacity: 1;
}

.tab.active .close {
  color: var(--text-inverse);
}

.close:hover {
  color: var(--danger);
}
</style>
