<script lang="ts">
import {
  bursting,
  burstLit,
  burstStreak,
  laneBuckets,
  ratePerSecond,
  totals,
} from '@shared/logwatch/rate'
import { maskText } from '@shared/logwatch/text'
import {
  FORMAT_NAMES,
  groupOf,
  LEVEL_GROUP_IDS,
  type LevelGroup,
  type LogExplainRequest,
  type LogFileRef,
  type LogFormat,
  type LogItem,
} from '@shared/logwatch/types'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import { feedFor } from './feed.svelte.ts'
import LogExplain from './LogExplain.svelte'
import LogFileCard from './LogFileCard.svelte'
import LogLanes from './LogLanes.svelte'
import LogLineCard from './LogLineCard.svelte'
import LogPatterns from './LogPatterns.svelte'
import LogSettings from './LogSettings.svelte'
import LogStream from './LogStream.svelte'
import {
  buildRows,
  type ChooseHow,
  chooseRows,
  chosenLines,
  compileFilter,
  encodingLabel,
  type Row,
  readLogPane,
  tallyPatterns,
} from './view.ts'

/**
 * LOG WATCH (docs/logwatch.md): one log file, followed while the pane is seen - behind another
 * tab or with the window put away nothing is read, and on coming back main reads what was
 * written meanwhile. Main reads and parses; this pane filters, folds and draws, and asks main
 * to EXPLAIN the lines chosen - only those - on a press.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const choices = $derived(readLogPane(paneState))

function patch(change: Record<string, unknown>): void {
  widgetState.patch(paneId, change)
}

/* ---- The file ---- */

let file = $state.raw<LogFileRef | null>(null)
let unknown = $state(false)
let choosing = $state(false)
let problem = $state<string | null>(null)
let recent = $state.raw<LogFileRef[]>([])

$effect(() => {
  const id = choices.file
  let gone = false
  file = null
  unknown = false
  if (id === null) return
  void window.elecdex.logwatch.describe(id).then((ref) => {
    if (gone) return
    file = ref
    unknown = ref === null
  })
  return () => {
    gone = true
  }
})

$effect(() => {
  if (!visible || (choices.file !== null && !choosing && !unknown)) return
  let gone = false
  void window.elecdex.logwatch.recent().then((list) => {
    if (!gone) recent = list
  })
  return () => {
    gone = true
  }
})

async function pick(newest: boolean): Promise<void> {
  problem = null
  const result = await window.elecdex.logwatch.pick(newest)
  if (result === null) return
  if ('problem' in result) {
    problem = result.problem
    sfx.play('glitch')
    return
  }
  use(result.file.id)
}

function use(id: string): void {
  choosing = false
  problem = null
  letGo()
  explaining = null
  sfx.play('folder')
  patch({ file: id, muted: undefined })
}

/* ---- What is held ---- */

const keepLines = $derived(appearance.settings.logWatch.keepLines)
const feed = $derived(choices.file === null ? null : feedFor(choices.file, choices.encoding))

$effect(() => (visible && feed !== null && !unknown ? feed.use() : undefined))

/**
 * The second, while seen: times said as "ago", the lanes and the figures move on it, and the
 * burst lamp counts how long errors have been coming fast.
 */
let now = $state(Date.now())
let streak = $state(0)
$effect(() => {
  if (!visible) return
  now = Date.now()
  return onBoundary(1000, () => {
    now = Date.now()
    // The buckets of this very second (`buckets` follows `now`).
    streak = burstStreak(streak, bursting(buckets))
  })
})

const items = $derived.by(() => {
  void feed?.version
  return feed?.items ?? []
})
const status = $derived(feed?.status ?? null)

/**
 * PAUSE: the stream holds what it showed while main goes on reading; the figures and the lanes
 * stay live, and the lamp counts what is held back. Let go, it all comes at once.
 */
