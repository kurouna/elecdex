<script lang="ts">
import { DEFAULT_MODEL, MODELS } from '@shared/elec16/map'
import { pasteKeys } from '@shared/elec16/paste'
import { romFromFile } from '@shared/elec16/rom'
import { parseRgb } from '@shared/qr'
import { onDestroy, tick, untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { POWER_OFF_MS } from '../../lib/crt-motion.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { onFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import { watchRoom } from '../emu/screen.ts'
import type { WidgetProps } from '../registry.ts'
import { Elec16Buzzer } from './buzzer.ts'
import CodeView from './CodeView.svelte'
import CoreView from './CoreView.svelte'
import { type CodeTaker, giveCode as giveTo, typeAtBasic } from './code/give.ts'
import { labelsOf } from './core.ts'
import Device from './Device.svelte'
import FilesView from './FilesView.svelte'
import GamesView from './GamesView.svelte'
import LinkView from './LinkView.svelte'
import type { LcdColours, Rgb } from './lcd-painter.ts'
import MemView from './MemView.svelte'
import PlayDevice from './PlayDevice.svelte'
import PlayScreen from './PlayScreen.svelte'
import {
  ELEC16_TABS,
  type Elec16Pane,
  PANEL_WIDTH,
  panelShown,
  readElec16Pane,
} from './pane-state.ts'
import { claim, park } from './park.ts'
import { kanaLit, pasteModes, pcKeyFate } from './pc-keys.ts'
import { gamepadBits, playKeyFate } from './play-input.ts'
import { browserElec16Host, Elec16Runner } from './runner.svelte.ts'
import { SKINS } from './skins.ts'
import TuneView from './TuneView.svelte'
import { type Elec16Roms, UnitSession } from './unit-session.svelte.ts'

/**
 * The ELEC-16 pane (docs/elec16.md): a pocket computer of elecdex's own, its machine-code
 * monitor in ROM. This component only wires: the machine is shared/elec16, its clock the
 * runner on the timed loop, its picture the LCD; the pane's choices are its pane state.
 *
 * It gives the machine the keyboard while the pane itself has the focus - a press on one of
 * its buttons or keys hands the focus back - and never a key held with Ctrl, Alt or the
 * system key, nor Tab, Escape or a function key (pc-keys.ts). Moved in the layout, its
 * machine waits in park.ts for the new mount; out of sight, it pauses, and comes back by
 * itself when it was only waiting at its prompt. The machine is a unit's, which main keeps
 * (unit-session.svelte.ts): its battery backup is written when the pane goes out of sight,
 * the machine is switched off, the page is put away, or the pane lets the unit go.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const pane = $derived(readElec16Pane(paneState, appearance.settings.elec16.skin))
const skin = $derived(SKINS[pane.skin])

const buzzer = new Elec16Buzzer({
  enabled: () => appearance.settings.sound.enabled,
  volume: () => appearance.settings.elec16.volume,
})
const runner = new Elec16Runner({
  ...browserElec16Host,
  buzz: (freq, ms, mark) => buzzer.play(freq, ms, mark),
  hush: () => buzzer.silence(),
})
// A pane's id is its mount's for good (a moved pane is mounted again): the session takes it once.
const session = new UnitSession(
  window.elecdex.elec16,
  untrack(() => paneId),
  runner,
  {
    keep: (unit) => {
      if (unit !== pane.unit) change({ unit })
    },
  },
)
const model = $derived(session.unit?.model ?? DEFAULT_MODEL)
// Auto power-off is the unit's; switched off by it, the battery backup is written as for the
// switch.
runner.onAutoOff = () => session.save()
$effect(() => {
  runner.autoOffMs = (session.unit?.autoOff ?? 0) * 60_000
})

let root = $state<HTMLDivElement | null>(null)
let paneFocused = $state(false)
let windowFocused = $state(document.hasFocus())
let roms = $state.raw<Elec16Roms | null>(null)
/** The pocket ROM: CODE measures on it (the same CPU on every model). */
const rom = $derived(roms?.pocket ?? null)
let symbols = $state.raw<Readonly<Record<'pocket' | 'play', Readonly<Record<string, number>>>>>({
  pocket: {},
  play: {},
})
let failed = $state(false)
/** PLAY-320 (docs/elec16-play.md): the PLAY ROM, its screen alone until G3, no keys, no FILES. */
const play = $derived(MODELS[runner.model].rom === 'play')
/** CORE names code by the labels of the ROM the machine runs. */
const labels = $derived(labelsOf(symbols[MODELS[runner.model].rom]))
/** FILES (the card and BASIC) on the pocket models, GAMES (the cartridge shelf) on PLAY-320. */
const tabs = $derived(ELEC16_TABS.filter((t) => t !== (play ? 'files' : 'games')))
const tab = $derived(tabs.includes(pane.tab) ? pane.tab : 'tune')

const listening = $derived(
  paneFocused && windowFocused && runner.status !== 'empty' && pane.view === 'machine',
)

function change(next: Partial<Elec16Pane>): void {
  widgetState.patch(paneId, next)
}

// The ROMs come with the page, in chunks of their own, the first time a pane needs them: the
// pocket ROM and the PLAY ROM, so a unit can be moved between the two in TUNE.
void Promise.all([import('./rom.json'), import('./play-rom.json')]).then(
  ([pocket, playFile]) => {
    const images = { pocket: romFromFile(pocket.default), play: romFromFile(playFile.default) }
    if (images.pocket === null || images.play === null) {
      failed = true
      return
    }
    symbols = { pocket: pocket.default.symbols, play: playFile.default.symbols }
    roms = { pocket: images.pocket, play: images.play }
  },
  () => {
    failed = true
  },
)

// Once the ROMs are here: the pane's unit, with the machine a moved pane left behind, or
// from its battery backup.
let started = false
$effect(() => {
  const image = roms
  if (started || image === null) return
  started = true
  untrack(() => {
    const parked = claim(paneId)
    void session.start(
      image,
      parked?.unit ?? pane.unit,
      pane.seed,
      parked?.machine ?? null,
      parked?.paused ?? false,
    )
  })
})

// CODE covers the machine: it is out of sight then, and pauses as behind a tab.
const machineSeen = $derived(visible && pane.view === 'machine')
$effect(() => {
  runner.setSeen(machineSeen)
  // Out of sight is one of the times the battery backup is written.
  if (!machineSeen) untrack(() => session.save())
})

/** Whether there is a machine on for PASTE and LOAD ▸ to type into: PLAY-320 has no keys. */
const canType = $derived(runner.status !== 'empty' && !runner.off && !play)

/** The runner as code/give.ts types on it: PASTE's keys, in the machine's modes of the moment. */
const taker: CodeTaker = {
  get off() {
    return runner.off
  },
  get asleep() {
    return runner.asleep
  },
  get status() {
    return runner.status
  },
  get annunciators() {
    return runner.annunciators
  },
  brk: () => runner.brk(),
  whenAsleep: (ms) => runner.whenAsleep(ms),
  loadCode: (at, bytes) => runner.loadCode(at, bytes),
  typeText: (text) => runner.paste(pasteKeys(text, pasteModes(runner.annunciators)).keys),
  get callCode() {
    // The PLAY ROM's start screen takes the program back at code_return.
    const back = symbols.play.code_return
    return play && back !== undefined ? (at: number) => runner.callCode(at, back) : undefined
  },
}

/**
 * FILES' LOAD ▸: the line typed at BASIC's prompt, the machine brought there first (code/
 * give.ts); the keyboard back to it. What it says when it could not.
 */
async function typeLine(line: string): Promise<string | null> {
  const problem = await typeAtBasic(taker, line)
  if (problem === null) {
    // A person's press, though PASTE's keys type it: the program may use LINK once.
    runner.vouch()
    root?.focus({ preventScroll: true })
  }
  return problem
}

/** Why CODE's last RUN or LOAD did nothing, said in CODE, to which it goes back. */
let codeNotice = $state<string | null>(null)

/**
 * CODE's RUN and LOAD: back to the machine, stopped at a prompt, the program put at the code
 * area, and what a person would type (code/give.ts). When it could not, back to CODE, saying
 * why.
 */
async function giveCode(image: Uint8Array, how: 'run' | 'load'): Promise<void> {
  codeNotice = null
  change({ view: 'machine' })
  await tick()
  const problem = await giveTo(taker, image, how)
  if (problem !== null) {
    codeNotice = problem
    change({ view: 'code' })
    return
  }
  runner.vouch()
  root?.focus({ preventScroll: true })
}

/** Characters the last PASTE had no key for, said in TUNE until the next. */
let pasteSkipped = $state(0)

/** PASTE: the clipboard's text typed as the machine's keys; pressed while it types, it stops. */
async function paste(): Promise<void> {
  if (runner.pasting > 0) {
    runner.stopPaste()
    return
  }
  let text: string
  try {
    text = await navigator.clipboard.readText()
  } catch {
    return
  }
  const planned = pasteKeys(text, pasteModes(runner.annunciators))
  pasteSkipped = planned.skipped
  runner.paste(planned.keys)
}

function power(): void {
  runner.power()
  if (runner.off) session.save()
}

/** PC keys held, by their code, with the machine key each pressed. */
const held = new Map<string, number>()
/** On PLAY-320: PC keys held, by their code, with the pad button each pressed. */
const padKeys = new Map<string, number>()

// The keyboard left: every key goes up, as no key-up will come.
$effect(() => {
  if (listening) return
  untrack(() => {
    held.clear()
    padKeys.clear()
    runner.releaseAll()
  })
})

/** The pad buttons the PC's keys hold, together. */
function keysHeld(): number {
  let bits = 0
  for (const bit of padKeys.values()) bits |= bit
  return bits
}

/** A key on PLAY-320: a pad button (play-input.ts), BRK, or the app's. */
function playKeyDown(event: KeyboardEvent): void {
  const fate = playKeyFate(event)
  if (fate.kind === 'pass') return
  event.preventDefault()
  if (fate.kind === 'brk') {
    runner.brk()
    return
  }
  padKeys.set(event.code, fate.bit)
  runner.padFrom('keys', keysHeld())
}

// PLAY-320's gamepads, only while the pane is seen and has the focus: each tick the machine
// runs (the runner reads them), and on the shared 10 fps loop while it sleeps.
$effect(() => {
  if (!play || !listening || !machineSeen) return
  const read = () => gamepadBits(navigator.getGamepads?.() ?? [])
  runner.gamepads = read
  const stop = onFrame(() => {
    if (runner.asleep) runner.padFrom('gamepad', read())
  })
  return () => {
    stop()
    runner.gamepads = null
    runner.padFrom('gamepad', 0)
  }
})

function onkeydown(event: KeyboardEvent): void {
  if (event.target !== root || !listening) return
  if (play) {
    playKeyDown(event)
    return
  }
  const fate = pcKeyFate(event, kanaLit(runner.annunciators))
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
  if (padKeys.delete(event.code)) {
    event.preventDefault()
    runner.padFrom('keys', keysHeld())
    return
  }
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

let body = $state<HTMLDivElement | null>(null)
let room = $state({ w: 0, h: 0 })
$effect(() => {
  const el = body
  if (el === null) return
  return watchRoom(el, (next) => {
    if (next.w !== room.w || next.h !== room.h) room = next
  })
})
/** Opened by hand while it had folded away for want of room: shown anyway, for this mount. */
let forced = $state(false)
const panelOpen = $derived(forced || panelShown(pane.panel, room, MODELS[model].width))

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
    subtitle: session.unit === null ? model : `${session.unit.name} · ${model}`,
    ...(status === 'running' && !off ? { badge: 'on', badgeKind: 'ok' as const } : {}),
    ...(status === 'paused' ? { badge: 'paused', badgeKind: 'warn' as const } : {}),
    ...(status === 'halted' && !off ? { badge: 'halted', badgeKind: 'danger' as const } : {}),
  })
})

