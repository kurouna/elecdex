<script lang="ts">
import {
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
import { layout } from '../../stores/layout.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import Detail from './Detail.svelte'
import EventLog from './EventLog.svelte'
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
  layout.patchPaneState(paneId, patch)
}

$effect(() => {
  const next = sample
  if (next === null) return
  untrack(() => wifiHistory.push(next, chosen))
})

const points = $derived(wifiHistory.points)
const links = $derived<WifiLink[]>(sample?.data.links ?? [])
const link = $derived(primaryLink(links, chosen))
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

const rates = $derived(perMinute(wifiHistory.marks))
</script>

<div class="wifi" data-testid="wifi" data-pane-id={paneId} {@attach observe}>
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
    {#if links.length > 1}
      <select
        class="pick"
        aria-label="which adapter to follow"
        value={link?.id}
        onchange={(e) => setState({ link: e.currentTarget.value })}
      >
        {#each links as l (l.id)}<option value={l.id}>{l.adapter}</option>{/each}
      </select>
    {/if}
    <span class="mos" data-tone={mosTone} title="estimated call quality (E-model), from the last minute of echoes" data-testid="wifi-mos">
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

  {#if sample === null}
    <p class="empty" data-testid="wifi-empty">ACQUIRING LINK…</p>
  {:else if links.length === 0}
    <p class="empty" data-testid="wifi-empty">NO WIRELESS ADAPTER</p>
  {:else}
    <PathStrip {diagnosis} {figures} {latest} {points} />

    {#if sections.radio && link !== null && link.state === 'connected'}
      <RadioPanel {link} wide={sections.radioWide} />
    {/if}

    <div class="lower" class:stacked={sections.stacked}>
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
          />
        </div>
      {/if}
      {#if (sections.stacked || view === 'detail') && link !== null}
        <div class="slot detail-slot">
          <Detail {link} {rates} mask={masked} host={probe?.host ?? null} />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
.wifi {
  container-type: inline-size;
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
  font-size: var(--step--2);
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

.pick {
  max-width: 10rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
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
  font-size: var(--step--2);
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
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.tabs button.on {
  border-bottom-color: var(--accent);
  color: var(--accent-strong);
}

.tabs .n {
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
</style>
