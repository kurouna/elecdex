<script lang="ts">
import {
  dropIndex,
  filterSnippets,
  SNIPPET_LIMITS,
  type SnippetAdded,
  type SnippetView,
  slotNumber,
} from '@shared/snippets'
import { tick, untrack } from 'svelte'
import { flip } from 'svelte/animate'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import SnippetCard from './SnippetCard.svelte'
import SnippetEditor from './SnippetEditor.svelte'
import SnippetRow from './SnippetRow.svelte'

/**
 * The clipboard pane's snippets (architecture.md §5.14): texts kept on purpose,
 * in main's snippets.json, put on the clipboard with COPY. They are moved by
 * dragging their slot number (or Alt+↑ ↓), written or changed in an editor that
 * takes the list's place, and deleted with a second press of ×. The page has
 * previews only; the editor asks main for the whole text of the one it opens.
 */
interface Props {
  snippets: readonly SnippetView[]
  /** The snippet the clipboard holds now. */
  current: string | null
  masked: boolean
  lines: number
  now: number
  query: string
  /** The pane's root, which the card keeps inside. */
  root: HTMLElement | null
  /** A snippet to point out (just kept, or asked for from the history), then forgotten. */
  flash: string | null
  onflashed: () => void
  /** Whether the editor is open, for the pane's header. */
  oneditor: (open: boolean) => void
}

const { snippets, current, masked, lines, now, query, root, flash, onflashed, oneditor }: Props =
  $props()

const shown = $derived(masked ? [...snippets] : filterSnippets(snippets, query))
const filtered = $derived(!masked && query.trim() !== '')

// ---------------------------------------------------------------------------
// Moving
// ---------------------------------------------------------------------------

interface Editing {
  /** null for a new one. */
  id: string | null
  name: string
  text: string
  rich: boolean
  problem: string | null
  /** A new editor for each opening, so its fields start again. */
  key: number
}

let editing = $state.raw<Editing | null>(null)
let opened = 0

/**
 * The order on screen while a row is dragged, and after it is dropped until main
 * answers with the list in its new order (so the row does not jump back first).
 */
let arranged = $state.raw<string[] | null>(null)
let drag = $state.raw<{ id: string; from: number; middles: number[]; to: number } | null>(null)
let listEl = $state<HTMLElement | null>(null)

const byId = $derived(new Map(snippets.map((snippet) => [snippet.id, snippet])))
const order = $derived(
  arranged === null
    ? shown
    : arranged.flatMap((id) => {
        const snippet = byId.get(id)
        return snippet === undefined ? [] : [snippet]
      }),
)

// Main's answer is the new order: what was held on screen can go.
$effect(() => {
  void snippets
  untrack(() => {
    if (drag === null) arranged = null
  })
})

const movable = $derived(!filtered && editing === null)

function placed(ids: readonly string[], from: number, to: number): string[] {
  const rest = ids.filter((_, i) => i !== from)
  return [...rest.slice(0, to), ids[from] as string, ...rest.slice(to)]
}

/** Where the pointer is in the list's own content, whatever it has scrolled. */
function contentY(clientY: number): number {
  if (listEl === null) return clientY
  return clientY - listEl.getBoundingClientRect().top + listEl.scrollTop
}

function grab(id: string, index: number, event: PointerEvent): void {
  if (event.button !== 0 || listEl === null) return
  event.preventDefault()
  resting.leave()
  const top = listEl.getBoundingClientRect().top - listEl.scrollTop
  const middles = [...listEl.querySelectorAll(':scope > li')].map((item) => {
    const box = item.getBoundingClientRect()
    return box.top - top + box.height / 2
  })
  drag = { id, from: index, middles, to: index }
  const ids = order.map((snippet) => snippet.id)
  // The rows are moved in the page as the pointer goes, so the listeners are the
  // window's: a row moved in the document would drop a pointer capture.
  const onmove = (move: PointerEvent): void => {
    if (drag === null) return
    const to = dropIndex(drag.middles, contentY(move.clientY), drag.from)
    if (to === drag.to) return
    drag = { ...drag, to }
    arranged = placed(ids, drag.from, to)
  }
  const end = (drop: boolean): void => {
    window.removeEventListener('pointermove', onmove)
    window.removeEventListener('pointerup', onup)
    window.removeEventListener('keydown', onescape, true)
    const done = drag
    drag = null
    if (!drop || done === null || done.to === done.from) {
      arranged = null
      return
    }
    sfx.play('folder')
    void window.elecdex.snippets.move(done.id, done.to).then((ok) => {
      if (!ok) arranged = null
    })
  }
  const onup = (): void => end(true)
  const onescape = (key: KeyboardEvent): void => {
    if (key.key !== 'Escape') return
    key.preventDefault()
    key.stopPropagation()
    end(false)
  }
  window.addEventListener('pointermove', onmove)
  window.addEventListener('pointerup', onup)
  window.addEventListener('keydown', onescape, true)
}

