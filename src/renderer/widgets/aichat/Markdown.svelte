<script lang="ts">
import { type Block, type Inline, parseMarkdown } from '../../lib/markdown.ts'

/**
 * A model's answer, drawn from the tree lib/markdown.ts makes of it: elements
 * written out here, never HTML from the text. A link opens in the system's
 * browser through main, like every other link in the app.
 */
interface Props {
  source: string
}
const { source }: Props = $props()

const blocks = $derived(parseMarkdown(source))

/** The code block whose text was just copied, for its button's word. */
let copied = $state<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

function copy(key: string, text: string): void {
  void navigator.clipboard.writeText(text).then(() => {
    copied = key
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied = null
    }, 1500)
  })
}

$effect(() => () => clearTimeout(copiedTimer))
</script>

<!-- One line on purpose: white space between these tags would be drawn between the words. -->
{#snippet inline(nodes: Inline[])}{#each nodes as node, i (i)}{#if node.t === 'text'}{node.v}{:else if node.t === 'code'}<code>{node.v}</code>{:else if node.t === 'strong'}<strong>{@render inline(node.c)}</strong>{:else if node.t === 'em'}<em>{@render inline(node.c)}</em>{:else if node.t === 'del'}<del>{@render inline(node.c)}</del>{:else if node.t === 'link'}<button type="button" class="link" title={node.href} onclick={() => void window.elecdex.system.openExternal(node.href)}>{@render inline(node.c)}</button>{/if}{/each}{/snippet}

{#snippet block(nodes: Block[], path: string)}
  {#each nodes as node, i (i)}
    {#if node.t === 'p'}
      <p>{@render inline(node.c)}</p>
    {:else if node.t === 'h'}
      <p class="heading" role="heading" aria-level={node.level} data-level={node.level}>{@render inline(node.c)}</p>
    {:else if node.t === 'code'}
      <div class="code" data-testid="chat-code">
        <div class="code-bar">
          <span>{node.lang}</span>
          <button type="button" onclick={() => copy(`${path}${i}`, node.v)} data-testid="chat-code-copy">
            {copied === `${path}${i}` ? 'copied' : 'copy'}
          </button>
        </div>
        <pre><code>{node.v}</code></pre>
      </div>
    {:else if node.t === 'list'}
      <svelte:element this={node.ordered ? 'ol' : 'ul'} start={node.ordered ? node.start : undefined}>
        {#each node.items as item, n (n)}
          <li>{@render block(item, `${path}${i}.${n}.`)}</li>
        {/each}
      </svelte:element>
    {:else if node.t === 'quote'}
      <blockquote>{@render block(node.c, `${path}${i}.`)}</blockquote>
    {:else if node.t === 'table'}
      <div class="table-frame">
        <table>
          <thead>
            <tr>{#each node.head as cell, n (n)}<th>{@render inline(cell)}</th>{/each}</tr>
          </thead>
          <tbody>
            {#each node.rows as row, r (r)}
              <tr>{#each row as cell, n (n)}<td>{@render inline(cell)}</td>{/each}</tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <hr />
    {/if}
  {/each}
{/snippet}

<div class="markdown">{@render block(blocks, '')}</div>

<style>
.markdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

p {
  margin: 0;
  /* Line breaks inside a paragraph are the model's own. */
  white-space: pre-line;
}

.heading {
  font-family: var(--font-display);
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
}

.heading[data-level='1'],
.heading[data-level='2'] {
  font-size: var(--step-0);
  text-transform: uppercase;
}

ul,
ol {
  margin: 0;
  padding-left: 1.4rem;
}

li > :global(* + *) {
  margin-top: var(--space-1);
}

li + li {
  margin-top: 0.15rem;
}

blockquote {
  margin: 0;
  padding-left: var(--space-2);
  border-left: 2px solid var(--accent-dim);
  color: var(--text-muted);
}

hr {
  width: 100%;
  margin: 0;
  border: 0;
  border-top: 1px solid var(--panel-rule);
}

code {
  font-family: var(--font-mono);
  font-size: 0.92em;
}

:not(pre) > code {
  padding: 0 0.25em;
  border: 1px solid var(--panel-rule);
  background: var(--accent-faint);
}

.code {
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
}

.code-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.code-bar button {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.code-bar button:hover,
.code-bar button:focus-visible {
  color: var(--accent);
}

pre {
  margin: 0;
  padding: var(--space-1) var(--space-2);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
  white-space: pre;
  overflow-wrap: normal;
  color: var(--text);
}

.table-frame {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

table {
  border-collapse: collapse;
  font-size: 0.95em;
}

th,
td {
  padding: 0.15rem var(--space-2);
  border: 1px solid var(--panel-rule);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--accent-strong);
  font-weight: 400;
}

button.link {
  display: inline;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent-strong);
  font: inherit;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
  overflow-wrap: anywhere;
}

button.link:hover,
button.link:focus-visible {
  color: var(--accent);
}
</style>
