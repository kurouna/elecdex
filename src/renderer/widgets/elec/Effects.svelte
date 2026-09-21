<script lang="ts">
import type { UnitIndex } from '@shared/elec'
import { untrack } from 'svelte'
import { fade } from 'svelte/transition'
import { MOUTHS, PLATE_POINTS, RING } from './geometry.ts'
import { HOLD_MS, nextPackets, type Packet } from './light.ts'
import type { UnitView } from './Stage.svelte'

/**
 * The council's light: what runs along its lines while it sits, and what lands when it
 * decides. Drawn over the plates in the board's own pixels - the plates' SVG is stretched to
 * the board, which would stretch a dash and a stroke with it - so every run of light is the
 * same thickness and speed whichever way the board is proportioned.
 *
 * The light-cycle vocabulary of Tron: a bright head with a short tail running on the circuit.
 * While a unit is asked, light runs round its plate, and along its spoke - out from the core
 * while the question travels (TX), in from the plate as the answer comes back (RX); a
 * comet runs round the ring. A vote draws its plate's outline once in its colour. The
 * resolution itself has none of this (a convergence on the core was tried and taken out as
 * too theatrical, 2026-09-21): it powers on in the strip below, as notices do.
 *
 * The answer's packets are its traffic, not a loop: one sets out for each piece main sends
 * (`received` growing), as many as `nextPackets` lets on the spoke - so a quick model streams,
 * a slow one ticks, and a unit thinking it over leaves its spoke dark. The moment the first
 * piece arrives the spoke blinks once and the light round the plate starts over at its
 * quicker pace (restarted, because a running animation given a new duration jumps).
 *
 * What runs while the council sits comes up and goes out over a moment (`HOLD_MS`) instead of
 * appearing whole: the last vote puts the lights out, and the resolution waits for the dark.
 *
 * All of it is SVG stroke-dashoffset and transform animation, only while the council sits or
 * for the moment a vote lands. Endless ones pause with the window put away
 * (`--ambient-play-state`); none of it is drawn with motion reduced (the owner leaves this
 * component out), and a background tab's `display: none` stops it.
 */
interface Props {
  width: number
  height: number
  /** The core's centre, in percent down the board. */
  top: number
  units: readonly UnitView[]
  live: boolean
  /**
   * The ring's comet runs under the plates (they are opaque, so it shows only in the gaps
   * between them, as the ring does); everything else is drawn over them.
   */
  layer: 'under' | 'over'
}
const { width, height, top, units, live, layer }: Props = $props()

const px = (x: number, y: number): string => `${(x / 100) * width},${(y / 100) * height}`
const outline = (unit: UnitIndex): string => PLATE_POINTS[unit].map(([x, y]) => px(x, y)).join(' ')

const ring = $derived(RING.map(([x, y]) => px(x, y)).join(' '))
const core = $derived<[number, number]>([width / 2, (top / 100) * height])
const mouth = (unit: UnitIndex): [number, number] => {
  const [x, y] = MOUTHS[unit]
  return [(x / 100) * width, (y / 100) * height]
}

const TONES: Record<string, string> = {
  approve: 'var(--ok)',
  reject: 'var(--danger)',
  abstain: 'var(--info)',
  invalid: 'var(--warn)',
}
const asked = (view: UnitView): boolean => view.state === 'tx' || view.state === 'rx'
const ready = $derived(width > 0 && height > 0)
const light = { duration: HOLD_MS }

/** The packets on the spokes now; each is taken away by its own animation ending. */
let packets = $state.raw<readonly Packet[]>([])
/** How much of each unit's answer had arrived when last looked at; not reactive. */
const heard = new Map<UnitIndex, number>()

$effect(() => {
  if (layer !== 'over') return
  for (const view of units) {
    const before = heard.get(view.unit)
    // Only an answer being followed is counted: one first seen part-written (a pane mounted
    // mid-answer, a deliberation opened from the log) is not a piece arriving.
    if (!live || !asked(view)) {
      heard.delete(view.unit)
      continue
    }
    heard.set(view.unit, view.received)
    if (before === undefined || view.received <= before) continue
    packets = nextPackets(
      untrack(() => packets),
      view.unit,
      performance.now(),
    )
  }
})

function landed(id: number): void {
  packets = packets.filter((p) => p.id !== id)
}
</script>

