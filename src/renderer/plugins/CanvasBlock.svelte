<script lang="ts">
import { untrack } from 'svelte'

/**
 * A canvas block (docs/plugins.md section 13): a surface the plugin draws on itself, in its
 * worker. The element's drawing is handed over once - a canvas cannot be handed to a
 * second worker - so it is made anew for each epoch, the view's mount in a worker.
 */
interface Props {
  id: string
  /** CSS pixels; the rest of the pane when undefined. */
  height: number | undefined
  epoch: number
  onsurface: (id: string, element: HTMLCanvasElement) => () => void
}

const { id, height, epoch, onsurface }: Props = $props()

let element = $state<HTMLCanvasElement | null>(null)

$effect(() => {
  const canvas = element
  if (canvas === null) return
  return untrack(() => onsurface(id, canvas))
})
</script>

<!-- A new id at this place in the blocks is a new surface, as a new epoch is. -->
{#key `${epoch}:${id}`}
  <canvas
    bind:this={element}
    class="surface"
    class:fill={height === undefined}
    style:height={height === undefined ? undefined : `${height}px`}
    data-testid="plugin-canvas"
    data-surface={id}
  ></canvas>
{/key}

<style>
.surface {
  display: block;
  width: 100%;
  min-height: 40px;
}

.surface.fill {
  flex: 1 1 0;
}
</style>
