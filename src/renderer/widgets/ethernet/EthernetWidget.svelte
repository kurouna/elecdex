<script lang="ts">
import {
  buildEtherReport,
  conflictEvents,
  diagnoseEthernet,
  ETHER_CAUSE_LABELS,
  ETHER_LIMITS,
  type EtherLink,
  etherCulprit,
  etherEvents,
  etherFigures,
  etherSections,
  mergeEtherEvents,
  routeWord,
  speedLabel,
} from '@shared/ethernet'
import { mosOf, perMinute, regularInterval, roundMs } from '@shared/netpath'
import { untrack } from 'svelte'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { reportProblems } from '../../lib/fault-report.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import {
  megabits,
  SPARK_H,
  SPARK_W,
  type StationView,
  sparkPath,
  type WireView,
} from '../netpath/draw.ts'
import HintCard from '../netpath/HintCard.svelte'
import PathStrip from '../netpath/PathStrip.svelte'
import type { WidgetProps } from '../registry.ts'
import Detail from './Detail.svelte'
import EventLog from './EventLog.svelte'
import { lookupEtherHint, shortWired } from './hints.ts'
import { etherHistory } from './history.svelte.ts'
import LinkPanel from './LinkPanel.svelte'
import Timeline from './Timeline.svelte'

/**
 * ETHERNET: where a wired connection is failing (architecture.md §5.23) - the
 * Wi-Fi pane's sibling, with the cable where it has the radio.
 *
 * The path from this machine to the internet is measured a segment at a time -
 * the link (its speed against what it had, its duplex, CRC errors, drops and
 * broadcast floods), the hop to the router (an echo a second from this adapter's
 * own address), the way beyond, and what the machine is sending - and
 * `diagnoseEthernet` (shared/ethernet/diagnose.ts) says which segment is at fault, with the
 * figures it rests on. Under that, the link as it stands, a timeline of the last
 * minutes, and the log of what the pane saw.
 *
 * Laid out as the Wi-Fi pane is: two columns when brought forward on a wide
 * screen, tabs when short; every figure explains itself when the pointer rests on
 * it; chips choose among adapters. Read only while the pane is seen; nothing is
 * kept on disk. The judgements are pure; this file only wires them to the page.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const sample = $derived(metrics.sample('net.ethernet'))

const masked = $derived(paneState?.mask === true)
const windowId = $derived(typeof paneState?.window === 'string' ? paneState.window : '5m')
const chosen = $derived(typeof paneState?.link === 'string' ? paneState.link : null)
const VIEWS = ['timeline', 'link', 'log', 'detail'] as const
type View = (typeof VIEWS)[number]
const asked = $derived<View>(VIEWS.find((v) => v === paneState?.view) ?? 'timeline')

const setState = (patch: Record<string, unknown>): void => {
  widgetState.patch(paneId, patch)
}

$effect(() => {
  const next = sample
  if (next === null) return
  untrack(() => etherHistory.push(next))
})

const links = $derived<EtherLink[]>(sample?.data.links ?? [])
/** The adapter followed: the one chosen, else the first up, else the first. */
const link = $derived(
  links.find((l) => l.id === chosen) ?? links.find((l) => l.state === 'up') ?? links[0] ?? null,
)
const points = $derived(etherHistory.points(link?.id ?? null))
const bestSeen = $derived(etherHistory.bestSpeed(link?.id ?? null))
const probe = $derived(sample?.data.probe ?? null)
const latest = $derived(points[points.length - 1] ?? null)
const now = $derived(latest?.at ?? 0)

const figures = $derived(etherFigures(points, now, bestSeen))
const diagnosis = $derived(diagnoseEthernet(link, figures))
const culprit = $derived(etherCulprit(diagnosis))
const mos = $derived(link?.route === 'default' ? mosOf(figures.internet) : null)
const events = $derived(
  mergeEtherEvents(
    etherEvents(points.filter((p) => p.at > now - 3_600_000)),
    conflictEvents(link, now - 3_600_000),
  ),
)

