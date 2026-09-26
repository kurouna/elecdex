<script lang="ts">
import {
  AWAKE_DURATIONS,
  type AwakeLevel,
  clockAt,
  holdFraction,
  tMinus,
  type UtilityPane,
} from '@shared/utility'
import { onBoundary } from '../../lib/frame-loop.ts'
import { awake } from '../../stores/awake.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'

/**
 * AWAKE (docs/architecture.md section 5.16): keeps the machine from sleeping
 * while the user says so. The hold is main's - one for the machine, going on
 * with this pane closed and taken up again after a restart - and this is only
 * where it is seen and changed. The length the level buttons hold for is the
 * pane's own choice.
 *
 * The ring and the T-minus move once a second, and only while the pane is
 * seen and a timed hold runs; everything else changes when main says so.
 */
interface Props {
  paneId: string
  pane: UtilityPane
  visible: boolean
}

const { paneId, pane, visible }: Props = $props()

const hold = $derived(awake.state)
const timed = $derived(hold.level !== 'off' && hold.until !== null)

let now = $state(Date.now())
$effect(() => {
  if (!visible || !timed) return
  now = Date.now()
  return onBoundary(1000, () => {
    now = Date.now()
  })
})

const LEVELS: readonly { level: AwakeLevel; label: string; hint: string }[] = [
  { level: 'off', label: 'OFF', hint: 'the machine sleeps as its power settings say' },
  { level: 'system', label: 'SYSTEM', hint: 'the machine stays awake; the screen may go dark' },
  { level: 'display', label: 'DISPLAY', hint: 'the machine and the screen both stay on' },
]

const lengthLabel = (ms: number | null): string =>
  ms === null ? '∞' : ms < 3_600_000 ? `${ms / 60_000}M` : `${ms / 3_600_000}H`

async function choose(level: AwakeLevel): Promise<void> {
  if (level === hold.level) return
  await awake.set(level === 'off' ? { level } : { level, forMs: pane.awakeFor })
  sfx.play(level === 'off' ? 'collapse' : 'expand')
}

/** A length is this pane's choice; while holding, choosing one starts it again from now. */
async function lengthen(forMs: number | null): Promise<void> {
  widgetState.patch(paneId, { awakeFor: forMs ?? undefined })
  if (hold.level === 'off') {
    sfx.play('panel')
    return
  }
  await awake.set({ level: hold.level, forMs })
  sfx.play('expand')
}

async function extend(): Promise<void> {
  await awake.extend()
  sfx.play('panel')
}

const refused = $derived(hold.level !== 'off' && !hold.held)
const word = $derived(
  hold.level === 'off' ? 'RELEASED' : refused ? 'NO HOLD' : `HOLD · ${hold.level.toUpperCase()}`,
)
const lamp = $derived(hold.level === 'off' ? 'off' : refused ? 'refused' : 'on')

/** The ring's arc, as a share of its circumference. */
const RADIUS = 40
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const fraction = $derived(holdFraction(hold, now))
const TICKS = Array.from({ length: 60 }, (_, i) => i)

const face = $derived(
  hold.level === 'off' ? 'OFF' : hold.until === null ? '∞' : tMinus(hold.until - now),
)
const detail = $derived.by(() => {
  if (hold.level === 'off') return 'nothing held'
  if (refused) return 'the system did not take the request'
  const from = hold.since === null ? '' : ` · since ${clockAt(hold.since, now)}`
  return hold.until === null
    ? `until turned off${from}`
    : `until ${clockAt(hold.until, now)}${from}`
})
</script>

