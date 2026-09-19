<script lang="ts">
import { evaluate } from '@shared/calc'
import {
  type ChronoState,
  elapsed,
  formatClock,
  type Lap,
  lapExtremes,
  remaining,
  segmentCount,
  splitDuration,
  TIMER_MAX_LAPS,
  TIMER_MAX_MS,
  TIMER_PRESETS,
} from '@shared/timer'
import { onFrame } from '../../lib/frame-loop.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { toasts } from '../../stores/toasts.svelte.ts'
import type { Bar } from '../common/bars.ts'
import LevelBars from '../common/LevelBars.svelte'
import Readout from '../common/Readout.svelte'
import SegmentMeter from '../common/SegmentMeter.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * The chrono: a stopwatch whose laps stack up like a spectrum, and a timer that
 * burns down a ladder of segments.
 *
 * Both are drawn from wall-clock moments (`startedAt` plus what was banked), so
 * a pane that is moved - and therefore remounted - a tab that is switched away
 * from, a reload and a restart all leave the running time exactly where it was.
 *
 * Both draw on the shared 10 fps loop and unsubscribe the moment they stop, so a
 * chrono sitting at zero costs nothing at all. That is also why the readout goes
 * to tenths and not hundredths: a hundredths digit stepping ten at a time reads
 * as a broken instrument. Laps are still taken at full precision.
 */

const { paneId, state: paneState }: WidgetProps = $props()

const mode = $derived<'stopwatch' | 'timer'>(paneState?.mode === 'timer' ? 'timer' : 'stopwatch')
const running = $derived(paneState?.running === true)
const startedAt = $derived(typeof paneState?.startedAt === 'number' ? paneState.startedAt : 0)
const accumulatedMs = $derived(
  typeof paneState?.accumulatedMs === 'number' ? Math.max(0, paneState.accumulatedMs) : 0,
)
const durationMs = $derived(
  typeof paneState?.durationMs === 'number'
    ? Math.min(TIMER_MAX_MS, Math.max(1000, paneState.durationMs))
    : 5 * 60_000,
)

const laps = $derived.by<Lap[]>(() => {
  const raw = paneState?.laps
  if (!Array.isArray(raw)) return []
  return raw.flatMap((lap) => {
    if (typeof lap !== 'object' || lap === null) return []
    const { ms, atMs } = lap as Record<string, unknown>
    if (typeof ms !== 'number' || typeof atMs !== 'number') return []
    return [{ ms, atMs }]
  })
})

const chrono = $derived<ChronoState>({ running, startedAt, accumulatedMs })

let now = $state(Date.now())
/** Which segment went out last, drawn bright for the frame it goes. */
let flash = $state<number | null>(null)
let custom = $state('')
let ladder = $state<HTMLDivElement | null>(null)
let segments = $state(24)
let vertical = $state(true)
/** True once this run has finished, so the alarm is not raised on every frame. */
let rang = $state(false)

// Only a running chrono is subscribed to the draw loop.
$effect(() => {
  if (!running) return
  return onFrame(() => {
    now = Date.now()
  })
})

// A stopped chrono still has to be right when the pane is mounted or shown.
$effect(() => {
  void running
  now = Date.now()
})

const ms = $derived(mode === 'timer' ? remaining(chrono, durationMs, now) : elapsed(chrono, now))
const parts = $derived(splitDuration(ms))
const digits = $derived(formatClock(ms))

/** The last ten seconds, then the last three: the pane says so in colour and sound. */
const urgent = $derived(mode === 'timer' && running && ms <= 10_000)
const critical = $derived(mode === 'timer' && running && ms <= 3000)
const tone = $derived<'accent' | 'warn' | 'danger'>(
  critical ? 'danger' : urgent ? 'warn' : 'accent',
)

function save(change: Record<string, unknown>): void {
  layout.setPaneState(paneId, { ...paneState, ...change })
}

