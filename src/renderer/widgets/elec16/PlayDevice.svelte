<script lang="ts">
import { PAD_BUTTONS, type PadButton, padBit } from '@shared/elec16/pad'
import { watchRoom } from '../emu/screen.ts'
import PlayScreen from './PlayScreen.svelte'
import {
  BODIES,
  type BodyShape,
  bodyFor,
  DISH,
  dpadCross,
  legendOf,
  PLAY_SKIN_COLOURS,
  type PlaySkin,
  playScale,
  type Rect,
  recess,
  SPEAKER_TURN,
  WELL,
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

const cross = $derived(dpadCross(body))

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
          class:held={(runner.padHeld & padBit(b)) !== 0}
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
      <div class="glass" style={place(body.screen)} aria-hidden="true"></div>
      <!-- The recesses the buttons sit in, then the d-pad's plate: one raised cross. -->
      <div class="dish" style={place(recess(cross, DISH))}></div>
      {#each PAD_BUTTONS.filter((b) => body.buttons[b].shape === 'round' || body.buttons[b].shape === 'pill') as b (b)}
        <div class="well {body.buttons[b].shape}" style={place(recess(body.buttons[b], WELL))}></div>
      {/each}
      <div class="plate" style={place(cross)} style:--face={colours.dark[0]}></div>
      <div class="hub" style={place(body.hub)} style:--face={colours.dark[0]}></div>
      {#each PAD_BUTTONS.filter((b) => body.buttons[b].shape !== 'shoulder') as b (b)}
        {@const r = body.buttons[b]}
        {@const [face, shade, text] = tone(b)}
        <button
          type="button"
          tabindex="-1"
          class="pad {r.shape} {b}"
          class:held={(runner.padHeld & padBit(b)) !== 0}
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
          data-button={b}
          >{#if r.shape === 'arm'}<i class="arrow" aria-hidden="true"></i>{:else}{LABELS[b] ?? ''}{/if}</button
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
  /* Moulded plastic: lit from above and the left, darker towards the bottom edge. */
  background:
    radial-gradient(120% 60% at 20% 0%, rgb(255 255 255 / 0.1), transparent 60%),
    linear-gradient(
      175deg,
      color-mix(in srgb, var(--p-case) 92%, white) 0%,
      var(--p-case) 35%,
      color-mix(in srgb, var(--p-case) 86%, black) 100%
    );
  box-shadow:
    inset 0 calc(var(--p-unit) * 2) 0 rgb(255 255 255 / 0.14),
    inset 0 calc(var(--p-unit) * -3) 0 rgb(0 0 0 / 0.18),
    inset calc(var(--p-unit) * 2) 0 0 rgb(255 255 255 / 0.05),
    0 calc(var(--p-unit) * 3) calc(var(--p-unit) * 4) rgb(0 0 0 / 0.25),
    0 calc(var(--p-unit) * 14) calc(var(--p-unit) * 30) rgb(0 0 0 / 0.35);
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
  /* Printed on the case: a hair of light under it. */
  text-shadow: 0 1px 0 rgb(255 255 255 / 0.12);
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
  background: radial-gradient(
    circle at 35% 30%,
    color-mix(in srgb, var(--p-print) 60%, white),
    var(--p-print)
  );
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.5);
  opacity: 0.4;
}

.lamp.on {
  background: radial-gradient(circle at 35% 30%, white, var(--p-lamp) 55%);
  opacity: 1;
  box-shadow:
    0 0 calc(var(--p-unit) * 8) var(--p-lamp),
    inset 0 -1px 1px rgb(0 0 0 / 0.3);
}

/* The screen's bezel: a dark glossy surround, sunk into the case. */
.frame {
  border-radius: calc(var(--p-unit) * 12) calc(var(--p-unit) * 12) calc(var(--p-unit) * 30)
    calc(var(--p-unit) * 12);
  background: linear-gradient(170deg, #23262d, #121418 60%, #0d0f12);
  box-shadow:
    inset 0 calc(var(--p-unit) * 3) calc(var(--p-unit) * 6) rgb(0 0 0 / 0.55),
    inset 0 calc(var(--p-unit) * -1) 0 rgb(255 255 255 / 0.06),
    0 calc(var(--p-unit) * 1) 0 rgb(255 255 255 / 0.12);
}

.screen {
  display: grid;
  place-items: center;
  overflow: hidden;
}

/* The glass over the screen: the faintest reflection, so the dots keep their colours. */
.glass {
  pointer-events: none;
  background: linear-gradient(135deg, rgb(255 255 255 / 0.07), transparent 38%);
  box-shadow: inset 0 0 calc(var(--p-unit) * 3) rgb(0 0 0 / 0.5);
}

/* The dish the d-pad sits in, and the wells of the round buttons and the pills. */
.dish,
.well {
  background: color-mix(in srgb, var(--p-case) 80%, black);
  box-shadow:
    inset 0 calc(var(--p-unit) * 2) calc(var(--p-unit) * 3) rgb(0 0 0 / 0.45),
    0 calc(var(--p-unit) * 1) 0 rgb(255 255 255 / 0.14);
}

.dish,
.well.round {
  border-radius: 50%;
}

.well.pill {
  border-radius: calc(var(--p-unit) * 11);
}

/* The d-pad's plate: one raised cross, its arms the buttons over it. */
.plate {
  clip-path: polygon(
    33% 0,
    67% 0,
    67% 33%,
    100% 33%,
    100% 67%,
    67% 67%,
    67% 100%,
    33% 100%,
    33% 67%,
    0 67%,
    0 33%,
    33% 33%
  );
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--face) 78%, white),
    var(--face) 40%,
    color-mix(in srgb, var(--face) 65%, black)
  );
}

