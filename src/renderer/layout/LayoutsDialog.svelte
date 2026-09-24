<script lang="ts">
import { effectiveBindings, formatChord, type KeybindingAction } from '@shared/keybindings'
import {
  LAYOUT_PRESETS,
  presetBadge,
  presetById,
  presetCards,
  presetTree,
} from '@shared/layout-presets'
import { layoutShape } from '@shared/layout-shape'
import { cleanLayoutName, KEYED_LAYOUTS, MAX_SAVED_LAYOUTS } from '@shared/layouts'
import { tick } from 'svelte'
import ConfirmButton from '../ConfirmButton.svelte'
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { appearance } from '../stores/appearance.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import LayoutThumb from './LayoutThumb.svelte'
import { goToPreset, restorePreset } from './presets.ts'
import { shelfScrollFor } from './shelf-scroll.ts'

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
 * Below the list is the shelf of presets (shared/layout-presets.ts). Choosing
 * one goes to the layout made from it, or makes one and goes there; a layout
 * made from a preset can be put back to it (↺). Whatever is chosen blinks, as a
 * launcher tile does, before the dialog powers off and the switch begins. The
 * shelf scrolls sideways, so more presets do not make the dialog taller, and each
 * card names its key (Ctrl+Shift+F1 and on, as the user has them).
 *
 *   ↑ ↓      choose        Enter    apply      Esc   close
 *   Tab      to the presets, ← → along them, ↑ back to the list
 */

/** How long a choice blinks before the dialog goes: three beats of the launcher's blink. */
const CHOSEN_MS = 300
/** The presets' shapes, worked out once: they are the same every time the dialog opens. */
const PRESET_SHAPES = new Map(
  LAYOUT_PRESETS.map((preset) => [preset.id, layoutShape(presetTree(preset))]),
)

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
/** The presets' cards, by place, for the arrow keys along the shelf. */
const cards: (HTMLButtonElement | null)[] = $state([])
/** What was chosen and is blinking - `saved:<id>` or `preset:<id>` - before it is carried out. */
let chosen = $state<string | null>(null)
let chosenTimer: ReturnType<typeof setTimeout> | null = null

let shelfBox = $state<HTMLDivElement | null>(null)
/**
 * The keyboard is on the shelf. The list's choice is not shown meanwhile: a marked row and a
 * focused card would say two things about what Enter takes.
 */
let onShelf = $state(false)

const saved = $derived(layout.savedLayouts)
const shelf = $derived(presetCards(saved))
/** Each preset's key as the user has it bound; null when it has none. */
const presetChords = $derived.by(() => {
  const bindings = effectiveBindings(
    appearance.settings.keybindings,
    window.elecdex.system.platform,
  )
  return new Map(
    LAYOUT_PRESETS.map((preset) => {
      const chord = bindings[`layout.preset.${preset.id}` as KeybindingAction]
      return [preset.id, chord === null || chord === undefined ? null : formatChord(chord)]
    }),
  )
})