let frozen = $state.raw<LogItem[] | null>(null)
$effect(() => {
  void feed
  frozen = null
})
const shownItems = $derived(frozen ?? items)
const heldBack = $derived.by(() => {
  if (frozen === null) return 0
  const after = frozen.at(-1)?.seq ?? -1
  let n = 0
  for (let i = items.length - 1; i >= 0 && (items[i]?.seq ?? -1) > after; i--) {
    if (items[i]?.kind === 'line') n++
  }
  return n
})

const buckets = $derived(laneBuckets(items, now))
const counts = $derived(totals(buckets))
const rate = $derived(ratePerSecond(buckets))

const burst = $derived(burstLit(streak))

/* ---- The filter ---- */

let filterText = $state('')
const filter = $derived(compileFilter(filterText))
let lastGood = $state.raw<RegExp | null>(null)
$effect(() => {
  if (!filter.bad) lastGood = filter.match
})
const hidden = $derived(new Set<LevelGroup>(choices.hidden))
const muted = $derived(new Set(choices.muted))
const rows = $derived(buildRows(shownItems, { hidden, muted, match: lastGood, fold: choices.fold }))

function toggleGroup(group: LevelGroup): void {
  const next = hidden.has(group)
    ? choices.hidden.filter((g) => g !== group)
    : [...choices.hidden, group]
  // The default hides DBG; an empty list is kept as such, not as "the default".
  patch({ hidden: next.length === 1 && next[0] === 'DBG' ? undefined : next })
}

function toggleMute(sig: string): void {
  const next = muted.has(sig) ? choices.muted.filter((s) => s !== sig) : [...choices.muted, sig]
  patch({ muted: next.length === 0 ? undefined : next })
}

/**
 * Lines held of each level group: what each switch shows or hides (the five minutes' figures are
 * the lanes' and the status row's).
 */
const heldByGroup = $derived.by(() => {
  const counted: Record<LevelGroup, number> = { DBG: 0, INF: 0, WRN: 0, ERR: 0 }
  for (const item of shownItems) if (item.kind === 'line') counted[groupOf(item.level)]++
  return counted
})
const heldLines = $derived(heldByGroup.DBG + heldByGroup.INF + heldByGroup.WRN + heldByGroup.ERR)

/** What the stream says when it shows no line: none came yet, or the filter lets none through. */
const emptyWords = $derived(
  rows.some((row) => row.item.kind === 'line')
    ? null
    : heldLines > 0
      ? 'no line held matches the levels and the filter shown'
      : status?.state === 'reading'
        ? 'no lines yet: they appear here as they are written'
        : null,
)

const patterns = $derived(choices.tab === 'patterns' ? tallyPatterns(shownItems, now) : [])

/* ---- Choosing a line ---- */

/**
 * The lines chosen, by the number of each row's first line: a click chooses one, Ctrl (⌘ on a
 * Mac) adds or takes away one, Shift chooses a run. Only the chosen lines that are shown are
 * copied or sent (`chosenLines`).
 */
let chosen = $state.raw<ReadonlySet<number>>(new Set())
let anchor: number | null = null
const chosenShown = $derived(chosenLines(rows, chosen))
const addKey = window.elecdex.system.platform === 'darwin' ? '⌘' : 'Ctrl'

function select(row: Row, how: ChooseHow): void {
  const next = chooseRows(chosen, anchor, rows, row, how)
  chosen = next.chosen
  anchor = next.anchor
}

function letGo(): void {
  chosen = new Set()
  anchor = null
}

/** COPY says so for a moment; through main, as every pane copies (the tests' stand-in catches it). */
const copied = new CopyFlag()
$effect(() => () => copied.dispose())

async function copy(): Promise<void> {
  if (chosenShown.length === 0) return
  const raw = chosenShown.map((line) => [line.raw, ...line.more].join('\n')).join('\n')
  const text = choices.mask ? maskText(raw) : raw
  if (await copied.through('line', () => window.elecdex.utility.copy({ kind: 'text', text }))) {
    sfx.play('folder')
  }
}

