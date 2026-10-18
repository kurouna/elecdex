<script lang="ts">
import {
  ETHER_LIMITS,
  type EtherFigures,
  type EtherLink,
  errorHealth,
  POWER_LABELS,
  type PowerKey,
  powerSuspect,
  SPEED_STEPS,
  speedGrade,
  speedHealth,
  speedWord,
  standardOf,
  stepIndex,
} from '@shared/ethernet'
import { over } from '@shared/netpath'
import { megabits } from '../netpath/draw.ts'

/**
 * The cable, where the Wi-Fi pane has the radio (architecture.md §5.23): the speed
 * the two ends agreed on as a step of a ladder, the adapter's best marked; the
 * copper standard and the link's use each way; the counts the link is judged by;
 * and the driver's settings as plates - read, never changed.
 *
 * The ladder and the speed are coloured by the speed's own judgement only: when
 * CRC errors are the fault, 1 Gb/s stays the accent and the CRC figure takes the
 * colour, on a ground of its own - the panel's culprit, as the path's is a plate.
 * Power saving turns yellow, with its line, only after a drop or a fall in speed
 * was seen with it on: a quiet link is never warned about.
 */
interface Props {
  link: EtherLink
  figures: EtherFigures
  /** The ladder beside the rest, or above it in a narrow pane. */
  wide: boolean
}

const { link, figures: f, wide }: Props = $props()

const speedTone = $derived(speedHealth(link, f))
const grade = $derived(speedGrade(link, f))
const cap = $derived(link.settings?.capMbps ?? null)
const now = $derived(stepIndex(f.speed))
const capStep = $derived(cap === null ? -1 : stepIndex(cap))
const big = $derived(
  f.speed === null
    ? ['—', '']
    : f.speed >= 1000
      ? [`${+(f.speed / 1000).toFixed(1)}`, 'Gb/s']
      : [`${f.speed}`, 'Mb/s'],
)
const suspect = $derived(powerSuspect(link, f))

/** The link's use each way, against its speed. */
const use = $derived.by(() => {
  const bytes = f.speed === null ? null : (f.speed * 1e6) / 8
  const share = (v: number | null): number =>
    v === null || bytes === null ? 0 : Math.min(100, (v / bytes) * 100)
  return { down: share(f.down), up: share(f.up) }
})

const tone = (h: string): string => (h === 'warn' || h === 'bad' ? h : '')
const crcTone = $derived(tone(errorHealth(f.errors, f.errorShare)))
const dropTone = $derived(tone(over(f.drops, ETHER_LIMITS.drops)))
const stormTone = $derived(
  f.broadcast === null ? '' : tone(over(f.broadcast, ETHER_LIMITS.broadcast)),
)

const POWER_ORDER: PowerKey[] = [
  'eee',
  'advancedEee',
  'green',
  'gigaLite',
  'powerSave',
  'autoDisableGigabit',
  'reduceSpeed',
]
const power = $derived(
  POWER_ORDER.filter((k) => link.settings?.power[k] !== undefined).map((k) => ({
    key: k,
    label: POWER_LABELS[k],
    on: link.settings?.power[k] === true,
  })),
)
const s = $derived(link.settings)
const usbFlat = $derived(link.bus === 'usb' && f.usbPlateau)
</script>

