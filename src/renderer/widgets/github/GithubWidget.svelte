<script lang="ts">
import { boardKey, readGithubPane } from '@shared/github/board'
import { GH_LIMITS, repoName } from '@shared/github/derive'
import type { GithubBoard, QueueItem, RepoDetail, RepoTile } from '@shared/github/types'
import { afterBlink } from '../../lib/blink.ts'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import {
  anchorOf,
  type CardAnchor,
  type CardRow,
  type CardSize,
  cardTime,
  HoverRest,
  keyboardFocused,
} from '../../lib/hover-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import {
  ageText,
  clockText,
  heaviest,
  ledgerCardRows,
  ledgerLine,
  linkView,
  MASKED,
  shownProblem,
} from '../cloud/cloud-view.ts'
import IncidentBand from '../cloud/IncidentBand.svelte'
import CardRows from '../common/CardRows.svelte'
import HoverCard from '../common/HoverCard.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import ContribGrid from './ContribGrid.svelte'
import {
  alertsText,
  barShares,
  compact,
  githubBadge,
  KIND_LABEL,
  QUEUE_FILTERS,
  QUEUE_GROUPS,
  type QueueFilter,
  queueMatches,
  refreshNote,
  repoLabel,
  sparkPoints,
  titleOf,
  viewsText,
} from './github-view.ts'

/**
 * GITHUB STATUS (docs/github.md): what waits on the user, the inbox, what happened in the watched
 * repositories and the repositories themselves, read through the user's own gh. Main reads a
 * board only while a pane like this is seen, so this subscribes only then; behind a tab or with
 * the window put away, nothing is asked of GitHub. Items open by id: main builds the URL.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const choices = $derived(readGithubPane(paneState))
const key = $derived(boardKey(choices.spec))

let board = $state.raw<GithubBoard | null>(null)
let detail = $state.raw<RepoDetail | null>(null)
let now = $state(Date.now())

$effect(() => {
  const k = key
  if (!visible) return
  return window.elecdex.github.subscribe(k, (next) => {
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
const me = $derived(board?.login ?? null)
const link = $derived(linkView(board?.link ?? 'standby'))
const redCount = $derived(board?.repos.filter((repo) => repo.red).length ?? 0)

$effect(() => {
  const b = board
  const badge = b === null ? {} : githubBadge(b, link, redCount)
  paneMeta.set(paneId, {
    subtitle: b?.login ? `@${masked ? MASKED : b.login} · github.com` : 'github.com',
    ...badge,
  })
})

function patch(change: Record<string, unknown>): void {
  widgetState.patch(paneId, change)
}

/* ---- Tabs, filters, drill-down ---- */

type Tab = 'queue' | 'inbox' | 'events' | 'repos'
let filter = $state<QueueFilter>('all')
let inboxFilter = $state<string>('all')

function selectTab(tab: Tab): void {
  sfx.play('panel')
  // Left by a tab, the repository is not where the focus comes back to later.
  returnTo = null
  patch({ tab: tab === 'repos' ? undefined : tab, drill: undefined })
}

const queue = $derived((board?.queue ?? []).filter((item) => queueMatches(item, filter)))
const groups = $derived(
  QUEUE_GROUPS.map((group) => ({
    ...group,
    items: queue.filter((item) => item.weight === group.weight),
  })).filter((group) => group.items.length > 0),
)
const inbox = $derived(
  board?.inbox.readable
    ? board.inbox.items.filter((item) => inboxFilter === 'all' || item.reason === inboxFilter)
    : [],
)

/** Set by a press into a repository: its way back takes the focus, so Escape goes up. */
let drilled = false
/**
 * The tile a repository was opened from: back on REPOS it takes the focus again, so the keyboard
 * goes on from where it was. The page's own memory: a remount forgets it.
 */
let returnTo: string | null = null
async function drillInto(repo: RepoTile): Promise<void> {
  sfx.play('expand')
  drilled = true
  returnTo = repo.name
  patch({ drill: repo.name })
}
/** The tile pressed is gone with the list: without this, focus falls to the page and Escape with it. */
function takeFocus(el: HTMLElement): void {
  if (!drilled) return
  drilled = false
  el.focus({ preventScroll: true })
}
/** As the tiles come back: the one the repository was opened from takes the focus. */
function regain(name: string) {
  return (el: HTMLElement) => {
    if (returnTo !== name) return
    returnTo = null
    el.focus({ preventScroll: true })
  }
}
/**
 * What the drill-down's reading waits on: the list of repositories and the link. A drill kept
 * over a restart asks before the first list and is answered `waiting`; it asks again as the list
 * comes (or the sign-in), and a repository the list no longer has goes back to REPOS.
 */
const reposRead = $derived(
  board === null ? null : `${board.link}|${board.repos.map((repo) => repo.name).join(' ')}`,
)
$effect(() => {
  const repo = choices.drill
  const k = key
  const listed = reposRead
  if (!visible || repo === null) {
    detail = null
    return
  }
  void window.elecdex.github.detail(k, repo).then((next) => {
    if (choices.drill !== repo || next === 'waiting') return
    // Not watched, once this page has its board: the step above, as an item gone does on AWS.
    if (next === null && listed !== null) patch({ drill: undefined })
    else detail = next
  })
})
/**
 * Whether the repository drilled into is private: until the board says it is not, it is taken
 * to be, so MASK hides its name, runs and pulls from the first frame.
 */
