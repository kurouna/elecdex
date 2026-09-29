<script lang="ts">
import { CHIP8_GENRES, type Chip8Genre, type Chip8Program } from '@shared/chip8-library'
import { afterBlink } from '../../lib/blink.ts'
import { POWER_OFF_MS } from '../../lib/crt-motion.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import type { LibraryFilter } from './pane-state.ts'

/**
 * The CHIP-8 library (docs/architecture.md section 5.18): tabs by kind, the programs, and
 * the chosen one's details with LOAD. A tab change powers the list off and on, rows come in
 * like tiles, and the program chosen blinks, the launcher's way, before it loads.
 *
 * Keys, while the pane has them: up and down choose, Enter loads, left and right change tab.
 */
interface Props {
  programs: Chip8Program[]
  loaded: boolean
  filter: LibraryFilter
  selected: string | null
  onfilter: (filter: LibraryFilter) => void
  onselect: (id: string) => void
  onload: (id: string) => void
}

const { programs, loaded, filter, selected, onfilter, onselect, onload }: Props = $props()

const GENRE_LABELS: Record<Chip8Genre, string> = {
  action: 'action',
  puzzle: 'puzzle',
  showcase: 'showcase',
  toys: 'toys',
  diag: 'diag',
  imported: 'imported',
}
const PLATFORM_CHIPS = { chip8: 'C8', schip: 'SC', xochip: 'XO' } as const

/** The tabs that have something in them, after ALL. */
const tabs = $derived<LibraryFilter[]>([
  'all',
  ...CHIP8_GENRES.filter((g) => programs.some((p) => p.genre === g)),
])
const shown = $derived(filter === 'all' ? programs : programs.filter((p) => p.genre === filter))
const chosen = $derived(shown.find((p) => p.id === selected) ?? shown[0] ?? null)

let list = $state<HTMLDivElement | null>(null)

function rowOf(id: string): HTMLElement | null {
  return list?.querySelector<HTMLElement>(`[data-program="${CSS.escape(id)}"]`) ?? null
}

/**
 * Scrolls the list, and only the list, to show a row: scrollIntoView would move every
 * scrolling ancestor too, the workspace among them.
 */
function keepInView(row: HTMLElement | null): void {
  const box = list
  if (row === null || box === null) return
  // The list is positioned, so a row's offset is from the list's top.
  const top = row.offsetTop
  if (top < box.scrollTop) box.scrollTop = top
  else if (top + row.offsetHeight > box.scrollTop + box.clientHeight)
    box.scrollTop = top + row.offsetHeight - box.clientHeight
}

function choose(id: string): void {
  if (id === chosen?.id) return
  onselect(id)
  keepInView(rowOf(id))
}

function load(id: string): void {
  afterBlink(rowOf(id), () => onload(id))
}

function setFilter(next: LibraryFilter): void {
  if (next === filter) return
  sfx.play('panel')
  onfilter(next)
}

/** A key pressed while the pane has the keyboard and the library shows; true when it was ours. */
export function key(event: KeyboardEvent): boolean {
  const at = shown.findIndex((p) => p.id === chosen?.id)
  switch (event.code) {
    case 'ArrowDown':
    case 'ArrowUp': {
      const next =
        shown[Math.max(0, Math.min(shown.length - 1, at + (event.code === 'ArrowDown' ? 1 : -1)))]
      if (next !== undefined) choose(next.id)
      return true
    }
    case 'ArrowLeft':
    case 'ArrowRight': {
      const k = tabs.indexOf(filter) + (event.code === 'ArrowRight' ? 1 : -1)
      const next = tabs[(k + tabs.length) % tabs.length]
      if (next !== undefined) setFilter(next)
      return true
    }
    case 'Enter':
      if (chosen !== null) load(chosen.id)
      return true
    default:
      return false
  }
}

const year = (released: string | undefined): string => released?.slice(0, 4) ?? ''
</script>