async function nudge(id: string, by: number): Promise<void> {
  const ids = order.map((snippet) => snippet.id)
  const from = ids.indexOf(id)
  const to = from + by
  if (from < 0 || to < 0 || to >= ids.length) return
  arranged = placed(ids, from, to)
  await tick()
  focusCopy(id)
  if (!(await window.elecdex.snippets.move(id, to))) arranged = null
}

// ---------------------------------------------------------------------------
// Copying and deleting
// ---------------------------------------------------------------------------

let copied = $state<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
let problem = $state<string | null>(null)

async function copy(id: string): Promise<void> {
  const result = await window.elecdex.snippets.copy(id)
  if (result !== 'ok') {
    problem = result === 'failed' ? 'the clipboard is busy: try again' : null
    return
  }
  problem = null
  sfx.play('folder')
  copied = id
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied = null
  }, 1500)
}

/** × asks once more: the first press arms it for a few seconds. */
let armed = $state<string | null>(null)
let armTimer: ReturnType<typeof setTimeout> | undefined

function removePressed(id: string): void {
  clearTimeout(armTimer)
  if (armed !== id) {
    armed = id
    armTimer = setTimeout(() => {
      armed = null
    }, 3000)
    return
  }
  armed = null
  sfx.play('collapse')
  void window.elecdex.snippets.remove(id)
}

$effect(() => () => {
  clearTimeout(copiedTimer)
  clearTimeout(armTimer)
})

// ---------------------------------------------------------------------------
// The editor
// ---------------------------------------------------------------------------

$effect(() => oneditor(editing !== null))

/** Opens the editor for a new snippet (the pane's NEW). */
export function create(): void {
  opened += 1
  editing = { id: null, name: '', text: '', rich: false, problem: null, key: opened }
}

async function edit(id: string): Promise<void> {
  if (masked) return
  const draft = await window.elecdex.snippets.read(id)
  if (draft === null) return
  opened += 1
  editing = { id, ...draft, problem: null, key: opened }
}

// Masked, a snippet's text is not shown - in the editor either. One being written stays.
$effect(() => {
  if (masked && untrack(() => editing?.id != null)) editing = null
})

const slotOf = (id: string): string => slotNumber(snippets.findIndex((s) => s.id === id))

function addedProblem(result: SnippetAdded): string | null {
  if (!('error' in result)) return result.added ? null : `already kept as ${slotOf(result.id)}`
  if (result.error === 'full') return `${SNIPPET_LIMITS.snippets} snippets kept: delete one first`
  return 'not saved: the text is empty or too long'
}

async function save(draft: { name: string; text: string }): Promise<void> {
  const open = editing
  if (open === null) return
  if (open.id === null) {
    const result = await window.elecdex.snippets.create(draft.name, draft.text)
    const said = addedProblem(result)
    if (said !== null) {
      editing = { ...open, ...draft, problem: said }
      return
    }
    editing = null
    if (!('error' in result)) void point(result.id)
    return
  }
  const change = {
    ...(draft.name !== open.name ? { name: draft.name } : {}),
    ...(draft.text !== open.text ? { text: draft.text } : {}),
  }
  if (Object.keys(change).length > 0 && !(await window.elecdex.snippets.update(open.id, change))) {
    editing = { ...open, ...draft, problem: 'not saved: another snippet holds this text' }
    return
  }
  const id = open.id
  editing = null
  await tick()
  focusCopy(id)
}

function cancel(): void {
  const id = editing?.id ?? null
  editing = null
  if (id !== null) void tick().then(() => focusCopy(id))
}

// ---------------------------------------------------------------------------
// Pointing one out
// ---------------------------------------------------------------------------

let fresh = $state.raw<ReadonlySet<string>>(new Set())

/** Lights a row and brings it into view: one just kept, or asked for from the history. */
async function point(id: string): Promise<void> {
  fresh = new Set([...fresh, id])
  await tick()
  listEl?.querySelector(`[data-id="${id}"]`)?.scrollIntoView({
    block: 'nearest',
    behavior: appearance.reducedMotion ? 'instant' : 'smooth',
  })
}

$effect(() => {
  if (flash === null) return
  const id = flash
  untrack(() => {
    onflashed()
    void point(id)
  })
})

