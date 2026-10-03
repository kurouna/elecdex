<script lang="ts">
import { MODELS, type ModelId } from '@shared/elec16/map'
import { romFromFile } from '@shared/elec16/rom'
import { parseRgb } from '@shared/qr'
import { onDestroy, untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { POWER_OFF_MS } from '../../lib/crt-motion.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import CoreView from './CoreView.svelte'
import { labelsOf } from './core.ts'
import Device from './Device.svelte'
import type { LcdColours, Rgb } from './lcd-painter.ts'
import MemView from './MemView.svelte'
import {
  ELEC16_TABS,
  type Elec16Pane,
  hzOf,
  PANEL_WIDTH,
  panelShown,
  readElec16Pane,
} from './pane-state.ts'
import { claim, park } from './park.ts'
import { pcKeyFate } from './pc-keys.ts'
import { browserElec16Host, Elec16Runner } from './runner.svelte.ts'
import { SKINS } from './skins.ts'
import TuneView from './TuneView.svelte'

/**
 * The ELEC-16 pane (docs/elec16.md): a pocket computer of elecdex's own, its machine-code
 * monitor in ROM. This component only wires: the machine is shared/elec16, its clock the
 * runner on the timed loop, its picture the LCD; the pane's choices are its pane state.
 *
 * It gives the machine the keyboard while the pane itself has the focus - a press on one of
 * its buttons or keys hands the focus back - and never a key held with Ctrl, Alt or the
 * system key, nor Tab, Escape or a function key (pc-keys.ts). Moved in the layout, its
 * machine waits in park.ts for the new mount; out of sight, it pauses, and comes back by
 * itself when it was only waiting at its prompt. Its memory is kept across a reload only
 * from phase 4 (units and the battery backup are main's).
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const pane = $derived(readElec16Pane(paneState))
const skin = $derived(SKINS[pane.skin])

const runner = new Elec16Runner(browserElec16Host)

let root = $state<HTMLDivElement | null>(null)
let paneFocused = $state(false)
let windowFocused = $state(document.hasFocus())
let rom = $state.raw<Uint8Array | null>(null)
let labels = $state.raw<ReadonlyMap<number, string>>(new Map())
let failed = $state(false)

const listening = $derived(paneFocused && windowFocused && runner.status !== 'empty')

function change(next: Partial<Elec16Pane>): void {
  widgetState.patch(paneId, next)
}

// The ROM comes with the page, in a chunk of its own, the first time a pane needs it.
void import('./rom.json').then(
  (file) => {
    const image = romFromFile(file.default)
    if (image === null) failed = true
    rom = image
    labels = labelsOf(file.default.symbols)
  },
  () => {
    failed = true
  },
)

// Once the ROM is here: take up the machine a moved pane left behind, or switch one on.
let started = false
$effect(() => {
  const image = rom
  if (started || image === null) return
  started = true
  untrack(() => {
    const parked = claim(paneId)
    if (parked !== null && parked.machine.state.model === pane.model) {
      runner.adopt(parked.machine, hzOf(pane.clock), parked.paused)
    } else {
      runner.boot(image, pane.model, hzOf(pane.clock))
    }
  })
})

$effect(() => {
  runner.setHz(hzOf(pane.clock))
})

$effect(() => {
  runner.setSeen(visible)
})

/** PC keys held, by their code, with the machine key each pressed. */
const held = new Map<string, number>()

// The keyboard left: every key goes up, as no key-up will come.
$effect(() => {
  if (listening) return
  untrack(() => {
    held.clear()
    runner.releaseAll()
  })
})

function onkeydown(event: KeyboardEvent): void {
  if (event.target !== root || !listening) return
  const fate = pcKeyFate(event)
  if (fate.kind === 'pass') return
  event.preventDefault()
  if (fate.kind === 'brk') {
    runner.brk()
    return
  }
  held.set(event.code, fate.code)
  runner.down(fate.code, fate.shift)
}

function onkeyup(event: KeyboardEvent): void {
  // A key goes up whatever else is held by then: the machine must never keep one down.
  const code = held.get(event.code)
  if (code === undefined) return
  held.delete(event.code)
  event.preventDefault()
  runner.release(code)
}

/** A press on one of the pane's buttons or keys gives the keyboard back to the machine. */
function onpointerup(event: PointerEvent): void {
  const target = event.target as HTMLElement | null
  if (target === null || target.closest('input, select, textarea') !== null) return
  queueMicrotask(() => root?.focus({ preventScroll: true }))
}

/** Another LCD: the machine restarts on it, its RAM kept. */
function fitModel(model: ModelId): void {
  change({ model })
  const image = rom
  if (image === null) return
  const ram = runner.machine?.state.ram.slice()
  runner.boot(image, model, hzOf(pane.clock), ram)
}

let body = $state<HTMLDivElement | null>(null)
let room = $state({ w: 0, h: 0 })
$effect(() => {
  const el = body
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1]?.contentRect
    if (box === undefined || box.width === 0 || box.height === 0) return
    if (box.width !== room.w || box.height !== room.h) room = { w: box.width, h: box.height }
  })
  observer.observe(el)
  return () => observer.disconnect()
})
/** Opened by hand while it had folded away for want of room: shown anyway, for this mount. */
let forced = $state(false)
const panelOpen = $derived(forced || panelShown(pane.panel, room, MODELS[pane.model].width))

