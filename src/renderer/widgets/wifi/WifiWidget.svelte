<script lang="ts">
import {
  availability,
  bandOf,
  buildReport,
  CAUSE_LABELS,
  derivedEvents,
  diagnose,
  latencySpikes,
  logEvents,
  maskName,
  mergeEvents,
  mosOf,
  pathFigures,
  perMinute,
  primaryLink,
  regularInterval,
  signalBars,
  type WifiLink,
  wifiSections,
} from '@shared/wifi'
import { untrack } from 'svelte'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import Detail from './Detail.svelte'
import EventLog from './EventLog.svelte'
import HintCard from './HintCard.svelte'
import { shortAdapter } from './hints.ts'
import { wifiHistory } from './history.svelte.ts'
import PathStrip from './PathStrip.svelte'
import RadioPanel from './RadioPanel.svelte'
import Timeline from './Timeline.svelte'

/**
 * WI-FI: where a connection is failing, for a video call that stutters or a
 * train's Wi-Fi that keeps dropping (architecture.md §5.12).
 *
 * The path from this machine to the internet is measured a segment at a time -
 * the radio (signal, retries), the hop to the access point (an echo to the
 * gateway each second), the way beyond (an echo to the internet) and what the
 * machine is sending meanwhile - and `diagnose` (shared/wifi.ts) says which
 * segment is at fault, with the figures it rests on. Under that, the radio as
 * it stands, a timeline of the last minutes, and the log of what happened.
 *
 * With room for it - brought forward on a wide screen - the parts go to two
 * columns (`wifiSections().wide`). Every figure explains itself when the pointer
 * rests on it (HintCard, hints.ts), with what it reads now. With more than one
 * adapter, chips under the header choose the one followed; each keeps its own
 * history and its own gateway's echoes.
 *
 * Everything is read only while the pane is seen; nothing is kept on disk.
 * The judgements are pure functions in shared/wifi.ts; this file only wires
 * them to the page.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const sample = $derived(metrics.sample('net.wifi'))
const log = $derived(metrics.get('net.wifi.events'))

const masked = $derived(paneState?.mask === true)
const windowId = $derived(typeof paneState?.window === 'string' ? paneState.window : '5m')
const chosen = $derived(typeof paneState?.link === 'string' ? paneState.link : null)
const VIEWS = ['timeline', 'radio', 'log', 'detail'] as const
type View = (typeof VIEWS)[number]
const asked = $derived<View>(VIEWS.find((v) => v === paneState?.view) ?? 'timeline')

const setState = (patch: Record<string, unknown>): void => {
  widgetState.patch(paneId, patch)
}

$effect(() => {
  const next = sample
  if (next === null) return
  untrack(() => wifiHistory.push(next))
})

const links = $derived<WifiLink[]>(sample?.data.links ?? [])
const link = $derived(primaryLink(links, chosen))
const points = $derived(wifiHistory.points(link?.id ?? null))
const probe = $derived(sample?.data.probe ?? null)
const limits = $derived(sample?.data.limits ?? [])
const latest = $derived(points[points.length - 1] ?? null)
const now = $derived(latest?.at ?? 0)

const figures = $derived(pathFigures(points, now))
const diagnosis = $derived(diagnose(link, figures))
const mos = $derived(mosOf(figures.internet))

const events = $derived(
  mergeEvents(
    logEvents(log?.events ?? []),
    derivedEvents(points.filter((p) => p.at > now - 3_600_000)),
  ),
)
const dropEvery = $derived(
  regularInterval(
    events.filter((e) => e.kind === 'disconnected' || e.kind === 'upstream-lost').map((e) => e.at),
  ),
)
const spikeEvery = $derived(
  regularInterval(latencySpikes(points.filter((p) => p.at > now - 900_000))),
)

let width = $state(0)
let height = $state(0)
const sections = $derived(wifiSections(width, height))
/** The tabs the lower part offers: the radio among them when it has no room of its own. */
const tabs = $derived(VIEWS.filter((v) => v !== 'radio' || !sections.radio))
const view = $derived<View>(tabs.includes(asked) ? asked : 'timeline')
const showRadio = $derived(sections.radio || (!sections.stacked && view === 'radio'))
const TAB_LABELS: Record<View, string> = {
  timeline: 'TIMELINE',
  radio: 'RADIO',
  log: 'LOG',
  detail: 'DETAIL',
}

