<script lang="ts" module>
/** How a search matches: by case, as a regular expression, by whole words. */
export interface SearchHow {
  caseSensitive: boolean
  regex: boolean
  wholeWord: boolean
}
</script>

<script lang="ts">
import type { SearchAddon } from '@xterm/addon-search'

/**
 * The shell's search bar.
 *
 * It sits over the top-right of the terminal rather than taking a row of it: a
 * pane that changed height while the bar was open would send a new size to the
 * PTY, and on Windows ConPTY rewraps its whole buffer to every size it is given
 * (see TerminalWidget) - searching the scrollback would garble the scrollback.
 *
 * Finding is the parent's job: it has to hold the clipboard back while a match
 * is selected, since selecting text in this terminal copies it.
 */

interface Props {
  addon: SearchAddon
  /** Runs a search and moves the selection to the match. */
  find: (term: string, back: boolean, how: SearchHow) => void
  /** Bumped by the shortcut to put the keyboard back in the box, text selected. */
  focusToken: number
  onclose: () => void
}

const { addon, find, focusToken, onclose }: Props = $props()

let query = $state('')
let box = $state<HTMLInputElement | null>(null)
let results = $state<{ index: number; count: number } | null>(null)
/** Kept while the bar is open; a new bar starts plain. */
let how = $state<SearchHow>({ caseSensitive: false, regex: false, wholeWord: false })

/** A switch turned: the search runs again with it, from where it is. */
function toggle(key: keyof SearchHow): void {
  how = { ...how, [key]: !how[key] }
  box?.focus()
  onInput()
}

// The addon reports counts only while decorations are on, which they are.
$effect(() => {
  const subscription = addon.onDidChangeResults((event) => {
    results = { index: event.resultIndex, count: event.resultCount }
  })
  return () => subscription.dispose()
})

$effect(() => {
  void focusToken
  const input = box
  if (input === null) return
  // After the element is in the document: the bar mounts with this effect.
  queueMicrotask(() => {
    input.focus()
    input.select()
  })
})

function step(back: boolean): void {
  if (query === '') return
  find(query, back, how)
}

function onInput(): void {
  if (query === '') {
    addon.clearDecorations()
    results = null
    return
  }
  find(query, false, how)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    step(event.shiftKey)
    return
  }
  if (event.key === 'Escape') {
    // Kept from the workspace, which would otherwise put a pane brought forward
    // back while the user only meant to close this bar.
    event.preventDefault()
    event.stopPropagation()
    onclose()
  }
}

/** "3/12", or "no matches" once something has been typed. */
const tally = $derived.by(() => {
  if (query === '' || results === null) return ''
  if (results.count === 0) return 'no matches'
  // resultIndex is -1 when there are more matches than the addon will mark.
  return results.index < 0 ? `${results.count}` : `${results.index + 1}/${results.count}`
})
</script>

<div class="search" data-testid="terminal-search">
  <input
    bind:this={box}
    bind:value={query}
    oninput={onInput}
    onkeydown={onKeydown}
    placeholder="find in scrollback"
    spellcheck="false"
    aria-label="Find in the shell"
    data-testid="terminal-search-box"
  />
  <button
    type="button"
    class="switch"
    aria-pressed={how.caseSensitive}
    aria-label="Match case"
    onclick={() => toggle('caseSensitive')}
    data-testid="terminal-search-case">Aa</button
  >
  <button
    type="button"
    class="switch"
    aria-pressed={how.wholeWord}
    aria-label="Whole words"
    onclick={() => toggle('wholeWord')}
    data-testid="terminal-search-word">ab</button
  >
  <button
    type="button"
    class="switch"
    aria-pressed={how.regex}
    aria-label="Regular expression"
    onclick={() => toggle('regex')}
    data-testid="terminal-search-regex">.*</button
  >
  <span class="tally" class:none={results?.count === 0} data-testid="terminal-search-tally"
    >{tally}</span
  >
  <button type="button" title="Previous match (Shift+Enter)" onclick={() => step(true)}>‹</button>
  <button type="button" title="Next match (Enter)" onclick={() => step(false)}>›</button>
  <button type="button" title="Close (Escape)" onclick={onclose} data-testid="terminal-search-close"
    >✕</button
  >
</div>

<style>
.search {
  position: absolute;
  top: var(--space-1);
  right: var(--space-2);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.15rem var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

input {
  width: 20ch;
  padding: 0.1rem var(--space-1);
  border: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  outline: none;
}

.tally {
  min-width: 5ch;
  color: var(--text-muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tally.none {
  color: var(--warn);
}

button {
  padding: 0 0.25rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}

button:hover {
  color: var(--text);
}

/* A switch on is lit and framed: Aa, ab and .* read as off until pressed. */
.switch {
  border: 1px solid transparent;
}

.switch[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent-strong);
}

</style>