// What the reader could not read reaches the screen, once each (lib/fault-report.ts).
$effect(() => {
  const problems = sample?.data.problems ?? []
  if (problems.length > 0) untrack(() => reportProblems('ETHERNET', problems))
})
const dropEvery = $derived(
  regularInterval(events.filter((e) => e.kind === 'link-lost').map((e) => e.at)),
)
const rates = $derived(perMinute(etherHistory.marks(link?.id ?? null)))
const up = $derived(link?.state === 'up')

let width = $state(0)
let height = $state(0)
const sections = $derived(etherSections(width, height))
/** The tabs the lower part offers: the link panel among them when it has no room of its own. */
const tabs = $derived(VIEWS.filter((v) => v !== 'link' || (!sections.link && up)))
const view = $derived<View>(tabs.includes(asked) ? asked : 'timeline')
const TAB_LABELS: Record<View, string> = {
  timeline: 'TIMELINE',
  link: 'LINK',
  log: 'LOG',
  detail: 'DETAIL',
}

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

/** The Wi-Fi pane's state words, and AUTHENTICATING while 802.1X holds the port. */
const stateWord = $derived.by(() => {
  if (link === null) return 'NO ADAPTER'
  if (link.state === 'disabled') return 'DISABLED'
  if (link.state !== 'up') return 'NO CARRIER'
  if (link.authenticated === false) return 'AUTHENTICATING'
  if (link.internet === 'constrained') return 'SIGN-IN'
  if (link.internet === 'local' || link.internet === 'none') return 'LOCAL ONLY'
  return 'ONLINE'
})
const mosTone = $derived(mos === null ? 'idle' : mos >= 3.6 ? 'ok' : mos >= 3.1 ? 'warn' : 'bad')

$effect(() => {
  // Down, the badge already names the state: the subtitle says which adapter instead.
  const words =
    link === null
      ? stateWord.toLowerCase()
      : link.state !== 'up'
        ? [link.alias, link.busDetail].filter(Boolean).join(' · ')
        : [
            speedLabel(link.speedMbps),
            link.duplex,
            link.bus === null ? null : link.bus === 'pci' ? 'PCIe' : link.bus.toUpperCase(),
          ]
            .filter(Boolean)
            .join(' · ')
  paneMeta.set(paneId, {
    subtitle: sample === null ? 'acquiring the link…' : words,
    ...(diagnosis.health !== 'ok'
      ? {
          badge: ETHER_CAUSE_LABELS[diagnosis.cause].toLowerCase(),
          badgeKind: diagnosis.health === 'bad' ? ('danger' as const) : ('warn' as const),
        }
      : {}),
  })
})

const copier = new CopyFlag()
$effect(() => () => copier.dispose())

function copyReport(): void {
  const text = buildEtherReport({
    now: Date.now(),
    link,
    diagnosis,
    lastMinute: figures,
    lastFive: etherFigures(points, now, bestSeen, 300_000),
    mos,
    events,
    mask: masked,
  })
  void copier.copy('report', text)
}

const hop = (s: typeof figures.gateway): string =>
  s.sent === 0
    ? 'no echo'
    : s.received === 0
      ? 'silent'
      : `${roundMs(s.median)} ±${s.jitter === null ? '—' : Math.round(s.jitter)}`
const loss = (s: typeof figures.gateway): string =>
  s.sent === 0 ? '' : `loss ${s.loss < 10 ? s.loss.toFixed(1) : Math.round(s.loss)}%`
const routed = $derived(link !== null && up && link.route !== 'default' && link.route !== null)
/** No way out known on this machine: the internet is shown when it answers, never judged. */
const noRoute = $derived(link !== null && up && link.route === null)