// The wheel turns the shelf sideways. Added by hand rather than as `onwheel`,
// because taking the turn from the page means a listener that is not passive.
$effect(() => {
  const box = shelfBox
  if (box === null) return
  const onWheel = (event: WheelEvent): void => {
    const delta = shelfScrollFor(event, box)
    if (delta === null) return
    event.preventDefault()
    box.scrollLeft += delta
  }
  box.addEventListener('wheel', onWheel, { passive: false })
  return () => box.removeEventListener('wheel', onWheel)
})

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
  chosen = null
  // A dialog closed from the shelf takes its cards away without a focusout.
  onShelf = false
  void openOnActive()
  return () => {
    // A choice still blinking when the dialog was closed some other way is let go.
    if (chosenTimer !== null) clearTimeout(chosenTimer)
    chosenTimer = null
    chosen = null
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

/**
 * Marks what was chosen and carries it out once it has blinked - at once with
 * motion reduced. One choice at a time: a second press while the first blinks
 * is not a second switch.
 */
function choose(key: string, act: () => Promise<unknown>): void {
  if (chosen !== null) return
  const run = (): void => {
    chosen = null
    chosenTimer = null
    // Let go of the focus first: the pane it points at is about to be replaced.
    returnFocus = null
    close()
    void act()
  }
  if (appearance.reducedMotion) {
    run()
    return
  }
  chosen = key
  sfx.play('folder')
  chosenTimer = setTimeout(run, CHOSEN_MS)
}

function apply(id: string): void {
  // Through the store, so the question about the shells is asked here too.
  choose(`saved:${id}`, () => layout.switchTo(id))
}

function applyPreset(id: string): void {
  choose(`preset:${id}`, () => goToPreset(id))
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
  // A choice blinking is already on its way; nothing else is taken meanwhile.
  if (chosen !== null) {
    if (event.key === 'Enter' || event.key.startsWith('Arrow')) take()
    return
  }
  // A rename has the keyboard to itself while it is open.
  if (renaming !== null) return
  const onCard = cards.indexOf(document.activeElement as HTMLButtonElement)
  if (onCard >= 0) onShelfKey(event, onCard, take)
  else onListKey(event, take)
}

/** The list's keys: ↑ ↓ to choose, Enter to apply (or, in the name box, to save). */
function onListKey(event: KeyboardEvent, take: () => void): void {
  if (saved.length === 0) return
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

/** The shelf's keys: ← → along the cards, ↑ back to the list, Enter to choose. */
function onShelfKey(event: KeyboardEvent, at: number, take: () => void): void {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (step !== 0) {
    take()
    cards[(at + step + cards.length) % cards.length]?.focus()
    sfx.play('folder')
    return
  }
  if (event.key === 'ArrowUp') {
    take()
    ;(rows[selected] ?? input)?.focus()
    return
  }
  if (event.key === 'Enter') {
    take()
    const card = shelf[at]
    if (card !== undefined) applyPreset(card.id)
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
  if (entry !== undefined) apply(entry.id)
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
        <span>↑↓ choose · tab presets · enter apply · esc close</span>
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
                  class:selected={i === selected && !onShelf}
                  class:chosen={chosen === `saved:${entry.id}`}
                  aria-selected={i === selected && !onShelf}
                  onpointermove={() => (selected = i)}
                  onclick={() => apply(entry.id)}
                  data-testid="layouts-item"
                  data-name={entry.name}
                  data-active={entry.active}
                  data-chosen={chosen === `saved:${entry.id}`}
                >
                  <LayoutThumb shape={entry.shape} />
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
                {#if presetById(entry.preset) !== null}
                  <ConfirmButton
                    label="↺"
                    action="restore"
                    title={entry.active
                      ? 'Put this layout, and the workspace, back to its preset'
                      : 'Put this layout back to its preset'}
                    testid="layouts-restore"
                    onconfirm={() => void restorePreset(entry.id)}
                  />
                {:else}
                  <!-- Holds the column, so the remove buttons line up down the list. -->
                  <span class="restore-room"></span>
                {/if}
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
              nothing saved yet — arrange the workspace, name it above and save it, or start
              from a preset below
            </li>
          {/each}
        </ul>

        <section class="presets" aria-label="Presets">
          <div class="shelf-head">
            <span>presets</span>
            <span>a preset becomes one of your layouts, and follows your work from then on</span>
          </div>
          <div
            class="shelf"
            bind:this={shelfBox}
            onfocusin={() => (onShelf = true)}
            onfocusout={(e) => (onShelf = shelfBox?.contains(e.relatedTarget as Node) ?? false)}
            data-testid="layouts-shelf"
          >
            {#each shelf as card, i (card.id)}
              <button
                bind:this={cards[i]}
                type="button"
                class="card"
                class:kept={card.savedId !== null}
                class:chosen={chosen === `preset:${card.id}`}
                title={presetChords.get(card.id)
                  ? `${card.description} (${presetChords.get(card.id)})`
                  : card.description}
                onclick={() => applyPreset(card.id)}
                data-testid="layouts-preset"
                data-preset={card.id}
                data-kept={card.savedId !== null}
                data-chosen={chosen === `preset:${card.id}`}
              >
                <LayoutThumb shape={PRESET_SHAPES.get(card.id) ?? []} width={96} />
                <span class="card-line">
                  <span class="title">{card.name}</span>
                  <span class="badge" data-testid="layouts-preset-badge">{presetBadge(card)}</span>
                </span>
                <span class="chord" data-testid="layouts-preset-chord">
                  {presetChords.get(card.id) ?? 'no key'}
                </span>
              </button>
            {/each}
          </div>
        </section>

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
  width: min(46rem, 92vw);
  max-height: min(42rem, 90vh);
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
  align-items: center;
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

.go .title {
  flex: 1;
}

.go.selected {
  border-color: var(--panel-border);
  background: var(--surface-2);
}

/* The launcher's blink (widgets/launcher): the choice flashes in the accent a
   few times before it is carried out, so the eye follows it into the switch. */
.go.chosen,
.card.chosen {
  animation: layouts-chosen 100ms linear 3;
}

@keyframes layouts-chosen {
  50% {
    background: var(--accent);
    color: var(--text-inverse);
  }
}

.restore-room {
  flex: none;
  width: 1.7rem;
}

.presets {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--panel-border);
}

.shelf-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
}

/* One row that scrolls sideways: presets can be added without the dialog
   growing taller. Cards snap to the start edge so none is left cut in half. */
.shelf {
  display: flex;
  gap: var(--space-2);
  padding-bottom: var(--space-1);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.card {
  flex: 0 0 6.9rem;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  cursor: pointer;
}

.card:hover,
.card:focus-visible {
  background: var(--accent-faint);
  outline: none;
}

.card-line {
  display: flex;
  align-self: stretch;
  justify-content: space-between;
  gap: var(--space-1);
}

.badge {
  color: var(--text-muted);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
}

.chord {
  align-self: stretch;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-align: left;
  white-space: nowrap;
}

.card:not(.kept) .badge {
  color: var(--accent-strong);
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
