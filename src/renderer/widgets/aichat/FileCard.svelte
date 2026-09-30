<script lang="ts">
import type { ChatAttachment } from '@shared/ai'
import type { CardAnchor, CardSize } from '../../lib/hover-card.ts'
import HoverCard from '../common/HoverCard.svelte'

/**
 * A file of a question as a whole, shown while the pointer rests on its chip (or the keyboard is
 * on it): what the chip has no room for - the whole name, the exact size, the picture's pixels
 * and what it was made smaller from, the tokens it costs - and how it goes to the model. The
 * frame and its place are every detail card's (HoverCard, architecture.md §7.4).
 */
interface Props {
  file: ChatAttachment
  thumb: string | undefined
  /** Why the chosen provider is not sent it, when that is so. */
  unsent: string | null
  anchor: CardAnchor
  bounds: CardSize
}

const { file, thumb, unsent, anchor, bounds }: Props = $props()

const FORMATS: Record<ChatAttachment['mime'], string> = {
  'text/plain': 'text',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'application/pdf': 'PDF',
}

const HOW: Record<ChatAttachment['kind'], string> = {
  text: 'sent whole, inside the question, ahead of what you write',
  image: 'sent as a picture ahead of the question · what the camera wrote in the file is not sent',
  pdf: 'sent as a document ahead of the question: its text and a picture of every page',
}

const count = (n: number): string => n.toLocaleString('en-US')
</script>

<HoverCard {anchor} {bounds} testid="aichat-file-card">
  <div class="body">
    {#if thumb !== undefined}
      <img src={thumb} alt="" />
    {/if}
    <div class="facts">
      <p class="name" data-testid="aichat-file-card-name">{file.name}</p>
      <p>
        {FORMATS[file.mime]}{#if file.width !== undefined && file.height !== undefined}&nbsp;· {file.width}×{file.height}{/if}{#if file.pages !== undefined}&nbsp;· {file.pages} {file.pages === 1 ? 'page' : 'pages'}{/if}
      </p>
      {#if file.source !== undefined}
        <p class="muted" data-testid="aichat-file-card-source">made smaller from {file.source.width}×{file.source.height}</p>
      {/if}
      <p>{count(file.bytes)} bytes · ~{count(file.tokens)} tokens</p>
    </div>
  </div>
  <p class="foot">
    {#if unsent !== null}
      <span class="warn" data-testid="aichat-file-card-unsent">{unsent}</span>
    {:else}
      <span>{HOW[file.kind]}</span>
    {/if}
  </p>
</HoverCard>

<style>
p {
  margin: 0;
}

.body {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

img {
  flex: none;
  max-width: 8rem;
  max-height: 8rem;
  border: 1px solid var(--accent-dim);
}

.facts {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.name {
  color: var(--accent-strong);
  overflow-wrap: anywhere;
}

.muted {
  color: var(--text-muted);
}

.foot {
  margin-top: 0.35rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-size: var(--step--1);
}

.warn {
  color: var(--warn);
}
</style>