{#if ready}
  <svg class="effects" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" data-layer={layer}>
    {#if live && layer === 'under'}
      <!-- A comet on the ring, two out of phase. -->
      <g transition:fade={light}>
        <polygon class="comet" points={ring} pathLength="300" />
        <polygon class="comet late" points={ring} pathLength="300" />
      </g>
    {/if}

    {#each layer === 'over' ? units : [] as view (view.unit)}
      {#if live && asked(view)}
        {@const [mx, my] = mouth(view.unit)}
        {@const [cx, cy] = core}
        <g transition:fade={light}>
          <!-- Light round the plate of a unit being asked, started over and faster once its answer comes. -->
          {#key view.state}
            <polygon class="trace" class:rx={view.state === 'rx'} points={outline(view.unit)} pathLength="100" data-testid="elec-trace" />
            <polygon class="trace second" class:rx={view.state === 'rx'} points={outline(view.unit)} pathLength="100" />
          {/key}
          {#if view.state === 'tx'}
            <!-- The question on its way out to the unit, for as long as nothing comes back. -->
            <line class="packet" x1={cx} y1={cy} x2={mx} y2={my} pathLength="100" />
          {:else}
            <!-- The carrier caught: the spoke blinks once as the first piece of the answer arrives. -->
            <line class="lock" x1={mx} y1={my} x2={cx} y2={cy} data-testid="elec-lock" />
          {/if}
        </g>
      {/if}
      <!-- The answer's traffic: a packet to the core for a piece received, each run once. -->
      {#each packets.filter((p) => p.unit === view.unit) as packet (packet.id)}
        {@const [mx, my] = mouth(view.unit)}
        {@const [cx, cy] = core}
        <line
          class="packet once"
          x1={mx}
          y1={my}
          x2={cx}
          y2={cy}
          pathLength="100"
          data-testid="elec-packet"
          onanimationend={() => landed(packet.id)}
        />
      {/each}
      {#key view.ballot}
        {#if view.ballot !== null}
          <!-- The vote landing: the plate's outline drawn once, in its colour, then fading. -->
          <polygon
            class="draw"
            style:--tone={TONES[view.state] ?? 'var(--accent)'}
            points={outline(view.unit)}
            pathLength="100"
          />
        {/if}
      {/key}
    {/each}

  </svg>
{/if}

<style>
.effects {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

polygon,
line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---- While the council sits: endless, paused with the window away ---- */

.comet {
  stroke: var(--accent-strong);
  stroke-width: 2;
  stroke-dasharray: 22 278;
  filter: drop-shadow(0 0 4px var(--accent));
  animation: elec-run-300 3.2s linear infinite;
  animation-play-state: var(--ambient-play-state);
}

.comet.late {
  animation-delay: -1.6s;
  animation-play-state: var(--ambient-play-state);
}

.trace {
  stroke: var(--accent-strong);
  stroke-width: 2.5;
  stroke-dasharray: 9 91;
  filter: drop-shadow(0 0 5px var(--accent));
  animation: elec-run-100 2.4s linear infinite;
  animation-play-state: var(--ambient-play-state);
}

.trace.second {
  animation-delay: -1.2s;
  animation-play-state: var(--ambient-play-state);
}

/* An answer coming back runs quicker round its plate. */
.trace.rx {
  animation-duration: 1.2s;
  animation-play-state: var(--ambient-play-state);
}

.trace.second.rx {
  animation-delay: -0.6s;
  animation-play-state: var(--ambient-play-state);
}

.packet {
  stroke: var(--accent-strong);
  stroke-width: 3;
  stroke-dasharray: 14 86;
  filter: drop-shadow(0 0 4px var(--accent));
  animation: elec-run-100 0.9s linear infinite;
  animation-play-state: var(--ambient-play-state);
}

/*
 * One piece of an answer, once down the spoke. The gap is longer than the spoke, so the dash
 * comes in from before its start and leaves past its end with no second one in sight.
 */
.packet.once {
  stroke-dasharray: 14 200;
  opacity: 0;
  animation: elec-packet calc(600ms * var(--motion-scale)) linear backwards;
}

@keyframes elec-packet {
  from {
    stroke-dashoffset: 16;
    opacity: 1;
  }
  to {
    stroke-dashoffset: -102;
    opacity: 1;
  }
}

/* The first piece of an answer: the spoke blinks once, as a carrier is caught. */
.lock {
  stroke: var(--accent-strong);
  stroke-width: 2;
  opacity: 0;
  filter: drop-shadow(0 0 4px var(--accent));
  animation: elec-lock calc(480ms * var(--motion-scale)) linear backwards;
}

@keyframes elec-lock {
  from {
    opacity: 0.9;
  }
  25% {
    opacity: 0.15;
  }
  45% {
    opacity: 0.9;
  }
  to {
    opacity: 0;
  }
}

@keyframes elec-run-100 {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -100;
  }
}

@keyframes elec-run-300 {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -300;
  }
}

/* ---- Once: a vote landing ---- */

.draw {
  stroke: var(--tone);
  stroke-width: 3;
  stroke-dasharray: 100 100;
  opacity: 0;
  filter: drop-shadow(0 0 6px var(--tone));
  animation: elec-draw calc(1100ms * var(--motion-scale)) var(--ease-out) backwards;
}

@keyframes elec-draw {
  from {
    stroke-dashoffset: 100;
    opacity: 1;
  }
  55% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  to {
    stroke-dashoffset: 0;
    opacity: 0;
  }
}

/* On a light ground a glow is a smudge round the line, not light: the line runs alone there. */
:global(:root[data-mode='light']) .effects :is(polygon, line) {
  filter: none;
}
</style>
