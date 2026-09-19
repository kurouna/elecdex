<script lang="ts">
import type { NetSocket } from '@shared/metrics'
import { groupByProcess, inView, matches, type SocketView, socketKey } from '@shared/sockets'
import { untrack } from 'svelte'
import { carryFresh, FreshTracker } from '../../lib/fresh.ts'
import { GhostTracker } from '../../lib/ghosts.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import CountryBus from './CountryBus.svelte'
import SocketRow from './SocketRow.svelte'

/**
 * Every socket this machine holds, by the program holding it.
 *
 * The netstat pane says whether the machine is on the network; this says what it
 * is talking to. A machine's table is mostly one program repeated - a browser
 * holds dozens - so the process is the unit, with its sockets under it, and the
 * countries its peers are in are summed into the bus across the top.
 *
 * Everything in it is local: the table comes from the kernel (the collector's
 * sockets/ readers) and the countries from the GeoIP database bundled with the
 * app, the same one the globe uses. No address is ever looked up online.
 *
 * The source is read only while this pane is on screen - it is not in
 * `keepWhileHidden` - so a pane behind another tab costs nothing at all.
 */
// `paneState`, not `state`: a binding called `state` shadows the $state rune.
const { paneId, state: paneState }: WidgetProps = $props()

const sample = $derived(metrics.get('net.sockets'))

/** What the pane is showing, and how it is filtered; kept in pane state. */
const view = $derived<SocketView>(paneState?.view === 'listening' ? 'listening' : 'active')
const masked = $derived(paneState?.mask === true)
const collapsed = $derived(new Set(asStrings(paneState?.collapsed)))

let query = $state('')
let hovered = $state<string | null>(null)

const setState = (patch: Record<string, unknown>): void => {
  layout.setPaneState(paneId, { ...(paneState ?? {}), ...patch })
}

const tracker = new FreshTracker()
const ghosts = new GhostTracker<NetSocket>(socketKey)
let fresh = $state.raw<ReadonlySet<string>>(new Set())
/** The reading, with the rows that went since the one before it. */
let drawn = $state.raw<{ item: NetSocket; gone: boolean }[]>([])

/*
 * A reading arrives every few seconds; both trackers are driven from it, so
 * nothing here keeps a timer and a ghost lasts exactly one interval.
 *
 * The reading is the only thing this effect follows. `carryFresh` reads the set
 * it is replacing, and an effect that both reads and writes the same state runs
 * itself again for ever - which is what froze the pane, on any machine busy
 * enough to open a socket after the first reading (a fixed table never did).
 */
$effect(() => {
  const sockets = sample?.sockets
  if (sockets === undefined) return
  untrack(() => {
    drawn = ghosts.update(sockets)
    const keys = sockets.map(socketKey)
    fresh = carryFresh(fresh, tracker.next(keys), keys)
  })
})

function settled(key: string, event: AnimationEvent): void {
  if (event.animationName !== 'fx-fresh' || !fresh.has(key)) return
  fresh = new Set([...fresh].filter((other) => other !== key))
}

const shown = $derived(
  drawn
    .filter(({ item }) => inView(item, view) && matches(item, query))
    .map(({ item, gone }) => ({
      item,
      gone,
      key: socketKey(item),
    })),
)

const groups = $derived(
  groupByProcess(shown.map((row) => row.item)).map((group) => ({
    ...group,
    rows: shown.filter((row) => ownerOf(row.item) === ownerKey(group)),
  })),
)

const ownerOf = (socket: NetSocket): string =>
  socket.pid === 0 ? `name:${socket.process}` : `pid:${socket.pid}`
const ownerKey = (group: { pid: number; name: string }): string =>
  group.pid === 0 ? `name:${group.name === 'unknown' ? '' : group.name}` : `pid:${group.pid}`

/** The countries of the rows on screen, most peers first. */
const bus = $derived.by(() => {
  const counts = new Map<string, number>()
  let unplaced = 0
  for (const { item } of shown) {
    if (!item.publicPeer) continue
    if (item.country === '') unplaced += 1
    else counts.set(item.country, (counts.get(item.country) ?? 0) + 1)
  }
  const countries = [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
  return { countries, unplaced }
})

function toggle(name: string): void {
  const next = new Set(collapsed)
  if (!next.delete(name)) next.add(name)
  setState({ collapsed: [...next] })
}

$effect(() => {
  const owners = sample?.ownersUnknown === true ? ' · owners unavailable' : ''
  paneMeta.set(paneId, {
    subtitle:
      sample === null
        ? 'reading the socket table…'
        : `${sample.established} active · ${sample.listening} listening${owners}`,
    ...(sample !== null && sample.dropped > 0
      ? { badge: `+${sample.dropped}`, badgeKind: 'warn' as const }
      : {}),
  })
})

function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}
</script>