function settled(id: string, event: AnimationEvent): void {
  if (event.animationName !== 'fx-fresh' || !fresh.has(id)) return
  fresh = new Set([...fresh].filter((key) => key !== id))
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

function focusCopy(id: string): void {
  listEl?.querySelector<HTMLElement>(`[data-id="${id}"] [data-testid="snip-copy"]`)?.focus()
}

/** An arrow on a row: Alt moves the snippet, alone it moves the focus; false with Ctrl. */
function arrowKey(event: KeyboardEvent, id: string, item: Element): boolean {
  const down = event.key === 'ArrowDown'
  if (event.altKey) {
    if (movable) void nudge(id, down ? 1 : -1)
    return true
  }
  if (event.ctrlKey || event.metaKey) return false
  const other = down ? item.nextElementSibling : item.previousElementSibling
  other?.querySelector<HTMLElement>('[data-testid="snip-copy"]')?.focus()
  return true
}

/** What a key does to the row it was pressed on; false for a key the list leaves alone. */
function rowKey(event: KeyboardEvent, id: string, item: Element): boolean {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') return arrowKey(event, id, item)
  if (event.key === 'F2') void edit(id)
  else if (event.key === 'Delete') removePressed(id)
  else return false
  return true
}

/** ↑ ↓ between rows, Alt+↑ ↓ moves the row, F2 edits it, Delete deletes it (pressed twice). */
function onListKey(event: KeyboardEvent): void {
  const row = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-testid="snip-row"]')
  const item = row?.closest('li')
  const id = row?.dataset.id
  if (item == null || id === undefined) return
  if (rowKey(event, id, item)) event.preventDefault()
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

let hover = $state.raw<{ id: string; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<string>(() => (hover = null))

function onhover(id: string, event: { row: DOMRect; x: number | null } | null): void {
  if (event === null || drag !== null) {
    resting.leave(id)
    return
  }
  const show = (): void => {
    if (root === null) return
    const box = root.getBoundingClientRect()
    hover = {
      id,
      anchor: anchorOf(box, event.row, event.x),
      bounds: { width: box.width, height: box.height },
    }
  }
  resting.enter(id, show, event.x === null)
}

const hovered = $derived(
  hover === null || masked || editing !== null ? null : (byId.get(hover.id) ?? null),
)

$effect(() => () => resting.dispose())
</script>

{#if editing !== null}
  {#key editing.key}
    <SnippetEditor
      heading={editing.id === null ? 'new' : slotOf(editing.id)}
      name={editing.name}
      text={editing.text}
      rich={editing.rich}
      problem={editing.problem}
      onsave={(draft) => void save(draft)}
      oncancel={cancel}
    />
  {/key}
{:else if snippets.length === 0}
  <div class="empty" data-testid="snip-empty">
    <b>NO SNIPPETS</b>
    <span>keep a copy from the history with SNIP, or write one with NEW</span>
  </div>
{:else if shown.length === 0}
  <div class="empty"><b>NOTHING MATCHES</b></div>
{:else}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <ul
    class="list"
    class:dragging={drag !== null}
    bind:this={listEl}
    onkeydown={onListKey}
    onscroll={() => resting.leave()}
    data-testid="snip-list"
  >
    {#each order as snippet, index (snippet.id)}
      <li
        class:fx-fresh={fresh.has(snippet.id)}
        animate:flip={{ duration: appearance.reducedMotion ? 0 : 200 }}
        onanimationend={(e) => settled(snippet.id, e)}
      >
        <SnippetRow
          {snippet}
          index={filtered ? snippets.indexOf(snippet) : index}
          current={current === snippet.id}
          {masked}
          {lines}
          copied={copied === snippet.id}
          armed={armed === snippet.id}
          dragging={drag?.id === snippet.id}
          {movable}
          oncopy={() => void copy(snippet.id)}
          onedit={() => void edit(snippet.id)}
          onremove={() => removePressed(snippet.id)}
          ondisarm={() => {
            if (armed === snippet.id) armed = null
          }}
          ongrab={(event) => grab(snippet.id, index, event)}
          onhover={(event) => onhover(snippet.id, event)}
        />
      </li>
    {/each}
  </ul>
{/if}

{#if problem !== null}
  <p class="problem" data-testid="snip-problem">{problem}</p>
{/if}

{#if hovered !== null && hover !== null}
  <SnippetCard
    snippet={hovered}
    current={current === hovered.id}
    {now}
    anchor={hover.anchor}
    bounds={hover.bounds}
  />
{/if}

<style>
.list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.list li + li {
  border-top: 1px solid var(--panel-rule);
}

.list.dragging {
  cursor: grabbing;
  user-select: none;
}

.empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
  text-align: center;
}

.empty b {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 400;
  letter-spacing: var(--tracking-wider);
}

.problem {
  margin: 0;
  color: var(--warn);
  font-size: var(--step--2);
}
</style>