/* A shallow dimple in the middle of the cross. */
.hub {
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--face) 70%, black) 0 30%,
    color-mix(in srgb, var(--face) 88%, black) 34%,
    transparent 62%
  );
}

/* A raised button: convex, lit from above and the left, its shade below; pressed, it sinks. */
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
  background: linear-gradient(
    color-mix(in srgb, var(--face) 85%, white),
    var(--face) 45%,
    color-mix(in srgb, var(--face) 70%, black)
  );
  box-shadow:
    0 calc(var(--p-unit) * 3) 0 var(--shade),
    0 calc(var(--p-unit) * 5) calc(var(--p-unit) * 5) rgb(0 0 0 / 0.35),
    inset 0 calc(var(--p-unit) * 2) calc(var(--p-unit) * 1) rgb(255 255 255 / 0.3),
    inset 0 calc(var(--p-unit) * -2) calc(var(--p-unit) * 2) rgb(0 0 0 / 0.2);
  /* Moulded letters: a hair of light below, as if cut in. */
  text-shadow: 0 1px 0 rgb(255 255 255 / 0.25);
}

.pad.held {
  transform: translateY(calc(var(--p-unit) * 2.5));
  box-shadow:
    0 calc(var(--p-unit) * 0.5) 0 var(--shade),
    0 calc(var(--p-unit) * 1) calc(var(--p-unit) * 2) rgb(0 0 0 / 0.3),
    inset 0 calc(var(--p-unit) * 2) calc(var(--p-unit) * 3) rgb(0 0 0 / 0.3);
}

.round {
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 28%,
    color-mix(in srgb, var(--face) 55%, white) 0,
    var(--face) 45%,
    color-mix(in srgb, var(--face) 62%, black) 100%
  );
}

/* The d-pad's arms draw only an arrow and their press: the plate is their face. */
.pad.arm {
  background: transparent;
  box-shadow: none;
  text-shadow: none;
}

.pad.arm.held {
  transform: none;
  background: linear-gradient(rgb(0 0 0 / 0.32), rgb(0 0 0 / 0.18));
}

.arrow {
  display: block;
  width: 0;
  height: 0;
  border: calc(var(--p-unit) * 5) solid transparent;
  opacity: 0.55;
}

.arm.up .arrow {
  border-bottom-color: var(--text);
  margin-top: calc(var(--p-unit) * -6);
}

.arm.down .arrow {
  border-top-color: var(--text);
  margin-top: calc(var(--p-unit) * 6);
}

.arm.left .arrow {
  border-right-color: var(--text);
  margin-left: calc(var(--p-unit) * -6);
}

.arm.right .arrow {
  border-left-color: var(--text);
  margin-left: calc(var(--p-unit) * 6);
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

/* The shoulders: ribbed, rounded to the hand. */
.shoulder {
  align-items: start;
  padding-top: calc(var(--p-unit) * 4);
  border-radius: calc(var(--p-unit) * 14) calc(var(--p-unit) * 14) 0 0;
  font-size: var(--step--1);
  background:
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 0.06) 0 calc(var(--p-unit) * 1),
      transparent calc(var(--p-unit) * 1) calc(var(--p-unit) * 4)
    ),
    linear-gradient(
      color-mix(in srgb, var(--face) 85%, white),
      var(--face) 50%,
      color-mix(in srgb, var(--face) 70%, black)
    );
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

/* Slots cut through the case: dark inside, a lit lower lip. */
.speaker i {
  width: calc(var(--p-unit) * 5);
  border-radius: calc(var(--p-unit) * 3);
  background: rgb(0 0 0 / 0.45);
  box-shadow:
    inset 0 calc(var(--p-unit) * 2) calc(var(--p-unit) * 2) rgb(0 0 0 / 0.5),
    0 1px 0 rgb(255 255 255 / 0.12);
}
</style>
