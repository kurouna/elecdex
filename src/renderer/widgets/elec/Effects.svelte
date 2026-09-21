<script lang="ts">
import { UNIT_INDICES, type UnitIndex } from '@shared/elec'
import { PLATE_POINTS } from './geometry.ts'
import type { UnitView } from './Stage.svelte'

/**
 * The council's light: what runs along its lines while it sits, and what lands when it
 * decides. Drawn over the plates in the board's own pixels - the plates' SVG is stretched to
 * the board, which would stretch a dash and a stroke with it - so every run of light is the
 * same thickness and speed whichever way the board is proportioned.
 *
 * The light-cycle vocabulary of Tron: a bright head with a short tail running on the circuit.
 * While a unit is asked, light runs round its plate, and along its spoke - out from the core
 * while the question travels (TX), in from the plate while the answer comes back (RX); a
 * comet runs round the ring. A vote draws its plate's outline once in its colour. The
 * resolution sends the three plates' light down the spokes into the core, which sends a ring
 * out across the board.
 *
 * All of it is SVG stroke-dashoffset and transform animation, only while the council sits or
 * for the moment something lands. Endless ones pause with the window put away
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
  /** Set when a resolution lands while the pane watches: the convergence plays once for it. */
  converge: { key: string; tone: string } | null
  /**
   * The ring's comet runs under the plates (they are opaque, so it shows only in the gaps
   * between them, as the ring does); everything else is drawn over them.
   */
  layer: 'under' | 'over'
}
const { width, height, top, units, live, converge, layer }: Props = $props()

const px = (x: number, y: number): string => `${(x / 100) * width},${(y / 100) * height}`
const outline = (unit: UnitIndex): string => PLATE_POINTS[unit].map(([x, y]) => px(x, y)).join(' ')

/** Where each plate's spoke leaves it: the edge that faces the core. */
const MOUTHS: Record<UnitIndex, [number, number]> = { 0: [39, 62], 1: [50, 33], 2: [61, 62] }
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
</script>

{#if ready}
  <svg class="effects" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" data-layer={layer}>
    {#if live && layer === 'under'}
      <!-- A comet on the ring, two out of phase. -->
      <polygon class="comet" points={`${px(50, 18)} ${px(22, 78)} ${px(78, 78)}`} pathLength="300" />
      <polygon class="comet late" points={`${px(50, 18)} ${px(22, 78)} ${px(78, 78)}`} pathLength="300" />
    {/if}

    {#each layer === 'over' ? units : [] as view (view.unit)}
      {#if live && asked(view)}
        {@const [mx, my] = mouth(view.unit)}
        {@const [cx, cy] = core}
        <!-- Light round the plate of a unit being asked, faster once its answer comes. -->
        <polygon class="trace" class:rx={view.state === 'rx'} points={outline(view.unit)} pathLength="100" data-testid="elec-trace" />
        <polygon class="trace second" class:rx={view.state === 'rx'} points={outline(view.unit)} pathLength="100" />
        <!-- A packet on the spoke: out to the unit with the question, back to the core with the answer. -->
        {#if view.state === 'tx'}
          <line class="packet" x1={cx} y1={cy} x2={mx} y2={my} pathLength="100" />
        {:else}
          <line class="packet rx" x1={mx} y1={my} x2={cx} y2={cy} pathLength="100" />
        {/if}
      {/if}
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

    {#if converge !== null && layer === 'over'}
      {#key converge.key}
        <g class="converge" style:--tone={converge.tone} data-testid="elec-converge">
          {#each UNIT_INDICES as unit (unit)}
            {@const [mx, my] = mouth(unit)}
            <line class="inflow" x1={mx} y1={my} x2={core[0]} y2={core[1]} pathLength="100" />
          {/each}
          <circle class="shock" cx={core[0]} cy={core[1]} r={Math.min(width, height) * 0.08} />
          <circle class="shock late" cx={core[0]} cy={core[1]} r={Math.min(width, height) * 0.08} />
        </g>
      {/key}
    {/if}
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
line,
circle {
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

.packet.rx {
  animation-duration: 0.6s;
  animation-play-state: var(--ambient-play-state);
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

/* ---- Once: a vote landing, the resolution arriving ---- */

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

.inflow {
  stroke: var(--tone);
  stroke-width: 3;
  stroke-dasharray: 100 100;
  opacity: 0;
  filter: drop-shadow(0 0 6px var(--tone));
  animation: elec-inflow calc(700ms * var(--motion-scale)) var(--ease-in-out) backwards;
}

@keyframes elec-inflow {
  from {
    stroke-dashoffset: 100;
    opacity: 1;
  }
  70% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  to {
    stroke-dashoffset: -100;
    opacity: 0;
  }
}

/* The ring the core sends out: transform and opacity only, from its own centre. */
.shock {
  stroke: var(--tone);
  stroke-width: 2;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  filter: drop-shadow(0 0 6px var(--tone));
  animation: elec-shock calc(1200ms * var(--motion-scale)) var(--ease-out)
    calc(450ms * var(--motion-scale)) backwards;
}

.shock.late {
  animation-delay: calc(650ms * var(--motion-scale));
}

@keyframes elec-shock {
  from {
    opacity: 0.9;
    transform: scale(0.6);
  }
  to {
    opacity: 0;
    transform: scale(7);
  }
}
</style>
