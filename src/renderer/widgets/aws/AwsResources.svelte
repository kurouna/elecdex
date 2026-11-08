<script lang="ts">
import type { ResourcesViewChoice } from '@shared/aws/board'
import { dayText } from '@shared/aws/facts'
import { TILE } from '@shared/aws/inventory'
import type {
  AwsList,
  AwsService,
  ForgottenRow,
  ResourcesView,
  ResourceTile,
} from '@shared/aws/types'
import { untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { keepRow } from './keep.ts'
import {
  alsoText,
  bedrockUse,
  billedLine,
  type Card,
  cardFoot,
  cardLabel,
  cardSlots,
  cardWord,
  deniedLine,
  elsewhereLine,
  figuresText,
  forgottenCard,
  forgottenHeading,
  forgottenMoney,
  forgottenShown,
  groupSpan,
  HOURLY_NOTE,
  maskIn,
  nearestBox,
  noneLine,
  notOfferedLine,
  PLACED_WORD,
  resourcesLayout,
  segmentShares,
  serviceCard,
  shownName,
  slotSpan,
  tileCard,
  tileDelta,
  tileGroups,
  tileMoney,
} from './resources-view.ts'

/**
 * RESOURCES (docs/aws.md §14.2), AWS STATUS's first tab: four figures, what looks forgotten, a
 * tile per service in groups, and the lines under them. Everything is main's (`board.resources`);
 * the page only words, masks and lays it out. Every figure, row, tile and line opens a step of
 * the drill-down through the widget, saying where it was pressed (`data-focus`) so Back can put
 * the focus there again.
 */
interface Props {
  res: ResourcesView
  boardKey: string
  /** The pane's regions, for the tiles' dots. */
  regions: readonly string[]
  /** The region chosen in the top row: LOOKS FORGOTTEN shows only its rows. */
  region: string | null
  masked: boolean
  width: number
  height: number
  /** The services as cards (the default) or as the detailed tiles (aws.md §14.12). */
  view: ResourcesViewChoice
  onview: (view: ResourcesViewChoice) => void
  /** Where the focus goes back to as the step above is left (null: nowhere). */
  focus: string | null
  onfocused: () => void
  ontab: (tab: 'active' | 'cost') => void
  onlist: (list: AwsList, from: string) => void
  onservice: (service: AwsService, from: string) => void
  onitem: (row: ForgottenRow, from: string) => void
  oncard: (id: string, target: HTMLElement, pointerX: number | null, make: () => Card) => void
  onleave: (id: string) => void
}

const {
  res,
  boardKey,
  regions,
  region,
  masked,
  width,
  height,
  view,
  onview,
  focus,
  onfocused,
  ontab,
  onlist,
  onservice,
  onitem,
  oncard,
  onleave,
}: Props = $props()

const lay = $derived(resourcesLayout(width, height))
const figures = $derived(figuresText(res, masked))
const rows = $derived(forgottenShown(res, region, lay.rows))
const groups = $derived(tileGroups(res))
const elsewhere = $derived(elsewhereLine(res, lay.countsOnly))
const billed = $derived(billedLine(res, lay.countsOnly))
const bedrock = $derived(res.bedrock === null ? null : bedrockUse(res.bedrock))
const cards = $derived(cardSlots(res))

let rootEl = $state<HTMLElement | null>(null)

// Back from the step below lands where it was pressed: the tile, the row, the figure or the line.
// Read once, as the step is shown: a press here sets it for the way back, not for now.
$effect(() => {
  if (rootEl === null) return
  const want = untrack(() => focus)
  if (want === null) return
  const target = [...rootEl.querySelectorAll<HTMLElement>('[data-focus]')].find(
    (el) => el.dataset.focus === want,
  )
  target?.focus()
  onfocused()
})

/** A card on focus only when the keyboard put it there: Back after a click leaves none up. */
function keyboardFocus(el: HTMLElement): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

function cardOn(id: string, event: PointerEvent | FocusEvent, make: () => Card): void {
  const target = event.currentTarget as HTMLElement
  if (event instanceof PointerEvent) oncard(id, target, event.clientX, make)
  else if (keyboardFocus(target)) oncard(id, target, null, make)
}

/* ---- LOOKS FORGOTTEN ---- */

/** The row leaves the list with the answer. */
const keep = (button: HTMLElement, row: ForgottenRow) =>
  keepRow(button, boardKey, row, true, masked)

/** Up and down between the rows, Enter opens one; the keep button inside keeps its own keys. */
function onRowKey(event: KeyboardEvent, row: ForgottenRow): void {
  if (event.target !== event.currentTarget) return
  const el = event.currentTarget as HTMLElement
  if (event.key === 'Enter') {
    event.preventDefault()
    onitem(row, `row:${row.key}`)
    return
  }
  const next =
    event.key === 'ArrowDown'
      ? el.nextElementSibling
      : event.key === 'ArrowUp'
        ? el.previousElementSibling
        : null
  if (next instanceof HTMLElement && next.dataset.frow !== undefined) {
    event.preventDefault()
    next.focus()
  }
}

/* ---- The tiles ---- */

/**
 * Arrows go to the nearest tile or card that way, across the groups; Enter opens the list. A
 * card is `card:` and a tile `tile:`, so Back finds the one of the view it left from.
 */
function onTileKey(
  event: KeyboardEvent,
  service: AwsService,
  kind: 'tile' | 'card' = 'tile',
): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    onservice(service, `${kind}:${service}`)
    return
  }
  if (rootEl === null || !event.key.startsWith('Arrow')) return
  const from = event.currentTarget as HTMLElement
  const tiles = [...rootEl.querySelectorAll<HTMLElement>(`[data-${kind}]`)].filter(
    (t) => t !== from,
  )
  const best = nearestBox(
    from.getBoundingClientRect(),
    tiles.map((t) => t.getBoundingClientRect()),
    event.key,
  )
  if (best === null) return
  event.preventDefault()
  tiles[best]?.focus()
}

