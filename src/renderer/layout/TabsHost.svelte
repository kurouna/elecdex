<script lang="ts">
import type { TabsNode } from '@shared/schemas/layout'
import { layout } from '../stores/layout.svelte.ts'
import { paneMeta } from '../stores/pane-meta.svelte.ts'
import { resolveWidget } from '../widgets/registry.ts'
import PaneHost from './PaneHost.svelte'
import { dragHandle } from './pane-drag.svelte.ts'
import TabStrip from './TabStrip.svelte'

interface Props {
  node: TabsNode
}

const { node }: Props = $props()

const activeChild = $derived(node.children[node.activeIndex] ?? node.children[0])
const activeMeta = $derived(activeChild ? paneMeta.get(activeChild.id) : {})
const focused = $derived(node.children.some((c) => c.id === layout.focusedPaneId))

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
  data-testid="tabs-host"
  data-node-id={node.id}
  data-drop-node={node.id}
>
  <!-- The group's header moves the whole group; a tab moves just that tab. -->
  <header
    class="hud-label drag-handle"
    {@attach dragHandle(node.id, () => activeTitle)}
  >
    <span>{activeTitle}</span>
    <span class="keep-case">{activeMeta.subtitle ?? ''}</span>
  </header>

  <div class="shell-frame frame">
    <TabStrip panes={node.children} activeIndex={node.activeIndex} />

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
