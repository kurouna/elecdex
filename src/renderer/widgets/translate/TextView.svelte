<script lang="ts">
import { joinBlocks, MAX_SOURCE_CHARS, splitBlocks } from '@shared/translate/blocks'
import type { TranslateBoard } from '@shared/translate/board'
import { CHRF_WARN } from '@shared/translate/chrf'
import { detectLanguage } from '@shared/translate/detect'
import { type Glossary, glossaryApplies, MAX_CONTEXT_CHARS } from '@shared/translate/glossary'
import { continuesDraft } from '@shared/translate/history'
import { isSourceLang, isTargetLang, takesForm } from '@shared/translate/languages'
import type { BlockView, RunView } from '@shared/translate/run'
import { tick, untrack } from 'svelte'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import BlockCard from './BlockCard.svelte'
import GlossaryDrawer from './GlossaryDrawer.svelte'
import LangPicker from './LangPicker.svelte'
import {
  draftOf,
  isActive,
  keepDraft,
  newDraftId,
  type RunFollower,
} from './run-follower.svelte.ts'
import {
  blockNumber,
  direction,
  langCode,
  langName,
  phaseLamp,
  sourceInfo,
  sourceOffset,
  swapped,
  targetInfo,
  targetMode,
  targetText,
  withRecent,
} from './translate-view.ts'
import ViewSwitch from './ViewSwitch.svelte'

/**
 * TEXT (docs/translate.md §3, §6.1): the source on the left, the translation on the right, and
 * the spine between them, where each block's number and link sit. Main writes the translation
 * block by block; this pane sends the text, follows the run and draws it.
 */
interface Props {
  paneId: string
  board: TranslateBoard
  paneState: Record<string, unknown> | undefined
  visible: boolean
  follower: RunFollower
  onsetup: () => void
  onengine: () => void
  onhistory: () => void
  /** Ctrl+Shift+Y's text, once for each call (`seq`). */
  summon?: { seq: number; text: string } | null
}

const {
  paneId,
  board,
  paneState,
  visible,
  follower,
  onsetup,
  onengine,
  onhistory,
  summon = null,
}: Props = $props()
const api = window.elecdex.translate

// ---------------------------------------------------------------------------
// Languages and form: the pane's own choices (its state), never the text
// ---------------------------------------------------------------------------

const srcLang = $derived(isSourceLang(paneState?.srcLang) ? paneState.srcLang : 'auto')
const tgtLang = $derived(isTargetLang(paneState?.tgtLang) ? paneState.tgtLang : 'ja')
const form = $derived(paneState?.form === 'plain' ? 'plain' : 'polite')
const recentOf = (key: string): string[] => {
  const value = paneState?.[key]
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}
let picking = $state<'src' | 'tgt' | null>(null)

function pick(side: 'src' | 'tgt', code: string): void {
  picking = null
  const key = side === 'src' ? 'recentSrc' : 'recentTgt'
  widgetState.patch(paneId, {
    [side === 'src' ? 'srcLang' : 'tgtLang']: code,
    [key]: withRecent(recentOf(key), code),
  })
}

// ---------------------------------------------------------------------------
// The source: kept by pane for as long as the page lives (a moved pane remounts)
// ---------------------------------------------------------------------------

// A pane's id is its mount's for good (a moved pane is mounted again): the draft is taken once.
const draft = draftOf(untrack(() => paneId))
let text = $state(draft.text)
let draftId = $state(draft.draftId)
let context = $state(draft.context)
let editing = $state(false)
let textarea = $state<HTMLTextAreaElement | null>(null)
let problem = $state<string | null>(null)

$effect(() => keepDraft(paneId, { text, draftId, context }))

/**
 * One history entry a draft (§7): half or more of the text deleted or replaced, or emptied,
 * starts a new one; typing on, a small cut or an insertion goes on.
 */
let lastText = untrack(() => text)
function onSourceInput(): void {
  if (!continuesDraft(lastText, text)) draftId = newDraftId()
  lastText = text
  liveRun()
}

// ---------------------------------------------------------------------------
// The drawer: the glossary or the context (§6.3); which one is open is the pane's
// ---------------------------------------------------------------------------

const drawer = $derived(
  paneState?.drawer === 'glossary' || paneState?.drawer === 'context' ? paneState.drawer : null,
)
const glossaryId = $derived(typeof paneState?.glossaryId === 'string' ? paneState.glossaryId : null)
let glossaries = $state.raw<Glossary[]>([])
const chosen = $derived(glossaries.find((g) => g.id === glossaryId) ?? null)

// Main's glossaries, asked for while one is chosen or the drawer is open, and again after a change.
$effect(() => {
  void board.library
  if (glossaryId === null && drawer !== 'glossary') return
  let live = true
  void api.glossaries().then((list) => {
    if (live) glossaries = list
  })
  return () => {
    live = false
  }
})

function toggleDrawer(which: 'glossary' | 'context'): void {
  widgetState.patch(paneId, { drawer: drawer === which ? undefined : which })
}

/** On AUTO, what the letters make certain (§6.5): shown, and what a swap and ROUND TRIP use. */
const detected = $derived(srcLang === 'auto' ? detectLanguage(text) : null)

const run = $derived(follower.run)
const busy = $derived(isActive(run))
const sourceOf = (r: RunView): string =>
  joinBlocks(
    r.blocks.map((b) => ({ lead: b.lead, text: b.source })),
    r.tail,
  )

// A page reloaded loses its drafts: the run main kept brings its source back - once, from the
// first run this mount sees, never again (Clear and an emptied text would come back otherwise).
let restored = false
$effect(() => {
  const r = run
  if (restored || r === null) return
  restored = true
  untrack(() => {
    if (text === '' && r.blocks.length > 0) {
      text = sourceOf(r)
      lastText = text
      draftId = r.draftId
      if (context === '') context = r.context
    }
  })
})

const showBlocks = $derived(
  !editing &&
    run !== null &&
    run.blocks.length > 0 &&
    sourceOf(run) === text.replace(/\r\n?/g, '\n'),
)
/** The source as blocks: counted here, and laid out in the mirror the spine measures while it is edited. */
const mirrorBlocks = $derived(splitBlocks(text))
const blockCount = $derived(mirrorBlocks.blocks.length)
const tooLong = $derived(text.length > MAX_SOURCE_CHARS)
const mode = $derived(targetMode(board, run))
const canRun = $derived(text.trim() !== '' && !tooLong && board.engine.phase !== 'absent')