/* ---- EXPLAIN ---- */

const providers = $derived(appearance.settings.ai.providers)
const provider = $derived(providers.find((p) => p.id === choices.provider) ?? providers[0] ?? null)
let explaining = $state.raw<LogExplainRequest | null>(null)

function explain(): void {
  if (chosenShown.length === 0 || choices.file === null || provider === null) return
  explaining = {
    id: choices.file,
    encoding: choices.encoding,
    seqs: chosenShown.map((line) => line.seq),
    provider: provider.id,
    model: choices.model,
    mask: choices.mask,
  }
}

/* ---- Settings ---- */

let settingsOpen = $state(false)

function setFormat(format: LogFormat | null): void {
  if (choices.file === null) return
  const id = choices.file
  void window.elecdex.logwatch.setFormat(id, format).then((ok) => {
    if (ok && file?.id === id) file = { ...file, format }
  })
}

/* ---- The card ---- */

let rootEl = $state<HTMLElement | null>(null)
let hover = $state.raw<{ row: Row; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<number>(() => (hover = null))

function onhover(row: Row | null, event: { row: DOMRect; x: number | null } | null): void {
  if (row === null || event === null) {
    resting.leave()
    return
  }
  resting.enter(
    row.item.seq,
    () => {
      if (rootEl === null) return
      const box = rootEl.getBoundingClientRect()
      hover = {
        row,
        anchor: anchorOf(box, event.row, event.x),
        bounds: { width: box.width, height: box.height },
      }
    },
    event.x === null,
  )
}

/* ---- The file's card, and choosing another ---- */

let fileHover = $state.raw<{ anchor: CardAnchor; bounds: CardSize } | null>(null)
const fileRest = new HoverRest<'file'>(() => (fileHover = null))

function showFileCard(target: HTMLElement, x: number | null): void {
  fileRest.enter(
    'file',
    () => {
      if (rootEl === null) return
      const box = rootEl.getBoundingClientRect()
      fileHover = {
        anchor: anchorOf(box, target.getBoundingClientRect(), x),
        bounds: { width: box.width, height: box.height },
      }
    },
    x === null,
  )
}

/** A click on the file's name: the picker, to follow the newest like it if that is what it does. */
function chooseAnother(): void {
  fileRest.leave()
  void pick(file?.pattern != null)
}

$effect(() => {
  if (!visible) {
    resting.leave()
    fileRest.leave()
  }
})
$effect(() => () => fileRest.dispose())
$effect(() => () => resting.dispose())

/* ---- The header's words ---- */

const lamp = $derived.by((): { word: string; tone: 'ok' | 'warn' | 'danger' | 'muted' } => {
  if (status === null) return { word: 'OPENING', tone: 'muted' }
  if (status.state === 'denied') return { word: 'CANNOT READ', tone: 'danger' }
  if (status.state === 'error') return { word: 'ERROR', tone: 'danger' }
  if (status.state === 'waiting') return { word: 'WAITING FOR FILE', tone: 'warn' }
  if (burst) return { word: 'ERROR BURST', tone: 'danger' }
  if (frozen !== null) return { word: `PAUSED · ${heldBack.toLocaleString()} HELD`, tone: 'muted' }
  return { word: 'LIVE', tone: 'ok' }
})
$effect(() => (status?.state === 'reading' && visible ? pulse.use() : undefined))

$effect(() => {
  const name = file?.name ?? (choices.file === null ? 'no file' : unknown ? 'unknown file' : '…')
  paneMeta.set(paneId, {
    subtitle: name,
    ...(burst ? { badge: 'error burst', badgeKind: 'danger' as const } : {}),
  })
})
</script>

<div class="logwatch" data-testid="logwatch" data-pane-id={paneId} bind:this={rootEl}>
  {#if choices.file === null || choosing || unknown}
    <div class="choose" data-testid="logwatch-choose">
      {#if unknown && !choosing}
        <p class="problem">This file is not known on this machine: choose it again.</p>
      {/if}
      <div class="buttons">
        <button type="button" class="select" onclick={() => void pick(false)} data-testid="logwatch-select"
          >SELECT LOG FILE</button
        >
        <button type="button" class="select" onclick={() => void pick(true)} data-testid="logwatch-select-newest"
          >FOLLOW THE NEWEST LIKE IT</button
        >
      </div>
      <p class="hint">
        The second follows the newest file in the same folder whose name differs only in its
        numbers (a date, a count): for logs that start a new file each day or each run.
      </p>
      {#if problem !== null}<p class="problem" data-testid="logwatch-problem">{problem}</p>{/if}
      {#if recent.length > 0}
        <p class="label">RECENT</p>
        <ul class="recent">
          {#each recent as each (each.id)}
            <li>
              <button type="button" data-testid="logwatch-recent" onclick={() => use(each.id)}>
                <span class="name">{each.name}</span><span class="where">{each.folder}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
      {#if choices.file !== null && !unknown}
        <button type="button" class="cancel" onclick={() => (choosing = false)}>BACK</button>
      {/if}
    </div>
  {:else}
    <SettingsButton
      open={settingsOpen}
      label="log watch settings"
      testid="logwatch-settings-toggle"
      ontoggle={() => (settingsOpen = !settingsOpen)}
    />
    <header class="status" data-testid="logwatch-status" data-state={status?.state ?? 'opening'}>
      <span class="lamp" data-tone={lamp.tone} data-pulse={lamp.tone === 'ok' ? pulse.phase : 0} data-testid="logwatch-lamp"
        ><i></i>{lamp.word}</span
      >
      <span class="figure"><small>RATE</small><b>{rate}/s</b></span>
      <span class="figure err"><small>ERR 5 MIN</small><b data-testid="logwatch-err">{counts.ERR}</b></span>
      <span class="figure warn"><small>WARN 5 MIN</small><b>{counts.WRN}</b></span>
      <span class="where" data-testid="logwatch-where">
        <button
          type="button"
          class="file"
          onclick={chooseAnother}
          onpointerenter={(event) => showFileCard(event.currentTarget, event.clientX)}
          onpointerleave={() => fileRest.leave()}
          onfocus={(event) => showFileCard(event.currentTarget, null)}
          onblur={() => fileRest.leave()}
          data-testid="logwatch-file">{status?.file ?? file?.name ?? ''}</button
        >
        {#if status}· {FORMAT_NAMES[status.format]} · {encodingLabel(choices.encoding, status.encoding)}{/if}
      </span>
    </header>
    {#if status?.problem}
      <p class="problem" data-testid="logwatch-state-problem">{status.problem}</p>
    {/if}
    {#if problem !== null}
      <p class="problem" data-testid="logwatch-problem">{problem}</p>
    {/if}
    {#if status?.garbled}
      <button
        type="button"
        class="garbled"
        onclick={() => (settingsOpen = true)}
        data-testid="logwatch-garbled">TEXT LOOKS GARBLED · CHOOSE THE ENCODING ▸</button
      >
    {/if}
    {#if settingsOpen}
      <LogSettings
        {file}
        {choices}
        format={file?.format ?? null}
        detected={status?.format ?? null}
        keepLines={appearance.settings.logWatch.keepLines}
        initialLines={appearance.settings.logWatch.initialLines}
        {providers}
        onpane={patch}
        onformat={setFormat}
        onapp={(change) => void appearance.patch({ logWatch: change })}
        onchoose={() => {
          settingsOpen = false
          choosing = true
        }}
        onsetupai={() => ui.openSettings('ai')}
      />
    {/if}
    {#if choices.chart}
      <LogLanes {buckets} />
    {/if}
    <div class="bar">
      <span class="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={choices.tab === 'stream'} onclick={() => patch({ tab: undefined })} data-testid="logwatch-tab-stream">STREAM</button
        ><button type="button" role="tab" aria-selected={choices.tab === 'patterns'} onclick={() => patch({ tab: 'patterns' })} data-testid="logwatch-tab-patterns">PATTERNS</button>
      </span>
      {#each LEVEL_GROUP_IDS as group (group)}
        <button
          type="button"
          class="level"
          data-group={group}
          aria-pressed={!hidden.has(group)}
          onclick={() => toggleGroup(group)}
          data-testid="logwatch-level">{group}<em>{heldByGroup[group]}</em></button
        >
      {/each}
      <input
        class="filter"
        class:bad={filter.bad}
        type="text"
        placeholder="filter — text, or /regex/"
        spellcheck="false"
        bind:value={filterText}
        data-testid="logwatch-filter"
      />
      <button type="button" class="chip" aria-pressed={frozen !== null} onclick={() => (frozen = frozen === null ? items : null)} data-testid="logwatch-pause">PAUSE</button>
      <button type="button" class="chip" aria-pressed={choices.mask} onclick={() => patch({ mask: choices.mask ? undefined : true })} data-testid="logwatch-mask">MASK</button>
      <button type="button" class="chip" aria-pressed={choices.wrap} onclick={() => patch({ wrap: choices.wrap ? undefined : true })} data-testid="logwatch-wrap">WRAP</button>
      {#if muted.size > 0}
        <button type="button" class="chip quiet" onclick={() => patch({ tab: 'patterns' })} data-testid="logwatch-muted">{muted.size} MUTED</button>
      {/if}
    </div>
    {#if choices.tab === 'patterns'}
      <LogPatterns {patterns} {muted} {now} mask={choices.mask} ontoggle={toggleMute} />
    {:else}
      <LogStream
        {rows}
        time={choices.time}
        {now}
        wrap={choices.wrap}
        errorBar={choices.errorBar}
        mask={choices.mask}
        match={lastGood}
        {chosen}
        empty={emptyWords}
        onselect={select}
        {onhover}
      />
    {/if}
    {#if explaining !== null}
      <!-- Another line asked about starts afresh: an answer still being written for the last stops. -->
      {#key explaining}
        <LogExplain
          request={explaining}
          to={`${provider?.name ?? ''} · ${choices.model || provider?.model || ''}`}
          onclose={() => (explaining = null)}
        />
      {/key}
    {/if}
    <footer class="foot">
      {#if chosenShown.length > 0}
        <span class="chosen" data-testid="logwatch-chosen"
          >{chosenShown.length === 1
            ? '1 line chosen'
            : `${chosenShown.length} lines chosen`} · {addKey}+click adds · Shift+click a run</span
        >
        <button type="button" onclick={letGo} data-testid="logwatch-let-go">LET GO</button>
        <button type="button" onclick={() => void copy()} data-testid="logwatch-copy">{copied.key === 'line' ? 'COPIED' : 'COPY'}</button>
        {#if provider !== null}
          <button type="button" onclick={explain} data-testid="logwatch-explain-open">EXPLAIN</button>
        {:else}
          <!-- Without a provider EXPLAIN cannot ask anyone: it says where one is set up. -->
          <button type="button" class="setup" onclick={() => ui.openSettings('ai')} data-testid="logwatch-explain-setup"
            >EXPLAIN · SET UP AI</button
          >
        {/if}
      {:else}
        <span class="hint" data-testid="logwatch-hint">click lines to copy them or have AI explain them</span>
        <span data-testid="logwatch-kept">{heldLines.toLocaleString()} lines kept of {keepLines.toLocaleString()} · read {((status?.read ?? 0) / 1024).toFixed(0)} KB</span>
      {/if}
      <span class="quiet">read only while shown · nothing written</span>
    </footer>
  {/if}

  {#if fileHover !== null && file !== null}
    <LogFileCard
      {file}
      {status}
      encoding={choices.encoding}
      anchor={fileHover.anchor}
      bounds={fileHover.bounds}
    />
  {/if}
  {#if hover !== null && hover.row.item.kind === 'line'}
    <LogLineCard row={hover.row} mask={choices.mask} anchor={hover.anchor} bounds={hover.bounds} />
  {/if}
</div>

<style>
.logwatch {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  font-family: var(--font-ui);
}

.choose {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-2);
  overflow: auto;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.select,
.cancel {
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.14em;
  cursor: pointer;
}

.cancel {
  border-color: var(--panel-rule);
  background: transparent;
}

.select:hover,
.cancel:hover {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
}

.hint {
  max-width: 40rem;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.problem {
  margin: 0;
  color: var(--warn);
  font-size: var(--step--1);
}

.label {
  margin: var(--space-1) 0 0;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.recent {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent button {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  padding: 0.1rem 0.4rem;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
}

.recent button:hover {
  background: var(--accent-faint);
}

.recent .where {
  color: var(--text-muted);
}

.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 1rem;
  margin-right: 1.6rem;
  min-width: 0;
}

.lamp {
  --tone: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--step--1);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.lamp[data-tone='ok'] {
  --tone: var(--ok);
}

.lamp[data-tone='warn'] {
  --tone: var(--warn);
}

.lamp[data-tone='danger'] {
  --tone: var(--danger);
}

.lamp i {
  width: 0.45rem;
  height: 0.45rem;
  transform: rotate(45deg);
  background: var(--tone);
}

.lamp[data-pulse='1'] i,
.lamp[data-pulse='3'] i {
  opacity: 0.7;
}

.lamp[data-pulse='2'] i {
  opacity: 0.4;
}

.figure {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.15;
}

.figure small {
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.figure b {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-weight: 500;
  color: var(--text);
}

.figure.err b {
  color: var(--danger);
}

.figure.warn b {
  color: var(--warn);
}

.where {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* The file's name: a button that says so on the pointer (underline), and chooses another. */
.file {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: var(--step--1);
  letter-spacing: 0;
  cursor: pointer;
  text-decoration: underline dotted var(--accent-dim);
  text-underline-offset: 3px;
}

.file:hover,
.file:focus-visible {
  color: var(--accent-strong);
  text-decoration-color: var(--accent);
}

.garbled {
  align-self: flex-start;
  padding: 0 0.5rem;
  border: 1px solid var(--warn);
  background: transparent;
  color: var(--warn);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
}

.tabs {
  display: inline-flex;
  margin-right: 0.4rem;
}

.tabs button {
  padding: 0.05rem 0.6rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.tabs button[aria-selected='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.level {
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  cursor: pointer;
}

.level em {
  margin-left: 0.3rem;
  font-style: normal;
  opacity: 0.7;
}

.level[aria-pressed='true'] {
  color: var(--text);
  border-color: var(--accent-dim);
  background: var(--accent-faint);
}

.level[data-group='WRN'][aria-pressed='true'] {
  color: var(--warn);
  border-color: var(--warn);
}

.level[data-group='ERR'][aria-pressed='true'] {
  color: var(--danger);
  border-color: var(--danger);
}

.filter {
  flex: 1;
  min-width: 8rem;
  padding: 0 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  outline: none;
}

.filter:focus {
  border-color: var(--accent);
}

.filter.bad {
  border-color: var(--danger);
}

.chip {
  padding: 0 0.45rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.chip[aria-pressed='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.chip.quiet {
  border-style: dashed;
}

.foot {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-top: 0.2rem;
  border-top: 1px solid var(--panel-rule);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
  white-space: nowrap;
}

.foot .quiet {
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot .chosen {
  color: var(--text);
}

.foot .hint {
  color: var(--text);
}

.foot .setup {
  border-style: dashed;
  color: var(--text-muted);
}

.foot button {
  padding: 0 0.6rem;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.foot button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