function start(): void {
  if (mode === 'timer' && ms <= 0) reset()
  rang = false
  save({ running: true, startedAt: Date.now() })
  sfx.play('expand')
}

function stop(): void {
  save({ running: false, accumulatedMs: elapsed(chrono, Date.now()), startedAt: 0 })
  sfx.play('collapse')
}

function reset(): void {
  save({ running: false, startedAt: 0, accumulatedMs: 0, laps: [] })
  rang = false
  flash = null
}

function lap(): void {
  const total = elapsed(chrono, Date.now())
  const previous = laps.at(-1)?.atMs ?? 0
  save({ laps: [...laps, { ms: total - previous, atMs: total }].slice(-TIMER_MAX_LAPS) })
  sfx.play('panel')
}

function setDuration(minutes: number): void {
  save({ durationMs: minutes * 60_000, running: false, startedAt: 0, accumulatedMs: 0 })
  rang = false
}

/**
 * The custom duration, through the calculator.
 *
 * "90/2" and "1.5*60" are both a number of minutes, which is the kind of thing
 * the calculator is already good at - and it is the same evaluator, so full
 * width digits work here too.
 */
function setCustom(): void {
  const result = evaluate(custom)
  if (!result.ok || result.value <= 0) {
    sfx.play('glitch')
    return
  }
  setDuration(Math.min(TIMER_MAX_MS / 60_000, result.value))
  custom = ''
}

// The alarm, once, when a running timer reaches zero.
$effect(() => {
  if (mode !== 'timer' || !running || rang || ms > 0) return
  rang = true
  save({ running: false, accumulatedMs: durationMs, startedAt: 0 })
  sfx.play('alarm')
  toasts.show({
    title: 'timer finished',
    body: formatClock(durationMs),
    tone: 'ok',
    actions: [
      { label: 'restart', primary: true, run: () => void queueMicrotask(start) },
      {
        label: '+1 min',
        run: () => {
          save({
            durationMs: durationMs + 60_000,
            running: true,
            startedAt: Date.now(),
            accumulatedMs: durationMs,
          })
          rang = false
        },
      },
    ],
  })
})

// A running chrono whose pane is closed stops with it; say so, and offer it back.
$effect(() => () => {
  if (!running) return
  toasts.show({
    title: 'chrono closed while running',
    body: formatClock(elapsed(chrono, Date.now())),
    tone: 'warn',
    timeoutMs: 8000,
  })
})

/**
 * How many segments fit, and which way the ladder runs: measured, not assumed.
 *
 * A pane dragged wide turns the column into a rung of segments along the bottom
 * rather than squashing it, which is the same instrument seen end on.
 */
$effect(() => {
  const el = ladder
  if (el === null) return
  const observer = new ResizeObserver(() => {
    vertical = el.clientHeight >= el.clientWidth
    segments = segmentCount(vertical ? el.clientHeight : el.clientWidth)
  })
  observer.observe(el)
  return () => observer.disconnect()
})
const left = $derived(mode === 'timer' ? ms / durationMs : 0)

// The segment that has just gone out, flashed for one frame of the shared loop.
let litBefore = -1
$effect(() => {
  const lit = Math.ceil(Math.max(0, Math.min(1, left)) * segments)
  if (litBefore !== -1 && lit < litBefore) flash = lit
  else if (lit > litBefore) flash = null
  litBefore = lit
})

const extremes = $derived(lapExtremes(laps))

/** What colours a bar: the lap still being timed, the fastest, the slowest. */
function markOf(i: number, liveAt: number): Bar['mark'] {
  if (i === liveAt) return 'live'
  if (extremes === null) return undefined
  if (i === extremes.best) return 'best'
  if (i === extremes.worst) return 'worst'
  return undefined
}

