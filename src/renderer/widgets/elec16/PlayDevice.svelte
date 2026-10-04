<script lang="ts">
import { PAD_BUTTONS, type PadButton, padBit } from '@shared/elec16/pad'
import { watchRoom } from '../emu/screen.ts'
import PlayScreen from './PlayScreen.svelte'
import {
  BODIES,
  type BodyShape,
  bodyFor,
  legendOf,
  PLAY_SKIN_COLOURS,
  type PlaySkin,
  playScale,
  type Rect,
  SPEAKER_TURN,
} from './play-body.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * PLAY-320's body (docs/elec16-play.md section 8), as the agreed mock draws it: the tall one
 * or the wide one, its name on the left of the top and the power lamp on the right, the screen
 * in its frame, and the twelve buttons raised - a press sinks one. Every place comes from
 * play-body.ts, in dots of the screen, scaled to the room at whole device pixels a dot where
 * one fits, never stretched. A button is held while the pointer that pressed it is down; the
 * keys and the gamepads press the same buttons, and those are drawn pressed too.
 */
interface Props {
  runner: Elec16Runner
  /** The body, or `auto` for the one the room suits. */
  shape: BodyShape | 'auto'
  skin: PlaySkin
  seen: boolean
}

const { runner, shape, skin, seen }: Props = $props()

let host = $state<HTMLDivElement | null>(null)
let room = $state({ w: 0, h: 0, ratio: 1 })

$effect(() => {
  const el = host
  if (el === null) return
  return watchRoom(el, (next) => {
    const ratio = window.devicePixelRatio || 1
    if (next.w !== room.w || next.h !== room.h || ratio !== room.ratio) room = { ...next, ratio }
  })
})

const body = $derived(BODIES[shape === 'auto' ? bodyFor(room) : shape])
const scale = $derived(playScale(room, body.width, body.height))
/** CSS pixels to a dot of the screen. */
const unit = $derived(scale / room.ratio)
const colours = $derived(PLAY_SKIN_COLOURS[skin])

const place = (r: Rect): string =>
  `left:${r.x * unit}px;top:${r.y * unit}px;width:${r.w * unit}px;height:${r.h * unit}px`

const LABELS: Partial<Record<PadButton, string>> = {
  a: 'A',
  b: 'B',
  x: 'X',
  y: 'Y',
  l: 'L',
  r: 'R',
}

/** Which colours a button takes: A and B one pair, X and Y another, the rest dark. */
function tone(button: PadButton): readonly [string, string, string] {
  if (button === 'a' || button === 'b') return colours.ab
  if (button === 'x' || button === 'y') return colours.xy
  return colours.dark
}

/** The pointers holding a button down, and which. */
const pointers = new Map<number, number>()

function held(): number {
  let bits = 0
  for (const bit of pointers.values()) bits |= bit
  return bits
}

function press(event: PointerEvent, button: PadButton): void {
  // The pane keeps the focus (and so the keys and the gamepads), as the pocket keyboard does.
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, padBit(button))
  runner.padFrom('body', held())
}

function letGo(event: PointerEvent): void {
  if (!pointers.delete(event.pointerId)) return
  runner.padFrom('body', held())
}

// Gone (another body, the screen alone, the pane closed): nothing stays held from it.
$effect(() => () => {
  pointers.clear()
  runner.padFrom('body', 0)
})
</script>

