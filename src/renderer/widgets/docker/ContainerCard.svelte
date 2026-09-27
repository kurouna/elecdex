<script lang="ts">
import { type DockerContainer, execCommand } from '@shared/docker'
import { type CardAnchor, type CardSize, cardTime } from '../../lib/hover-card.ts'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import { containerRows, stateTone, stateWord } from './docker-view.ts'

/**
 * A container as a whole, shown while the pointer rests on its name (or the
 * keyboard is on it): its full name, and what the row has no room for -
 * the image in full, the Compose project and its folder, the engine's own
 * words for its state, every port with its address, what it uses against its
 * limit, when it was made and its id. The frame and its place are every detail
 * card's (HoverCard, architecture.md §7.4).
 */
interface Props {
  container: DockerContainer
  anchor: CardAnchor
  bounds: CardSize
}

const { container, anchor, bounds }: Props = $props()

const exec = $derived(execCommand(container))
</script>

<HoverCard {anchor} {bounds} testid="docker-card">
  <p class="head">
    <span class="name">{container.name}</span>
    <span class="word" data-tone={stateTone(container)}>{stateWord(container)}</span>
  </p>
  <CardRows rows={containerRows(container, cardTime)} />
  <p class="foot">
    <span>click the name to copy it</span>
    {#if exec !== null}<span>›_ copies <code>{exec}</code></span>{/if}
  </p>
</HoverCard>

<style>
p {
  margin: 0;
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.8rem;
  align-items: baseline;
}

.name {
  color: var(--text);
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}

.word {
  --tone: var(--text-muted);
  color: var(--tone);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
}

.word[data-tone="ok"] {
  --tone: var(--ok);
}

.word[data-tone="info"] {
  --tone: var(--info);
}

.word[data-tone="warn"] {
  --tone: var(--warn);
}

.word[data-tone="danger"] {
  --tone: var(--danger);
}

.foot {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.9rem;
  margin-top: 0.35rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-size: var(--step--2);
}

code {
  font-family: var(--font-mono);
}
</style>