const stations = $derived<StationView[]>([
  {
    id: 'pc',
    name: 'PC',
    health: diagnosis.segments.pc,
    main: figures.up === null || !up ? '—' : `↑ ${megabits(figures.up)}`,
    sub: figures.down === null || !up ? '' : `↓ ${megabits(figures.down)}`,
  },
  {
    id: 'link',
    name: 'LINK',
    health: diagnosis.segments.link,
    main:
      link === null
        ? '—'
        : up
          ? `${speedLabel(figures.speed)} ${link.duplex ?? ''}`.trim()
          : stateWord.toLowerCase(),
    sub: !up
      ? ''
      : figures.errors === 0 || figures.errorShare === null
        ? 'crc 0'
        : `crc ${figures.errorShare.toFixed(2)}%`,
  },
  {
    id: 'gateway',
    name: 'GATEWAY',
    health: diagnosis.segments.gateway,
    main: up ? hop(figures.gateway) : '—',
    sub: up ? loss(figures.gateway) : '',
  },
  {
    id: 'internet',
    name: 'INTERNET',
    health: diagnosis.segments.internet,
    main: !up
      ? '—'
      : routed
        ? `via ${routeWord(link?.route ?? null)}`
        : noRoute && figures.internet.received === 0
          ? 'no route'
          : hop(figures.internet),
    sub: !up ? '' : routed || noRoute ? 'not judged' : loss(figures.internet),
  },
])

/** Each wire's last minute: the link's use on the first, the round trips on the others. */
const wires = $derived.by<WireView[]>(() => {
  const last = points.slice(-60)
  const top = (values: (number | null | undefined)[], floor: number): number =>
    Math.max(floor, ...values.filter((v): v is number => typeof v === 'number')) * 1.1
  const gateway = last.map((p) => p.gateway)
  const internet = last.map((p) => p.internet)
  const use = last.map((p) =>
    p.state === 'up' && p.speed !== null
      ? (((p.up ?? 0) + (p.down ?? 0)) * 8) / 1e6 / p.speed
      : null,
  )
  return [
    {
      to: 'link',
      health: diagnosis.segments.link,
      spark: sparkPath(use, 0, 1, SPARK_W, SPARK_H),
      runs: up,
      lost: false,
    },
    {
      to: 'gateway',
      health: diagnosis.segments.gateway,
      spark: sparkPath(gateway, 0, top(gateway, ETHER_LIMITS.gatewayRtt.bad), SPARK_W, SPARK_H),
      runs: typeof latest?.gateway === 'number',
      lost: latest?.gateway === null,
    },
    {
      to: 'internet',
      health: diagnosis.segments.internet,
      spark: sparkPath(internet, 0, top(internet, 120), SPARK_W, SPARK_H),
      runs: typeof latest?.internet === 'number',
      lost: latest?.internet === null,
    },
  ]
})

/**
 * The legend's example, as Wi-Fi's reads the internet's own figure: the internet
 * while this adapter is the way out and it answers, else the gateway - a cable's
 * gateway is mostly <1 ms, which explains little.
 */
const example = $derived.by(() => {
  const s =
    link?.route === 'default' && figures.internet.received > 0 ? figures.internet : figures.gateway
  return s.received === 0
    ? '— ±—'
    : `${roundMs(s.median)} ±${s.jitter === null ? '—' : Math.round(s.jitter)}`
})

let root = $state<HTMLElement | null>(null)
const hintContext = $derived({ link, figures, diagnosis, mos, host: probe?.host ?? null, rates })
</script>