async function translate(): Promise<void> {
  if (liveTimer !== null) clearTimeout(liveTimer)
  liveTimer = null
  editing = false
  // Focus stays in the pane (the source turns into its blocks), so Ctrl+. reaches it.
  root?.focus()
  await ask('translate')
}

/** TRANSLATE writes every block again; LIVE only what changed, while the text is still typed. */
async function ask(mode: 'translate' | 'live'): Promise<void> {
  if (!canRun) return
  problem = null
  const answer = await api.run({
    paneId,
    draftId,
    text,
    srcLang,
    tgtLang,
    ...(takesForm(tgtLang) ? { form } : {}),
    ...(glossaryId ? { glossaryId } : {}),
    ...(context.trim() ? { context } : {}),
    mode,
  })
  if ('problem' in answer) problem = answer.problem
}

function stop(): void {
  api.stop(paneId)
}

/** What the editor opens with: the selection in the source, and a block kept where it was seen. */
interface EditAt {
  start: number
  end: number
  backward: boolean
  /** The block that stays put on screen, and where its first glyph was drawn (client y). */
  keep: { index: number; screenY: number } | null
}

/**
 * The source's blocks turn into the editor (§3). The caret goes where the click put it, a
 * selection made in the blocks is kept, and the textarea is scrolled so the block clicked stays
 * where it was on screen: never the caret at the end and the text scrolled to it (user's report
 * 2026-11-06). Opened from the keyboard, the caret goes to the start of the first block in view.
 */
async function edit(at: EditAt | null = null): Promise<void> {
  editing = true
  await tick()
  const area = textarea
  if (!area) return
  area.focus({ preventScroll: true })
  if (!at) return
  area.setSelectionRange(at.start, at.end, at.backward ? 'backward' : 'forward')
  const span = at.keep && mirror?.querySelector<HTMLElement>(`.mseg[data-i="${at.keep.index}"]`)
  if (at.keep && mirror && span) {
    // The mirror lays the text out as the textarea wraps it: the block's first glyph in the
    // textarea, scrolled to where that glyph was on screen, so the text does not move. Glyph
    // against glyph on both sides, never a line box against a glyph (half the leading apart).
    mirror.style.width = `${area.clientWidth}px`
    const glyph = (span.getClientRects()[0]?.top ?? 0) - mirror.getBoundingClientRect().top
    const y = at.keep.screenY - area.getBoundingClientRect().top
    area.scrollTop = Math.max(0, glyph - y)
  }
}

/** A point of the page's selection, as an offset in the source; null outside the blocks. */
function sourcePoint(node: Node | null, offset: number): number | null {
  const element = node instanceof Element ? node : (node?.parentElement ?? null)
  const seg = element?.closest<HTMLElement>('.blocks .seg')
  if (!seg || !run) return null
  const within = node === seg ? (offset === 0 ? 0 : (seg.textContent ?? '').length) : offset
  return sourceOffset(run.blocks, Number(seg.dataset.i), within)
}

/** A block's place on screen: where its first glyph is drawn. */
function keepOf(seg: HTMLElement | null): EditAt['keep'] {
  if (!seg) return null
  const first = seg.firstChild
  let screenY = seg.getBoundingClientRect().top
  if (first instanceof Text && first.length > 0) {
    const range = document.createRange()
    range.setStart(first, 0)
    range.setEnd(first, 1)
    // Ranges without a layout to measure (a test's DOM) keep the block's own top.
    screenY = range.getClientRects?.()[0]?.top ?? screenY
  }
  return { index: Number(seg.dataset.i), screenY }
}

/** The block a node of the selection is in, or null. */
const segOf = (node: Node | null): HTMLElement | null =>
  (node instanceof Element ? node : (node?.parentElement ?? null))?.closest<HTMLElement>(
    '.blocks .seg',
  ) ?? null

/** A click in the blocks: the selection it left there (a caret, or what was dragged over). */
function editFromClick(event: MouseEvent): void {
  const selection = window.getSelection()
  const anchor = selection ? sourcePoint(selection.anchorNode, selection.anchorOffset) : null
  const focus = selection ? sourcePoint(selection.focusNode, selection.focusOffset) : null
  // The block to keep in place: where the selection ends (a drag across blocks, or a click in the
  // gap between two, is sent to the blocks' box, not to a block), else the block clicked.
  const seg =
    segOf(selection?.focusNode ?? null) ??
    segOf(selection?.anchorNode ?? null) ??
    (event.target as Element | null)?.closest<HTMLElement>('.blocks .seg') ??
    null
  if (anchor === null) {
    // Below the last block, or on no text: the end of the source, its last block kept in place.
    const last = srcText?.querySelector<HTMLElement>('.blocks .seg:last-of-type') ?? null
    void edit({ start: text.length, end: text.length, backward: false, keep: keepOf(seg ?? last) })
    return
  }
  const other = focus ?? anchor
  void edit({
    start: Math.min(anchor, other),
    end: Math.max(anchor, other),
    backward: other < anchor,
    keep: keepOf(seg),
  })
}

/** Enter on the blocks: the caret at the start of the first block in view, kept where it is. */
function editFromKey(): void {
  const box = srcText
  const segs = [...(box?.querySelectorAll<HTMLElement>('.blocks .seg') ?? [])]
  const top = box?.getBoundingClientRect().top ?? 0
  // The first block wholly in view, so its start (the caret) is on screen; else the first in part.
  const seen =
    segs.find((seg) => seg.getBoundingClientRect().top >= top) ??
    segs.find((seg) => seg.getBoundingClientRect().bottom > top) ??
    segs[0] ??
    null
  const index = seen ? Number(seen.dataset.i) : 0
  const start = run ? sourceOffset(run.blocks, index, 0) : 0
  void edit({ start, end: start, backward: false, keep: keepOf(seen) })
}

function clear(): void {
  if (liveTimer !== null) clearTimeout(liveTimer)
  liveTimer = null
  // The translation goes with its source (§3): main puts the run away, and so does the page.
  api.clear(paneId)
  text = ''
  lastText = ''
  draftId = newDraftId()
  void edit()
}

function swap(): void {
  const next = swapped(detected ?? srcLang, tgtLang)
  if (next === null) return
  widgetState.patch(paneId, { srcLang: next.src, tgtLang: next.tgt })
  if (run !== null && run.state === 'done' && run.blocks.length > 0) {
    text = targetText(run)
    lastText = text
    draftId = newDraftId()
  }
}

function copy(): void {
  if (run !== null) void navigator.clipboard?.writeText(targetText(run)).catch(() => {})
}

