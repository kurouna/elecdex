<script lang="ts">
import type { PaneNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'

interface Props {
  node: PaneNode
  /** False for a tab that is stacked behind another; it stays mounted. */
  visible: boolean
  /** True when this pane is inside a tab group, which draws its own header. */
  tabbed: boolean
}

const { node, visible, tabbed }: Props = $props()

const definition = $derived(resolveWidget(node.widget))
const meta = $derived(paneMeta.get(node.id))
const focused = $derived(layout.focusedPaneId === node.id)
const active = $derived(visible && focused)

// Clean up the pane's published metadata when it goes away, so a recycled id
// cannot inherit a previous pane's cwd.
$effect(() => () => paneMeta.clear(node.id))
</script>

<section
  aria-label={meta.title ?? definition?.title ?? node.widget}
  class="frame pane"
  class:focused
  class:hidden={!visible}
  data-notch={tabbed ? 'none' : 'tr bl'}
  data-testid="pane"
  data-pane-id={node.id}
  data-widget={node.widget}
  onfocusin={() => layout.focus(node.id)}
  onpointerdown={() => layout.focus(node.id)}
>
  {#if !tabbed}
    <header class="frame-title">
      <span>{meta.title ?? definition?.title ?? node.widget}</span>
      <span class="right">
        {#if meta.badge}
          <em class={meta.badgeKind ?? 'danger'} data-testid="pane-badge">{meta.badge}</em>
        {/if}
        <span data-testid="pane-subtitle">{meta.subtitle ?? ''}</span>
      </span>
    </header>
  {/if}

  <div class="body">
    {#if definition === null}
      <p class="missing" data-testid="pane-missing">
        unknown widget <code>{node.widget}</code>
      </p>
    {:else}
      {@const Widget = definition.component}
      <Widget
        paneId={node.id}
        title={definition.title}
        props={node.props}
        state={node.state}
        {active}
      />
    {/if}
  </div>
</section>

<style>
.pane {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  transition: border-color var(--dur-fast) var(--ease-out);
}

/* A hidden tab keeps its DOM (and its shell) but takes no space. */
.pane.hidden {
  display: none;
}

.pane.focused {
  --panel-border: var(--accent);
}

.body {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.right {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-transform: none;
  letter-spacing: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.right em {
  font-style: normal;
}

.right em.danger {
  color: var(--danger);
}
.right em.warn {
  color: var(--warn);
}
.right em.ok {
  color: var(--ok);
}

.missing {
  padding: var(--space-4);
  color: var(--warn);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
</style>
