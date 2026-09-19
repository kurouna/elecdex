<script lang="ts">
import { evaluateAt } from '@shared/calc'
import { type Note, noteTitle } from '@shared/notes'
import { layout } from '../../stores/layout.svelte.ts'
import { notes } from '../../stores/notes.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * Notes: a buffer that writes itself to disk, and says so.
 *
 * Two decisions carry this pane. The text is plain - no markdown rendering, no
 * syntax colouring - because a note beside a terminal is something you type into
 * and read back, and every editor feature would be one more thing between the
 * two. And the save is *shown*: the bar in the footer fills while the debounce
 * runs and flashes when the write lands, so "did that save?" is never a question
 * the user has to hold in their head.
 *
 * The text lives in main (notes.json), so it outlives this pane and two panes
 * can show the same note. What the pane keeps is which note it is showing.
 */

const { paneId, state: paneState }: WidgetProps = $props()

/** How long after the last keystroke the note is written. Mirrored by the bar. */
const SAVE_DEBOUNCE_MS = 500

const wrap = $derived(paneState?.wrap !== false)
const zoom = $derived(
  typeof paneState?.zoom === 'number' ? Math.min(2, Math.max(0, paneState.zoom)) : 1,
)

let draft = $state('')
/**
 * Which note the draft on screen belongs to, and at which revision.
 *
 * The id has to be part of this. Comparing revisions alone, a switch to another
 * note that happens to be at the same revision - which is exactly what happens
 * when the note being shown is deleted and the pane falls back to another - left
 * the gone note's text on screen, pointed at a note that did not contain it. The
 * next keystroke would then have written it there.
 */
let loaded = $state<{ id: string; rev: number } | null>(null)
let dirtyAt = $state<number | null>(null)
let savedAt = $state<number | null>(null)
/** Bumped on each write, to flash the bar. */
let flash = $state(0)
let elsewhere = $state(false)
let switcherOpen = $state(false)
let settingsOpen = $state(false)
let search = $state<string | null>(null)
let area = $state<HTMLTextAreaElement | null>(null)
/** The span last evaluated, swept once so it is clear what was read. */
let evaluated = $state<{ start: number; end: number; id: number } | null>(null)
let saveTimer: ReturnType<typeof setTimeout> | null = null

$effect(() => notes.use())

const list = $derived(notes.sorted)
/**
 * Which note is shown.
 *
 * Derived from the pane state rather than held here as well: the pane state is
 * the one copy, and a note deleted in another window falls back to the newest
 * without this pane having to notice.
 */
const savedId = $derived(typeof paneState?.noteId === 'string' ? paneState.noteId : null)
const current = $derived(notes.find(savedId) ?? list[0] ?? null)
const noteId = $derived(current?.id ?? null)

// Record the fallback, so the pane opens on the same note next time.
$effect(() => {
  if (!notes.ready) return
  const id = current?.id ?? null
  if (id === savedId) return
  layout.setPaneState(paneId, { ...paneState, ...(id === null ? {} : { noteId: id }) })
  if (id === null) draft = ''
})

/** Takes the note's text when it changes underneath: a switch, or another pane's edit. */
$effect(() => {
  const note = current
  if (note === null) {
    if (loaded !== null) {
      // The last note went. Nothing is being shown, so nothing may be written.
      loaded = null
      draft = ''
      dirtyAt = null
    }
    return
  }
  const sameNote = loaded?.id === note.id
  if (sameNote && note.rev === loaded?.rev) return
  if (sameNote && dirtyAt !== null && draft !== note.body) {
    // Someone else wrote while this pane had unsaved keystrokes. Their text is
    // what is on disk; say so rather than overwriting it silently.
    elsewhere = true
    return
  }
  // A different note - a switch, or the one being shown was deleted - always
  // replaces what is on screen, whatever was half typed for the old one.
  if (!sameNote) dirtyAt = null
  draft = note.body
  loaded = { id: note.id, rev: note.rev }
  elsewhere = false
})

function select(id: string): void {
  flushNow()
  loaded = null
  dirtyAt = null
  elsewhere = false
  switcherOpen = false
  layout.setPaneState(paneId, { ...paneState, noteId: id })
  sfx.play('folder')
}

function edited(): void {
  dirtyAt = Date.now()
  if (saveTimer !== null) clearTimeout(saveTimer)
  saveTimer = setTimeout(flushNow, SAVE_DEBOUNCE_MS)
}

function flushNow(): void {
  if (saveTimer !== null) clearTimeout(saveTimer)
  saveTimer = null
  const id = noteId
  if (id === null || dirtyAt === null) return
  const body = draft
  dirtyAt = null
  void notes.save(id, body).then((note) => {
    if (note === null) return
    loaded = { id: note.id, rev: note.rev }
    savedAt = note.updatedAt
    flash += 1
    elsewhere = false
  })
}