/** Enter on the source's blocks edits them, as a click does; focus alone does not. */
function onBlocksKey(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.ctrlKey && !event.isComposing) {
    event.preventDefault()
    editFromKey()
  }
}

// Ctrl+Shift+Y: the clipboard's text becomes the source of a new draft and is translated, or
// the source is opened empty for typing.
$effect(() => {
  const call = summon
  if (call === null || call.seq === follower.summonHandled) return
  follower.summonHandled = call.seq
  untrack(() => {
    // The call's text, never a held run's source arriving after it.
    restored = true
    text = call.text
    lastText = text
    draftId = newDraftId()
    if (call.text.trim() === '') void edit()
    else void translate()
  })
})

function onSourceKey(event: KeyboardEvent): void {
  if (event.key === 'Enter' && event.ctrlKey && !event.isComposing) {
    event.preventDefault()
    void translate()
  }
}

// Ctrl+. stops (Esc closes a popup, which PopupPane takes first: §3).
function onKey(event: KeyboardEvent): void {
  if (event.key === '.' && event.ctrlKey && busy) {
    event.preventDefault()
    stop()
  }
}

// ---------------------------------------------------------------------------
// The caret: the shared pulse, only while a block is written and seen
// ---------------------------------------------------------------------------

$effect(() => (busy && visible ? pulse.use() : undefined))

// ---------------------------------------------------------------------------
// LIVE (§6.1): 0.6 s after the typing stops, only the blocks that changed are written again
// ---------------------------------------------------------------------------

const LIVE_MS = 600
const live = $derived(appearance.settings.translate.live)
let liveTimer: ReturnType<typeof setTimeout> | null = null

function liveRun(): void {
  if (liveTimer !== null) clearTimeout(liveTimer)
  liveTimer = null
  if (!live || !canRun) return
  liveTimer = setTimeout(() => {
    liveTimer = null
    void ask('live')
  }, LIVE_MS)
}

$effect(() => () => {
  if (liveTimer !== null) clearTimeout(liveTimer)
})

// A change of language, form or glossary asks again too, once there is something written - not
// the first look at them when the pane mounts (a moved pane would ask for nothing new).
let settled = false
$effect(() => {
  void [srcLang, tgtLang, form, glossaryId]
  if (!settled) {
    settled = true
    return
  }
  if (untrack(() => run !== null && run.mode === 'live' && text.trim() !== '')) untrack(liveRun)
})

// ---------------------------------------------------------------------------
// ROUND TRIP (§6.4): every written block back into the source language, compared
// ---------------------------------------------------------------------------

const roundTrip = $derived(paneState?.roundTrip === true)
/** The language a round trip goes back into: the source's, or on AUTO what was certain. */
const tripLang = $derived(srcLang !== 'auto' ? srcLang : (run?.detected ?? detected))
let tripAsked = ''

$effect(() => {
  const r = run
  // Nothing new starts unseen (§8.5): a run finished behind a tab is compared once shown.
  if (!visible || !roundTrip || r === null || tripLang === null) return
  const wanting = r.blocks.some((b) => b.state === 'done' && b.trip === null)
  // Once a run is done, and once for each version (a block mended or written again asks anew).
  const key = `${r.version}:${r.blocks.map((b) => (b.trip === null ? b.index : '')).join(',')}`
  if (r.state !== 'done' || !wanting || key === tripAsked) return
  tripAsked = key
  void api.roundTrip(paneId, tripLang)
})

// ---------------------------------------------------------------------------
// A block's own buttons: RETRY, EDIT, COPY (§3)
// ---------------------------------------------------------------------------

let editingBlock = $state<number | null>(null)
let blockDraft = $state('')
/** The run the block was opened in: a newer one by the time it is saved is not edited. */
let editingVersion = 0

function editBlock(block: BlockView): void {
  editingBlock = block.index
  editingVersion = run?.version ?? 0
  blockDraft = block.text
}

function saveBlock(): void {
  const index = editingBlock
  editingBlock = null
  if (index === null || run === null || run.version !== editingVersion) return
  if (run.blocks[index]?.text !== blockDraft) void api.editBlock(paneId, index, blockDraft)
}

function onBlockEditKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    editingBlock = null
  } else if (event.key === 'Enter' && event.ctrlKey && !event.isComposing) {
    event.preventDefault()
    event.stopPropagation()
    saveBlock()
  }
}

function focusOnMount(node: HTMLTextAreaElement): void {
  queueMicrotask(() => node.focus())
}

// ---------------------------------------------------------------------------
// The spine: links and numbers, laid out by offsets when anything moves
// ---------------------------------------------------------------------------

let root = $state<HTMLDivElement | null>(null)
let duo = $state<HTMLDivElement | null>(null)
let gutter = $state<HTMLDivElement | null>(null)
let srcText = $state<HTMLDivElement | null>(null)
let editWrap = $state<HTMLDivElement | null>(null)
let mirror = $state<HTMLDivElement | null>(null)
let dstText = $state<HTMLDivElement | null>(null)
let narrow = $state(false)
let hot = $state<number | null>(null)

interface Link {
  index: number
  path: string
  x: number
  y: number
  state: BlockView['state']
}
let links = $state.raw<Link[]>([])
let size = $state.raw({ width: 0, height: 0 })

$effect(() => {
  const el = root
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0
    narrow = width > 0 && width < 600
    schedule()
  })
  observer.observe(el)
  return () => observer.disconnect()
})

let pending: ReturnType<typeof setTimeout> | null = null
function schedule(): void {
  if (pending !== null) return
  // After the DOM has the change: laid out by offsets, never client rects, so a view powering
  // on (scaled to a line for a moment) does not fold every link into it.
  pending = setTimeout(() => {
    pending = null
    layoutLinks()
  }, 0)
}

$effect(() => () => {
  if (pending !== null) clearTimeout(pending)
})

$effect(() => {
  // What moves the blocks.
  void run
  void showBlocks
  void narrow
  void mode
  void text
  schedule()
})

