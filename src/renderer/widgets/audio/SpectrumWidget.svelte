<script lang="ts">
import {
  BAND_SETS,
  bandsFromBins,
  emptyMeters,
  litSegments,
  type Meters,
  SPECTRUM_FPS,
  SPECTRUM_PATTERNS,
  SPECTRUM_STYLES,
  type SpectrumPrefs,
  type SpectrumUpdate,
  spectrumPrefs,
  stepMeters,
} from '@shared/audio'
import { untrack } from 'svelte'
import { appearance } from '../../stores/appearance.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import { type Palette, SpectrumPainter } from './spectrum-draw.ts'
import { whileVisible } from './while-visible.ts'

/**
 * A spectrum analyser of what the computer is playing, drawn like a car head
 * unit's display (spectrum-draw.ts).
 *
 * The levels come from the hidden capture window through main, only while this
 * pane is on screen (whileVisible): a pane in a background tab or a closed one
 * stops the capture. Frames arrive 20 times a second while there is sound
 * and stop soon after it ends, and the pane draws when a frame arrives - it has no
 * loop of its own, so a silent computer costs nothing. Its look, band count,
 * pattern and peak hold are pane state, chosen in its settings.
 */
const { paneId, state: paneState }: WidgetProps = $props()

const prefs = $derived(spectrumPrefs(paneState))
let settingsOpen = $state(false)
let status = $state<'starting' | 'running' | 'unsupported' | 'failed'>('starting')
let message = $state<string | null>(null)
/** Whether frames have come in lately: sound is playing, or has just stopped. */
let hearing = $state(false)

let host = $state<HTMLDivElement | null>(null)
let canvas = $state<HTMLCanvasElement | null>(null)
let meters: Meters = emptyMeters(BAND_SETS[10].length)
const painter = new SpectrumPainter()
let palette: Palette = { accent: '#aacfd1', label: 'rgba(170, 207, 209, 0.5)' }
let lastFrameAt = 0
let frameCount = 0
let quietTimer: ReturnType<typeof setTimeout> | undefined

const STYLE_LABELS: Record<(typeof SPECTRUM_STYLES)[number], string> = {
  'vfd-cyan': 'VFD cyan',
  'vfd-amber': 'VFD amber',
  led: 'LED',
  accent: 'theme',
}

/** Draws the meters; `force` also when no segment changed (a new look, size or theme). */
function draw(force = false): void {
  if (!canvas) return
  painter.paint(canvas, meters, prefs, palette, force)
  // For tests and for anyone inspecting: the lit segments per band, now and then.
  if (frameCount % 5 === 0) {
    canvas.dataset.lit = meters.level.map((level) => litSegments(level, 20)).join(',')
  }
}

function onUpdate(update: SpectrumUpdate): void {
  if (update.t === 'status') {
    status = update.status
    message = update.message
    return
  }
  status = 'running'
  const now = performance.now()
  const dt = lastFrameAt === 0 ? 1 / SPECTRUM_FPS : Math.min(0.1, (now - lastFrameAt) / 1000)
  lastFrameAt = now
  frameCount += 1
  meters = stepMeters(meters, bandsFromBins(update.bins, prefs.bands), dt)
  hearing = true
  clearTimeout(quietTimer)
  quietTimer = setTimeout(() => {
    hearing = false
    lastFrameAt = 0
  }, 1000)
  // With motion reduced, every other frame: the levels, without the flicker.
  if (!appearance.reducedMotion || frameCount % 2 === 0) draw()
}

$effect(() => {
  if (!host) return
  return whileVisible(host, () => {
    const off = window.elecdex.audio.spectrum(onUpdate)
    return () => {
      off()
      clearTimeout(quietTimer)
      hearing = false
      lastFrameAt = 0
      meters = emptyMeters(meters.level.length)
      untrack(() => draw())
    }
  })
})

// Theme colours are read once per theme change, not per frame.
$effect(() => {
  void appearance.revision
  if (!host) return
  const style = getComputedStyle(host)
  palette = {
    accent: style.getPropertyValue('--accent').trim() || palette.accent,
    label: style.getPropertyValue('--text-muted').trim() || palette.label,
  }
  untrack(() => draw(true))
})

