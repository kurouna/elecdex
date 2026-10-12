<script lang="ts">
import { maskText } from '@shared/logwatch/text'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { lineCardRows, type Row } from './view.ts'

/**
 * A line as a whole (docs/logwatch.md §9): its full time and whether the log named a zone, its
 * fields, its pattern, and the line as it was written - what the row has no room for. Masked
 * when MASK is on, as the row is.
 */
interface Props {
  row: Row
  mask: boolean
  anchor: CardAnchor
  bounds: CardSize
}

const { row, mask, anchor, bounds }: Props = $props()

const shown = (text: string): string => (mask ? maskText(text) : text)
const raw = $derived(row.item.kind === 'line' ? shown(row.item.raw) : '')
</script>

<HoverCard {anchor} {bounds} width="min(34rem, 92%)" testid="logwatch-card">
  <p class="head">
    <span class="level">{row.item.kind === 'line' ? row.item.level : ''}</span>
    <span>click to choose it for EXPLAIN and COPY</span>
  </p>
  <CardRows rows={lineCardRows(row, mask)} />
  <p class="raw">{raw}</p>
</HoverCard>

<style>
p {
  margin: 0;
}

.head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.level {
  color: var(--text);
  font-family: var(--font-mono);
}

.raw {
  margin-top: 0.35rem;
  padding-top: 0.3rem;
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
  overflow-wrap: anywhere;
  max-height: 8lh;
  overflow: hidden;
}
</style>
