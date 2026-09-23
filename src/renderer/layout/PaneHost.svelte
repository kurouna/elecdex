<script lang="ts">
import { isMetricSourceId, type MetricSourceId } from '@shared/metrics'
import type { PaneNode } from '@shared/schemas/layout'
import { untrack } from 'svelte'
import PluginPane from '../plugins/PluginPane.svelte'
import { appearance } from '../stores/appearance.svelte.ts'
import { boot, CRT_ADDED_MS, CRT_MODULE_MS, CRT_SHELL_MS } from '../stores/boot.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { metrics } from '../stores/metrics.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { seen } from '../stores/window-state.svelte.ts'
import { resolveWidget, zoomModeOf } from '../widgets/registry.ts'
import PaneCorner from './PaneCorner.svelte'
import { CRT_CLOSE_MS, insetStyle } from './pane-close.ts'
import { dragHandle } from './pane-drag.svelte.ts'
import TabStrip from './TabStrip.svelte'

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
/**
 * When this pane's CRT power-on starts: during the boot reveal, or while a
 * layout arrives in place of another (layout-switch.ts), which is the same
 * effect played quicker.
 */
const bootDelay = $derived(boot.delayFor(node.id))
const switchDelay = $derived(layout.switchDelays?.get(node.id) ?? null)
const revealDelay = $derived(bootDelay ?? switchDelay)
const revealDuration = $derived(
  bootDelay === null
    ? layout.switchOnMs
    : definition?.chrome === 'shell'
      ? CRT_SHELL_MS
      : CRT_MODULE_MS,
)
/**
 * A pane just added powers on like the panes at boot, only quicker, and once: asked
 * as the pane mounts, so a later remount (a move) is not an arrival. Not at all with
 * motion reduced, where the class would leave its beam showing, unanimated.
 */
let poweringOn = $state(untrack(() => layout.arrived(node.id) && !appearance.reducedMotion))
/**
 * Powering off: still in the tree until it has, and out of reach meanwhile.
 * Either this pane alone, or the whole screen as one layout gives way to
 * another.
 */
const closing = $derived(layout.closingId === node.id || (!tabbed && layout.leaving.has(node.id)))
/**
 * Brought to the front: this pane is pinned over the workspace. A tabbed pane is
 * brought forward with its whole group, which pins itself, so only a pane
 * outside a group is pinned here - but either way the pane flies with it, which
 * a web pane must know about (its page is a view that cannot be transformed).
 */
const pinned = $derived(!tabbed && layout.pinnedPaneId === node.id)
const flying = $derived(layout.pinnedPaneId === node.id && layout.zoomPhase !== null)
const zoomed = $derived(layout.zoomedPaneId === node.id)
/**
 * Whether this widget is brought forward at all (widgets/registry.ts). Asked of
 * the node this host already has, rather than of the store, which would walk the
 * tree for an id it was given from that same node.
 */
const zoomable = $derived(zoomModeOf(node.widget) !== null)
/** Every other pane is behind the zoom: out of reach until it is put back. */
const behindZoom = $derived(layout.zoomedPaneId !== null && !zoomed)
/** Uncovering the room a closed pane left; a tab's group does it for a tabbed pane. */
const extend = $derived(tabbed ? undefined : layout.extending.get(node.id))
// Each of these cuts short a power-on still playing, whose end is then never seen:
// a close or an extension replaces its animation, as the flight of a pane brought
// forward does, and a tab put behind another is display:none, which cancels it
// without an event to say so. Left set, the power-on played again - when the tab
// was next shown, or in front of everything as the flight landed.
$effect(() => {
  if (closing || extend !== undefined || pinned || !visible) poweringOn = false
})
const crtOn = $derived(!closing && extend === undefined && (revealDelay !== null || poweringOn))
/** Drawn scaled or clipped rather than at its place; a tab's group clips it as a whole. */
const transitioning = $derived(crtOn || closing || flying || layout.extending.has(node.id))
const crtStyle = $derived.by(() => {
  if (closing) return `--crt-duration: ${CRT_CLOSE_MS}ms`
  if (extend !== undefined) return insetStyle(extend)
  if (revealDelay !== null)
    return `--crt-delay: ${revealDelay}ms; --crt-duration: ${revealDuration}ms`
  return poweringOn ? `--crt-duration: ${CRT_ADDED_MS}ms` : undefined
})
/** The pane's own effects, then where the zoom has put it, which comes last. */
const paneStyle = $derived(
  [crtStyle, pinned ? layout.zoomStyle : null].filter((part) => part != null).join('; ') ||
    undefined,
)

// Subscribe to the sources the widget declares: those it keeps while hidden for
// as long as the pane exists, the rest only while it is visible - a tab behind
// another is display:none, and a process list nobody sees is not worth polling.
// Two effects, so that showing or hiding a tab never releases and retains a kept
// source in one go (which would restart its polling and blank its sample).
// Unknown ids (a plugin naming a source this build lacks) are ignored rather
// than sent to main, which would reject them anyway.
const declared = $derived((definition?.metrics ?? []).filter(isMetricSourceId))
const kept = $derived(new Set(definition?.keepWhileHidden ?? []))

function retainAll(ids: readonly MetricSourceId[]): () => void {
  const releases = ids.map((id) => metrics.retain(id))
  return () => {
    for (const release of releases) release()
  }
}

