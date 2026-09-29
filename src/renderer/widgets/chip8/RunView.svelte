<script lang="ts">
import type { Chip8Program, Chip8Slot } from '@shared/chip8-library'
import { afterBlink } from '../../lib/blink.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import CoreView from './CoreView.svelte'
import { haltLines } from './core.ts'
import Keypad from './Keypad.svelte'
import { PLATFORM_CHIPS } from './labels.ts'
import MemView from './MemView.svelte'
import type { Palette } from './palette.ts'
import { CHIP8_TABS, type Chip8Pane, type Chip8Tab, PANEL_WIDTH, panelShown } from './pane-state.ts'
import type { Chip8Runner } from './runner.svelte.ts'
import SaveView from './SaveView.svelte'
import Screen from './Screen.svelte'
import TuneView from './TuneView.svelte'

/**
 * The CHIP-8 pane running a program (docs/architecture.md section 5.18): a strip of what
 * runs and its lamps, the screen, and the side panel - the keypad over CORE, MEM, TUNE or SAVE - which
 * folds away when the pane is too narrow to leave the screen a fair size.
 */
interface Props {
  runner: Chip8Runner
  program: Chip8Program
  pane: Chip8Pane
  /** The panel as the pane or the settings want it. */
  panelWanted: boolean
  palette: Palette
  /** The pane has the keyboard: the KEYS lamp. */
  listening: boolean
  onback: () => void
  onreset: () => void
  onchange: (change: Partial<Chip8Pane>) => void
  /** Goes on from a kept machine; false when it could not be read. */
  onslot: (slot: Chip8Slot) => Promise<boolean>
}

const {
  runner,
  program,
  pane,
  panelWanted,
  palette,
  listening,
  onback,
  onreset,
  onchange,
  onslot,
}: Props = $props()

const TAB_LABELS: Record<Chip8Tab, string> = {
  core: 'core',
  mem: 'mem',
  tune: 'tune',
  save: 'save',
}

let scale = $state(0)
let body = $state<HTMLDivElement | null>(null)
/** The run view's body in CSS pixels, from the observer's entry. */
let room = $state({ w: 0, h: 0 })

$effect(() => {
  const el = body
  if (el === null) return
  const observer = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1]?.contentRect
    // Behind a tab the view measures nothing: kept as it was, so the panel does not fold away.
    if (box === undefined || box.width === 0 || box.height === 0) return
    if (box.width !== room.w || box.height !== room.h) room = { w: box.width, h: box.height }
  })
  observer.observe(el)
  return () => observer.disconnect()
})

/** Opened by hand while it had folded away for want of room: shown anyway, for this mount. */
let forced = $state(false)
const panelOpen = $derived(forced || panelShown(panelWanted, room))
const halt = $derived(runner.status === 'halted' ? (runner.machine?.state.halt ?? null) : null)
const haltText = $derived(halt === null ? null : haltLines(halt))

// A fault is heard as well as seen; a program that ends by itself is not.
$effect(() => {
  if (haltText?.fault) sfx.play('glitch')
})

function togglePanel(): void {
  const open = !panelOpen
  forced = false
  // Folded away for want of room while it is wanted: shown anyway, the screen gives way.
  if (open && panelWanted) forced = true
  else onchange({ panel: open })
  sfx.play(open ? 'expand' : 'collapse')
}

const scaleWords = $derived(
  scale > 0 ? (Number.isInteger(scale) ? `×${scale}` : `×${scale.toFixed(2)}`) : '',
)
</script>

