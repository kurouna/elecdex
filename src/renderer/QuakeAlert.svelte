<script lang="ts">
import {
  ALERT_WINDOW_MS,
  clockTime,
  describeQuake,
  type Quake,
  type QuakeAlert,
  type QuakeState,
  quakeLanguage,
  quakeSeverity,
  sourceCredit,
} from '@shared/quakes'
import { type Tsunami, tsunamiAlertKey, tsunamiLevelLabel, tsunamiSummary } from '@shared/tsunami'
import { flip } from 'svelte/animate'
import { CRT_EXTEND_MS } from './layout/pane-close.ts'
import { crtPower } from './lib/crt-transitions.ts'
import { announcedCard, closeCard, followCard, type TsunamiCard } from './lib/tsunami-card.ts'
import { appearance } from './stores/appearance.svelte.ts'
import { sfx } from './stores/sound.svelte.ts'
import { windowState } from './stores/window-state.svelte.ts'

/**
 * Alerts at the top centre: a tsunami card, and a banner per announced earthquake.
 *
 *  - Both follow later reports: an earthquake's first report has only
 *    intensities, and a tsunami's areas and level change as it develops, so they
 *    are read from the live state by id.
 *  - An earthquake of 5- or up (or magnitude 6 and up abroad) stays until closed;
 *    a weaker one goes after a minute.
 *  - A tsunami card stays while the tsunami is in effect. Closing it folds it into
 *    a small tab that opens it again - a warning in effect is never out of sight.
 *    When it is lifted the card says so, then goes.
 *  - Each says where the information comes from; earthquakes that they are not an
 *    early warning.
 */

/** How long a banner for a weaker earthquake stays up, and a lifted tsunami's card. */
const LINGER_MS = 60_000
/** Earthquake banners shown at once; more are dropped oldest first. */
const MAX_SHOWN = 3
/** How long the banners left take to close up behind one that has gone, as panes extend. */
const CLOSE_UP_MS = CRT_EXTEND_MS
/** Banners closed by hand, kept for the session so a reload does not bring them back. */
const DISMISSED_KEY = 'elecdex.quakes.dismissed'

const language = quakeLanguage(navigator.language)
windowState.follow()

/** Announced earthquakes still shown, newest first, as last known. */
let shown = $state.raw<Quake[]>([])
/** The announced tsunami's card (lib/tsunami-card.ts). */
let tsunami = $state.raw<TsunamiCard | null>(null)
let expanded = $state(false)
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function rememberDismissed(key: string): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([key, ...readDismissed()].slice(0, 20)))
  } catch {
    // Storage unavailable: the banner may show again after a reload, nothing worse.
  }
}

function later(key: string, fn: () => void): void {
  clearTimeout(timers.get(key))
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key)
      fn()
    }, LINGER_MS),
  )
}

function cancel(key: string): void {
  clearTimeout(timers.get(key))
  timers.delete(key)
}

function dismissQuake(id: string, byHand = false): void {
  cancel(id)
  shown = shown.filter((q) => q.id !== id)
  if (byHand) rememberDismissed(id)
}

function foldTsunami(): void {
  if (tsunami === null) return
  if (tsunami.lifted) cancel('tsunami')
  else rememberDismissed(tsunamiAlertKey(tsunami.value))
  tsunami = closeCard(tsunami)
  expanded = false
}

/** Shows what main announced; `quietly` for alerts already heard (a page catching up after a reload). */
function announce(alert: QuakeAlert, quietly = false): void {
  if (alert.tsunami !== null) {
    cancel('tsunami')
    tsunami = announcedCard(alert.tsunami)
  }
  showQuakes(alert.quakes)
  if (!quietly && appearance.settings.quakes.sound) sfx.play('quake')
}

/** Puts announced earthquakes on top; weaker ones go after a while, the oldest beyond the limit at once. */
function showQuakes(quakes: readonly Quake[]): void {
  if (quakes.length === 0) return
  const ids = new Set(quakes.map((q) => q.id))
  shown = [...quakes, ...shown.filter((q) => !ids.has(q.id))].slice(0, MAX_SHOWN)
  for (const id of timers.keys()) {
    if (id !== 'tsunami' && !shown.some((q) => q.id === id)) cancel(id)
  }
  for (const quake of quakes) {
    if (quakeSeverity(quake) !== 'severe' && !timers.has(quake.id)) {
      later(quake.id, () => dismissQuake(quake.id))
    }
  }
}