<div class="awake" data-testid="awake" data-level={hold.level} data-lamp={lamp}>
  <div class="dial" aria-hidden="true">
    <svg viewBox="0 0 100 100">
      {#each TICKS as i (i)}
        <line
          class="tick"
          class:major={i % 5 === 0}
          x1="50"
          y1={i % 5 === 0 ? 2 : 3.5}
          x2="50"
          y2="7"
          transform={`rotate(${i * 6} 50 50)`}
        />
      {/each}
      <circle class="track" cx="50" cy="50" r={RADIUS} />
      {#if fraction > 0}
        <circle
          class="arc"
          class:endless={hold.until === null}
          cx="50"
          cy="50"
          r={RADIUS}
          stroke-dasharray={`${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform="rotate(-90 50 50)"
        />
      {/if}
    </svg>
    <div class="face">
      <span class="digits" data-testid="awake-face">{face}</span>
      <span class="unit">{hold.level === 'off' ? 'IDLE' : hold.until === null ? 'NO END' : 'T-MINUS'}</span>
    </div>
  </div>

  <div class="panel">
    <div class="state" data-testid="awake-state"><i></i>{word}</div>
    <div class="detail" data-testid="awake-detail">{detail}</div>

    <div class="u-row">
      <span class="u-label">LEVEL</span>
      <span class="u-chips">
        {#each LEVELS as entry (entry.level)}
          <button
            type="button"
            class="u-chip"
            class:on={hold.level === entry.level}
            aria-pressed={hold.level === entry.level}
            title={entry.hint}
            onclick={() => void choose(entry.level)}
            data-testid="awake-level"
            data-level={entry.level}>{entry.label}</button
          >
        {/each}
      </span>
    </div>

    <div class="u-row">
      <span class="u-label">FOR</span>
      <span class="u-chips">
        {#each AWAKE_DURATIONS as forMs (forMs)}
          <button
            type="button"
            class="u-chip"
            class:on={pane.awakeFor === forMs}
            aria-pressed={pane.awakeFor === forMs}
            onclick={() => void lengthen(forMs)}
            data-testid="awake-for"
            data-for={forMs ?? 'none'}>{lengthLabel(forMs)}</button
          >
        {/each}
        <button
          type="button"
          class="u-chip extend"
          disabled={!timed}
          title="thirty minutes more"
          onclick={() => void extend()}
          data-testid="awake-extend">+30M</button
        >
      </span>
    </div>

    {#if hold.onBattery && hold.level !== 'off'}
      <p class="battery" data-testid="awake-battery">on battery: the hold keeps the machine awake all the same</p>
    {/if}
    <p class="note">
      the lid and the sleep button still put it to sleep · the hold goes on with this pane closed,
      and after a restart, until turned off
    </p>
  </div>
</div>

<style>
.awake {
  container-type: inline-size;
  --tone: var(--text-muted);
  --u-label: 3rem;
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  justify-content: center;
  gap: var(--space-2) var(--space-4);
  min-height: 0;
  overflow-y: auto;
}

.awake[data-lamp='on'] {
  --tone: var(--accent);
}

.awake[data-lamp='refused'] {
  --tone: var(--warn);
}

.dial {
  position: relative;
  flex: none;
  width: clamp(8rem, 36cqi, 12rem);
  aspect-ratio: 1;
}

.dial svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.tick {
  stroke: var(--panel-rule);
  stroke-width: 0.6;
}

.tick.major {
  stroke: var(--panel-border);
  stroke-width: 1;
}

.track {
  fill: none;
  stroke: var(--accent-faint);
  stroke-width: 3;
}

.arc {
  fill: none;
  stroke: var(--tone);
  stroke-width: 3;
  filter: drop-shadow(0 0 calc(var(--glow) * 3px) var(--tone));
}

.arc.endless {
  stroke-dasharray: 2 2.19;
}

.face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
}

.digits {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  color: var(--tone);
}

.awake[data-level='off'] .digits {
  color: var(--text-muted);
}

.unit {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}

.panel {
  display: flex;
  flex: 0 1 22rem;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  color: var(--tone);
}

.state i {
  width: 0.55rem;
  height: 0.55rem;
  transform: rotate(45deg);
  background: var(--tone);
  box-shadow: 0 0 calc(var(--glow) * 0.6rem) var(--tone);
}

.awake[data-lamp='off'] .state i {
  background: transparent;
  border: 1px solid var(--tone);
}

.detail {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
}

.battery {
  margin: 0;
  font-size: var(--step--1);
  color: var(--warn);
}

.note {
  margin: 0;
  font-size: var(--step--2);
  color: var(--text-muted);
}
.u-chips .u-chip {
  min-width: 2.6rem;
}

.u-chips .extend {
  margin-left: 0.3rem;
}
</style>
