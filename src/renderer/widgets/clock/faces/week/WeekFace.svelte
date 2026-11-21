<script lang="ts">
import { firstDayOfWeek } from '../../../../lib/calendar.ts'
import Readout from '../../parts/Readout.svelte'
import type { ClockFaceProps } from '../../types.ts'
import { weekCaption, weekDays } from './week.ts'

/**
 * WEEK: the time on the left, and the rest of the strip is this week - seven days with their
 * dates, today lit, a bar under each filling as the day goes, so the seven read as the week's
 * progress. The width that used to be margin around centred digits carries the date, which the
 * clock did not show, without repeating the calendar pane's month.
 *
 * The days follow the calendar pane's first day of the week. They are worked out once a
 * minute, not every second: only the seconds change each second.
 */
const { now, zone }: ClockFaceProps = $props()

const weekStart = firstDayOfWeek('en-US')
let width = $state(0)
let height = $state(0)

const minute = $derived(Math.floor(now.getTime() / 60_000))
const days = $derived(weekDays(new Date(minute * 60_000), weekStart))
const caption = $derived(weekCaption(new Date(minute * 60_000)))
const tall = $derived(height >= 90)
const size = $derived(
  tall
    ? Math.min(height * 0.32, width * 0.16)
    : Math.max(12, Math.min(height * 0.66, width * 0.11)),
)
</script>

<div class="face" class:tall bind:clientWidth={width} bind:clientHeight={height} style:--size="{size}px">
  <div class="time"><Readout {now} {zone} {size} /></div>
  <ol class="days" data-testid="clock-week">
    {#each days as d (d.key)}
      <li class:today={d.today} class:past={d.gone === 1} data-today={d.today}>
        <span class="weekday">{d.weekday}</span>
        <span class="date">{#if d.month && tall}<small>{d.month}</small> {/if}{d.day}</span>
        <span class="bar"><span class="fill" style:width="{d.gone * 100}%"></span></span>
      </li>
    {/each}
  </ol>
  {#if tall}<p class="caption">{caption}</p>{/if}
</div>

<style>
.face {
  display: flex;
  align-items: center;
  gap: calc(var(--size) * 0.5);
  height: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;
  font-family: var(--font-ui);
  color: var(--text);
}

.face.tall {
  flex-direction: column;
  justify-content: center;
  gap: calc(var(--size) * 0.22);
}

.time {
  flex: none;
}

.days {
  display: flex;
  flex: 1;
  align-self: stretch;
  gap: 2px;
  margin: 0;
  padding: 3px 0;
  list-style: none;
  min-width: 0;
}

.tall .days {
  flex: none;
  align-self: stretch;
  height: calc(var(--size) * 1.15);
}

li {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border-radius: 2px;
  line-height: 1.05;
}

li.today {
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.weekday {
  font-size: max(calc(var(--size) * 0.3), var(--step--2));
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.date {
  font-size: max(calc(var(--size) * 0.44), var(--step--1));
  font-variant-numeric: tabular-nums;
}

.date small {
  margin-right: 0.25em;
  font-size: max(calc(var(--size) * 0.24), var(--step--2));
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

li.past .date {
  color: var(--text-muted);
}

li.today .weekday,
li.today .date {
  color: var(--accent-strong);
  font-weight: 600;
}

/* How much of the day has gone: the seven bars together are the week's progress. */
.bar {
  align-self: stretch;
  height: 2px;
  margin: 2px 3px 0;
  background: var(--panel-rule);
}

.fill {
  display: block;
  height: 100%;
  background: var(--accent);
}

li.past .fill {
  opacity: 0.45;
}

.caption {
  margin: 0;
  font-size: max(calc(var(--size) * 0.2), var(--step--1));
  letter-spacing: 0.12em;
  color: var(--text-muted);
}
</style>
