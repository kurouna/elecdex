<script lang="ts">
import { keyFate, padOf } from '@shared/chip8/keys'
import type { Chip8Program, Chip8Slot } from '@shared/chip8-library'
import { parseRgb } from '@shared/qr'
import { onDestroy, untrack } from 'svelte'
import { POWER_OFF_MS } from '../../lib/crt-motion.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import { seen } from '../../stores/window-state.svelte.ts'
import type { WidgetProps } from '../registry.ts'
import { Buzzer } from './buzzer.ts'
import LibraryView from './LibraryView.svelte'
import { chip8Library } from './library.svelte.ts'
import { originalPalette, type Palette, type Rgb, themePalette } from './palette.ts'
import { type Chip8Pane, readChip8Pane } from './pane-state.ts'
import { claim, park } from './park.ts'
import RunView from './RunView.svelte'
import { browserHost, Chip8Runner } from './runner.svelte.ts'

/**
 * The CHIP-8 pane (docs/architecture.md section 5.18): the library, and a program running.
 *
 * This component only wires: the machine is shared/chip8, its clock the runner, its sound
 * the buzzer, its picture Screen; the pane's choices are its pane state. It gives the game
 * the keyboard while the pane itself has the focus - a press on one of its buttons hands
 * the focus back - and never a key held with Ctrl, Alt or the system key, nor Tab or
 * Escape (shared/chip8/keys.ts). Moved in the layout, its machine waits in park.ts for the
 * new mount to take up; out of sight, it pauses.
 */
const { paneId, state: paneState, visible: inTab = true }: WidgetProps = $props()
const visible = $derived(seen(inTab))
const pane = $derived(readChip8Pane(paneState))
const program = $derived(chip8Library.find(pane.program))

void chip8Library.load()

const buzzer = new Buzzer({
  enabled: () => appearance.settings.sound.enabled,
  volume: () => appearance.settings.chip8.volume,
})
const runner = new Chip8Runner(
  browserHost((tone) => (tone === null ? buzzer.silence() : buzzer.play(tone))),
)

let root = $state<HTMLDivElement | null>(null)
let library = $state<{ key(event: KeyboardEvent): boolean } | null>(null)
let paneFocused = $state(false)
let windowFocused = $state(document.hasFocus())
/** A program that could not be read, named for the run view to say so. */
let missing = $state<string | null>(null)

const listening = $derived(
  pane.view === 'run' && paneFocused && windowFocused && runner.status !== 'empty',
)

$effect(() => {
  buzzer.muted = pane.muted
})

$effect(() => {
  runner.setSeen(visible)
})

// The keyboard left: every pad goes up, as no key-up will come.
$effect(() => {
  if (!listening) untrack(() => runner.releaseAll())
})

function change(next: Partial<Chip8Pane>): void {
  widgetState.patch(paneId, next)
}

/** Counts starts, so a program whose bytes arrive after another was chosen is not loaded. */
let starts = 0

/** Where a start goes on from: AUTO or a slot when it holds a machine, or the beginning. */
type From = Chip8Slot | 'fresh'

/** How a start came out: went on from the kept machine, began afresh, came to nothing, or was overtaken. */
type Started = 'resumed' | 'fresh' | 'failed' | 'stale'

/**
 * Starts a program - from the beginning, or from a kept machine when there is one - running,
 * or (coming back after a restart) paused where a player finds it. One that cannot be read
 * sends the pane back to the library, which says so. A slot's machine is that or nothing:
 * one that cannot be read leaves the game as it was. A start overtaken by another - or by
 * the pane going (onDestroy counts one) - loads nothing.
 */
