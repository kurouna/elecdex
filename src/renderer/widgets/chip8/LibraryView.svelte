<script lang="ts">
import type { GuessReason } from '@shared/chip8/platform'
import { PLATFORMS, type Platform } from '@shared/chip8/types'
import {
  CHIP8_GENRES,
  type Chip8Program,
  type Chip8SlotInfo,
  tunedConfig,
} from '@shared/chip8-library'
import { afterBlink } from '../../lib/blink.ts'
import { POWER_OFF_MS } from '../../lib/crt-motion.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import Attract from './Attract.svelte'
import ImportSheet from './ImportSheet.svelte'
import { GENRE_LABELS, keyWords, PLATFORM_CHIPS, screenWords, whenWords } from './labels.ts'
import ProgramCard from './ProgramCard.svelte'
import type { Palette } from './palette.ts'
import type { LibraryFilter } from './pane-state.ts'
import Thumb from './Thumb.svelte'

/**
 * The CHIP-8 library (docs/architecture.md section 5.18): tabs by kind, a search and the
 * three machines to show or hide, the programs with their previews, and the chosen one
 * playing by itself beside its details and LOAD - CONTINUE and NEW when AUTO holds where it
 * was left. A tab change powers the list off and on, rows come in like tiles, and the
 * program chosen blinks, the launcher's way, before it loads. A row rested on opens its
 * detail card. A star marks a program (the starred tab); IMPORT takes a file in through
 * main's picker and opens its sheet, as EDIT does for one imported before.
 *
 * Keys, while the pane has them: up and down choose, Enter loads (going on from AUTO),
 * left and right change tab; in the search, up, down and Enter do the same.
 */
interface Props {
  programs: Chip8Program[]
  loaded: boolean
  filter: LibraryFilter
  selected: string | null
  /** The colours a program is drawn in: the theme's, or its author's where the pane says so. */
  paletteOf: (program: Chip8Program) => Palette
  glow: boolean
  dots: boolean
  /** The library is seen: its attract mode plays only then. */
  seen: boolean
  onfilter: (filter: LibraryFilter) => void
  onselect: (id: string) => void
  /** Loads a program: from where it was left, or from the beginning (`fresh`). */
  onload: (id: string, fresh: boolean) => void
}

const {
  programs,
  loaded,
  filter,
  selected,
  paletteOf,
  glow,
  dots,
  seen,
  onfilter,
  onselect,
  onload,
}: Props = $props()

/**
 * The attract mode plays while someone is at the library: the pointer moving over it, a
 * key, a search. Half a minute without, it rests on its frame - a demo running on and on
 * for nobody cost a fifth of a core.
 */
const ATTRACT_AWAKE_MS = 30_000
let awake = $state(true)
let dozing: ReturnType<typeof setTimeout> | null = null

function stir(): void {
  if (!awake) awake = true
  if (dozing !== null) clearTimeout(dozing)
  dozing = setTimeout(() => {
    dozing = null
    awake = false
  }, ATTRACT_AWAKE_MS)
}
stir()
$effect(() => () => {
  if (dozing !== null) clearTimeout(dozing)
})

let query = $state('')
let hidden = $state.raw<Platform[]>([])

const matches = (program: Chip8Program, words: string): boolean =>
  words === '' ||
  [program.title, ...program.authors, program.event ?? '', program.description]
    .join(' ')
    .toLowerCase()
    .includes(words)

/** The tabs that have something in them, after ALL and STARRED (kept while it is open). */
const tabs = $derived<LibraryFilter[]>([
  'all',
  ...(filter === 'starred' || programs.some((p) => p.favourite) ? ['starred' as const] : []),
  ...CHIP8_GENRES.filter((g) => programs.some((p) => p.genre === g)),
])
const inFilter = (p: Chip8Program, tab: LibraryFilter): boolean =>
  tab === 'all' || (tab === 'starred' ? p.favourite : p.genre === tab)
const tabLabel = (tab: LibraryFilter): string =>
  tab === 'all' ? 'all' : tab === 'starred' ? '★' : GENRE_LABELS[tab]
