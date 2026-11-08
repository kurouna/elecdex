<script lang="ts">
import { type DrillPlace, isAwsService, itemOf, listItem } from '@shared/aws/board'
import { DRILL, type DrillColumn, facets, filterRows, sortRows } from '@shared/aws/drill'
import { dayText } from '@shared/aws/facts'
import type { AwsService, DrillItem, DrillRow, HistoryEvent } from '@shared/aws/types'
import { untrack } from 'svelte'
import { sfx } from '../../stores/sound.svelte.ts'
import { ageText, clockText, MASKED } from '../cloud/cloud-view.ts'
import { dateCell, gibText, money } from './aws-view.ts'
import { keepRow } from './keep.ts'
import { drillDef, maskIn, shownName } from './resources-view.ts'

/**
 * The drill-down's second and third steps (docs/aws.md §5): a service's facet bars and its list,
 * then one resource. The list comes from main's last reading once per reading; the facets, the
 * cross-filtering and the sort are worked out here. Where the pane has drilled to lives in its
 * state, so a remount comes back to the same place; an id main no longer has goes back a step.
 * RESOURCES' lists across services (FORGOTTEN, NEW 7 D, ELSEWHERE) are drilled the same way,
 * each row saying its service; under MASK no resource is named, at either step (aws.md §14.6).
 */
interface Props {
  boardKey: string
  place: DrillPlace
  /** The sign-in's reading time, as the list's line says it. */
  readAt: number | null
  /** Main's readings changed (a probe settled, KEEP, the sweep): the list and item are asked again. */
  revision: string
  masked: boolean
  now: number
  narrow: boolean
  /** The ELSEWHERE sweep's last reading, for its list's line. */
  sweptAt?: number | null
  onplace: (next: DrillPlace | null) => void
  onopen: (id: string) => void
}

const {
  boardKey,
  place,
  readAt,
  revision,
  masked,
  now,
  narrow,
  sweptAt = null,
  onplace,
  onopen,
}: Props = $props()

let rows = $state.raw<DrillRow[] | null>(null)
let item = $state.raw<DrillItem | null>(null)
let history = $state.raw<HistoryEvent[] | 'failed' | null>(null)
let gone = $state<number | null>(null)

const def = $derived(drillDef(place))
/** A list across services: its rows say their service, and its items carry it (board.ts). */
const isList = $derived(!isAwsService(place.service))
/** The resource the item step shows. */
const target = $derived(itemOf(place))
/**
 * The place's parts the readings follow, as values: the pane state is a new object at every
 * change (a filter, a sort), which must not ask main again.
 */
const service = $derived(place.service)
const itemId = $derived(place.item)
/** As a value too: the item effect must not follow every new place object (a MASK press). */
const itemRegion = $derived(place.region)
const targetKey = $derived(
  target === null ? null : `${target.service}:${place.region ?? ''}:${target.id}`,
)
/** Bumped by KEEP's answer: the item is read again for its Kept. */
let kept = $state(0)

$effect(() => {
  const asked = service
  void revision
  const key = boardKey
  void window.elecdex.aws.drill(key, asked).then((next) => {
    if (place.service === asked) rows = next ?? []
  })
})

// HISTORY is the item's: another item, or the list, forgets it; a new reading does not.
$effect(() => {
  void itemId
  history = null
})

/**
 * Each step powers on as it appears (the pane's view is mounted once for a list and its items);
 * the first, with the view, does not twice.
 */
let moved = $state(false)
let shownStep: boolean | null = null
$effect(() => {
  const step = itemId === null
  if (shownStep !== null && shownStep !== step) moved = true
  shownStep = step
})

/**
 * A list and its items share the pane's scroller now that they share a mount: an item opens at
 * its top, and the list comes back where it was left (a row near the bottom of a long list once
 * opened its item scrolled past its header).
 */
