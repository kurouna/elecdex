<script lang="ts">
import { isMetricSourceId } from '@shared/metrics'
import type { PaneNode } from '@shared/schemas/layout'
import { boot, CRT_MODULE_MS, CRT_SHELL_MS } from '../stores/boot.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { metrics } from '../stores/metrics.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'

interface Props {
  node: PaneNode
  /** False for a tab that is stacked behind another; it stays mounted. */
  visible: boolean
  /** True inside a tab group, which draws the chrome itself. */
  tabbed: boolean
}

const { node, visible, tabbed }: Props = $props()

const definition = $derived(resolveWidget(node.widget))
const meta = $derived(paneMeta.get(node.id))
const focused = $derived(layout.focusedPaneId === node.id)
const active = $derived(visible && focused)
const chrome = $derived(tabbed ? 'bare' : (definition?.chrome ?? 'module'))
const title = $derived(meta.title ?? definition?.title ?? node.widget)
/** Set only during the boot reveal: when this pane's CRT power-on starts. */
const bootDelay = $derived(boot.delayFor(node.id))
const bootDuration = $derived(definition?.chrome === 'shell' ? CRT_SHELL_MS : CRT_MODULE_MS)

// Subscribe to the sources the widget declares, for exactly as long as this
// pane exists. Unknown ids (a plugin naming a source this build lacks) are
// ignored rather than sent to main, which would reject them anyway.
$effect(() => {
  const releases = (definition?.metrics ?? [])
    .filter(isMetricSourceId)
    .map((id) => metrics.retain(id))
  return () => {
    for (const release of releases) release()
  }
})

// Clean up the pane's published metadata when it goes away, so a recycled id
// cannot inherit a previous pane's cwd.
$effect(() => () => paneMeta.clear(node.id))
</script>

{#snippet widget()}
  {#if definition === null}
    <p class="missing" data-testid="pane-missing">
      unknown widget <code>{node.widget}</code>
    </p>
  {:else}
    {@const Widget = definition.component}
    <Widget paneId={node.id} title={definition.title} props={node.props} state={node.state} {active} />
  {/if}
{/snippet}

{#snippet headline()}
  <span>{title}</span>
  <span class="sub">
    {#if meta.badge}
      <em class={meta.badgeKind ?? 'danger'} data-testid="pane-badge">{meta.badge}</em>
    {/if}
    <span data-testid="pane-subtitle">{meta.subtitle ?? ''}</span>
  </span>
{/snippet}

<section
  aria-label={title}
  class="pane chrome-{chrome}"
  class:focused
  class:hidden={!visible}
  class:crt-on={bootDelay !== null}
  style:--crt-delay={bootDelay === null ? undefined : `${bootDelay}ms`}
  style:--crt-duration={bootDelay === null ? undefined : `${bootDuration}ms`}
  data-testid="pane"
  data-pane-id={node.id}
  data-widget={node.widget}
  data-chrome={chrome}
  onfocusin={() => layout.focus(node.id)}
  onpointerdown={() => layout.focus(node.id)}
>
  {#if chrome === 'shell'}
    <header class="hud-label">{@render headline()}</header>
    <div class="shell-frame body">{@render widget()}</div>
  {:else if chrome === 'module'}
    <div class="hud-module module">
      {#if !definition?.headless}
        <header class="module-title">{@render headline()}</header>
      {/if}
      <div class="body">{@render widget()}</div>
    </div>
  {:else}
    <div class="body">{@render widget()}</div>
  {/if}
</section>

<style>
.pane {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* A hidden tab keeps its DOM (and its shell) but takes no space. */
.pane.hidden {
  display: none;
}

.chrome-shell {
  gap: var(--space-2);
}

.module {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-top: var(--tick-size);
}

.body {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.chrome-shell > .body {
  padding: var(--space-1);
}

/* Focus: the shell frame brightens; a module's rule does. */
.chrome-shell.focused > .body {
  --frame-color: var(--accent);
}

.chrome-module.focused > .module {
  --panel-rule: var(--panel-border);
}

.sub {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: var(--space-2);
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-transform: none;
}

.sub em {
  font-style: normal;
  font-weight: 600;
}

.sub em.danger {
  color: var(--danger);
}
.sub em.warn {
  color: var(--warn);
}
.sub em.ok {
  color: var(--ok);
}

.missing {
  padding: var(--space-3);
  color: var(--warn);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
</style>