$effect(() => retainAll(declared.filter((id) => kept.has(id))))
// Nor while the window is minimised or put away: nobody sees the pane then either.
$effect(() => (seen(visible) ? retainAll(declared.filter((id) => !kept.has(id))) : undefined))

// Clean up the pane's published metadata when it goes away, so a recycled id
// cannot inherit a previous pane's cwd.
$effect(() => () => paneMeta.clear(node.id))
</script>

{#snippet widget()}
  {#if node.widget.startsWith('plugin:')}
    <!-- Every plugin pane, loaded or not: it says why a plugin is not running, and is not
         remounted when the plugin registers. -->
    <PluginPane paneId={node.id} title={title} props={node.props} state={node.state} active={active} widget={node.widget} />
  {:else if definition === null}
    <p class="missing" data-testid="pane-missing">
      unknown widget <code>{node.widget}</code>
    </p>
  {:else}
    {@const Widget = definition.component}
    <Widget paneId={node.id} title={definition.title} props={node.props} state={node.state} {active} {visible} {transitioning} widget={node.widget} />
  {/if}
{/snippet}

<!-- A shell's header centres what it shows; a module's keeps its readouts on the right. -->
{#snippet headline(centred: boolean)}
  <span>{title}</span>
  <span class="sub" class:pane-head-sub={centred} title={meta.subtitle ?? ''}>
    {#if meta.badge}
      <em class={meta.badgeKind ?? 'danger'} data-testid="pane-badge">{meta.badge}</em>
    {/if}
    <span data-testid="pane-subtitle">{meta.subtitle ?? ''}</span>
  </span>
  {#if centred}<span class="pane-head-balance" aria-hidden="true"></span>{/if}
{/snippet}

<section
  aria-label={title}
  class="pane chrome-{chrome}"
  class:focused
  class:hidden={!visible}
  class:crt-on={crtOn}
  class:crt-off={closing}
  class:crt-beam={closing}
  class:crt-extend={extend !== undefined}
  class:zoomed={pinned}
  class:crt-zoom={pinned && layout.zoomPhase === 'in'}
  class:crt-zoom-out={pinned && layout.zoomPhase === 'out'}
  style={paneStyle}
  inert={closing || behindZoom}
  data-testid="pane"
  data-pane-id={node.id}
  data-widget={node.widget}
  data-chrome={chrome}
  data-zoomed={zoomed ? 'true' : undefined}
  data-drop-node={tabbed ? undefined : node.id}
  onfocusin={() => layout.focus(node.id)}
  onpointerdown={() => layout.focus(node.id)}
  onanimationend={(e) => {
    // The pane's own power-on, not an animation inside it or its beam.
    if (e.target === e.currentTarget && e.animationName === 'crt-power-on') poweringOn = false
  }}
>
  {#if chrome !== 'bare'}
    <!-- A tabbed pane's corner is its group's (TabsHost); every other pane has its own. -->
    <PaneCorner
      {title}
      kind="pane"
      {zoomable}
      {zoomed}
      onzoom={() => layout.toggleZoom(node.id)}
      onclose={() => layout.close(node.id)}
    />
  {/if}
  {#if chrome === 'shell'}
    <header class="hud-label pane-head drag-handle" {@attach dragHandle(node.id, () => title)}>
      {@render headline(true)}
    </header>
    <!-- A shell on its own still has its tab strip, so its + can start a group of tabs. -->
    <div class="shell-frame frame">
      <TabStrip panes={[node]} activeIndex={0} />
      <div class="body">{@render widget()}</div>
    </div>
  {:else if chrome === 'module'}
    <div class="hud-module module">
      {#if definition?.headless}
        <!-- No title to hold, so the strip along the top rule is the handle. -->
        <div
          class="drag-strip drag-handle"
          {@attach dragHandle(node.id, () => title)}
          data-testid="pane-drag-strip"
        ></div>
      {:else}
        <header
          class="module-title pane-head drag-handle"
          class:close-only={!zoomable}
          {@attach dragHandle(node.id, () => title)}
        >
          {@render headline(false)}
        </header>
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

/*
 * Pinned over the workspace by the zoom (styles/crt.css plays the flight). Fixed
 * rather than moved in the tree: the pane is not remounted, so its widget keeps
 * everything it holds, and the slot it came out of keeps its size, so none of
 * the panes it covers is resized.
 */
.pane.zoomed {
  position: fixed;
  /* On the app's own ground: a pane is see-through, and over the shade its
     widget would be read against whatever is behind it. */
  background: var(--app-bg);
  top: var(--zoom-top);
  left: var(--zoom-left);
  width: var(--zoom-width);
  height: var(--zoom-height);
  z-index: 61;
}

/* A hidden tab keeps its DOM (and its shell) but takes no space. */
.pane.hidden {
  display: none;
}

.chrome-shell {
  gap: var(--space-2);
}

.drag-strip {
  position: absolute;
  inset: calc(-1 * var(--tick-size)) 0 auto;
  height: calc(var(--tick-size) + var(--space-2));
  z-index: 1;
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

.chrome-shell > .frame {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chrome-shell .body {
  padding: var(--space-1);
}

/* Focus: the shell frame brightens; a module's rule does. */
.chrome-shell.focused > .frame {
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

.sub.pane-head-sub {
  justify-content: center;
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