let tableEl = $state<HTMLElement | null>(null)
let listTop = 0
const scrollerOf = (el: HTMLElement | null): HTMLElement | null => el?.closest('.view') ?? null
/** As each step's element arrives: the list where it was left, an item at its top. */
function keepPlace(el: HTMLElement, toList: boolean): void {
  const scroller = scrollerOf(el)
  if (scroller !== null) scroller.scrollTop = toList ? listTop : 0
}
const atList = (el: HTMLElement) => keepPlace(el, true)
const atItem = (el: HTMLElement) => keepPlace(el, false)

$effect(() => {
  const id = itemId
  void targetKey
  const one = untrack(() => target)
  void revision
  void kept
  if (id === null || one === null) {
    item = null
    return
  }
  void window.elecdex.aws.item(boardKey, one.service, one.id, itemRegion).then((next) => {
    if (place.item !== id) return
    if (next === null) {
      // Gone since the last reading: back to the list, saying when (aws.md §5.1).
      gone = Date.now()
      onplace({ ...place, item: null })
      return
    }
    item = next
  })
})

const filtered = $derived(rows === null ? [] : filterRows(rows, place.filters))
const groups = $derived(rows === null ? [] : facets(rows, def, place.filters))
const sort = $derived(place.sort ?? { column: def.sort, down: true })
const sorted = $derived(sortRows(filtered, sort.column, sort.down))
const columns = $derived(
  narrow
    ? def.columns.filter((c, i) => i === 0 || c.key === 'state' || c.kind === 'money')
    : def.columns,
)
/** The first column wider, the numbers narrower: fixed per service, so rows line up. */
const template = $derived(
  [
    'minmax(8rem, 2fr)',
    ...columns
      .slice(1)
      .map((c) => (c.kind === 'text' ? 'minmax(0, 1fr)' : 'minmax(4.5rem, 0.8fr)')),
  ].join(' '),
)
const maxOf = $derived(
  Object.fromEntries(
    def.columns
      .filter((c) => c.kind === 'money' || c.kind === 'gib' || c.kind === 'num')
      .map((c) => [
        c.key,
        Math.max(
          0,
          ...filtered.map((r) =>
            typeof r.cells[c.key] === 'number' ? (r.cells[c.key] as number) : 0,
          ),
        ),
      ]),
  ),
)

function toggleFilter(key: string, value: string): void {
  sfx.play('panel')
  const filters = { ...place.filters }
  if (filters[key] === value) delete filters[key]
  else filters[key] = value
  onplace({ ...place, filters })
}

function sortBy(column: string): void {
  sfx.play('panel')
  const down = sort.column === column ? !sort.down : true
  onplace({ ...place, sort: { column, down } })
}

/** A list's row opens its resource under the list; a row of something gone (NEW's) does not. */
const opens = (row: DrillRow): boolean => !isList || row.service !== undefined

function choose(row: DrillRow): void {
  if (!opens(row)) return
  sfx.play('expand')
  gone = null
  listTop = scrollerOf(tableEl)?.scrollTop ?? 0
  const { direct: _direct, ...rest } = place
  onplace({
    ...rest,
    item: isList && row.service ? listItem(row.service, row.id) : row.id,
    region: row.region,
  })
}

function onRowKey(event: KeyboardEvent, row: DrillRow): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    choose(row)
  }
}

function related(service: AwsService, id: string): void {
  sfx.play('expand')
  // Another item, in the same step: it opens at its top too.
  const scroller = scrollerOf(oneEl)
  if (scroller !== null) scroller.scrollTop = 0
  // Related things (an instance's volumes and addresses) are in its region.
  onplace({ service, filters: {}, sort: null, item: id, ...(item ? { region: item.region } : {}) })
}

let oneEl = $state<HTMLElement | null>(null)
async function readHistory(): Promise<void> {
  if (item === null) return
  sfx.play('panel')
  history =
    (await window.elecdex.aws.history(boardKey, item.service, item.id, item.region)) ?? 'failed'
  // The button pressed is gone with the answer: the focus stays in the pane, so Escape still goes up.
  oneEl?.focus({ preventScroll: true })
}

