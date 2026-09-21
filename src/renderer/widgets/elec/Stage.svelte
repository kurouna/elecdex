<script lang="ts" module>
import type { UnitIndex } from '@shared/elec'

/** What a seat shows: its state, and the words for it. */
export type UnitState =
  | 'standby'
  | 'queued'
  | 'tx'
  | 'rx'
  | 'approve'
  | 'reject'
  | 'abstain'
  | 'invalid'

export interface UnitView {
  unit: UnitIndex
  state: UnitState
  /** The state as the unit reports it: "approve", "rx · reasoning", "no carrier". */
  code: string
  model: string
  confidence: number | null
  /** The ballot the verdict is read from: its stamp plays once, when it lands. */
  ballot: string | null
  /** The first round's verdict, when the second changed it. */
  was: string | null
}

export interface Readout {
  label: string
  value: string
}
</script>

<script lang="ts">
import { ELEC_UNITS } from '@shared/elec'

/**
 * The council: three plates in a triangle around the core, as the source of the
 * idea drew its three computers. The plates are one SVG stretched over the board
 * (their strokes kept at a pixel with `non-scaling-stroke`); the words over them
 * are HTML, placed on the same percentages, so they wrap and scale with the pane
 * (container query units) instead of shrinking with a picture.
 *
 * Nothing here runs on a timer. While the council sits, the plates of the units
 * writing, the core and the ring between them step with the shared pulse
 * (`data-pulse` on the widget); a verdict lands with a stamp and a flash that
 * play once.
 */
interface Props {
  units: readonly UnitView[]
  /** Voting now: the ring runs with the pulse. */
  live: boolean
  left: readonly Readout[]
  right: readonly Readout[]
  /** What the stage is doing, under its core. */
  core: string
}
const { units, live, left, right, core }: Props = $props()

/**
 * Each plate's outline in the board's 100 x 100, the corner that faces the core cut
 * away; and where its words go (left, top, width, height in percent).
 */
const PLATES: Record<UnitIndex, { points: string; box: [number, number, number, number] }> = {
  0: { points: '2,58 36,58 42,66 42,97 2,97', box: [2, 58, 40, 39] },
  1: { points: '29,2 71,2 71,26 64,33 36,33 29,26', box: [29, 2, 42, 31] },
  2: { points: '64,58 98,58 98,97 58,97 58,66', box: [58, 58, 40, 39] },
}
</script>

