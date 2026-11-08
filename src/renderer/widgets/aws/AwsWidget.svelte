<script lang="ts">
import { serviceLabel } from '@shared/aws/active'
import { CE_CAPS } from '@shared/aws/billing'
import {
  type AwsTab,
  awsBoardKey,
  type DrillFrom,
  type DrillPlace,
  itemOf,
  MAX_REGIONS,
  readAwsPane,
} from '@shared/aws/board'
import { DRILL } from '@shared/aws/drill'
import type {
  AttentionItem,
  AwsBoard,
  AwsList,
  AwsService,
  ForgottenRow,
  TrailEvent,
} from '@shared/aws/types'
import { afterBlink } from '../../lib/blink.ts'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import {
  anchorOf,
  type CardAnchor,
  type CardRow,
  type CardSize,
  cardTime,
  HoverRest,
} from '../../lib/hover-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import {
  ageText,
  clockText,
  ledgerLine,
  linkView,
  MASKED,
  periodText,
} from '../cloud/cloud-view.ts'
import IncidentBand from '../cloud/IncidentBand.svelte'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import AwsDrill from './AwsDrill.svelte'
import AwsResources from './AwsResources.svelte'
import AwsResourcesSettings from './AwsResourcesSettings.svelte'
import {
  ATTENTION_TAGS,
  accountLabel,
  awsBadge,
  capText,
  ceEstimate,
  dateCell,
  money,
  refusedPolicy,
  regionShort,
  regionTone,
} from './aws-view.ts'
import PulseBand from './PulseBand.svelte'
import {
  type Card,
  drillCrumb,
  FROM_CRUMB,
  gmdText,
  listPlace,
  maskIn,
  opensForgotten,
} from './resources-view.ts'

/**
 * AWS STATUS (docs/aws.md): what there is in one AWS account and what looks forgotten (RESOURCES,
 * the first tab), what needs someone, what runs and bills now, the month's cost, who changed
 * what, and the account's own settings - read through the user's own
 * AWS CLI, by main, only while a pane like this is seen. The page sends a board key and ids;
 * main builds every list, item and URL from its own last reading.
 */

const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const choices = $derived(readAwsPane(paneState))
const key = $derived(awsBoardKey(choices.spec))

let board = $state.raw<AwsBoard | null>(null)
let now = $state(Date.now())

$effect(() => {
  const k = key
  if (!visible) return
  return window.elecdex.aws.subscribe(k, (next) => {
    board = next
  })
})
$effect(() => {
  if (!visible) return
  now = Date.now()
  return onBoundary(60_000, () => {
    now = Date.now()
  })
})

const masked = $derived(choices.mask)
const link = $derived(linkView(board?.link ?? 'standby'))

$effect(() => {
  const b = board
  paneMeta.set(paneId, {
    subtitle: b === null ? choices.spec.profile : accountLabel(b, masked),
    ...(b === null ? {} : awsBadge(b, link)),
  })
})

function patch(change: Record<string, unknown>): void {
  widgetState.patch(paneId, change)
}

/* ---- Tabs, the region filter, the drill-down ---- */

let tagFilter = $state<string>('all')
let activityFilter = $state<'all' | 'writes' | 'logins' | 'errors'>('all')

/** RESOURCES, the default, is kept in the state as no tab at all (board.ts). */
const tabValue = (tab: AwsTab): AwsTab | undefined => (tab === 'resources' ? undefined : tab)

function selectTab(tab: AwsTab): void {
  sfx.play('panel')
  patch({ tab: tabValue(tab), drill: undefined, from: undefined })
}

const inRegion = <T extends { region: string | null }>(rows: readonly T[]): T[] =>
  choices.region === null
    ? [...rows]
    : rows.filter((row) => row.region === null || row.region === choices.region)

const attention = $derived(inRegion(board?.attention ?? []))
const shownAttention = $derived(
  tagFilter === 'all' ? attention : attention.filter((a) => a.tag === tagFilter),
)
const dangerCount = $derived(attention.filter((a) => a.weight === 'danger').length)
const warnCount = $derived(attention.filter((a) => a.weight === 'warn').length)

function drillTo(place: DrillPlace | null, from: DrillFrom = choices.from): void {
  patch({
    drill: place === null ? undefined : $state.snapshot(place),
    from: from === 'active' ? undefined : from,
    tab: tabValue(place === null ? choices.tab : from),
  })
}
function drillService(service: AwsService, from: DrillFrom = 'active'): void {
  sfx.play('expand')
  drillTo(
    { service, filters: choices.region ? { region: choices.region } : {}, sort: null, item: null },
    from,
  )
}

/**
 * Where RESOURCES was pressed (a tile, a row, a figure, a line), so that Back from the step
 * below puts the focus there again (aws.md §14.2). The page's own memory: a remount forgets it.
 */
let returnTo = $state<string | null>(null)

function fromResources(focus: string, place: DrillPlace): void {
  sfx.play('expand')
  returnTo = focus
  drillTo(place, 'resources')
}
const openList = (list: AwsList, focus: string) =>
  fromResources(focus, listPlace(list, choices.region))
const openTile = (service: AwsService, focus: string) =>
  fromResources(focus, {
    service,
    filters: choices.region ? { region: choices.region } : {},
    sort: null,
    item: null,
  })
// A LOOKS FORGOTTEN row is its resource at once; Back goes straight to RESOURCES (`direct`).
const openForgotten = (row: ForgottenRow, focus: string) =>
  fromResources(focus, {
    service: row.service,
    filters: {},
    sort: null,
    item: row.id,
    region: row.region,
    direct: true,
  })

function up(): void {
  const drill = choices.drill
  if (drill === null) return
  sfx.play('collapse')
  drillTo(drill.item === null || drill.direct ? null : { ...drill, item: null })
}
function onPaneKey(event: KeyboardEvent): void {
  if ((event.key === 'Escape' || event.key === 'Backspace') && choices.drill !== null) {
    const target = event.target as HTMLElement | null
    if (
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'INPUT' ||
      target?.tagName === 'SELECT'
    )
      return
    event.preventDefault()
    up()
  }
}

/** Whether an ATTENTION row leads somewhere: a resource, or the one line of what looks forgotten. */
const opens = (item: AttentionItem) => item.item !== null || opensForgotten(item)

function attentionOpen(item: AttentionItem): void {
  if (opensForgotten(item)) {
    sfx.play('expand')
    drillTo(listPlace('forgotten', null), 'resources')
    return
  }
  if (item.item === null) return
  sfx.play('expand')
  // The resource at once: Back goes straight to ATTENTION, as from a LOOKS FORGOTTEN row.
  drillTo(
    {
      service: item.item.service,
      filters: {},
      sort: null,
      item: item.item.id,
      ...(item.region !== null ? { region: item.region } : {}),
      direct: true,
    },
    'attention',
  )
}
function onRowKey(event: KeyboardEvent, run: () => void): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    run()
  }
}