function numberCell(column: DrillColumn, value: number): string {
  if (column.kind === 'money') return money(value)
  if (column.kind === 'gib') return gibText(value)
  if (column.kind === 'date')
    return column.key === 'up' ? ageText(value, now) : dateCell(value, now)
  return String(value)
}

function cell(column: DrillColumn, row: DrillRow): string {
  const value = row.cells[column.key]
  if (column.masked && masked) return MASKED
  if (typeof value === 'number') return numberCell(column, value)
  if (value === null || value === undefined) return '—'
  if (column.kind !== 'text' && column.kind !== 'num') return '—'
  // A sentence about the row (a reason) keeps its numbers and loses the row's own name.
  return maskIn(value, row.names ?? [row.name], masked)
}

/** The name column: every resource's name goes under MASK, whatever its kind (aws.md §14.6). */
const shown = (name: string, i: number, row: DrillRow) =>
  i === 0 && masked ? shownName(row.name, true) : name

/* ---- KEEP, and ELSEWHERE's sweep ---- */

function keep(button: HTMLElement, on: boolean): void {
  const row = item?.forgotten
  if (row == null) return
  // Kept or not changes what the step shows: it is read again once main took the press.
  keepRow(button, boardKey, row, on, masked, () => {
    kept += 1
  })
}

let sweepWait = $state(0)
async function sweepNow(): Promise<void> {
  if (now < sweepWait) return
  sfx.play('panel')
  sweepWait = Date.now() + (await window.elecdex.aws.sweep(boardKey, 'now'))
}

/** Takes the focus as the list or the item appears, so Escape goes up from the keyboard. */
function takeFocus(el: HTMLElement): void {
  el.focus({ preventScroll: true })
}
</script>

