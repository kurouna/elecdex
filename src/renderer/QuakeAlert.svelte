<script lang="ts">
import {
  ALERT_WINDOW_MS,
  describeQuake,
  JMA_QUAKE_PAGE,
  type Quake,
  quakeLanguage,
  quakeSeverity,
} from '@shared/quakes'
import { appearance } from './stores/appearance.svelte.ts'
import { sfx } from './stores/sound.svelte.ts'

/**
 * The earthquake alert: a banner at the top centre when main announces an
 * earthquake (alerts on in settings, at or above the chosen intensity).
 *
 * The banner follows the earthquake as later reports arrive - the first report
 * has only intensities, the hypocentre and magnitude come a minute or two later -
 * so it reads the quake from the live list by id. A strong one (5- and up) stays
 * until closed; a weaker one goes after a minute. It says where the information
 * comes from and that it is not the Earthquake Early Warning.
 */

/** How long a banner for an earthquake below 5- stays up. */
const MINOR_MS = 60_000
/** Banners shown at once; more are dropped oldest first. */
const MAX_SHOWN = 3

const language = quakeLanguage(navigator.language)

/** Announced earthquakes still shown, newest first, as last known. */
let shown = $state.raw<Quake[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Banners closed by hand, kept for the session: a reload shows this run's recent
 * announcements again (see below), and one already closed must not come back.
 */
const DISMISSED_KEY = 'elecdex.quakes.dismissed'

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function dismiss(id: string, byHand = false): void {
  clearTimeout(timers.get(id))
  timers.delete(id)
  shown = shown.filter((q) => q.id !== id)
  if (!byHand) return
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([id, ...readDismissed()].slice(0, 20)))
  } catch {
    // Storage unavailable: the banner may show again after a reload, nothing worse.
  }
}

function announce(quakes: Quake[]): void {
  const ids = new Set(quakes.map((q) => q.id))
  shown = [...quakes, ...shown.filter((q) => !ids.has(q.id))].slice(0, MAX_SHOWN)
  for (const id of timers.keys()) if (!shown.some((q) => q.id === id)) dismiss(id)
  for (const quake of quakes) {
    if (quakeSeverity(quake) === 'severe' || timers.has(quake.id)) continue
    timers.set(
      quake.id,
      setTimeout(() => dismiss(quake.id), MINOR_MS),
    )
  }
  if (appearance.settings.quakes.sound) sfx.play('quake')
}

$effect(() => {
  const offAlert = window.elecdex.quakes.onAlert(announce)
  let first = true
  const offState = window.elecdex.quakes.observe((state) => {
    // An alert decided before this page could hear it (startup, a reload): show it now.
    if (first) {
      first = false
      const dismissed = new Set(readDismissed())
      const recent = state.announced
        .filter((id) => !dismissed.has(id))
        .map((id) => state.quakes.find((q) => q.id === id))
        .filter((q): q is Quake => q !== undefined && Date.now() - q.at <= ALERT_WINDOW_MS)
      if (recent.length > 0) announce(recent)
      return
    }
    // Later reports on a shown earthquake update its banner.
    if (shown.length === 0) return
    const latest = new Map(state.quakes.map((q) => [q.id, q]))
    shown = shown.map((q) => latest.get(q.id) ?? q)
    // A later report can raise the intensity: a banner that became severe stays.
    for (const quake of shown) {
      if (quakeSeverity(quake) !== 'severe' || !timers.has(quake.id)) continue
      clearTimeout(timers.get(quake.id))
      timers.delete(quake.id)
    }
  })
  return () => {
    offAlert()
    offState()
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }
})

const time = (at: number) => new Date(at).toTimeString().slice(0, 5)
</script>

{#if shown.length > 0}
  <div class="alerts" role="alert" data-testid="quake-alerts">
    {#each shown as quake (quake.id)}
      <div class="alert crt-on {quakeSeverity(quake)}" data-testid="quake-alert" data-id={quake.id}>
        <button
          type="button"
          class="open"
          title={JMA_QUAKE_PAGE}
          onclick={() => void window.elecdex.system.openExternal(JMA_QUAKE_PAGE)}
        >
          <span class="head">
            <strong>{language === 'ja' ? '地震情報' : 'earthquake'}</strong>
            <span class="time">{time(quake.at)}</span>
          </span>
          <span class="what" data-testid="quake-alert-text">{describeQuake(quake, language)}</span>
          <span class="source">
            {language === 'ja'
              ? '出典：気象庁 · 緊急地震速報ではありません'
              : 'Source: JMA · not an Earthquake Early Warning'}
          </span>
        </button>
        <button
          type="button"
          class="close"
          aria-label="dismiss"
          onclick={() => dismiss(quake.id, true)}
          data-testid="quake-alert-dismiss">×</button
        >
      </div>
    {/each}
  </div>
{/if}

<style>
.alerts {
  position: fixed;
  top: var(--space-4);
  left: 50%;
  z-index: 850;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(40rem, 90vw);
  transform: translateX(-50%);
}

.alert {
  --crt-duration: 300ms;
  --tone: var(--warn);
  display: flex;
  align-items: stretch;
  border: 1px solid var(--tone);
  background: var(--app-bg);
  box-shadow: 0 0 14px color-mix(in srgb, var(--tone) 45%, transparent);
  font-family: var(--font-ui);
}

.alert.severe {
  --tone: var(--danger);
}

.alert.minor {
  --tone: var(--accent);
}

button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.open {
  flex: 1;
  display: grid;
  gap: 0.15rem;
  padding: var(--space-2) var(--space-3);
  color: var(--text);
  text-align: left;
}

.open:hover {
  background: color-mix(in srgb, var(--tone) 10%, transparent);
}

.head {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.head strong {
  color: var(--tone);
}

.time {
  color: var(--text-muted);
}

.what {
  font-size: var(--step-1);
}

.source {
  font-size: var(--step--2);
  color: var(--text-muted);
}

.close {
  padding: 0 var(--space-3);
  border-left: 1px solid var(--panel-border);
  color: var(--text-muted);
}

.close:hover {
  color: var(--tone);
}
</style>