const hourlyCard = (): Card => ({
  head: 'billed by the hour',
  side: 'list prices',
  rows: [{ label: 'counted', value: `${res.figures.billedByHour.count} resources` }],
  note: HOURLY_NOTE,
})

const regionDots = (tile: ResourceTile) =>
  regions.map((r) => ({ region: r, on: tile.regions.includes(r) }))

const VIEWS: readonly [ResourcesViewChoice, string][] = [
  ['cards', 'CARDS'],
  ['detail', 'DETAIL'],
]

/**
 * The switch blinks before the services change under it, as every choice that changes what is
 * shown does (lib/blink.ts). The buttons stay where they are, so the focus stays on the one
 * pressed (§14.12, 11).
 */
function pickView(button: HTMLElement, next: ResourcesViewChoice): void {
  if (next === view) return
  afterBlink(button, () => onview(next))
}
</script>

<div class="res" class:wide={lay.cols === 4} class:narrow={lay.cols === 2} data-testid="aws-resources" bind:this={rootEl}>
  <section class="figs" data-testid="aws-res-figures">
    <div class="mfig">
      <small>SERVICES</small><b class="big">{figures.services.big}</b>
      {#if lay.sublines}<span class="sub">{figures.services.sub}</span>{/if}
    </div>
    <button
      type="button"
      class="mfig lead"
      data-focus="fig:hourly"
      onclick={() => ontab('active')}
      onpointerenter={(e) => cardOn('res:hourly', e, hourlyCard)}
      onpointerleave={() => onleave('res:hourly')}
      onfocus={(e) => cardOn('res:hourly', e, hourlyCard)}
      onblur={() => onleave('res:hourly')}
      data-testid="aws-res-hourly"
    >
      <small>BILLED BY THE HOUR</small><b class="big">{figures.hourly.big}<small> / h</small></b>
      {#if lay.sublines}<span class="sub">{figures.hourly.sub}</span>{/if}
    </button>
    <button type="button" class="mfig lead" data-focus="fig:forgotten" onclick={() => onlist('forgotten', 'fig:forgotten')} data-testid="aws-res-forgotten">
      <small>LOOKS FORGOTTEN · BILLING</small><b class="big" class:warnfig={figures.forgotten.warn}>{figures.forgotten.big}</b>
      {#if lay.sublines}<span class="sub">{figures.forgotten.sub}</span>{/if}
    </button>
    <button type="button" class="mfig lead" data-focus="fig:new" onclick={() => onlist('new', 'fig:new')} data-testid="aws-res-new">
      <small>NEW · 7 D</small><b class="big">{figures.added.big}<small> {figures.added.small}</small></b>
      {#if lay.sublines}<span class="sub" data-testid="aws-res-newest">{figures.added.sub}</span>{/if}
    </button>
  </section>

  <div class="sep" data-testid="aws-forgotten-head">Looks forgotten <b>{forgottenHeading(res)}</b>{#if res.judging}<span class="judging">judging… (within 10 min)</span>{/if}</div>
  <div class="frows" role="list" aria-label="looks forgotten">
    {#each rows as row (row.key)}
      <!-- A row opens its resource; its keep button is a button of its own inside it. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="frow"
        data-weight={row.weight}
        data-frow=""
        data-focus="row:{row.key}"
        tabindex="0"
        role="link"
        onclick={() => onitem(row, `row:${row.key}`)}
        onkeydown={(e) => onRowKey(e, row)}
        onpointerenter={(e) => cardOn(`f:${row.key}`, e, () => forgottenCard(row, masked))}
        onpointerleave={() => onleave(`f:${row.key}`)}
        onfocus={(e) => cardOn(`f:${row.key}`, e, () => forgottenCard(row, masked))}
        onblur={() => onleave(`f:${row.key}`)}
        data-testid="aws-forgotten-row"
      >
        <span class="kd">{TILE[row.service].label}</span>
        <span class="nm">{shownName(row.name, masked)}</span>
        <span class="why">{maskIn(row.why, [row.name], masked)}</span>
        <span class="last">{row.quietFor}</span>
        <span class="usd">{forgottenMoney(row)}</span>
        <button type="button" class="keep" aria-label="keep: I meant to leave it" onclick={(e) => { e.stopPropagation(); keep(e.currentTarget, row) }} data-testid="aws-keep">keep</button>
      </div>
    {:else}
      <p class="rnone">{res.judging ? 'judging… (within 10 min): the usage metrics are read after the counts' : `Nothing looks forgotten · quiet means ${res.quietDays} days`}</p>
    {/each}
  </div>
  {#if res.forgottenTotal > rows.length}
    <div class="fmore">
      <span>{lay.countsOnly ? '' : `sorted by ≈ $ a month from now, quiet under ${res.quietDays} d lower · ${res.figures.forgotten.free} cost nothing now`}</span>
      <button type="button" data-focus="all" onclick={() => onlist('forgotten', 'all')} data-testid="aws-forgotten-all">all {res.forgottenTotal} ›</button>
    </div>
  {/if}

  {#if !lay.short}
    <div class="sep svc" data-testid="aws-services-head">Services <b>{res.figures.services}</b>
      <span class="vswitch" role="group" aria-label="how the services are shown">
        {#each VIEWS as [id, word] (id)}
          <button type="button" class:on={view === id} aria-pressed={view === id} onclick={(e) => pickView(e.currentTarget, id)} data-testid="aws-res-view-{id}">{word}</button>
        {/each}
      </span>
    </div>
  {/if}

  {#if !lay.short && view === 'cards'}
    <div class="rcards" data-testid="aws-cards">
      {#each cards as slot (`${slot.kind}:${slot.kind === 'card' ? slot.tile.service : slot.service}`)}
        {#if slot.kind === 'pending'}
          <div class="rcard skel" data-testid="aws-rcard-pending">
            <span class="hd"><span class="lb">{TILE[slot.service].label}</span></span>
            <span class="ratio"><b>–</b></span>
            <span class="u">reading…</span>
            <span class="ft"><span>first read ≤ 10 min</span></span>
          </div>
        {:else}
          {@const tile = slot.tile}
          {@const word = cardWord(tile, res.bedrock)}
          {@const foot = cardFoot(tile)}
          <button
            type="button"
            class="rcard"
            data-frame={tile.use.frame}
            data-card={tile.service}
            data-focus="card:{tile.service}"
            aria-label={cardLabel(tile, word)}
            onclick={() => onservice(tile.service, `card:${tile.service}`)}
            onkeydown={(e) => onTileKey(e, tile.service, 'card')}
            onpointerenter={(e) => cardOn(`c:${tile.service}`, e, () => serviceCard(tile, res))}
            onpointerleave={() => onleave(`c:${tile.service}`)}
            onfocus={(e) => cardOn(`c:${tile.service}`, e, () => serviceCard(tile, res))}
            onblur={() => onleave(`c:${tile.service}`)}
            data-testid="aws-rcard"
          >
            <span class="hd"><span class="lb">{tile.label}</span><span class="dl">{tileDelta(tile)}</span></span>
            <span class="ratio" class:none={tile.use.inUse === 0}><b data-testid="aws-rcard-ratio">{tile.use.inUse.toLocaleString('en-US')}</b><span class="of">/ {tile.use.total.toLocaleString('en-US')}</span></span>
            <span class="u">{word}</span>
            {#if foot !== null}
              <span class="ft" data-testid="aws-rcard-foot"><span class="rest">{foot.rest}</span>{#if foot.amount}<span class="r">{foot.amount}</span>{/if}</span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  {/if}

  {#if !lay.short && view === 'detail'}
    <div class="rgroups" class:dense={lay.dense} style:--cols={lay.dense ? lay.denseCols : lay.cols} data-testid="aws-tiles">
      {#each groups as g (g.group)}
        <div class="rgroup" style:grid-column="span {lay.dense ? lay.denseCols : groupSpan(g.slots, res.bedrock, lay.cols)}">
          <h6>{g.group}</h6>
          {#each g.slots as slot (slot.kind === 'tile' ? slot.tile.service : `p:${slot.service}`)}
            {#if slot.kind === 'pending'}
              <div class="rtile skel" data-testid="aws-tile-pending">
                <span class="hd"><span>{TILE[slot.service].label}</span></span>
                <span class="fig"><span class="n">·</span><span class="u">reading…</span></span>
                {#if !lay.dense}<span class="line"></span><span class="ft">first read within 10 min</span>{/if}
              </div>
            {:else}
              {@const tile = slot.tile}
              {@const two = !lay.dense && slotSpan(slot, res.bedrock) === 2 && lay.cols > 2}
              <button
                type="button"
                class="rtile"
                class:wide2={two}
                data-frame={tile.frame}
                data-tile={tile.service}
                data-focus="tile:{tile.service}"
                onclick={() => onservice(tile.service, `tile:${tile.service}`)}
                onkeydown={(e) => onTileKey(e, tile.service)}
                onpointerenter={(e) => cardOn(`t:${tile.service}`, e, () => tileCard(tile, regions))}
                onpointerleave={() => onleave(`t:${tile.service}`)}
                onfocus={(e) => cardOn(`t:${tile.service}`, e, () => tileCard(tile, regions))}
                onblur={() => onleave(`t:${tile.service}`)}
                data-testid="aws-tile"
              >
                <span class="hd">
                  <span class="lb">{tile.label}{#if two} · used 30 d · placed{/if}</span>
                  {#if !lay.dense}<span class="rgd">{#each regionDots(tile) as dot (dot.region)}<i class:on={dot.on}></i>{/each}</span>{/if}
                  <span class="dl" class:m={tile.removed > 0 && tile.added === 0}>{tileDelta(tile)}</span>
                </span>
                {#if two && res.bedrock !== null && bedrock !== null}
                  <span class="two">
                    <span class="models">
                      {#each bedrock.models as model (model.id)}
                        <span class="mn">{model.name}</span><span class="bar"><i style:width="{model.share * 100}%"></i></span><span class="n">{model.tokens}</span>
                      {/each}
                    </span>
                    <span class="placed">
                      {#each res.bedrock.placed.filter((p) => p.count > 0) as p (p.kind)}
                        <span>{PLACED_WORD[p.kind]}</span><b data-weight={p.weight}>{p.count}</b>
                      {/each}
                    </span>
                  </span>
                {:else}
                  <span class="fig"><span class="n">{tile.count.toLocaleString('en-US')}</span>{#if !lay.dense}<span class="u">{tile.noun}</span>{/if}</span>
                  <span class="line">
                    {#each segmentShares(tile) as s (s.label)}<i data-tone={s.tone} style:flex-grow={s.share}></i>{/each}
                  </span>
                  {#if !lay.dense && tile.legend.length > 0}
                    <span class="leg">{#each tile.legend as l (l.text)}<span data-tone={l.tone}>{l.text}</span>{/each}</span>
                  {/if}
                {/if}
                <span class="ft">
                  {#if tile.forgottenBilled > 0}<span class="fg" class:d={tile.frame === 'danger'}>{tile.forgottenBilled} forgotten?</span>{/if}
                  {#if tile.forgottenQuiet > 0}<span>{tile.forgottenQuiet} quiet</span>{/if}
                  {#if two && bedrock !== null}<span>{bedrock.totals}</span>{/if}
                  <span class="r">{tileMoney(tile)}</span>
                </span>
              </button>
            {/if}
          {/each}
        </div>
      {/each}
    </div>
  {/if}

  {#if !lay.short}
    {#if res.alsoHere.length > 0}
      <p class="rnone also" data-testid="aws-also-here">Also here:
        {#each res.alsoHere as also, i (also.service)}{#if i > 0}<span class="dot">{' · '}</span>{/if}<button type="button" data-focus="also:{also.service}" onclick={() => onservice(also.service, `also:${also.service}`)} data-testid="aws-also">{alsoText(also)}{#if also.note}<span class:danger={also.service === 'alarms' || also.service === 'stacks'}>{` (${also.note})`}</span>{/if}</button>{/each}
      </p>
    {/if}
    {#if res.none.length > 0}<p class="rnone" data-testid="aws-res-none">Checked, none here: {noneLine(res)}</p>{/if}
    {#if res.denied.length > 0}<p class="rnone" data-testid="aws-res-denied">Denied: <span class="denied">{deniedLine(res)}</span> · not counted (PARTIAL lists the operations)</p>{/if}
    {#if res.notOffered.length > 0}<p class="rnone">Not offered: {notOfferedLine(res)} · left out of the count</p>{/if}
    {#if elsewhere !== null}
      <button type="button" class="rline" data-focus="elsewhere" onclick={() => onlist('elsewhere', 'elsewhere')} data-testid="aws-elsewhere">
        <span class="k">ELSEWHERE</span><span class="m">{elsewhere}</span><span class="to">{lay.countsOnly ? '›' : `outside the ${regions.length} region${regions.length === 1 ? '' : 's'} shown · read ${dayText(res.elsewhere.readAt)} ›`}</span>
      </button>
    {/if}
    {#if billed !== null}
      <button type="button" class="rline i" data-focus="billed" onclick={() => ontab('cost')} data-testid="aws-billed-not-listed">
        <span class="k">BILLED, NOT LISTED</span><span class="m">{billed}</span><span class="to">{lay.countsOnly ? '› COST' : 'this month · not read here › COST'}</span>
      </button>
    {/if}
    {#if res.gmd.capReached}<p class="rnone warn" data-testid="aws-gmd-cap">GMD CAP REACHED · GetMetricData's monthly cap: quiet is judged by list-metrics' 14 days until the month ends</p>{/if}
  {/if}
</div>

<style>
.res { display: flex; flex-direction: column; min-width: 0; }
.figs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.4rem 0.8rem; padding: 0.3rem 0 0.35rem; }
.wide .figs { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.mfig { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; border: 0; border-left: 1px solid var(--panel-rule); padding: 0 0 0 0.6rem; background: transparent; color: inherit; font: inherit; text-align: left; }
.mfig small { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mfig.lead { cursor: pointer; }
.mfig.lead:hover .big, .mfig.lead:focus-visible .big { color: var(--text); }
.mfig.lead:focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }
.big { font-family: var(--font-display); font-size: var(--step-2); font-weight: 500; line-height: 1.05; color: var(--accent-strong); font-variant-numeric: tabular-nums; text-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--accent); white-space: nowrap; }
.big small { font-size: var(--step-0); color: var(--text-muted); text-shadow: none; letter-spacing: 0; }
.big.warnfig { color: var(--warn); text-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--warn); }
.sub { font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.judging { font-family: var(--font-mono); letter-spacing: 0; text-transform: none; color: var(--accent); }
.frows { display: flex; flex-direction: column; }
.frow { display: grid; grid-template-columns: 7rem minmax(6rem, 12rem) minmax(0, 1fr) 6rem 5rem 2.8rem; gap: 0.6rem; align-items: center; padding: 0.16rem 0.4rem; border-left: 2px solid var(--panel-rule); border-bottom: 1px solid var(--accent-faint); font-size: var(--step--1); cursor: pointer; }
.frow[data-weight='warn'] { border-left-color: var(--warn); }
.frow[data-weight='danger'] { border-left-color: var(--danger); }
.frow:hover, .frow:focus-visible { background: var(--accent-faint); outline: none; }
.frow .kd { font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; border: 1px solid var(--panel-rule); padding: 0 0.3rem; text-align: center; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.frow .nm { font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
/* The reason is what is read: the text's own colour and weight, only the edge carries the tone. */
.frow .why { color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.frow[data-weight='quiet'] .why { color: var(--text-dim); }
.frow .last { font-family: var(--font-mono); color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.frow .usd { font-family: var(--font-mono); text-align: right; white-space: nowrap; color: var(--text); }
.frow .keep { border: 1px solid var(--panel-rule); background: transparent; color: var(--text-dim); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; padding: 0 0.25rem; cursor: pointer; opacity: 0; }
.frow:hover .keep, .frow:focus-within .keep, .frow .keep:focus-visible { opacity: 1; }
.frow .keep:hover { color: var(--text); border-color: var(--accent); }
@container cloudview (max-width: 56rem) {
  .frow { grid-template-columns: 6rem minmax(6rem, 10rem) minmax(0, 1fr) 5rem 2.8rem; }
  .frow .last { display: none; }
}
@container cloudview (max-width: 32rem) {
  .frow { grid-template-columns: 4.6rem minmax(0, 1fr) 4.8rem; row-gap: 0; }
  .frow .why { grid-column: 2 / 4; grid-row: 2; }
  .frow .keep { display: none; }
}
.fmore { display: flex; justify-content: space-between; gap: 1rem; padding: 0.12rem 0.4rem; font-size: var(--step--1); color: var(--text-dim); }
.fmore button { border: 0; background: transparent; color: var(--text); font-family: var(--font-mono); font-size: var(--step--1); cursor: pointer; padding: 0; white-space: nowrap; }
.fmore button:hover, .fmore button:focus-visible { text-decoration: underline; }
.rnone { margin: 0.1rem 0; padding: 0 0.4rem; color: var(--text-dim); font-size: var(--step--1); overflow-wrap: anywhere; }
.rnone.warn { color: var(--warn); }
.rnone.also button { border: 0; background: transparent; padding: 0; cursor: pointer; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text); }
.rnone.also button:hover, .rnone.also button:focus-visible { text-decoration: underline; }
.rnone .denied { font-family: var(--font-mono); color: var(--warn); }
/* The services heading and its CARDS · DETAIL switch, at the right of its rule. */
.sep.svc::after { order: 1; }
.vswitch { display: inline-flex; order: 2; margin-left: auto; }
.vswitch button { border: 1px solid var(--panel-rule); background: transparent; color: var(--text-dim); font-family: var(--font-ui); font-size: var(--step--2); letter-spacing: var(--tracking-wide); padding: 0 0.45rem; cursor: pointer; }
.vswitch button + button { border-left: 0; }
.vswitch button.on { color: var(--text); background: var(--accent-faint); border-color: var(--accent-dim); }
.vswitch button:focus-visible { outline: 1px solid var(--accent); outline-offset: 1px; }
/* CARDS (aws.md §14.12): in use of all, a card a service, in the groups' fixed order. 13 rem is
   the narrowest card whose foot ("2 forgotten? · 1 stopped   ≈ $1.1k") is not cut. */
.rcards { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: 0.45rem; padding: 0.3rem 0 0.2rem; }
.narrow .rcards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.rcard { position: relative; display: flex; flex-direction: column; gap: 0.18rem; min-width: 0; padding: 0.32rem 0.5rem 0.36rem; border: 1px solid var(--panel-rule); background: transparent; color: var(--text); font-family: var(--font-ui); text-align: left; cursor: pointer; }
.rcard:hover, .rcard:focus-visible { background: var(--accent-faint); outline: 1px solid var(--accent); outline-offset: -1px; }
.rcard[data-frame='warn'] { border-color: color-mix(in srgb, var(--warn) 55%, transparent); }
.rcard[data-frame='danger'] { border-color: color-mix(in srgb, var(--danger) 60%, transparent); }
.rcard > span { display: flex; min-width: 0; }
.rcard > .hd { font-family: var(--font-mono); font-size: var(--step--1); letter-spacing: 0; text-transform: none; color: var(--text-muted); }
.rcard > .hd .dl { color: var(--text-dim); }
.ratio { align-items: baseline; gap: 0.3rem; }
.ratio b { font-family: var(--font-display); font-size: var(--step-2); font-weight: 500; line-height: 1; color: var(--accent-strong); font-variant-numeric: tabular-nums; }
.ratio .of { font-family: var(--font-display); font-size: var(--step-1); color: var(--text-dim); font-variant-numeric: tabular-nums; }
.ratio.none b { color: var(--text); }
.rcard > .u { display: block; font-size: var(--step--1); color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rcard > .ft { justify-content: space-between; gap: 0.4rem; border-top: 1px dashed var(--panel-rule); padding-top: 0.16rem; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); white-space: nowrap; }
.rcard > .ft > span { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.rcard > .ft .rest { color: var(--text); }
.rcard > .ft .r { flex: none; margin-left: auto; color: var(--text-dim); }
.rcard[data-frame='warn'] > .ft .r { color: var(--warn); }
.rcard[data-frame='danger'] > .ft .r { color: var(--danger); }
.rcard.skel .ratio b { color: var(--text-dim); }
.rcard.skel { cursor: default; }
.rgroups { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); grid-auto-flow: row dense; gap: 0.55rem 0.45rem; padding: 0.4rem 0 0.2rem; }
.rgroup { display: grid; grid-template-columns: subgrid; row-gap: 0.25rem; min-width: 0; align-content: start; }
.rgroup > h6 { grid-column: 1 / -1; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-weight: 400; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.rgroup > h6::after { content: ''; flex: 1; border-top: 1px dashed var(--panel-rule); }
.rtile { position: relative; display: flex; flex-direction: column; gap: 0.22rem; min-width: 0; padding: 0.3rem 0.5rem 0.32rem; border: 1px solid var(--panel-rule); background: transparent; color: var(--text); font-family: var(--font-ui); text-align: left; cursor: pointer; }
.rtile::before, .rtile::after { content: ''; position: absolute; width: 0.4rem; height: 0.4rem; border-color: var(--accent); border-style: solid; }
.rtile::before { left: -1px; top: -1px; border-width: 1px 0 0 1px; }
.rtile::after { right: -1px; bottom: -1px; border-width: 0 1px 1px 0; }
.rtile:hover, .rtile:focus-visible { background: var(--accent-faint); outline: none; }
.rtile[data-frame='warn'] { border-color: color-mix(in srgb, var(--warn) 55%, transparent); }
.rtile[data-frame='warn']::before, .rtile[data-frame='warn']::after { border-color: var(--warn); }
.rtile[data-frame='danger'] { border-color: color-mix(in srgb, var(--danger) 60%, transparent); }
.rtile[data-frame='danger']::before, .rtile[data-frame='danger']::after { border-color: var(--danger); }
.rtile.wide2 { grid-column: span 2; }
.rtile > span { display: flex; min-width: 0; }
.hd { justify-content: space-between; gap: 0.4rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }
.hd .lb { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hd .dl { font-family: var(--font-mono); letter-spacing: 0; color: var(--ok); white-space: nowrap; }
.hd .dl.m { color: var(--warn); }
.rgd { display: flex; align-items: center; gap: 0.28rem; }
.rgd i { width: 0.34rem; height: 0.34rem; transform: rotate(45deg); background: var(--panel-rule); }
.rgd i.on { background: var(--accent); }
.fig { align-items: baseline; gap: 0.35rem; }
.fig .n { font-family: var(--font-display); font-size: var(--step-2); line-height: 1; color: var(--accent-strong); font-variant-numeric: tabular-nums; }
.fig .u { font-size: var(--step--1); color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.line { height: 0.3rem; gap: 1px; background: var(--accent-faint); }
.line i { min-width: 2px; flex-basis: 0; background: color-mix(in srgb, var(--accent) 55%, transparent); }
.line i[data-tone='second'] { background: color-mix(in srgb, var(--accent) 30%, transparent); }
.line i[data-tone='off'] { background: var(--panel-rule); }
.line i[data-tone='warn'] { background: var(--warn); }
.line i[data-tone='danger'] { background: var(--danger); }
.leg { gap: 0 0.6rem; overflow: hidden; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); white-space: nowrap; }
.leg [data-tone='warn'] { color: var(--warn); }
.leg [data-tone='danger'] { color: var(--danger); }
.ft { align-items: center; gap: 0.5rem; border-top: 1px dashed var(--panel-rule); padding-top: 0.18rem; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); white-space: nowrap; }
.ft > span { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.ft .fg { flex: none; color: var(--warn); }
.ft .fg.d { color: var(--danger); }
.ft .r { flex: none; margin-left: auto; color: var(--text); }
.rtile > .two { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 0.7rem; }
.models { display: grid; grid-template-columns: minmax(0, 1fr) 3rem 3.2rem; gap: 0.1rem 0.4rem; align-items: center; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); }
.models .mn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.models .n { text-align: right; color: var(--text); }
.models .bar { position: relative; height: 0.3rem; background: var(--accent-faint); }
.models .bar i { position: absolute; inset: 0 auto 0 0; background: color-mix(in srgb, var(--accent) 55%, transparent); }
.placed { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.05rem 0.5rem; align-content: start; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); }
.placed span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.placed b { font-weight: 400; text-align: right; color: var(--text); }
.placed b[data-weight='danger'] { color: var(--danger); }
.placed b[data-weight='warn'] { color: var(--warn); }
.skel { cursor: default; }
.skel .fig .n, .skel .fig .u { color: var(--text-muted); }
.skel .line { height: 0; background: transparent; border-top: 1px dashed var(--panel-rule); }
/* A medium height: one dense line a service, so the figures, LOOKS FORGOTTEN and the tiles all
   show on the first screen (aws.md §14.2 C). */
.dense .rtile { display: grid; grid-template-columns: minmax(4.5rem, 1fr) minmax(0, max-content) minmax(1.5rem, 0.7fr) minmax(0, max-content); grid-template-areas: 'hd fig line ft'; column-gap: 0.6rem; align-items: center; padding: 0.14rem 0.45rem; }
.dense .hd { grid-area: hd; }
.dense .fig { grid-area: fig; }
.dense .fig .n { font-size: var(--step-0); }
.dense .line { grid-area: line; }
.dense .ft { grid-area: ft; overflow: hidden; border-top: 0; padding-top: 0; }
.rline { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.15rem 0.8rem; width: 100%; margin: 0.3rem 0 0.1rem; padding: 0.2rem 0.5rem; border: 1px solid var(--panel-rule); border-left: 2px solid var(--warn); background: transparent; color: var(--text); font-family: var(--font-ui); font-size: var(--step--1); text-align: left; cursor: pointer; }
.rline.i { border-left-color: var(--info); }
.rline:hover, .rline:focus-visible { background: var(--accent-faint); outline: none; }
.rline .k { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }
.rline .m { min-width: 0; font-family: var(--font-mono); overflow-wrap: anywhere; }
.rline .to { margin-left: auto; color: var(--text-dim); font-family: var(--font-mono); }
</style>
