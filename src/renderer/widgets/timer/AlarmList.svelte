<script lang="ts">
import {
  ALARM_LIMITS,
  type Alarm,
  describeDays,
  describeWait,
  formatAlarmTime,
  nextAlarmAt,
  parseTimeOfDay,
  sortAlarms,
  WEEKDAY_NAMES,
} from '@shared/alarms'
import { alarms } from '../../stores/alarms.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import Readout from '../common/Readout.svelte'

/**
 * The alarms: a time of day that says something, switched on and off.
 *
 * A deadline in the tasks pane is a thing to do by a date; this is the other
 * kind of time - the one the day is built around, set once and then only turned
 * on and off. Which is why the list is made of switches rather than of entries
 * to fill in: the common act is "wake me again tomorrow", not "make a new one".
 *
 * Main holds them and announces them, so an alarm goes off with this pane closed.
 */

interface Props {
  /** Now, from the pane's shared tick, so the waits all count down together. */
  now: number
}

const { now }: Props = $props()

$effect(() => alarms.use())

let draftTime = $state('')
let draftLabel = $state('')
/** The alarm whose days are being picked, if any. */
let editing = $state<string | null>(null)

const list = $derived(sortAlarms(alarms.items))

const waitOf = (alarm: Alarm): string => {
  const at = nextAlarmAt(alarm, now)
  return at === null ? 'off' : describeWait(at, now)
}

/** The next one to go off, named in the heading: the pane's one answer. */
const soonest = $derived.by(() => {
  let best: { alarm: Alarm; at: number } | null = null
  for (const alarm of list) {
    const at = nextAlarmAt(alarm, now)
    if (at === null) continue
    if (best === null || at < best.at) best = { alarm, at }
  }
  return best
})

async function add(): Promise<void> {
  const time = parseTimeOfDay(draftTime)
  if (time === null) {
    sfx.play('glitch')
    return
  }
  if (list.length >= ALARM_LIMITS.alarms) {
    toasts.show({ title: `no room for more than ${ALARM_LIMITS.alarms} alarms`, tone: 'warn' })
    return
  }
  const made = await alarms.add({ ...time, label: draftLabel.trim() })
  if (made === null) return
  draftTime = ''
  draftLabel = ''
  sfx.play('panel')
}

function toggle(alarm: Alarm): void {
  void alarms.update(alarm.id, { enabled: !alarm.enabled })
  sfx.play(alarm.enabled ? 'collapse' : 'expand')
}

function toggleDay(alarm: Alarm, day: number): void {
  const days = alarm.days.includes(day)
    ? alarm.days.filter((entry) => entry !== day)
    : [...alarm.days, day]
  void alarms.update(alarm.id, { days })
}

function setEvery(alarm: Alarm, days: number[]): void {
  void alarms.update(alarm.id, { days })
}

function remove(alarm: Alarm): void {
  void alarms.remove(alarm.id)
  sfx.play('collapse')
  toasts.show({
    title: 'alarm removed',
    body: `${formatAlarmTime(alarm)} ${alarm.label}`.trim(),
    tone: 'warn',
    actions: [
      {
        label: 'undo',
        primary: true,
        run: () => {
          void alarms.add({
            hour: alarm.hour,
            minute: alarm.minute,
            label: alarm.label,
            days: alarm.days,
          })
        },
      },
    ],
  })
}

/** Nudges a time by whole minutes, which is how a time is usually adjusted. */
function nudge(alarm: Alarm, minutes: number): void {
  const total = (alarm.hour * 60 + alarm.minute + minutes + 1440) % 1440
  void alarms.update(alarm.id, { hour: Math.floor(total / 60), minute: total % 60 })
}
</script>

