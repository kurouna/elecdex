<script lang="ts">
import type { LayoutNode } from '@shared/schemas/layout'
import PaneHost from './PaneHost.svelte'
import SplitHost from './SplitHost.svelte'
import TabsHost from './TabsHost.svelte'

/**
 * Dispatches one layout node to its renderer.
 *
 * Split children recurse back through here, which is why this is its own
 * component: Svelte needs a named module to reference itself indirectly.
 */
interface Props {
  node: LayoutNode
}

const { node }: Props = $props()
</script>

{#if node.kind === 'split'}
  <SplitHost {node} />
{:else if node.kind === 'tabs'}
  <TabsHost {node} />
{:else}
  <PaneHost {node} visible={true} tabbed={false} />
{/if}