<section class="link" class:wide data-testid="ether-link" data-tone={speedTone}>
  <div class="ladder-box" data-hint="speed">
    <div class="ladder" aria-hidden="true">
      {#each SPEED_STEPS as step, i (step)}
        <span class="step" class:lit={i <= now} class:beyond={capStep >= 0 && i > capStep}>
          <i style:height="{22 + i * 13}%"></i>
          {#if i === capStep}<b class="max" style:bottom="{26 + i * 13}%">max</b>{/if}
        </span>
      {/each}
    </div>
    <div class="axis" aria-hidden="true">
      {#each SPEED_STEPS as step, i (step)}<span class:now={i === now}>{speedWord(step).replace('M', '')}</span>{/each}
    </div>
    <div class="speed" data-testid="ether-speed"><b>{big[0]}</b><small>{big[1]}</small></div>
    <div class="grade" data-testid="ether-grade">
      {grade}
      <small>{link.duplex === null ? '' : `${link.duplex.toUpperCase()} DUPLEX`}{s === null ? '' : s.speed === null ? ' · AUTO' : ' · FIXED'}</small>
    </div>
  </div>

  <div class="rest">
    <div class="std">
      <span class="hex" data-hint="standard" aria-hidden="true">
        <svg viewBox="0 0 48 42" preserveAspectRatio="none"><polygon points="12,1 36,1 47,21 36,41 12,41 1,21" /></svg>
        <b>{f.speed === null ? '—' : speedWord(f.speed)}</b>
      </span>
      <div class="use" data-hint="util">
        <span class="cap">{standardOf(f.speed)} · link use{link.busDetail === null ? '' : ` · ${link.busDetail}`}</span>
        <span>↓</span><span class="track"><i style:width="{use.down}%"></i></span><span class="val"
          >{f.down === null ? '—' : megabits(f.down)} <small>{Math.round(use.down)}%</small></span
        >
        <span>↑</span><span class="track"><i style:width="{use.up}%"></i></span><span class="val"
          >{f.up === null ? '—' : megabits(f.up)} <small>{Math.round(use.up)}%</small></span
        >
      </div>
    </div>

    <p class="counts">
      <span data-hint="crc" data-testid="ether-crc"
        >crc <b class={crcTone}>{f.errors === 0 || f.errorShare === null ? '0' : `${f.errorShare.toFixed(2)}%`}</b></span
      >
      <span data-hint="drops">drops <b class={dropTone}>{f.drops}</b> /10 min</span>
      {#if f.broadcast !== null}
        <span data-hint="broadcast">broadcast <b class={stormTone}>{Math.round(f.broadcast).toLocaleString('en')}</b>/s</span>
      {/if}
      {#if f.multicast !== null}
        <span class="info" data-hint="multicast">multicast <b>{Math.round(f.multicast).toLocaleString('en')}</b>/s</span>
      {/if}
    </p>

    {#if s !== null}
      <div class="plates">
        {#each power as p (p.key)}
          <span class="plate" class:on={p.on} class:suspect={p.on && suspect} data-hint="power" data-testid="ether-power"
            >{p.label}</span
          >
        {/each}
        {#if s.jumbo !== null}<span class="plate" class:on={s.jumbo > 0} data-hint="jumbo">JUMBO</span>{/if}
        {#if s.flow !== null}<span class="plate" class:on={s.flow} data-hint="flow">FLOW</span>{/if}
        {#if s.vlan !== null}<span class="plate on" data-hint="vlan">VLAN {s.vlan}</span>{/if}
        {#if s.wol !== null}<span class="plate" class:on={s.wol} data-hint="wol">WOL</span>{/if}
      </div>
    {/if}

    <!-- One line, its room kept when empty, so a case that has one does not move the panel. -->
    {#if suspect}
      <p class="note caution" data-hint="power" data-testid="ether-caution">△ power saving on: the link may sleep or slow when idle</p>
    {:else if usbFlat}
      <p class="note aside" data-hint="util">ⓘ USB adapter, flat near {f.down === null ? '—' : megabits(f.down)}: a USB 2.0 port?</p>
    {:else}
      <p class="note" aria-hidden="true"></p>
    {/if}
  </div>
</section>

<style>
.link {
  --tone: var(--accent);
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.4rem 1rem;
  align-items: start;
  min-width: 0;
}

.link.wide {
  grid-template-columns: 8.5rem minmax(0, 38rem);
}

.link[data-tone='warn'] {
  --tone: var(--warn);
}

.link[data-tone='bad'] {
  --tone: var(--danger);
}

.ladder-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  max-width: 8.5rem;
}

.ladder {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  align-items: end;
  width: 100%;
  height: 3.6rem;
}

.step {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
}

.step i {
  display: block;
  border: 1px solid var(--accent-dim);
  background: var(--accent-faint);
}

.step.lit i {
  border-color: var(--tone);
  background: color-mix(in srgb, var(--tone) 65%, transparent);
}

.step.beyond i {
  border-style: dashed;
  background: none;
  opacity: 0.55;
}

.max {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-weight: 400;
  color: var(--text-muted);
}

.axis {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  letter-spacing: -0.04em;
  text-align: center;
  color: var(--text-muted);
}

.axis .now {
  color: var(--text);
  font-weight: 700;
}

.speed {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  font-family: var(--font-display);
  color: var(--tone);
}

.speed b {
  font-size: var(--step-2);
  font-weight: 400;
  text-shadow: 0 0 calc(var(--glow) * 0.5rem) currentColor;
}

.speed small {
  font-size: var(--step--1);
  color: var(--text-muted);
}

.grade {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-align: center;
  color: var(--tone);
}

.grade small {
  display: block;
  font-size: var(--step--2);
  color: var(--text-muted);
}

.rest {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.std {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.hex {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 3.2rem;
  height: 2.6rem;
}

.hex svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hex polygon {
  fill: var(--accent-faint);
  stroke: var(--text);
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.hex b {
  position: relative;
  font-family: var(--font-display);
  font-size: var(--step-0);
  font-weight: 400;
}

.use {
  display: grid;
  flex: 1;
  grid-template-columns: 0.8rem minmax(0, 1fr) auto;
  gap: 0.15rem 0.4rem;
  align-items: center;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.use .cap {
  grid-column: 1 / -1;
  overflow: hidden;
  font-size: var(--step--2);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-muted);
}

.track {
  position: relative;
  height: 0.3rem;
  background: var(--accent-faint);
}

.track i {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--text);
}

.val {
  text-align: right;
  white-space: nowrap;
}

.val small {
  color: var(--text-muted);
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.9rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.counts span {
  white-space: nowrap;
}

.counts b {
  padding: 0 0.15rem;
  font-weight: 400;
  color: var(--text);
}

/* The figure that is the fault, on a ground of its colour: the panel's culprit. */
.counts b.warn {
  color: var(--warn);
  background: color-mix(in srgb, var(--warn) 14%, transparent);
}

.counts b.bad {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 14%, transparent);
}

.counts .info b {
  color: var(--text-muted);
}

.plates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.plate {
  padding: 0.05rem 0.4rem;
  border: 1px solid var(--panel-rule);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
  color: var(--text-muted);
}

.plate.on {
  border-color: var(--accent);
  background: var(--accent-faint);
  color: var(--text);
}

.plate.suspect {
  border-color: var(--warn);
  background: color-mix(in srgb, var(--warn) 12%, transparent);
}

.note {
  min-height: 1.3em;
  margin: 0;
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.caution {
  color: var(--warn);
}

.aside {
  color: var(--text-muted);
}
</style>
