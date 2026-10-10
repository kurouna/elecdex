<script lang="ts">
import {
  type ClusterTier,
  clusterLamps,
  clusterMessage,
  clusterTier,
  LANE_IDS,
  type LaneSecond,
  laneStats,
  recordSecond,
  showCores,
} from '@shared/cluster'
import type { QuakeState } from '@shared/quakes'
import { untrack } from 'svelte'
import { onBoundary } from '../../lib/frame-loop.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { awake } from '../../stores/awake.svelte.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import ClusterCard from './ClusterCard.svelte'
import CoreBars from './CoreBars.svelte'
import type { CardKey, CardReadings } from './cluster-cards.ts'
import {
  clockText,
  dateText,
  LANE_CELLS,
  laneFigure,
  laneSecond,
  type Readings,
  SLOT_KEYS,
  slotFigure,
  statText,
} from './cluster-view.ts'
import Figure from './Figure.svelte'
import Lamps from './Lamps.svelte'
import LaneChart from './LaneChart.svelte'

/**
 * CLUSTER: the machine on one pane, like a car's instrument cluster
 * (docs/cluster.md). The lamps and the message line, the clock and the date,
 * sixty seconds of six lanes, every core's load where there is room, and the
 * slots - all from the metric sources main already provides, the AWAKE store and
 * the quake list, so nothing outside this folder knows the pane is here.
 *
 * A reading is drawn the frame it arrives; the lanes step once per cpu.load
 * sample. Everything shown follows the readings only while the pane is seen; the
 * lanes' own history goes on behind a tab (the three sources it charts are
 * `keepWhileHidden`), so it has no gap when the pane comes back.
 */
const { visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))

/* ---- The lanes' history: a second per cpu.load sample ---- */

let history = $state.raw<readonly LaneSecond[]>([])
let lastAt = 0
let ioAt = 0
let pingAt = 0

const loadSample = $derived(metrics.sample('cpu.load'))

$effect(() => {
  const load = loadSample
  if (load === null || load.at <= lastAt) return
  lastAt = load.at
  untrack(() => {
    const mem = metrics.get('mem.usage')
    const net = metrics.get('net.throughput')
    // Disk I/O and the ping come less often: each goes in the second it arrived, once.
    const io = metrics.sample('disk.io')
    const ping = metrics.sample('net.ping')
    const ioNew = io !== null && io.at > ioAt
    const pingNew = ping !== null && ping.at > pingAt
    if (ioNew) ioAt = io.at
    if (pingNew) pingAt = ping.at
    history = recordSecond(
      history,
      laneSecond(load, { mem, net, io: ioNew ? io.data : null, ping: pingNew ? ping.data : null }),
    )
  })
})

/* ---- The clock, the quake list, the readings ---- */

let now = $state(Date.now())
$effect(() => {
  if (!visible) return
  now = Date.now()
  return onBoundary(1000, () => {
    now = Date.now()
  })
})

const quakeAlerts = $derived(appearance.settings.quakes.notify)
let quakes = $state.raw<QuakeState | null>(null)
$effect(() => {
  if (!visible || !quakeAlerts) return
  return window.elecdex.quakes.observe((state) => {
    quakes = state
  })
})

const readings = $derived.by((): Readings => {
  const uptime = metrics.sample('os.uptime')
  return {
    load: metrics.get('cpu.load'),
    mem: metrics.get('mem.usage'),
    net: metrics.get('net.throughput'),
    io: metrics.get('disk.io'),
    ping: metrics.get('net.ping'),
    link: metrics.get('net.interface'),
    swap: metrics.get('mem.swap'),
    volumes: metrics.get('disk.volumes'),
    conns: metrics.get('net.connections'),
    procs: metrics.get('proc.list'),
    battery: metrics.get('power.battery'),
    uptime: uptime === null ? null : uptime.data.seconds + Math.max(0, now - uptime.at) / 1000,
    awake: awake.state,
  }
})

/** Everything the pane writes, kept still while it is out of sight. */
const view = $derived.by(() => {
  const lamps = clusterLamps({
    history,
    link: readings.link,
    volumes: readings.volumes,
    battery: readings.battery,
    awake: readings.awake.level !== 'off',
    quakeAlerts,
    quakes,
    topProcess: readings.procs?.top[0]?.name ?? null,
    now,
  })
  const date = new Date(now)
  return {
    history,
    readings,
    lamps,
    message: clusterMessage(lamps),
    clock: clockText(date),
    date: dateText(date),
  }
})
let shown = $state.raw(untrack(() => view))
$effect(() => {
  const next = view
  if (visible) shown = next
})

