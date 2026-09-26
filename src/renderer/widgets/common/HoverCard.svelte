<script lang="ts">
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import { crtPower } from '../../lib/crt-transitions.ts'
import { type CardAnchor, type CardSize, cardPlacement } from '../../lib/hover-card.ts'

/**
 * The frame of a detail card (architecture.md §7.4): laid over its pane beside
 * what it is about, kept inside the pane, drawn the same in every pane. The pane
 * gives the content, and decides when it shows through HoverRest
 * (lib/hover-card.ts).
 *
 * `power` is the tube's power-on and power-off, as dialogs have; a card that
 * follows the pointer across a map (ORBIT's) goes without it, since it comes and
 * goes as fast as the pointer moves.
 */
interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What it is about, in the pane's own pixels (`anchorOf`). */
  anchor: CardAnchor
  /** The pane's size: the card keeps inside it. */
  bounds: CardSize
  /** A fixed width (a CSS length); otherwise as wide as its content, up to 32rem. */
  width?: string | undefined
  power?: boolean
  testid: string
  children: Snippet
}

const { anchor, bounds, width, power = true, testid, children, ...rest }: Props = $props()

let cardWidth = $state(0)
let cardHeight = $state(0)
const place = $derived(cardPlacement(anchor, bounds, { width: cardWidth, height: cardHeight }))

const transition = (node: HTMLElement) => (power ? crtPower(node) : { duration: 0 })
</script>

<div
  {...rest}
  class="hover-card"
  class:fixed={width !== undefined}
  class:crt-on={power}
  role="tooltip"
  data-testid={testid}
  style:left="{place.left}px"
  style:top="{place.top}px"
  style:width
  bind:clientWidth={cardWidth}
  bind:clientHeight={cardHeight}
  transition:transition
>
  {@render children()}
</div>

<style>
.hover-card {
  position: absolute;
  z-index: 20;
  width: max-content;
  max-width: min(32rem, calc(100% - 12px));
  max-height: calc(100% - 12px);
  overflow: hidden;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--accent);
  background: var(--panel-bg-raised);
  box-shadow: 0 0 0.8rem color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  pointer-events: none;
}

/* A fixed width still keeps inside a narrow pane. */
.hover-card.fixed {
  max-width: calc(100% - 12px);
}
</style>
