<script lang="ts">
import {
  areaLabel,
  clockTime,
  intensityLabel,
  intensityShort,
  JMA_QUAKE_PAGE,
  magnitudeLabel,
  type Quake,
  type QuakeState,
  quakeLanguage,
  quakeSeverity,
  USGS_QUAKE_PAGE,
} from '@shared/quakes'
import { tsunamiLevelLabel, tsunamiSummary } from '@shared/tsunami'
import { flip } from 'svelte/animate'
import { carryFresh, FreshTracker } from '../../lib/fresh.ts'
import { NewAbove } from '../../lib/new-above.svelte.ts'
import { tsunamiTone } from '../../lib/tsunami-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import NewPill from '../common/NewPill.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * Recent earthquakes, newest first, from the source chosen in settings: JMA for
 * Japan (graded by maximum intensity) or the USGS for the world (by magnitude).
 * A tsunami warning, watch or advisory in effect shows as a strip above the list.
 *
 * While this pane is open main checks the source every minute (see
 * main/quakes/service.ts); closed, and with alerts off, nothing is fetched. The
 * alerts themselves are a setting, not this pane: the pane lists, and says what
 * it is set to announce. Not in the default layout.
 */
const { paneId }: WidgetProps = $props()

const language = quakeLanguage(navigator.language)
let current = $state.raw<QuakeState | null>(null)

/** Earthquakes listed since the first reading of this source, marked until their highlight ends. */
let fresh = $state.raw<ReadonlySet<string>>(new Set())
const tracker = new FreshTracker()
const above = new NewAbove()

function receive(next: QuakeState): void {
  if (next.source !== current?.source) {
    // Another source is another list: nothing in it is new to this one.
    tracker.reset()
    fresh = new Set()
    above.clear()
  }
  // Before the first check there is no list to compare with.
  if (next.fetchedAt !== null) {
    const ids = next.quakes.map((q) => q.id)
    const added = tracker.next(ids)
    fresh = carryFresh(fresh, added, ids)
    above.arrived(added.length)
  }
  current = next
}

$effect(() => window.elecdex.quakes.subscribe(receive))

function settled(id: string, event: AnimationEvent): void {
  if (event.animationName !== 'fx-fresh' || !fresh.has(id)) return
  fresh = new Set([...fresh].filter((key) => key !== id))
}

const source = $derived(current?.source ?? null)
const quakes = $derived(current?.quakes ?? [])
const tsunami = $derived(current?.tsunami ?? null)
const settings = $derived(appearance.settings.quakes)

const SOURCES = {
  jma: { name: 'JMA', region: 'Japan', page: JMA_QUAKE_PAGE },
  usgs: { name: 'USGS', region: 'world', page: USGS_QUAKE_PAGE },
} as const

$effect(() => {
  const name = source === null ? '' : `${SOURCES[source].name} · `
  paneMeta.set(paneId, {
    subtitle: current?.fetchedAt
      ? `${name}updated ${clockTime(current.fetchedAt)}`
      : `${name}connecting…`,
    ...(tsunami !== null
      ? { badge: 'tsunami', badgeKind: 'danger' as const }
      : current?.error
        ? { badge: 'stale', badgeKind: 'warn' as const }
        : {}),
  })
})

/** What the alerts are set to, in the pane's own words. */
const alertLabel = $derived.by(() => {
  if (!settings.notify) return 'alerts off'
  return source === 'usgs'
    ? `alerts · M${settings.minMagnitude.toFixed(1)} and up`
    : `alerts · shindo ${settings.minIntensity} and up`
})

function when(at: number): string {
  const d = new Date(at)
  return `${d.getMonth() + 1}/${d.getDate()} ${clockTime(at)}`
}

/** The badge: the intensity where JMA gives one, the magnitude otherwise. */
function badge(quake: Quake): { text: string; title: string } {
  if (quake.maxIntensity !== null) {
    return {
      text: intensityShort(quake.maxIntensity, language),
      title: intensityLabel(quake.maxIntensity, language),
    }
  }
  return {
    text: quake.magnitude === null ? '—' : quake.magnitude.toFixed(1),
    title: magnitudeLabel(quake.magnitude),
  }
}

function meta(quake: Quake): string {
  const parts = [when(quake.at)]
  // The badge already shows a USGS quake's magnitude; a JMA one's is worth adding.
  if (quake.maxIntensity !== null && quake.magnitude !== null)
    parts.push(magnitudeLabel(quake.magnitude))
  if (quake.depthKm !== null) parts.push(`${quake.depthKm} km`)
  if (quake.distant) parts.push('distant')
  return parts.join(' · ')
}
</script>