onDestroy(() => {
  const paused = runner.pausedBy === 'player'
  const unit = session.unit?.id
  const running = session.phase === 'running'
  const machine = runner.detach()
  session.dispose()
  // Parked at once, before the new mount (a moved pane) looks for it; nobody taking it means
  // the pane was closed, and the unit is let go with its machine.
  if (machine !== null && unit !== undefined && running) {
    park(paneId, { machine, paused, unit }, (left) =>
      UnitSession.release(window.elecdex.elec16, left.unit, paneId, left.machine),
    )
  }
  runner.dispose()
  buzzer.dispose()
})
</script>

<svelte:window
  onblur={() => {
    windowFocused = false
  }}
  onfocus={() => (windowFocused = true)}
  onpagehide={() => session.save()}
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
      >{session.unit === null ? '' : session.unit.clock === 'max' ? 'MAX' : `${session.unit.clock} MHz`}</span
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
      onclick={(e) => afterBlink(e.currentTarget, power)}
      data-testid="elec16-power">power</button
    >
    <button
      type="button"
      class="e16-btn"
      disabled={runner.status === 'empty'}
      onclick={(e) => afterBlink(e.currentTarget, () => runner.reset())}
      data-testid="elec16-reset">reset</button
    >
    <button type="button" class="e16-btn" aria-expanded={panelOpen} onclick={togglePanel} data-testid="elec16-panel-toggle"
      >{panelOpen ? 'panel ◂' : '▸ panel'}</button
    >
    <button
      type="button"
      class="e16-btn"
      aria-pressed={pane.view === 'code'}
      disabled={rom === null || session.unit === null}
      onclick={() => {
        sfx.play('panel')
        change({ view: pane.view === 'code' ? 'machine' : 'code' })
      }}
      data-testid="elec16-view-toggle">{pane.view === 'code' ? 'machine' : 'code'}</button
    >
  </div>

  {#if pane.view === 'code' && rom !== null}
    <div class="code-view crt-on" style:--crt-delay="{POWER_OFF_MS}ms" transition:crtPower>
      <CodeView
        unit={session.phase === 'running' ? (session.unit?.id ?? null) : null}
        {rom}
        file={pane.codeFile}
        level={pane.codeLevel}
        onfile={(codeFile) => change({ codeFile })}
        onlevel={(codeLevel) => change({ codeLevel })}
        notice={codeNotice}
        ongive={(image, how) => void giveCode(image, how)}
      />
    </div>
  {/if}
  <div class="body" bind:this={body} class:hidden={pane.view === 'code'}>
    <div class="device">
      {#if failed}
        <p class="failed" data-testid="elec16-failed">The ROM could not be read.</p>
      {:else if session.phase === 'held' || session.phase === 'gone'}
        <div class="sheet crt-on" style:--crt-delay="{POWER_OFF_MS}ms" transition:crtPower data-testid="elec16-sheet" data-phase={session.phase}>
          <p>
            {session.unit?.name ?? 'The unit'}
            {session.phase === 'held' ? 'is running in another pane.' : 'moved to another pane.'}
          </p>
          <div class="sheet-actions">
            <button
              type="button"
              class="e16-btn"
              onclick={(e) => afterBlink(e.currentTarget, () => void session.moveHere())}
              data-testid="elec16-move-here">{session.phase === 'held' ? 'move here' : 'take it back'}</button
            >
            <button
              type="button"
              class="e16-btn"
              onclick={(e) => afterBlink(e.currentTarget, () => void session.newUnit())}
              data-testid="elec16-new-unit">new unit</button
            >
          </div>
        </div>
      {:else if runner.status !== 'empty'}
        <!-- One view whatever the model: switching to or from PLAY-320 swaps the screen in place,
             as another LCD does, rather than powering one off over the other. -->
        <div class="view crt-on" style:--crt-delay="{POWER_OFF_MS}ms" transition:crtPower>
          {#if play && pane.playBody !== 'screen'}
            <PlayDevice {runner} shape={pane.playBody} skin={pane.playSkin} seen={visible} />
          {:else if play}
            <PlayScreen {runner} seen={visible} />
          {:else}
          <Device
            {runner}
            {skin}
            {lcdColours}
            mode={pane.body}
            ghost={pane.ghost}
            contrast={pane.contrast}
            seen={visible}
            link={appearance.settings.elec16.link.on && appearance.settings.elec16.link.ai.on}
          />
          {/if}
        </div>
      {/if}
    </div>
    {#if panelOpen}
      <aside class="panel crt-on" style:width="{PANEL_WIDTH}px" transition:crtPower data-testid="elec16-panel">
        <div class="tabs" role="tablist">
          {#each tabs as t (t)}
            <button
              type="button"
              class="tab"
              role="tab"
              aria-selected={tab === t}
              onclick={() => {
                if (tab !== t) sfx.play('panel')
                change({ tab: t })
              }}
              data-testid="elec16-tab"
              data-tab={t}>{t}</button
            >
          {/each}
        </div>
        <div class="pane-body">
          {#if tab === 'core'}
            <CoreView {runner} {labels} />
          {:else if tab === 'mem'}
            <MemView {runner} />
          {:else if tab === 'files'}
            <FilesView
              unit={session.phase === 'running' ? (session.unit?.id ?? null) : null}
              seen={visible}
              canType={canType}
              onload={typeLine}
            />
          {:else if tab === 'games'}
            <GamesView
              inSlot={session.unit?.cart}
              running={session.phase === 'running'}
              oninsert={(id) => void session.insertGame(id)}
            />
          {:else if tab === 'link'}
            <LinkView sent={runner.linkSent} note={runner.linkNote} />
          {:else}
            <TuneView
              {pane}
              unit={session.unit}
              units={session.board.units}
              onchange={change}
              onunit={(c) => void session.change(c)}
              onswitch={(id) => void session.switchTo(id)}
              onnew={() => void session.newUnit()}
              onremove={(id) => void session.remove(id)}
              pasting={runner.pasting}
              {pasteSkipped}
              canPaste={canType}
              onpaste={() => void paste()}
            />
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

/* Under CODE the machine stays mounted, out of sight (its device reads a size of 0 and keeps
   the last). */
.body.hidden {
  display: none;
}

.code-view {
  flex: 1;
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

.sheet {
  grid-area: 1 / 1;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--step--1);
  color: var(--text);
}

.sheet p {
  margin: 0;
}

.sheet-actions {
  display: flex;
  gap: var(--space-2);
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