// The pane's size from the observer's own rectangle: a pane just brought forward
// still measures as the one it left (CLAUDE.md, pane zoom).
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

const ssid = $derived(
  link?.ssid == null
    ? limits.includes('ssid-location')
      ? 'name withheld by macOS'
      : '—'
    : masked
      ? maskName(link.ssid)
      : link.ssid,
)

const STATE_WORDS = {
  connected: 'ONLINE',
  connecting: 'CONNECTING',
  disconnected: 'NO CARRIER',
  off: 'RADIO OFF',
} as const

const stateWord = $derived.by(() => {
  if (link === null) return 'NO ADAPTER'
  if (link.state !== 'connected') return STATE_WORDS[link.state]
  if (link.internet === 'constrained') return 'SIGN-IN'
  if (link.internet === 'local' || link.internet === 'none') return 'LOCAL ONLY'
  return 'ONLINE'
})

const mosTone = $derived(mos === null ? 'idle' : mos >= 3.6 ? 'ok' : mos >= 3.1 ? 'warn' : 'bad')

$effect(() => {
  const band = bandOf(link?.freqMhz ?? null)
  const words =
    link === null || link.state !== 'connected'
      ? stateWord.toLowerCase()
      : [
          band === null ? null : `${band} GHz`,
          link.channel === null ? null : `ch ${link.channel}`,
          link.rssi === null ? null : `${link.rssi} dBm`,
        ]
          .filter(Boolean)
          .join(' · ')
  paneMeta.set(paneId, {
    subtitle: sample === null ? 'acquiring the link…' : words,
    ...(diagnosis.health !== 'ok'
      ? {
          badge: CAUSE_LABELS[diagnosis.cause].toLowerCase(),
          badgeKind: diagnosis.health === 'bad' ? ('danger' as const) : ('warn' as const),
        }
      : {}),
  })
})

const copier = new CopyFlag()
$effect(() => () => copier.dispose())

function copyReport(): void {
  const text = buildReport({
    now: Date.now(),
    link,
    diagnosis,
    lastMinute: figures,
    lastFive: pathFigures(points, now, 300_000),
    mos,
    events,
    mask: masked,
  })
  void copier.copy('report', text)
}

const rates = $derived(perMinute(wifiHistory.marks(link?.id ?? null)))

/** The last day, connected and not, from the system's log. */
const day = $derived(availability(log?.events ?? [], now || Date.now()))

let root = $state<HTMLElement | null>(null)
const hintContext = $derived({
  link,
  figures,
  diagnosis,
  mos,
  rates,
  host: probe?.host ?? null,
})
</script>