// A change of look or band count shows at once, sound or not.
$effect(() => {
  const { bands } = prefs
  untrack(() => {
    if (meters.level.length !== BAND_SETS[bands].length)
      meters = emptyMeters(BAND_SETS[bands].length)
    draw(true)
  })
})

$effect(() => {
  if (!canvas) return
  const observer = new ResizeObserver(() => draw(true))
  observer.observe(canvas)
  return () => observer.disconnect()
})

$effect(() => {
  paneMeta.set(paneId, { subtitle: `system output · ${prefs.bands} bands` })
})

function save(change: Partial<SpectrumPrefs>): void {
  layout.setPaneState(paneId, { ...paneState, ...change })
}

const note = $derived.by(() => {
  if (status === 'starting') return 'starting capture…'
  if (status === 'unsupported') return 'System audio capture is not available on this platform yet.'
  if (status === 'failed') return `Could not capture system audio${message ? `: ${message}` : '.'}`
  return hearing ? null : 'no sound'
})
</script>

<div
  class="spectrum"
  bind:this={host}
  data-testid="spectrum"
  data-status={status}
  data-style={prefs.style}
  data-bands={prefs.bands}
  data-pattern={prefs.pattern}
>
  <SettingsButton
    open={settingsOpen}
    label="spectrum settings"
    testid="spectrum-settings-toggle"
    ontoggle={() => (settingsOpen = !settingsOpen)}
  />

  {#if settingsOpen}
    <div class="settings" data-testid="spectrum-settings">
      <div class="group" role="radiogroup" aria-label="Style">
        <span>style</span>
        {#each SPECTRUM_STYLES as style (style)}
          <button
            type="button"
            role="radio"
            aria-checked={prefs.style === style}
            onclick={() => save({ style })}
            data-testid="spectrum-style"
            data-value={style}>{STYLE_LABELS[style]}</button
          >
        {/each}
      </div>
      <div class="group" role="radiogroup" aria-label="Bands">
        <span>bands</span>
        {#each [7, 10, 16] as const as bands (bands)}
          <button
            type="button"
            role="radio"
            aria-checked={prefs.bands === bands}
            onclick={() => save({ bands })}
            data-testid="spectrum-bands"
            data-value={bands}>{bands}</button
          >
        {/each}
      </div>
      <div class="group" role="radiogroup" aria-label="Pattern">
        <span>pattern</span>
        {#each SPECTRUM_PATTERNS as pattern (pattern)}
          <button
            type="button"
            role="radio"
            aria-checked={prefs.pattern === pattern}
            onclick={() => save({ pattern })}
            data-testid="spectrum-pattern"
            data-value={pattern}>{pattern}</button
          >
        {/each}
      </div>
      <label class="group">
        <span>peak hold</span>
        <input
          type="checkbox"
          checked={prefs.peakHold}
          onchange={(e) => save({ peakHold: e.currentTarget.checked })}
          data-testid="spectrum-peak-hold"
        />
      </label>
    </div>
  {/if}

  <div class="display">
    <canvas bind:this={canvas} aria-label="Spectrum of the system's sound" data-testid="spectrum-canvas"></canvas>
    {#if note}
      <p class="note" class:problem={status === 'failed' || status === 'unsupported'} data-testid="spectrum-note">
        {note}
      </p>
    {/if}
  </div>
</div>

<style>
.spectrum {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
  font-family: var(--font-ui);
}

.settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
  margin-right: 1.6rem;
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
  font-size: var(--step--1);
  text-transform: uppercase;
}

.group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.group > span {
  margin-right: var(--space-1);
  color: var(--text-muted);
}

.group button {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.group button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.group button[aria-checked='true'] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.group input {
  margin: 0;
  accent-color: var(--accent);
}

.display {
  position: relative;
  flex: 1;
  min-height: 0;
  /* Clear of the settings button when the settings are closed. */
  margin-top: 1.2rem;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.note {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  margin: 0;
  font-size: var(--step--1);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  pointer-events: none;
}

.note.problem {
  right: var(--space-2);
  color: var(--warn);
  text-transform: none;
  letter-spacing: 0;
}
</style>
