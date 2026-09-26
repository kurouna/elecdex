<script lang="ts">
import type { NowPlayingSession } from '@shared/now-playing'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { nowPlayingRows } from './card.ts'

/**
 * The track as a whole, shown while the pointer rests on the art (or the
 * keyboard is on it): the art large - main's larger copy, asked for when the
 * card opens, the plate's own until it comes - the full title, and what the
 * pane has no room for. The frame and its place are every detail card's
 * (HoverCard, architecture.md §7.4).
 */
interface Props {
  session: NowPlayingSession
  /** The card's art, or null while it is on its way (the plate's is shown meanwhile). */
  large: string | null
  anchor: CardAnchor
  bounds: CardSize
}

const { session, large, anchor, bounds }: Props = $props()

/** The art's longer side, as large as the pane leaves room for beside the words. */
const edge = $derived(Math.max(96, Math.min(256, bounds.height - 170, bounds.width - 40)))
/** Its shape: a video's thumbnail is wide, and is shown wide rather than boxed in black. */
const ratio = $derived(
  session.artSize === null ? 1 : session.artSize.width / Math.max(1, session.artSize.height),
)
</script>

<HoverCard {anchor} {bounds} testid="np-card">
  {#if session.art !== null}
    <img
      class="art"
      src={large ?? session.art}
      alt=""
      style:width="{ratio >= 1 ? edge : Math.round(edge * ratio)}px"
      style:height="{ratio >= 1 ? Math.round(edge / ratio) : edge}px"
      data-testid="np-card-art"
      data-large={large !== null}
    />
  {/if}
  <p class="title" data-testid="np-card-title">{session.title ?? 'untitled'}</p>
  <CardRows rows={nowPlayingRows(session)} />
</HoverCard>

<style>
.art {
  display: block;
  margin-bottom: 0.4rem;
  object-fit: cover;
  background: var(--app-bg);
}

.title {
  max-width: 20rem;
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step-0);
  font-weight: 600;
  overflow-wrap: anywhere;
}
</style>