<div class="connections" data-testid="connections" data-pane-id={paneId}>
  <div class="controls">
    <div class="views" role="group" aria-label="which sockets to show">
      {#each [['active', 'ACTIVE'], ['listening', 'LISTENING']] as const as [id, label] (id)}
        <button
          type="button"
          class:on={view === id}
          data-testid="connections-view"
          data-view={id}
          aria-pressed={view === id}
          onclick={() => setState({ view: id })}>{label}</button
        >
      {/each}
    </div>
    <input
      class="filter"
      type="text"
      spellcheck="false"
      autocomplete="off"
      placeholder="filter"
      aria-label="filter the sockets"
      data-testid="connections-filter"
      bind:value={query}
    />
    <button
      type="button"
      class="mask"
      class:on={masked}
      aria-pressed={masked}
      title="hide the second half of every address"
      data-testid="connections-mask"
      onclick={() => setState({ mask: !masked })}>MASK</button
    >
  </div>

  <CountryBus
    countries={bus.countries}
    unplaced={bus.unplaced}
    {hovered}
    onhover={(code) => {
      hovered = code
    }}
  />

  <div class="list" data-testid="connections-list">
    {#if sample === null}
      <p class="empty">reading the socket table…</p>
    {:else if groups.length === 0}
      <p class="empty" data-testid="connections-empty">
        {query === '' ? 'nothing on this view' : 'nothing matches that'}
      </p>
    {:else}
      {#each groups as group (group.name + group.pid)}
        {@const folded = collapsed.has(group.name)}
        <section class="group" data-testid="connections-group">
          <button
            type="button"
            class="head"
            aria-expanded={!folded}
            data-testid="connections-group-head"
            onclick={() => toggle(group.name)}
          >
            <span class="caret" aria-hidden="true">{folded ? '▸' : '▾'}</span>
            <span class="name">{group.name}</span>
            {#if group.pid > 0}<span class="pid">{group.pid}</span>{/if}
            <span class="tally">{group.rows.length}</span>
            {#if group.outside > 0}<span class="out" title="peers on the public internet"
                >⟶ {group.outside}</span
              >{/if}
            <span class="where">{group.countries.slice(0, 3).join(' ')}</span>
          </button>
          {#if !folded}
            <div class="rows" role="list">
              {#each group.rows as row (row.key)}
              <SocketRow
                socket={row.item}
                gone={row.gone}
                fresh={fresh.has(row.key)}
                lit={hovered !== null && row.item.country === hovered}
                mask={masked}
                onhover={(code) => {
                  hovered = code
                }}
                  onsettled={(event) => settled(row.key, event)}
                />
              {/each}
            </div>
          {/if}
        </section>
      {/each}
    {/if}
  </div>

  <p class="credit">
    IP geolocation by <span>ip-location-db</span>, from RIR data published by the NRO (CC BY 4.0).
    Read on this machine; nothing is looked up online.
  </p>
</div>

<style>
.connections {
  container-type: inline-size;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--panel-rule);
}

.views {
  display: flex;
}

.views button,
.mask {
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.views button + button {
  border-left: none;
}

.views button.on,
.mask.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.views button:hover,
.mask:hover {
  color: var(--text);
}

.filter {
  flex: 1;
  min-width: 3rem;
  padding: 0.1rem 0.35rem;
  border: 1px solid var(--panel-rule);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.filter:focus {
  outline: none;
  border-color: var(--accent);
}

.list {
  overflow-y: auto;
  min-height: 0;
  padding-bottom: var(--space-1);
}

.empty {
  margin: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text-muted);
}

/*
 * A process and its sockets, drawn as a module in a rack: a rule down the left
 * ties the rows to the head they belong to, which is what makes a table of two
 * hundred sockets read as a dozen programs.
 */
.group {
  border-left: 2px solid var(--panel-rule);
  margin: var(--space-1) 0 0 var(--space-1);
}

.head {
  display: flex;
  align-items: baseline;
  gap: 0.4em;
  width: 100%;
  padding: 0.1rem var(--space-1);
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.04em;
  text-align: left;
  cursor: pointer;
}

.head:hover {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.caret {
  color: var(--accent-dim);
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pid,
.tally,
.out,
.where {
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--text-muted);
}

.tally {
  margin-left: auto;
}

.out {
  color: var(--accent-strong);
}

.where {
  letter-spacing: 0.08em;
  color: var(--accent-dim);
}

.credit {
  margin: 0;
  padding: 0.15rem var(--space-2);
  border-top: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--3);
  line-height: 1.3;
  color: var(--text-muted);
}

/* Too narrow for the credit to be readable: the globe pane carries the same
   attribution, and an unreadable line is worse than one line elsewhere. */
@container (max-width: 17rem) {
  .credit {
    display: none;
  }

  .where {
    display: none;
  }
}
</style>