const drilledPrivate = $derived(
  board?.repos.find((repo) => repo.name === choices.drill)?.private ?? true,
)
function up(): void {
  if (choices.drill === null) return
  sfx.play('collapse')
  patch({ drill: undefined })
}
function onPaneKey(event: KeyboardEvent): void {
  if ((event.key === 'Escape' || event.key === 'Backspace') && choices.drill !== null) {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') return
    event.preventDefault()
    up()
  }
}

/* ---- Opening, copying, refresh ---- */

async function open(id: string): Promise<void> {
  sfx.play('panel')
  await window.elecdex.github.open(key, id)
}
function onRowKey(event: KeyboardEvent, id: string): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    void open(id)
  }
}

/** The sign-in command's COPY: the press blinks its three beats, as every choice does, then copies. */
const copies = new CopyFlag()
$effect(() => () => copies.dispose())
const copied = $derived(copies.key === 'signin')
function copySignIn(button: HTMLElement): void {
  const text = board?.signIn ?? (board?.inbox.readable === false ? board.inbox.command : null)
  if (text == null) return
  afterBlink(button, () => {
    void copies.through('signin', async () => {
      const done = await window.elecdex.utility.copy({ kind: 'text', text })
      if (done) sfx.play('folder')
      return done
    })
  })
}

/** What REFRESH reads while the rate limit holds the board back, in the foot (github.md §3). */
const refreshing = $derived(board === null ? null : refreshNote(board))
/** When REFRESH may be pressed again (main's answer), or 0: the button is disabled until then. */
let waitUntil = $state(0)
// The wait ends on a second's boundary, not a timer of the pane's own (one outlived the pane).
$effect(() => {
  if (waitUntil === 0) return
  return onBoundary(1000, () => {
    if (Date.now() >= waitUntil) waitUntil = 0
  })
})
/**
 * REFRESH blinks its three beats as every choice does, then asks: the button is disabled for the
 * wait main answers, which cut the held press's own blink to one beat.
 */
function pressRefresh(button: HTMLElement): void {
  if (waitUntil > 0) return
  afterBlink(button, () => void refresh())
}
async function refresh(): Promise<void> {
  if (waitUntil > 0) return
  sfx.play('panel')
  const left = await window.elecdex.github.refresh(key)
  waitUntil = left > 0 ? Date.now() + left : 0
}

/* ---- Settings ---- */

let settingsOpen = $state(false)
let pinnedText = $state('')
$effect(() => {
  if (settingsOpen) pinnedText = choices.spec.repos === 'auto' ? '' : choices.spec.repos.join('\n')
})
function savePinned(): void {
  const names = [
    ...new Set(
      pinnedText
        .split(/\s+/)
        .map((line) => line.trim())
        .filter((line) => repoName(line) !== null),
    ),
  ].slice(0, GH_LIMITS.maxRepos)
  patch({ repos: names.length > 0 ? names : undefined })
}

