<script lang="ts">
import { effectiveBindings, type KeybindingAction } from '@shared/keybindings'
import { LAYOUT_PRESETS } from '@shared/layout-presets'
import {
  armVerb,
  nameParts,
  nextKind,
  PALETTE_KINDS,
  type PaletteItem,
  type PaletteKind,
  type PaletteRow,
  rankItems,
  remember,
} from '@shared/palette'
import { commands } from '../lib/commands.ts'
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { keyLabels } from '../lib/key-labels.svelte.ts'
import { revealSelected } from '../lib/list-selection.ts'
import { plugins } from '../plugins/plugins.svelte.ts'
import { settingsSections } from '../settings-sections.ts'
import { appearance } from '../stores/appearance.svelte.ts'
import { background } from '../stores/background.svelte.ts'
import { layout } from '../stores/layout.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import { listWidgets } from '../widgets/registry.ts'
import { dispatch, storeTargets } from './run.ts'
import {
  actionItems,
  layoutItems,
  paneItems,
  presetItems,
  settingsItems,
  themeItems,
} from './sources.ts'

/**
 * The action palette (docs/palette.md): every shortcut's action, saved layout, preset, theme,
 * pane and settings section, found by typing and run from the keyboard. Shaped and powered on
 * as the add-pane picker is (PanePicker.svelte); it knows the workspace only through
 * `commands`, so a row does exactly what its key does.
 *
 *   ↑ ↓  PgUp PgDn   choose          Tab / Shift+Tab   the kind of row
 *   Enter            run (twice for what cannot be undone)
 *   Esc              disarm, then close
 */

/** Rows a page key moves by. */
const PAGE = 8

const platform = window.elecdex.system.platform

let filter = $state('')
let kind = $state<PaletteKind | 'all'>('all')
let selected = $state(0)
/** The row armed by a first Enter, by key. */
let armed = $state<string | null>(null)
/** What ran last, first: the page's memory only (docs/palette.md Q3). */
let recent = $state<string[]>([])
let input = $state<HTMLInputElement | null>(null)
let list = $state<HTMLUListElement | null>(null)
let returnFocus: HTMLElement | null = null

const isShell = (widget: string): boolean => widget === 'terminal'

/** Every row, from what the stores hold now; worked out only while the palette is open. */
const items = $derived.by((): PaletteItem[] => {
  if (!ui.paletteOpen) return []
  const bindings = effectiveBindings(appearance.settings.keybindings, platform)
  const labels = keyLabels.map
  return [
    ...actionItems({
      platform,
      bindings,
      labels,
      applies: (action: KeybindingAction) => commands.applies(action),
      arm: {
        anyShell: layout.panes.some((p) => isShell(p.widget)),
        confirmSwitch: appearance.settings.layout.confirmSwitch,
      },
    }),
    ...layoutItems(layout.savedLayouts, bindings, labels),
    ...presetItems(LAYOUT_PRESETS, layout.savedLayouts, bindings, labels),
    ...themeItems(appearance.catalog.themes, appearance.theme.id),
    ...paneItems(
      listWidgets(),
      (w) => layout.paneWith(w.id),
      (w) => plugins.usable(w.id.slice('plugin:'.length)),
    ),
    ...settingsItems(settingsSections(background.capabilities)),
  ]
})

const rows = $derived(rankItems(items, filter, kind, recent))
const counts = $derived.by(() => {
  const by: Record<string, number> = { all: items.length }
  for (const item of items) by[item.kind] = (by[item.kind] ?? 0) + 1
  return by
})
const shown = $derived(new Set(rows.map((row) => row.item.key)).size)
const current = $derived<PaletteRow | undefined>(rows[selected])

/** The footer: what Enter would do on the selected row. */
const footer = $derived.by(() => {
  const item = current?.item
  if (item === undefined) return ''
  if (item.key === armed) return `Enter again to ${armVerb(item.key.slice('action:'.length))}`
  if (item.state.kind === 'off') return `Not now: ${item.state.reason}`
  if (item.state.kind === 'current') return `${item.label}: in use now`
  return item.detail === '' ? item.label : `${item.label}: ${item.detail}`
})