// A pane being moved is remounted, and a window being closed never comes back:
// either way the last keystrokes have to reach main before this goes.
$effect(() => () => flushNow())

async function newNote(): Promise<void> {
  flushNow()
  const note = await notes.create()
  if (note === null) {
    toasts.show({ title: 'no room for another note', tone: 'warn' })
    return
  }
  select(note.id)
  area?.focus()
}

/** Deletes a note - the one shown, or one picked out of the switcher. */
function removeNote(target?: Note): void {
  const note = target ?? current
  if (note === null || note === undefined) return
  const body = note.body
  void notes.remove(note.id)
  sfx.play('collapse')
  toasts.show({
    title: 'note deleted',
    body: noteTitle(body),
    tone: 'warn',
    actions: [
      {
        label: 'undo',
        primary: true,
        run: () => {
          void notes.create().then((made) => {
            if (made === null) return
            void notes.save(made.id, body)
            select(made.id)
          })
        },
      },
    ],
  })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && search !== null) {
    event.preventDefault()
    search = null
    area?.focus()
    return
  }
  if (!(event.ctrlKey || event.metaKey)) return

  if (event.key === 'f') {
    event.preventDefault()
    search = search ?? ''
    return
  }
  // Writing happens on its own, but asking for it is a habit worth answering.
  if (event.key === 's') {
    event.preventDefault()
    flushNow()
    return
  }
  if (event.key === 'n') {
    event.preventDefault()
    void newNote()
    return
  }
  // Ctrl+= evaluates the expression the caret is in, and writes the answer after
  // it - elecxzy's calc-eval-region, in a note.
  if (event.key === '=' || event.key === '+') {
    event.preventDefault()
    evaluateHere()
  }
}

/**
 * Evaluates what the caret is inside and appends the answer.
 *
 * Nothing happens when nothing there evaluates: a note is prose most of the
 * time, and a calculator that rewrites prose on a guess is worse than none.
 */
function evaluateHere(): void {
  const el = area
  if (el === null) return
  const caret = el.selectionStart
  const lineStart = draft.lastIndexOf('\n', caret - 1) + 1
  const lineEnd = draft.indexOf('\n', caret)
  const line = draft.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)

  const found = evaluateAt(line, caret - lineStart)
  if (found === null) {
    sfx.play('glitch')
    return
  }

  const insertAt = lineStart + found.end
  draft = `${draft.slice(0, insertAt)} = ${found.grouped}${draft.slice(insertAt)}`
  edited()
  sfx.play('panel')
  // Leave the caret after what was written, and show what was read.
  queueMicrotask(() => {
    const to = insertAt + found.grouped.length + 3
    el.setSelectionRange(to, to)
    el.focus()
  })
  evaluated = { start: lineStart + found.start, end: insertAt, id: (evaluated?.id ?? 0) + 1 }
}

const hits = $derived.by(() => {
  const needle = search
  if (needle === null || needle === '') return 0
  const haystack = draft.toLowerCase()
  const lower = needle.toLowerCase()
  let count = 0
  let at = haystack.indexOf(lower)
  while (at !== -1) {
    count += 1
    at = haystack.indexOf(lower, at + lower.length)
  }
  return count
})

function findNext(): void {
  const el = area
  const needle = search
  if (el === null || needle === null || needle === '') return
  const from = el.selectionEnd
  const haystack = draft.toLowerCase()
  const lower = needle.toLowerCase()
  const at =
    haystack.indexOf(lower, from) === -1 ? haystack.indexOf(lower) : haystack.indexOf(lower, from)
  if (at === -1) return
  el.setSelectionRange(at, at + needle.length)
  el.focus()
}

const lines = $derived(draft === '' ? 1 : draft.split('\n').length)
const chars = $derived(draft.length)

const clock = (at: number): string => new Date(at).toLocaleTimeString('en-GB', { hour12: false })

$effect(() => {
  const note = current
  paneMeta.set(paneId, {
    ...(note === null ? {} : { subtitle: noteTitle(note.body) }),
    ...(dirtyAt === null ? {} : { badge: '*' }),
  })
})
</script>