/** Searching looks through the whole library, whichever tab is open. */
const searching = $derived(query.trim() !== '')
const shown = $derived.by(() => {
  const words = query.trim().toLowerCase()
  const inTab = (p: Chip8Program) => searching || inFilter(p, filter)
  return programs.filter((p) => inTab(p) && !hidden.includes(p.platform) && matches(p, words))
})
const chosen = $derived(shown.find((p) => p.id === selected) ?? shown[0] ?? null)

let root = $state<HTMLElement | null>(null)
let list = $state<HTMLDivElement | null>(null)

function rowOf(id: string): HTMLElement | null {
  return list?.querySelector<HTMLElement>(`[data-program="${CSS.escape(id)}"]`) ?? null
}

/**
 * Scrolls the list, and only the list, to show a row: scrollIntoView would move every
 * scrolling ancestor too.
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
  afterBlink(rowOf(id), () => onload(id, false))
}

/**
 * What AUTO holds of the program chosen, asked once the choice has settled. Keyed by the id:
 * the program itself is a new object whenever main's list changes (a star, a tuning), and
 * asking again then made CONTINUE blink back to LOAD.
 */
let auto = $state.raw<Chip8SlotInfo | null>(null)
const chosenId = $derived(chosen?.id)
$effect(() => {
  const id = chosenId
  auto = null
  if (id === undefined) return
  const timer = setTimeout(() => {
    void window.elecdex.chip8
      .slots(id)
      .catch(() => [])
      .then((slots) => {
        if (chosenId === id) auto = slots.find((s) => s.slot === 'auto') ?? null
      })
  }, 120)
  return () => clearTimeout(timer)
})

function star(program: Chip8Program): void {
  sfx.play(program.favourite ? 'collapse' : 'expand')
  void window.elecdex.chip8.favourite(program.id, !program.favourite)
}

/** The imported program whose sheet is open, and what main said of it when it came in. */
let sheet = $state.raw<{
  program: Chip8Program
  guess: GuessReason | null
  already: boolean
} | null>(null)
/** The sheet's program as the library has it now (renamed, another machine). */
const sheetProgram = $derived(
  sheet === null ? null : (programs.find((p) => p.id === sheet?.program.id) ?? sheet.program),
)
let importProblem = $state<string | null>(null)

async function importFile(): Promise<void> {
  const result = await window.elecdex.chip8.import().catch(() => null)
  if (result === null) return
  if (!result.ok) {
    importProblem = result.problem
    sfx.play('glitch')
    return
  }
  importProblem = null
  sfx.play('granted')
  query = ''
  onfilter('imported')
  onselect(result.program.id)
  sheet = { program: result.program, guess: result.guess, already: result.already }
}

function closeSheet(): void {
  sheet = null
  root?.closest<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true })
}

function setFilter(next: LibraryFilter): void {
  if (next === filter) return
  sfx.play('panel')
  onfilter(next)
}

function toggle(platform: Platform): void {
  hidden = hidden.includes(platform) ? hidden.filter((p) => p !== platform) : [...hidden, platform]
}