<div class="library" data-testid="chip8-library">
  <div class="tabs" role="tablist" aria-label="kinds">
    {#each tabs as tab (tab)}
      <button
        type="button"
        class="tab"
        role="tab"
        aria-selected={filter === tab}
        onclick={() => setFilter(tab)}
        data-testid="chip8-filter"
        data-filter={tab}
      >
        {tab === 'all' ? 'all' : GENRE_LABELS[tab]}
        <small>{tab === 'all' ? programs.length : programs.filter((p) => p.genre === tab).length}</small>
      </button>
    {/each}
  </div>

  <div class="main">
    {#key filter}
      <!-- A tab's list powers on once the one it replaces has powered off. -->
      <div
        class="list crt-on"
        bind:this={list}
        role="listbox"
        aria-label="programs"
        style:--crt-delay="{POWER_OFF_MS}ms"
        transition:crtPower
      >
        {#each shown as program, i (program.id)}
          <button
            type="button"
            tabindex="-1"
            class="row"
            role="option"
            aria-selected={program.id === chosen?.id}
            style:--delay="{Math.min(i, 12) * 22}ms"
            onclick={() => choose(program.id)}
            ondblclick={() => load(program.id)}
            data-testid="chip8-program"
            data-program={program.id}
          >
            <span class="name">
              <b>{program.title}</b>
              <span>{program.authors.join(', ')}{program.event ? ` · ${program.event}` : ''}</span>
            </span>
            <span class="c8-chip plain">{PLATFORM_CHIPS[program.platform]}</span>
            <span class="year">{year(program.released)}</span>
          </button>
        {:else}
          <p class="empty">{loaded ? 'No programs here.' : 'Reading the library…'}</p>
        {/each}
      </div>
    {/key}

    {#if chosen !== null}
      <div class="detail" data-testid="chip8-detail" data-program={chosen.id}>
        <div class="title">{chosen.title}</div>
        <div class="meta">
          {[chosen.authors.join(', '), chosen.event, chosen.released].filter(Boolean).join(' · ')}
        </div>
        <p class="description">{chosen.description}</p>
        <dl class="facts">
          <dt>machine</dt>
          <dd>
            <span class="c8-chip plain">{PLATFORM_CHIPS[chosen.platform]}</span>
            {chosen.platform === 'chip8' ? '64 × 32' : '64 × 32 / 128 × 64'}{chosen.platform === 'xochip' ? ' · 4 colours' : ''}
          </dd>
          <dt>speed</dt>
          <dd>{chosen.ipf} a frame</dd>
          <dt>licence</dt>
          <dd>{chosen.licence}</dd>
        </dl>
        <div class="actions">
          <button
            type="button"
            class="c8-btn primary"
            onclick={(e) => afterBlink(e.currentTarget, () => onload(chosen.id))}
            data-testid="chip8-load">load ▸</button
          >
        </div>
      </div>
    {/if}
  </div>

  <div class="credits">
    <span>diag · chip8-test-suite (Timendus) · GPL-3.0</span>
  </div>
</div>

<style>
.library {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--panel-rule);
}

.tab {
  position: relative;
  border: 0;
  background: none;
  padding: 1px var(--space-2) 3px;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
}

.tab small {
  margin-left: 0.3em;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  opacity: 0.7;
}

.tab[aria-selected='true'] {
  color: var(--accent-strong);
}

.tab[aria-selected='true']::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
}

.main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-3);
  min-height: 0;
}

.list {
  position: relative;
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
}

.row {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 3.2em;
  align-items: center;
  gap: var(--space-2);
  padding: 3px var(--space-1);
  border-left: 2px solid transparent;
  cursor: pointer;
  animation: c8-tile-in 220ms ease-out var(--delay, 0ms) backwards;
  animation-play-state: var(--ambient-play-state);
}

@keyframes c8-tile-in {
  from {
    opacity: 0;
    transform: translateX(-0.6rem);
  }
}

.row:hover {
  background: var(--accent-faint);
}

.row[aria-selected='true'] {
  border-left-color: var(--accent);
  background: var(--accent-faint);
}

.name {
  min-width: 0;
}

.name b {
  display: block;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step--1);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name span {
  display: block;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.04em;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.year {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
  text-align: right;
}

.empty {
  margin: 0;
  padding: var(--space-2);
  color: var(--text-muted);
  font-size: var(--step--1);
}

.detail {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 0;
  padding-left: var(--space-3);
  border-left: 1px solid var(--panel-rule);
}

.detail .title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--step-1);
  color: var(--text);
}

.meta {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.description {
  margin: 0;
  font-size: var(--step--1);
  line-height: 1.5;
  color: var(--text);
}

.facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px var(--space-2);
  margin: 0;
  font-size: var(--step--1);
}

.facts dt {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.facts dd {
  margin: 0;
  font-family: var(--font-mono);
  color: var(--text);
}

.actions {
  margin-top: auto;
  display: flex;
  gap: var(--space-2);
}

.credits {
  border-top: 1px solid var(--panel-rule);
  padding-top: 2px;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

/* A narrow pane: the list alone, the chosen one loads with Enter or a double click. */
@container chip8 (max-width: 520px) {
  .main {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail {
    display: none;
  }
}
</style>