const incidents = $derived(appearance.settings.github.incidents)
function setIncidents(change: Partial<typeof incidents>): void {
  void appearance.patch({ github: { incidents: { ...incidents, ...change } } })
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

function card(
  id: string,
  target: HTMLElement,
  pointerX: number | null,
  make: () => { head: string; side: string; rows: CardRow[]; note: string | null },
): void {
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
/** A row's card on focus, only when the keyboard put it there: Back with the mouse opens none. */
function focusCard(id: string, event: FocusEvent, make: Parameters<typeof card>[3]): void {
  const target = event.currentTarget as HTMLElement
  if (keyboardFocused(target)) card(id, target, null, make)
}
function leave(id: string): void {
  resting.leave(id)
}
$effect(() => {
  if (!visible) resting.leave()
})
/** The view shown: a tab, or a repository drilled into. */
const viewKey = $derived(`${choices.tab}:${choices.drill ?? ''}`)
// A press that opens another view (a repository's tile) takes away the element under the
// pointer, and an element taken away sends no pointerleave: its card goes with the view.
$effect(() => {
  void viewKey
  resting.leave()
})
$effect(() => () => resting.dispose())

/**
 * The repository's whole name, as the row has no room for it (the user's own go by their name
 * alone there) - but under MASK the owner is the login the subtitle hides, so not then.
 */
const fullName = (repo: string, isPrivate: boolean) =>
  repoLabel(repo, masked ? me : null, isPrivate, masked)

/**
 * A private repository's own words under MASK - a branch, a workflow, a release tag - which say
 * as much about it as its name does.
 */
const hidden = (text: string, isPrivate: boolean) => (masked && isPrivate ? MASKED : text)

/** A queue row's card: what the row has no room for - since when, by whom, the whole name, why. */
function queueCard(item: QueueItem) {
  return {
    head: item.since === null ? 'as of the last reading' : `waiting since ${cardTime(item.since)}`,
    side: item.by !== null ? `by ${masked ? MASKED : item.by}` : item.mine ? 'yours' : '',
    rows: [
      {
        label: 'repository',
        value: `${fullName(item.repo, item.private)}${item.number !== null ? ` #${item.number}` : ''}`,
      },
      ...(item.newcomer
        ? [{ label: 'author', value: 'a first contribution to the repository' }]
        : []),
      { label: 'opens', value: 'github.com, in your browser' },
    ],
    note: item.why,
  }
}
function tileCard(tile: RepoTile) {
  return {
    head: fullName(tile.name, tile.private),
    side: tile.private ? 'private' : 'public',
    rows: [
      {
        label: 'stars',
        value: `${tile.stars.toLocaleString('en')}${tile.starsDelta7 !== null ? ` · ${tile.starsDelta7 >= 0 ? '+' : ''}${tile.starsDelta7} in 7 days${tile.starsSince ? ` (noted since ${tile.starsSince})` : ''}` : ''}`,
      },
      {
        label: 'default branch',
        value: `${hidden(tile.defaultBranch, tile.private)} · ${tile.red ? 'latest run failed' : 'green'}`,
      },
      {
        label: 'views 14 d',
        value: viewsText(tile.views14, true),
      },
      {
        label: 'alerts',
        value:
          tile.alerts === 'off'
            ? 'Dependabot alerts are disabled'
            : tile.alerts === null
              ? 'needs admin or security manager'
              : `${tile.alerts} open`,
      },
    ],
    note: "Stars over time are elecdex's own daily notes, public repositories only. The release is the newest, prereleases included.",
  }
}

let contribTip = $state<{ text: string; x: number } | null>(null)
function onDay(index: number | null, x: number): void {
  const days = board?.contrib?.days ?? []
  if (index === null || index >= days.length) {
    contribTip = null
    return
  }
  const date = new Date(now - (days.length - 1 - index) * 86_400_000)
  contribTip = { text: `${date.toISOString().slice(0, 10)} · ${days[index]} contributions`, x }
}

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
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="github cloudpane" class:narrow data-testid="github" data-pane-id={paneId} bind:this={rootEl} onkeydown={onPaneKey} {@attach observe}>
  <SettingsButton open={settingsOpen} label="github status settings" testid="github-settings-toggle" ontoggle={() => (settingsOpen = !settingsOpen)} />
  <header class="top" data-testid="github-top">
    <span class="link" data-tone={link.tone} data-testid="github-link"><i></i>{link.word}</span>
    {#if board !== null && board.link !== 'no-cli'}
      <button type="button" class="figure" onclick={() => selectTab('queue')} data-testid="github-queue-count">
        <small>QUEUE</small><span>{board.queue.length}{#if board.queue.some((item) => item.weight === 'danger')} · <b class="danger">{board.queue.filter((item) => item.weight === 'danger').length}</b>{/if}</span>
      </button>
      <button type="button" class="figure" onclick={() => { filter = 'review'; selectTab('queue') }}>
        <small>REVIEW</small><span>{board.queue.filter((item) => item.tag === 'Review' || item.tag.startsWith('Waiting')).length}</span>
      </button>
      <button type="button" class="figure" onclick={() => selectTab('repos')} data-testid="github-red">
        <small>MAIN RED</small><span class:danger={redCount > 0} class:dim={redCount === 0}>{redCount}</span>
      </button>
      {#if board.rate?.low}
        <span class="rate" data-testid="github-rate-low"><small>RATE LOW</small><span>REST {board.rate.rest} · GQL {board.rate.gql} · reset {clockText(board.rate.reset)}</span></span>
      {/if}
    {/if}
    <span class="spacer"></span>
    {#if !narrow && board?.nextInboxAt}<span class="when">inbox next <b>{clockText(board.nextInboxAt)}</b></span>{/if}
    <button type="button" class="tool" class:on={masked} aria-pressed={masked} onclick={() => patch({ mask: masked ? undefined : true })} data-testid="github-mask">MASK</button>
    <button type="button" class="tool" disabled={waitUntil > 0} onclick={(e) => pressRefresh(e.currentTarget)} data-testid="github-refresh">REFRESH</button>
  </header>

  {#if board?.link === 'signed-out' && board.signIn !== null}
    <div class="notice crt-on" role="status" data-testid="github-signin">
      <span>gh is not signed in to github.com, or its token expired. Sign in from a shell; the pane reads again at REFRESH.</span>
      <code>{board.signIn}</code>
      <button type="button" class="tool" onclick={(e) => copySignIn(e.currentTarget)}>{copied ? 'COPIED' : 'COPY'}</button>
    </div>
  {/if}

  {#if board?.link === 'no-cli'}
    <div class="empty" data-testid="github-nocli">
      <b class="danger">NO CLI</b>
      <span>GitHub CLI (gh) was not found on PATH or in its install folders.</span>
      <span>Install it and sign in, then restart elecdex (a running app keeps its old PATH).</span>
      <code>winget install GitHub.cli</code>
    </div>
  {:else}
    <IncidentBand incidents={board?.incidents ?? []} source="GITHUB" {now} onopen={(id) => void open(`incident:${id}`)} />
    {#if choices.band && !short && board?.contrib}
      <section class="band" data-testid="github-band">
        {#if !narrow}
          <div class="figure big"><small>CONTRIBUTIONS · LAST YEAR</small><b>{board.contrib.total.toLocaleString('en')}</b><small>this week {board.contrib.week} · last {board.contrib.lastWeek}</small></div>
        {/if}
        <ContribGrid days={board.contrib.days} weeks={narrow ? 26 : 53} onday={onDay} />
        <div class="figure big streak"><small>STREAK</small><b>{board.contrib.streak}<small>d</small></b><small>best {board.contrib.best}d</small></div>
        {#if contribTip !== null}<span class="tip" role="status">{contribTip.text}</span>{/if}
      </section>
    {/if}

    <div class="tabs" role="tablist" aria-label="github status">
      <!-- REPOS first, at the left, and the tab a pane opens on (the user's decision 2026-11-08). -->
      {#each [['repos', 'REPOS', board?.repos.length], ['queue', 'QUEUE', board?.queue.length], ['inbox', 'INBOX', board?.inbox.readable ? board.inbox.items.filter((item) => item.unread).length : '—'], ['events', 'EVENTS', board?.events.length]] as [id, label, count] (id)}
        <button type="button" role="tab" aria-selected={choices.tab === id} onclick={() => selectTab(id as Tab)} data-testid="github-tab-{id}">{label}{#if count !== undefined}<em data-weight={id === 'queue' ? heaviest(board?.queue ?? []) : null}>{count}</em>{/if}</button>
      {/each}
    </div>

    {#if choices.tab === 'repos' && choices.drill !== null}
      <div class="bar crumbs" data-testid="github-crumbs">
        <button type="button" class="back" onclick={up} aria-label="back to the repositories" {@attach takeFocus}>‹</button>
        <button type="button" onclick={up}>REPOS</button><span class="gt">›</span><span class="here">{repoLabel(choices.drill, me, drilledPrivate, masked)}</span>
      </div>
    {:else if choices.tab === 'queue' && board !== null}
      <div class="bar">
        {#each QUEUE_FILTERS as f (f)}
          <button type="button" class="chip" class:on={filter === f} aria-pressed={filter === f} onclick={() => (filter = f)}>{f}{#if f !== 'all'}<em>{board.queue.filter((item) => queueMatches(item, f)).length}</em>{/if}</button>
        {/each}
      </div>
    {:else if choices.tab === 'inbox' && board?.inbox.readable}
      <div class="bar">
        {#each ['all', 'review', 'mention', 'assign', 'ci', 'security'] as f (f)}
          <button type="button" class="chip" class:on={inboxFilter === f} aria-pressed={inboxFilter === f} onclick={() => (inboxFilter = f)}>{f}</button>
        {/each}
      </div>
    {/if}

    {#key viewKey}
      <div class="view crt-on" data-testid="github-view-{choices.tab}" onscroll={() => resting.leave()}>
        {#if board === null}
          <p class="empty">…</p>
        {:else if choices.tab === 'queue'}
          {#if queue.length === 0}
            <div class="empty"><b class="ok">NOTHING WAITS ON YOU</b><span>last read {clockText(board.readAt)}</span></div>
          {:else}
            {#each groups as group (group.weight)}
              <div class="sep">{group.label} <b>{group.items.length}</b></div>
              {#each group.items as item (item.id)}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="row q"
                  data-weight={item.weight}
                  tabindex="0"
                  role="link"
                  onclick={() => void open(item.id)}
                  onkeydown={(e) => onRowKey(e, item.id)}
                  onpointerenter={(e) => card(item.id, e.currentTarget as HTMLElement, e.clientX, () => queueCard(item))}
                  onpointerleave={() => leave(item.id)}
                  onfocus={(e) => focusCard(item.id, e, () => queueCard(item))}
                  onblur={() => leave(item.id)}
                  data-testid="github-queue-row"
                >
                  <span class="kind" data-kind={item.kind}>{KIND_LABEL[item.kind]}</span>
                  <span class="repo">{repoLabel(item.repo, me, item.private, masked)}</span>
                  <span class="title">{#if item.number !== null}<span class="num">#{item.number}</span>{/if}{#if item.newcomer}<span class="first" data-testid="github-newcomer">1ST</span>{/if}{titleOf(item.title, item.private, masked)}</span>
                  <span class="tag" data-weight={item.tagWeight}>{item.tag}</span>
                  <span class="age">{item.since === null ? '—' : ageText(item.since, now)}</span>
                  <span class="go" aria-hidden="true">↗</span>
                </div>
              {/each}
            {/each}
          {/if}
        {:else if choices.tab === 'inbox'}
          {#if !board.inbox.readable}
            <div class="empty" data-testid="github-inbox-unreadable">
              <b class="warn">INBOX NOT READABLE</b>
              <span>
                {board.inbox.why === 'fine-grained'
                  ? 'A fine-grained token cannot read notifications at all. Sign in with gh (it uses an OAuth token) or use a classic token; everything else is read.'
                  : board.inbox.why === 'env-token'
                    ? 'The token comes from GH_TOKEN in the environment, so gh auth refresh cannot add a scope. Give that token the notifications scope, or unset GH_TOKEN and sign in with gh.'
                    : 'The token has no notifications scope.'}
              </span>
              {#if board.inbox.command !== null}<code>{board.inbox.command}</code><button type="button" class="tool" onclick={(e) => copySignIn(e.currentTarget)}>{copied ? 'COPIED' : 'COPY'}</button>{/if}
            </div>
          {:else if inbox.length === 0}
            <div class="empty"><b class="ok">INBOX ZERO</b><span>next read {clockText(board.nextInboxAt)}</span></div>
          {:else}
            {#each inbox as item (item.id)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="row i" class:read={!item.unread} data-weight={item.reason === 'security' || item.reason === 'ci' ? 'danger' : item.reason === 'review' ? 'info' : 'quiet'} tabindex="0" role="link" onclick={() => void open(item.id)} onkeydown={(e) => onRowKey(e, item.id)} data-testid="github-inbox-row">
                <span class="unread" class:no={!item.unread}></span>
                <span class="kind" data-kind={item.kind}>{KIND_LABEL[item.kind]}</span>
                <span class="repo">{repoLabel(item.repo, me, item.private, masked)}</span>
                <span class="title">{#if item.number !== null}<span class="num">#{item.number}</span>{/if}{titleOf(item.title, item.private, masked)}</span>
                <span class="tag" data-weight={item.reason === 'security' || item.reason === 'ci' ? 'danger' : item.reason === 'review' ? 'info' : 'quiet'}>{item.reason === 'subscribed' ? 'watching' : item.reason}</span>
                <span class="age">{ageText(item.updatedAt, now)}</span>
                <span class="go" aria-hidden="true">↗</span>
              </div>
            {/each}
            <div class="sep">the raw inbox · the pane marks nothing as read</div>
          {/if}
        {:else if choices.tab === 'events'}
          <div class="sep">in the watched repositories · the last {GH_LIMITS.eventsHours} hours</div>
          {#if board.events.length === 0}
            <div class="empty"><b class="ok">QUIET</b><span>nothing in the last {GH_LIMITS.eventsHours} hours</span></div>
          {:else}
            {#each board.events as event (event.repo)}
              <div class="row e" data-testid="github-event-row">
                <span class="repo">{repoLabel(event.repo, me, event.private, masked)}</span>
                <span class="parts">{#each event.parts as part (part.label)}<span>{part.label} <b>{part.label === '★' ? `+${part.count}` : part.count}</b></span>{/each}{#if event.mine > 0}<span class="mine">· {event.mine} by you</span>{/if}</span>
                <span class="age">{clockText(event.at)}</span>
              </div>
            {/each}
          {/if}
        {:else if choices.drill !== null}
          {#if detail === null || detail.repo !== choices.drill}
            <p class="empty">…</p>
          {:else}
            {@const tile = board.repos.find((repo) => repo.name === choices.drill)}
            {#if tile}
              <div class="facts">
                <div><small>STARS</small><b>{tile.stars.toLocaleString('en')}</b></div>
                <div><small>FORKS</small><b>{tile.forks.toLocaleString('en')}</b></div>
                <div><small>VIEWS 14 D</small><b>{viewsText(tile.views14)}</b></div>
                <div><small>OPEN ISSUES</small><b>{tile.issues}</b></div>
                <div><small>OPEN PRS</small><b>{tile.pulls}</b></div>
              </div>
            {/if}
            <div class="sep">runs · the last {detail.runs.length}</div>
            <div class="row r head" aria-hidden="true"><span></span><span>WORKFLOW</span><span class="c-branch">BRANCH</span><span>COMMIT OR PR</span><span class="c-event">EVENT</span><span class="c-took">TOOK</span><span>AGE</span><span></span></div>
            {#each detail.runs as run (run.id)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="row r" data-weight={run.state === 'failure' ? 'danger' : run.state === 'action' ? 'warn' : 'quiet'} tabindex="0" role="link" onclick={() => void open(run.id)} onkeydown={(e) => onRowKey(e, run.id)}>
                <span class="ci" data-state={run.state}></span>
                <span class="mono">{hidden(run.workflow, drilledPrivate)}</span>
                <span class="mono c-branch">{hidden(run.branch, drilledPrivate)}</span>
                <span class="title">{titleOf(run.title, drilledPrivate, masked)}{#if run.state === 'action'} <span class="warn">· awaiting approval</span>{/if}</span>
                <span class="mono c-event">{run.event}</span>
                <span class="mono c-took">{run.seconds === null ? '—' : run.seconds >= 60 ? `${Math.floor(run.seconds / 60)}m ${run.seconds % 60}s` : `${run.seconds}s`}</span>
                <span class="age">{ageText(run.at, now)}</span>
                <span class="go" aria-hidden="true">↗</span>
              </div>
            {/each}
            <div class="sep">pulls · open</div>
            {#each detail.pulls as pull (pull.id)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="row p" tabindex="0" role="link" onclick={() => void open(pull.id)} onkeydown={(e) => onRowKey(e, pull.id)}>
                <span class="tag" data-weight={pull.verdictWeight}>{pull.verdict}</span>
                <span class="ci" data-state={pull.ci}></span>
                <span class="title"><span class="num">#{pull.number}</span>{titleOf(pull.title, drilledPrivate, masked)}</span>
                <span class="mono">{masked ? MASKED : pull.by}</span>
                <span class="age">{ageText(pull.since, now)}</span>
              </div>
            {/each}
            <div class="sep">releases</div>
            {#each detail.releases as release (release.id)}
              <div class="row l">
                <span class="mono strong">{hidden(release.tag, drilledPrivate)}{#if release.prerelease}<span class="pre">PRE</span>{/if}</span>
                <span class="mono">{release.ahead ? `+${release.ahead} commits since` : ''}</span>
                <span class="mono right">↓ {compact(release.downloads)}</span>
                <span class="age">{ageText(release.at, now)}</span>
              </div>
            {/each}
          {/if}
        {:else}
          <div class="tiles">
            {#each board.repos as tile (tile.name)}
              <button
                type="button"
                class="tile"
                class:red={tile.red}
                onclick={() => void drillInto(tile)}
                onpointerenter={(e) => card(`tile:${tile.name}`, e.currentTarget as HTMLElement, e.clientX, () => tileCard(tile))}
                onpointerleave={() => leave(`tile:${tile.name}`)}
                onfocus={(e) => focusCard(`tile:${tile.name}`, e, () => tileCard(tile))}
                onblur={() => leave(`tile:${tile.name}`)}
                {@attach regain(tile.name)}
                data-testid="github-tile"
              >
                <span class="nm"><span class="ci" data-state={tile.runs[tile.runs.length - 1] ?? 'none'}></span><span class="t">{repoLabel(tile.name, me, tile.private, masked)}</span>{#if tile.private}<span class="lock">PRIVATE</span>{/if}</span>
                <span class="stars"><b>★ {compact(tile.stars)}</b><span class:zero={!tile.starsDelta7}>{tile.starsDelta7 === null ? '' : `${tile.starsDelta7 >= 0 ? '+' : ''}${tile.starsDelta7} 7d`}</span>{#if sparkPoints(tile.starSpark, 60, 14) !== ''}<svg class="spark" viewBox="-1 -1 62 16" preserveAspectRatio="none" aria-hidden="true" data-testid="github-spark"><polyline points={sparkPoints(tile.starSpark, 60, 14)} /></svg>{/if}</span>
                <span class="tfacts"><span>forks<b>{compact(tile.forks)}</b></span><span>issues<b>{tile.issues}</b></span><span>PRs<b>{tile.pulls}</b></span><span>alerts<b class:danger={typeof tile.alerts === 'number' && tile.alerts > 0} class:dim={typeof tile.alerts !== 'number'}>{alertsText(tile.alerts)}</b></span></span>
                <span class="runs"><small>runs</small>{#each tile.runs as state, i (i)}<span class="ci" data-state={state}></span>{:else}<small>none</small>{/each}{#if Array.isArray(tile.views14) && barShares(tile.views14).length > 0}<small class="vlabel">views</small><svg class="views" viewBox="0 0 {tile.views14.length * 3} 10" preserveAspectRatio="none" aria-hidden="true" data-testid="github-views">{#each barShares(tile.views14) as share, i (i)}<rect x={i * 3} y={10 - Math.max(0.6, share * 10)} width="2" height={Math.max(0.6, share * 10)} />{/each}</svg>{/if}</span>
                <span class="rl">{#if tile.release}<span class="t">release&nbsp;<b>{hidden(tile.release.tag, tile.private)}</b>{#if tile.release.prerelease}<span class="pre">PRE</span>{/if} · {ageText(tile.release.at, now)}{#if tile.release.ahead} · +{tile.release.ahead}&nbsp;since{/if}</span><span>↓ <b>{compact(tile.release.downloads)}</b></span>{:else}<span class="t">no release</span>{/if}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/key}
  {/if}

  {#if hover !== null}
    <HoverCard anchor={hover.anchor} bounds={hover.bounds} testid="github-card">
      <p class="chead"><span>{hover.head}</span><span>{hover.side}</span></p>
      <CardRows rows={hover.rows} />
      {#if hover.note !== null}<p class="cnote">{hover.note}</p>{/if}
    </HoverCard>
  {/if}

  {#if settingsOpen}
    <div class="settings crt-on" data-testid="github-settings">
      <h5>This pane</h5>
      <div class="opt"><span>Repositories</span>
        <span class="seg"><button type="button" class="tool" class:on={choices.spec.repos === 'auto'} onclick={() => patch({ repos: undefined })}>auto · my top 8</button></span>
      </div>
      <textarea bind:value={pinnedText} spellcheck="false" placeholder="owner/name, one a line ({GH_LIMITS.maxRepos} at most)" onblur={savePinned}></textarea>
      <div class="opt"><span>Inbox</span>
        <span class="seg"><button type="button" class="tool" class:on={choices.spec.inbox === 'all'} onclick={() => patch({ inbox: undefined })}>all unread</button><button type="button" class="tool" class:on={choices.spec.inbox === 'participating'} onclick={() => patch({ inbox: 'participating' })}>participating</button></span>
      </div>
      <div class="opt"><span>Contribution band</span>
        <span class="seg"><button type="button" class="tool" class:on={choices.band} onclick={() => patch({ band: undefined })}>on</button><button type="button" class="tool" class:on={!choices.band} onclick={() => patch({ band: false })}>off</button></span>
      </div>
      <p>The account is gh's own; elecdex never sees the token. Read only while this pane is shown. However many repositories it watches, an hour stays under 5% of the REST rate limit (from eight repositories their events and runs are read every 10 minutes), far less as an unchanged answer (304) costs nothing; under 10% left every reading waits four times as long, and a refusal for the limit waits as GitHub says.</p>
      <h5>Every GITHUB STATUS pane</h5>
      <div class="opt"><span>Incident toasts</span>
        <span class="seg"><button type="button" class="tool" class:on={incidents.notify} onclick={() => setIncidents({ notify: true })}>on</button><button type="button" class="tool" class:on={!incidents.notify} onclick={() => setIncidents({ notify: false })}>off</button></span>
      </div>
      <div class="opt"><span>From</span>
        <span class="seg">{#each [['info', 'ANY'], ['warn', 'MINOR'], ['danger', 'MAJOR']] as [id, label] (id)}<button type="button" class="tool" class:on={incidents.minSeverity === id} onclick={() => setIncidents({ minSeverity: id as 'info' | 'warn' | 'danger' })}>{label}</button>{/each}</span>
      </div>
      <div class="opt"><span>Copilot-only incidents</span>
        <span class="seg"><button type="button" class="tool" class:on={!incidents.skip.includes('Copilot')} onclick={() => setIncidents({ skip: incidents.skip.filter((c) => c !== 'Copilot') })}>toast</button><button type="button" class="tool" class:on={incidents.skip.includes('Copilot')} onclick={() => setIncidents({ skip: [...new Set([...incidents.skip, 'Copilot'])] })}>skip</button></span>
      </div>
      <div class="opt"><span>System notification when elecdex is not in front</span>
        <span class="seg"><button type="button" class="tool" class:on={incidents.system} onclick={() => setIncidents({ system: true })}>on</button><button type="button" class="tool" class:on={!incidents.system} onclick={() => setIncidents({ system: false })}>off</button></span>
      </div>
      <p>githubstatus.com is read while a pane is shown, every 5 minutes; an incident that names no component always passes. Other components are left out by editing github.incidents.skip in settings.json.</p>
    </div>
  {/if}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <footer
    class="foot"
    onpointerenter={(e) => board && card('ledger', e.currentTarget as HTMLElement, e.clientX, () => ({
      head: 'requests today · by probe',
      side: String(board?.ledger.requests ?? 0),
      rows: ledgerCardRows(board?.ledger.probes ?? []),
      note: `${board?.ledger.notModified ?? 0} answered 304 (unchanged) and used no rate limit. gh: ${board?.executable ?? 'not found'}${board?.ghVersion ? ` · ${board.ghVersion}` : ''}.`,
    }))}
    onpointerleave={() => leave('ledger')}
    data-testid="github-foot"
  >
    {#if board !== null && board.problem !== null}
      <!-- The problem is a sentence to read; under MASK only its kind, since gh's words can name a private repository. -->
      <span class="problem" data-testid="github-problem">{shownProblem(board.problem, masked)}</span>
    {:else}
      <span>{board === null ? 'read only while shown' : ledgerLine(board.ledger, 'gh')}</span>
    {/if}
    {#if refreshing !== null}<span class="note" data-testid="github-refresh-note">{refreshing}</span>{/if}
    {#if !narrow}<span>read only · only while shown{board?.ghVersion ? ` · gh ${board.ghVersion}` : ''}</span>{/if}
  </footer>
</div>

<style>
.rate { display: flex; flex-direction: column; color: var(--warn); }

.rate small { font-size: var(--step--2); }

.rate span { font-family: var(--font-mono); font-size: var(--step--1); letter-spacing: 0; }

.band {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.3rem 0;
  border-top: 1px solid var(--panel-rule);
  border-bottom: 1px solid var(--panel-rule);
}

.figure.big { cursor: default; }

.figure.big b { font-family: var(--font-display); font-size: var(--step-2); font-weight: 500; color: var(--accent-strong); text-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--accent); }

.figure.big b small { font-size: var(--step-0); color: var(--text-muted); text-shadow: none; }

.streak { text-align: right; align-items: flex-end; }

.tip { position: absolute; top: 0.2rem; right: 6rem; font-family: var(--font-mono); font-size: var(--step--1); background: var(--surface-2); border: 1px solid var(--panel-border); padding: 0 0.4rem; }

.row.q { grid-template-columns: 2.4rem 11rem minmax(0, 1fr) 6rem 3rem 1rem; }

.row.i { grid-template-columns: 0.6rem 2.4rem 11rem minmax(0, 1fr) 5.4rem 3rem 1rem; }

.row.e { grid-template-columns: 11rem minmax(0, 1fr) 3rem; }

.row.r { grid-template-columns: 0.7rem 6rem 8rem minmax(0, 1fr) 6.5rem 4rem 3rem 1rem; }

.row.r.head { font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); border-bottom: 1px solid var(--panel-rule); }

.row.p { grid-template-columns: 5.4rem 0.7rem minmax(0, 1fr) 7.5rem 3rem; }

.row.l { grid-template-columns: 9rem minmax(0, 1fr) 6rem 3rem; }

@container cloudview (max-width: 42rem) {
  .row.q { grid-template-columns: 2.4rem 8rem minmax(0, 1fr) 5.4rem 3rem; }
  .row.q .go, .row.i .tag, .row.i .go { display: none; }
  .row.i { grid-template-columns: 0.6rem 2.4rem 8rem minmax(0, 1fr) 3rem; }
  .row.r { grid-template-columns: 0.7rem 6rem minmax(0, 1fr) 3rem; }
  .row.r .c-branch, .row.r .c-event, .row.r .c-took, .row.r .go { display: none; }
}

@container cloudview (max-width: 30rem) {
  .row.q { grid-template-columns: 2.4rem minmax(0, 1fr) 4.8rem; }
  .row.q .repo, .row.q .age { display: none; }
  .row.i { grid-template-columns: 0.6rem 2.4rem minmax(0, 1fr) 3rem; }
  .row.i .repo { display: none; }
  .row.e { grid-template-columns: minmax(0, 1fr) 3rem; }
  .row.e .repo { display: none; }
  .row.p { grid-template-columns: 5.4rem 0.7rem minmax(0, 1fr) 3rem; }
  .row.p .mono { display: none; }
}

.kind {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-weight: 700;
  text-align: center;
  border: 1px solid var(--panel-border);
  color: var(--text);
}

.kind[data-kind='ci'], .kind[data-kind='security'] { color: var(--danger); border-color: var(--danger); }

.kind[data-kind='run'] { color: var(--warn); border-color: var(--warn); }

.unread { width: 0.4rem; height: 0.4rem; transform: rotate(45deg); background: var(--accent); align-self: center; }

.unread.no { background: transparent; }

.row.read .title, .row.read .repo { color: var(--text-dim); }

.parts { display: flex; flex-wrap: wrap; gap: 0.2rem 0.7rem; }

.parts b { font-family: var(--font-mono); font-weight: 500; color: var(--accent-strong); }

.parts .mine { color: var(--text-dim); }

.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.5rem; padding: 0.2rem 0; }

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.35rem 0.5rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tile:hover, .tile:focus-visible { background: var(--accent-faint); outline: 1px solid var(--accent); outline-offset: -1px; }

.tile.red { border-color: color-mix(in srgb, var(--danger) 70%, transparent); }

.tile .nm { display: flex; align-items: center; gap: 0.4rem; font-family: var(--font-mono); font-size: var(--step--1); min-width: 0; }

.tile .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }

.lock, .pre { font-size: var(--step--2); letter-spacing: var(--tracking-wide); border: 1px solid var(--panel-rule); padding: 0 0.2rem; color: var(--text-dim); flex: none; }

.stars { display: flex; align-items: baseline; gap: 0.5rem; }

.stars b { font-family: var(--font-display); font-size: var(--step-1); font-weight: 500; color: var(--accent-strong); }

.stars span { font-family: var(--font-mono); font-size: var(--step--1); color: var(--ok); }

.stars span.zero { color: var(--text-dim); }

.tfacts { display: grid; grid-template-columns: repeat(4, auto); justify-content: space-between; font-size: var(--step--2); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-muted); }

.tfacts b { display: block; font-family: var(--font-mono); font-size: var(--step--1); font-weight: 400; color: var(--text); letter-spacing: 0; text-transform: none; }

.runs { display: flex; align-items: center; gap: 0.22rem; }

/* The month's stars as a line, and fourteen days of views as bars: shapes the numbers lack. */
.spark { width: 4.5rem; height: 1rem; margin-left: auto; overflow: visible; }

.spark polyline { fill: none; stroke: var(--accent); stroke-width: 1.4; vector-effect: non-scaling-stroke; stroke-linejoin: round; }

.runs .vlabel { margin-left: auto; }

.views { width: 3.6rem; height: 0.7rem; }

.views rect { fill: color-mix(in srgb, var(--accent) 65%, transparent); }

.runs small { font-size: var(--step--2); color: var(--text-muted); margin-right: 0.3rem; letter-spacing: var(--tracking-wide); text-transform: uppercase; }

.rl { display: flex; justify-content: space-between; gap: 0.5rem; font-family: var(--font-mono); font-size: var(--step--1); color: var(--text-dim); border-top: 1px dashed var(--panel-rule); padding-top: 0.2rem; white-space: nowrap; }

.rl b { color: var(--text); font-weight: 400; }

/* A first contribution: a small mark before the title, in the accent's quiet outline. */
.first { margin-right: 0.4rem; padding: 0 0.25rem; border: 1px solid var(--accent); color: var(--accent); font-size: var(--step--2); letter-spacing: var(--tracking-wide); }

/* The release line wraps at its dots rather than cutting "+38 since" short in a narrow tile. */
.rl { flex-wrap: wrap; row-gap: 0; }

.tile .rl .t { white-space: normal; overflow: visible; }

.facts { display: flex; flex-wrap: wrap; gap: 1.4rem; padding: 0.3rem 0; border-bottom: 1px solid var(--panel-rule); }

.facts small { display: block; font-size: var(--step--2); letter-spacing: var(--tracking-wide); color: var(--text-muted); }

.facts b { font-family: var(--font-display); font-size: var(--step-1); font-weight: 500; color: var(--accent-strong); }
</style>