/* ---- Opening, copying, refreshing ---- */

async function open(id: string): Promise<void> {
  sfx.play('panel')
  await window.elecdex.aws.open(key, id)
}

/** PARTIAL's ↗ IAM: the signed-in identity's permissions page, after the press's blink. */
function openPermissions(button: HTMLElement): void {
  afterBlink(button, () => void open('account:permissions'))
}

/**
 * The notices' COPY buttons: the sign-in command, and PARTIAL's policy. A press blinks its three
 * beats, as every choice does, before the label turns to COPIED.
 */
const copies = new CopyFlag()
$effect(() => () => copies.dispose())
function copyText(button: HTMLElement, which: 'signin' | 'policy', text: string): void {
  afterBlink(button, () => {
    void copies.through(which, async () => {
      const done = await window.elecdex.utility.copy({ kind: 'text', text })
      if (done) sfx.play('folder')
      return done
    })
  })
}

let waitUntil = $state(0)
/**
 * REFRESH blinks its three beats as every choice does, then asks: the button is disabled for the
 * wait main answers, which cut the held press's own blink to one beat.
 */
function pressRefresh(button: HTMLElement): void {
  if (now < waitUntil) return
  afterBlink(button, () => void refresh())
}
async function refresh(): Promise<void> {
  if (now < waitUntil) return
  sfx.play('panel')
  const left = await window.elecdex.aws.refresh(key)
  waitUntil = Date.now() + left
  now = Date.now()
  setTimeout(() => (now = Date.now()), left + 50)
}

/* ---- Cost Explorer's question, and the quota ---- */

let askMore = $state(false)
let askEvery = $state<'manual' | 'day' | '12h'>('day')
let askCap = $state(100)
const estimate = $derived(ceEstimate(askEvery, askCap))

async function answer(state: 'on' | 'off' | 'later'): Promise<void> {
  sfx.play('panel')
  await window.elecdex.aws.costExplorer(
    key,
    state === 'on' ? { state, every: askEvery, cap: askCap } : { state },
  )
  askMore = false
}

/**
 * An answer takes the question (or the line) away with it, so the press blinks its three beats
 * first, as every choice that changes what is shown does (lib/blink.ts): a click shorter than a
 * beat otherwise showed nothing at all.
 */
function choose(button: HTMLElement, state: 'on' | 'off' | 'later'): void {
  afterBlink(button, () => void answer(state))
}

let quotaText = $state('')
// Only when the stored amount changes: a reading arriving while one types must not undo it.
const storedQuota = $derived(board?.cost.quota.usd ?? 0)
$effect(() => {
  quotaText = storedQuota > 0 ? String(storedQuota) : ''
})
async function saveQuota(
  steps: '80-100' | '100' = board?.cost.quota.steps ?? '80-100',
): Promise<void> {
  const usd = Number(quotaText.replace(/[$,\s]/g, '') || '0')
  if (!Number.isFinite(usd) || usd < 0) return
  await window.elecdex.aws.quota(key, { usd, steps })
}

/* ---- Settings ---- */

let settingsOpen = $state(false)
let profiles = $state<string[]>([])
$effect(() => {
  if (!settingsOpen) return
  void window.elecdex.aws.profiles().then((names) => {
    profiles = names
  })
})
const REGION_CHOICES = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
]
function toggleRegion(region: string): void {
  const set = new Set(choices.spec.regions)
  if (set.has(region)) set.delete(region)
  else if (set.size < MAX_REGIONS) set.add(region)
  patch({ regions: set.size === 0 ? undefined : [...set], region: undefined })
}
const incidents = $derived(appearance.settings.aws.incidents)
function setIncidents(change: Partial<typeof incidents>): void {
  void appearance.patch({ aws: { incidents: { ...incidents, ...change } } })
}

/* ---- Cards ---- */

let rootEl = $state<HTMLElement | null>(null)
let hover = $state.raw<{
  rows: CardRow[]
  head: string
  side: string
  note: string | null
  anchor: CardAnchor
  bounds: CardSize
} | null>(null)
const resting = new HoverRest<string>(() => (hover = null))

function card(id: string, target: HTMLElement, pointerX: number | null, make: () => Card): void {
  resting.enter(
    id,
    () => {
      if (rootEl === null) return
      const box = rootEl.getBoundingClientRect()
      hover = {
        ...make(),
        anchor: anchorOf(box, target.getBoundingClientRect(), pointerX),
        bounds: { width: box.width, height: box.height },
      }
    },
    pointerX === null,
  )
}
const leave = (id: string) => resting.leave(id)
$effect(() => {
  if (!visible) resting.leave()
})
/** The view shown: a tab, or a place of the drill-down. */
const viewKey = $derived(
  `${choices.tab}:${choices.drill?.service ?? ''}:${choices.drill?.item ?? ''}`,
)
/**
 * What the view is mounted for: a tab, or a service's drill-down. A list and its item are one
 * mount, so the list is not asked for again on every step and "gone since" survives the step
 * back; AwsDrill powers each step on itself.
 */
const mountKey = $derived(`${choices.tab}:${choices.drill?.service ?? ''}`)
// A press that opens another view (a tile, a row, a figure) takes away the element under the
// pointer, and an element taken away sends no pointerleave: its card goes with the view.
$effect(() => {
  void viewKey
  resting.leave()
})
$effect(() => () => resting.dispose())

function attentionCard(item: AttentionItem) {
  return {
    head: `${item.tag}${item.region ? ` · ${item.region}` : ''}`,
    side: cardTime(item.since),
    rows: [
      {
        label: 'opens',
        value: opensForgotten(item)
          ? 'RESOURCES › FORGOTTEN: each one, with what it was judged by'
          : item.item === null
            ? 'the account (no resource)'
            : `${DRILL[item.item.service].label}: the resource's page in this pane`,
      },
    ],
    note: item.why,
  }
}
function serviceCard(service: AwsBoard['active']['services'][number]) {
  return {
    head: service.label,
    side: service.monthly === null ? 'usage-based' : `${money(service.monthly)} / month`,
    rows: service.top.map((t) => ({
      // Every service's names, as on RESOURCES and in the drill-down (MASK hides them all).
      label: masked ? MASKED : t.name,
      value: `${t.detail} · ${money(t.monthly)}`,
    })),
    note:
      service.monthly === null
        ? 'Billed by use only: not estimated here. COST has the real amount.'
        : 'The biggest five, at list prices.',
  }
}
/** The ledger card's GetMetricData line: counted by the metric, under its monthly cap (§14.4a). */
function gmdRows(): CardRow[] {
  const gmd = board?.resources.gmd
  if (gmd === undefined || (!gmd.on && gmd.used === 0)) return []
  return [
    {
      label: 'GetMetricData',
      value: `${gmdText(gmd)}${gmd.capReached ? ' · GMD CAP REACHED' : ''}`,
    },
  ]
}
const ESTIMATE_NOTE =
  'On-Demand list prices for what is switched on. Savings Plans, RIs, the free tier, discounts, data transfer and requests are left out. The bill is under COST.'