$effect(() => {
  if (!ui.paletteOpen) return
  filter = ''
  kind = 'all'
  selected = 0
  armed = null
  // Where the keyboard is is read after this flush, not in it: opened over a popped-up pane,
  // the palette's effect runs before the popup's clean-up gives the keyboard back to where it
  // was (the shell), and would take the popup's field, gone by the time it closes.
  queueMicrotask(() => {
    if (!ui.paletteOpen) return
    const active = document.activeElement
    returnFocus = active instanceof HTMLElement && active !== input ? active : null
    input?.focus()
  })
  return () => {
    returnFocus?.focus()
    returnFocus = null
  }
})

// Keep the selection on a row that exists as the filter narrows the list.
$effect(() => {
  if (selected >= rows.length) selected = Math.max(0, rows.length - 1)
})

// Keep the selected row in view as the keys move past the edge.
$effect(() => {
  void selected
  revealSelected(list)
})

function close(): void {
  ui.closePalette()
}

function choose(row: PaletteRow | undefined): void {
  if (row === undefined) return
  const { item } = row
  if (item.state.kind !== 'ready') return
  if (item.arm && armed !== item.key) {
    armed = item.key
    // A click arms too, and a pressed button keeps the keyboard: give it back to the filter.
    input?.focus()
    return
  }
  armed = null
  ui.closePalette()
  // Given back now, before the row runs, so what the row does with the keyboard (a shell
  // focused, a pane added) is not undone by the close's clean-up after it.
  returnFocus?.focus()
  returnFocus = null
  void Promise.resolve(dispatch(item, storeTargets)).then((went) => {
    // Only what ran is remembered: a switch answered no, or a key no longer applying, is not.
    if (went) recent = remember(recent, item.key)
  })
}

/** Selects a row under the pointer; leaving an armed row disarms it, as the arrows do. */
function point(i: number): void {
  if (i === selected) return
  selected = i
  armed = null
}

/** Moves the selection: round the ends one at a time, stopping at them by pages. */
function move(step: number): void {
  const count = rows.length
  if (count === 0) return
  selected =
    Math.abs(step) === 1
      ? (selected + step + count) % count
      : Math.min(count - 1, Math.max(0, selected + step))
  armed = null
  sfx.play('folder')
}

function chooseKind(next: PaletteKind | 'all'): void {
  kind = next
  selected = 0
  armed = null
}

/** The palette's own keys, and what each does; anything else goes to the filter. */
const KEYS: Record<string, (event: KeyboardEvent) => void> = {
  Escape: () => {
    if (armed !== null) armed = null
    else close()
  },
  ArrowDown: () => move(1),
  ArrowUp: () => move(-1),
  PageDown: () => move(PAGE),
  PageUp: () => move(-PAGE),
  Tab: (event) => chooseKind(nextKind(kind, event.shiftKey ? -1 : 1)),
  Enter: () => choose(rows[selected]),
}

function onKeydown(event: KeyboardEvent): void {
  if (!ui.paletteOpen) return
  // A word being composed (an IME) has the keys until it is put down.
  if (event.isComposing || event.keyCode === 229) return
  // With Ctrl, Alt or the system key it is a shortcut, not one of the palette's keys.
  if (event.ctrlKey || event.altKey || event.metaKey) return
  const handle = KEYS[event.key]
  if (handle === undefined) return
  event.preventDefault()
  event.stopPropagation()
  handle(event)
}

function onInput(): void {
  selected = 0
  armed = null
}

function onKindClick(next: PaletteKind | 'all'): void {
  chooseKind(next)
  input?.focus()
}