async function start(id: string, from: From, paused: boolean): Promise<Started> {
  const mine = ++starts
  const found = chip8Library.find(id)
  const [rom, snapshot] = await Promise.all([
    found === null ? null : chip8Library.rom(id),
    from === 'fresh' ? null : window.elecdex.chip8.load(id, from).catch(() => null),
  ])
  if (mine !== starts) return 'stale'
  if (found === null || rom === null) {
    missing = found?.title ?? id
    change({ view: 'library' })
    return 'failed'
  }
  missing = null
  const strict = from !== 'fresh' && from !== 'auto'
  const resumed = runner.load(found, rom, Date.now(), { snapshot, paused, strict })
  if (resumed) return 'resumed'
  return strict ? 'failed' : 'fresh'
}

/** The changes AUTO last kept, so a machine that has not moved since is not written again. */
let kept = -1

/**
 * Keeps the machine in AUTO: on going back to the library, out of sight, away (a move, a
 * layout switch, a closed pane) and with the page (a reload, the app quitting). A machine
 * that has halted is not kept - AUTO keeps the last one worth going on from.
 */
function keepAuto(): Promise<unknown> {
  const current = runner.program
  const going = runner.status === 'running' || runner.status === 'paused'
  if (current === null || !going || runner.changes === kept) return Promise.resolve()
  const bytes = runner.snapshot()
  if (bytes === null) return Promise.resolve()
  kept = runner.changes
  return window.elecdex.chip8.save(current.id, 'auto', bytes).catch(() => null)
}

// Out of sight, the runner pauses (runner.setSeen): what it paused at is kept.
let wasVisible = true
$effect(() => {
  const now = visible
  if (wasVisible && !now) untrack(() => void keepAuto())
  wasVisible = now
})

// On mount, and once the library is known: take up the machine a moved pane left behind,
// or bring back what the pane was running, from AUTO, paused.
let restored = false
$effect(() => {
  if (restored || !chip8Library.loaded) return
  restored = true
  untrack(() => {
    const parked = claim(paneId)
    if (parked !== null && parked.program.id === pane.program) {
      runner.adopt(parked.program, parked.rom, parked.machine, parked.paused)
    } else if (pane.view === 'run' && pane.program !== null) {
      void start(pane.program, 'auto', true)
    }
  })
})

// A program taken out of the library (an import removed, here or in another pane) while it
// runs: its machine is put away and the pane goes back to the library, saying so.
$effect(() => {
  const current = runner.program
  if (!chip8Library.loaded || current === null) return
  if (chip8Library.programs.some((p) => p.id === current.id)) return
  untrack(() => {
    runner.unload()
    missing = current.title
    change({ view: 'library' })
  })
})

// An imported program changed to another machine (EDIT, here or in another pane) while it
// runs: its machine was the old one's, so it starts again as the new one, paused.
$effect(() => {
  const current = runner.program
  if (!chip8Library.loaded || current === null) return
  const now = chip8Library.find(current.id)
  if (now === null || now.platform === current.platform) return
  untrack(() => void start(current.id, 'fresh', true))
})

/**
 * Loads a program from the library: going on from where it was left (the machine still
 * here, else AUTO), or from the beginning when asked (`fresh`) or when nothing was kept.
 */
function load(id: string, fresh: boolean): void {
  sfx.play('granted')
  change({ view: 'run', program: id })
  const going = runner.status === 'paused' || runner.status === 'running'
  // The machine still here, if it is the machine the program now runs as (EDIT may have
  // changed it).
  const same = runner.machine?.state.config.platform === chip8Library.find(id)?.platform
  if (!fresh && runner.program?.id === id && going && same) {
    runner.resume()
    root?.focus({ preventScroll: true })
    return
  }
  void start(id, fresh ? 'fresh' : 'auto', false).then(() => root?.focus({ preventScroll: true }))
}

function back(): void {
  runner.pause('player')
  sfx.play('panel')
  // Kept before the library shows, so it offers to go on from here.
  void keepAuto().then(() => change({ view: 'library' }))
  root?.focus({ preventScroll: true })
}

function reset(): void {
  runner.reset(Date.now())
  root?.focus({ preventScroll: true })
}