function togglePanel(): void {
  const open = !panelOpen
  forced = false
  if (open && pane.panel) forced = true
  else change({ panel: open })
  sfx.play(open ? 'expand' : 'collapse')
}

// The LCD's colours: the skin's, through the theme where the skin follows it, read again
// when either changes.
let lcdColours = $state.raw<LcdColours>({
  ground: [0, 0, 0],
  dot: [255, 255, 255],
  shadow: [40, 40, 40],
})
$effect(() => {
  void appearance.revision
  const el = root
  const wanted = skin.lcd
  if (el === null) return
  const probe = document.createElement('canvas').getContext('2d')
  const read = (css: string, fallback: Rgb): Rgb => {
    el.style.setProperty('--e16-probe', css)
    const value = getComputedStyle(el).getPropertyValue('--e16-probe').trim()
    el.style.removeProperty('--e16-probe')
    if (probe === null || value === '') return fallback
    probe.fillStyle = '#000'
    probe.fillStyle = value
    return parseRgb(String(probe.fillStyle)) ?? fallback
  }
  lcdColours = {
    ground: read(wanted.ground, [0, 0, 0]),
    dot: read(wanted.dot, [255, 255, 255]),
    shadow: read(wanted.shadow, [40, 40, 40]),
  }
})

const lamp = $derived.by((): { word: string; kind: 'on' | 'warn' | 'bad' | 'idle' } => {
  if (runner.off) return { word: 'off', kind: 'idle' }
  if (runner.status === 'halted') return { word: 'halt', kind: 'bad' }
  if (runner.status === 'paused') return { word: 'pause', kind: 'warn' }
  if (runner.asleep) return { word: 'sleep', kind: 'idle' }
  return { word: 'run', kind: runner.status === 'running' ? 'on' : 'idle' }
})

$effect(() => {
  const status = runner.status
  const off = runner.off
  paneMeta.set(paneId, {
    subtitle: MODELS[pane.model].id,
    ...(status === 'running' && !off ? { badge: 'on', badgeKind: 'ok' as const } : {}),
    ...(status === 'paused' ? { badge: 'paused', badgeKind: 'warn' as const } : {}),
    ...(status === 'halted' && !off ? { badge: 'halted', badgeKind: 'danger' as const } : {}),
  })
})

onDestroy(() => {
  const paused = runner.pausedBy === 'player'
  const machine = runner.detach()
  // Parked at once, before the new mount (a moved pane) looks for it.
  if (machine !== null) park(paneId, { machine, paused })
  runner.dispose()
})
</script>

<svelte:window
  onblur={() => {
    windowFocused = false
  }}
  onfocus={() => (windowFocused = true)}
/>

<!-- The pane takes keys while it has the focus, as a game's field does: role application. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="elec16"
  class:listening
  bind:this={root}
  tabindex="0"
  role="application"
  aria-label="ELEC-16: takes the keys you press while it has the focus"
  onfocus={() => (paneFocused = true)}
  onblur={() => (paneFocused = false)}
  {onkeydown}
  {onkeyup}
  {onpointerup}
  data-testid="elec16"
  data-status={runner.status}
  data-asleep={runner.asleep}