<div class="run" data-testid="chip8-run" data-status={runner.status}>
  <div class="strip">
    <button
      type="button"
      class="c8-btn"
      onclick={(e) => afterBlink(e.currentTarget, onback)}
      data-testid="chip8-back">◂ library</button
    >
    <span class="title" title={program.title}>{program.title}</span>
    <span class="c8-chip plain" data-platform={program.platform}>{PLATFORM_CHIPS[program.platform]}</span>
    <span class="c8-chip plain" data-testid="chip8-resolution">{runner.hires ? 'HIRES' : 'LORES'}</span>
    <span class="c8-chip plain" data-testid="chip8-scale">{scaleWords}</span>
    <div class="lamps">
      <span class="lamp" class:on={runner.status === 'running'} class:warn={runner.status === 'paused'} class:bad={halt !== null && haltText?.fault}
        data-testid="chip8-lamp-run"
        >{runner.status === 'paused' ? 'pause' : runner.status === 'halted' ? 'halt' : 'run'}</span
      >
      <span class="lamp" class:on={runner.sounding && !pane.muted} data-testid="chip8-lamp-snd">snd</span>
      <span class="lamp" class:on={listening} data-testid="chip8-lamp-keys">keys</span>
    </div>
    <button
      type="button"
      class="c8-btn"
      disabled={runner.status === 'halted' || runner.status === 'empty'}
      onclick={() => runner.togglePause()}
      aria-label={runner.status === 'paused' ? 'resume' : 'pause'}
      data-testid="chip8-pause">{runner.status === 'paused' ? '▶' : '❚❚'}</button
    >
    <button type="button" class="c8-btn" onclick={(e) => afterBlink(e.currentTarget, onreset)} data-testid="chip8-reset"
      >reset</button
    >
    <button
      type="button"
      class="c8-btn"
      aria-expanded={panelOpen}
      onclick={togglePanel}
      data-testid="chip8-panel-toggle">{panelOpen ? 'panel ◂' : '▸ panel'}</button
    >
  </div>

  <div class="body" bind:this={body}>
    <div class="screen">
      <Screen
        {runner}
        {palette}
        glow={pane.phosphor}
        dots={pane.dots}
        mode={pane.scale}
        rotation={program.rotation}
        bind:scale
      />
      {#if runner.status === 'paused'}
        <div class="card crt-on" transition:crtPower data-testid="chip8-paused">
          <div class="big">paused</div>
          <div class="small">P resume · enter one frame</div>
        </div>
      {:else if haltText !== null}
        <div class="card crt-on" class:fault={haltText.fault} transition:crtPower data-testid="chip8-halt">
          <div class="big">{haltText.fault ? 'halt' : 'end'}</div>
          <div class="small">{haltText.title} · {haltText.detail}</div>
          {#if haltText.fault}
            <div class="hint">Not an instruction this machine knows: try another in TUNE, then reset.</div>
          {/if}
        </div>
      {/if}
    </div>

    {#if panelOpen}
      <aside class="panel crt-on" style:width="{PANEL_WIDTH}px" transition:crtPower data-testid="chip8-panel">
        <Keypad {runner} />
        <div class="tabs" role="tablist">
          {#each CHIP8_TABS as tab (tab)}
            <button
              type="button"
              class="tab"
              role="tab"
              aria-selected={pane.tab === tab}
              onclick={() => {
                if (pane.tab !== tab) sfx.play('panel')
                onchange({ tab })
              }}
              data-testid="chip8-tab"
              data-tab={tab}>{TAB_LABELS[tab]}</button
            >
          {/each}
        </div>
        <div class="pane-body">
          {#if pane.tab === 'core'}
            <CoreView {runner} />
          {:else if pane.tab === 'mem'}
            <MemView {runner} />
          {:else if pane.tab === 'tune'}
            <TuneView {runner} {program} {pane} hasOriginal={program.colours !== undefined} {onchange} />
          {:else}
            <SaveView {runner} {program} {palette} onload={onslot} />
          {/if}
        </div>
      </aside>
    {/if}
  </div>
</div>

<style>
.run {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
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
  text-transform: uppercase;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 16rem;
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
  font-family: var(--font-ui);
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

.screen {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.card {
  position: absolute;
  inset: 0;
  margin: auto;
  width: max-content;
  max-width: 90%;
  height: max-content;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--panel-border);
  background: color-mix(in srgb, var(--app-bg) 86%, transparent);
  text-align: center;
  pointer-events: none;
}

.card .big {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--step-2);
  letter-spacing: 0.4em;
  padding-left: 0.4em;
  text-transform: uppercase;
  color: var(--accent-strong);
}

.card.fault .big {
  color: var(--danger);
}

.card .small {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  text-transform: uppercase;
}

.card .hint {
  font-size: var(--step--1);
  color: var(--text-muted);
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
</style>