/**
 * Goes on from a kept machine (SAVE's LOAD), paused if the machine now is; false only when
 * that machine could not be read (the game goes on as it was).
 */
async function fromSlot(slot: Chip8Slot): Promise<boolean> {
  const current = runner.program
  if (current === null) return false
  const paused = runner.status === 'paused'
  const done = await start(current.id, slot, paused)
  root?.focus({ preventScroll: true })
  return done !== 'failed'
}

function onkeydown(event: KeyboardEvent): void {
  if (event.target !== root) return
  if (pane.view === 'library') {
    if (!event.ctrlKey && !event.altKey && !event.metaKey && library?.key(event))
      event.preventDefault()
    return
  }
  if (!listening) return
  const fate = keyFate(event, runner.status === 'paused')
  if (fate.kind === 'pass') return
  event.preventDefault()
  if (fate.kind === 'pad') runner.press(fate.key)
  else if (fate.kind === 'pause') runner.togglePause()
  else if (fate.kind === 'step') runner.stepFrame()
}

function onkeyup(event: KeyboardEvent): void {
  // A pad goes up whatever else is held by then: the machine must never keep a key down.
  const pad = padOf(event.code)
  if (pad === null || (runner.keys & (1 << pad)) === 0) return
  event.preventDefault()
  runner.release(pad)
}

/** A press on one of the pane's buttons gives the keyboard back to the game. */
function onpointerup(event: PointerEvent): void {
  const target = event.target as HTMLElement | null
  if (target === null || target.closest('input, select, textarea') !== null) return
  queueMicrotask(() => root?.focus({ preventScroll: true }))
}

// The screen's colours: the theme's, read again when it changes, or the author's.
// Raw: the palette is read for every dot of every frame, and a deep state's proxy made each
// read a trap (4 ms a paint of 64 x 32, measured).
let themeColours = $state.raw<Partial<{ ground: Rgb; accent: Rgb; strong: Rgb }>>({})
$effect(() => {
  void appearance.revision
  const el = root
  if (el === null) return
  const style = getComputedStyle(el)
  const probe = document.createElement('canvas').getContext('2d')
  const read = (name: string): Rgb | undefined => {
    const value = style.getPropertyValue(name).trim()
    if (probe === null || value === '') return undefined
    probe.fillStyle = '#000'
    probe.fillStyle = value
    return parseRgb(String(probe.fillStyle)) ?? undefined
  }
  const light = document.documentElement.dataset.mode === 'light'
  const ground = read(light ? '--panel-bg-raised' : '--surface-0')
  const accent = read('--accent')
  const strong = read('--accent-strong')
  themeColours = {
    ...(ground !== undefined ? { ground } : {}),
    ...(accent !== undefined ? { accent } : {}),
    ...(strong !== undefined ? { strong } : {}),
  }
})
const themed = $derived(themePalette(themeColours))
/** A program's colours: its author's where the pane says so and it has them, else the theme's. */
const paletteOf = (of: Chip8Program | null): Palette =>
  (pane.palette === 'original' ? originalPalette(of?.colours) : null) ?? themed
const palette = $derived(paletteOf(program))

$effect(() => {
  const status = runner.status
  const title = runner.program?.title
  paneMeta.set(paneId, {
    subtitle: pane.view === 'run' && title !== undefined ? title : 'library',
    ...(pane.view === 'run' && status === 'running'
      ? { badge: 'running', badgeKind: 'ok' as const }
      : {}),
    ...(pane.view === 'run' && status === 'paused'
      ? { badge: 'paused', badgeKind: 'warn' as const }
      : {}),
    ...(pane.view === 'run' && status === 'halted'
      ? { badge: 'halted', badgeKind: 'danger' as const }
      : {}),
  })
})

