<script lang="ts">
import type { BlockView } from '@shared/translate/run'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import HoverCard from '../common/HoverCard.svelte'
import { blockNumber } from './translate-view.ts'

/**
 * A block's number on the spine, rested on (docs/translate.md §3): what the row has no room for -
 * how it was written, how fast, and how many blocks before it went with it as history.
 */
interface Props {
  block: BlockView
  anchor: CardAnchor
  bounds: CardSize
}

const { block, anchor, bounds }: Props = $props()

const STATE: Record<BlockView['state'], string> = {
  queued: 'waiting',
  running: 'being written',
  done: 'translated',
  stopped: 'stopped',
  failed: 'failed',
  none: 'not translated',
}

const rate = $derived(
  block.tokens !== null && block.ms !== null && block.ms > 0
    ? `${Math.round((block.tokens / block.ms) * 1000)} t/s`
    : null,
)
</script>

<HoverCard {anchor} {bounds} width="19rem" testid="translate-block-card">
  <h4><span>Block {blockNumber(block.index)}</span><span>{STATE[block.state]}</span></h4>
  <dl>
    <dt>Source</dt>
    <dd>{block.source.length.toLocaleString('en-US')} ch</dd>
    {#if block.tokens !== null}
      <dt>Written</dt>
      <dd>{block.tokens} tokens · {((block.ms ?? 0) / 1000).toFixed(1)} s{rate ? ` · ${rate}` : ''}</dd>
    {/if}
    <dt>History</dt>
    <dd>{block.history === 0 ? 'none' : `the ${block.history === 1 ? 'block' : `${block.history} blocks`} before it`}</dd>
    {#if block.note}
      <dt>Note</dt>
      <dd class="note">{block.note}</dd>
    {/if}
  </dl>
</HoverCard>

<style>
h4 {
  margin: 0 0 0.3rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}
dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.1rem 0.8rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}
dt {
  color: var(--text-muted);
  font-size: var(--step--2);
  padding-top: 0.1rem;
  font-family: var(--font-ui);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.note {
  color: var(--warn);
}
</style>
