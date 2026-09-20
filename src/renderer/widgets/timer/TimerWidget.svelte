<script lang="ts">
import { evaluate } from '@shared/calc'
import {
  type ChronoPane,
  clampDuration,
  elapsed,
  formatClock,
  type Lap,
  lapExtremes,
  MAX_TIMERS,
  makeTimer,
  nextLanding,
  readChrono,
  remaining,
  splitDuration,
  TIMER_MAX_LAPS,
  TIMER_MAX_MS,
  TIMER_STEPS,
  type TimerEntry,
} from '@shared/timer'
import { onBoundary, onFrame } from '../../lib/frame-loop.ts'
import { alarms } from '../../stores/alarms.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import type { Bar } from '../common/bars.ts'
import LevelBars from '../common/LevelBars.svelte'
import Readout from '../common/Readout.svelte'
import type { WidgetProps } from '../registry.ts'
import AlarmList from './AlarmList.svelte'
import TimerCard from './TimerCard.svelte'

/**
 * The chrono: a stopwatch whose laps stack up like a spectrum, and countdowns
 * that burn down a ladder of segments.
 *
 * The two are separate machines, as they are on a phone. The stopwatch runs
 * while a countdown runs, resetting one leaves the other alone, and a countdown
 * goes on counting - and still announces itself - while the stopwatch is the
 * mode on screen. There can be several countdowns, each with its own duration
 * and its own run.
 *
 * Everything is drawn from wall-clock moments (`startedAt` plus what was
 * banked), so a pane that is moved - and therefore remounted - a tab switched
 * away from, a reload and a restart all leave a running chrono where it was.
 * The loop is subscribed to only while something is actually running, and the
 * readout goes to tenths: a hundredths digit stepping ten at a time on a 10 fps
 * loop reads as a broken instrument. Laps are taken at full precision.
 */

const { paneId, state: paneState }: WidgetProps = $props()

const chrono = $derived<ChronoPane>(readChrono(paneState))
const mode = $derived(chrono.mode)
const stopwatch = $derived(chrono.stopwatch)
const timers = $derived(chrono.timers)

let now = $state(Date.now())
let custom = $state('')

/**
 * The loop runs while anything is running - including a countdown behind the
 * stopwatch, which has to reach zero and say so whichever mode is on screen.
 */
const ticking = $derived(stopwatch.running || timers.some((timer) => timer.running))

$effect(() => {
  if (!ticking) return
  return onFrame(() => {
    now = Date.now()
  })
})

/**
 * A countdown lands on a timer of its own, for the moment it reaches zero. The
 * loop above only draws: it stops while the window is in the notification area
 * or minimised (lib/frame-loop.ts), and a countdown looked at from there alone
 * rang when the window came back, however long after it had run out.
 */
const landing = $derived(nextLanding(timers))

$effect(() => {
  if (landing === null) return
  let timer: ReturnType<typeof setTimeout>
  const wait = (): void => {
    timer = setTimeout(
      () => {
        // A timer runs on another clock than the one the countdown is read from.
        if (Date.now() < landing) wait()
        else now = Date.now()
      },
      Math.max(0, landing - Date.now()),
    )
  }
  wait()
  return () => clearTimeout(timer)
})

// A stopped chrono still has to be right when the pane is mounted or shown again.
$effect(() => {
  void ticking
  now = Date.now()
})

/**
 * The alarms count down in words - "in 7h 20m" - so a minute is as fine as they
 * need. Woken on the wall-clock minute rather than by an interval, so the change
 * lands in the same frame as the clock's; nothing is drawn in between.
 */
$effect(() => {
  if (mode !== 'alarm' || ticking) return
  return onBoundary(60_000, () => {
    now = Date.now()
  })
})

function save(change: Partial<ChronoPane>): void {
  layout.setPaneState(paneId, { ...paneState, ...chrono, ...change })
}