onDestroy(() => {
  // A start still waiting on its bytes is overtaken: it must not load into a runner that is gone.
  starts++
  void keepAuto()
  const paused = runner.status !== 'running'
  const current = runner.program
  const rom = runner.rom
  const machine = runner.detach()
  // Parked at once, before the new mount (a moved pane) looks for it.
  if (machine !== null && current !== null && rom !== null) {
    park(paneId, { program: current, rom, machine, paused })
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
  onpagehide={() => void keepAuto()}
/>

<!-- The pane takes keys while it has the focus, as a game's field does: role application. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="chip8"
  class:listening
  bind:this={root}
  tabindex="0"
  role="application"
  aria-label="CHIP-8: takes the keys you press while it has the focus"
  onfocus={() => (paneFocused = true)}
  onblur={() => (paneFocused = false)}
  {onkeydown}
  {onkeyup}
  {onpointerup}
  data-testid="chip8"
  data-view={pane.view}
>
  {#if !chip8Library.loaded}
    <!-- The library is a moment away; nothing is shown rather than the wrong screen. -->
  {:else if pane.view === 'run' && program !== null}
    <div class="view crt-on" style:--crt-delay="{POWER_OFF_MS}ms" transition:crtPower>
      <RunView
        {runner}
        {program}
        {pane}
        panelWanted={pane.panel ?? appearance.settings.chip8.core}
        {palette}
        {listening}
        onback={back}
        onreset={reset}
        onchange={change}
        onslot={fromSlot}
      />
    </div>
  {:else}
    <div class="view crt-on" style:--crt-delay="{POWER_OFF_MS}ms" transition:crtPower>
      <LibraryView
        bind:this={library}
        programs={chip8Library.programs}
        loaded={chip8Library.loaded}
        filter={pane.filter}
        selected={pane.program}
        {paletteOf}
        glow={pane.phosphor}
        dots={pane.dots}
        seen={visible}
        listShare={pane.listShare}
        onlistshare={(listShare) => change({ listShare })}
        onfilter={(filter) => change({ filter })}
        onselect={(id) => change({ program: id })}
        onload={load}
      />
      {#if missing !== null}
        <p class="missing" data-testid="chip8-missing">{missing} is not in the library.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
.chip8 {
  container: chip8 / inline-size;
  display: grid;
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
  outline: none;
  font-family: var(--font-ui);
  transition: box-shadow var(--dur-panel, 120ms) linear;
}

/* The pane has the keyboard: a hairline round it, as a plugin pane taking keys has. */
.chip8.listening {
  box-shadow: inset 0 0 0 1px var(--accent-dim);
}

.view {
  grid-area: 1 / 1;
  min-width: 0;
  min-height: 0;
}

.missing {
  margin: var(--space-1) 0 0;
  font-size: var(--step--1);
  color: var(--warn);
}

/* The pane's buttons and chips. A press blinks the accent on the launcher's 100 ms beat. */
.chip8 :global(.c8-btn) {
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

.chip8 :global(.c8-btn:hover:not(:disabled)) {
  border-color: var(--panel-border);
  background: var(--accent-faint);
}

.chip8 :global(.c8-btn.primary) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.chip8 :global(.c8-btn:disabled) {
  opacity: 0.4;
  cursor: default;
}

.chip8 :global(.c8-chip) {
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

.chip8 :global(.c8-chip.plain) {
  color: var(--accent);
  cursor: default;
}

.chip8 :global(.c8-chip[aria-pressed='true']),
.chip8 :global(.c8-chip[aria-checked='true']) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}

.chip8 :global(.c8-chip:disabled) {
  opacity: 0.4;
  cursor: default;
}

.chip8 :global(:is(.c8-btn, .c8-chip:not(.plain), .tab):active),
.chip8 :global(.blinking) {
  animation: c8-press 100ms linear infinite;
  animation-play-state: var(--ambient-play-state);
}

@keyframes -global-c8-press {
  50% {
    background: var(--accent);
    color: var(--text-inverse);
    border-color: var(--accent);
  }
}
</style>
