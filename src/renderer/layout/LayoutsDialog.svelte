<script lang="ts">
import { cleanLayoutName, KEYED_LAYOUTS, MAX_SAVED_LAYOUTS } from '@shared/layouts'
import { tick } from 'svelte'
import ConfirmButton from '../ConfirmButton.svelte'
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'

/**
 * Saved layouts: the arrangements the user works in, kept by name.
 *
 * A layout follows the work: the one being worked in is marked, and what
 * happens to the workspace is written into it, so coming back to it finds it as
 * it was left. Applying one replaces the workspace, which ends the shells of
 * the panes it replaces - the same as closing those panes - so the dialog says
 * so, and the switch itself asks first while shells are open.
 *
 * A layout's place in the list is the number key that applies it, which is why
 * the rows can be moved rather than only added and removed.
 *
 *   ↑ ↓      choose        Enter    apply      Esc   close
 */

let name = $state('')
let input = $state<HTMLInputElement | null>(null)
let selected = $state(0)
let full = $state(false)
let returnFocus: HTMLElement | null = null
/** The layout being renamed, and the name being typed for it. */
let renaming = $state<{ id: string; draft: string } | null>(null)
let renameBox = $state<HTMLInputElement | null>(null)
/** The rows' apply buttons, by place, so the keyboard can be put on one. */
const rows: (HTMLButtonElement | null)[] = $state([])

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
  renaming = null
  void openOnActive()
  return () => {
    returnFocus?.focus()
    returnFocus = null
  }
})

/**
 * Opens on the layout being worked in - the one a number key or a status-bar
 * button last applied - with the keyboard on it, so Enter keeps it and the
 * arrows go from there. With none (nothing saved yet, or after a reset) the
 * name box has the keys, to save the arrangement under a name.
 */
async function openOnActive(): Promise<void> {
  await layout.loadSaved()
  if (!ui.layoutsOpen) return
  const at = layout.savedLayouts.findIndex((entry) => entry.active)
  if (at >= 0) selected = at
  await tick()
  if (at >= 0) rows[at]?.focus()
  else input?.focus()
}

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
  // Through the store, so the question about the shells is asked here too.
  await layout.switchTo(id)
}

function startRename(entry: { id: string; name: string }): void {
  renaming = { id: entry.id, draft: entry.name }
  queueMicrotask(() => {
    renameBox?.focus()
    renameBox?.select()
  })
}

/**
 * Commits the rename. main has the last word - it refuses a name another layout
 * already has - so what comes back is what is shown, and a refused rename simply
 * leaves the old name where it was.
 */
async function commitRename(): Promise<void> {
  const request = renaming
  renaming = null
  if (request === null) return
  const wanted = cleanLayoutName(request.draft)
  if (wanted === null) return
  await layout.renameSaved(request.id, wanted)
}

function onKeydown(event: KeyboardEvent): void {
  if (!ui.layoutsOpen) return
  const take = (): void => {
    event.preventDefault()
    event.stopPropagation()
  }
  if (event.key === 'Escape') {
    take()
    // A rename in progress is what Escape lets go of first.
    if (renaming !== null) renaming = null
    else close()
    return
  }
  // A rename has the keyboard to itself while it is open.
  if (renaming !== null || saved.length === 0) return
  const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
  if (step !== 0) {
    take()
    selected = (selected + step + saved.length) % saved.length
    // On a row, the keyboard goes with the choice: a focus ring on one row and the
    // choice on another would say two things about what Enter applies.
    if (rows.includes(document.activeElement as HTMLButtonElement)) rows[selected]?.focus()
    sfx.play('folder')
    return
  }
  if (event.key === 'Enter') {
    take()
    enter()
  }
}

/**
 * Enter: in the name box it keeps the arrangement, and anywhere else it applies
 * the layout the arrow keys are on.
 */
function enter(): void {
  if (document.activeElement === input) {
    void keep()
    return
  }
  const entry = saved[selected]
  if (entry !== undefined) void apply(entry.id)
}