function layoutLinks(): void {
  const els = { duo, gutter, srcText, dstText }
  if (narrow || mode !== 'blocks' || !els.duo || !els.gutter || !els.srcText || !els.dstText) {
    if (links.length > 0) links = []
    return
  }
  const source = sourceY(els.srcText)
  const g = els.gutter
  const x0 = g.offsetLeft
  const x3 = g.offsetLeft + g.offsetWidth
  const x1 = x0 + 5
  const x2 = x3 - 5
  const lead = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const y = (seg: HTMLElement, box: HTMLElement): number => {
    const con = box.parentElement as HTMLElement
    const top = con.offsetTop + box.offsetTop
    return Math.max(
      top + 4,
      Math.min(top + box.clientHeight - 4, con.offsetTop + seg.offsetTop - box.scrollTop + lead),
    )
  }
  const next: Link[] = []
  for (const block of run?.blocks ?? []) {
    // Joined as each is translated: one still waiting, or never written, has no link yet.
    if (block.state === 'queued' || block.state === 'none') continue
    const t = els.dstText.querySelector<HTMLElement>(`.seg[data-i="${block.index}"]`)
    const ys = source(block.index)
    if (!t || ys === null) continue
    const yt = y(t, els.dstText)
    next.push({
      index: block.index,
      path: `M${x0} ${ys} H${x1} L${x2} ${yt} H${x3}`,
      x: (x1 + x2) / 2,
      y: (ys + yt) / 2,
      state: block.state,
    })
  }
  const width = els.duo.clientWidth
  const height = els.duo.clientHeight
  // Assigned only when something moved: this runs with every patch, ten times a second.
  if (width !== size.width || height !== size.height) size = { width, height }
  if (!sameLinks(links, next)) links = next
}

/**
 * Where a source block sits: its paragraph when the source shows as blocks; while it is edited,
 * its place in the mirror, the text laid out as the textarea wraps it, less the textarea's scroll.
 */
function sourceY(box: HTMLElement): (index: number) => number | null {
  const con = box.parentElement as HTMLElement
  const top = con.offsetTop + box.offsetTop
  const lead = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const clamp = (v: number) => Math.max(top + 4, Math.min(top + box.clientHeight - 4, v))
  const area = textarea
  if (!showBlocks && area && mirror && editWrap) {
    // The textarea's own width: its scroll bar takes some of it from the text.
    mirror.style.width = `${area.clientWidth}px`
    const base =
      con.offsetTop + editWrap.offsetTop + mirror.offsetTop - area.scrollTop - box.scrollTop + lead
    return (index) => {
      const span = mirror?.querySelector<HTMLElement>(`.mseg[data-i="${index}"]`)
      return span ? clamp(base + span.offsetTop) : null
    }
  }
  return (index) => {
    const seg = box.querySelector<HTMLElement>(`.seg[data-i="${index}"]`)
    return seg ? clamp(con.offsetTop + seg.offsetTop - box.scrollTop + lead) : null
  }
}

function sameLinks(a: readonly Link[], b: readonly Link[]): boolean {
  return (
    a.length === b.length &&
    a.every((link, i) => {
      const other = b[i]
      return other !== undefined && link.path === other.path && link.state === other.state
    })
  )
}

// ---------------------------------------------------------------------------
// A number's card
// ---------------------------------------------------------------------------

