<script lang="ts">
/**
 * The buttons in a pane's top-right corner: ⤢ to bring it forward (only for a
 * widget that gains from the room, registry.ts) and × to close it. One picture for
 * every kind of pane - a module, a shell on its own and a tab group all carry
 * them here - so the corner means the same thing wherever the pointer lands. A
 * group's × closes the whole group; its tabs keep their own × for one tab at a
 * time.
 *
 * Out of the way until wanted: they show on hover, or while what they belong to
 * has keyboard focus. Rendered as direct children of the pane's element, whose
 * hover is what reveals them.
 */
interface Props {
  /** What the buttons act on, for their labels. */
  title: string
  /** 'pane' or 'group', which names the test ids. */
  kind: 'pane' | 'group'
  zoomable: boolean
  zoomed: boolean
  /** For a group: how many tabs its × closes, which its label says. */
  count?: number
  onzoom: () => void
  onclose: () => void
  /**
   * The pointer, or the keyboard, is on the ×: what it would close can show it -
   * a group dims every tab, so the × is never taken for a browser's one-tab ×.
   */
  onaim?: (aimed: boolean) => void
}

const { title, kind, zoomable, zoomed, count, onzoom, onclose, onaim }: Props = $props()

/** A group's × says it takes every tab; a pane's, the pane. */
const closeLabel = $derived(kind === 'group' ? `close all ${count ?? 0} tabs` : `close ${title}`)
const closeTitle = $derived(
  kind === 'group'
    ? `Close all ${count ?? 0} tabs (a tab's × closes one)`
    : 'Close pane (Ctrl+Shift+W)',
)
</script>

{#if zoomable}
  <button
    type="button"
    class="zoom"
    aria-pressed={zoomed}
    aria-label={`${zoomed ? 'put back' : 'bring forward'} ${title}`}
    title={zoomed ? 'Put the pane back (Ctrl+Shift+Z)' : 'Bring the pane forward (Ctrl+Shift+Z)'}
    onclick={(e) => {
      e.stopPropagation()
      onzoom()
    }}
    data-testid="{kind}-zoom">{zoomed ? '⤡' : '⤢'}</button
  >
{/if}
<button
  type="button"
  class="close"
  aria-label={closeLabel}
  title={closeTitle}
  onclick={(e) => {
    e.stopPropagation()
    onclose()
  }}
  onpointerenter={() => onaim?.(true)}
  onpointerleave={() => onaim?.(false)}
  onfocus={() => onaim?.(true)}
  onblur={() => onaim?.(false)}
  data-testid="{kind}-close">×</button
>

<style>
.close,
.zoom {
  position: absolute;
  top: calc(var(--tick-size) * 0.2);
  right: 0;
  z-index: 5;
  width: 1.1rem;
  height: 1.1rem;
  padding: 0;
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--1);
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}

/* Beside the close, inside it: the pane is brought forward more often than closed. */
.zoom {
  right: 1.3rem;
}

/* Revealed by whatever holds them: a pane or a tab group, hovered or focused. */
:global(:hover) > .close,
:global(:focus-within) > .close,
.close:focus-visible,
:global(:hover) > .zoom,
:global(:focus-within) > .zoom,
.zoom:focus-visible,
.zoom[aria-pressed='true'] {
  opacity: 1;
}

.close:hover {
  color: var(--text-inverse);
  background: var(--danger);
  border-color: var(--danger);
}

.zoom:hover,
.zoom[aria-pressed='true'] {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