function revealFile(): void {
  void window.elecdex.layout.saved
    .filePath()
    .then((file) => window.elecdex.system.revealInFolder(file))
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
              <!-- The place in the list is the number key that applies it. -->
              <span class="slot" class:none={i >= KEYED_LAYOUTS} data-testid="layouts-slot">
                {i < KEYED_LAYOUTS ? i + 1 : '·'}
              </span>
              {#if renaming !== null && renaming.id === entry.id}
                <input
                  bind:this={renameBox}
                  bind:value={renaming.draft}
                  class="rename"
                  maxlength="40"
                  spellcheck="false"
                  aria-label="New name"
                  onblur={() => void commitRename()}
                  onkeydown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Enter') void commitRename()
                    if (e.key === 'Escape') renaming = null
                  }}
                  data-testid="layouts-rename-box"
                />
              {:else}
                <button
                  bind:this={rows[i]}
                  type="button"
                  role="option"
                  class="go"
                  class:selected={i === selected}
                  aria-selected={i === selected}
                  onpointermove={() => (selected = i)}
                  onclick={() => void apply(entry.id)}
                  data-testid="layouts-item"
                  data-name={entry.name}
                  data-active={entry.active}
                >
                  <span class="title">{entry.name}</span>
                  <span class="state">{entry.active ? 'in this one' : 'apply'}</span>
                </button>
                <button
                  type="button"
                  class="icon"
                  title="Rename"
                  aria-label="Rename {entry.name}"
                  onclick={() => startRename(entry)}
                  data-testid="layouts-rename"
                >
                  ✎
                </button>
                <button
                  type="button"
                  class="icon"
                  title="Move up, onto the key above"
                  aria-label="Move {entry.name} up"
                  disabled={i === 0}
                  onclick={() => void layout.moveSaved(entry.id, -1)}
                  data-testid="layouts-up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="icon"
                  title="Move down"
                  aria-label="Move {entry.name} down"
                  disabled={i === saved.length - 1}
                  onclick={() => void layout.moveSaved(entry.id, 1)}
                  data-testid="layouts-down"
                >
                  ↓
                </button>
                <ConfirmButton
                  label="×"
                  action="remove"
                  title="Forget this layout"
                  testid="layouts-remove"
                  onconfirm={() => void layout.removeSaved(entry.id)}
                />
              {/if}
            </li>
          {:else}
            <li class="empty">
              nothing saved yet — arrange the workspace, name it above and save it
            </li>
          {/each}
        </ul>

        <footer>
          <span>
            the layout you are in keeps whatever you do to the workspace. applying another
            replaces the workspace, so the shells of the panes it replaces end, as they do
            when those panes are closed
          </span>
          <button
            type="button"
            class="file"
            title="Show layouts.json — the file to copy to another machine"
            onclick={revealFile}
            data-testid="layouts-file"
          >
            layouts.json
          </button>
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
  width: min(38rem, 90vw);
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

/* The number key that applies the layout. */
.slot {
  min-width: 1.2rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-align: right;
}

.slot.none {
  opacity: 0.4;
}

.rename {
  flex: 1;
  min-width: 0;
  padding: 0.3rem var(--space-2);
  border: 1px solid var(--accent-strong);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  outline: none;
}

.go {
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

.go.selected {
  border-color: var(--panel-border);
  background: var(--surface-2);
}

.go[data-active='true'] .title {
  color: var(--accent-strong);
}

.state {
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
}

.icon {
  padding: 0 0.3rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  cursor: pointer;
}

.icon:hover:not(:disabled) {
  color: var(--text);
}

.icon:disabled {
  opacity: 0.3;
  cursor: default;
}

.empty {
  padding: var(--space-3) var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  line-height: 1.5;
}

.file {
  flex: none;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-decoration: underline;
  cursor: pointer;
}

.file:hover {
  color: var(--text);
}
</style>
