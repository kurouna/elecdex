<script lang="ts">
import {
  isOfficeCode,
  JMA_FORECAST_URL,
  type OfficeInfo,
  summarizeForecast,
  type WeatherUpdate,
} from '@shared/weather'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import SkyIcon from './SkyIcon.svelte'

/**
 * The JMA forecast for one area: today in detail, then the week.
 *
 * Main fetches the forecast only while this pane shows it, and only around JMA's
 * publication times (0, 5, 11 and 17 o'clock), so an open pane costs about a
 * dozen conditional requests a day. The office and area are pane state, chosen
 * from the settings toggle and saved with the layout.
 *
 * Attribution follows JMA's terms of use: the source is named with a link, and
 * marked as processed because the forecast is reformatted and drawn here.
 */
const { paneId, props, state: paneState }: WidgetProps = $props()

const DEFAULT_OFFICE = '130000' // Tokyo

const office = $derived.by(() => {
  const chosen = paneState?.office ?? props?.office
  return isOfficeCode(chosen) ? chosen : DEFAULT_OFFICE
})
const areaCode = $derived(typeof paneState?.area === 'string' ? paneState.area : undefined)

let update = $state.raw<WeatherUpdate | null>(null)
let settingsOpen = $state(false)
let offices = $state.raw<OfficeInfo[] | null>(null)
let officesError = $state<string | null>(null)

$effect(() => {
  const code = office
  update = null
  return window.elecdex.weather.subscribe(code, (next) => {
    update = next
  })
})

const summary = $derived(update?.forecast ? summarizeForecast(update.forecast, areaCode) : null)
const today = $derived(summary?.days[0] ?? null)
const week = $derived(summary?.days.slice(1, 7) ?? [])

$effect(() => {
  const issued = summary ? summary.reportDatetime.slice(11, 16) : null
  paneMeta.set(paneId, {
    subtitle: summary ? `${summary.area.name} · ${issued} 発表` : '',
    ...(update?.error ? { badge: 'offline', badgeKind: 'warn' as const } : {}),
  })
})

$effect(() => {
  if (!settingsOpen || offices !== null) return
  window.elecdex.weather
    .offices()
    .then((list) => {
      offices = list
      officesError = null
    })
    .catch((cause: unknown) => {
      officesError = cause instanceof Error ? cause.message : String(cause)
    })
})

function choose(next: { office?: string; area?: string }): void {
  const officeChanged = next.office !== undefined && next.office !== office
  layout.setPaneState(paneId, {
    ...paneState,
    office: next.office ?? office,
    // A new office has different areas; start from its first.
    ...(officeChanged ? { area: undefined } : { area: next.area ?? areaCode }),
  })
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function dayLabel(
  date: string,
  index: number,
): { main: string; weekday: string; weekend: string | null } {
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay()
  const main = index === 0 ? '今日' : index === 1 ? '明日' : `${m}/${d}`
  return {
    main,
    weekday: WEEKDAYS[weekday] ?? '',
    weekend: weekday === 0 ? 'sun' : weekday === 6 ? 'sat' : null,
  }
}

const temp = (value: number | null) => (value === null ? '--' : `${value}°`)
const pop = (value: number | null) => (value === null ? '--' : `${value}%`)
</script>

<div class="weather" data-testid="weather">
  <SettingsButton
    open={settingsOpen}
    label="choose forecast area"
    testid="weather-settings-toggle"
    ontoggle={() => (settingsOpen = !settingsOpen)}
  />

  {#if settingsOpen}
    <div class="settings" data-testid="weather-settings">
      <label>
        <span>office</span>
        <select
          value={office}
          onchange={(e) => choose({ office: e.currentTarget.value })}
          data-testid="weather-office"
        >
          {#if offices === null}
            <option value={office}>{officesError ? `unavailable (${officesError})` : 'loading…'}</option>
          {:else}
            {#each offices as o (o.code)}
              <option value={o.code}>{o.name}</option>
            {/each}
          {/if}
        </select>
      </label>
      {#if summary}
        <label>
          <span>area</span>
          <select
            value={summary.area.code}
            onchange={(e) => choose({ area: e.currentTarget.value })}
            data-testid="weather-area"
          >
            {#each summary.areas as a (a.code)}
              <option value={a.code}>{a.name}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  {/if}

  {#if summary === null}
    <p class="status" data-testid="weather-status">
      {update?.error ? `forecast unavailable: ${update.error}` : 'fetching forecast…'}
    </p>
  {:else}
    {#if today}
      <section class="today" data-testid="weather-today">
        <SkyIcon code={today.code} />
        <div class="today-text">
          <p class="telop" data-testid="weather-telop">{today.text ?? ''}</p>
          <p class="wind">{today.wind ?? ''}</p>
        </div>
        <div class="today-temps">
          <span class="max" data-testid="weather-max">{temp(today.tempMax)}</span>
          <span class="min">{temp(today.tempMin)}</span>
        </div>
        {#if today.popBlocks}
          <ol class="pops" aria-label="chance of precipitation by six hours">
            {#each today.popBlocks as block, i (i)}
              <li class:past={block === null}>
                <span class="label">{String(i * 6).padStart(2, '0')}</span>
                <span class="value">{pop(block)}</span>
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    {/if}

    <ol class="week" data-testid="weather-week">
      {#each week as day, i (day.date)}
        {@const label = dayLabel(day.date, i + 1)}
        <li data-testid="weather-day">
          <span class="date {label.weekend ?? ''}">{label.main}<small>({label.weekday})</small></span>
          <SkyIcon code={day.code} />
          <span class="temps"><em>{temp(day.tempMax)}</em> / {temp(day.tempMin)}</span>
          <span class="pop">{pop(day.pop)}</span>
        </li>
      {/each}
    </ol>
  {/if}

  <button
    type="button"
    class="attribution"
    title={JMA_FORECAST_URL}
    onclick={() => void window.elecdex.system.openExternal(JMA_FORECAST_URL)}
    data-testid="weather-attribution"
  >
    出典：気象庁ホームページ（{JMA_FORECAST_URL}）を加工して作成
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

.settings span {
  color: var(--text-muted);
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
  margin-left: 0.1em;
  font-size: 0.85em;
}

.date.sun small {
  color: var(--danger);
}

.date.sat small {
  color: hsl(210 70% 65%);
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
