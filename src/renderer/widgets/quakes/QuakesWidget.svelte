<script lang="ts">
import {
  areaLabel,
  intensityLabel,
  JMA_QUAKE_PAGE,
  type QuakeState,
  quakeLanguage,
  quakeSeverity,
} from '@shared/quakes'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * Recent earthquakes in and around Japan, from JMA, newest first.
 *
 * While this pane is open main checks JMA's list every minute (see
 * main/quakes/service.ts); closed, and with alerts off, nothing is fetched. The
 * alerts themselves are a setting, not this pane: the pane only lists, and says
 * whether alerts are on. Not in the default layout.
 */
const { paneId }: WidgetProps = $props()

const language = quakeLanguage(navigator.language)
let current = $state.raw<QuakeState | null>(null)

$effect(() => window.elecdex.quakes.subscribe((next) => (current = next)))

const quakes = $derived(current?.quakes ?? [])
const alerts = $derived(appearance.settings.quakes)

$effect(() => {
  const time = current?.fetchedAt ? new Date(current.fetchedAt).toTimeString().slice(0, 5) : null
  paneMeta.set(paneId, {
    subtitle: time ? `JMA · updated ${time}` : 'JMA · connecting…',
    ...(current?.error ? { badge: 'stale', badgeKind: 'warn' as const } : {}),
  })
})

function when(at: number): string {
  const d = new Date(at)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "5-" as shown in a badge: 5弱 in Japanese, 5- otherwise. */
const shortIntensity = (label: string) =>
  language === 'ja' ? label.replace('-', '弱').replace('+', '強') : label
</script>

<div class="quakes" data-testid="quakes">
  <div class="tools">
    <button
      type="button"
      class="alerts"
      class:on={alerts.notify}
      onclick={() => ui.openSettings('alerts')}
      title="Earthquake alert settings"
      data-testid="quakes-alerts"
    >
      {alerts.notify ? `alerts · shindo ${alerts.minIntensity} and up` : 'alerts off'}
    </button>
  </div>

  {#if quakes.length === 0}
    <p class="note" data-testid="quakes-status">
      {current?.error ? `could not read JMA's list: ${current.error}` : 'fetching the earthquake list…'}
    </p>
  {:else}
    <ul class="list" data-testid="quakes-list">
      {#each quakes as quake (quake.id)}
        <li>
          <button
            type="button"
            class="row {quakeSeverity(quake)}"
            title={JMA_QUAKE_PAGE}
            onclick={() => void window.elecdex.system.openExternal(JMA_QUAKE_PAGE)}
            data-testid="quake-row"
            data-id={quake.id}
          >
            <span class="intensity" title={quake.maxIntensity ? intensityLabel(quake.maxIntensity, language) : ''}>
              {quake.maxIntensity ? shortIntensity(quake.maxIntensity) : '—'}
            </span>
            <span class="place">
              <span class="area">{areaLabel(quake, language)}</span>
              <span class="meta">
                {when(quake.at)}{quake.magnitude === null ? '' : ` · M${quake.magnitude.toFixed(1)}`}{quake.depthKm === null ? '' : ` · ${quake.depthKm} km`}{quake.distant ? ' · distant' : ''}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <button
    type="button"
    class="credit"
    title={JMA_QUAKE_PAGE}
    onclick={() => void window.elecdex.system.openExternal(JMA_QUAKE_PAGE)}
    data-testid="quakes-credit"
  >
    出典：気象庁ホームページ（{JMA_QUAKE_PAGE}）を加工して作成 · not an Earthquake Early Warning
  </button>
</div>

<style>
.quakes {
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
  min-height: 1.1rem;
}

.alerts {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.alerts.on {
  color: var(--accent);
}

.alerts:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.note {
  flex: 1;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.list {
  flex: 1;
  min-height: 0;
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

.intensity {
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
  font-size: var(--step--2);
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
  font-size: 0.5rem;
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