/** The words at a row's end, before its chord. */
function stateWords(item: PaletteItem): string {
  if (item.key === armed) return `enter again to ${armVerb(item.key.slice('action:'.length))}`
  if (item.state.kind === 'off') return item.state.reason
  if (item.state.kind === 'current') return 'current'
  return item.note ?? ''
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if ui.paletteOpen}
  <!-- The backdrop closes on a press; the keyboard path is Escape, handled above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" transition:backdropShade onpointerdown={(e) => e.target === e.currentTarget && close()}>
    <div class="palette crt-on" style:--crt-delay={dialogDelay()} transition:crtPower role="dialog" aria-modal="true" aria-label="Actions" data-testid="action-palette">
      <header class="hud-label">
        <span>actions</span>
        <span>↑↓ choose · tab kind · enter run · esc close</span>
      </header>
      <div class="shell-frame body">
        <input
          bind:this={input}
          bind:value={filter}
          oninput={onInput}
          class="filter"
          placeholder="type to find an action, layout, theme, pane or setting"
          spellcheck="false"
          autocomplete="off"
          data-testid="action-palette-filter"
        />

        <div class="kinds" role="radiogroup" aria-label="Kind">
          {#each ['all', ...PALETTE_KINDS] as const as k (k)}
            <button
              type="button"
              role="radio"
              aria-checked={kind === k}
              class:active={kind === k}
              tabindex="-1"
              onclick={() => onKindClick(k)}
              data-testid="action-palette-kind"
              data-kind={k}
            >{k}<b>{counts[k] ?? 0}</b></button>
          {/each}
        </div>

        <!-- The pointer chooses on a move, not on entering a row, as in the picker. -->
        <ul class="list" role="listbox" aria-label="Actions" bind:this={list}>
          {#each rows as row, i (`${row.heading ?? ''}${i}:${row.item.key}`)}
            {#if row.heading}
              <li class="heading" role="presentation" data-testid="action-palette-heading">{row.heading}</li>
            {/if}
            {@const item = row.item}
            <li>
              <button
                type="button"
                role="option"
                tabindex="-1"
                aria-selected={i === selected}
                class:selected={i === selected}
                class:unavailable={item.state.kind !== 'ready'}
                class:armed={item.key === armed}
                onpointermove={() => point(i)}
                onclick={() => choose(row)}
                data-testid="action-palette-row"
                data-key={item.key}
              >
                <span class="kind">{item.kind}</span>
                <span class="title">{#each nameParts(item.label, row.spans) as part, p (p)}{#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</span>
                <span class="description">{item.detail}</span>
                <span class="state" class:current={item.state.kind === 'current' && item.key !== armed}>
                  {stateWords(item)}
                  {#if item.chord !== null}<kbd class="chord">{item.chord}</kbd>{/if}
                </span>
              </button>
            </li>
          {:else}
            <li class="empty" data-testid="action-palette-empty">
              nothing matches “{filter}”{#if kind !== 'all'} in {kind} · tab for every kind{/if}
            </li>
          {/each}
        </ul>

        <footer class="palette-footer">
          <span class="what" data-testid="action-palette-footer">{footer}</span>
          <span class="count">{shown} / {counts.all ?? 0}</span>
        </footer>
      </div>
    </div>
  </div>
{/if}

<style>
/* The add-pane picker's frame, filter and rows (PanePicker.svelte), so the two read as one. */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.palette {
  --crt-duration: 380ms;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(46rem, 90vw);
  max-height: min(34rem, 80vh);
  background: var(--app-bg);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
  padding: var(--space-3);
}

.filter {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step-0);
  outline: none;
}

.filter:focus {
  border-color: var(--accent);
}

.kinds {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.kinds button {
  padding: 0.1rem var(--space-3);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.kinds button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.kinds b {
  margin-left: 0.35em;
  font-family: var(--font-mono);
  font-weight: 400;
}

.list {
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.heading {
  margin-bottom: 2px;
  padding: var(--space-2) var(--space-2) var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.list button {
  display: grid;
  grid-template-columns: 4.5rem minmax(9rem, auto) 1fr auto;
  align-items: baseline;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-left: 2px solid transparent;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.list button.selected {
  border-left-color: var(--accent);
  background: var(--accent-faint);
}

/* Not to be run now, or already in use: readable, but set back, as in the picker. */
.list button.unavailable {
  color: var(--text-muted);
  cursor: default;
}

.list button.armed {
  border-left-color: var(--danger);
}

.kind {
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.title {
  font-family: var(--font-ui);
  font-size: var(--step-0);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

/* What was typed, underlined as well as coloured, so it reads without the colour. */
.title mark {
  background: none;
  color: var(--accent-strong);
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.unavailable .title mark {
  color: inherit;
}

.description {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.state {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: var(--space-2);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}

.state.current {
  color: var(--ok);
}

.armed .state {
  color: var(--danger);
}

.chord {
  padding: 0 0.35em;
  border: 1px solid var(--panel-rule);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: 0;
  text-transform: none;
}

.unavailable .chord {
  color: var(--text-muted);
}

.palette-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--panel-rule);
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.what {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text);
}

.count {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.empty {
  padding: var(--space-3);
  color: var(--text-muted);
}
</style>
