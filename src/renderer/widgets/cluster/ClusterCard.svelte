<script lang="ts">
import { type CardAnchor, type CardSize, cardTime } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { CARD_TITLES, type CardKey, type CardReadings, cardRows } from './cluster-cards.ts'

/**
 * A CLUSTER figure's detail card: what its row has no room for (cluster-cards.ts),
 * in the frame and place every detail card has (architecture.md §7.4).
 */
interface Props {
  key: CardKey
  readings: CardReadings
  anchor: CardAnchor
  bounds: CardSize
}

const { key, readings, anchor, bounds }: Props = $props()
</script>

<HoverCard {anchor} {bounds} testid="cluster-card">
  <p class="head">{CARD_TITLES[key]}</p>
  <CardRows rows={cardRows(key, readings, cardTime)} />
</HoverCard>

<style>
.head {
  margin: 0;
  font-family: var(--font-ui);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
}
</style>