<div class="notes" data-testid="notes" data-dirty={dirtyAt !== null || undefined}>
  <SettingsButton
    open={settingsOpen}
    label="notes settings"
    testid="notes-settings-toggle"
    ontoggle={() => (settingsOpen = !settingsOpen)}
  />

  <div class="head">
    <button
      type="button"
      class="switch"
      onclick={() => (switcherOpen = !switcherOpen)}
      aria-expanded={switcherOpen}
      data-testid="notes-switcher-toggle"
    >
      <span class="chevron" aria-hidden="true">{switcherOpen ? '▾' : '▸'}</span>
      <span class="name">{current === null ? 'no notes' : noteTitle(current.body)}</span>
    </button>
    <button type="button" class="icon" title="New note" onclick={() => void newNote()} data-testid="notes-new">+</button>
  </div>

  {#if settingsOpen}
    <div class="settings" data-testid="notes-settings">
      <label>
        <input
          type="checkbox"
          checked={wrap}
          onchange={(e) => layout.setPaneState(paneId, { ...paneState, wrap: e.currentTarget.checked })}
          data-testid="notes-wrap"
        />
        <span>wrap lines</span>
      </label>
      <div class="zoom">
        <span>size</span>
        {#each [0, 1, 2] as step (step)}
          <button
            type="button"
            class:on={zoom === step}
            onclick={() => layout.setPaneState(paneId, { ...paneState, zoom: step })}
            data-testid="notes-zoom"
            data-step={step}
          >
            {step === 0 ? 'S' : step === 1 ? 'M' : 'L'}
          </button>
        {/each}
      </div>
      <button
        type="button"
        class="row-action"
        onclick={() => {
          if (noteId !== null) void window.elecdex.notes.export(noteId)
        }}
        data-testid="notes-export">save as .md…</button
      >
      <button type="button" class="row-action danger" onclick={() => removeNote()} data-testid="notes-delete">
        delete this note
      </button>
    </div>
  {/if}

  {#if switcherOpen}
    <div class="switcher" data-testid="notes-switcher">
      {#each list as note (note.id)}
        <div class="entry" class:on={note.id === noteId}>
          <button type="button" onclick={() => select(note.id)} data-testid="notes-switcher-item">
            <span class="entry-title">{noteTitle(note.body)}</span>
            <span class="entry-when">{clock(note.updatedAt)}</span>
          </button>
          <button
            type="button"
            class="entry-kill"
            aria-label="delete {noteTitle(note.body)}"
            title="Delete this note"
            onclick={() => removeNote(note)}
            data-testid="notes-switcher-delete">×</button
          >
        </div>
      {:else}
        <p class="empty">no notes yet</p>
      {/each}
    </div>
  {/if}

  {#if search !== null}
    <div class="find">
      <input
        bind:value={search}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            findNext()
          }
        }}
        placeholder="find"
        spellcheck="false"
        aria-label="Find in note"
        data-testid="notes-find"
      />
      <span class="hits">{hits === 0 ? 'none' : `${hits} · ↵ next`}</span>
      <button type="button" class="icon" aria-label="close find" onclick={() => (search = null)}>×</button>
    </div>
  {/if}

  {#key noteId}
    <div class="body crt-on">
      <textarea
        bind:this={area}
        bind:value={draft}
        oninput={edited}
        onkeydown={onKeydown}
        onblur={flushNow}
        class:nowrap={!wrap}
        style:--note-size={zoom === 0 ? 'var(--step--1)' : zoom === 2 ? 'var(--step-1)' : 'var(--step-0)'}
        spellcheck="false"
        placeholder={current === null ? 'press + for a new note' : ''}
        aria-label="Note"
        data-testid="notes-body"
        readonly={current === null}
      ></textarea>
      {#if evaluated !== null}
        {#key evaluated.id}
          <span class="evaluated" aria-hidden="true"></span>
        {/key}
      {/if}
    </div>
  {/key}

  <div class="foot" data-testid="notes-status">
    <span class="stat">ln {lines}</span>
    <span class="stat">ch {chars}</span>
    <span class="stat keys">ctrl+= sum · ctrl+f find · ctrl+n new</span>
    {#if elsewhere}
      <span class="stat warn" data-testid="notes-elsewhere">edited elsewhere</span>
    {/if}
    <span class="spacer"></span>
    <span class="write" class:pending={dirtyAt !== null} data-testid="notes-write">
      {#key dirtyAt ?? flash}
        <span class="fill" class:running={dirtyAt !== null} class:done={dirtyAt === null}></span>
      {/key}
    </span>
    <span class="stat">{dirtyAt !== null ? 'writing' : savedAt === null ? 'idle' : `wrote ${clock(savedAt)}`}</span>
  </div>
</div>

<style>
.notes {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
}

/*
 * A wide pane gets a line length that can still be read. Prose set across 200
 * characters is not a feature of the extra room; the text keeps a measure and
 * the switcher takes the width instead.
 */
@container (min-width: 34rem) {
  .body {
    width: min(100%, 52rem);
    margin-inline: auto;
  }

  .switcher {
    columns: 2;
    column-gap: 0;
  }

  .entry {
    break-inside: avoid;
  }
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  /* Clear of the floating settings button. */
  padding-right: 1.5rem;
}

.switch {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--accent-strong);
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  text-align: left;
  cursor: pointer;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.icon {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  line-height: 1;
  padding: 0 var(--space-1);
  cursor: pointer;
}

.icon:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.switcher,
.settings {
  position: absolute;
  inset: 2rem var(--space-1) auto;
  z-index: 3;
  max-height: 60%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
}

.settings {
  gap: var(--space-1);
  padding: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.settings label,
.zoom {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.zoom button,
.row-action {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  padding: 0 var(--space-1);
  cursor: pointer;
}

.zoom button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.row-action {
  text-align: left;
  padding: var(--space-1);
}

.row-action:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.row-action.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.entry {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--panel-rule);
}

.entry > button {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: var(--space-1) var(--space-2);
  text-align: left;
  cursor: pointer;
}

.entry:hover,
.entry.on {
  background: var(--accent-faint);
}

.entry.on > button {
  color: var(--accent-strong);
}

/* Deleting a note belongs where the notes are listed: hunting through a
   settings panel for it is why it looked as though one could not be deleted. */
.entry-kill {
  flex: none;
  border: 0;
  padding: 0 var(--space-2);
  background: transparent;
  color: transparent;
  font-family: var(--font-mono);
  cursor: pointer;
}

.entry:hover .entry-kill {
  color: var(--text-muted);
}

.entry-kill:hover {
  color: var(--danger);
}

.entry-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-when {
  color: var(--text-muted);
  font-size: var(--step--2);
  white-space: nowrap;
}

.find {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
}

.find input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  outline: none;
}

.hits {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.body {
  --crt-duration: 260ms;
  position: relative;
  flex: 1;
  min-height: 0;
}

/*
 * The sheet.
 *
 * Panes in this HUD have no fill of their own, which left the words sitting on
 * the same ground as the margin around them: there was no telling where typing
 * would go. A barely-there fill and a hairline give the writing area an edge
 * without turning the pane into a box - the grid still shows through it.
 */
textarea {
  width: 100%;
  height: 100%;
  resize: none;
  border: 1px solid var(--panel-rule);
  padding: var(--space-1) var(--space-2);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
  color: var(--text);
  caret-color: var(--accent-strong);
  font-family: var(--font-mono);
  font-size: var(--note-size, var(--step-0));
  line-height: 1.5;
  tab-size: 2;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

textarea.nowrap {
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

textarea::placeholder {
  color: var(--text-muted);
}

/* While it has the keyboard the sheet says so, as the line the caret is on. */
textarea:focus {
  border-color: var(--accent-dim);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

/* A light theme's ground is white: the same tint would be invisible, and a
   slightly darker sheet is what reads as paper there. */
:global(:root[data-mode='light']) textarea {
  background: color-mix(in srgb, var(--text) 4%, transparent);
}

:global(:root[data-mode='light']) textarea:focus {
  background: color-mix(in srgb, var(--text) 6%, transparent);
}

/* A single sweep over the text when something in it was just read and answered. */
.evaluated {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--accent-faint) 45%,
    var(--accent-dim) 50%,
    var(--accent-faint) 55%,
    transparent 100%
  );
  background-size: 100% 220%;
  animation: read-sweep calc(420ms * var(--motion-scale)) linear forwards;
  opacity: 0;
}

@keyframes read-sweep {
  from { background-position: 0 -120%; opacity: 1; }
  to { background-position: 0 220%; opacity: 0; }
}

.foot {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 2px var(--space-1);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat.warn {
  color: var(--warn);
}

/* The keys this pane answers to, where the eye already goes for the save. */
.keys {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.6;
}

@container (max-width: 26rem) {
  .keys {
    display: none;
  }
}

.spacer {
  flex: 1;
}

/* The write bar: it fills while the debounce runs, and flashes on the write.
   An automatic save that shows nothing is an automatic save nobody trusts. */
.write {
  position: relative;
  width: 3rem;
  height: 4px;
  border: 1px solid var(--panel-rule);
  overflow: hidden;
}

.fill {
  position: absolute;
  inset: 0;
  transform-origin: left;
  background: var(--accent);
}

.fill.running {
  animation: write-fill 500ms linear forwards;
}

.fill.done {
  animation: write-flash calc(320ms * var(--motion-scale)) ease-out forwards;
}

@keyframes write-fill {
  from { transform: scaleX(0); opacity: 0.6; }
  to { transform: scaleX(1); opacity: 1; }
}

@keyframes write-flash {
  0% { transform: scaleX(1); background: var(--accent-strong); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; }
}
</style>
