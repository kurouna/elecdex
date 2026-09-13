<script lang="ts">
import { sourceName } from '@shared/weather-places'
import {
  formatTemperature,
  localDate,
  locationKey,
  readLocation,
  type TemperatureUnit,
  type WeatherDay,
  type WeatherLocation,
  type WeatherUpdate,
} from '@shared/weather-report'
import { SOURCES } from '@shared/weather-sources'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import SkyIcon from './SkyIcon.svelte'

/**
 * The forecast for one place: today in detail, then the week.
 *
 * The pane does not know where forecasts come from. It subscribes with a
 * location key and draws the WeatherReport main sends back - from JMA for Japan,
 * the National Weather Service for the United States or MET Norway elsewhere -
 * showing only what the source provides. Main fetches only while a pane shows a
 * place, and no more often than each source's terms allow.
 *
 * The place, the source for a US place, the area of a JMA office and the
 * temperature unit are pane state, chosen from the settings toggle. The credit
 * line is the one the source's terms ask for.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const location = $derived(readLocation(paneState))
const key = $derived(locationKey(location))
/** °F by default for a place in the United States, °C elsewhere, until the user picks. */
const unit = $derived<TemperatureUnit>(
  paneState?.units === 'f' || paneState?.units === 'c'
    ? paneState.units
    : location.source !== 'jma' && location.country === 'US'
      ? 'f'
      : 'c',
)

let update = $state.raw<WeatherUpdate | null>(null)
let settingsOpen = $state(false)

$effect(() => {
  const k = key
  update = null
  return window.elecdex.weather.subscribe(k, (next) => {
    update = next
  })
})

const report = $derived(update?.report ?? null)
const today = $derived(report?.days[0] ?? null)
const week = $derived(report?.days.slice(1, 7) ?? [])
const source = $derived(report?.source ?? SOURCES[location.source])

$effect(() => {
  const place = location.source === 'jma' ? (report?.place ?? location.name) : location.name
  let when = ''
  if (report?.issuedAt) {
    const issued = new Date(report.issuedAt)
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: report.timeZone,
      hour: '2-digit',
      minute: '2-digit',
    }).format(issued)
    when = location.source === 'jma' ? ` · ${time} 発表` : ` · updated ${time}`
  }
  paneMeta.set(paneId, {
    subtitle: `${place}${when}`,
    ...(update?.error ? { badge: 'offline', badgeKind: 'warn' as const } : {}),
  })
})

function save(change: Record<string, unknown>): void {
  layout.setPaneState(paneId, { ...paneState, office: undefined, area: undefined, ...change })
}

function chooseLocation(next: WeatherLocation): void {
  save({ location: next })
}

function pickLocation(): void {
  ui.pickLocation({ current: location, choose: chooseLocation })
}

/** A US place can be forecast by either service; the NWS is the default. */
const usPlace = $derived(location.source !== 'jma' && location.country === 'US')

function chooseSource(next: 'nws' | 'met'): void {
  if (location.source === 'jma' || location.source === next) return
  save({ location: { ...location, source: next } })
}

function chooseArea(area: string): void {
  if (location.source !== 'jma') return
  save({ location: { ...location, area } })
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function dayLabel(date: string): { day: string; weekday: string; weekend: string | null } {
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay()
  return {
    day: `${m}/${d}`,
    weekday: WEEKDAYS[weekday] ?? '',
    weekend: weekday === 0 ? 'sun' : weekday === 6 ? 'sat' : null,
  }
}

const temp = (celsius: number | null): string => formatTemperature(celsius, unit)

/** A chance when the source gives one, otherwise the amount. */
function wet(value: { pop: number | null; precipMm: number | null } | null): string {
  if (value === null) return '--'
  if (value.pop !== null) return `${value.pop}%`
  if (value.precipMm !== null) return `${value.precipMm}mm`
  return '--'
}

/** The part of today still ahead, for the six-hour blocks: past blocks are dimmed. */
const currentBlock = $derived.by(() => {
  if (!report || !today || localDate(new Date(), report.timeZone) !== today.date) return -1
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: report.timeZone,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  )
  return Math.floor(hour / 6)
})

const summaryText = (day: WeatherDay): string => day.text ?? day.sky?.label ?? ''
</script>