/** Brings shown alerts up to date with the latest state. */
function follow(state: QuakeState): void {
  if (shown.length > 0) {
    const latest = new Map(state.quakes.map((q) => [q.id, q]))
    shown = shown.map((q) => latest.get(q.id) ?? q)
    // A later report can raise the intensity: a banner that became severe stays.
    for (const quake of shown) if (quakeSeverity(quake) === 'severe') cancel(quake.id)
  }
  const next = followCard(tsunami, state)
  if (next.card === tsunami) return
  tsunami = next.card
  if (next.lifted) later('tsunami', () => (tsunami = null))
  else if (next.card === null || !next.card.lifted) cancel('tsunami')
}

/** On a page that opens after alerts were sent (startup, reload): what is still recent. */
function catchUp(state: QuakeState): void {
  const dismissed = new Set(readDismissed())
  const quakes = state.announced
    .filter((key) => !dismissed.has(key))
    .map((key) => state.quakes.find((q) => q.id === key))
    .filter((q): q is Quake => q !== undefined && Date.now() - q.at <= ALERT_WINDOW_MS[q.source])
  const current = state.tsunami
  const key = current === null ? null : tsunamiAlertKey(current)
  const announcedTsunami = key !== null && state.announced.includes(key) ? current : null
  if (quakes.length > 0 || announcedTsunami !== null) {
    announce({ quakes, tsunami: announcedTsunami }, true)
    if (announcedTsunami !== null && key !== null && dismissed.has(key)) {
      tsunami = closeCard(announcedCard(announcedTsunami))
    }
  }
}

$effect(() => {
  const offAlert = window.elecdex.quakes.onAlert((alert) => announce(alert))
  let first = true
  const offState = window.elecdex.quakes.observe((state) => {
    if (first) {
      first = false
      catchUp(state)
    } else {
      follow(state)
    }
  })
  return () => {
    offAlert()
    offState()
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }
})

const tsunamiTone = (value: Tsunami) =>
  value.level === 'major' || value.level === 'warning' ? 'severe' : 'moderate'

function arrival(area: Tsunami['areas'][number]): string {
  if (area.arrivalAt !== null) return clockTime(area.arrivalAt)
  return area.arrivalNote ?? ''
}

function height(value: string | null): string {
  if (value === null) return ''
  return /^[\d.]+$/.test(value) ? `${value} m` : value
}
</script>

