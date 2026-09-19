<script lang="ts">
import { cleanLayoutName, MAX_SAVED_LAYOUTS } from '@shared/layouts'
import ConfirmButton from '../ConfirmButton.svelte'
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'

/**
 * Saved layouts: arrangements kept by name, and come back to.
 *
 * The workspace still has one live layout. This keeps copies of it, so the
 * arrangement for one kind of work is not lost by arranging the workspace for
 * another. Applying one replaces the workspace, which ends the shells of the
 * panes it replaces - the same as closing those panes - so the dialog says so
 * rather than letting it be a surprise.
 *
 *   ↑ ↓      choose        Enter    apply      Esc   close
 */

let name = $state('')
let input = $state<HTMLInputElement | null>(null)
let selected = $state(0)
let full = $state(false)
let returnFocus: HTMLElement | null = null

const saved = $derived(layout.savedLayouts)
const cleaned = $derived(cleanLayoutName(name))
/** Saving over a name already kept updates it, which the button should say. */
const replacing = $derived(saved.some((entry) => entry.name === cleaned))

$effect(() => {
  if (!ui.layoutsOpen) return
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  name = ''
  selected = 0
  full = false
  void layout.loadSaved()
  queueMicrotask(() => input?.focus())
  return () => {
    returnFocus?.focus()
    returnFocus = null
  }
})

// Keep the selection on a row that exists as the list shrinks.
$effect(() => {
  if (selected >= saved.length) selected = Math.max(0, saved.length - 1)
})

function close(): void {
  ui.closeLayouts()
}

async function keep(): Promise<void> {
  if (cleaned === null) return
  const kept = await layout.saveAs(cleaned)
  full = !kept
  if (!kept) return
  name = ''
  sfx.play('theme')
}

async function apply(id: string): Promise<void> {
  // Let go of the focus first: the pane it points at is about to be replaced.
  returnFocus = null
  close()
  await layout.applySaved(id)
}

function onKeydown(event: KeyboardEvent): void {
  if (!ui.layoutsOpen) return
  const take = (): void => {
    event.preventDefault()
    event.stopPropagation()
  }
  if (event.key === 'Escape') {
    take()
    close()
    return
  }
  if (saved.length === 0) return
  if (event.key === 'ArrowDown') {
    take()
    selected = (selected + 1) % saved.length
    sfx.play('folder')
    return
  }
  if (event.key === 'ArrowUp') {
    take()
    selected = (selected - 1 + saved.length) % saved.length
    sfx.play('folder')
    return
  }
  // Enter in the name box keeps the arrangement; anywhere else it applies the
  // layout the arrow keys are on.
  if (event.key === 'Enter') {
    take()
    if (document.activeElement === input) void keep()
    else {
      const entry = saved[selected]
      if (entry !== undefined) void apply(entry.id)
    }
  }
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if ui.layoutsOpen}
  <!-- The backdrop closes on click; the keyboard path is Escape, handled above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="backdrop"
    transition:backdropShade
    onpointerdown={(e) => e.target === e.currentTarget && close()}
  >
    <div
      class="dialog crt-on"
      style:--crt-delay={dialogDelay()}
      transition:crtPower
      role="dialog"
      aria-modal="true"
      aria-label="Saved layouts"
      data-testid="layouts-dialog"
    >
      <header class="hud-label">
        <span>layouts</span>
        <span>↑↓ choose · enter apply · esc close</span>
      </header>
      <div class="shell-frame body">
        <div class="keep">
          <input
            bind:this={input}
            bind:value={name}
            class="filter"
            placeholder="name this arrangement"
            spellcheck="false"
            maxlength="40"
            data-testid="layouts-name"
          />
          <button
            type="button"
            disabled={cleaned === null}
            onclick={() => void keep()}
            data-testid="layouts-save"
          >
            {replacing ? 'update' : 'save current'}
          </button>
        </div>
        {#if full}
          <p class="note" data-testid="layouts-full">
            {MAX_SAVED_LAYOUTS} layouts is as many as are kept — remove one first.
          </p>
        {/if}

        <ul class="list" role="listbox" aria-label="Saved layouts">
          {#each saved as entry, i (entry.id)}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={i === selected}
                class:selected={i === selected}
                onpointermove={() => (selected = i)}
                onclick={() => void apply(entry.id)}
                data-testid="layouts-item"
                data-name={entry.name}
              >
                <span class="title">{entry.name}</span>
                <span class="state">apply</span>
              </button>
              <ConfirmButton
                label="×"
                action="remove"
                title="Forget this layout"
                testid="layouts-remove"
                onconfirm={() => void layout.removeSaved(entry.id)}
              />
            </li>
          {:else}
            <li class="empty">
              nothing saved yet — arrange the workspace, name it above and save it
            </li>
          {/each}
        </ul>

        <footer>
          applying a layout replaces the workspace, so the shells of the panes it
          replaces end, as they do when those panes are closed
        </footer>
      </div>
    </div>
  </div>
{/if}

<style>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.dialog {
  --crt-duration: 380ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(34rem, 90vw);
  max-height: min(30rem, 80vh);
  background: var(--app-bg);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 0;
  padding: var(--space-3);
}

.keep {
  display: flex;
  gap: var(--space-2);
}

.filter {
  flex: 1;
  min-width: 0;
  padding: 0.3rem var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  outline: none;
}

.keep button {
  padding: 0.3rem var(--space-3);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.keep button:disabled {
  color: var(--text-muted);
  cursor: default;
}

.keep button:not(:disabled):hover {
  background: var(--surface-2);
}

.note {
  margin: 0;
  color: var(--warn);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.list {
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.list li {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.list li > button {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 0.35rem var(--space-2);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
}

.list li > button.selected {
  border-color: var(--panel-border);
  background: var(--surface-2);
}

.state {
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
}

.empty {
  padding: var(--space-3) var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

footer {
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  line-height: 1.5;
}
</style>
