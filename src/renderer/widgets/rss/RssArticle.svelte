<script lang="ts">
import { clockTime, feedHost, type ShownItem } from '@shared/feeds'
import type { FeedMark as Mark } from '@shared/feeds-view'
import { afterBlink } from '../../lib/blink.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import FeedMark from './FeedMark.svelte'
import FeedPicture from './FeedPicture.svelte'
import LitText from './LitText.svelte'

/**
 * One article, over the pane's right side (the whole pane when narrow): its picture, headline,
 * when and by whom, the feed's summary and categories, and what to do with it - OPEN in the
 * browser, TRANSLATE in the TRANSLATE pane, ASK AI in the AI chat, or put it back unread.
 * Escape or ESC closes it, and the keyboard goes back to the row it came from; ↑ ↓ open the
 * previous or next headline's article.
 */
interface Props {
  item: ShownItem
  mark: Mark
  highlight: RegExp | null
  find: string
  onclose: () => void
  onopen: () => void
  ontranslate: () => void
  onask: () => void
  onread: (read: boolean) => void
  /** ↑ and ↓: the previous or next headline's article. */
  onstep: (by: -1 | 1) => void
}

const { item, mark, highlight, find, onclose, onopen, ontranslate, onask, onread, onstep }: Props =
  $props()

const pad = (n: number) => String(n).padStart(2, '0')
const published = $derived.by(() => {
  if (item.at === null) return null
  const d = new Date(item.at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${clockTime(item.at)}`
})
const site = $derived(item.link === null ? null : feedHost(item.link))

function takeFocus(node: HTMLElement): void {
  node.focus({ preventScroll: true })
}

/** What the article's own keys do; none with a modifier held, which is a shortcut's. */
const KEYS: Record<string, () => void> = {
  Escape: () => onclose(),
  ArrowDown: () => onstep(1),
  ArrowUp: () => onstep(-1),
}

/**
 * Keys inside the article: Escape closes it (it owns Escape, lib/escape-owner.ts), ↑ ↓ step
 * through the list without going back to it. Not shortcuts: they act only where the article
 * has the keyboard.
 */
function onkeydown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return
  const action = KEYS[event.key]
  if (action === undefined) return
  event.preventDefault()
  event.stopPropagation()
  action()
}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
  class="article crt-on"
  data-owns-escape
  aria-label="article"
  tabindex="-1"
  {onkeydown}
  {@attach takeFocus}
  style:--read-scale={appearance.settings.reading.rss / 100}
  data-testid="rss-article"
>
  <header class="hd">
    <FeedMark {mark} />
    <span class="src">{item.source}</span>
    <button type="button" class="x" onclick={onclose} aria-label="close the article" data-testid="rss-article-close">esc</button>
  </header>
  <div class="sc">
    {#if item.image !== undefined}
      <FeedPicture src={item.image} turn={mark.turn} seed={item.key} />
    {/if}
    <h3 data-testid="rss-article-title"><LitText text={item.title} {highlight} {find} /></h3>
    <dl class="facts">
      {#if published !== null}<dt>published</dt><dd>{published}</dd>{/if}
      {#if item.author !== undefined}<dt>by</dt><dd>{item.author}</dd>{/if}
      {#if site !== null}<dt>site</dt><dd>{site}</dd>{/if}
    </dl>
    {#if item.summary !== undefined}
      <p class="sum" data-testid="rss-article-summary">{item.summary}</p>
    {:else}
      <p class="sum none">The feed gives no summary for this article.</p>
    {/if}
    {#if item.categories !== undefined}
      <p class="cats">{#each item.categories as category (category)}<span>{category}</span>{/each}</p>
    {/if}
  </div>
  <footer class="acts">
    <button type="button" class="act primary" disabled={item.link === null} onclick={(e) => afterBlink(e.currentTarget, onopen)} data-testid="rss-open">open</button>
    <button type="button" class="act" onclick={(e) => afterBlink(e.currentTarget, ontranslate)} data-testid="rss-translate">translate</button>
    <button type="button" class="act" onclick={(e) => afterBlink(e.currentTarget, onask)} data-testid="rss-ask">ask ai</button>
    <button type="button" class="act" onclick={(e) => afterBlink(e.currentTarget, () => onread(!item.read))} data-testid="rss-mark-read">{item.read ? 'mark unread' : 'mark read'}</button>
  </footer>
</section>

<style>
.article {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  width: min(26rem, 48%);
  background: var(--app-bg);
  border-left: 1px solid var(--panel-border);
  transform-origin: 100% 50%;
  outline: none;
}

@container rss (max-width: 44rem) {
  .article {
    width: 100%;
    border-left: 0;
  }
}

.hd {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.4rem;
  border-bottom: 1px solid var(--panel-rule);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.src {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.x {
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  cursor: pointer;
}

.x:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.sc {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.sc :global([data-testid="rss-picture"]) {
  flex: none;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--panel-rule);
}

/*
 * What is read - the headline and the summary - follows `--read-scale`, the RSS panes' scale
 * (Ctrl+Shift+= and Ctrl+Shift+-, settings.reading); the facts, the tags and the buttons keep
 * their sizes.
 */
h3 {
  margin: 0;
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: calc(var(--step-0) * var(--read-scale));
  line-height: 1.35;
  color: var(--accent-strong);
}

.facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.1rem 0.7rem;
  margin: 0;
  font-size: var(--step--2);
}

.facts dt {
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.facts dd {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.sum {
  margin: 0;
  font-size: calc(var(--step--1) * var(--read-scale));
  line-height: 1.6;
}

.sum.none {
  color: var(--text-muted);
}

.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0;
}

.cats span {
  padding: 0 0.35rem;
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  padding: 0.4rem;
  border-top: 1px solid var(--panel-rule);
}

.act {
  padding: 0.1rem 0.6rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.act:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.act:disabled {
  cursor: default;
  opacity: 0.5;
}

.act.primary:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}
</style>