<div class="fit" bind:this={host}>
  {#if scale > 0}
    <div
      class="play-body"
      style:width="{body.width * unit}px"
      style:height="{body.height * unit}px"
      style:--p-case={colours.case}
      style:--p-edge={colours.edge}
      style:--p-print={colours.print}
      style:--p-name={colours.name}
      style:--p-lamp={colours.lamp}
      style:--p-unit="{unit}px"
      data-testid="elec16-play-body"
      data-body={body.shape}
      data-skin={skin}
    >
      {#each PAD_BUTTONS.filter((b) => body.buttons[b].shape === 'shoulder') as b (b)}
        {@const r = body.buttons[b]}
        {@const [face, shade, text] = tone(b)}
        <button
          type="button"
          tabindex="-1"
          class="pad shoulder"
          class:down={(runner.padHeld & padBit(b)) !== 0}
          style={place(r)}
          style:--face={face}
          style:--shade={shade}
          style:--text={text}
          aria-label={b.toUpperCase()}
          aria-pressed={(runner.padHeld & padBit(b)) !== 0}
          onpointerdown={(e) => press(e, b)}
          onpointerup={letGo}
          onpointercancel={letGo}
          onlostpointercapture={letGo}
          data-testid="elec16-pad-button"
          data-button={b}>{LABELS[b]}</button
        >
      {/each}
      <div class="case" style={place(body.body)}></div>
      <div class="bar" style={place(body.bar)}>
        <span class="name">ELEC-16 <b>PLAY</b></span>
        <span class="lamp" class:on={!runner.off} aria-label={runner.off ? 'power off' : 'power on'} data-testid="elec16-play-lamp"></span>
      </div>
      <div class="frame" style={place(body.frame)}></div>
      <div class="screen" style={place(body.screen)}>
        <PlayScreen {runner} {seen} fixed={{ scale, ratio: room.ratio }} />
      </div>
      <div class="hub" style={place(body.hub)} style:--face={colours.dark[0]}></div>
      {#each PAD_BUTTONS.filter((b) => body.buttons[b].shape !== 'shoulder') as b (b)}
        {@const r = body.buttons[b]}
        {@const [face, shade, text] = tone(b)}
        <button
          type="button"
          tabindex="-1"
          class="pad {r.shape} {b}"
          class:down={(runner.padHeld & padBit(b)) !== 0}
          style={place(r)}
          style:--face={face}
          style:--shade={shade}
          style:--text={text}
          aria-label={b.toUpperCase()}
          aria-pressed={(runner.padHeld & padBit(b)) !== 0}
          onpointerdown={(e) => press(e, b)}
          onpointerup={letGo}
          onpointercancel={letGo}
          onlostpointercapture={letGo}
          data-testid="elec16-pad-button"
          data-button={b}>{LABELS[b] ?? ''}</button
        >
        {#if r.shape === 'pill'}
          <span class="legend" style={place(legendOf(r))}>{b.toUpperCase()}</span>
        {/if}
      {/each}
      <div class="speaker" style={place(body.speaker)} style:--turn="{SPEAKER_TURN}deg" aria-hidden="true">
        {#each [0, 1, 2, 3, 4, 5] as k (k)}<i></i>{/each}
      </div>
    </div>
  {/if}
</div>

<style>
.fit {
  display: grid;
  place-items: center;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.play-body {
  position: relative;
  flex: none;
  font-family: var(--font-ui);
}

.play-body > * {
  position: absolute;
  box-sizing: border-box;
}

.case {
  border: 1px solid var(--p-edge);
  border-radius: calc(var(--p-unit) * 22) calc(var(--p-unit) * 22) calc(var(--p-unit) * 56)
    calc(var(--p-unit) * 22);
  background: var(--p-case);
  box-shadow:
    inset 0 2px 0 rgb(255 255 255 / 0.1),
    inset 0 -2px 0 rgb(0 0 0 / 0.15),
    0 10px 28px rgb(0 0 0 / 0.35);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  font-size: var(--step-0);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--p-name);
  white-space: nowrap;
}

.name b {
  font-size: var(--step--2);
  font-weight: 600;
  letter-spacing: 0.3em;
  color: var(--p-print);
}

.lamp {
  width: calc(var(--p-unit) * 10);
  height: calc(var(--p-unit) * 10);
  border-radius: 50%;
  background: var(--p-print);
  opacity: 0.35;
}

.lamp.on {
  background: var(--p-lamp);
  opacity: 1;
  box-shadow: 0 0 calc(var(--p-unit) * 8) var(--p-lamp);
}

.frame {
  border-radius: calc(var(--p-unit) * 12) calc(var(--p-unit) * 12) calc(var(--p-unit) * 30)
    calc(var(--p-unit) * 12);
  background: #14161b;
  box-shadow: inset 0 3px 6px rgb(0 0 0 / 0.45);
}

.screen {
  display: grid;
  place-items: center;
  overflow: hidden;
}

.hub {
  background: linear-gradient(var(--face), color-mix(in srgb, var(--face) 60%, black));
}

/* A raised button: lit from above, its own shade below; pressed, it sinks onto it. */
.pad {
  display: grid;
  place-items: center;
  padding: 0;
  border: none;
  color: var(--text);
  font: inherit;
  font-size: var(--step-0);
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  touch-action: none;
  background: linear-gradient(var(--face), color-mix(in srgb, var(--face) 70%, black));
  box-shadow:
    0 calc(var(--p-unit) * 4) 0 var(--shade),
    inset 0 calc(var(--p-unit) * 2) 0 rgb(255 255 255 / 0.25);
}

.pad.down {
  transform: translateY(calc(var(--p-unit) * 3));
  box-shadow:
    0 calc(var(--p-unit) * 1) 0 var(--shade),
    inset 0 calc(var(--p-unit) * 2) 0 rgb(0 0 0 / 0.2);
}

.pad:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.round {
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, var(--face), color-mix(in srgb, var(--face) 65%, black));
}

/* The d-pad's arms cast a shorter shadow: a long one fell on its middle. */
.pad.arm {
  box-shadow:
    0 calc(var(--p-unit) * 2) 0 var(--shade),
    inset 0 calc(var(--p-unit) * 2) 0 rgb(255 255 255 / 0.18);
}

.pad.arm.down {
  box-shadow: 0 0 0 var(--shade);
}

.arm.up {
  border-radius: calc(var(--p-unit) * 5) calc(var(--p-unit) * 5) 0 0;
}

.arm.down {
  border-radius: 0 0 calc(var(--p-unit) * 5) calc(var(--p-unit) * 5);
}

.arm.left {
  border-radius: calc(var(--p-unit) * 5) 0 0 calc(var(--p-unit) * 5);
}

.arm.right {
  border-radius: 0 calc(var(--p-unit) * 5) calc(var(--p-unit) * 5) 0;
}

.shoulder {
  align-items: start;
  padding-top: calc(var(--p-unit) * 4);
  border-radius: calc(var(--p-unit) * 14) calc(var(--p-unit) * 14) 0 0;
  font-size: var(--step--1);
}

.pill {
  border-radius: calc(var(--p-unit) * 7);
}

.legend {
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  text-align: center;
  color: var(--p-print);
}

.speaker {
  display: flex;
  justify-content: space-between;
  transform: rotate(var(--turn));
}

.speaker i {
  width: calc(var(--p-unit) * 5);
  border-radius: calc(var(--p-unit) * 3);
  background: rgb(0 0 0 / 0.3);
}
</style>
