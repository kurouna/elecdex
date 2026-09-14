<script lang="ts">
import {
  EMPTY_MIXER,
  emptyMeters,
  type Meters,
  type MixerChannel,
  type MixerCommand,
  type MixerState,
  type MixerUpdate,
  stepMeters,
} from '@shared/audio'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import { MeterPainter } from './spectrum-draw.ts'
import { whileVisible } from './while-visible.ts'

/**
 * The system mixer: the output's master volume and mute, then each app playing
 * sound, as a strip with a fader, a mute button and a peak meter.
 *
 * Read and changed through main (main/audio), only while this pane is on screen.
 * What a platform cannot do is left out rather than shown disabled: macOS has the
 * master only, and only Windows reports peaks for the meters. A fader being
 * dragged keeps its own position; the readings that come in meanwhile do not move
 * it under the pointer.
 */
const { paneId }: WidgetProps = $props()

let mixer = $state.raw<MixerState>(EMPTY_MIXER)
let connected = $state(false)
let hasPeaks = $state(false)
let host = $state<HTMLDivElement | null>(null)
/** The channel whose fader is held, and its value under the pointer. */
let held = $state<{ id: string; volume: number } | null>(null)

const meterCanvases = new Map<string, { canvas: HTMLCanvasElement; painter: MeterPainter }>()
let meters = new Map<string, Meters>()
let lastPeaksAt = 0

const channels = $derived([...(mixer.master ? [mixer.master] : []), ...mixer.apps])

function onUpdate(update: MixerUpdate): void {
  connected = true
  if (update.t === 'state') {
    mixer = update.state
    return
  }
  hasPeaks = true
  const now = performance.now()
  const dt = lastPeaksAt === 0 ? 0.1 : Math.min(0.3, (now - lastPeaksAt) / 1000)
  lastPeaksAt = now
  const next = new Map<string, Meters>()
  for (const [id, peak] of Object.entries(update.peaks)) {
    // Meter a peak on a square-root scale, so quiet sound still shows.
    next.set(id, stepMeters(meters.get(id) ?? emptyMeters(1), [Math.sqrt(peak)], dt))
  }
  meters = next
  for (const [id, { canvas, painter }] of meterCanvases) {
    const m = meters.get(id)
    painter.paint(canvas, m?.level[0] ?? 0, m?.peak[0] ?? 0)
  }
}

$effect(() => {
  if (!host) return
  return whileVisible(host, () => {
    const off = window.elecdex.audio.mixer(onUpdate)
    return () => {
      off()
      meters = new Map()
      lastPeaksAt = 0
    }
  })
})