/** A key pressed while the pane has the keyboard and the library shows; true when it was ours. */
export function key(event: KeyboardEvent): boolean {
  stir()
  const at = shown.findIndex((p) => p.id === chosen?.id)
  switch (event.code) {
    case 'ArrowDown':
    case 'ArrowUp': {
      const step = event.code === 'ArrowDown' ? 1 : -1
      const next = shown[Math.max(0, Math.min(shown.length - 1, at + step))]
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

/** In the search, the list is still walked and loaded from; left and right move the caret. */
function searchKey(event: KeyboardEvent): void {
  if (event.ctrlKey || event.altKey || event.metaKey) return
  const walk = event.code === 'ArrowDown' || event.code === 'ArrowUp' || event.code === 'Enter'
  if (walk && key(event)) event.preventDefault()
}

/** The program whose card is up, and where its row is, in the library's own pixels. */
let hover = $state.raw<{ id: string; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<string>(() => (hover = null))

function rest(id: string, event: PointerEvent): void {
  const row = event.currentTarget as HTMLElement
  const x = event.clientX
  resting.enter(id, () => {
    if (root === null) return
    const box = root.getBoundingClientRect()
    hover = {
      id,
      anchor: anchorOf(box, row.getBoundingClientRect(), x),
      bounds: { width: box.width, height: box.height },
    }
  })
}

const hovered = $derived(hover === null ? null : (shown.find((p) => p.id === hover?.id) ?? null))

// A row that goes from under the pointer (a search, a tab) sends no leave: its card goes here.
$effect(() => {
  const id = hover?.id
  if (id !== undefined && !shown.some((p) => p.id === id)) resting.leave()
})

// Out of sight, the card goes with the rest of what moves.
$effect(() => {
  if (!seen) resting.leave()
})
$effect(() => () => resting.dispose())

const year = (released: string | undefined): string => released?.slice(0, 4) ?? ''
/** The pads in the keypad's own order, row by row. */
const KEY_ORDER = [0x1, 0x2, 0x3, 0xc, 0x4, 0x5, 0x6, 0xd, 0x7, 0x8, 0x9, 0xe, 0xa, 0x0, 0xb, 0xf]
</script>

<div
  class="library"
  role="region"
  aria-label="library"
  bind:this={root}
  onpointermove={stir}
  oninput={stir}
  data-testid="chip8-library"
  data-awake={awake}
>
  <div class="tabs" role="tablist" aria-label="kinds">
    {#each tabs as tab (tab)}
      <button
        type="button"
        class="tab"
        role="tab"
        aria-selected={filter === tab}
        class:dim={searching}
        onclick={() => setFilter(tab)}
        data-testid="chip8-filter"
        data-filter={tab}
      >
        {tabLabel(tab)}
        <small>{programs.filter((p) => inFilter(p, tab)).length}</small>
      </button>
    {/each}
  </div>

  <div class="bar">
    <input
      class="search"
      type="search"
      spellcheck="false"
      placeholder="search title, author, jam"
      aria-label="search the library"
      bind:value={query}
      onkeydown={searchKey}
      data-testid="chip8-search"
    />
    <span class="machines" role="group" aria-label="machines">
      {#each PLATFORMS as platform (platform)}
        <button
          type="button"
          class="c8-chip"
          aria-pressed={!hidden.includes(platform)}
          onclick={() => toggle(platform)}
          data-testid="chip8-machine"
          data-platform={platform}>{PLATFORM_CHIPS[platform]}</button
        >
      {/each}
    </span>
    <button
      type="button"
      class="c8-btn"
      title="take a program file into the library"
      onclick={(e) => afterBlink(e.currentTarget, () => void importFile())}
      data-testid="chip8-import">+ import</button
    >
  </div>
  {#if importProblem !== null}
    <p class="problem" data-testid="chip8-import-problem">{importProblem}</p>
  {/if}

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
            onpointerenter={(e) => rest(program.id, e)}
            onpointerleave={() => resting.leave(program.id)}
            data-testid="chip8-program"
            data-program={program.id}
          >
            <Thumb
              preview={program.preview}
              palette={paletteOf(program)}
              rotation={program.rotation}
              width={64}
              height={32}
            />
            <span class="name">
              <b>{program.title}</b>
              <span>{program.authors.join(', ')}{program.event ? ` · ${program.event}` : ''}</span>
            </span>
            <span class="c8-chip plain">{PLATFORM_CHIPS[program.platform]}</span>
            <span class="year"
              >{#if program.favourite}<i class="starred" aria-label="starred">★</i>{/if}{year(
                program.released,
              )}</span
            >
          </button>
        {:else}
          <p class="empty">{loaded ? 'Nothing here matches.' : 'Reading the library…'}</p>
        {/each}
      </div>
    {/key}

    {#if chosen !== null}
      <div class="detail" data-testid="chip8-detail" data-program={chosen.id}>
        <Attract program={chosen} palette={paletteOf(chosen)} {glow} {dots} seen={seen && awake} />
        <div class="title">{chosen.title}</div>
        <div class="meta">
          {[chosen.authors.join(', '), chosen.event, chosen.released].filter(Boolean).join(' · ')}
        </div>
        <p class="description">{chosen.description}</p>
        <dl class="facts">
          <dt>machine</dt>
          <dd>
            <span class="c8-chip plain">{PLATFORM_CHIPS[chosen.platform]}</span>
            {screenWords(chosen.platform)}
          </dd>
          <dt>speed</dt>
          <dd>
            {tunedConfig(chosen).ipf.toLocaleString('en-US')} a frame{chosen.tuning !== undefined
              ? ' · tuned'
              : ''}
          </dd>
          <dt>keys</dt>
          <dd
            class="keys"
            aria-label={chosen.keys === 0 ? 'none seen' : keyWords(chosen.keys)}
            data-testid="chip8-detail-keys"
          >
            {#each KEY_ORDER as pad (pad)}
              <i class:on={(chosen.keys & (1 << pad)) !== 0}>{pad.toString(16).toUpperCase()}</i>
            {/each}
          </dd>
        </dl>
        <div class="actions">
          {#if auto !== null}
            <button
              type="button"
              class="c8-btn primary"
              onclick={(e) => afterBlink(e.currentTarget, () => onload(chosen.id, false))}
              data-testid="chip8-load">continue ▸</button
            >
            <button
              type="button"
              class="c8-btn"
              title="from the beginning"
              onclick={(e) => afterBlink(e.currentTarget, () => onload(chosen.id, true))}
              data-testid="chip8-new">new</button
            >
          {:else}
            <button
              type="button"
              class="c8-btn primary"
              onclick={(e) => afterBlink(e.currentTarget, () => onload(chosen.id, true))}
              data-testid="chip8-load">load ▸</button
            >
          {/if}
          <button
            type="button"
            class="c8-btn star"
            aria-pressed={chosen.favourite}
            aria-label={chosen.favourite ? 'unstar' : 'star'}
            onclick={() => star(chosen)}
            data-testid="chip8-star">{chosen.favourite ? '★' : '☆'}</button
          >
          {#if chosen.source !== undefined}
            <button
              type="button"
              class="c8-btn"
              onclick={() => (sheet = { program: chosen, guess: null, already: false })}
              data-testid="chip8-edit">edit</button
            >
          {/if}
        </div>
        {#if auto !== null}
          <div class="left" data-testid="chip8-auto">left at {whenWords(auto.at, Date.now())}</div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="credits">
    <span>programs · chip8Archive · CC0 1.0 · by their authors</span>
    <span>diag · chip8-test-suite (Timendus) · GPL-3.0</span>
  </div>

  {#if hovered !== null && hover !== null && sheet === null}
    <ProgramCard program={hovered} anchor={hover.anchor} bounds={hover.bounds} />
  {/if}

  {#if sheet !== null && sheetProgram !== null}
    <ImportSheet
      program={sheetProgram}
      guess={sheet.guess}
      already={sheet.already}
      palette={paletteOf(sheetProgram)}
      onclose={closeSheet}
    />
  {/if}
</div>

<style>
.library {
  position: relative;
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

/* While a search looks through them all, the tabs step back. */
.tab.dim {
  opacity: 0.45;
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

.bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.search {
  flex: 1;
  min-width: 6rem;
  border: 0;
  border-bottom: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: 1px var(--space-1);
  outline: none;
}

.search::placeholder {
  color: var(--text-muted);
}

.search:focus {
  border-bottom-color: var(--accent);
}

.machines {
  display: inline-flex;
  gap: 2px;
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
  grid-template-columns: auto minmax(0, 1fr) auto 3.2em;
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
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
}

.star[aria-pressed='true'] {
  color: var(--warn);
}

.left {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.starred {
  font-style: normal;
  color: var(--warn);
  margin-right: 0.3em;
}

.problem {
  margin: 0;
  font-size: var(--step--1);
  color: var(--warn);
}

.keys {
  display: grid;
  grid-template-columns: repeat(4, 1.1rem);
  gap: 2px;
}

.keys i {
  font-style: normal;
  text-align: center;
  font-size: var(--step--2);
  line-height: 1.4;
  border: 1px solid var(--panel-rule);
  color: var(--text-muted);
}

.keys i.on {
  color: var(--text-inverse);
  background: var(--accent);
  border-color: var(--accent);
}

.credits {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0 var(--space-3);
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
