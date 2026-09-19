<script lang="ts">
import { describeMarks, HOLIDAY_CALENDARS, holidayChoice, holidayLookup } from '@shared/holidays'
import {
  firstDayOfWeek,
  isoWeek,
  monthGrid,
  msUntilMidnight,
  sameDay,
  type WaveDirection,
  waveStep,
  waveTowards,
} from '../../lib/calendar.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * A month calendar: six fixed weeks, today marked, weekends and holidays set
 * apart, and the next holiday spelled out underneath.
 *
 * All text is English whatever the app language, in keeping with the rest of
 * the HUD. National holidays are computed locally (shared/holidays.ts) for the
 * countries ticked in the pane's settings - none by default, kept in the pane
 * state. Nothing is fetched. The pane wakes once at midnight to move "today",
 * and not otherwise.
 *
 * A month comes in as a wave of dates, sweeping the way the calendar moved, and
 * "today" pings once the wave reaches it - when the pane appears and on every
 * change of month, as CSS animations of the cells created for it.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const locale = 'en-US'
const weekStart = firstDayOfWeek(locale)
const countries = $derived(holidayChoice(paneState))
const lookup = $derived(holidayLookup(countries))
let settingsOpen = $state(false)

function setCountry(id: string, on: boolean): void {
  const next = on ? [...countries, id] : countries.filter((c) => c !== id)
  layout.setPaneState(paneId, { ...paneState, holidays: next })
}

let today = $state(new Date())
/** The month on screen, as its first day. */
let shown = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
/** The wave that brought the shown month in; a new id recreates the cells, replaying it. */
let wave = $state<{ id: number; direction: WaveDirection }>({ id: 0, direction: 'next' })

function show(month: Date): void {
  const direction = waveTowards(shown, month)
  if (direction === null) return
  wave = { id: wave.id + 1, direction }
  shown = month
}

$effect(() => {
  let timer: ReturnType<typeof setTimeout>
  const schedule = (): void => {
    timer = setTimeout(() => {
      const wasShowingToday =
        shown.getFullYear() === today.getFullYear() && shown.getMonth() === today.getMonth()
      today = new Date()
      if (wasShowingToday) shown = new Date(today.getFullYear(), today.getMonth(), 1)
      schedule()
    }, msUntilMidnight(new Date()) + 1000)
  }
  schedule()
  return () => clearTimeout(timer)
})

const days = $derived(monthGrid(shown.getFullYear(), shown.getMonth(), weekStart))

const weekdays = $derived.by(() => {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  // 4 January 2026 is a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const day = (weekStart + i) % 7
    return { day, name: format.format(new Date(2026, 0, 4 + day)) }
  })
})

const title = $derived(
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(shown),
)

const holidayName = (date: Date): string | undefined => {
  const marks = lookup(date)
  return marks.length === 0 ? undefined : describeMarks(marks, countries.length > 1)
}

/** The next holiday from today, within a year. */
const nextHoliday = $derived.by(() => {
  if (countries.length === 0) return null
  for (let i = 0; i < 366; i += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const name = holidayName(date)
    if (name) return { date, name, inDays: i }
  }
  return null
})

const isCurrentMonth = $derived(
  shown.getFullYear() === today.getFullYear() && shown.getMonth() === today.getMonth(),
)

$effect(() => {
  paneMeta.set(paneId, { subtitle: `week ${isoWeek(today)}` })
})

function move(months: number): void {
  show(new Date(shown.getFullYear(), shown.getMonth() + months, 1))
}

function goToday(): void {
  show(new Date(today.getFullYear(), today.getMonth(), 1))
}

function onWheel(event: WheelEvent): void {
  if (event.deltaY === 0) return
  event.preventDefault()
  move(event.deltaY > 0 ? 1 : -1)
}

const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const shortDate = (d: Date): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', weekday: 'short' }).format(d)

const whenLabel = (inDays: number): string =>
  inDays === 0 ? 'today' : inDays === 1 ? 'tomorrow' : `in ${inDays} days`
</script>

<div
  class="calendar"
  data-testid="calendar"
  data-holidays={countries.join(' ') || 'none'}
  data-wave={wave.direction}
