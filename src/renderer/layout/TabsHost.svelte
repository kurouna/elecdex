<script lang="ts">
import type { TabsNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget, zoomModeOf } from '../widgets/registry.ts'
import PaneCorner from './PaneCorner.svelte'
import PaneHost from './PaneHost.svelte'
import { CRT_CLOSE_MS, insetStyle } from './pane-close.ts'
import { dragHandle } from './pane-drag.svelte.ts'
import TabStrip from './TabStrip.svelte'
import ZoomFrame from './ZoomFrame.svelte'

interface Props {
  node: TabsNode
}

const { node }: Props = $props()

const activeChild = $derived(node.children[node.activeIndex] ?? node.children[0])
const activeMeta = $derived(activeChild ? paneMeta.get(activeChild.id) : {})
const focused = $derived(node.children.some((c) => c.id === layout.focusedPaneId))
/** The group, as a whole, uncovers the room a closed pane left it. */
const extend = $derived(activeChild ? layout.extending.get(activeChild.id) : undefined)
/**
 * The whole group powers off with its panes when one layout gives way to
 * another: its header and tab strip are part of the picture, and leaving them
 * lit over panes that have gone would show the frame of an empty room.
 */
const leaving = $derived(
  layout.leaving.size > 0 && node.children.every((child) => layout.leaving.has(child.id)),
)
/**
 * The whole group powering off, from its corner's ×: every tab goes with it, as
 * one picture, where a tab's own × takes just that tab (layout.close takes either).
 */
const closing = $derived(layout.closingId === node.id)
/**
 * The corner's × is under the pointer: every tab dims, as a closing tab does, so
 * what that × takes is seen before it is pressed - a tab's own × takes one tab,
 * and a browser has taught that every × on a strip does.
 */
let aimed = $state(false)
/**
 * A tab brought to the front brings its group with it: the strip and the header
 * come too, so the other tabs are still there to switch to, and the group is one
 * picture rather than a pane floating out of its own frame.
 */
const pinned = $derived(activeChild !== undefined && layout.pinnedPaneId === activeChild.id)
const zoomed = $derived(activeChild !== undefined && layout.zoomedPaneId === activeChild.id)
/**
 * The corner offers the zoom for the tab that is showing, since the group comes
 * forward as a whole: a tab whose widget has nothing to gain from the room is
 * offered nothing while it is the one on screen.
 */
const zoomable = $derived(activeChild !== undefined && zoomModeOf(activeChild.widget) !== null)
const groupStyle = $derived(
  [
    leaving || closing ? `--crt-duration: ${CRT_CLOSE_MS}ms` : null,
    extend === undefined ? null : insetStyle(extend),
    pinned ? layout.zoomStyle : null,
  ]
    .filter((part) => part != null)
    .join('; ') || undefined,
)

/** The selected tab's own title where it has one, else its widget's (TERMINAL for a shell). */
const activeTitle = $derived(
  activeChild
    ? (activeMeta.title ?? resolveWidget(activeChild.widget)?.title ?? activeChild.widget)
    : '',
)
</script>

<section
  class="tabs-host"
  class:focused
  class:crt-off={leaving || closing}
  class:crt-beam={leaving || closing}
  class:crt-extend={extend !== undefined}
  class:zoomed={pinned}
  class:crt-zoom={pinned && layout.zoomPhase === 'in'}
  class:crt-zoom-out={pinned && layout.zoomPhase === 'out'}
  style={groupStyle}
  inert={leaving || closing}
  data-testid="tabs-host"
  data-node-id={node.id}
  data-drop-node={node.id}
>
  {#if pinned}<ZoomFrame />{/if}
  <!-- The same corner every pane has: ⤢ brings the group forward, × closes all of it. -->
  <PaneCorner
    title={activeTitle}
    kind="group"
    {zoomable}
    {zoomed}
    count={node.children.length}
    onzoom={() => {
      if (activeChild) layout.toggleZoom(activeChild.id)
    }}
    onclose={() => layout.close(node.id)}
    onaim={(on) => {
      aimed = on
    }}
  />
  <!-- The group's header moves the whole group; a tab moves just that tab. -->
  <header
    class="hud-label pane-head drag-handle"
    {@attach dragHandle(node.id, () => activeTitle)}
    data-testid="group-head"
  >
    <span>{activeTitle}</span>
    <span class="keep-case pane-head-sub" data-testid="group-subtitle" title={activeMeta.subtitle ?? ''}
      >{activeMeta.subtitle ?? ''}</span
    >
    <span class="pane-head-balance" aria-hidden="true"></span>
  </header>

  <div class="shell-frame frame">
    <TabStrip panes={node.children} activeIndex={node.activeIndex} doomed={aimed} />

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
  position: relative;
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

/* Pinned over the workspace by the zoom, as a lone pane is (layout/PaneHost). */
.tabs-host.zoomed {
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

.tabs-host.focused > .frame {
  --frame-color: var(--accent);
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