/* ---- Its size: the tier, and whether the cores row goes in ---- */

let rootEl = $state<HTMLElement | null>(null)
let tier = $state<ClusterTier>('wide')
let cores = $state(false)

$effect(() => {
  const el = rootEl
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box === undefined || box.width <= 0) return
    const next = clusterTier(
      box.width,
      box.height,
      untrack(() => tier),
    )
    if (next !== untrack(() => tier)) tier = next
    const withCores = showCores(next, box.width, box.height)
    if (withCores !== untrack(() => cores)) cores = withCores
  })
  observer.observe(el)
  return () => observer.disconnect()
})

const small = $derived(tier === 'short' || tier === 'compact')
const stats = $derived(tier === 'wide')

/* ---- Detail cards ---- */

let hover = $state.raw<{ key: CardKey; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<CardKey>(() => (hover = null))

function cardFor(key: CardKey) {
  return (event: { box: DOMRect; x: number | null } | null): void => {
    if (event === null) {
      resting.leave(key)
      return
    }
    const show = (): void => {
      if (rootEl === null) return
      const pane = rootEl.getBoundingClientRect()
      hover = {
        key,
        anchor: anchorOf(pane, event.box, event.x),
        bounds: { width: pane.width, height: pane.height },
      }
    }
    resting.enter(key, show, event.x === null)
  }
}

$effect(() => {
  if (!visible) resting.leave()
})
$effect(() => () => resting.dispose())

const cardReadings = $derived.by(
  (): CardReadings => ({
    ...shown.readings,
    now,
    tier,
    history: shown.history,
    message: shown.message,
  }),
)
</script>

{#snippet slots(where: string)}
  <div class="slots {where}" data-testid="cluster-slots">
    {#each SLOT_KEYS as key (key)}
      {@const f = slotFigure(key, shown.readings)}
      <Figure {...f} onhover={cardFor(key)} testid="cluster-slot-{key}" />
    {/each}
  </div>
{/snippet}

<div
  bind:this={rootEl}
  class="cluster"
  data-tier={tier}
  data-cores={cores ? '' : undefined}
  data-testid="cluster"
>
  <div class="top">
    <Lamps
      lamps={shown.lamps}
      message={shown.message}
      wrap={tier !== 'wide'}
      onhover={cardFor('message')}
    />
    <div class="when">
      <Figure label="LOCAL TIME" value={shown.clock} size={small ? 'lg' : 'xl'} quiet={small} testid="cluster-clock" />
      <Figure
        label="DATE"
        value={shown.date.value}
        note={shown.date.note}
        word
        size="md"
        quiet={small}
        onhover={cardFor('date')}
        testid="cluster-date"
      />
      {#if tier === 'wide'}{@render slots('beside')}{/if}
    </div>
  </div>

  <div class="lanes">
    {#each LANE_IDS as lane (lane)}
      {@const f = laneFigure(lane, shown.readings)}
      <div class="lane" data-lane={lane}>
        <Figure {...f} note="" meter={null} size="md" cells={LANE_CELLS[lane]} onhover={cardFor(lane)} testid="cluster-figure-{lane}" />
        <div class="bars"><LaneChart {lane} history={shown.history} {visible} /></div>
        {#if stats}
          {@const s = laneStats(shown.history, lane)}
          <div class="stats">
            <Figure label="PEAK" {...statText(lane, s.peak)} size="xs" align="end" />
            <Figure label="AVG" {...statText(lane, s.average)} size="xs" align="end" />
          </div>
        {/if}
      </div>
      {#if lane === 'cpu' && cores}
        {@const all = shown.readings.load?.cores ?? []}
        {@const top = all.reduce((best, load, i) => (load > (all[best] ?? -1) ? i : best), 0)}
        <div class="lane cores-row">
          <Figure label="CORES" value={String(all.length)} unit="THREADS" size="md" onhover={cardFor('cores')} testid="cluster-cores-figure" />
          <div class="bars"><CoreBars cores={all} /></div>
          {#if stats}
            <div class="stats">
              <Figure label="BUSIEST" value={String(Math.round(all[top] ?? 0))} unit="% #{top}" size="xs" align="end" />
              <Figure label="OVER 85%" value={String(all.filter((load) => load >= 85).length)} unit="CORES" size="xs" align="end" />
            </div>
          {/if}
        </div>
      {/if}
    {/each}
    {#if tier === 'wide'}
      <div class="axis" aria-hidden="true">
        <span></span>
        <span class="ticks"><span>−60 s</span><span>−45</span><span>−30</span><span>−15</span><span>NOW</span></span>
        <span></span>
      </div>
    {/if}
  </div>

  {#if tier === 'medium' || tier === 'narrow'}{@render slots('below')}{/if}

  {#if hover !== null}
    <ClusterCard key={hover.key} readings={cardReadings} anchor={hover.anchor} bounds={hover.bounds} />
  {/if}
</div>

<style>
.cluster {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  height: 100%;
  min-height: 0;
  padding: 0.6rem 0.9rem;
  overflow: hidden;
}

.top {
  display: grid;
  gap: 0.6rem;
}

.when {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 1.75rem;
}

.when > :global(*) {
  flex: none;
}

.lanes {
  display: grid;
  grid-auto-rows: minmax(2.9rem, 1fr);
  gap: 0.4rem 1.4rem;
  min-height: 0;
}

.lane {
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr) 11.5rem;
  gap: 0.9rem;
  min-height: 0;
  padding-top: 0.35rem;
  border-top: 1px solid var(--panel-rule);
}

.lane > :global(.figure) {
  align-self: center;
}

.bars {
  position: relative;
  min-height: 1.1rem;
}

.bars > :global(*) {
  position: absolute;
  inset: 0;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  align-self: center;
}

.slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.4rem, 1fr));
  gap: 0.9rem 1.4rem;
  align-content: start;
}

.axis {
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr) 11.5rem;
  gap: 0.9rem;
  align-self: start;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.ticks {
  display: flex;
  justify-content: space-between;
  padding-top: 0.25rem;
  border-top: 1px solid var(--panel-rule);
}

/* ---- wide: the clock over the date, the slots beside them; lanes kept from swelling ---- */
[data-tier='wide'] {
  grid-template-rows: auto minmax(0, 1fr);
}

[data-tier='wide'] .when {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: end;
  gap: 0.4rem 2rem;
}

[data-tier='wide'] .when > :global(:nth-child(1)) {
  grid-area: 1 / 1;
}

[data-tier='wide'] .when > :global(:nth-child(2)) {
  grid-area: 2 / 1;
}

[data-tier='wide'] .slots.beside {
  grid-area: 1 / 2 / 3 / 3;
  grid-template-columns: repeat(4, minmax(6.9rem, 1fr));
  gap: 0.6rem 1.25rem;
  align-self: center;
  padding-left: 1.5rem;
  border-left: 1px solid var(--panel-rule);
}

/* Capped, so a tall pane gives lanes room without turning their bars into slabs. */
[data-tier='wide'] .lanes {
  grid-auto-rows: minmax(2.9rem, 5.5rem);
  align-content: start;
}

/* The cores row: two lane rows high, so its bars can be read. */
.cores-row {
  grid-row: span 2;
}

/* ---- medium: the slots below; peak and average go to the cards ---- */
[data-tier='medium'] .lane {
  grid-template-columns: 8.1rem minmax(0, 1fr);
}

/* ---- short: two columns of lanes, no slots ---- */
[data-tier='short'],
[data-tier='compact'] {
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.5rem;
  padding-block: 0.4rem;
}

[data-tier='short'] .lanes {
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: minmax(0, 1fr);
}

[data-tier='short'] .lane {
  grid-template-columns: 7rem minmax(0, 1fr);
  padding-top: 0.2rem;
}

/* ---- compact: one column of lanes, no slots ---- */
[data-tier='compact'] .lanes {
  grid-auto-rows: minmax(2.1rem, 1fr);
}

[data-tier='compact'] .lane {
  grid-template-columns: 6.5rem minmax(0, 1fr);
  padding-top: 0.2rem;
}

/* ---- narrow: a column that scrolls, each part at its own height ---- */
[data-tier='narrow'] {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

[data-tier='narrow'] > * {
  flex: none;
}

[data-tier='narrow'] .lanes {
  grid-auto-rows: 2.9rem;
}

[data-tier='narrow'] .lane {
  grid-template-columns: 6.5rem minmax(0, 1fr);
}
</style>