<div class="quakes" data-testid="quakes" data-source={source}>
  <!-- The alerts are an app setting, not the pane's: the button opens them in the settings dialog. -->
  <SettingsButton
    open={ui.settingsOpen}
    label="earthquake and tsunami settings"
    testid="quakes-settings-toggle"
    ontoggle={() => ui.openSettings('alerts')}
  />
  <div class="tools">
    {#if source !== null}
      <span class="source-name" title="Settings → Alerts chooses the source">{SOURCES[source].region}</span>
    {/if}
    <span class="alerts" class:on={settings.notify} data-testid="quakes-alerts">{alertLabel}</span>
  </div>

  {#if tsunami !== null}
    <button
      type="button"
      class="tsunami {tsunamiTone(tsunami)}"
      title={tsunami.url}
      onclick={() => void window.elecdex.system.openExternal(tsunami.url)}
      data-testid="quakes-tsunami"
      data-level={tsunami.level}
    >
      <strong>{tsunamiLevelLabel(tsunami.level, language)}</strong>
      <span class="summary">{tsunamiSummary(tsunami, language)}</span>
      <span class="issued">{clockTime(tsunami.issuedAt)}</span>
    </button>
  {/if}

  {#if quakes.length === 0}
    <p class="note" data-testid="quakes-status">
      {current?.error
        ? `could not read the earthquake list: ${current.error}`
        : 'fetching the earthquake list…'}
    </p>
  {:else}
    <div class="list-frame">
      <NewPill count={above.count} onjump={() => above.jump(!appearance.reducedMotion)} testid="quakes-new" />
      <ul class="list" bind:this={above.list} onscroll={() => above.scrolled()} data-testid="quakes-list">
        {#each quakes as quake (quake.id)}
          {@const b = badge(quake)}
          {@const severity = quakeSeverity(quake)}
          <li
            class:fx-fresh={fresh.has(quake.id)}
            animate:flip={{ duration: appearance.reducedMotion ? 0 : 360 }}
            onanimationend={(e) => settled(quake.id, e)}
            data-fresh={fresh.has(quake.id) || undefined}
          >
            <button
              type="button"
              class="row {severity}"
              title={quake.url}
              onclick={() => void window.elecdex.system.openExternal(quake.url)}
              data-testid="quake-row"
              data-id={quake.id}
            >
              <span class="badge" title={b.title}>{b.text}</span>
              <span class="place">
                <span class="area">{areaLabel(quake, language)}</span>
                <span class="meta">{meta(quake)}</span>
              </span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if source !== null}
    <button
      type="button"
      class="credit"
      title={SOURCES[source].page}
      onclick={() => source && void window.elecdex.system.openExternal(SOURCES[source].page)}
      data-testid="quakes-credit"
    >
      {source === 'jma'
        ? `出典：気象庁ホームページ（${JMA_QUAKE_PAGE}）を加工して作成`
        : 'Earthquakes: U.S. Geological Survey · tsunamis: NOAA Tsunami Warning Centers'} · not an
      earthquake early warning
    </button>
  {/if}
</div>

<style>
.quakes {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
  font-family: var(--font-ui);
}

.tools {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-2);
  min-height: 1.1rem;
  /* Clear of the settings button in the corner. */
  margin-right: 1.5rem;
}

.source-name {
  margin-right: auto;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

/* A tsunami in effect: above everything else in the pane, in the colour of its level. */
.tsunami {
  --tone: var(--warn);
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding: 0.2rem var(--space-2);
  border: 1px solid var(--tone);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
  color: var(--text);
  font: inherit;
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
}

.tsunami.severe {
  --tone: var(--danger);
}

.tsunami strong {
  color: var(--tone);
  white-space: nowrap;
}

.tsunami .summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tsunami .issued {
  color: var(--text-muted);
}

.alerts {
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.alerts.on {
  color: var(--accent);
}

.note {
  flex: 1;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.list-frame {
  position: relative;
  flex: 1;
  min-height: 0;
}

.list {
  height: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.list li + li {
  border-top: 1px solid var(--panel-rule);
}

/* A new row is highlighted in the colour of its severity, as its badge is. */
.list li:has(> .moderate) {
  --fx-tone: var(--warn);
}

.list li:has(> .severe) {
  --fx-tone: var(--danger);
}

.row {
  --tone: var(--text-muted);
  display: grid;
  grid-template-columns: 2.6rem 1fr;
  gap: var(--space-2);
  align-items: center;
  width: 100%;
  padding: 0.2rem var(--space-1);
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.row.moderate {
  --tone: var(--warn);
}

.row.severe {
  --tone: var(--danger);
}

.row:hover .area {
  color: var(--accent);
}

.badge {
  padding: 0.05rem 0;
  border: 1px solid var(--tone);
  color: var(--tone);
  font-family: var(--font-display);
  font-size: var(--step-0);
  text-align: center;
}

.place {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.area,
.meta {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.area {
  font-size: var(--step--1);
}

.meta {
  font-size: var(--step--1);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.credit {
  margin: 0;
  padding: 0 0 0.1rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  cursor: pointer;
}

.credit:hover {
  color: var(--accent);
  text-decoration: underline;
}
</style>