/** The laps as bars, with the one being timed still growing at the right. */
const bars = $derived.by<Bar[]>(() => {
  const live = running && mode === 'stopwatch' ? elapsed(chrono, now) - (laps.at(-1)?.atMs ?? 0) : 0
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

/**
 * The header follows the readout, but only when it really changes.
 *
 * The readout is recomputed on every frame of the shared loop; assigning the
 * same string in a fresh object ten times a second would redraw the header (and
 * the pane's tab) for nothing.
 */
let published = ''
$effect(() => {
  const subtitle = running ? digits : mode
  if (subtitle === published) return
  published = subtitle
  paneMeta.set(paneId, { subtitle })
})
</script>

<div class="chrono" data-testid="timer" data-mode={mode} data-running={running || undefined}>
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
      data-testid="timer-mode-timer">timer</button
    >
  </div>

  <div class="stage">
    {#if mode === 'timer'}
      <div class="ladder" bind:this={ladder} class:pulse={urgent}>
        <SegmentMeter
          value={left}
          {segments}
          direction={vertical ? 'up' : 'right'}
          {tone}
          {flash}
          testid="timer-ladder"
        />
      </div>
    {/if}

    <div class="face">
      <Readout
        value={digits}
        tail={mode === 'stopwatch' ? `.${parts.tenths}` : undefined}
        size="step-3"
        {tone}
        testid="timer-readout"
        label={mode === 'timer' ? 'Time remaining' : 'Elapsed time'}
      />

      <div class="controls">
        {#if running}
          <button type="button" onclick={stop} data-testid="timer-stop">stop</button>
        {:else}
          <button type="button" class="go" onclick={start} data-testid="timer-start">start</button>
        {/if}
        {#if mode === 'stopwatch'}
          <button type="button" onclick={lap} disabled={!running} data-testid="timer-lap">lap</button>
        {/if}
        <button type="button" onclick={reset} data-testid="timer-reset">reset</button>
      </div>

      {#if mode === 'timer'}
        <div class="presets">
          {#each TIMER_PRESETS as minutes (minutes)}
            <button
              type="button"
              class:on={durationMs === minutes * 60_000}
              onclick={() => setDuration(minutes)}
              data-testid="timer-preset"
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
                setCustom()
              }
            }}
            placeholder="min"
            aria-label="Minutes"
            spellcheck="false"
            data-testid="timer-custom"
          />
        </div>
      {/if}
    </div>
  </div>

  {#if mode === 'stopwatch'}
    <div class="spectrum" data-testid="timer-spectrum">
      <LevelBars {bars} label="Lap times" testid="timer-bars" />
    </div>

    {#if lapRows.length > 0}
      <div class="laps" data-testid="timer-laps">
        {#each lapRows as row (row.n)}
          <div class="lap" class:best={row.best} class:worst={row.worst} data-testid="timer-lap-row">
            <span class="n">{row.n}</span>
            <span class="split">{formatClock(row.atMs)}.{splitDuration(row.atMs).tenths}</span>
            <span class="delta">+{formatClock(row.ms)}.{splitDuration(row.ms).tenths}</span>
            <span class="mark">{row.best ? '▲' : row.worst ? '▼' : ''}</span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
.chrono {
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
  gap: var(--space-1);
}

.modes button,
.controls button,
.presets button {
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

.modes button.on,
.presets button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.controls button:hover:not(:disabled),
.presets button:hover {
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

.stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: var(--space-2);
}

/* The ladder burns down beside the numbers: a quantity you can read from across
   the room, in the same language the spectrum pane speaks. */
.ladder {
  flex: 0 0 1.6rem;
  min-height: 2rem;
}

.ladder.pulse {
  animation: ladder-pulse 1s steps(2, end) infinite;
}

@keyframes ladder-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

.face {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.controls,
.presets {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-1);
}

.presets input {
  width: 3rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-align: center;
  outline: none;
}

.presets input:focus {
  border-color: var(--accent);
}

.spectrum {
  flex: 0 0 3rem;
  min-height: 1.5rem;
}

.laps {
  flex: 0 1 auto;
  max-height: 40%;
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
</style>