let card = $state.raw<{ index: number; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<number>(() => (card = null))
$effect(() => () => resting.dispose())

function onNode(index: number, event: PointerEvent | FocusEvent | null): void {
  if (event === null) {
    resting.leave(index)
    hot = null
    return
  }
  hot = index
  const target = event.currentTarget as HTMLElement
  const x = event instanceof PointerEvent ? event.clientX : null
  resting.enter(
    index,
    () => {
      if (root === null) return
      const box = root.getBoundingClientRect()
      card = {
        index,
        anchor: anchorOf(box, target.getBoundingClientRect(), x),
        bounds: { width: box.width, height: box.height },
      }
    },
    x === null,
  )
}

const cardBlock = $derived(card === null ? null : (run?.blocks[card.index] ?? null))
const lamp = $derived(phaseLamp(board.engine.phase))
const bootLines = $derived(board.engine.bootLines.slice(-12))
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="text-view" class:narrow bind:this={root} onkeydown={onKey} tabindex="-1" data-testid="translate-text">
  <div class="toolbar">
    <ViewSwitch view="text" onchange={(next) => next === 'history' && onhistory()} />
    {#snippet language(side: 'src' | 'tgt', code: string)}
      <span class="anchor">
        <button
          type="button"
          class="lang"
          aria-haspopup="dialog"
          aria-expanded={picking === side}
          data-testid="translate-{side}-lang"
          onclick={() => (picking = picking === side ? null : side)}
        ><b>{langCode(code)}</b><small>{langName(code)}</small><i>▾</i></button>
        {#if picking === side}
          <LangPicker
            {side}
            current={code}
            recent={recentOf(side === 'src' ? 'recentSrc' : 'recentTgt')}
            onpick={(next) => pick(side, next)}
            onclose={() => (picking = null)}
          />
        {/if}
      </span>
    {/snippet}
    <div class="pair">
      {@render language('src', srcLang)}
      <button
        type="button"
        class="swap"
        aria-label="Swap the languages"
        disabled={swapped(detected ?? srcLang, tgtLang) === null}
        data-testid="translate-swap"
        onclick={swap}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" /></svg>
      </button>
      {@render language('tgt', tgtLang)}
    </div>
    <div class="form" class:off={!takesForm(tgtLang)} data-testid="translate-form">
      <span>Form</span>
      <button type="button" aria-pressed={form === 'plain'} onclick={() => widgetState.patch(paneId, { form: 'plain' })}>Plain<small>だ・である</small></button>
      <button type="button" aria-pressed={form === 'polite'} onclick={() => widgetState.patch(paneId, { form: 'polite' })}>Polite<small>です・ます</small></button>
    </div>
    <span class="spacer"></span>
    <div class="opts">
      <button type="button" class="tog" aria-pressed={drawer === 'glossary'} data-testid="translate-glossary-toggle" onclick={() => toggleDrawer('glossary')}>
        Glossary{#if chosen}<em class:off={!glossaryApplies(chosen.targetLang, tgtLang)}>{chosen.terms.length}</em>{/if}
      </button>
      <button type="button" class="tog" aria-pressed={drawer === 'context'} data-testid="translate-context-toggle" onclick={() => toggleDrawer('context')}>
        Context{#if context.trim() !== ''}<i class="dot"></i>{/if}
      </button>
      <button type="button" class="tog" aria-pressed={roundTrip} data-testid="translate-trip-toggle" onclick={() => widgetState.patch(paneId, { roundTrip: roundTrip ? undefined : true })}>Round trip</button>
      <button type="button" class="tog" aria-pressed={live} data-testid="translate-live-toggle" onclick={() => void appearance.patch({ translate: { live: !live } })}><i class="lamp-live"></i>Live</button>
    </div>
  </div>

  {#if drawer !== null}
    <div class="drawer crt-on" data-testid="translate-drawer">
      {#if drawer === 'glossary'}
        <GlossaryDrawer
          {glossaries}
          selected={glossaryId}
          {tgtLang}
          {text}
          onselect={(id) => widgetState.patch(paneId, { glossaryId: id ?? undefined })}
        />
      {:else}
        <section class="context">
          <div class="dhead"><b>Context</b><span>sent with every block, never translated · {context.length.toLocaleString('en-US')} / {MAX_CONTEXT_CHARS.toLocaleString('en-US')}</span></div>
          <textarea
            class="ctxbox"
            bind:value={context}
            maxlength={MAX_CONTEXT_CHARS}
            aria-label="Context"
            spellcheck="false"
            data-testid="translate-context"
            oninput={liveRun}
            placeholder="What the text is and who reads it: release notes of a system monitor, for its users. Keep the product's terms."
          ></textarea>
        </section>
      {/if}
    </div>
  {/if}

  <div class="duo" bind:this={duo}>
    <div class="side src">
      <div class="hud-label"><span>Source</span><span data-testid="translate-source-info">{sourceInfo(srcLang, text.length, blockCount, detected)}</span></div>
      <div class="console frame">
        <div class="text" bind:this={srcText} onscroll={schedule}>
          {#if showBlocks && run !== null}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div class="blocks" role="textbox" tabindex="0" aria-label="Source text" onclick={editFromClick} onkeydown={onBlocksKey} data-testid="translate-source-blocks">
              {#each run.blocks as block (block.index)}
                <p
                  class="seg"
                  class:hot={hot === block.index}
                  data-i={block.index}
                  onpointerenter={() => (hot = block.index)}
                  onpointerleave={() => (hot = null)}
                >{block.source}</p>
              {/each}
            </div>
          {:else}
            <div class="edit-wrap" bind:this={editWrap}>
              <!-- The text as the textarea wraps it, unseen: where each block sits, for the spine while
                   the source is edited. One line: it is pre-wrap, and the template's would show. -->
              <div class="mirror" aria-hidden="true" bind:this={mirror}>{#each mirrorBlocks.blocks as block, i (i)}{block.lead}<span class="mseg" data-i={i}>{block.text}</span>{/each}{mirrorBlocks.tail}</div>
              <textarea
                bind:this={textarea}
                bind:value={text}
                oninput={onSourceInput}
                onscroll={schedule}
                spellcheck="false"
                aria-label="Source text"
                placeholder="Type or paste text. Ctrl+Enter translates it."
                data-testid="translate-source"
                onfocus={() => (editing = true)}
                onblur={() => (editing = false)}
                onkeydown={onSourceKey}
              ></textarea>
            </div>
          {/if}
        </div>
        <div class="actions">
          <button type="button" class="btn" disabled={text === ''} onclick={clear}>Clear</button>
          <span class="spacer"></span>
          <span class="count" class:over={tooLong}>{text.length.toLocaleString('en-US')} / {MAX_SOURCE_CHARS.toLocaleString('en-US')}</span>
          <kbd>{busy ? 'Ctrl+.' : 'Ctrl+Enter'}</kbd>
          {#if busy}
            <button type="button" class="btn warn" data-testid="translate-stop" onclick={stop}>Stop</button>
          {:else}
            <button type="button" class="btn lit" disabled={!canRun} data-testid="translate-go" onclick={() => void translate()}>Translate</button>
          {/if}
        </div>
      </div>
    </div>

    <div class="gutter" bind:this={gutter}>
      {#if links.length === 0}<span class="dir">{direction(srcLang, tgtLang)}</span>{/if}
    </div>

    <div class="side dst">
      <div class="hud-label"><span>Target</span><span>{targetInfo(run)}</span></div>
      <div class="console frame" class:tx={busy}>
        <div class="text" bind:this={dstText} onscroll={schedule} data-testid="translate-target">
          {#if mode === 'nomodel'}
            <div class="standby" data-testid="translate-standby">
              <span class="state"><i class="lamp {lamp.kind}"></i>{lamp.word}</span>
              <span class="big">PLaMo 3 Translate</span>
              <span class="host">Runs on this PC through llama.cpp. Setting up fetches the engine and a model once; after that nothing you translate leaves this machine.</span>
              <button type="button" class="command" data-testid="translate-setup-open" onclick={onsetup}>&gt; set up translation</button>
            </div>
          {:else if mode === 'empty'}
            <div class="standby" data-testid="translate-standby">
              <span class="state"><i class="lamp {lamp.kind}"></i>{lamp.word}</span>
              <span class="big">Awaiting input</span>
              <span class="host">{board.selectedModel}{board.engine.build ? ` · ${board.engine.build}` : ''}{board.engine.backend ? ` · ${board.engine.backend}` : ''}</span>
              {#if board.engine.phase === 'fault'}<span class="problem">{board.engine.error}</span>{/if}
              <span class="hint">Type or paste on the left. <kbd>Ctrl+Enter</kbd> translates, block by block; <kbd>Ctrl+.</kbd> stops.</span>
            </div>
          {:else if mode === 'boot'}
            <div class="boot" data-testid="translate-boot">
              <div class="boot-head">Engine power on</div>
              {#each bootLines as line, i (i)}<div class="ln">{line}</div>{/each}
            </div>
          {:else if mode === 'fault'}
            <div class="fault" data-testid="translate-fault">
              <h3><i class="lamp bad"></i>Engine fault</h3>
              <p>{run?.reason ?? board.engine.error}</p>
              {#if board.engine.error}<pre>{board.engine.error}</pre>{/if}
              <div class="row">
                <button type="button" class="btn lit" onclick={() => void api.engineRestart()}>Restart engine</button>
                <button type="button" class="btn" onclick={onengine}>Engine settings</button>
              </div>
            </div>
          {:else if run !== null}
            {#each run.blocks as block (block.index)}
              <div
                class="seg"
                class:hot={hot === block.index}
                data-i={block.index}
                data-st={block.state}
                data-pulse={pulse.phase}
                data-testid="translate-block"
                role="presentation"
                onpointerenter={() => (hot = block.index)}
                onpointerleave={() => (hot = null)}
                data-edited={block.edited}
              ><!-- One line: the block keeps its own line breaks (pre-wrap), and the template's would show. -->{#if editingBlock === block.index}<textarea class="block-edit" bind:value={blockDraft} use:focusOnMount aria-label="Edit block {blockNumber(block.index)}" data-testid="translate-block-edit" onkeydown={onBlockEditKey} onblur={saveBlock}></textarea>{:else}{#if block.state === 'done'}<i class="fresh" aria-hidden="true"></i>{/if}{block.text}{#if block.state === 'running'}<span class="caret"></span>{/if}{#if block.state === 'queued' && block.text === ''}<span class="qd">waiting</span>{/if}{#if block.state === 'none' && block.text === ''}<span class="qd">not translated</span>{/if}{#if block.state === 'stopped'}<span class="tag warn">stopped</span>{/if}{#if block.edited}<span class="tag info">edited</span>{/if}{#if block.note}<span class="tag" class:warn={block.state !== 'failed'} class:bad={block.state === 'failed'}>{block.note}</span>{/if}{#if !busy && (block.state === 'done' || block.state === 'failed' || block.state === 'stopped' || block.state === 'none')}<span class="acts"><button type="button" data-testid="translate-block-retry" onclick={() => void api.retryBlock(paneId, block.index)}>Retry</button><button type="button" data-testid="translate-block-edit-open" onclick={() => editBlock(block)}>Edit</button><button type="button" onclick={() => void navigator.clipboard?.writeText(block.text).catch(() => {})}>Copy</button></span>{/if}{#if block.trip}<span class="trip" data-testid="translate-trip"><span class="back"><span class="tl">{langCode(block.trip.lang)}</span>{block.trip.text}{#if block.trip.state === 'running'}<span class="caret"></span>{/if}{#if block.trip.state === 'failed'}<span class="tag bad">round trip failed</span>{/if}</span>{#if block.trip.score !== null}<span class="match" class:low={block.trip.score < CHRF_WARN} data-testid="translate-trip-score"><span class="bar"><i style:width="{block.trip.score}%"></i></span>{block.trip.score}</span>{/if}</span>{/if}{/if}</div>
            {/each}
            {#if roundTrip && tripLang === null && run.state === 'done'}
              <p class="reason" data-testid="translate-trip-needs-lang">Round trip: choose the source language; AUTO could not tell it.</p>
            {/if}
            {#if run.state === 'stopped' && run.reason}
              <p class="reason" data-testid="translate-reason">{run.reason} <kbd>Ctrl+Enter</kbd> translates again.</p>
            {/if}
          {/if}
        </div>
        <div class="actions">
          <button type="button" class="btn" disabled={run === null || run.blocks.length === 0} onclick={copy}>Copy</button>
          <span class="spacer"></span>
          {#if run?.glossary && !run.glossary.used}<span class="small warn" data-testid="translate-glossary-unused">glossary “{run.glossary.name}” not used into {langCode(run.tgtLang)}</span>{/if}
          {#if problem}<span class="problem" data-testid="translate-problem">{problem}</span>{/if}
        </div>
      </div>
    </div>

    {#if links.length > 0}
      <svg class="links" viewBox="0 0 {size.width} {size.height}" aria-hidden="true">
        {#each links as link (link.index)}
          <path d={link.path} class:run={link.state === 'running'} class:hot={hot === link.index} />
        {/each}
      </svg>
      <div class="nodes">
        {#each links as link (link.index)}
          <button
            type="button"
            class="node"
            class:hot={hot === link.index}
            data-st={link.state}
            data-edited={run?.blocks[link.index]?.edited ?? false}
            data-pulse={pulse.phase}
            data-testid="translate-node"
            style:left="{link.x}px"
            style:top="{link.y}px"
            aria-label="Block {blockNumber(link.index)}"
            onpointerenter={(e) => onNode(link.index, e)}
            onpointerleave={() => onNode(link.index, null)}
            onfocus={(e) => onNode(link.index, e)}
            onblur={() => onNode(link.index, null)}
          >{blockNumber(link.index)}</button>
        {/each}
      </div>
    {/if}
  </div>

  {#if card !== null && cardBlock !== null}
    <BlockCard block={cardBlock} anchor={card.anchor} bounds={card.bounds} />
  {/if}
</div>

<style>
.text-view { outline: none; position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.toolbar { display: flex; align-items: center; gap: var(--space-2) var(--space-3); flex-wrap: wrap; min-height: 1.6rem; padding-right: 1.7rem; }
.spacer { flex: 1; }
.pair { display: flex; align-items: stretch; gap: var(--space-1); }
.anchor { position: relative; display: flex; }
.lang { display: flex; align-items: baseline; gap: 0.4rem; min-width: 7.2rem; padding: 0.1rem 0.5rem; border: 1px solid var(--panel-border); background: var(--app-bg); color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); text-align: left; }
.lang b { font-weight: 700; color: var(--accent-strong); text-transform: uppercase; }
.lang small { color: var(--text-muted); font-size: var(--step--2); flex: 1; white-space: nowrap; }
.lang i { font-style: normal; color: var(--text-muted); font-size: var(--step--2); }
.lang:hover, .lang[aria-expanded="true"] { border-color: var(--accent); }
.swap { width: 1.8rem; border: 1px solid var(--panel-rule); background: transparent; color: var(--text-muted); padding: 0; display: grid; place-items: center; }
.swap svg { width: 0.95rem; height: 0.95rem; }
.swap:not(:disabled):hover { color: var(--accent); border-color: var(--accent); }
.swap:disabled { opacity: 0.35; }
.form { display: flex; align-items: center; gap: 0.3rem; }
.form > span { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); text-transform: uppercase; }
.form button { background: transparent; border: 1px solid var(--panel-rule); padding: 0.05rem 0.45rem; color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; }
.form button small { font-size: var(--step--2); letter-spacing: 0; margin-left: 0.25rem; opacity: 0.75; text-transform: none; }
.form button[aria-pressed="true"] { color: var(--text); border-color: var(--accent-dim); background: var(--accent-faint); }
.form.off { opacity: 0.35; pointer-events: none; }
.opts { display: flex; gap: var(--space-1); flex-wrap: wrap; }
.tog { display: inline-flex; align-items: center; gap: 0.3rem; background: transparent; border: 1px solid var(--panel-rule); padding: 0.05rem 0.5rem; color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; }
.tog em { font-style: normal; font-family: var(--font-mono); color: var(--accent-strong); }
.tog em.off { color: var(--warn); }
.tog .dot { width: 0.3rem; height: 0.3rem; background: var(--accent); display: inline-block; }
.tog:hover { color: var(--accent); }
.tog[aria-pressed="true"] { color: var(--text); border-color: var(--accent-dim); background: var(--accent-faint); }
.drawer { padding: var(--space-2); border-top: 1px dashed var(--panel-rule); border-bottom: 1px dashed var(--panel-rule); }
.dhead { display: flex; align-items: center; gap: var(--space-2); margin-bottom: 0.3rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.dhead b { color: var(--text); font-weight: 500; }
.ctxbox { width: 100%; min-height: 4.2rem; resize: vertical; background: transparent; border: 1px solid var(--panel-rule); color: var(--text); padding: 0.3rem 0.4rem; font-family: var(--font-ui); font-size: var(--step--1); line-height: 1.5; outline: none; }
.ctxbox:focus { border-color: var(--accent); }
.small { font-size: var(--step--1); letter-spacing: 0.03em; }
.tog .lamp-live { width: 0.45rem; height: 0.45rem; border: 1px solid var(--text-muted); display: inline-block; transform: rotate(45deg); }
.tog[aria-pressed="true"] .lamp-live { border-color: var(--ok); background: var(--ok); }
.tag.info { color: var(--info); }
.dst .seg[data-edited="true"] { border-left-color: var(--info); }
.node[data-edited="true"] { border-color: var(--info); color: var(--info); }
.acts { position: absolute; top: 0.1rem; right: 0.3rem; display: flex; gap: 0.15rem; opacity: 0; background: var(--panel-bg-raised); padding: 0 0.15rem; border: 1px solid var(--panel-rule); white-space: nowrap; }
.seg:hover .acts, .acts:focus-within { opacity: 1; }
.acts button { border: 0; background: transparent; color: var(--text-muted); padding: 0 0.3rem; font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; line-height: 1.6; }
.acts button:hover { color: var(--accent); }
.block-edit { width: 100%; min-height: 4rem; resize: vertical; background: color-mix(in srgb, var(--info) 8%, transparent); border: 1px dashed var(--info); color: var(--text); font: inherit; padding: 0.2rem 0.3rem; outline: none; }
.trip { display: grid; grid-template-columns: 1fr auto; gap: 0.6rem; align-items: baseline; margin-top: 0.2rem; padding-top: 0.2rem; border-top: 1px dashed var(--panel-rule); font-family: var(--font-ui); font-size: var(--step--1); line-height: 1.45; color: var(--text-muted); white-space: pre-wrap; }
.trip .tl { font-size: var(--step--2); letter-spacing: var(--tracking-wide); margin-right: 0.35rem; }
.match { display: inline-flex; align-items: center; gap: 0.3rem; font-family: var(--font-mono); font-size: var(--step--2); white-space: nowrap; color: var(--ok); }
.match .bar { width: 2.6rem; height: 0.3rem; background: var(--accent-faint); position: relative; }
.match .bar i { position: absolute; inset: 0 auto 0 0; background: var(--ok); }
.match.low { color: var(--warn); }
.match.low .bar i { background: var(--warn); }
.small.warn { color: var(--warn); }

.duo { position: relative; flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 2.8rem minmax(0, 1fr); }
.narrow .duo { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) 0.9rem minmax(0, 1.2fr); }
.side { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.hud-label { position: relative; display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); padding: 0 var(--space-2) 1px; font-size: var(--step--2); font-weight: 500; line-height: 1.5; letter-spacing: var(--tracking-wide); text-transform: uppercase; border-bottom: 1px solid var(--panel-rule); white-space: nowrap; min-width: 0; margin-bottom: 0.35rem; }
.hud-label > * { overflow: hidden; text-overflow: ellipsis; }
.hud-label > :last-child { color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 0.02em; }

.frame { position: relative; --notch: var(--frame-notch); clip-path: polygon(0 0, calc(100% - var(--notch)) 0, 100% var(--notch), 100% 100%, var(--notch) 100%, 0 calc(100% - var(--notch))); }
.frame::after { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; background: var(--frame-color, var(--panel-border)); clip-path: inherit; padding: 1px; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; }
.frame::before { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; background: linear-gradient(to top right, transparent calc(50% - 1px), var(--frame-color, var(--panel-border)) calc(50% - 1px) 50%, transparent 50%) top right / var(--notch) var(--notch) no-repeat, linear-gradient(to top right, transparent 50%, var(--frame-color, var(--panel-border)) 50% calc(50% + 1px), transparent calc(50% + 1px)) bottom left / var(--notch) var(--notch) no-repeat; }
.console { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dst .console { --frame-color: var(--panel-rule); }
.dst .console.tx { --frame-color: var(--accent); }
.src .console:focus-within { --frame-color: var(--accent); }
.text { flex: 1; min-height: 0; overflow-y: auto; padding: 0.55rem 0.2rem 0.6rem; scrollbar-width: thin; scrollbar-color: var(--accent-dim) transparent; user-select: text; }
/* Clipped: the mirror is as tall as the text, and would make the box scroll beside the textarea. */
.edit-wrap { position: relative; height: 100%; overflow: hidden; }
/* Laid out alike in one rule, so the mirror wraps the text where the textarea does. */
.mirror, textarea { box-sizing: border-box; padding: 0 0.6rem; font-family: var(--font-ui); font-size: var(--step-1); font-weight: normal; line-height: 1.75; letter-spacing: normal; word-spacing: normal; text-transform: none; white-space: pre-wrap; overflow-wrap: break-word; }
.mirror { position: absolute; top: 0; left: 0; visibility: hidden; pointer-events: none; }
textarea { width: 100%; height: 100%; resize: none; border: 0; outline: none; background: transparent; color: var(--text); }
textarea::placeholder { color: var(--text-muted); opacity: 0.7; }
.blocks { min-height: 100%; outline: none; cursor: text; }
.actions { display: flex; align-items: center; gap: var(--space-1); padding: 0.3rem 0.6rem 0.4rem 0.9rem; border-top: 1px solid var(--panel-rule); flex-wrap: wrap; }
.count { font-family: var(--font-mono); font-size: var(--step--2); color: var(--text-muted); margin: 0 0.3rem; }
.count.over { color: var(--danger); }
.btn { background: transparent; border: 1px solid var(--panel-border); padding: 0.05rem 0.55rem; color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; white-space: nowrap; }
.btn:not(:disabled):hover { color: var(--accent); border-color: var(--accent); }
.btn:disabled { opacity: 0.45; cursor: default; }
.btn.lit:not(:disabled) { border-color: var(--accent); color: var(--accent-strong); background: var(--accent-faint); }
.btn.lit:not(:disabled):hover { background: var(--accent); color: var(--app-bg); }
.btn.warn { border-color: var(--warn); color: var(--warn); }
kbd { font-family: var(--font-mono); font-size: var(--step--2); color: var(--text-muted); border: 1px solid var(--panel-rule); padding: 0 0.3rem; }

.seg { position: relative; padding: 0.15rem 0.6rem 0.2rem 0.7rem; margin: 0; font-size: var(--step-1); line-height: 1.75; border-left: 2px solid transparent; overflow-wrap: anywhere; white-space: pre-wrap; }
.seg + .seg { margin-top: 0.45rem; }
.src .seg { border-left: 0; border-right: 2px solid transparent; padding: 0.15rem 0.7rem 0.2rem 0.6rem; }
.seg.hot { background: var(--accent-faint); }
.src .seg.hot { border-right-color: var(--accent); }
.dst .seg.hot, .dst .seg[data-st="running"] { border-left-color: var(--accent); }
.dst .seg[data-st="queued"] { color: var(--text-muted); }
.dst .seg[data-st="stopped"] { border-left-color: var(--warn); color: var(--text-muted); }
.dst .seg[data-st="failed"] { border-left-color: var(--danger); }
.dst .seg[data-st="none"] { color: var(--text-muted); }
.qd { font-size: var(--step--2); letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--text-muted); font-family: var(--font-ui); }
.tag { margin-left: 0.5rem; font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); white-space: normal; }
.tag.warn { color: var(--warn); }
.tag.bad { color: var(--danger); }
.caret { display: inline-block; width: 0.5em; height: 1.05em; margin-left: 1px; vertical-align: -0.15em; background: var(--accent); }
.seg[data-pulse="1"] .caret, .seg[data-pulse="3"] .caret { opacity: 0.6; }
.seg[data-pulse="2"] .caret { opacity: 0.25; }
.fresh { position: absolute; inset: 0; pointer-events: none; opacity: 0; border-left: 2px solid var(--accent); background: linear-gradient(to right, color-mix(in srgb, var(--accent) 16%, transparent), transparent 75%); animation: fresh calc(3s * var(--motion-scale)) linear backwards; animation-play-state: var(--ambient-play-state); }
@keyframes fresh { 0%, 40% { opacity: 1; } 100% { opacity: 0; } }
.reason { margin: 0.6rem 0.7rem 0; font-size: var(--step--1); color: var(--warn); }

.gutter { position: relative; background: linear-gradient(var(--panel-rule), var(--panel-rule)) 50% 1.6rem / 1px calc(100% - 3.2rem) no-repeat; }
.narrow .gutter { background: linear-gradient(var(--panel-rule), var(--panel-rule)) 1.6rem 50% / calc(100% - 3.2rem) 1px no-repeat; }
.dir { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); writing-mode: vertical-rl; font-size: var(--step--2); letter-spacing: var(--tracking-wider); color: var(--text-muted); background: var(--app-bg); padding: 0.4rem 0; font-family: var(--font-mono); white-space: nowrap; }
.narrow .dir { writing-mode: horizontal-tb; padding: 0 0.5rem; }
.links { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 3; }
.links path { fill: none; stroke: var(--panel-rule); stroke-width: 1; }
.links path.run { stroke: var(--accent-dim); stroke-dasharray: 3 3; }
.links path.hot { stroke: var(--accent); stroke-width: 1.5; }
.nodes { position: absolute; inset: 0; pointer-events: none; z-index: 4; }
.node { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; min-width: 1.55rem; padding: 0 0.15rem; border: 1px solid var(--panel-rule); background: var(--app-bg); font-family: var(--font-mono); font-size: var(--step--2); line-height: 1.35; color: var(--text-muted); text-align: center; }
.node[data-st="running"] { border-color: var(--accent); color: var(--accent-strong); }
.node[data-st="running"][data-pulse="2"] { opacity: 0.4; }
.node[data-st="done"] { border-color: var(--accent-dim); color: var(--text); background: color-mix(in srgb, var(--accent) 14%, var(--app-bg)); }
.node[data-st="stopped"] { border-color: var(--warn); color: var(--warn); }
.node[data-st="failed"] { border-color: var(--danger); color: var(--danger); }
.node[data-st="none"], .node[data-st="queued"] { border-style: dashed; }
.node.hot { border-color: var(--accent); color: var(--app-bg); background: var(--accent); }

.standby { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.35rem; height: 100%; text-align: center; padding: 1rem; user-select: none; }
.state { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--step--2); letter-spacing: var(--tracking-wider); text-transform: uppercase; color: var(--text-muted); }
.lamp { width: 0.5rem; height: 0.5rem; border: 1px solid var(--text-muted); display: inline-block; }
.lamp.ok { border-color: var(--ok); background: var(--ok); }
.lamp.warn { border-color: var(--warn); }
.lamp.bad { border-color: var(--danger); background: var(--danger); }
.lamp.busy { border-color: var(--accent); background: var(--accent); }
.big { font-family: var(--font-display); font-size: var(--step-1); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--accent-strong); }
.host { font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-muted); max-width: 30rem; overflow-wrap: anywhere; }
.hint { font-size: var(--step--1); color: var(--text-muted); line-height: 1.6; max-width: 28rem; }
.command { margin-top: var(--space-2); padding: var(--space-1) var(--space-3); border: 1px solid var(--accent); background: transparent; color: var(--accent-strong); font-family: var(--font-mono); font-size: var(--step--1); }
.command:hover { background: var(--accent-faint); }
.problem { color: var(--danger); font-size: var(--step--1); }
.boot { padding: 0.3rem 0.8rem; font-family: var(--font-mono); font-size: var(--step--1); line-height: 1.75; }
.boot .ln { overflow-wrap: anywhere; color: var(--text-muted); }
.boot-head { display: flex; align-items: center; gap: 0.6rem; margin: 0.2rem 0 0.4rem; font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wider); color: var(--text-muted); text-transform: uppercase; }
.boot-head::after { content: ""; flex: 1; border-top: 1px dashed var(--panel-rule); }
.fault { padding: 0.6rem 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
.fault h3 { margin: 0; display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display); font-weight: 500; font-size: var(--step-1); letter-spacing: var(--tracking-wide); color: var(--danger); }
.fault p { margin: 0; font-size: var(--step--1); line-height: 1.6; }
.fault pre { margin: 0; padding: 0.4rem 0.6rem; border-left: 2px solid var(--danger); background: color-mix(in srgb, var(--danger) 8%, transparent); font-family: var(--font-mono); font-size: var(--step--2); line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text); }
.fault .row { display: flex; gap: var(--space-1); flex-wrap: wrap; }
</style>
