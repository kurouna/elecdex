<script lang="ts">
import {
  formatClock,
  litSegments,
  remaining,
  segmentCount,
  TIMER_STEPS,
  type TimerEntry,
} from '@shared/timer'
import { pulse } from '../../lib/pulse.svelte.ts'
import Readout from '../common/Readout.svelte'
import SegmentMeter from '../common/SegmentMeter.svelte'

/**
 * One countdown: a ladder of segments that goes out a step at a time, the time
 * left beside it, and its own controls.
 *
 * A card of its own because there can be several, each with its own duration and
 * its own run. It owns nothing: every change goes back to the pane, which holds
 * the state - so a card can be removed mid-count without stranding anything.
 */

interface Props {
  timer: TimerEntry
  /** Now, from the pane's shared tick, so every card moves in the same frame. */
  now: number
  onstart: () => void
  onstop: () => void
  onreset: () => void
  onremove: () => void
  /** Sets the countdown to exactly this many minutes. */
  onduration: (minutes: number) => void
  /** Adds to what it is set to, which is how a duration is usually built up. */
  onadd: (minutes: number) => void
}

const { timer, now, onstart, onstop, onreset, onremove, onduration, onadd }: Props = $props()

let ladder = $state<HTMLDivElement | null>(null)
let segments = $state(24)
let vertical = $state(false)
let custom = $state('')

const ms = $derived(remaining(timer, timer.durationMs, now))
const digits = $derived(formatClock(ms))
const left = $derived(timer.durationMs <= 0 ? 0 : ms / timer.durationMs)
const spent = $derived(!timer.running && ms <= 0)

/** The last ten seconds, then the last three: said in colour, not only in digits. */
const urgent = $derived(timer.running && ms <= 10_000)
const critical = $derived(timer.running && ms <= 3000)
const tone = $derived<'accent' | 'warn' | 'danger' | 'ok'>(
  spent ? 'ok' : critical ? 'danger' : urgent ? 'warn' : 'accent',
)

// The ladder pulses through the last ten seconds, on the shared beat (lib/pulse.svelte.ts).
$effect(() => (urgent ? pulse.use() : undefined))

const minutes = $derived(Math.round(timer.durationMs / 60_000))

/**
 * How many segments fit, and which way the ladder runs: measured, not assumed.
 *
 * A card laid out wide turns the column into a rung of segments along its side
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

/** The segment that has just gone out, drawn bright for the frame it goes. */
let flash = $state<number | null>(null)
let litBefore = -1
$effect(() => {
  const lit = litSegments(ms, timer.durationMs, segments)
  if (litBefore !== -1 && lit < litBefore) flash = lit
  else if (lit > litBefore) flash = null
  litBefore = lit
})

function setCustom(): void {
  const value = Number(custom)
  if (!Number.isFinite(value) || value <= 0) return
  onduration(value)
  custom = ''
}
</script>

<div
  class="card"
  class:running={timer.running}
  class:spent
  data-testid="timer-card"
  data-timer={timer.id}
  data-running={timer.running || undefined}
>
  <div class="ladder" bind:this={ladder} data-pulse={urgent ? pulse.phase : undefined}>
    <SegmentMeter
      value={left}
      {segments}
      direction={vertical ? 'up' : 'right'}
      {tone}
      {flash}
      testid="timer-ladder"
    />
  </div>

  <div class="face">
    <div class="head">
      <span class="set">{minutes} min</span>
      {#if timer.running}<span class="state">running</span>{:else if spent}<span class="state done"
          >done</span
        >{/if}
      <button
        type="button"
        class="kill"
        aria-label="remove this timer"
        onclick={onremove}
        data-testid="timer-remove">×</button
      >
    </div>

    <Readout value={digits} size="step-2" {tone} testid="timer-readout" label="Time remaining" />

    <div class="controls">
      {#if timer.running}
        <button type="button" onclick={onstop} data-testid="timer-stop">stop</button>
      {:else}
        <button type="button" class="go" onclick={onstart} data-testid="timer-start">
          {spent ? 'again' : 'start'}
        </button>
      {/if}
      <button type="button" onclick={onreset} data-testid="timer-reset">reset</button>
    </div>

    <!--
      The steps add to what is set rather than replacing it, so any duration can
      be built by tapping - 25 + 10 + 1 - and the list is not a ceiling. The
      field beside them sets an exact number of minutes, and says so.
    -->
    <div class="presets">
      {#each TIMER_STEPS as step (step)}
        <button
          type="button"
          title="{step} minutes more"
          onclick={() => onadd(step)}
          data-testid="timer-step"
          data-minutes={step}
        >
          +{step}
        </button>
      {/each}
      <label class="exact">
        <span class="exact-label">set</span>
        <input
          bind:value={custom}
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              setCustom()
            }
          }}
          placeholder={String(minutes)}
          aria-label="Minutes"
          spellcheck="false"
          data-testid="timer-card-custom"
        />
        <span class="exact-label">min</span>
      </label>
    </div>
  </div>
</div>

<style>
.card {
  position: relative;
  display: flex;
  gap: var(--space-2);
  min-height: 6rem;
  padding: var(--space-1);
  border: 1px solid var(--panel-rule);
}

.card.running {
  border-color: var(--accent-dim);
}

.card.spent {
  border-color: var(--ok);
}

/* A countdown that has just landed flares once, so a card that finished while
   the eye was elsewhere is still obviously the one that went off. */
.card.spent::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--ok);
  opacity: 0;
  animation: landed calc(900ms * var(--motion-scale)) ease-out;
}

@keyframes landed {
  0% {
    opacity: 0.35;
  }
  100% {
    opacity: 0;
  }
}

.ladder {
  flex: 0 0 1.4rem;
  min-height: 3rem;
}

/* The last ten seconds: full, part, low, part, a step each quarter second. */
.ladder[data-pulse='1'],
.ladder[data-pulse='3'] {
  opacity: 0.775;
}

.ladder[data-pulse='2'] {
  opacity: 0.55;
}

.face {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
}

.set,
.state {
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.state {
  margin-left: auto;
  margin-right: var(--space-1);
  color: var(--accent);
}

.state.done {
  color: var(--ok);
}

.kill {
  border: 0;
  padding: 0 2px;
  background: transparent;
  color: transparent;
  font-family: var(--font-mono);
  cursor: pointer;
}

.card:hover .kill {
  color: var(--text-muted);
}

.kill:hover {
  color: var(--danger);
}

.controls,
.presets {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-1);
}

/* A fixed width for the controls, so "start" becoming "stop" does not shift the
   buttons beside it out from under the pointer going for them. */
.controls button {
  min-width: 4.2rem;
}

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

.controls button:hover,
.presets button:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.controls .go {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.exact {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.exact-label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.presets input {
  width: 2.8rem;
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
</style>