$effect(() => {
  const count = mixer.apps.length
  paneMeta.set(paneId, {
    subtitle: [
      mixer.device,
      mixer.support === 'full' ? `${count} ${count === 1 ? 'app' : 'apps'}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    ...(mixer.error ? { badge: 'error', badgeKind: 'warn' as const } : {}),
  })
})

/** Sends changes at most every 50 ms while a fader moves, and always the last one. */
let pendingVolume: MixerCommand | null = null
let volumeTimer: ReturnType<typeof setTimeout> | null = null
function sendVolume(id: string, volume: number, final = false): void {
  pendingVolume = { t: 'volume', id, volume }
  const flush = () => {
    volumeTimer = null
    if (pendingVolume) window.elecdex.audio.mixerCommand(pendingVolume)
    pendingVolume = null
  }
  if (final) {
    if (volumeTimer) clearTimeout(volumeTimer)
    flush()
  } else {
    volumeTimer ??= setTimeout(flush, 50)
  }
}

// A change still waiting when the pane goes would be sent for a pane no longer there.
$effect(() => () => {
  if (volumeTimer) clearTimeout(volumeTimer)
  volumeTimer = null
  pendingVolume = null
})

const shownVolume = (channel: MixerChannel) =>
  held?.id === channel.id ? held.volume : channel.volume

/**
 * Registers a strip's meter canvas while it exists, drawn at its current level. The
 * attachment runs again whenever the mixer's state changes (every second): drawing
 * it empty then blanked every meter until the next peak reading, a visible flicker.
 */
function meter(id: string) {
  return (canvas: HTMLCanvasElement) => {
    const painter = new MeterPainter()
    meterCanvases.set(id, { canvas, painter })
    const current = meters.get(id)
    painter.paint(canvas, current?.level[0] ?? 0, current?.peak[0] ?? 0, true)
    return () => meterCanvases.delete(id)
  }
}

const note = $derived.by(() => {
  if (!connected) return 'reading the mixer…'
  if (mixer.error) return mixer.error
  if (mixer.support === 'none') return 'The system volume cannot be read here.'
  return null
})
</script>

<div class="mixer" bind:this={host} data-testid="mixer" data-support={mixer.support}>
  {#if note}
    <p class="note" class:problem={mixer.error !== null} data-testid="mixer-note">{note}</p>
  {/if}
  <div class="strips">
    {#each channels as channel (channel.id)}
      {@const volume = shownVolume(channel)}
      <div
        class="strip"
        class:master={channel.id === 'master'}
        class:muted={channel.muted}
        data-testid="mixer-strip"
        data-channel={channel.id}
      >
        <div class="who" title={channel.name}>{channel.name}</div>
        <div class="fader-row">
          {#if hasPeaks}
            <canvas class="meter" aria-hidden="true" {@attach meter(channel.id)}></canvas>
          {/if}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(volume * 100)}
            style:--fill={`${Math.round(volume * 100)}%`}
            aria-label={`${channel.name} volume`}
            oninput={(e) => {
              const value = Number(e.currentTarget.value) / 100
              held = { id: channel.id, volume: value }
              sendVolume(channel.id, value)
            }}
            onchange={(e) => {
              sendVolume(channel.id, Number(e.currentTarget.value) / 100, true)
              held = null
            }}
            data-testid="mixer-fader"
          />
        </div>
        <div class="value" data-testid="mixer-value">
          {channel.muted ? 'MUTE' : `${Math.round(volume * 100)}%`}
        </div>
        <button
          type="button"
          class="mute"
          aria-pressed={channel.muted}
          onclick={() => window.elecdex.audio.mixerCommand({ t: 'mute', id: channel.id, muted: !channel.muted })}
          data-testid="mixer-mute">mute</button
        >
      </div>
    {/each}
  </div>
</div>

<style>
.mixer {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) var(--space-1);
  font-family: var(--font-ui);
}

.note {
  margin: 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.note.problem {
  color: var(--warn);
}

.strips {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(4.2rem, 1fr);
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.strip {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  justify-items: center;
  gap: var(--space-1);
  min-height: 0;
  padding: var(--space-1);
  border: 1px solid var(--panel-rule);
}

.strip.master {
  border-color: var(--panel-border);
  background: linear-gradient(to bottom, var(--accent-faint), transparent 60%);
}

.who {
  width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text);
}

.strip.master .who {
  color: var(--accent-strong);
  font-weight: 700;
}

.fader-row {
  display: flex;
  gap: var(--space-1);
  align-items: stretch;
  min-height: 0;
  height: 100%;
}

.meter {
  width: 0.55rem;
  height: 100%;
}

/* A fader: a vertical slot with a cap, filled to its value in the accent. */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width: 1.4rem;
  height: 100%;
  min-height: 3rem;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

input[type='range']::-webkit-slider-runnable-track {
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(to top, var(--accent) var(--fill), var(--accent-faint) var(--fill));
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 1.4rem;
  height: 0.75rem;
  margin-left: calc(-0.7rem + 2px);
  border: 1px solid var(--app-bg);
  background: linear-gradient(var(--accent-strong), var(--accent) 45%, var(--accent-dim) 55%, var(--accent));
}

input[type='range']:focus-visible {
  outline: 1px solid var(--accent-strong);
  outline-offset: 2px;
}

.value {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.strip.muted .value,
.strip.muted .who {
  color: var(--text-muted);
}

.mute {
  width: 100%;
  padding: 0;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.mute:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.mute[aria-pressed='true'] {
  border-color: var(--danger);
  background: var(--danger);
  color: var(--text-inverse);
  font-weight: 700;
}
</style>