<div class="stage" class:live data-testid="elec-stage">
  <div class="board">
    <svg class="frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon class="ring" points="50,18 22,78 78,78" vector-effect="non-scaling-stroke" />
      <line class="spoke" x1="50" y1="33" x2="50" y2="46" vector-effect="non-scaling-stroke" />
      <line class="spoke" x1="42" y1="66" x2="50" y2="46" vector-effect="non-scaling-stroke" />
      <line class="spoke" x1="58" y1="66" x2="50" y2="46" vector-effect="non-scaling-stroke" />
      {#each units as view (view.unit)}
        <polygon
          class="plate"
          data-state={view.state}
          points={PLATES[view.unit].points}
          vector-effect="non-scaling-stroke"
        />
      {/each}
    </svg>

    <div class="core" data-testid="elec-core">
      <span class="hex">
        <svg viewBox="0 0 116 100" aria-hidden="true">
          <polygon class="outer" points="29,1 87,1 115,50 87,99 29,99 1,50" />
          <polygon class="inner" points="35,11 81,11 103,50 81,89 35,89 13,50" />
        </svg>
        <span class="mark">ELEC</span>
      </span>
      <span class="doing">{core}</span>
    </div>

    {#each units as view (view.unit)}
      {@const [x, y, w, h] = PLATES[view.unit].box}
      <div
        class="unit u{view.unit}"
        data-state={view.state}
        data-testid="elec-unit"
        data-unit={view.unit}
        style:left={`${x}%`}
        style:top={`${y}%`}
        style:width={`${w}%`}
        style:height={`${h}%`}
      >
        {#key view.ballot}
          {#if view.ballot !== null}<span class="flash" aria-hidden="true"></span>{/if}
        {/key}
        <span class="code">{ELEC_UNITS[view.unit].code}</span>
        <span class="name">{ELEC_UNITS[view.unit].name}</span>
        {#key view.ballot}
          <span class="state" class:stamp={view.ballot !== null} data-testid="elec-unit-state">
            {#if view.was !== null}<span class="was">{view.was} ›</span>{/if}{view.code}
          </span>
        {/key}
        <span class="model" title={view.model}>{view.model === '' ? 'no model' : view.model}</span>
        {#if view.confidence !== null}
          <span class="confidence" title={`confidence ${view.confidence}% - shown, never counted`}>
            <span class="fill" style:width={`${view.confidence}%`}></span>
            <span class="figure">{view.confidence}%</span>
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <dl class="readout left">
    {#each left as row (row.label)}
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
    {/each}
  </dl>
  <dl class="readout right">
    {#each right as row (row.label)}
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
    {/each}
  </dl>
</div>

<style>
/*
 * A dot lattice for ground and brackets on the corners: static, painted once.
 * The stage is a container, so the board inside can keep its proportions by it.
 */
.stage {
  position: relative;
  flex: 0 0 auto;
  /* No taller than the board can use: a narrow pane's board is lower (see .board). */
  height: min(clamp(10rem, 50%, 34rem), 64cqw);
  min-height: 0;
  container: stage / size;
  background: radial-gradient(
      circle,
      color-mix(in srgb, var(--accent) 18%, transparent) 1px,
      transparent 1.5px
    )
    0 0 / 14px 14px;
  user-select: none;
}

.stage::before,
.stage::after {
  content: '';
  position: absolute;
  width: 0.9rem;
  height: 0.9rem;
  border: 0 solid var(--accent-dim);
  pointer-events: none;
}

.stage::before {
  top: 0;
  left: 0;
  border-width: 1px 0 0 1px;
}

.stage::after {
  right: 0;
  bottom: 0;
  border-width: 0 1px 1px 0;
}

/*
 * The triangle keeps its shape: at most 2.3 times as wide as it is high, centred in
 * a wide stage; in a narrow one it takes the whole width, up to 1.6 times its height.
 * Its words are sized by it.
 */
.board {
  position: absolute;
  inset: 0;
  width: min(100%, 230cqh);
  height: min(100%, calc(100cqw / 1.6));
  margin: auto;
  container-type: size;
}

.frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ring,
.spoke {
  fill: none;
  stroke: var(--accent-dim);
  stroke-width: 1;
}

.ring {
  stroke-dasharray: 2 6;
}

/* While the council sits, the ring runs - a step a beat, on the shared pulse. */
.live .ring,
.live .spoke {
  stroke: var(--accent);
}

:global([data-pulse='1']) .live .ring {
  stroke-dashoffset: 2;
}

:global([data-pulse='2']) .live .ring {
  stroke-dashoffset: 4;
}

:global([data-pulse='3']) .live .ring {
  stroke-dashoffset: 6;
}

/* Opaque, so the ring behind goes under a plate and not through it. */
.plate {
  --tone: var(--accent-dim);
  fill: color-mix(in srgb, var(--accent) 4%, var(--app-bg));
  stroke: var(--tone);
  stroke-width: 1;
  transition: fill calc(var(--dur-base) * var(--motion-scale)) var(--ease-out);
}

.plate[data-state='queued'] {
  stroke-dasharray: 4 3;
}

.plate:is([data-state='tx'], [data-state='rx']) {
  --tone: var(--accent);
  fill: color-mix(in srgb, var(--accent) 16%, var(--app-bg));
}

:global([data-pulse='1']) .plate:is([data-state='tx'], [data-state='rx']),
:global([data-pulse='3']) .plate:is([data-state='tx'], [data-state='rx']) {
  fill: color-mix(in srgb, var(--accent) 11%, var(--app-bg));
}

:global([data-pulse='2']) .plate:is([data-state='tx'], [data-state='rx']) {
  fill: color-mix(in srgb, var(--accent) 6%, var(--app-bg));
}

.plate[data-state='approve'] {
  --tone: var(--ok);
  fill: color-mix(in srgb, var(--ok) 24%, var(--app-bg));
}

.plate[data-state='reject'] {
  --tone: var(--danger);
  fill: color-mix(in srgb, var(--danger) 24%, var(--app-bg));
}

/* A vote cast glows in its colour, where the theme glows at all. */
.plate:is([data-state='approve'], [data-state='reject']) {
  filter: drop-shadow(0 0 calc(var(--glow) * 0.45rem) var(--tone));
}

.plate[data-state='abstain'] {
  --tone: var(--info);
  fill: color-mix(in srgb, var(--info) 12%, var(--app-bg));
}

.plate[data-state='invalid'] {
  --tone: var(--warn);
  fill: color-mix(in srgb, var(--warn) 9%, var(--app-bg));
  stroke-dasharray: 4 3;
}

/* The core: a hexagon where the spokes meet, and what the council is doing under it. */
.core {
  position: absolute;
  left: 50%;
  top: 46%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  /* Centred on the hexagon, not on the hexagon and its line together. */
  transform: translate(-50%, calc(-0.5 * clamp(3rem, 16cqh, 4.6rem) / 1.16));
  pointer-events: none;
}

.hex {
  position: relative;
  display: grid;
  place-items: center;
  width: clamp(3rem, 16cqh, 4.6rem);
  aspect-ratio: 1.16;
}

.hex svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hex .outer {
  fill: var(--app-bg);
  stroke: var(--accent);
  stroke-width: 2;
}

.hex .inner {
  fill: none;
  stroke: var(--accent-dim);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.live .hex .outer {
  fill: color-mix(in srgb, var(--accent) 16%, var(--app-bg));
}

:global([data-pulse='2']) .live .hex .outer {
  fill: color-mix(in srgb, var(--accent) 6%, var(--app-bg));
}

.mark {
  position: relative;
  font-family: var(--font-display);
  font-size: clamp(0.6rem, 4.4cqh, 1rem);
  letter-spacing: var(--tracking-wider);
  color: var(--accent-strong);
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--accent);
}

.doing {
  padding: 0 0.3rem;
  background: var(--app-bg);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--text-muted);
}

.live .doing {
  color: var(--accent);
}

/* A seat's words, over its plate. */
.unit {
  --tone: var(--text-muted);
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  padding: 0.3rem 0.6rem;
  overflow: hidden;
  text-align: center;
  /* Its words are sized by its own plate, and drop what a low plate has no room for. */
  container: unit / size;
}

.unit:is([data-state='tx'], [data-state='rx']) {
  --tone: var(--accent);
}

.unit[data-state='approve'] {
  --tone: var(--ok);
}

.unit[data-state='reject'] {
  --tone: var(--danger);
}

.unit[data-state='abstain'] {
  --tone: var(--info);
}

.unit[data-state='invalid'] {
  --tone: var(--warn);
}

/* The bottom seats' words keep clear of the corner cut towards the core. */
.u0 {
  padding-right: 1.4rem;
}

.u2 {
  padding-left: 1.4rem;
}

.code {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  color: var(--text-muted);
}

.name {
  font-family: var(--font-display);
  font-size: clamp(0.85rem, 24cqh, 2.1rem);
  line-height: 1.05;
  letter-spacing: var(--tracking-wider);
  color: var(--accent-strong);
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--accent);
}

.state {
  max-width: 100%;
  font-family: var(--font-display);
  font-size: clamp(0.7rem, 16cqh, 1.35rem);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--tone);
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) var(--tone);
}

.unit:is([data-state='standby'], [data-state='queued']) .state {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  text-shadow: none;
}

.was {
  margin-right: 0.35em;
  font-size: 0.7em;
  color: var(--text-muted);
}

.model {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

/* Confidence: a thin gauge under the verdict - shown, never counted. */
.confidence {
  position: relative;
  width: min(9rem, 80%);
  height: 0.7rem;
  margin-top: 0.1rem;
  border: 1px solid color-mix(in srgb, var(--tone) 50%, transparent);
}

.confidence .fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: color-mix(in srgb, var(--tone) 45%, transparent);
}

.confidence .figure {
  position: relative;
  display: block;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  line-height: 0.65rem;
  color: var(--text);
}

/* A verdict landing: the word is struck like a stamp, the plate flashes. Once each. */
.stamp {
  animation: elec-stamp calc(420ms * var(--motion-scale)) var(--ease-emphasized) backwards;
}

@keyframes elec-stamp {
  from {
    opacity: 0;
    transform: scale(1.7);
    letter-spacing: 0.6em;
  }
  60% {
    opacity: 1;
  }
}

.flash {
  position: absolute;
  inset: 0;
  background: var(--tone);
  opacity: 0;
  pointer-events: none;
  animation: elec-flash calc(520ms * var(--motion-scale)) var(--ease-out) backwards;
}

@keyframes elec-flash {
  from {
    opacity: 0.45;
  }
}

/* The corners the triangle leaves: what the deliberation is, read as a console reads it. */
.readout {
  position: absolute;
  top: 0.4rem;
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.05rem 0.6rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  pointer-events: none;
}

.readout.left {
  left: 0.6rem;
}

.readout.right {
  right: 0.6rem;
  text-align: right;
}

.readout dt {
  letter-spacing: var(--tracking-wide);
  color: var(--text-muted);
}

.readout dd {
  margin: 0;
  color: var(--accent);
}

/* Too narrow for the corners: the plates need all of it. */
@container stage (max-width: 34rem) {
  .readout {
    display: none;
  }
}

/* A low plate keeps the name and the verdict; the rest is in the statements below. */
@container unit (max-height: 8rem) {
  .model,
  .code {
    display: none;
  }
}

@container unit (max-height: 5.5rem) {
  .confidence {
    display: none;
  }
}
</style>