<div class="ether" data-testid="ether" data-pane-id={paneId} bind:this={root} {@attach observe}>
  <header class="top">
    <svg class="port" viewBox="0 0 21 17" aria-hidden="true">
      <path d="M1 1h19v11h-4v4H5v-4H1z" />
      {#each [5, 9.5, 14] as x (x)}<rect {x} y="4" width="2" height="4" class:on={up} />{/each}
    </svg>
    <span class="name" data-testid="ether-name">{link === null ? '—' : shortWired(link.adapter)}</span>
    <span class="state" data-state={link === null ? 'none' : link.state} data-testid="ether-state">
      <i></i>{stateWord}
    </span>
    <span class="mos" data-tone={mosTone} data-hint="mos" data-testid="ether-mos">
      <span class="k">MOS</span>
      <b>{mos === null ? '—' : mos.toFixed(1)}</b>
      <span class="meter" aria-hidden="true">
        {#each [1, 2, 3, 4, 5] as n (n)}<i class:on={mos !== null && mos >= n - 0.25}></i>{/each}
      </span>
    </span>
    <button
      type="button"
      class="tool"
      class:on={masked}
      aria-pressed={masked}
      title="hide the addresses"
      data-testid="ether-mask"
      onclick={() => setState({ mask: !masked })}>MASK</button
    >
    <button type="button" class="tool" title="copy a report of the last minutes" data-testid="ether-copy" onclick={copyReport}
      >{copier.key === 'report' ? 'COPIED' : 'COPY'}</button
    >
  </header>

  {#if links.length > 1}
    <div class="adapters" role="tablist" aria-label="which adapter to follow">
      {#each links as l (l.id)}
        <button
          type="button"
          role="tab"
          class="chip"
          class:on={l.id === link?.id}
          aria-selected={l.id === link?.id}
          data-state={l.state}
          data-testid="ether-adapter"
          data-link={l.id}
          data-hint="adapter-chip"
          onclick={() => setState({ link: l.id })}
        >
          <span class="pins" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="chip-name">{shortWired(l.adapter)}</span>
          <span class="speed">{l.state === 'up' ? speedLabel(l.speedMbps) : l.state === 'disabled' ? 'disabled' : 'no carrier'}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if sample === null}
    <p class="empty" data-testid="ether-empty">ACQUIRING LINK…</p>
  {:else if links.length === 0}
    <p class="empty" data-testid="ether-empty">NO WIRED ADAPTER</p>
  {:else}
    <div class="upper" class:wide={sections.wide}>
      <PathStrip
        kind="ether"
        {stations}
        {wires}
        {culprit}
        verdict={{
          key: diagnosis.cause,
          label: ETHER_CAUSE_LABELS[diagnosis.cause],
          health: diagnosis.health,
          evidence: diagnosis.evidence,
        }}
        {example}
        {points}
        limits={{ gateway: ETHER_LIMITS.gatewayRtt, internet: ETHER_LIMITS.internetRtt }}
      />
      {#if sections.link && link !== null && up}
        <LinkPanel {link} {figures} wide={sections.linkWide} />
      {/if}
    </div>

    <div class="lower" class:stacked={sections.stacked} class:wide={sections.wide}>
      {#if !sections.stacked}
        <div class="tabs" role="tablist" aria-label="what the lower part shows">
          {#each tabs as id (id)}
            <button
              type="button"
              role="tab"
              class:on={view === id}
              aria-selected={view === id}
              data-testid="ether-view"
              data-view={id}
              onclick={() => setState({ view: id })}
              >{TAB_LABELS[id]}{#if id === 'log'}<span class="n">{events.length}</span>{/if}</button
            >
          {/each}
        </div>
      {/if}
      {#if !sections.stacked && view === 'link' && link !== null && up}
        <div class="slot link-slot"><LinkPanel {link} {figures} wide={sections.linkWide} /></div>
      {/if}
      {#if sections.stacked || view === 'timeline'}
        <div class="slot timeline-slot">
          <Timeline
            {points}
            {events}
            window={windowId}
            titled={sections.stacked}
            onwindow={(id) => setState({ window: id })}
            {bestSeen}
            capMbps={link?.settings?.capMbps ?? null}
            speedMbps={figures.speed}
          />
        </div>
      {/if}
      {#if sections.stacked || view === 'log'}
        <div class="slot log-slot">
          <EventLog {events} {points} {now} {dropEvery} titled={sections.stacked} />
        </div>
      {/if}
      {#if (sections.stacked || view === 'detail') && link !== null}
        <div class="slot detail-slot">
          <Detail {link} {rates} mask={masked} host={probe?.host ?? null} />
        </div>
      {/if}
    </div>
    <HintCard {root} kind="ether" lookup={(key) => lookupEtherHint(key, hintContext)} />
  {/if}
</div>

<style>
.ether {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  height: 100%;
  min-height: 0;
  padding: 0.2rem var(--space-2) var(--space-1);
  overflow: hidden;
}

.top {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--panel-rule);
}

/* A port: its pins lit while the link is up, as the Wi-Fi pane's bars are by the signal. */
.port {
  flex: none;
  width: 1.2rem;
}

.port path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.4;
}

.port rect {
  fill: var(--accent-faint);
}

.port rect.on {
  fill: var(--accent);
}

.name {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-display);
  font-size: var(--step-1);
  letter-spacing: 0.04em;
  color: var(--accent-strong);
  text-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--accent);
}

.state {
  --tone: var(--ok);
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.state:not([data-state='up']) {
  --tone: var(--danger);
}

.state[data-state='none'],
.state[data-state='disabled'] {
  --tone: var(--text-muted);
}

.state i {
  width: 0.45rem;
  height: 0.45rem;
  transform: rotate(45deg);
  background: var(--tone);
  box-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
}

.mos {
  --tone: var(--accent);
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  margin-left: auto;
  font-family: var(--font-mono);
}

.mos[data-tone='warn'] {
  --tone: var(--warn);
}

.mos[data-tone='bad'] {
  --tone: var(--danger);
}

.mos .k {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.mos b {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 400;
  color: var(--tone);
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
}

.meter {
  display: inline-flex;
  gap: 2px;
}

.meter i {
  width: 4px;
  height: 0.7rem;
  background: var(--accent-faint);
  transform: skewX(-18deg);
}

.meter i.on {
  background: var(--tone);
}

.tool {
  flex: none;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: 0.1em;
  cursor: pointer;
}

.tool:hover {
  color: var(--text);
}

.tool.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.empty {
  display: grid;
  flex: 1;
  place-items: center;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--step-1);
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}

.adapters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: -0.2rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.12rem 0.55rem 0.12rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%);
}

.chip:hover {
  color: var(--text);
}

.chip.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--text);
}

.chip:not([data-state='up']) .speed {
  color: var(--danger);
}

.chip .chip-name {
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.pins {
  display: inline-flex;
  gap: 1px;
}

.pins i {
  width: 3px;
  height: 0.55rem;
  background: var(--accent);
}

.chip:not([data-state='up']) .pins i {
  background: var(--accent-faint);
}

.upper {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

/* Wide: the path and its verdict beside the link panel, as the Wi-Fi pane's beside its radio. */
.upper.wide {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  align-items: start;
  gap: 1.2rem;
}

.lower {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.45rem;
  min-height: 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--panel-rule);
}

.tabs button {
  padding: 0.1rem 0.7rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.tabs button.on {
  border-bottom-color: var(--accent);
  color: var(--accent-strong);
}

.tabs .n {
  font-size: var(--step--2);
  margin-left: 0.35em;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.slot {
  flex: 1;
  min-height: 0;
}

.link-slot,
.detail-slot {
  overflow-y: auto;
}

.stacked .timeline-slot {
  flex: 1.6;
}

.stacked .log-slot {
  flex: 1;
}

.stacked .detail-slot {
  flex: none;
}

.lower.stacked.wide {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 0.6rem 1.2rem;
}

.lower.stacked.wide .timeline-slot {
  grid-column: 1 / -1;
}

@container (max-width: 24rem) {
  .mos .meter,
  .state {
    display: none;
  }
}
</style>
