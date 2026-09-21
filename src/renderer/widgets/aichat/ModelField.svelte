<script lang="ts">
import type { AiModel } from '@shared/ai'

/**
 * The model field: free text, completed from the provider's list.
 *
 * Not a `<datalist>`: Chromium draws that as a native popup with no scrolling
 * worth the name - a provider with a hundred models (Gemini, OpenRouter) showed
 * the first screenful and nothing below it could be reached. This list is the
 * page's own, so it scrolls, follows the theme, and the arrow keys walk it.
 *
 * Any text is a valid model (a list may be unreadable, or out of date), so what
 * is typed is taken as it is on Enter or on leaving; the list only offers.
 */
interface Props {
  value: string
  models: readonly AiModel[]
  /** Called when the field is entered: the owner reads the list then, not before. */
  onopen?: () => void
  onchoose: (model: string) => void
  placeholder?: string
  title?: string
  /** `bar` for the pane's narrow strip, `form` for the settings' rows. */
  size?: 'bar' | 'form'
  /** Marked as what is missing: nothing can be sent until a model is named. */
  wanting?: boolean
  testid: string
}
const {
  value,
  models,
  onopen,
  onchoose,
  placeholder = 'model',
  title,
  size = 'bar',
  wanting = false,
  testid,
}: Props = $props()

let draft = $state('')
/** Whether anything was typed since the field was entered: until then it shows, and offers, what its owner says. */
let touched = $state(false)
let editing = $state(false)
let open = $state(false)
let selected = $state(-1)
let list = $state<HTMLUListElement>()

const shown = $derived(editing && touched ? draft : value)

/** Everything until something is typed: a field that already names a model would else offer only that one. */
const offered = $derived.by(() => {
  const typed = draft.trim().toLowerCase()
  if (!touched || typed === '') return models
  return models.filter(
    (m) => m.id.toLowerCase().includes(typed) || m.label?.toLowerCase().includes(typed),
  )
})

function enter(): void {
  if (!editing) touched = false
  editing = true
  open = true
  selected = -1
  onopen?.()
}

function leave(): void {
  if (!editing) return
  const typed = draft.trim()
  editing = false
  open = false
  if (touched && typed !== '' && typed !== value) onchoose(typed)
}

function choose(model: string): void {
  draft = model
  touched = true
  leave()
}

function move(by: number): void {
  if (!open) {
    open = true
    return
  }
  if (offered.length === 0) return
  selected = (selected + by + offered.length) % offered.length
  // jsdom has no layout, and no scrollIntoView.
  list?.children[selected]?.scrollIntoView?.({ block: 'nearest' })
}

function keydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    move(event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const picked = open ? offered[selected] : undefined
    if (picked === undefined) leave()
    else choose(picked.id)
    ;(event.currentTarget as HTMLInputElement).blur()
  } else if (event.key === 'Escape' && open) {
    // The list's Escape, not the pane's (which stops an answer) or the dialog's (which closes it).
    event.stopPropagation()
    open = false
    touched = false
  }
}
</script>

<span class="combo {size}">
  <input
    type="text"
    role="combobox"
    aria-expanded={open && offered.length > 0}
    aria-controls={`${testid}-list`}
    aria-autocomplete="list"
    aria-label="model"
    aria-invalid={wanting}
    value={shown}
    {placeholder}
    {title}
    spellcheck="false"
    autocomplete="off"
    onfocus={enter}
    onclick={() => (open = true)}
    oninput={(e) => {
      draft = e.currentTarget.value
      touched = true
      open = true
      selected = -1
    }}
    onkeydown={keydown}
    onblur={leave}
    data-testid={testid}
  />
  {#if open && offered.length > 0}
    <!-- The pointer chooses on a move, not on entering a row: the arrow keys scroll rows under a
         resting pointer, which would otherwise take the selection straight back. -->
    <!-- A press anywhere on the list - its scrollbar included - must not take the focus from the
         field: leaving the field is what closes the list. -->
    <ul
      class="list"
      role="listbox"
      id={`${testid}-list`}
      bind:this={list}
      onmousedown={(e) => e.preventDefault()}
      data-testid={`${testid}-list`}
    >
      {#each offered as m, i (m.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events (the keys are the combobox's: the arrows walk the list from the field, which keeps the focus) -->
        <li
          role="option"
          aria-selected={i === selected}
          class:selected={i === selected}
          class:current={m.id === value}
          onpointermove={() => (selected = i)}
          onclick={() => choose(m.id)}
          data-testid={`${testid}-option`}
        >
          <span class="id">{m.id}</span>{#if m.label && m.label !== m.id}<span class="label">{m.label}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
</span>

<style>
.combo {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  font-size: var(--step--2);
}

.combo.form {
  min-width: 12rem;
  font-size: var(--step--1);
}

input {
  flex: 1;
  min-width: 0;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: inherit;
  letter-spacing: 0;
  text-transform: none;
}

input[aria-invalid='true'] {
  border-color: var(--warn);
}

input:focus {
  border-color: var(--accent);
  outline: none;
}

/* Under the field, as wide as it is, and as tall as a dozen models: the rest scroll. */
.list {
  position: absolute;
  z-index: 5;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 14rem;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--accent);
  border-top: 0;
  background: var(--app-bg);
  list-style: none;
}

li {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: 0.15rem var(--space-1);
  font-family: var(--font-mono);
  letter-spacing: 0;
  text-transform: none;
  color: var(--text);
  cursor: pointer;
}

li.current .id {
  color: var(--accent-strong);
}

li.selected {
  background: var(--accent-faint);
}

.id {
  min-width: 0;
  overflow-wrap: anywhere;
}

.label {
  flex: none;
  color: var(--text-muted);
}
</style>