<div class="weather" data-testid="weather" data-source={location.source}>
  <SettingsButton
    open={settingsOpen}
    label="weather settings"
    testid="weather-settings-toggle"
    ontoggle={() => (settingsOpen = !settingsOpen)}
  />

  {#if settingsOpen}
    <div class="settings" data-testid="weather-settings">
      <label>
        <span>place</span>
        <button type="button" class="place" onclick={pickLocation} data-testid="weather-location">
          {location.source === 'jma' ? (report?.place ?? location.name) : location.name} · change…
        </button>
      </label>
      {#if usPlace}
        <label>
          <span>source</span>
          <select
            value={location.source}
            onchange={(e) => chooseSource(e.currentTarget.value as 'nws' | 'met')}
            data-testid="weather-source"
          >
            <option value="nws">National Weather Service</option>
            <option value="met">MET Norway</option>
          </select>
        </label>
      {/if}
      {#if location.source === 'jma' && report?.areas}
        <label>
          <span>area</span>
          <select
            value={report.areaCode}
            onchange={(e) => chooseArea(e.currentTarget.value)}
            data-testid="weather-area"
          >
            {#each report.areas as a (a.code)}
              <option value={a.code}>{a.name}</option>
            {/each}
          </select>
        </label>
      {/if}
      <div class="units" role="radiogroup" aria-label="Temperature unit">
        {#each [['c', '°C'], ['f', '°F']] as const as [id, label] (id)}
          <button
            type="button"
            role="radio"
            aria-checked={unit === id}
            class:active={unit === id}
            onclick={() => save({ units: id })}
            data-testid="weather-unit"
            data-unit={id}
          >
            {label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if report === null}
    <p class="status" data-testid="weather-status">
      {update?.error ? `forecast unavailable: ${update.error}` : `fetching forecast from ${sourceName(location.source)}…`}
    </p>
  {:else}
    {#if today}
      <section class="today" data-testid="weather-today">
        <SkyIcon glyph={report.now?.sky ?? today.sky} />
        <div class="today-text">
          <p class="telop" data-testid="weather-telop">{summaryText(today)}</p>
          <p class="wind">{today.wind ?? ''}</p>
        </div>
        <div class="today-temps">
          {#if report.now?.temp != null}
            <span class="max" data-testid="weather-now">{temp(report.now.temp)}</span>
            <span class="min">{temp(today.tempMax)} / {temp(today.tempMin)}</span>
          {:else}
            <span class="max" data-testid="weather-max">{temp(today.tempMax)}</span>
            <span class="min">{temp(today.tempMin)}</span>
          {/if}
        </div>
        {#if today.blocks}
          <ol class="pops" aria-label="precipitation by six hours">
            {#each today.blocks as block, i (i)}
              <li class:past={i < currentBlock || block === null}>
                <span class="label">{String(i * 6).padStart(2, '0')}</span>
                <span class="value">{wet(block)}</span>
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    {/if}

    <ol class="week" data-testid="weather-week">
      {#each week as day (day.date)}
        {@const label = dayLabel(day.date)}
        <li data-testid="weather-day" title={summaryText(day)}>
          <span class="date {label.weekend ?? ''}">{label.day}<small>{label.weekday}</small></span>
          <SkyIcon glyph={day.sky} />
          <span class="temps"><em>{temp(day.tempMax)}</em> / {temp(day.tempMin)}</span>
          <span class="pop">{wet(day)}</span>
        </li>
      {/each}
    </ol>
  {/if}

  <button
    type="button"
    class="attribution"
    title={source.url}
    onclick={() => void window.elecdex.system.openExternal(source.url)}
    data-testid="weather-attribution"
  >
    {source.credit}
  </button>
</div>

<style>
.weather {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
  font-family: var(--font-ui);
}

.settings {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  padding-right: 1.6rem;
  font-size: var(--step--1);
  text-transform: uppercase;
}

.settings label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.settings label > span {
  color: var(--text-muted);
}

.place,
.units button {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font: inherit;
  text-transform: none;
  cursor: pointer;
}

.place:hover,
.units button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.units {
  display: flex;
  gap: 2px;
}

.units button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

select {
  background: var(--app-bg);
  color: var(--text);
  border: 1px solid var(--panel-border);
  font: inherit;
  text-transform: none;
  padding: 0 var(--space-1);
}

.status {
  flex: 1;
  margin: 0;
  color: var(--text-muted);
  font-size: var(--step--1);
}

.today {
  --sky-size: 3.2rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  padding-right: 1.6rem;
}

.today-text p {
  margin: 0;
}

.telop {
  font-size: var(--step-0);
  line-height: 1.3;
}

.wind {
  font-size: var(--step--1);
  color: var(--text-muted);
}

.today-temps {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: var(--font-display);
  line-height: 1.1;
}

.max {
  font-size: var(--step-2);
  color: var(--accent-strong);
}

.min {
  font-size: var(--step-0);
  color: var(--text-muted);
}

.pops {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--panel-rule);
}

.pops li {
  display: flex;
  justify-content: space-between;
  padding: 0.1rem var(--space-2);
  font-size: var(--step--1);
}

.pops li + li {
  border-left: 1px dashed var(--panel-rule);
}

.pops .label {
  color: var(--text-muted);
}

.pops .past {
  opacity: 0.45;
}

.week {
  --sky-size: 1.7rem;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3.6rem, 1fr));
  /* One row: days that do not fit the width are dropped, not wrapped half into view. */
  grid-template-rows: auto;
  grid-auto-rows: 0;
  align-content: start;
  gap: 0 var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
}

.week li {
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  /* Spacing and rule drawn inside the box, so a dropped day collapses to nothing. */
  box-shadow: inset 0 1px var(--panel-rule);
  font-size: var(--step--1);
}

.week li > :first-child {
  margin-top: var(--space-1);
}

.week li > :last-child {
  margin-bottom: var(--space-1);
}

.date small {
  margin-left: 0.3em;
  font-size: 0.85em;
}

.date.sun small {
  color: color-mix(in srgb, var(--danger) 72%, var(--app-bg));
}

.date.sat small {
  color: color-mix(in srgb, var(--info) 72%, var(--app-bg));
}

.temps em {
  font-style: normal;
  color: var(--accent-strong);
}

.pop {
  color: var(--text-muted);
}

.attribution {
  margin: 0;
  padding: 0 0 0.1rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  /* Below the type scale: the credit must stay legible, not compete with the forecast. */
  font-size: 0.5rem;
  letter-spacing: 0.02em;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.attribution:hover {
  color: var(--accent);
  text-decoration: underline;
}
</style>
