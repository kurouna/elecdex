<script lang="ts">
import ConfirmButton from '../ConfirmButton.svelte'
import { backdropShade, crtPower, dialogDelay } from '../lib/crt-transitions.ts'
import { revealSelected } from '../lib/list-selection.ts'
import { plugins } from '../plugins/plugins.svelte.ts'
import { layout, type PanePlacement } from '../stores/layout.svelte.ts'
import { sfx } from '../stores/sound.svelte.ts'
import { ui } from '../stores/ui.svelte.ts'
import { listWidgets, type WidgetDefinition } from '../widgets/registry.ts'

/**
 * The add-pane picker: every widget, filterable, placed beside the focused pane.
 *
 * eDEX-UI had a fixed set of modules - nothing could be removed, so nothing
 * needed adding back. Here any pane can be closed, so any widget can be brought
 * back from here. It borrows the shape of the original's fuzzy finder: a framed
 * modal with a filter box over a list driven from the keyboard.
 *
 *   ↑ ↓      choose a widget        Tab      cycle where it goes
 *   Enter    add (or focus a single-instance widget already on screen)
 *   Esc      close
 */

const PLACEMENTS: Array<{ id: PanePlacement; label: string }> = [
  { id: 'right', label: '→ right' },
  { id: 'down', label: '↓ below' },
  { id: 'tab', label: '⧉ new tab' },
]

let filter = $state('')
let selected = $state(0)
let placement = $state<PanePlacement>('right')
let input = $state<HTMLInputElement | null>(null)
let list = $state<HTMLUListElement | null>(null)
let returnFocus: HTMLElement | null = null

const widgets = $derived.by(() => {
  const q = filter.trim().toLowerCase()
  return listWidgets().filter(
    (w) =>
      // A plugin is offered once it is on and agreed to; the settings list the rest.
      (!w.plugin || plugins.usable(w.id.slice('plugin:'.length))) &&
      (q === '' ||
        w.id.includes(q) ||
        w.title.toLowerCase().includes(q) ||
        (w.description ?? '').toLowerCase().includes(q)),
  )
})

/** A widget that allows one instance and already has it: picking it focuses that pane. */
const existing = (w: WidgetDefinition): string | null => (w.multiple ? null : layout.paneWith(w.id))

$effect(() => {
  if (!ui.panePickerOpen) return
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  filter = ''
  selected = 0
  queueMicrotask(() => input?.focus())
  return () => {
    returnFocus?.focus()
    returnFocus = null
  }
})

// Keep the selection on a row that exists as the filter narrows the list.
$effect(() => {
  if (selected >= widgets.length) selected = Math.max(0, widgets.length - 1)
})

// Keep the selected row in view as the arrow keys move past the edge.
$effect(() => {
  void selected
  revealSelected(list)
})

function choose(w: WidgetDefinition | undefined): void {
  if (!w) return
  const already = existing(w)
  ui.closePanePicker()
  if (already !== null) {
    returnFocus = null
    layout.focus(already)
    return
  }
  returnFocus = null
  layout.addPane(w.id, placement)
}

function onKeydown(event: KeyboardEvent): void {
  if (!ui.panePickerOpen) return
  const take = () => {
    event.preventDefault()
    event.stopPropagation()
  }
  switch (event.key) {
    case 'Escape':
      take()
      ui.closePanePicker()
      return
    case 'ArrowDown':
      take()
      selected = (selected + 1) % Math.max(1, widgets.length)
      sfx.play('folder')
      return
    case 'ArrowUp':
      take()
      selected = (selected - 1 + widgets.length) % Math.max(1, widgets.length)
      sfx.play('folder')
      return
    case 'Tab': {
      take()
      const i = PLACEMENTS.findIndex((p) => p.id === placement)
      const step = event.shiftKey ? PLACEMENTS.length - 1 : 1
      placement = PLACEMENTS[(i + step) % PLACEMENTS.length]?.id ?? 'right'
      return
    }
    case 'Enter':
      take()
      choose(widgets[selected])
      return
  }
}
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if ui.panePickerOpen}
  <!-- The backdrop closes on click; the keyboard path is Escape, handled above. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" transition:backdropShade onpointerdown={(e) => e.target === e.currentTarget && ui.closePanePicker()}>
    <div class="picker crt-on" style:--crt-delay={dialogDelay()} transition:crtPower role="dialog" aria-modal="true" aria-label="Add pane" data-testid="pane-picker">
      <header class="hud-label">
        <span>add pane</span>
        <span>↑↓ choose · tab placement · enter add · esc close</span>
      </header>
      <div class="shell-frame body">
        <input
          bind:this={input}
          bind:value={filter}
          class="filter"
          placeholder="filter widgets"
          spellcheck="false"
          data-testid="pane-picker-filter"
        />

        <div class="placements" role="radiogroup" aria-label="Placement">
          {#each PLACEMENTS as p (p.id)}
            <button
              type="button"
              role="radio"
              aria-checked={placement === p.id}
              class:active={placement === p.id}
              onclick={() => (placement = p.id)}
              data-testid="pane-picker-placement"
              data-placement={p.id}
            >
              {p.label}
            </button>
          {/each}
        </div>

        <!-- The pointer chooses on a move, not on entering a row: the arrow keys
             scroll rows under a resting pointer, which would otherwise take the
             selection straight back. -->
        <ul class="list" role="listbox" aria-label="Widgets" bind:this={list}>
          {#each widgets as w, i (w.id)}
            {@const present = existing(w)}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={i === selected}
                class:selected={i === selected}
                onpointermove={() => (selected = i)}
                onclick={() => choose(w)}
                data-testid="pane-picker-item"
                data-widget={w.id}
              >
                <span class="title">{w.title}{#if w.plugin}<em class="plugin-tag">plugin</em>{/if}</span>
                <span class="description">{w.description ?? ''}</span>
                <span class="state">{present !== null ? 'on screen · focus' : w.multiple ? 'add another' : 'add'}</span>
              </button>
            </li>
          {:else}
            <li class="empty">no widget matches “{filter}”</li>
          {/each}
        </ul>

        <footer class="picker-footer">
          <span>or start over from the default layout</span>
          <ConfirmButton
            label="reset layout"
            action="reset"
            title="Restore the default layout (Ctrl+Shift+Backspace)"
            testid="pane-picker-reset"
            onconfirm={() => {
              returnFocus = null
              ui.closePanePicker()
              void layout.reset()
            }}
          />
        </footer>
      </div>
    </div>
  </div>
{/if}

<style>
.plugin-tag {
  margin-left: 0.4em;
  padding: 0 0.3em;
  border: 1px solid var(--panel-border);
  font-size: var(--step--2);
  font-style: normal;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  vertical-align: middle;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.55);
}

.picker {
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

.placements {
  display: flex;
  gap: var(--space-2);
}

.placements button {
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

.placements button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
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

.list button {
  display: grid;
  grid-template-columns: 9rem 1fr auto;
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

.title {
  font-family: var(--font-ui);
  font-size: var(--step-0);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.description {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.state {
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.picker-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.empty {
  padding: var(--space-3);
  color: var(--text-muted);
}
</style>