<div class="alarms" data-testid="alarm-list">
  <div class="head">
    <span class="label">next</span>
    {#if soonest !== null}
      <span class="soonest" data-testid="alarm-next">
        {formatAlarmTime(soonest.alarm)}
        {soonest.alarm.label}
        <span class="wait">{describeWait(soonest.at, now)}</span>
      </span>
    {:else}
      <span class="soonest idle" data-testid="alarm-next">nothing set</span>
    {/if}
  </div>

  <div class="rows">
    {#each list as alarm (alarm.id)}
      <div
        class="alarm"
        class:off={!alarm.enabled}
        data-testid="alarm"
        data-alarm={alarm.id}
        data-enabled={alarm.enabled || undefined}
      >
        <div class="face">
          <Readout
            value={formatAlarmTime(alarm)}
            size="step-2"
            tone={alarm.enabled ? 'accent' : 'accent'}
            testid="alarm-time"
          />
          <div class="of">
            <span class="name">{alarm.label || 'alarm'}</span>
            <button
              type="button"
              class="days"
              title="Choose the days"
              onclick={() => (editing = editing === alarm.id ? null : alarm.id)}
              data-testid="alarm-days">{describeDays(alarm.days)} · {waitOf(alarm)}</button
            >
          </div>
        </div>

        <div class="nudge">
          <button type="button" onclick={() => nudge(alarm, -5)} aria-label="five minutes earlier"
            >−5</button
          >
          <button type="button" onclick={() => nudge(alarm, 5)} aria-label="five minutes later"
            >+5</button
          >
        </div>

        <button
          type="button"
          class="switch"
          role="switch"
          aria-checked={alarm.enabled}
          aria-label="{alarm.label || formatAlarmTime(alarm)} on or off"
          onclick={() => toggle(alarm)}
          data-testid="alarm-toggle"
        >
          <span class="track"><span class="knob"></span></span>
        </button>

        <button
          type="button"
          class="kill"
          aria-label="remove this alarm"
          onclick={() => remove(alarm)}
          data-testid="alarm-remove">×</button
        >

        {#if editing === alarm.id}
          <div class="picker" data-testid="alarm-day-picker">
            {#each WEEKDAY_NAMES as name, day (name)}
              <button
                type="button"
                class:on={alarm.days.includes(day)}
                onclick={() => toggleDay(alarm, day)}
                data-testid="alarm-day"
                data-day={day}
              >
                {name}
              </button>
            {/each}
            <button type="button" class="every" onclick={() => setEvery(alarm, [1, 2, 3, 4, 5])}>
              weekdays
            </button>
            <button
              type="button"
              class="every"
              onclick={() => setEvery(alarm, [0, 1, 2, 3, 4, 5, 6])}
            >
              every day
            </button>
            <button type="button" class="every" onclick={() => setEvery(alarm, [])}>once</button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">no alarms · set a time below</p>
    {/each}
  </div>

  <div class="add" data-testid="alarm-add">
    <span class="label">new</span>
    <input
      bind:value={draftTime}
      onkeydown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          void add()
        }
      }}
      class="time"
      placeholder="07:00"
      aria-label="Time of day"
      spellcheck="false"
      data-testid="alarm-time-input"
    />
    <input
      bind:value={draftLabel}
      onkeydown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          void add()
        }
      }}
      class="name-input"
      placeholder="what it is for"
      maxlength={ALARM_LIMITS.label}
      aria-label="Label"
      data-testid="alarm-label-input"
    />
    <button type="button" onclick={() => void add()} data-testid="alarm-add-button">set</button>
  </div>
</div>

<style>
.alarms {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.head {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  padding-bottom: 1px;
  border-bottom: 1px solid var(--panel-rule);
}

.label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.soonest {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--accent-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.soonest.idle {
  color: var(--text-muted);
}

.wait {
  color: var(--text-muted);
}

.rows {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-1);
  align-content: start;
}

.alarm {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-1);
  border: 1px solid var(--panel-rule);
}

/* An alarm that is off is still legible - it is a thing you will switch back on
   tomorrow - but it is plainly not armed. */
.alarm.off {
  opacity: 0.5;
}

.alarm.off .face {
  filter: grayscale(1);
}

.face {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.of {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.name {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.days {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  text-align: left;
  cursor: pointer;
}

.days:hover {
  color: var(--accent);
}

.nudge {
  display: flex;
  gap: 2px;
}

.nudge button,
.picker button,
.add button {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0 var(--space-1);
  cursor: pointer;
}

.nudge button:hover,
.picker button:hover,
.add button:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.picker {
  flex: 1 0 100%;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding-top: var(--space-1);
  border-top: 1px solid var(--panel-rule);
}

.picker button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.picker .every {
  margin-left: auto;
}

/* The switch: a tube of light that fills when the alarm is armed. */
.switch {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.track {
  display: block;
  width: 2rem;
  height: 0.85rem;
  border: 1px solid var(--panel-border);
  background: var(--accent-faint);
  position: relative;
}

.knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 0.75rem;
  height: calc(100% - 2px);
  background: var(--text-muted);
  transition: transform var(--dur-fast) var(--ease-out);
}

.alarm[data-enabled] .track {
  background: var(--accent-dim);
  border-color: var(--accent);
}

.alarm[data-enabled] .knob {
  background: var(--accent-strong);
  transform: translateX(calc(2rem - 0.75rem - 4px));
  box-shadow: 0 0 6px var(--accent-dim);
}

.kill {
  border: 0;
  padding: 0 2px;
  background: transparent;
  color: transparent;
  font-family: var(--font-mono);
  cursor: pointer;
}

.alarm:hover .kill {
  color: var(--text-muted);
}

.kill:hover {
  color: var(--danger);
}

.empty {
  margin: auto 0;
  color: var(--text-muted);
  font-size: var(--step--2);
  text-align: center;
}

.add {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding-top: var(--space-1);
  border-top: 1px solid var(--panel-rule);
}

.add input {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: 0 var(--space-1);
  outline: none;
}

.add input:focus {
  border-color: var(--accent);
}

.add .time {
  width: 4.5rem;
  text-align: center;
}

.add .name-input {
  flex: 1;
  min-width: 0;
}

/* Wide panes: the alarms stand in columns rather than one tall strip. */
@container (min-width: 34rem) {
  .rows {
    grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  }
}
</style>