>
  <div class="strip">
    <span class="e16-chip plain" data-testid="elec16-clock-chip"
      >{pane.clock === 'max' ? 'MAX' : `${pane.clock} MHz`}</span
    >
    <div class="lamps">
      <span class="lamp {lamp.kind}" data-testid="elec16-lamp-cpu" data-lamp={lamp.word}>{lamp.word}</span>
      <span class="lamp" class:on={listening} data-testid="elec16-lamp-keys">keys</span>
    </div>
    <button
      type="button"
      class="e16-btn"
      disabled={runner.status === 'empty' || runner.off || runner.status === 'halted'}
      onclick={() => runner.togglePause()}
      aria-label={runner.status === 'paused' ? 'resume' : 'pause'}
      data-testid="elec16-pause">{runner.status === 'paused' ? '▶' : '❚❚'}</button
    >
    <button type="button" class="e16-btn" onclick={(e) => afterBlink(e.currentTarget, () => runner.brk())} data-testid="elec16-brk"
      >brk</button
    >
    <button
      type="button"
      class="e16-btn"
      aria-pressed={!runner.off}
      onclick={(e) => afterBlink(e.currentTarget, () => runner.power())}
      data-testid="elec16-power">power</button
    >
    <button type="button" class="e16-btn" aria-expanded={panelOpen} onclick={togglePanel} data-testid="elec16-panel-toggle"
      >{panelOpen ? 'panel ◂' : '▸ panel'}</button
    >
  </div>

  <div class="body" bind:this={body}>
    <div class="device">
      {#if failed}
        <p class="failed" data-testid="elec16-failed">The ROM could not be read.</p>
      {:else if runner.status !== 'empty'}
        <div class="view crt-on" style:--crt-delay="{POWER_OFF_MS}ms" transition:crtPower>
          <Device
            {runner}
            {skin}
            {lcdColours}
            mode={pane.body}
            ghost={pane.ghost}
            contrast={pane.contrast}
            seen={visible}
          />
        </div>
      {/if}
    </div>
    {#if panelOpen}
      <aside class="panel crt-on" style:width="{PANEL_WIDTH}px" transition:crtPower data-testid="elec16-panel">
        <div class="tabs" role="tablist">
          {#each ELEC16_TABS as tab (tab)}
            <button
              type="button"
              class="tab"
              role="tab"
              aria-selected={pane.tab === tab}
              onclick={() => {
                if (pane.tab !== tab) sfx.play('panel')
                change({ tab })
              }}
              data-testid="elec16-tab"
              data-tab={tab}>{tab}</button
            >
          {/each}
        </div>
        <div class="pane-body">
          {#if pane.tab === 'core'}
            <CoreView {runner} {labels} />
          {:else if pane.tab === 'mem'}
            <MemView {runner} />
          {:else}
            <TuneView {pane} onchange={change} onmodel={fitModel} />
          {/if}
        </div>
      </aside>
    {/if}
  </div>
</div>

<style>
.elec16 {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  outline: none;
  font-family: var(--font-ui);
  transition: box-shadow var(--dur-panel, 120ms) linear;
}

/* The pane has the keyboard: a hairline round it, as a plugin pane taking keys has. */
.elec16.listening {
  box-shadow: inset 0 0 0 1px var(--accent-dim);
}

.strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);
}

.title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--step-0);
  letter-spacing: var(--tracking-wide);
  color: var(--text);
}

.lamps {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.lamp {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.lamp::before {
  content: '';
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  border: 1px solid var(--panel-rule);
}

.lamp.on {
  color: var(--text);
}

.lamp.on::before {
  background: var(--ok);
  border-color: var(--ok);
}

.lamp.warn::before {
  background: var(--warn);
  border-color: var(--warn);
}

.lamp.bad::before {
  background: var(--danger);
  border-color: var(--danger);
}

.body {
  flex: 1;
  display: flex;
  gap: var(--space-2);
  min-height: 0;
}

.device {
  position: relative;
  flex: 1;
  display: grid;
  min-width: 0;
  min-height: 0;
}

.view {
  grid-area: 1 / 1;
  min-width: 0;
  min-height: 0;
}

.failed {
  margin: auto;
  font-size: var(--step--1);
  color: var(--danger);
}

.panel {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 0;
  padding-left: var(--space-2);
  border-left: 1px solid var(--panel-rule);
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--panel-rule);
}

.tab {
  position: relative;
  border: 0;
  background: none;
  padding: 1px var(--space-2) 2px;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
}

.tab[aria-selected='true'] {
  color: var(--accent-strong);
}

.tab[aria-selected='true']::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
}

.pane-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
}

/* The pane's buttons and chips, as CHIP-8's. A press blinks on the launcher's 100 ms beat. */
.elec16 :global(.e16-btn) {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--accent);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0 var(--space-2);
  cursor: pointer;
  white-space: nowrap;
}

.elec16 :global(.e16-btn:hover:not(:disabled)) {
  border-color: var(--panel-border);
  background: var(--accent-faint);
}

.elec16 :global(.e16-btn:disabled) {
  opacity: 0.4;
  cursor: default;
}

.elec16 :global(.e16-chip) {
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  line-height: 1.5;
  padding: 0 0.4em;
  white-space: nowrap;
  cursor: pointer;
}

.elec16 :global(.e16-chip.plain) {
  color: var(--accent);
  cursor: default;
}

.elec16 :global(.e16-chip[aria-pressed='true']),
.elec16 :global(.e16-chip[aria-checked='true']) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.elec16 :global(.e16-chip:disabled) {
  opacity: 0.4;
  cursor: default;
}

.elec16 :global(:is(.e16-btn, .e16-chip:not(.plain), .tab):active),
.elec16 :global(.blinking) {
  animation: e16-press 100ms linear infinite;
  animation-play-state: var(--ambient-play-state);
}

@keyframes -global-e16-press {
  50% {
    background: var(--accent);
    color: var(--text-inverse);
    border-color: var(--accent);
  }
}
</style>
