<script lang="ts">
import type { Elec16FileInfo } from '@shared/elec16-units'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { fileRows } from './file-card.ts'

/**
 * A file of FILES - the unit's card or the SOFT CARD - while the pointer rests on its row:
 * what a SOFT CARD program is, and what the row has no room for (file-card.ts). The frame and
 * its place are every detail card's (HoverCard, architecture.md §7.4).
 */
interface Props {
  file: Elec16FileInfo
  soft: boolean
  anchor: CardAnchor
  bounds: CardSize
}

const { file, soft, anchor, bounds }: Props = $props()
</script>

<HoverCard {anchor} {bounds} width="18rem" testid="elec16-file-card">
  {#if file.about !== undefined && file.about !== ''}
    <p class="about">{file.about}</p>
  {/if}
  <CardRows rows={fileRows(file, soft)} />
</HoverCard>

<style>
.about {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  line-height: 1.45;
  white-space: normal;
}
</style>
