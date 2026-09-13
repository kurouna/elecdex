<script lang="ts">
import type { TabsNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'
import PaneHost from './PaneHost.svelte'
import { dragHandle } from './pane-drag.svelte.ts'

interface Props {
  node: TabsNode
}

const { node }: Props = $props()

const activeChild = $derived(node.children[node.activeIndex] ?? node.children[0])
const activeMeta = $derived(activeChild ? paneMeta.get(activeChild.id) : {})
const focused = $derived(node.children.some((c) => c.id === layout.focusedPaneId))

const titleOf = (widget: string): string => resolveWidget(widget)?.title ?? widget

/** Last two path segments are enough to orient without eating the tab. */
function shorten(text: string | undefined): string {
  if (text === undefined || text === '') return ''
  const parts = text.split(/[\\/]/).filter((p) => p !== '')
  if (parts.length <= 2) return text
  return `…/${parts.slice(-2).join('/')}`
}
</script>

<section
  class="tabs-host"
  class:focused
  data-testid="tabs-host"
  data-node-id={node.id}
  data-drop-node={node.id}
>
  <!-- The group's header moves the whole group; a tab moves just that tab. -->
  <header
    class="hud-label drag-handle"
    {@attach dragHandle(node.id, () => (activeChild ? titleOf(activeChild.widget) : ''))}
  >
    <span>{activeChild ? titleOf(activeChild.widget) : ''}</span>
    <span class="keep-case">{activeMeta.subtitle ?? ''}</span>
  </header>

  <div class="shell-frame frame">
    <!--
      eDEX-UI's tab strip: every tab is a parallelogram (skewX) sharing the full
      width, separated by a slanted rule; the active one is filled with the
      accent and its label turns dark. The label is counter-skewed so the text
      stays upright.
    -->
    <ul class="tabs" data-testid="tab-strip">
      {#each node.children as child, index (child.id)}
        {@const meta = paneMeta.get(child.id)}
        <li class="tab" class:active={index === node.activeIndex}>
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
            const first = node.children[0]
            if (first) layout.addTab(first.id, first.widget)
          }}
          data-testid="tab-new"><span class="upright">+</span></button
        >
      </li>
    </ul>

    <div class="panes">
      {#each node.children as child, index (child.id)}
        <PaneHost node={child} visible={index === node.activeIndex} tabbed={true} />
      {/each}
    </div>
  </div>
</section>

<style>
/* A path is data, not a label: keep its case. */
.keep-case {
  text-transform: none;
  letter-spacing: 0;
}

.tabs-host {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.frame {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tabs-host.focused > .frame {
  --frame-color: var(--accent);
}

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

.panes {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  padding: var(--space-1);
}

/* Stack the tabs: each pane fills the area and only the active one displays. */
.panes > :global(.pane) {
  position: absolute;
  inset: var(--space-1);
  height: auto;
}
</style>