function setTimers(next: TimerEntry[]): void {
  save({ timers: next })
}

function patchTimer(id: string, change: Partial<TimerEntry>): void {
  setTimers(timers.map((timer) => (timer.id === id ? { ...timer, ...change } : timer)))
}

// ---- stopwatch ----

const swMs = $derived(elapsed(stopwatch, now))
const swDigits = $derived(formatClock(swMs))
const swTenths = $derived(splitDuration(swMs).tenths)
const laps = $derived(stopwatch.laps)
const extremes = $derived(lapExtremes(laps))

function startStopwatch(): void {
  save({ stopwatch: { ...stopwatch, running: true, startedAt: Date.now() } })
  sfx.play('expand')
}

function stopStopwatch(): void {
  save({
    stopwatch: {
      ...stopwatch,
      running: false,
      startedAt: 0,
      accumulatedMs: elapsed(stopwatch, Date.now()),
    },
  })
  sfx.play('collapse')
}

function resetStopwatch(): void {
  save({ stopwatch: { running: false, startedAt: 0, accumulatedMs: 0, laps: [] } })
}

function lap(): void {
  const total = elapsed(stopwatch, Date.now())
  const previous = laps.at(-1)?.atMs ?? 0
  const next: Lap[] = [...laps, { ms: total - previous, atMs: total }].slice(-TIMER_MAX_LAPS)
  save({ stopwatch: { ...stopwatch, laps: next } })
  sfx.play('panel')
}

/** What colours a bar: the lap still being timed, the fastest, the slowest. */
function markOf(i: number, liveAt: number): Bar['mark'] {
  if (i === liveAt) return 'live'
  if (extremes === null) return undefined
  if (i === extremes.best) return 'best'
  if (i === extremes.worst) return 'worst'
  return undefined
}

/** The lap being run now - the time since the last one was taken. */
const liveLapMs = $derived(Math.max(0, swMs - (laps.at(-1)?.atMs ?? 0)))

/** The laps as bars, with the one being timed still growing at the right. */
const bars = $derived.by<Bar[]>(() => {
  const live = stopwatch.running ? liveLapMs : 0
  const values = [...laps.map((entry) => entry.ms), ...(live > 0 ? [live] : [])]
  const tallest = Math.max(...values, 1)
  const liveAt = live > 0 ? values.length - 1 : -1
  return values.map((value, i) => {
    const mark = markOf(i, liveAt)
    return { value: value / tallest, ...(mark === undefined ? {} : { mark }) }
  })
})

const lapRows = $derived(
  laps
    .map((entry, i) => ({
      n: i + 1,
      ...entry,
      best: extremes?.best === i,
      worst: extremes?.worst === i,
    }))
    .reverse(),
)

// ---- countdowns ----

function startTimer(timer: TimerEntry): void {
  announced.delete(timer.id)
  const spent = remaining(timer, timer.durationMs, Date.now()) <= 0
  patchTimer(timer.id, {
    running: true,
    startedAt: Date.now(),
    ...(spent ? { accumulatedMs: 0 } : {}),
    rang: false,
  })
  sfx.play('expand')
}

function stopTimer(timer: TimerEntry): void {
  patchTimer(timer.id, {
    running: false,
    startedAt: 0,
    accumulatedMs: elapsed(timer, Date.now()),
  })
  sfx.play('collapse')
}

function resetTimer(timer: TimerEntry): void {
  announced.delete(timer.id)
  patchTimer(timer.id, { running: false, startedAt: 0, accumulatedMs: 0, rang: false })
}

function addTimer(minutes: number): void {
  if (timers.length >= MAX_TIMERS) {
    toasts.show({ title: `no room for more than ${MAX_TIMERS} timers`, tone: 'warn' })
    return
  }
  setTimers([...timers, makeTimer(minutes)])
  sfx.play('panel')
}

