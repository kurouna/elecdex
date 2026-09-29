<script lang="ts">
import type { Chip8Program } from '@shared/chip8-library'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { programRows } from './labels.ts'

/**
 * A program of the CHIP-8 library as a whole, while the pointer rests on its row or the
 * keyboard is on it: its whole description and how it runs - what the row has no room for.
 * The frame and its place are every detail card's (HoverCard, architecture.md §7.4).
 */
interface Props {
  program: Chip8Program
  anchor: CardAnchor
  bounds: CardSize
}

const { program, anchor, bounds }: Props = $props()
</script>

<HoverCard {anchor} {bounds} width="22rem" testid="chip8-card">
  {#if program.description !== ''}
    <p class="description">{program.description}</p>
  {/if}
  <CardRows rows={programRows(program)} />
</HoverCard>

<style>
.description {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  line-height: 1.45;
  white-space: normal;
}
</style>