let pulseTip = $state<{ text: string; x: number } | null>(null)
function onBin(index: number | null, x: number): void {
  const bin = index === null ? undefined : board?.pulse?.[index]
  if (bin === undefined) {
    pulseTip = null
    return
  }
  pulseTip = {
    text: `${clockText(bin.at)} · ${bin.writes} writes · ${bin.logins} sign-ins${bin.errors ? ` · ${bin.errors} errors` : ''}`,
    x,
  }
}

const activity = $derived(
  inRegion(board?.activity ?? []).filter((e: TrailEvent) =>
    activityFilter === 'all'
      ? true
      : activityFilter === 'logins'
        ? e.login !== null
        : activityFilter === 'errors'
          ? e.error !== null || e.mark === 'failed'
          : e.login === null,
  ),
)
const alarmStarts = $derived(
  (board?.attention ?? []).filter((a) => a.tag === 'ALARM').map((a) => a.since),
)

let width = $state(1000)
let height = $state(600)
function observe(node: HTMLElement): () => void {
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box === undefined) return
    width = box.width
    height = box.height
  })
  observer.observe(node)
  return () => observer.disconnect()
}
const narrow = $derived(width < 32 * 16)
const short = $derived(height < 30 * 16)
const budget = $derived(board?.cost.budgets[0] ?? null)
const total = $derived(board?.active.perMonth ?? 0)
const crumbsFrom = $derived(FROM_CRUMB[choices.from])
/** The item the crumbs end with: its name is not known here, its id's last part is. */
const crumbItem = $derived(choices.drill === null ? null : itemOf(choices.drill))
const TABS: readonly [AwsTab, string][] = [
  ['resources', 'RESOURCES'],
  ['attention', 'ATTENTION'],
  ['active', 'ACTIVE'],
  ['cost', 'COST'],
  ['activity', 'ACTIVITY'],
  ['account', 'ACCOUNT'],
]
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="aws cloudpane" class:narrow data-testid="aws" data-pane-id={paneId} bind:this={rootEl} onkeydown={onPaneKey} {@attach observe}>
  <SettingsButton open={settingsOpen} label="aws status settings" testid="aws-settings-toggle" ontoggle={() => (settingsOpen = !settingsOpen)} />
  <header class="top" data-testid="aws-top">
    <span class="link" data-tone={link.tone} data-testid="aws-link"><i></i>{link.word}</span>
    {#if board !== null && board.link !== 'no-cli'}
      <button type="button" class="figure" onclick={() => { tagFilter = 'ALARM'; selectTab('attention') }} data-testid="aws-alarms">
        <small>ALARMS</small><span class:danger={board.alarms > 0} class:dim={board.alarms === 0}>{board.alarms}</span>
      </button>
      <button type="button" class="figure" onclick={() => { tagFilter = 'all'; selectTab('attention') }} data-testid="aws-attention-count">
        <small>ATTENTION</small><span><b class="danger">{dangerCount}</b> · <b class="warn">{warnCount}</b></span>
      </button>
      <button type="button" class="figure" onclick={() => selectTab('cost')} data-testid="aws-mtd">
        <small>MTD</small>
        <span>
          {#if board.cost.mtd === null}{board.cost.billing ? '—' : 'billing alerts off'}{:else}{money(board.cost.mtd, false)}{#if !narrow && budget !== null && budget.forecast !== null} · <b class:warn={budget.forecast > budget.limit}>forecast {Math.round((budget.forecast / budget.limit) * 100)}% of budget</b>{/if}{#if board.cost.quota.share !== null} · <b class:warn={board.cost.quota.share >= 0.8} class:danger={board.cost.quota.share >= 1}>{Math.round(board.cost.quota.share * 100)}% of quota</b>{/if}{/if}
        </span>
      </button>
      {#if board.regions.length > 1}
        <span class="rsel" role="group" aria-label="region">
          <button type="button" aria-pressed={choices.region === null} onclick={() => patch({ region: undefined })}>ALL</button>
          {#each board.regions as region (region)}
            <button type="button" aria-pressed={choices.region === region} onclick={() => patch({ region })} data-testid="aws-region">
              <i data-tone={regionTone(board.attention, region) ?? 'none'}></i>{narrow ? '' : regionShort(region)}
            </button>
          {/each}
        </span>
      {/if}
    {/if}
    <span class="spacer"></span>
    <button type="button" class="tool" class:on={masked} aria-pressed={masked} onclick={() => patch({ mask: masked ? undefined : true })} data-testid="aws-mask">MASK</button>
    <button type="button" class="tool" disabled={now < waitUntil} onclick={(e) => pressRefresh(e.currentTarget)} data-testid="aws-refresh">REFRESH</button>
  </header>

  {#if board?.link === 'signed-out' && board.signIn !== null}
    <div class="notice crt-on" role="status" data-testid="aws-signin">
      <span>The profile <b>{board.profile}</b> is signed out, or its credentials expired. Sign in from a shell; the pane reads again at REFRESH.</span>
      <code>{board.signIn}</code>
      <button type="button" class="tool" onclick={(e) => board?.signIn != null && copyText(e.currentTarget, 'signin', board.signIn)}>{copies.key === 'signin' ? 'COPIED' : 'COPY'}</button>
    </div>
  {:else if board?.credentialProcess}
    <div class="notice crt-on quiet" role="status" data-testid="aws-credential-process">
      <span>The profile <b>{board.profile}</b> signs in through credential_process: every AWS CLI start runs it, and it may open a window. Read only while this pane is shown.</span>
    </div>
  {:else if board !== null && board.denied.length > 0}
    <div class="notice crt-on quiet" role="status" data-testid="aws-denied">
      <span class="denied">PARTIAL · this role may not read: <span class="ops">{#each board.denied as op (op)}<span class="op">{op}</span>{/each}</span>. The rest is read.</span>
      <button type="button" class="tool" aria-label="copy an IAM policy that allows these reads" onclick={(e) => board && copyText(e.currentTarget, 'policy', refusedPolicy(board.denied))} data-testid="aws-copy-policy">{copies.key === 'policy' ? 'COPIED' : 'COPY POLICY'}</button>
      <button type="button" class="tool" aria-label="open the permissions of the signed-in identity in the IAM console" onclick={(e) => openPermissions(e.currentTarget)} data-testid="aws-open-iam">↗ IAM</button>
    </div>
  {/if}

  {#if board?.link === 'no-cli'}
    <div class="empty" data-testid="aws-nocli">
      <b class="danger">NO CLI</b>
      <span>AWS CLI v2 (aws) was not found on PATH or in its install folders.</span>
      <span>Install it and sign in (aws login, or aws sso login), then restart elecdex.</span>
      <code>winget install Amazon.AWSCLI</code>
    </div>
  {:else}
    <IncidentBand incidents={board?.incidents ?? []} source="AWS" {now} onopen={(id) => void open(`incident:${id}`)} />

    {#if board?.cost.ce.ask && board.account !== null}
      <div class="ask crt-on" transition:crtPower data-testid="aws-ce-ask">
        <div class="ask-line">
          <span>Cost Explorer for <b>{masked ? MASKED : (board.account.alias ?? board.account.id)}</b>: turn on? <span class="dim">paid, $0.01 a request</span></span>
          <button type="button" class="tool" onclick={(e) => choose(e.currentTarget, 'on')} data-testid="aws-ce-on">TURN ON</button>
          <button type="button" class="tool" onclick={(e) => choose(e.currentTarget, 'off')} data-testid="aws-ce-off">KEEP OFF</button>
          {#if !narrow}<button type="button" class="tool" onclick={(e) => choose(e.currentTarget, 'later')} data-testid="aws-ce-later">LATER</button>{/if}
          {#if !narrow}<button type="button" class="tool" aria-expanded={askMore} onclick={() => (askMore = !askMore)}>{askMore ? '▾' : '▸'} more</button>{/if}
        </div>
        {#if askMore}
          <p class="ask-text">It adds the real amount by usage type and region, and AWS's forecast. Needs Cost Explorer enabled in the Billing console (for a member account, by the payer) and ce:GetCostAndUsage.</p>
          <div class="opt"><span>How often</span>
            <span class="seg">{#each [['manual', 'MANUAL'], ['day', 'ONCE A DAY'], ['12h', 'EVERY 12 H']] as [id, label] (id)}<button type="button" class="tool" class:on={askEvery === id} onclick={() => (askEvery = id as typeof askEvery)}>{label}</button>{/each}</span>
          </div>
          <div class="opt"><span>Monthly cap</span>
            <span class="seg">{#each CE_CAPS as cap (cap)}<button type="button" class="tool" class:on={askCap === cap} onclick={() => (askCap = cap)}>{capText(cap)}</button>{/each}</span>
          </div>
          <p class="ask-text">≈ {estimate.requests} requests · ${estimate.usd.toFixed(2)} a month{#if estimate.stopsOn !== null} · <b class="warn">the cap would stop it around day {estimate.stopsOn}</b>{/if}</p>
          <p class="ask-text">Keep off: never asked again for this account. Later: asked again the next time elecdex starts. Either way, ⚙ changes it.</p>
        {/if}
      </div>
    {:else if board?.cost.ce.state === 'refused' && board.cost.ce.refusedWhy}
      <div class="notice quiet" role="status" data-testid="aws-ce-refused"><span>{board.cost.ce.refusedWhy}</span></div>
    {/if}

    {#if choices.pulse && !short && board?.pulse}
      <section class="band" data-testid="aws-pulse">
        <div class="phead"><small>ACCOUNT PULSE · 24 H</small>{#if !narrow}<small class="legend"><span class="w">writes</span><span class="e">errors</span><span class="l">sign-ins</span><span>CloudTrail ~5 min late</span></small>{/if}</div>
        <PulseBand bins={board.pulse} alarms={alarmStarts} onbin={onBin} />
        {#if pulseTip !== null}<span class="tip" role="status">{pulseTip.text}</span>{/if}
      </section>
    {/if}

    <div class="tabs" role="tablist" aria-label="aws status">
      {#each TABS as [id, label] (id)}
        <button type="button" role="tab" aria-selected={choices.drill === null ? choices.tab === id : choices.from === id} onclick={() => selectTab(id)} data-testid="aws-tab-{id}">{label}{#if id === 'attention'}<em>{attention.length}</em>{/if}</button>
      {/each}
    </div>

    {#if choices.drill !== null}
      <div class="bar crumbs" data-testid="aws-crumbs">
        <button type="button" class="back" onclick={up} aria-label="back a step">‹</button>
        <button type="button" onclick={() => drillTo(null)}>{crumbsFrom}</button><span class="gt">›</span>
        <button type="button" onclick={() => { if (!choices.drill) return; const { direct: _direct, ...rest } = choices.drill; drillTo({ ...rest, item: null }) }}>{drillCrumb(choices.drill)}</button>
        {#each Object.entries(choices.drill.filters) as [k, v] (k)}
          <button type="button" class="chip on" onclick={() => { if (!choices.drill) return; const { [k]: _gone, ...rest } = choices.drill.filters; drillTo({ ...choices.drill, filters: rest }) }}>{k}: {v} ×</button>
        {/each}
        {#if crumbItem !== null}<span class="gt">›</span><span class="here">{masked ? MASKED : crumbItem.id.split('/').at(-1)}</span>{/if}
      </div>
    {:else if choices.tab === 'attention' && board !== null}
      <div class="bar">
        {#each ['all', ...ATTENTION_TAGS.filter((t) => attention.some((a) => a.tag === t))] as t (t)}
          <button type="button" class="chip" class:on={tagFilter === t} aria-pressed={tagFilter === t} onclick={() => (tagFilter = t)}>{t}{#if t !== 'all'}<em>{attention.filter((a) => a.tag === t).length}</em>{/if}</button>
        {/each}
      </div>
    {:else if choices.tab === 'activity' && board?.activity}
      <div class="bar">
        {#each ['all', 'writes', 'logins', 'errors'] as f (f)}
          <button type="button" class="chip" class:on={activityFilter === f} aria-pressed={activityFilter === f} onclick={() => (activityFilter = f as typeof activityFilter)}>{f}</button>
        {/each}
      </div>
    {/if}

    {#key mountKey}
      <div class="view crt-on" data-testid="aws-view-{choices.drill === null ? choices.tab : 'drill'}" onscroll={() => resting.leave()}>
        {#if board === null}
          <p class="empty">…</p>
        {:else if choices.drill !== null}
          <AwsDrill boardKey={key} place={choices.drill} readAt={board.readAt} revision={board.revision} sweptAt={board.resources.elsewhere.readAt} {masked} {now} {narrow} onplace={(next) => drillTo(next)} onopen={(id) => void open(id)} />
        {:else if choices.tab === 'resources'}
          <AwsResources
            res={board.resources}
            boardKey={key}
            regions={board.regions}
            region={choices.region}
            {masked}
            {width}
            {height}
            view={choices.resView}
            onview={(next) => patch({ resView: next === 'detail' ? 'detail' : undefined })}
            focus={returnTo}
            onfocused={() => (returnTo = null)}
            ontab={(tab) => selectTab(tab)}
            onlist={openList}
            onservice={openTile}
            onitem={openForgotten}
            oncard={card}
            onleave={leave}
          />
        {:else if choices.tab === 'attention'}
          {#if shownAttention.length === 0}
            <div class="empty"><b class="ok">NOTHING NEEDS ATTENTION</b><span>{board.checks} checks across {board.regions.length} region{board.regions.length === 1 ? '' : 's'} · read {clockText(board.readAt)}</span></div>
          {:else}
            {#each shownAttention as item (item.id)}
              <!-- A row about a resource is a link into the drill-down; one about the account is not. -->
              <!-- svelte-ignore a11y_no_static_element_interactions, a11y_no_noninteractive_tabindex -->
              <div
                class="row a"
                data-weight={item.weight}
                tabindex={opens(item) ? 0 : undefined}
                role={opens(item) ? 'link' : 'listitem'}
                onclick={() => attentionOpen(item)}
                onkeydown={(e) => onRowKey(e, () => attentionOpen(item))}
                onpointerenter={(e) => card(item.id, e.currentTarget as HTMLElement, e.clientX, () => attentionCard(item))}
                onpointerleave={() => leave(item.id)}
                onfocus={(e) => card(item.id, e.currentTarget as HTMLElement, null, () => attentionCard(item))}
                onblur={() => leave(item.id)}
                data-testid="aws-attention-row"
              >
                <span class="tag" data-weight={item.weight}>{item.tag}</span>
                <span class="title">{maskIn(item.title, item.names, masked)}</span>
                <span class="repo">{item.region ? regionShort(item.region) : 'global'}</span>
                <span class="age">{ageText(item.since, now)}</span>
              </div>
            {/each}
          {/if}
        {:else if choices.tab === 'active'}
          <section class="meter" data-testid="aws-meter">
            <div class="figure big"><small>NOW</small><b>{money(board.active.perHour)}<small> / h</small></b></div>
            <div class="figure big"><small>AT THIS RATE</small><b>{money(board.active.perMonth)}<small> / month</small></b></div>
            {#if !narrow && board.cost.mtd !== null}<div class="figure big dimfig"><small>BILLING METRIC THIS MONTH</small><b>{money(board.cost.mtd, false)}</b></div>{/if}
          </section>
          <div class="stack" role="group" aria-label="by service">
            {#each board.active.services.filter((s) => (s.monthly ?? 0) > 0) as service (service.service)}
              <button type="button" class="seg1" style:flex-grow={(service.monthly ?? 0) / (total || 1)} onclick={() => drillService(service.service)} aria-label="{service.label} {money(service.monthly)}"><span>{service.label}</span></button>
            {/each}
          </div>
          {#if board.changes !== null}
            <p class="changes" data-testid="aws-changes">
              {#each board.changes.parts as part (part.service)}
                <span>{#if part.added.length}<b class="ok">+{part.added.length}</b>{/if}{#if part.removed.length}<b class="warn">−{part.removed.length}</b>{/if} {serviceLabel(part.service)} <span class="dim">({masked ? MASKED : [...part.added, ...part.removed].slice(0, 3).join(', ')})</span></span>
              {/each}
              <span class="dim">since {clockText(board.changes.since)}</span>
            </p>
          {/if}
          {#each board.active.services as service (service.service)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="row s"
              tabindex="0"
              role="link"
              data-weight={service.waste > 0 || service.idle > 0 ? 'warn' : undefined}
              onclick={() => drillService(service.service)}
              onkeydown={(e) => onRowKey(e, () => drillService(service.service))}
              onpointerenter={(e) => card(`svc:${service.service}`, e.currentTarget as HTMLElement, e.clientX, () => serviceCard(service))}
              onpointerleave={() => leave(`svc:${service.service}`)}
              data-testid="aws-active-row"
            >
              <span class="title">{service.label}</span>
              <span class="mono">{service.count}</span>
              <span class="flags">{#if service.idle}<b class="warn">{service.idle} IDLE</b>{/if}{#if service.waste}<b class="warn">{service.waste} WASTE</b>{/if}</span>
              <span class="meterbar"><i style:--share={(service.monthly ?? 0) / Math.max(1, ...board.active.services.map((s) => s.monthly ?? 0))}></i></span>
              <span class="mono right">{service.monthly === null ? 'usage-based' : money(service.monthly)}</span>
            </div>
          {/each}
          {#if board.active.quiet.length > 0}<p class="quietline">NOT BILLING NOW · {board.active.quiet.join(' · ')}</p>{/if}
        {:else if choices.tab === 'cost'}
          {#if !board.cost.billing && board.cost.mtd === null}
            <div class="empty"><b class="warn">BILLING ALERTS ARE OFF</b><span>Billing preferences → Receive CloudWatch billing alerts (free). Budgets still show.</span><button type="button" class="tool" onclick={() => void open('account:billingPreferences')}>BILLING PREFERENCES ↗</button></div>
          {/if}
          <section class="facts">
            <div><small>THIS MONTH (UTC)</small><b>{money(board.cost.mtd, false)}</b></div>
            <div><small>LAST MONTH, SAME DAY</small><b>{money(board.cost.lastSameDay, false)}</b></div>
            <div><small>STRAIGHT LINE TO MONTH END</small><b>{money(board.cost.projected)}</b></div>
            {#if board.cost.ce.forecast !== null}<div><small>AWS FORECAST</small><b>{money(board.cost.ce.forecast, false)}</b></div>{/if}
          </section>
          {#each board.cost.budgets as b (b.name)}
            <div class="gauge" data-testid="aws-budget"><span>budget · {masked ? MASKED : b.name}</span><span class="track"><i style:--share={Math.min(1, b.actual / (b.limit || 1))}></i>{#if b.forecast !== null}<em style:--share={Math.min(1, b.forecast / (b.limit || 1))}></em>{/if}</span><span class="mono">{money(b.actual, false)} of {money(b.limit, false)}</span></div>
          {/each}
          <div class="gauge" data-testid="aws-quota">
            <span>quota · elecdex's own</span>
            <span class="track"><i style:--share={Math.min(1, board.cost.quota.share ?? 0)} class:warn={(board.cost.quota.share ?? 0) >= 0.8}></i>{#if board.cost.quota.steps === '80-100'}<s style:--at="0.8"></s>{/if}</span>
            <span class="qset"><input type="text" inputmode="decimal" placeholder="USD, 0 = off" bind:value={quotaText} onchange={() => void saveQuota()} disabled={board.cost.quota.unavailable !== null} aria-label="cost quota in USD" data-testid="aws-quota-input" /></span>
          </div>
          {#if board.cost.quota.unavailable}<p class="ask-text">{board.cost.quota.unavailable}</p>{/if}
          <div class="sep">by service · {board.cost.ce.services ? 'Cost Explorer, to yesterday' : 'the billing metric'}</div>
          {#each board.cost.ce.services ?? board.cost.services as s (s.name)}
            <div class="row c"><span class="title">{s.name}</span><span class="meterbar"><i style:--share={s.usd / Math.max(1, ...(board.cost.ce.services ?? board.cost.services).map((x) => x.usd))}></i></span><span class="mono right">{money(s.usd, false)}</span></div>
          {:else}
            <p class="ask-text">No service reported yet this month.</p>
          {/each}
          {#if board.cost.ce.state !== 'on'}
            <p class="ask-text" data-testid="aws-ce-off-line">Cost Explorer is off · about ${ceEstimate('day', 100).usd.toFixed(2)} a month at once a day. <button type="button" class="tool" onclick={(e) => choose(e.currentTarget, 'on')}>TURN ON</button></p>
          {:else}
            <p class="ask-text">Cost Explorer: {board.cost.ce.usedThisMonth} of {board.cost.ce.cap} requests this month · read {clockText(board.cost.ce.readAt)}</p>
          {/if}
          <p class="ask-text">Tags and per-resource amounts need the Cost and Usage Report. <button type="button" class="tool" onclick={() => void open('account:billing')}>BILLING CONSOLE ↗</button></p>
        {:else if choices.tab === 'activity'}
          {#if board.activity === null}
            <div class="empty"><b class="dim">ACTIVITY IS OFF</b><span>CloudTrail is not read for this pane (⚙).</span></div>
          {:else if activity.length === 0}
            <div class="empty"><b class="ok">QUIET</b><span>no write in CloudTrail's last 50 per region</span></div>
          {:else}
            {#each activity as event (event.id)}
              <div class="row t" data-weight={event.mark === 'root' || event.mark === 'failed' || event.mark === 'denied' ? 'danger' : event.mark ? 'warn' : undefined} data-testid="aws-activity-row">
                <span class="age">{clockText(event.at)}</span>
                <span class="repo">{masked ? MASKED : event.who}</span>
                <span class="title">{event.name}{#if event.login} · {event.login.ok ? 'signed in' : 'sign-in failed'}{event.login.mfa ? '' : ' · no MFA'}{/if}{#if event.error} · <b class="danger">{event.error}</b>{/if}</span>
                <span class="repo">{regionShort(event.region)}</span>
              </div>
            {/each}
            {#if board.activityCapped}<p class="quietline">50 shown a region · older ones not read</p>{/if}
          {/if}
        {:else if choices.tab === 'account'}
          <section class="facts">
            <div><small>ACCOUNT</small><b class="mono">{masked ? MASKED : (board.account?.id ?? '—')}</b></div>
            <div><small>ALIAS</small><b>{masked ? MASKED : (board.account?.alias ?? '—')}</b></div>
            <div><small>USERS · ROLES</small><b>{board.accountView.users ?? '—'} · {board.accountView.roles ?? '—'}</b></div>
          </section>
          <dl class="acct">
            <dt>signed in as</dt><dd class="mono">{masked ? MASKED : (board.account?.arn ?? '—')}</dd>
            <dt>root MFA</dt><dd class:danger={board.accountView.rootMfa === false}>{board.accountView.rootMfa === null ? '—' : board.accountView.rootMfa ? 'on' : 'OFF'}</dd>
            <dt>root access keys</dt><dd class:danger={board.accountView.rootKeys === true}>{board.accountView.rootKeys === null ? '—' : board.accountView.rootKeys ? 'present' : 'none'}</dd>
            <dt>root last signed in</dt><dd>{board.accountView.rootUsedAt === null ? 'never' : dateCell(board.accountView.rootUsedAt, now)}</dd>
            <dt>console without MFA</dt><dd class:warn={board.accountView.mfaLessUsers.length > 0}>{board.accountView.mfaLessUsers.length === 0 ? 'none' : masked ? `${board.accountView.mfaLessUsers.length} users` : board.accountView.mfaLessUsers.join(', ')}</dd>
            <dt>keys over 90 days</dt><dd class:warn={board.accountView.oldKeys.length > 0}>{board.accountView.oldKeys.length === 0 ? 'none' : board.accountView.oldKeys.map((k) => `${masked ? MASKED : k.user} ${k.days}d`).join(', ')}</dd>
            <dt>GuardDuty</dt><dd>{board.accountView.guardduty === null ? 'not enabled, or not readable' : `high ${board.accountView.guardduty.high} · medium ${board.accountView.guardduty.medium} · low ${board.accountView.guardduty.low}`}</dd>
            <dt>regions read</dt><dd class="mono">{board.regions.join(' · ')}</dd>
          </dl>
          <p class="ask-text"><button type="button" class="tool" onclick={() => void open('account:iam')}>IAM CONSOLE ↗</button></p>
        {/if}
      </div>
    {/key}

    <!-- On ACTIVE and RESOURCES, and in every step of a drill-down, wherever it was opened from: its lists and items say ≈ $ (aws.md §5.0). -->
    {#if board !== null && (choices.tab === 'active' || choices.tab === 'resources' || choices.drill !== null)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <p
        class="estimate"
        onpointerenter={(e) => card('estimate', e.currentTarget as HTMLElement, e.clientX, () => ({ head: 'estimates', side: 'list prices', rows: [{ label: 'prices', value: `shipped with elecdex, as of ${board?.active.prices.asOf}` }, ...(board?.active.unpriced.length ? [{ label: 'not priced', value: board.active.unpriced.join(', ') }] : [])], note: ESTIMATE_NOTE }))}
        onpointerleave={() => leave('estimate')}
        data-testid="aws-estimate"
      >≈ Estimates at list prices, not your bill · prices shipped with elecdex, {board.active.prices.asOf} ⓘ</p>
    {/if}
  {/if}

  {#if hover !== null}
    <HoverCard anchor={hover.anchor} bounds={hover.bounds} testid="aws-card">
      <p class="chead"><span>{hover.head}</span><span>{hover.side}</span></p>
      <CardRows rows={hover.rows} />
      {#if hover.note !== null}<p class="cnote">{hover.note}</p>{/if}
    </HoverCard>
  {/if}

  {#if settingsOpen}
    <div class="settings crt-on" data-testid="aws-settings">
      <h5>This pane</h5>
      <div class="opt"><span>Profile</span>
        <select value={choices.spec.profile} onchange={(e) => patch({ profile: (e.currentTarget as HTMLSelectElement).value === 'default' ? undefined : (e.currentTarget as HTMLSelectElement).value, drill: undefined })} data-testid="aws-profile">
          {#each [...new Set(['default', choices.spec.profile, ...profiles])] as name (name)}<option value={name}>{name}</option>{/each}
        </select>
      </div>
      <div class="opt"><span>Regions ({MAX_REGIONS} at most; none: the profile's)</span></div>
      <div class="seg wrap">
        {#each [...new Set([...REGION_CHOICES, ...choices.spec.regions])] as region (region)}
          <button type="button" class="tool" class:on={choices.spec.regions.includes(region)} onclick={() => toggleRegion(region)}>{regionShort(region)}</button>
        {/each}
      </div>
      <div class="opt"><span>Activity (CloudTrail)</span>
        <span class="seg"><button type="button" class="tool" class:on={choices.spec.activity} onclick={() => patch({ activity: undefined })}>on</button><button type="button" class="tool" class:on={!choices.spec.activity} onclick={() => patch({ activity: false })}>off</button></span>
      </div>
      <div class="opt"><span>Pulse band</span>
        <span class="seg"><button type="button" class="tool" class:on={choices.pulse} onclick={() => patch({ pulse: undefined })}>on</button><button type="button" class="tool" class:on={!choices.pulse} onclick={() => patch({ pulse: false })}>off</button></span>
      </div>
      <div class="opt"><span>Slow (every period ×4, but billing)</span>
        <span class="seg"><button type="button" class="tool" class:on={!choices.spec.slow} onclick={() => patch({ slow: undefined })}>off</button><button type="button" class="tool" class:on={choices.spec.slow} onclick={() => patch({ slow: true })}>×4</button></span>
      </div>
      {#if board?.account}
        <h5>This account</h5>
        <div class="opt"><span>Cost Explorer (paid)</span>
          <span class="seg">{#each [['off', 'OFF'], ['manual', 'MANUAL'], ['day', '1 DAY'], ['12h', '12 H']] as [id, label] (id)}<button type="button" class="tool" class:on={id === 'off' ? board.cost.ce.state !== 'on' : board.cost.ce.state === 'on' && board.cost.ce.every === id} onclick={() => void window.elecdex.aws.costExplorer(key, id === 'off' ? { state: 'off' } : { state: 'on', every: id as 'manual' | 'day' | '12h', cap: board?.cost.ce.cap ?? 100 })}>{label}</button>{/each}</span>
        </div>
        <div class="opt"><span>Monthly cap</span>
          <select value={board.cost.ce.cap} onchange={(e) => void window.elecdex.aws.costExplorer(key, { state: board?.cost.ce.state === 'on' ? 'on' : 'off', cap: Number((e.currentTarget as HTMLSelectElement).value) })}>
            {#each CE_CAPS as cap (cap)}<option value={cap}>{capText(cap)}</option>{/each}
          </select>
        </div>
        <p>{board.cost.ce.state === 'on' ? `on since ${board.cost.ce.answeredAt ? new Date(board.cost.ce.answeredAt).toISOString().slice(5, 10) : '—'}` : board.cost.ce.state === 'unasked' ? 'not asked yet' : `${board.cost.ce.state}${board.cost.ce.answeredAt ? ` · ${new Date(board.cost.ce.answeredAt).toISOString().slice(5, 10)}` : ''}`} · {board.cost.ce.usedThisMonth} requests this month.</p>
        <div class="opt"><span>Cost quota, USD (0 = off)</span>
          <span class="seg"><button type="button" class="tool" class:on={board.cost.quota.steps === '80-100'} onclick={() => void saveQuota('80-100')}>80% + 100%</button><button type="button" class="tool" class:on={board.cost.quota.steps === '100'} onclick={() => void saveQuota('100')}>100% only</button></span>
        </div>
        <p>Checked every 6 hours while this pane is shown: a toast can come half a day after the money was spent, or later if the pane is not shown. AWS Budgets is the alarm AWS keeps; this one is elecdex's own, on screen. The month is AWS's (UTC). On the payer account this is the whole organization's bill.</p>
        <AwsResourcesSettings res={board.resources} boardKey={key} {masked} />
      {/if}
      <h5>Every AWS STATUS pane</h5>
      <div class="opt"><span>Incident toasts</span>
        <span class="seg"><button type="button" class="tool" class:on={incidents.notify} onclick={() => setIncidents({ notify: true })}>on</button><button type="button" class="tool" class:on={!incidents.notify} onclick={() => setIncidents({ notify: false })}>off</button></span>
      </div>
      <div class="opt"><span>From</span>
        <span class="seg">{#each [['info', 'INFO'], ['warn', 'WARN'], ['danger', 'DISRUPTION']] as [id, label] (id)}<button type="button" class="tool" class:on={incidents.minSeverity === id} onclick={() => setIncidents({ minSeverity: id as 'info' | 'warn' | 'danger' })}>{label}</button>{/each}</span>
      </div>
      <div class="opt"><span>System notification when elecdex is not in front</span>
        <span class="seg"><button type="button" class="tool" class:on={incidents.system} onclick={() => setIncidents({ system: true })}>on</button><button type="button" class="tool" class:on={!incidents.system} onclick={() => setIncidents({ system: false })}>off</button></span>
      </div>
      <p>AWS's public status is read while a pane is shown, every 5 minutes; a system notification never names the account. Read only, through your AWS CLI; elecdex never sees a credential.</p>
    </div>
  {/if}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <footer
    class="foot"
    onpointerenter={(e) => board && card('ledger', e.currentTarget as HTMLElement, e.clientX, () => ({
      head: 'requests today · by probe',
      side: String(board?.ledger.requests ?? 0),
      rows: [...gmdRows(), ...(board?.ledger.probes ?? []).filter((p) => p.requests > 0).map((p) => ({ label: p.id, value: `${p.requests} · ${periodText(p.every)} · ${p.cost}` }))],
      note: `Free tier is CloudWatch's million requests a month, shared by the whole account. aws: ${board?.executable ?? 'not found'}${board?.cliVersion ? ` · ${board.cliVersion}` : ''}.`,
    }))}
    onpointerleave={() => leave('ledger')}
    data-testid="aws-foot"
  >
    <span>{board === null ? 'read only while shown' : board.problem !== null ? board.problem : ledgerLine(board.ledger, 'aws')}</span>
    {#if !narrow}<span>read only · only while shown{board?.cliVersion ? ` · aws-cli ${board.cliVersion}` : ''}</span>{/if}
  </footer>
</div>

<style>
.rsel { display: flex; }
.rsel button { display: inline-flex; align-items: center; gap: 0.3rem; margin-left: -1px; padding: 0.02rem 0.45rem; border: 1px solid var(--panel-rule); background: transparent; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--step--2); cursor: pointer; }
.rsel button[aria-pressed='true'] { color: var(--text); border-color: var(--accent); background: var(--accent-faint); }
.rsel i { width: 0.36rem; height: 0.36rem; transform: rotate(45deg); background: var(--ok); }
.rsel i[data-tone='danger'] { background: var(--danger); box-shadow: 0 0 calc(var(--glow) * 0.4rem) var(--danger); }
.rsel i[data-tone='warn'] { background: var(--warn); }
.rsel i[data-tone='none'] { background: var(--ok); }
.notice.quiet { border-color: var(--panel-rule); color: var(--text-dim); }
/* The refused operations wrap between them, and a long one within itself: never past the pane. */
.denied { min-width: 0; overflow-wrap: anywhere; }
.ops { font-family: var(--font-mono); }
.op:not(:last-child)::after { content: ' · '; }
.mono { font-family: var(--font-mono); }
.ask { border: 1px solid var(--accent); padding: 0.2rem 0.6rem; font-size: var(--step--1); }
.ask-line { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.7rem; }
.ask-line > span { flex: 1; min-width: 12rem; }
.ask-text { margin: 0.3rem 0; color: var(--text-dim); font-size: var(--step--1); line-height: 1.45; }
.band { position: relative; display: flex; flex-direction: column; gap: 0.1rem; padding: 0.25rem 0; border-top: 1px solid var(--panel-rule); border-bottom: 1px solid var(--panel-rule); }
.phead { display: flex; justify-content: space-between; gap: 1rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }
.legend { display: flex; gap: 0.8rem; }
.legend span::before { content: ''; display: inline-block; width: 0.5rem; height: 0.18rem; margin-right: 0.3rem; vertical-align: middle; background: var(--accent); }
.legend .e::before { background: var(--danger); }
.legend .l::before { width: 0.3rem; height: 0.3rem; background: var(--info); transform: rotate(45deg); }
.legend span:last-child::before { display: none; }
.tip { position: absolute; top: 0.1rem; left: 30%; font-family: var(--font-mono); font-size: var(--step--1); background: var(--surface-2); border: 1px solid var(--panel-border); padding: 0 0.4rem; }
.row.a { grid-template-columns: 6rem minmax(0, 1fr) 6rem 3rem; }
.row.s { grid-template-columns: 9rem 9rem 8rem minmax(0, 1fr) 7rem; }
.row.c { grid-template-columns: 12rem minmax(0, 1fr) 6rem; }
.row.t { grid-template-columns: 3.4rem 8rem minmax(0, 1fr) 5rem; }
@container cloudview (max-width: 42rem) {
  .row.s { grid-template-columns: 8rem 7rem minmax(0, 1fr) 6rem; }
  .row.s .flags { display: none; }
  .row.a { grid-template-columns: 6rem minmax(0, 1fr) 3rem; }
  .row.a .repo { display: none; }
}
@container cloudview (max-width: 30rem) {
  .row.s { grid-template-columns: minmax(0, 1fr) 6rem; }
  .row.s .mono:not(.right), .row.s .meterbar { display: none; }
  .row.t { grid-template-columns: 3.4rem minmax(0, 1fr); }
  .row.t .repo { display: none; }
}
.flags { display: flex; gap: 0.4rem; font-size: var(--step--2); letter-spacing: var(--tracking-wide); }
.meterbar { height: 0.45rem; align-self: center; background: color-mix(in srgb, var(--accent) 8%, transparent); }
.meterbar i { display: block; height: 100%; width: calc(var(--share) * 100%); background: var(--bar); }
.meter { display: flex; flex-wrap: wrap; gap: 0.5rem 2rem; padding: 0.3rem 0 0.4rem; }
.figure.big { cursor: default; }
.figure.big b { font-family: var(--font-display); font-size: var(--step-2); font-weight: 500; color: var(--accent-strong); text-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--accent); }
.figure.big b small { font-size: var(--step-0); color: var(--text-muted); text-shadow: none; }
.dimfig b { color: var(--text); text-shadow: none; }
.stack { display: flex; height: 1.2rem; gap: 2px; margin-bottom: 0.4rem; }
.seg1 { min-width: 2px; padding: 0 0.3rem; border: 0; background: var(--bar); color: var(--text-inverse); font-size: var(--step--2); letter-spacing: var(--tracking-wide); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; }
.seg1:nth-child(even) { background: color-mix(in srgb, var(--accent) 40%, transparent); }
.seg1:hover, .seg1:focus-visible { outline: 1px solid var(--accent-strong); }
.changes { display: flex; flex-wrap: wrap; gap: 0.2rem 1rem; margin: 0 0 0.3rem; font-size: var(--step--1); }
.changes b { font-family: var(--font-mono); font-weight: 500; margin-right: 0.15rem; }
.quietline { margin: 0.4rem 0; font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }
.facts { display: flex; flex-wrap: wrap; gap: 1.4rem; padding: 0.3rem 0; border-bottom: 1px solid var(--panel-rule); }
.facts small { display: block; font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }
.facts b { font-family: var(--font-display); font-size: var(--step-1); font-weight: 500; color: var(--accent-strong); }
.gauge { display: grid; grid-template-columns: 11rem minmax(0, 1fr) 11rem; gap: 0.7rem; align-items: center; margin: 0.35rem 0; font-size: var(--step--1); color: var(--text-dim); }
.track { position: relative; height: 0.55rem; background: color-mix(in srgb, var(--accent) 8%, transparent); }
.track i { position: absolute; inset: 0 auto 0 0; width: calc(var(--share) * 100%); background: var(--bar); }
.track i.warn { background: var(--warn); }
.track em { position: absolute; top: -0.15rem; bottom: -0.15rem; left: calc(var(--share) * 100%); width: 1px; background: var(--warn); }
.track s { position: absolute; top: -0.15rem; bottom: -0.15rem; left: calc(var(--at) * 100%); width: 1px; background: var(--text-muted); }
.qset input { width: 100%; background: var(--surface-1); color: var(--text); border: 1px solid var(--panel-rule); font-family: var(--font-mono); font-size: var(--step--1); padding: 0 0.3rem; }
.acct { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.15rem 1rem; margin: 0.4rem 0; font-size: var(--step--1); }
.acct dt { color: var(--text-muted); font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; align-self: center; }
.acct dd { margin: 0; color: var(--text); overflow-wrap: anywhere; }
.estimate { margin: 0; padding: 0.15rem 0; border-top: 1px dashed var(--panel-rule); font-size: var(--step--1); color: var(--text-dim); }
.seg.wrap { flex-wrap: wrap; margin-bottom: 0.3rem; }
select { background: var(--surface-1); color: var(--text); border: 1px solid var(--panel-rule); font-family: var(--font-mono); font-size: var(--step--1); }
.settings { max-height: calc(100% - 2.5rem); overflow-y: auto; }
/* Six tabs since RESOURCES: closer together where the pane is narrow, and onto a second line
   rather than past its edge. */
.aws :global(.tabs) { flex-wrap: wrap; }
.aws.narrow :global(.tabs button) { padding: 0.1rem 0.4rem; }
</style>