function removeTimer(timer: TimerEntry): void {
  // The last one leaves a fresh countdown behind rather than an empty pane.
  setTimers(timers.length === 1 ? [makeTimer(5)] : timers.filter((entry) => entry.id !== timer.id))
  sfx.play('collapse')
}

/** Adds to what a countdown is set to, so a duration can be built by tapping. */
function addMinutes(timer: TimerEntry, minutes: number): void {
  setDuration(timer, timer.durationMs / 60_000 + minutes)
}

function setDuration(timer: TimerEntry, minutes: number): void {
  announced.delete(timer.id)
  patchTimer(timer.id, {
    durationMs: clampDuration(minutes * 60_000),
    running: false,
    startedAt: 0,
    accumulatedMs: 0,
    rang: false,
  })
}

/**
 * A duration typed by hand, read by the calculator.
 *
 * "90/2" and "1.5*60" are both a number of minutes, which is what the calculator
 * is already good at - and being the same evaluator, full-width digits work here
 * too.
 */
function addCustom(): void {
  const result = evaluate(custom)
  if (!result.ok || result.value <= 0) {
    sfx.play('glitch')
    return
  }
  addTimer(Math.min(TIMER_MAX_MS / 60_000, result.value))
  custom = ''
}

/**
 * The alarm, once per countdown, whichever mode is on screen.
 *
 * Marked as rung in the pane state, so a pane that is moved (and therefore
 * remounted) does not announce a finished countdown again - and noted here as
 * well, because the pane state comes back as a prop a frame or more later, and
 * every frame in between would otherwise raise the alarm again.
 */
const announced = new Set<string>()
$effect(() => {
  const finished = timers.find(
    (timer) =>
      timer.running &&
      !timer.rang &&
      !announced.has(timer.id) &&
      remaining(timer, timer.durationMs, now) <= 0,
  )
  if (finished === undefined) return
  announced.add(finished.id)

  patchTimer(finished.id, {
    running: false,
    startedAt: 0,
    accumulatedMs: finished.durationMs,
    rang: true,
  })
  sfx.play('alarm')
  toasts.show({
    title: 'timer finished',
    body: formatClock(finished.durationMs),
    tone: 'ok',
    actions: [
      { label: 'restart', primary: true, run: () => startTimer({ ...finished, accumulatedMs: 0 }) },
      {
        label: '+1 min',
        run: () => {
          announced.delete(finished.id)
          patchTimer(finished.id, {
            durationMs: clampDuration(finished.durationMs + 60_000),
            running: true,
            startedAt: Date.now(),
            accumulatedMs: finished.durationMs,
            rang: false,
          })
        },
      },
    ],
  })
})

// A running chrono whose pane is closed stops with it; say so on the way out.
$effect(() => () => {
  if (!ticking) return
  toasts.show({
    title: 'chrono closed while running',
    body: mode === 'stopwatch' ? formatClock(elapsed(stopwatch, Date.now())) : 'countdown',
    tone: 'warn',
    timeoutMs: 8000,
  })
})

/**
 * Space starts and stops what is on screen, wherever the focus is in the pane -
 * except in a field, where a space is a space. It is the one control worth
 * reaching for without looking, which is why a stopwatch has a big button.
 */
function onKey(event: KeyboardEvent): void {
  if (event.key !== ' ') return
  const target = event.target as HTMLElement | null
  if (target !== null && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) return
  event.preventDefault()
  if (mode === 'stopwatch') {
    if (stopwatch.running) stopStopwatch()
    else startStopwatch()
    return
  }
  const first = timers[0]
  if (first === undefined) return
  if (timers.some((timer) => timer.running)) {
    for (const timer of timers) if (timer.running) stopTimer(timer)
    return
  }
  startTimer(first)
}

/** The countdown nearest to landing, for the note beside the stopwatch. */
const soonest = $derived.by(() => {
  let best: TimerEntry | null = null
  for (const timer of timers) {
    if (!timer.running) continue
    if (
      best === null ||
      remaining(timer, timer.durationMs, now) < remaining(best, best.durationMs, now)
    ) {
      best = timer
    }
  }
  return best
})