{#if shown.length > 0 || tsunami !== null}
  <div class="alerts" class:windowed={!windowState.fullscreen} role="alert" data-testid="quake-alerts">
    {#if tsunami !== null && tsunami.folded}
      {@const value = tsunami.value}
      <button
        type="button"
        class="tsunami-tab crt-on {tsunamiTone(value)}"
        transition:crtPower|global
        onclick={() => tsunami && (tsunami = { ...tsunami, folded: false })}
        data-testid="tsunami-tab"
      >
        {tsunamiLevelLabel(value.level, language)} · {language === 'ja' ? '発表中' : 'in effect'}
      </button>
    {:else if tsunami !== null}
      {@const value = tsunami.value}
      <div
        class="alert tsunami crt-on {tsunami.lifted ? 'lifted' : tsunamiTone(value)}"
        transition:crtPower|global
        class:major={value.level === 'major' && !tsunami.lifted}
        data-testid="tsunami-alert"
        data-level={value.level}
        data-lifted={tsunami.lifted}
      >
        <div class="body">
          <span class="head">
            <strong data-testid="tsunami-level">{tsunamiLevelLabel(value.level, language)}</strong>
            {#if tsunami.lifted}
              <span class="state">{language === 'ja' ? '解除' : 'lifted'}</span>
            {/if}
            <span class="time">{clockTime(value.issuedAt)}</span>
          </span>
          <button
            type="button"
            class="what link"
            title={value.url}
            onclick={() => void window.elecdex.system.openExternal(value.url)}
            data-testid="tsunami-summary">{tsunamiSummary(value, language)}</button
          >
          {#if value.headline && value.source === 'jma' && !tsunami.lifted}
            <span class="headline">{value.headline}</span>
          {/if}
          {#if value.areas.length > 1 || value.areas.some((a) => a.arrivalAt !== null || a.arrivalNote || a.height)}
            <button
              type="button"
              class="toggle"
              aria-expanded={expanded}
              onclick={() => (expanded = !expanded)}
              data-testid="tsunami-toggle"
            >
              {expanded
                ? language === 'ja' ? '区域を隠す' : 'hide areas'
                : language === 'ja' ? `全 ${value.areas.length} 区域を表示` : `show all ${value.areas.length} areas`}
            </button>
          {/if}
          {#if expanded}
            <ul class="areas" data-testid="tsunami-areas">
              {#each value.areas as area (area.name)}
                <li class={area.level === 'major' || area.level === 'warning' ? 'severe' : 'moderate'}>
                  <span class="level">{tsunamiLevelLabel(area.level, language)}</span>
                  <span class="name">{area.name}</span>
                  <span class="arrival">{arrival(area)}</span>
                  <span class="height">{height(area.height)}</span>
                </li>
              {/each}
            </ul>
          {/if}
          <span class="source">
            {sourceCredit(value.source, language)} · {language === 'ja'
              ? '避難の判断は自治体・気象庁の情報に従ってください'
              : 'follow local authorities'}
          </span>
        </div>
        <button
          type="button"
          class="close"
          aria-label={tsunami.lifted ? 'dismiss' : 'fold'}
          title={tsunami.lifted ? '' : language === 'ja' ? '小さくする' : 'fold away'}
          onclick={foldTsunami}
          data-testid="tsunami-fold">{tsunami.lifted ? '×' : '–'}</button
        >
      </div>
    {/if}

    {#each shown as quake (quake.id)}
      <!-- Global: the last card leaves with the whole stack. The rest close up behind one that goes. -->
      <div
        class="alert crt-on {quakeSeverity(quake)}"
        transition:crtPower|global
        animate:flip={{ duration: appearance.reducedMotion ? 0 : CLOSE_UP_MS }}
        data-testid="quake-alert"
        data-id={quake.id}
      >
        <button
          type="button"
          class="body open"
          title={quake.url}
          onclick={() => void window.elecdex.system.openExternal(quake.url)}
        >
          <span class="head">
            <strong>{language === 'ja' ? '地震情報' : 'earthquake'}</strong>
            <span class="time">{clockTime(quake.at)}</span>
          </span>
          <span class="what" data-testid="quake-alert-text">{describeQuake(quake, language)}</span>
          <span class="source">
            {sourceCredit(quake.source, language)} · {language === 'ja'
              ? '緊急地震速報ではありません'
              : 'not an earthquake early warning'}
          </span>
        </button>
        <button
          type="button"
          class="close"
          aria-label="dismiss"
          onclick={() => dismissQuake(quake.id, true)}
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
  align-items: stretch;
  gap: var(--space-2);
  width: min(40rem, 90vw);
  max-height: calc(100vh - 2 * var(--space-4));
  transform: translateX(-50%);
}

/* Below the title bar when there is one (TitleBar.svelte, 30px), not over it. */
.alerts.windowed {
  top: calc(30px + var(--space-2));
  max-height: calc(100vh - 30px - var(--space-2) - var(--space-4));
}

.alert {
  --crt-duration: 300ms;
  --tone: var(--warn);
  display: flex;
  align-items: stretch;
  min-height: 0;
  border: 1px solid var(--tone);
  background: var(--app-bg);
  box-shadow: 0 0 14px color-mix(in srgb, var(--tone) 45%, transparent);
  font-family: var(--font-ui);
}

.alert.severe,
.tsunami-tab.severe {
  --tone: var(--danger);
}

.alert.minor,
.alert.lifted {
  --tone: var(--accent);
}

/* A major tsunami warning breathes, so it reads apart from everything else on screen -
   once it has powered on like every card (this rule would otherwise replace that). */
.alert.major {
  border-width: 2px;
  animation:
    crt-power-on var(--crt-duration) linear backwards,
    breathe 1.6s ease-in-out var(--crt-duration) infinite;
}

@keyframes breathe {
  50% {
    box-shadow: 0 0 26px color-mix(in srgb, var(--tone) 75%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .alert.major {
    animation: none;
  }
}

button {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.body {
  flex: 1;
  display: grid;
  gap: 0.15rem;
  min-width: 0;
  min-height: 0;
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

.tsunami .head strong {
  font-size: var(--step-1);
}

.state {
  color: var(--accent);
}

.time {
  color: var(--text-muted);
}

.what {
  font-size: var(--step-1);
  text-align: left;
}

.link:hover {
  color: var(--tone);
  text-decoration: underline;
}

.headline {
  font-size: var(--step--1);
  white-space: pre-line;
}

.toggle {
  justify-self: start;
  padding: 0;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.toggle:hover {
  color: var(--tone);
}

.areas {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.1rem var(--space-3);
  max-height: 40vh;
  margin: var(--space-1) 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  font-size: var(--step--1);
  scrollbar-width: thin;
}

.areas li {
  display: contents;
}

.areas .level {
  color: var(--warn);
}

.areas .severe .level {
  color: var(--danger);
}

.areas .arrival,
.areas .height {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
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

.tsunami-tab {
  --tone: var(--warn);
  align-self: center;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--tone);
  background: var(--app-bg);
  color: var(--tone);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 40%, transparent);
}
</style>
