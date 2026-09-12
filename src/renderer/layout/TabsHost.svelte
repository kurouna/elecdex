<script lang="ts">
import type { TabsNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'
import PaneHost from './PaneHost.svelte'

interface Props {
  node: TabsNode
}

const { node }: Props = $props()

/** Last two path segments are enough to orient without eating the tab strip. */
function shorten(text: string | undefined): string {
  if (text === undefined || text === '') return ''
  const parts = text.split(/[\\/]/).filter((p) => p !== '')
  if (parts.length <= 2) return text
  return `…/${parts.slice(-2).join('/')}`
}
</script>

<section class="frame tabs-host" data-notch="tr bl" data-testid="tabs-host" data-node-id={node.id}>
  <ul class="tabs" data-testid="tab-strip">
    {#each node.children as child, index (child.id)}
      {@const meta = paneMeta.get(child.id)}
      <li>
        <button
          type="button"
          class="tab"
          class:active={index === node.activeIndex}
          onclick={() => layout.focus(child.id)}
          data-testid="tab"
          data-pane-id={child.id}
        >
          <span class="name">{meta.title ?? resolveWidget(child.widget)?.title ?? child.widget}</span
          >
          {#if meta.subtitle}
            <span class="sub">{shorten(meta.subtitle)}</span>
          {/if}
          {#if meta.badge}
            <span class="badge {meta.badgeKind ?? 'danger'}">{meta.badge}</span>
          {/if}
        </button>
        <button
          type="button"
          class="close"
          aria-label={`Close ${meta.title ?? child.widget}`}
          onclick={() => layout.close(child.id)}
          data-testid="tab-close"
          data-pane-id={child.id}>×</button
        >
      </li>
    {/each}
    <li>
      <button
        type="button"
        class="new"
        aria-label="New tab"
        onclick={() => {
          const first = node.children[0]
          if (first) layout.addTab(first.id, first.widget)
        }}
        data-testid="tab-new">+</button
      >
    </li>
  </ul>

  <div class="panes">
    {#each node.children as child, index (child.id)}
      <PaneHost node={child} visible={index === node.activeIndex} tabbed={true} />
    {/each}
  </div>
</section>

<style>
.tabs-host {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.tabs {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  list-style: none;
  min-height: 26px;
  padding: 0 var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid var(--panel-rule);
}

.tabs > li {
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
}

.tab {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: 0 var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-out);
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
  background: var(--accent-faint);
}

.sub {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-transform: none;
  letter-spacing: 0;
  opacity: 0.75;
}

.badge {
  font-family: var(--font-mono);
  font-size: var(--step--2);
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

.close,
.new {
  padding: 0 var(--space-2);
  color: var(--text-muted);
  font-size: var(--step-0);
  line-height: 1;
}

.close:hover {
  color: var(--danger);
}

.new:hover {
  color: var(--text);
}

.panes {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

/* Stack the tabs: each pane fills the area, and only the active one displays.
   Absolute positioning keeps a hidden tab from influencing the height. */
.panes > :global(.pane) {
  position: absolute;
  inset: 0;
}
</style>
