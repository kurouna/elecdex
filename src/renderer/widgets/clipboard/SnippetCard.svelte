<script lang="ts">
import { CLIP_PREVIEW_CHARS, clipAge, clipFormats, clipSize, clipTags } from '@shared/clipboard'
import type { SnippetView } from '@shared/snippets'
import { type CardAnchor, type CardSize, cardTime } from '../../lib/hover-card.ts'
import HoverCard from '../common/HoverCard.svelte'

/**
 * A snippet as a whole, shown while the pointer rests on its row (or the
 * keyboard is on it): what it says, as far as the page has it, what comes with
 * it when it is copied, and when it was kept and last used - what the row has
 * no room for (architecture.md §7.4). It is someone's text: drawn as text.
 */
interface Props {
  snippet: SnippetView
  current: boolean
  now: number
  anchor: CardAnchor
  bounds: CardSize
}

const { snippet, current, now, anchor, bounds }: Props = $props()

const time = cardTime
const cut = $derived(snippet.chars > CLIP_PREVIEW_CHARS)
</script>

<HoverCard {anchor} {bounds} testid="snip-card">
  <p class="meta">
    {#each clipTags(snippet) as tag (tag)}<span class="tag" class:rich={tag === 'RICH'}>{tag}</span>{/each}
    <span>{clipSize(snippet)}</span>
    {#if current}<span class="on">ON CLIPBOARD</span>{/if}
  </p>
  <p class="text" data-testid="snip-card-text">{#if snippet.kind === 'color'}<i class="swatch" style:background-color={snippet.preview.trim()}></i>{/if}{snippet.preview}{#if cut}<span class="more">…</span>{/if}</p>
  {#if cut}
    <p class="note">the first {CLIP_PREVIEW_CHARS.toLocaleString('en-US')} of {snippet.chars.toLocaleString('en-US')} characters</p>
  {/if}
  <p class="foot">
    <span data-testid="snip-card-formats">{clipFormats(snippet)}</span>
    <span>kept {time(snippet.createdAt)}</span>
    {#if snippet.updatedAt !== snippet.createdAt}<span>edited {time(snippet.updatedAt)}</span>{/if}
    {#if snippet.usedAt !== null}
      <span data-testid="snip-card-used">copied {snippet.copies} {snippet.copies === 1 ? 'time' : 'times'}, last {time(snippet.usedAt)} · {clipAge(snippet.usedAt, now)}</span>
    {:else}
      <span>never copied yet</span>
    {/if}
  </p>
</HoverCard>

<style>
p {
  margin: 0;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 0.6rem;
  color: var(--text-muted);
}

.tag {
  padding: 0 0.3rem;
  border: 1px solid var(--accent-dim);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
}

.tag.rich {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.on {
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.08em;
}

.text {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 0.3rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 16;
  line-clamp: 16;
}

.more {
  color: var(--text-muted);
}

.swatch {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  margin-right: 0.4rem;
  border: 1px solid var(--panel-rule);
  vertical-align: -0.15rem;
}

.note {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: var(--step--2);
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
</style>
