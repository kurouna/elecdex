<script lang="ts">
import { holidayOn } from '@shared/jp-holidays'
import { labelLanguage } from '@shared/markets'
import { firstDayOfWeek, isoWeek, monthGrid, msUntilMidnight, sameDay } from '../../lib/calendar.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * A month calendar: six fixed weeks, today marked, weekends and holidays set
 * apart, and the next holiday spelled out underneath.
 *
 * Japanese national holidays are computed locally (shared/jp-holidays.ts) and
 * shown when the machine is in Japan's time zone or the app runs in Japanese;
 * their names follow the app language like the market names do. Nothing is
 * fetched. The pane wakes once at midnight to move "today", and not otherwise.
 */
const { paneId }: WidgetProps = $props()

const locale = navigator.language
const language = labelLanguage(locale)
const weekStart = firstDayOfWeek(locale)
const withHolidays =
  language === 'ja' || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Tokyo'

let today = $state(new Date())
/** The month on screen, as its first day. */
let shown = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

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
  if (!withHolidays) return undefined
  return holidayOn(date)?.[language]
}

/** The next holiday from today, within a year. */
const nextHoliday = $derived.by(() => {
  if (!withHolidays) return null
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
  shown = new Date(shown.getFullYear(), shown.getMonth() + months, 1)
}

function goToday(): void {
  shown = new Date(today.getFullYear(), today.getMonth(), 1)
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

const whenLabel = (inDays: number): string => {
  if (language === 'ja') return inDays === 0 ? '今日' : inDays === 1 ? '明日' : `${inDays}日後`
  return inDays === 0 ? 'today' : inDays === 1 ? 'tomorrow' : `in ${inDays} days`
}
</script>

<div class="calendar" data-testid="calendar" data-holidays={withHolidays ? 'jp' : 'none'}>
  <div class="head">
    <span class="title" data-testid="calendar-title">{title}</span>
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
        {language === 'ja' ? '今月' : 'today'}
      </button>
      <button type="button" title="Next month" onclick={() => move(1)} data-testid="calendar-next">›</button>
    </div>
  </div>

  <div class="grid" onwheel={onWheel} role="grid" aria-label={title}>
    {#each weekdays as w (w.day)}
      <span class="weekday" class:sun={w.day === 0} class:sat={w.day === 6} role="columnheader">{w.name}</span>
    {/each}
    {#each days as date (date.getTime())}
      {@const holiday = holidayName(date)}
      <span
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
  </div>

  <p class="foot" data-testid="calendar-next-holiday">
    {#if nextHoliday}
      <span class="label">{language === 'ja' ? '次の祝日' : 'next holiday'}</span>
      <span class="holiday">{shortDate(nextHoliday.date)} {nextHoliday.name}</span>
      <span class="when">{whenLabel(nextHoliday.inDays)}</span>
    {:else}
      <span class="label">{shortDate(today)}</span>
    {/if}
  </p>
</div>

<style>
.calendar {
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

.title {
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  color: var(--accent-strong);
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 2px;
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
  /* Grows with the pane, bounded by row height and column width. */
  font-size: clamp(0.62rem, min(6.5cqh, 5.5cqw), 1.1rem);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--text);
}

.sat {
  color: var(--accent);
}

.sun {
  color: var(--danger);
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
  background: var(--danger);
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
