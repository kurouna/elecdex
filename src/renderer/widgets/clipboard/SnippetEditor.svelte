<script lang="ts">
import { SNIPPET_LIMITS } from '@shared/snippets'
import { untrack } from 'svelte'

/**
 * Writing a snippet by hand, or changing one: a name (optional - the first line
 * names it otherwise) and the text. It takes the list's place in the pane until
 * SAVE (Ctrl+Enter) or CANCEL (Esc). A snippet kept with its formatting says
 * that a change to its text drops the formatting, before the change is made.
 */
interface Props {
  /** 'new', or the slot it edits ("03"). */
  heading: string
  name: string
  text: string
  /** The snippet carries HTML or RTF. */
  rich: boolean
  /** Why the last SAVE was refused, or null. */
  problem: string | null
  onsave: (draft: { name: string; text: string }) => void
  oncancel: () => void
}

const {
  heading,
  name: givenName,
  text: givenText,
  rich,
  problem,
  onsave,
  oncancel,
}: Props = $props()

// The fields start from what was given and are the editor's own after that
// (the pane opens a new editor for another snippet).
let name = $state(untrack(() => givenName))
let text = $state(untrack(() => givenText))
let area = $state<HTMLTextAreaElement | null>(null)
$effect(() => {
  area?.focus()
})

const rewritten = $derived(rich && text !== givenText)
const empty = $derived(text.trim() === '')

function save(): void {
  if (!empty) onsave({ name, text })
}

function onkeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    oncancel()
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    save()
  }
}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor" data-testid="snip-editor" {onkeydown}>
  <div class="head">
    <span class="label">{heading === 'new' ? 'NEW SNIPPET' : `EDIT ${heading}`}</span>
    <input
      class="name"
      type="text"
      placeholder="name - the first line if left empty"
      maxlength={SNIPPET_LIMITS.name}
      spellcheck="false"
      aria-label="the snippet's name"
      bind:value={name}
      data-testid="snip-editor-name"
    />
  </div>
  <textarea
    class="text"
    spellcheck="false"
    aria-label="the snippet's text"
    maxlength={SNIPPET_LIMITS.text}
    bind:this={area}
    bind:value={text}
    data-testid="snip-editor-text"
  ></textarea>
  <div class="foot">
    {#if problem !== null}
      <span class="problem" data-testid="snip-editor-problem">{problem}</span>
    {:else if rewritten}
      <span class="warn" data-testid="snip-editor-rich">a new text drops the HTML / RTF it was copied with</span>
    {:else}
      <span class="hint">Ctrl+Enter saves · Esc cancels</span>
    {/if}
    <span class="buttons">
      <button type="button" onclick={oncancel} data-testid="snip-editor-cancel">CANCEL</button>
      <button type="button" class="go" disabled={empty} onclick={save} data-testid="snip-editor-save">SAVE</button>
    </span>
  </div>
</div>

<style>
.editor {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
  padding: 0.35rem;
  border: 1px solid var(--accent-dim);
  background: color-mix(in srgb, var(--accent) 4%, transparent);
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.label {
  flex: none;
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
}

input,
textarea {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

input:focus,
textarea:focus {
  border-color: var(--accent);
  outline: none;
}

.name {
  flex: 1;
  min-width: 0;
  padding: 0.1rem 0.4rem;
  font-family: var(--font-ui);
}

.text {
  flex: 1;
  min-height: 3.5rem;
  padding: 0.3rem 0.4rem;
  line-height: 1.35;
  resize: none;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem var(--space-2);
  font-size: var(--step--2);
}

.hint {
  color: var(--text-muted);
}

.warn {
  color: var(--warn);
}

.problem {
  color: var(--danger);
}

.buttons {
  display: flex;
  gap: 0.35rem;
  margin-left: auto;
}

.buttons button {
  min-width: 4.4rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.buttons button:hover:not(:disabled) {
  color: var(--text);
}

.buttons .go {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.buttons button:disabled {
  opacity: 0.45;
  cursor: default;
}
</style>