>
  <SettingsButton
    open={settingsOpen}
    label="calendar settings"
    testid="calendar-settings-toggle"
    ontoggle={() => (settingsOpen = !settingsOpen)}
  />

  {#if settingsOpen}
    <fieldset class="settings" data-testid="calendar-settings">
      <legend>holidays</legend>
      {#each HOLIDAY_CALENDARS as calendar (calendar.id)}
        <label>
          <input
            type="checkbox"
            checked={countries.includes(calendar.id)}
            onchange={(e) => setCountry(calendar.id, e.currentTarget.checked)}
            data-testid={`calendar-holidays-${calendar.id}`}
          />
          <span>{calendar.name}</span>
        </label>
      {/each}
    </fieldset>
  {/if}

  <div class="head">
    {#key wave.id}
      <span class="title" data-testid="calendar-title">{title}</span>
    {/key}
    <div class="nav">
      <button type="button" title="Previous month" onclick={() => move(-1)} data-testid="calendar-prev">‹</button>
      <button
        type="button"
        class="now"
        class:away={!isCurrentMonth}
        title="This month"
        onclick={goToday}
        data-testid="calendar-today"
      >
        today
      </button>
      <button type="button" title="Next month" onclick={() => move(1)} data-testid="calendar-next">›</button>
    </div>
  </div>

  <div class="grid" onwheel={onWheel} role="grid" aria-label={title}>
    {#each weekdays as w (w.day)}
      <span class="weekday" class:sun={w.day === 0} class:sat={w.day === 6} role="columnheader">{w.name}</span>
    {/each}
    {#key wave.id}
    {#each days as date, i (date.getTime())}
      {@const holiday = holidayName(date)}
      <span
        style:--wave={waveStep(i, wave.direction)}
        class="day"
        class:outside={date.getMonth() !== shown.getMonth()}
        class:sun={date.getDay() === 0 || holiday !== undefined}
        class:sat={date.getDay() === 6 && holiday === undefined}
        class:today={sameDay(date, today)}
        role="gridcell"
        title={holiday}
        data-testid="calendar-day"
        data-date={iso(date)}
        data-today={sameDay(date, today) || undefined}
        data-holiday={holiday}
      >
        {date.getDate()}
        {#if holiday}<i class="mark" aria-hidden="true"></i>{/if}
      </span>
    {/each}
    {/key}
  </div>

  <p class="foot" data-testid="calendar-next-holiday">
    {#if nextHoliday}
      <span class="label">next holiday</span>
      <span class="holiday">{shortDate(nextHoliday.date)} {nextHoliday.name}</span>
      <span class="when">{whenLabel(nextHoliday.inDays)}</span>
    {:else}
      <span class="label">{shortDate(today)}</span>
    {/if}
  </p>
</div>

<style>
.calendar {
  /* Which way the wave and the title move: down and left for a later month. */
  --wave-rise: 0.35rem;
  --wave-shift: 0.6rem;
  --wave-step: 22ms;
  position: relative;
  container-type: size;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.calendar[data-wave='prev'] {
  --wave-rise: -0.35rem;
  --wave-shift: -0.6rem;
}

.title {
  animation: title-in calc(420ms * var(--motion-scale)) var(--ease-emphasized) backwards;
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 2px;
  /* Clear of the settings button in the corner. */
  margin-right: 1.5rem;
}

.settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
  margin: 0 1.6rem 0 0;
  padding: 0 0 var(--space-1);
  border: 0;
  border-bottom: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  text-transform: uppercase;
}

.settings legend {
  float: left;
  padding: 0;
  color: var(--text-muted);
}

.settings label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text);
  cursor: pointer;
}

.settings input {
  margin: 0;
  accent-color: var(--accent);
}

.nav button {
  min-width: 1.5rem;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.nav button:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.nav .now.away {
  color: var(--accent);
}

.grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(6, 1fr);
  gap: 1px;
}

.weekday {
  padding-bottom: 2px;
  border-bottom: 1px solid var(--panel-border);
  text-align: center;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.day {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  font-family: var(--font-ui);
  /* Grows with the pane, bounded by row height and column width. The ceiling is
     for a pane brought to the front, where 1.1rem left the dates lost in cells
     the size of a hand. */
  font-size: clamp(0.62rem, min(6.5cqh, 5.5cqw), 2.2rem);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--text);
  animation: day-in calc(420ms * var(--motion-scale)) var(--ease-emphasized)
    calc(var(--wave, 0) * var(--wave-step) * var(--motion-scale)) backwards;
}

@keyframes title-in {
  from {
    opacity: 0;
    transform: translateX(var(--wave-shift));
  }
}

@keyframes day-in {
  from {
    opacity: 0;
    transform: translateY(var(--wave-rise)) scale(0.9);
  }
}

/* "Today" pings as the wave reaches it: a ring that brightens and spreads out. */
.today::after {
  content: "";
  position: absolute;
  inset: -1px;
  border: 1px solid var(--accent-strong);
  box-shadow: 0 0 10px var(--accent);
  opacity: 0;
  pointer-events: none;
  animation: today-ping calc(900ms * var(--motion-scale)) ease-out
    calc((var(--wave, 0) * var(--wave-step) + 280ms) * var(--motion-scale)) backwards;
}

@keyframes today-ping {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.45);
  }
}

/* Muted a little, so weekends mark the grid without shouting over the dates. */
.sat {
  color: color-mix(in srgb, var(--info) 72%, var(--app-bg));
}

.sun {
  color: color-mix(in srgb, var(--danger) 72%, var(--app-bg));
}

.outside {
  opacity: 0.35;
}

.today {
  border: 1px solid var(--accent);
  background: var(--accent-faint);
  box-shadow: 0 0 6px var(--accent-dim);
  color: var(--accent-strong);
  font-weight: 600;
}

.mark {
  position: absolute;
  bottom: 12%;
  left: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--danger) 72%, var(--app-bg));
  transform: translateX(-50%);
}

.foot {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  min-height: 1.2em;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.label {
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.holiday {
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text);
}

.when {
  margin-left: auto;
  color: var(--accent);
}
</style>