<div class="wifi" data-testid="wifi" data-pane-id={paneId} bind:this={root} {@attach observe}>
  <header class="top">
    <svg class="bars" viewBox="0 0 20 16" aria-hidden="true">
      {#each [0, 1, 2, 3] as i (i)}
        <rect x={i * 5} y={12 - i * 4} width="3.4" height={4 + i * 4} class:on={i < signalBars(link?.rssi ?? null)} />
      {/each}
    </svg>
    <span class="ssid" data-testid="wifi-ssid">{ssid}</span>
    <span class="state" data-state={link?.state ?? 'none'} data-testid="wifi-state">
      <i></i>{stateWord}
    </span>
    <span class="mos" data-tone={mosTone} data-hint="mos" data-testid="wifi-mos">
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
      title="hide the network's name and the addresses"
      data-testid="wifi-mask"
      onclick={() => setState({ mask: !masked })}>MASK</button
    >
    <button
      type="button"
      class="tool"
      title="copy a report of the last minutes"
      data-testid="wifi-copy"
      onclick={copyReport}>{copier.key === 'report' ? 'COPIED' : 'COPY'}</button
    >
  </header>

  {#if links.length > 1}
    <!-- More than one adapter: each as a chip with its signal; the chosen one is followed. -->
    <div class="adapters" role="tablist" aria-label="which adapter to follow">
      {#each links as l (l.id)}
        <button
          type="button"
          role="tab"
          class="chip"
          class:on={l.id === link?.id}
          aria-selected={l.id === link?.id}
          data-state={l.state}
          data-testid="wifi-adapter"
          data-link={l.id}
          data-hint="adapter-chip"
          onclick={() => setState({ link: l.id })}
        >
          <svg class="mini" viewBox="0 0 20 16" aria-hidden="true">
            {#each [0, 1, 2, 3] as i (i)}
              <rect x={i * 5} y={12 - i * 4} width="3.4" height={4 + i * 4} class:on={i < signalBars(l.rssi)} />
            {/each}
          </svg>
          <span class="name">{shortAdapter(l.adapter)}</span>
          <span class="dbm">{l.state === 'connected' ? `${l.rssi ?? '—'} dBm` : l.state}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if sample === null}
    <p class="empty" data-testid="wifi-empty">ACQUIRING LINK…</p>
  {:else if links.length === 0}
    <p class="empty" data-testid="wifi-empty">NO WIRELESS ADAPTER</p>
  {:else}
    <div class="upper" class:wide={sections.wide}>
      <PathStrip {diagnosis} {figures} {latest} {points} />
      {#if sections.radio && link !== null && link.state === 'connected'}
        <RadioPanel {link} wide={sections.radioWide} />
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
              data-testid="wifi-view"
              data-view={id}
              onclick={() => setState({ view: id })}
              >{TAB_LABELS[id]}{#if id === 'log'}<span class="n">{events.length}</span>{/if}</button
            >
          {/each}
        </div>
      {/if}
      {#if !sections.stacked && view === 'radio' && showRadio}
        <div class="slot radio-slot">
          {#if link !== null && link.state === 'connected'}
            <RadioPanel {link} wide={sections.radioWide} />
          {:else}
            <p class="empty">{stateWord}</p>
          {/if}
        </div>
      {/if}
      {#if sections.stacked || view === 'timeline'}
        <div class="slot timeline-slot">
          <Timeline
            {points}
            {events}
            window={windowId}
            titled={sections.stacked}
            onwindow={(id) => setState({ window: id })}
          />
        </div>
      {/if}
      {#if sections.stacked || view === 'log'}
        <div class="slot log-slot">
          <EventLog
            {events}
            mask={masked}
            {dropEvery}
            {spikeEvery}
            noLog={limits.includes('no-log')}
            titled={sections.stacked}
            {day}
          />
        </div>
      {/if}
      {#if (sections.stacked || view === 'detail') && link !== null}
        <div class="slot detail-slot">
          <Detail {link} {rates} mask={masked} host={probe?.host ?? null} />
        </div>
      {/if}
    </div>
    <HintCard {root} context={hintContext} />
  {/if}
</div>

<style>
.wifi {
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

.bars {
  flex: none;
  width: 1.2rem;
}

.bars rect {
  fill: var(--accent-faint);
}

.bars rect.on {
  fill: var(--accent);
}

.ssid {
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

.state:not([data-state='connected']) {
  --tone: var(--danger);
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

.radio-slot {
  overflow-y: auto;
}

.slot {
  flex: 1;
  min-height: 0;
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

.detail-slot {
  overflow-y: auto;
}

@container (max-width: 24rem) {
  .mos .meter,
  .state {
    display: none;
  }
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

.chip:not([data-state='connected']) .dbm {
  color: var(--danger);
}

.chip .name {
  font-family: var(--font-ui);
  letter-spacing: 0.06em;
}

.mini {
  width: 0.85rem;
}

.mini rect {
  fill: var(--accent-faint);
}

.mini rect.on {
  fill: var(--accent);
}

.upper {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

/* Wide: the path and its verdict beside the radio, rather than one above the other
   with their figures spread to the far edges. */
.upper.wide {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  align-items: start;
  gap: 1.2rem;
}

/* And the timeline across, with the log beside the detail beneath it. */
.lower.stacked.wide {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 0.6rem 1.2rem;
}

.lower.stacked.wide .timeline-slot {
  grid-column: 1 / -1;
}

.lower.stacked.wide .detail-slot {
  overflow-y: auto;
}
</style>