/**
 * The header follows what is running, but only when the text really changes: the
 * readout is recomputed on every frame, and a fresh object ten times a second
 * would redraw the header and the pane's tab for nothing.
 */
let published = ''
$effect(() => {
  const running = timers.filter((timer) => timer.running).length
  const armed = alarms.items.filter((alarm) => alarm.enabled).length
  const subtitle =
    mode === 'stopwatch'
      ? stopwatch.running
        ? swDigits
        : 'stopwatch'
      : mode === 'alarm'
        ? armed > 0
          ? `${armed} armed`
          : 'alarms'
        : running > 0
          ? `${running} running`
          : `${timers.length} timers`
  if (subtitle === published) return
  published = subtitle
  paneMeta.set(paneId, { subtitle })
})
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="chrono"
  data-testid="timer"
  data-mode={mode}
  data-running={ticking || undefined}
  tabindex="-1"
  onkeydown={onKey}
>
  <div class="modes">
    <button
      type="button"
      class:on={mode === 'stopwatch'}
      onclick={() => save({ mode: 'stopwatch' })}
      data-testid="timer-mode-stopwatch">stopwatch</button
    >
    <button
      type="button"
      class:on={mode === 'timer'}
      onclick={() => save({ mode: 'timer' })}
      data-testid="timer-mode-timer">timers</button
    >
    <button
      type="button"
      class:on={mode === 'alarm'}
      onclick={() => save({ mode: 'alarm' })}
      data-testid="timer-mode-alarm">alarms</button
    >
    <!-- What the other mode is doing, so a countdown running behind the
         stopwatch is never a surprise when it goes off. -->
    {#if mode === 'stopwatch' && soonest !== null}
      <button
        type="button"
        class="aside"
        onclick={() => save({ mode: 'timer' })}
        data-testid="timer-running-aside"
      >
        ⧗ {formatClock(remaining(soonest, soonest.durationMs, now))}
      </button>
    {/if}
    {#if mode === 'timer' && stopwatch.running}
      <button
        type="button"
        class="aside"
        onclick={() => save({ mode: 'stopwatch' })}
        data-testid="timer-stopwatch-aside"
      >
        ▸ {swDigits}
      </button>
    {/if}
  </div>

  {#if mode === 'stopwatch'}
    <div class="stopwatch">
      <div class="face">
        <Readout
          value={swDigits}
          tail={`.${swTenths}`}
          size="step-3"
          testid="timer-readout"
          label="Elapsed time"
        />
        <!-- The lap being run, under the total: what a stopwatch is held for. -->
        <span class="lap-now" class:idle={!stopwatch.running} data-testid="timer-lap-now">
          lap {laps.length + 1} · {formatClock(liveLapMs)}.{splitDuration(liveLapMs).tenths}
        </span>
        <div class="controls">
          {#if stopwatch.running}
            <button type="button" onclick={stopStopwatch} data-testid="timer-stop">stop</button>
          {:else}
            <button type="button" class="go" onclick={startStopwatch} data-testid="timer-start">
              start
            </button>
          {/if}
          <button type="button" onclick={lap} disabled={!stopwatch.running} data-testid="timer-lap">
            lap
          </button>
          <button type="button" onclick={resetStopwatch} data-testid="timer-reset">reset</button>
        </div>
      </div>

      <div class="measure">
        <div class="spectrum" data-testid="timer-spectrum">
          <LevelBars {bars} label="Lap times" testid="timer-bars" />
        </div>
        {#if lapRows.length > 0}
          <div class="laps" data-testid="timer-laps">
            {#each lapRows as row (row.n)}
              <div
                class="lap"
                class:best={row.best}
                class:worst={row.worst}
                data-testid="timer-lap-row"
              >
                <span class="n">{row.n}</span>
                <span class="split">{formatClock(row.atMs)}.{splitDuration(row.atMs).tenths}</span>
                <span class="delta">+{formatClock(row.ms)}.{splitDuration(row.ms).tenths}</span>
                <span class="mark">{row.best ? '▲' : row.worst ? '▼' : ''}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {:else if mode === 'timer'}
    <div class="timers" data-testid="timer-list">
      {#each timers as timer (timer.id)}
        <TimerCard
          {timer}
          {now}
          onstart={() => startTimer(timer)}
          onstop={() => stopTimer(timer)}
          onreset={() => resetTimer(timer)}
          onremove={() => removeTimer(timer)}
          onduration={(minutes) => setDuration(timer, minutes)}
          onadd={(minutes) => addMinutes(timer, minutes)}
        />
      {/each}
    </div>

    <div class="add" data-testid="timer-add">
      <span class="add-label">add</span>
      {#each TIMER_STEPS as minutes (minutes)}
        <button
          type="button"
          onclick={() => addTimer(minutes)}
          data-testid="timer-add-preset"
          data-minutes={minutes}
        >
          {minutes}
        </button>
      {/each}
      <input
        bind:value={custom}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addCustom()
          }
        }}
        placeholder="min"
        aria-label="Minutes"
        spellcheck="false"
        data-testid="timer-custom"
      />
    </div>
  {:else}
    <AlarmList {now} />
  {/if}
</div>

<style>
.chrono {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.modes {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* The same fixed width as the cards': a control that moves as another one's
   label changes is a control that gets missed. */
.controls button {
  min-width: 4.2rem;
}

.modes button,
.controls button,
.add button {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0 var(--space-2);
  cursor: pointer;
}

.modes button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.controls button:hover:not(:disabled),
.add button:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.controls button:disabled {
  opacity: 0.4;
  cursor: default;
}

.controls .go {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.aside {
  margin-left: auto;
  font-family: var(--font-mono);
  color: var(--accent);
  border-color: var(--accent-dim);
}

.stopwatch {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.face {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.lap-now {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  color: var(--accent);
}

.lap-now.idle {
  color: var(--text-muted);
}

.measure {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.controls,
.add {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: var(--space-1);
}

.add {
  justify-content: flex-start;
  border-top: 1px solid var(--panel-rule);
  padding-top: var(--space-1);
}

.add-label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.add input {
  width: 3rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-align: center;
  outline: none;
}

.add input:focus {
  border-color: var(--accent);
}

.spectrum {
  flex: 0 0 3rem;
  min-height: 1.5rem;
}

.laps {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--panel-rule);
}

.lap {
  display: grid;
  grid-template-columns: 2rem 1fr 1fr 1rem;
  gap: var(--space-1);
  font-size: var(--step--2);
  color: var(--text);
}

.lap .n,
.lap .mark {
  color: var(--text-muted);
}

.lap .delta {
  text-align: right;
  color: var(--accent);
}

.lap.best .delta,
.lap.best .mark {
  color: var(--ok);
}

.lap.worst .delta,
.lap.worst .mark {
  color: var(--danger);
}

.timers {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);
  align-content: start;
}

/*
 * Wide panes: the readout stops floating in the middle of an empty field. The
 * stopwatch puts its laps beside its face, and the countdowns lay out in columns
 * rather than one tall strip.
 */
@container (min-width: 34rem) {
  .stopwatch {
    flex-direction: row;
    align-items: stretch;
  }

  .face {
    flex: 0 0 min(50%, 22rem);
    border-right: 1px solid var(--panel-rule);
  }

  .measure {
    flex: 1;
    min-width: 0;
  }

  .spectrum {
    flex: 0 0 4.5rem;
  }

  .timers {
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  }
}

@container (min-width: 60rem) {
  .face {
    flex: 0 0 24rem;
  }
}
</style>