{#if place.item === null}
  <div class="drill" class:crt-on={moved} data-testid="aws-drill-list">
    {#if place.service === 'elsewhere'}
      <p class="sweep" data-testid="aws-sweep-line">Read by a weekly sweep of the regions this pane does not show, describe only · last {dayText(sweptAt)} <button type="button" class="tool" onclick={() => void sweepNow()} data-testid="aws-sweep-now">check other regions now</button>{#if sweepWait > 0}<span class="dim">{' · asked: the other regions are read in the background'}</span>{/if}</p>
    {/if}
    {#if gone !== null}<p class="gone" role="status">gone since {clockText(gone)}: not in the last reading</p>{/if}
    <div class="facets" class:narrow>
      {#each groups as group (group.key)}
        <div class="facet" data-testid="aws-facet">
          <small>{group.label}</small>
          {#each group.bars as bar (bar.value)}
            <button type="button" class="bar1" class:on={bar.on} aria-pressed={bar.on} onclick={() => toggleFilter(group.key, bar.value)} data-testid="aws-facet-bar">
              <span class="v">{bar.value}</span><span class="fill" style:--share={bar.share}></span><span class="n">{bar.count}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="table" tabindex="-1" bind:this={tableEl} {@attach atList} {@attach takeFocus}>
      <div class="row head" style:grid-template-columns={template}>
        {#each columns as column (column.key)}
          <button type="button" class:num={column.kind !== 'text'} onclick={() => sortBy(column.key)} data-testid="aws-sort">
            {column.label}{#if sort.column === column.key}{sort.down ? ' ▼' : ' ▲'}{/if}
          </button>
        {/each}
      </div>
      {#each sorted as row (`${row.service ?? ''}:${row.region}:${row.id}`)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="row" style:grid-template-columns={template} data-weight={row.weight} tabindex={opens(row) ? 0 : undefined} role={opens(row) ? 'link' : 'listitem'} onclick={() => choose(row)} onkeydown={(e) => onRowKey(e, row)} data-testid="aws-drill-row">
          {#each columns as column, i (column.key)}
            <span class:num={column.kind !== 'text'} class:lead={i === 0}>
              {#if maxOf[column.key]}<i class="bg" style:--share={(typeof row.cells[column.key] === 'number' ? (row.cells[column.key] as number) : 0) / (maxOf[column.key] || 1)}></i>{/if}
              {i === 0 ? shown(cell(column, row), i, row) : cell(column, row)}
            </span>
          {/each}
        </div>
      {:else}
        <p class="none">{rows === null ? '…' : 'nothing here with these filters'}</p>
      {/each}
    </div>
    <p class="count">{filtered.length} of {rows?.length ?? 0} · read {clockText(readAt)}{(rows?.length ?? 0) >= 1000 ? ' · 1,000 of at least 1,000' : ''}</p>
  </div>
{:else if item !== null}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="drill one" class:crt-on={moved} data-testid="aws-drill-item" tabindex="-1" bind:this={oneEl} {@attach atItem} {@attach takeFocus}>
    <header class="ihead">
      <span class="state" data-state={item.state ?? ''} data-testid="aws-item-state"><i></i>{item.state ?? item.service}</span>
      <b>{shownName(item.name, masked)}</b>
      {#if item.forgotten}<span class="tag" data-weight={item.forgotten.weight}>{item.kept ? 'kept' : 'looks forgotten'}</span>{/if}
      <span class="spacer"></span>
      {#if item.forgotten}
        <button type="button" class="tool" class:on={item.kept} aria-pressed={item.kept === true} aria-label={item.kept ? 'kept: show it in LOOKS FORGOTTEN again' : 'keep: I meant to leave it'} onclick={(e) => keep(e.currentTarget, item?.kept !== true)} data-testid="aws-item-keep">{item.kept ? 'KEPT' : 'KEEP'}</button>
      {/if}
      <button type="button" class="tool" onclick={() => item && onopen(`item:${item.service}:${item.region}:${item.id}`)} data-testid="aws-console">↗ CONSOLE</button>
    </header>
    {#if item.attention.length > 0}
      <div class="findings">
        {#each item.attention as finding (finding.id)}
          <p data-weight={finding.weight}><span class="tag" data-weight={finding.weight}>{finding.tag}</span> {maskIn(finding.title, finding.names, masked)}</p>
        {/each}
      </div>
    {/if}
    <dl class="fields">
      {#if item.forgotten}
        <dt>quiet for</dt><dd class="mono" class:warn={item.forgotten.billed} data-testid="aws-item-quiet">{item.forgotten.quietFor} · {maskIn(item.forgotten.why, item.forgotten.names, masked)}</dd>
        <dt>seen by</dt><dd class="mono">{maskIn(item.forgotten.source, item.forgotten.names, masked)} · read {clockText(readAt)}</dd>
      {/if}
      {#each item.fields as field, i (i)}
        <dt>{field.label}</dt><dd class:mono={true}>{field.masked && masked ? MASKED : maskIn(field.value, [item.name], masked)}</dd>
      {/each}
    </dl>
    {#if item.related.length > 0}
      <div class="sep">related</div>
      {#each item.related as other (`${other.service}:${other.id}`)}
        <button type="button" class="rel" onclick={() => related(other.service, other.id)} data-testid="aws-related">
          <span class="svc">{DRILL[other.service].label}</span><span class="mono">{shownName(other.name, masked)}</span><span class="dim">{other.note}</span>
        </button>
      {/each}
    {/if}
    <div class="sep">history</div>
    {#if history === null}
      <button type="button" class="tool" onclick={() => void readHistory()} data-testid="aws-history">HISTORY · CloudTrail, free</button>
    {:else if history === 'failed'}
      <p class="none">CloudTrail did not answer (refused, or timed out) · <button type="button" class="tool" onclick={() => void readHistory()}>TRY AGAIN</button></p>
    {:else if history.length === 0}
      <p class="none">no write in CloudTrail's 90 days for this name</p>
    {:else}
      {#each history as event, i (i)}
        <p class="hist"><span class="mono">{dateCell(event.at, now)}</span><span>{masked ? MASKED : event.who}</span><span class="mono">{event.name}</span></p>
      {/each}
    {/if}
  </div>
{/if}

<style>
.drill { display: flex; flex-direction: column; gap: 0.4rem; min-height: 0; }
.gone { margin: 0; color: var(--warn); font-size: var(--step--1); }
.sweep { margin: 0; color: var(--text-dim); font-size: var(--step--1); }
.warn { color: var(--warn); }
.facets { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 0.4rem 1rem; }
.facets.narrow { grid-template-columns: 1fr; }
.facet { display: flex; flex-direction: column; gap: 0.12rem; }
.facet small { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }
.bar1 {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 7rem) minmax(0, 1fr) 2.4rem;
  align-items: center;
  gap: 0.4rem;
  padding: 0.05rem 0.2rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  cursor: pointer;
  text-align: left;
}
.bar1:hover { border-color: var(--panel-rule); color: var(--text); }
.bar1.on { border-color: var(--accent); color: var(--text); background: var(--accent-faint); }
.bar1 .v { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar1 .fill { height: 0.4rem; background: linear-gradient(90deg, var(--bar) calc(var(--share) * 100%), color-mix(in srgb, var(--accent) 10%, transparent) 0); }
.bar1 .n { text-align: right; }
.table { display: flex; flex-direction: column; outline: 0; }
.row {
  position: relative;
  display: grid;
  gap: 0.6rem;
  padding: 0.12rem 0.4rem 0.12rem 0.35rem;
  border-left: 2px solid transparent;
  font-size: var(--step--1);
}
.row[role='link'] { cursor: pointer; }
.row[role='link']:hover, .row:focus-visible { background: var(--accent-faint); outline: 1px solid var(--accent); outline-offset: -1px; }
.row:not(:focus-visible):hover { outline: 0; }
.row[data-weight='danger'] { border-left-color: var(--danger); }
.row[data-weight='warn'] { border-left-color: var(--warn); }
.row.head { border-bottom: 1px solid var(--panel-rule); }
.row.head button { background: transparent; border: 0; padding: 0; color: var(--text-muted); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-align: left; cursor: pointer; }
.row.head button.num { text-align: right; }
.row span { position: relative; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); color: var(--text-dim); }
.row span.lead { color: var(--text); }
.row span.num { text-align: right; }
.bg { position: absolute; inset: 0.15rem 0 0.15rem auto; width: calc(var(--share) * 100%); background: color-mix(in srgb, var(--accent) 12%, transparent); z-index: -1; }
.none { margin: 0.6rem 0; color: var(--text-dim); font-size: var(--step--1); }
.count { margin: 0; font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }
.one { outline: 0; gap: 0.3rem; }
.ihead { display: flex; align-items: center; gap: 0.7rem; }
.ihead b { font-family: var(--font-display); font-size: var(--step-1); font-weight: 500; color: var(--accent-strong); }
.state { display: inline-flex; align-items: center; gap: 0.3rem; font-size: var(--step--1); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-dim); }
.state i { width: 0.45rem; height: 0.45rem; transform: rotate(45deg); background: var(--text-muted); }
.state[data-state='running'] i, .state[data-state='available'] i, .state[data-state='in-use'] i { background: var(--ok); }
.state[data-state='stopped'] i { background: var(--warn); }
.spacer { flex: 1; }
.findings p { margin: 0.1rem 0; font-size: var(--step--1); }
.fields { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.1rem 1rem; margin: 0.2rem 0; font-size: var(--step--1); }
.fields dt { color: var(--text-muted); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; align-self: center; }
.fields dd { margin: 0; color: var(--text); overflow-wrap: anywhere; }
.mono { font-family: var(--font-mono); }
.rel { display: grid; grid-template-columns: 7rem minmax(0, 1fr) minmax(0, 1fr); gap: 0.6rem; padding: 0.12rem 0.35rem; border: 0; border-left: 2px solid transparent; background: transparent; color: var(--text); font-size: var(--step--1); text-align: left; cursor: pointer; }
.rel:hover, .rel:focus-visible { background: var(--accent-faint); }
.rel .svc { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); text-transform: uppercase; }
.dim { color: var(--text-dim); }
.hist { display: grid; grid-template-columns: 13rem 8rem minmax(0, 1fr); gap: 0.6rem; margin: 0.05rem 0; font-size: var(--step--1); color: var(--text-dim); }
</style>
