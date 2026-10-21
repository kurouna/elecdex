<script lang="ts">
import { MODELS } from '@shared/elec16/map'
import { watchRoom } from '../emu/screen.ts'
import { faceStack } from './faces.ts'
import Keyboard from './Keyboard.svelte'
import Lcd from './Lcd.svelte'
import { type Body, bodyFor, CASE, deviceFit, KEY_GAP } from './layout.ts'
import type { LcdColours } from './lcd-painter.ts'
import type { BodyMode } from './pane-state.ts'
import type { Elec16Runner } from './runner.svelte.ts'
import { deckImage, faceStyle, glassBoards } from './skin-art.ts'
import type { Skin } from './skins.ts'

/**
 * The ELEC-16 itself (docs/elec16.md section 7), as the agreed mock draws it: a case in the
 * skin's colours with its name plate (ELEC-16, 16-BIT POCKET COMPUTER and the POWER lamp;
 * none on the Business skins), the LCD in its bezel and, as the room allows or TUNE says,
 * the whole keyboard, a row of keys, or nothing but the LCD. The case is as high as its
 * parts, never stretched: in a tall pane it stays one body, the room left above and below.
 * The room is read from the observer's entry, never measured inside it.
 *
 * A relief skin is modelled in light (docs/elec16-skins-mock): its material is a picture made
 * once (skin-art.ts), and everything else - chamfer, parting line, the sunk LCD and deck, the
 * lamp's lens, a glass case's rim - is shadows, gradients and pseudo-elements. Nothing moves a
 * size layout.ts computes.
 */
interface Props {
  runner: Elec16Runner
  skin: Skin
  lcdColours: LcdColours
  mode: BodyMode
  ghost: boolean
  contrast: number
  seen: boolean
  /** LINK is on: the LCD shows its mark. */
  link: boolean
}

const { runner, skin, lcdColours, mode, ghost, contrast, seen, link }: Props = $props()

let host = $state<HTMLDivElement | null>(null)
let room = $state({ w: 0, h: 0, ratio: 1 })

// The ratio is read with the size: a window moved to another display changes both.
$effect(() => {
  const el = host
  if (el === null) return
  return watchRoom(el, (next) => {
    const ratio = window.devicePixelRatio || 1
    if (next.w !== room.w || next.h !== room.h || ratio !== room.ratio) room = { ...next, ratio }
  })
})

const model = $derived(MODELS[runner.model])
const body = $derived<Body>(mode === 'auto' ? bodyFor(room, model, skin.body.plateShown) : mode)
const plate = $derived(skin.body.plateShown && body !== 'lcd')
const fit = $derived(deviceFit(room, model, body, plate))
/** The shifted faces' engravings, where a key is wide enough for both. */
const legends = $derived(room.w >= 600)
/** The keyboard's width: the case's less its padding and border. */
const keysWidth = $derived(fit.width - 2 * (CASE.padX + CASE.border))

const b = $derived(skin.body)
const face = $derived(faceStyle(skin))
const deck = $derived(deckImage(skin))
const glassy = $derived(b.texture === 'glass')
const boards = $derived(glassy ? glassBoards() : null)
const keyFace = $derived(faceStack(b.font))
/** The plate's and the marks' face: the skin's own when it prints in one face, else the UI's. */
const printFace = $derived(b.oneFace ? keyFace : 'var(--font-ui)')
/** Thin rules along the plate's foot, 2px each and 2px apart, the first on top. */
const stripes = $derived(
  b.stripes.length === 0
    ? null
    : `linear-gradient(0deg, ${[...b.stripes]
        .reverse()
        .map((c, i) => `${c} ${i * 4}px ${i * 4 + 2}px, transparent ${i * 4 + 2}px ${i * 4 + 4}px`)
        .join(', ')}, transparent ${b.stripes.length * 4}px)`,
)
const grilleHoles = $derived(
  b.grille === 'slits' ? 7 : b.grille === 'pills' ? 6 : b.grille === 'holes' ? 14 : 0,
)
</script>

<div class="fit" bind:this={host}>
  <div
    class="device keys-{b.keys}"
    class:glow={b.glow}
    class:brackets={b.brackets}
    class:bare={b.bare}
    class:relief={b.relief}
    class:glassy
    class:has-deck={b.deck !== null}
    class:etched={b.plateEtched}
    class:gloss={b.gloss}
    class:off={runner.off}
    style:--e16-face={b.face}
    style:--e16-edge={b.edge}
    style:--e16-sheen={b.sheen}
    style:--e16-plate={b.plate}
    style:--e16-print={b.print}
    style:--e16-led={b.led}
    style:--e16-key={b.key}
    style:--e16-key-text={b.keyText}
    style:--e16-key-edge={b.keyEdge}
    style:--e16-fn={b.fnKey}
    style:--e16-fn-text={b.fnText}
    style:--e16-brk={b.brk}
    style:--e16-brk-text={b.brkText}
    style:--e16-enter={b.enter}
    style:--e16-enter-text={b.enterText}
    style:--e16-legend={b.legend}
    style:--e16-bezel={b.bezel}
    style:--e16-pad={b.padKey}
    style:--e16-pad-text={b.padText}
    style:--e16-pad-legend={b.padLegend}
    style:--e16-deck={b.deck?.fill}
    style:--e16-deck-edge={b.deck?.edge}
    style:--e16-deck-image={deck}
    style:--e16-well={b.well}
    style:--e16-shade={b.shade}
    style:--e16-radius="{b.radius}px"
    style:--e16-font={keyFace}
    style:--e16-legend-font={b.oneFace ? keyFace : 'var(--font-mono)'}
    style:--e16-print-font={printFace}
    style:--e16-key-weight={b.keyWeight}
    style:--e16-fn-weight={b.fnWeight}
    style:--e16-key-track={b.keyTrack}
    style:--e16-fn-track={b.fnTrack}
    style:--e16-plate-weight={b.plateWeight}
    style:--e16-plate-track={b.plateTrack}
    style:--e16-key-features={b.keyFeatures}
    style:--e16-board-dark={boards?.dark}
    style:--e16-board-light={boards?.light}
    style:--e16-key-gap="{KEY_GAP}px"
    style:background-image={face?.image}
    style:background-size={face?.size}
    style:background-position={face?.position}
    style:background-repeat={face?.repeat}
    style:width="{fit.width}px"
    style:padding="{CASE.padTop}px {CASE.padX}px {CASE.padBottom}px"
    style:gap="{CASE.gap}px"
    data-testid="elec16-device"
    data-body={body}
    data-skin={skin.id}
  >
    {#if plate}
      <div
        class="plate"
        class:striped={stripes !== null}
        style:height="{CASE.plate}px"
        style:--e16-stripes={stripes}
        data-testid="elec16-plate"
      >
        <span class="brand">ELEC-16</span>
        <span class="model">16-BIT POCKET COMPUTER</span>
        {#if grilleHoles > 0}
          <span class="grille {b.grille}" aria-hidden="true">
            {#each { length: grilleHoles } as _, i (i)}<i></i>{/each}
          </span>
        {/if}
        <span class="power" class:on={!runner.off} data-testid="elec16-power-lamp"><i></i>POWER</span>
      </div>
    {/if}
    <div class="window" style:height="{fit.glass.h}px">
      <Lcd
        {runner}
        colours={lcdColours}
        scale={fit.scale}
        {ghost}
        {contrast}
        {seen}
        {link}
        flat={skin.lcd.flat}
        relief={b.relief}
        {glassy}
        unlit={skin.lcd.unlit}
        glare={skin.lcd.glare}
      />
    </div>
    {#if body !== 'lcd'}
      <Keyboard
        {runner}
        mode={body}
        {legends}
        rowHeight={fit.keyRow}
        big={fit.keyRow >= 32}
        width={keysWidth}
        {skin}
      />
    {/if}
  </div>
</div>

<style>
/* The room: the case sits in it at its own height, in the middle. */
.fit {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.device {
  /* How dark what the case stands on takes its shadow: less on a light ground. */
  --e16-drop: 0.5;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: none;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  border: 1px solid var(--e16-edge);
  border-radius: calc(var(--e16-radius) * 3) calc(var(--e16-radius) * 3) calc(var(--e16-radius) * 4)
    calc(var(--e16-radius) * 4);
  background-color: var(--e16-face);
  font-family: var(--e16-font);
  box-shadow: inset 0 1px 0 var(--e16-sheen);
}

:global(:root[data-mode='light']) .device {
  --e16-drop: 0.22;
}

/* A raised case casts a shadow; the HUD's flat ones do not. */
.device.keys-raised,
.device.keys-plain {
  box-shadow:
    inset 0 1px 0 var(--e16-sheen),
    0 6px 18px rgb(0 0 0 / 0.35);
}

/*
 * Relief: the case modelled in light from above and a little to the left. A chamfer catches
 * it along the top, the lower lip goes dark, and the case stands on the ground with a
 * contact shadow under a soft one, in the skin's own shade.
 */
.device.relief {
  box-shadow:
    inset 0 1px 0 var(--e16-sheen),
    inset 0 2px 1px -1px color-mix(in srgb, var(--e16-sheen) 40%, transparent),
    inset 0 -2px 0 rgb(0 0 0 / 0.16),
    inset 1px 0 0 color-mix(in srgb, var(--e16-sheen) 30%, transparent),
    inset -1px 0 0 rgb(0 0 0 / 0.08),
    0 1px 1px rgb(var(--e16-shade) / calc(var(--e16-drop) * 0.8)),
    0 6px 12px -4px rgb(var(--e16-shade) / calc(var(--e16-drop) * 0.7)),
    0 22px 38px -14px rgb(var(--e16-shade) / var(--e16-drop));
}

/* The parting line, where the front shell meets the case, 3px in from the edge. */
.device.relief:not(.brackets)::after {
  content: '';
  position: absolute;
  inset: 3px;
  pointer-events: none;
  border: 1px solid rgb(0 0 0 / 0.07);
  border-bottom-color: color-mix(in srgb, var(--e16-sheen) 30%, transparent);
  border-radius: calc(var(--e16-radius) * 3 - 3px) calc(var(--e16-radius) * 3 - 3px)
    calc(var(--e16-radius) * 4 - 3px) calc(var(--e16-radius) * 4 - 3px);
}

/*
 * GLASS's colours follow the theme's mode, and its accent is the theme's. Dark glass on a
 * dark theme, light glass on a light one; the board deep inside is the mode's picture too.
 */
.device.glassy {
  --gl-face: rgb(185 210 230 / 0.1);
  --gl-edge: rgb(255 255 255 / 0.3);
  --gl-text: rgb(255 255 255 / 0.93);
  --gl-print: rgb(255 255 255 / 0.58);
  --gl-key: rgb(255 255 255 / 0.11);
  --gl-fn: rgb(255 255 255 / 0.05);
  --gl-legend: color-mix(in oklab, var(--accent) 70%, white);
  --gl-brk: rgb(229 72 77 / 0.82);
  --gl-bezel: rgb(20 24 28 / 0.55);
  --gl-key-core: radial-gradient(ellipse 75% 65% at 50% 45%, rgb(22 28 34 / 0.55), rgb(22 28 34 / 0.25));
  --gl-transmit: 0 14px 24px -12px color-mix(in srgb, var(--accent) 16%, transparent);
  --e16-board: var(--e16-board-dark);
}

:global(:root[data-mode='light']) .device.glassy {
  --gl-face: rgb(255 255 255 / 0.42);
  --gl-edge: rgb(255 255 255 / 0.95);
  --gl-text: rgb(16 22 28 / 0.88);
  --gl-print: rgb(16 22 28 / 0.66);
  --gl-key: rgb(255 255 255 / 0.74);
  --gl-fn: rgb(255 255 255 / 0.5);
  --gl-legend: var(--accent);
  --gl-brk: rgb(200 36 44 / 0.88);
  --gl-bezel: rgb(150 160 172 / 0.5);
  --gl-key-core: radial-gradient(ellipse 75% 65% at 50% 45%, rgb(255 255 255 / 0.82), rgb(255 255 255 / 0.6));
  --gl-transmit: 0 3px 6px -2px rgb(255 255 255 / 0.8);
  --e16-board: var(--e16-board-light);
}

/*
 * A case of clear glass. The rim is three layers - a light line, a dark one inside it, a pale
 * band - and its brightness turns with the light (::before, a conic gradient masked to a
 * 1.5px ring): brightest at the top-left and bottom-right corners. A 1px colour fringe at the
 * sides; on the ground, less shadow and a little transmitted light. Nothing is blurred live.
 */
.device.relief.glassy {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.25),
    inset 0 0 0 2px rgb(0 0 0 / 0.35),
    inset 0 0 16px 3px rgb(160 190 215 / 0.1),
    inset 3px 0 2px -2px rgb(120 200 255 / 0.14),
    inset -3px 0 2px -2px rgb(255 180 110 / 0.12),
    inset 0 3px 14px -4px rgb(255 255 255 / 0.18),
    inset 0 -12px 22px -14px rgb(255 255 255 / 0.16),
    0 1px 1px rgb(0 0 0 / calc(var(--e16-drop) * 0.3)),
    0 16px 32px -16px rgb(0 0 0 / calc(var(--e16-drop) * 0.5)),
    var(--gl-transmit);
}

.device.relief.glassy::before {
  content: '';
  position: absolute;
  inset: -1px;
  padding: 1.5px;
  border-radius: inherit;
  pointer-events: none;
  background: conic-gradient(
    from 215deg,
    rgb(255 255 255 / 0.9),
    rgb(255 255 255 / 0.15) 60deg,
    rgb(255 255 255 / 0.5) 180deg,
    rgb(255 255 255 / 0.12) 250deg,
    rgb(255 255 255 / 0.9)
  );
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}

.device.relief.glassy::after {
  inset: 5px;
  border-color: rgb(255 255 255 / 0.16);
  border-bottom-color: rgb(255 255 255 / 0.07);
  border-right-color: rgb(255 255 255 / 0.07);
}

.device.glow {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--e16-edge) 25%, transparent),
    0 0 18px color-mix(in srgb, var(--e16-edge) 18%, transparent),
    inset 0 0 22px color-mix(in srgb, var(--e16-edge) 6%, transparent);
}

/* No case at all (PLAIN): the screen and the keys stand on the pane's own ground. */
.device.bare {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

/* The HUD's corner brackets, as the pane's own frames have. */
.device.brackets::before,
.device.brackets::after {
  content: '';
  position: absolute;
  width: 0.8rem;
  height: 0.8rem;
  border: 0 solid var(--accent);
  pointer-events: none;
}

.device.brackets::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.device.brackets::after {
  right: -1px;
  bottom: -1px;
  border-width: 0 2px 2px 0;
}

.plate {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  overflow: hidden;
  white-space: nowrap;
}

/* Thin coloured rules along the plate's foot, inside its height. */
.plate.striped {
  background: var(--e16-stripes) bottom / 100% 6px no-repeat;
}

.brand {
  font-family: var(--e16-print-font);
  font-size: var(--step-1);
  font-weight: var(--e16-plate-weight);
  letter-spacing: var(--e16-plate-track);
  line-height: 1;
  color: var(--e16-plate);
}

.model,
.power {
  font-family: var(--e16-print-font);
  font-size: var(--step--2);
  font-weight: 500;
  letter-spacing: 0.18em;
  color: var(--e16-print);
}

/* The plate's letters pressed into the face: a light edge under each. */
.etched .brand,
.etched .model,
.etched .power {
  text-shadow: 0 1px 0 color-mix(in srgb, var(--e16-sheen) 70%, transparent);
}

.glassy .brand {
  text-shadow: 0 1px 0 rgb(255 255 255 / 0.18);
}

.power {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.16em;
}

.grille + .power {
  margin-left: 0;
}

.power i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--e16-print);
  opacity: 0.35;
}

.power.on i {
  background: var(--e16-led);
  opacity: 1;
  box-shadow: 0 0 6px var(--e16-led);
}

/*
 * A relief lamp: a lens in a dark ring set into the case. Off, the lens is dark with a speck
 * of reflected light; on, it glows from its centre out, the speck still on top.
 */
.relief .power i {
  width: 8px;
  height: 8px;
  opacity: 1;
  background:
    radial-gradient(circle at 40% 28%, rgb(255 255 255 / 0.45) 0 0.8px, transparent 1.6px),
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--e16-led) 22%, #1a1a1a) 0%, #0e0f10 100%);
  box-shadow:
    0 0 0 1.5px rgb(0 0 0 / 0.45),
    0 1px 0 1.5px color-mix(in srgb, var(--e16-sheen) 60%, transparent);
}

.relief .power.on i {
  background:
    radial-gradient(circle at 40% 28%, rgb(255 255 255 / 0.9) 0 0.8px, transparent 1.6px),
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--e16-led) 55%, white) 0%,
      var(--e16-led) 45%,
      color-mix(in srgb, var(--e16-led) 60%, black) 100%
    );
  box-shadow:
    0 0 0 1.5px rgb(0 0 0 / 0.45),
    0 1px 0 1.5px color-mix(in srgb, var(--e16-sheen) 60%, transparent),
    0 0 6px 1px color-mix(in srgb, var(--e16-led) 70%, transparent),
    0 0 14px 2px color-mix(in srgb, var(--e16-led) 30%, transparent);
}

/* The buzzer's openings beside POWER, cut into the case. */
.grille {
  align-self: center;
  display: grid;
  gap: 3px;
  margin-left: auto;
  margin-right: 6px;
}

.grille.slits,
.grille.pills {
  grid-auto-flow: column;
}

.grille.slits i {
  width: 2px;
  height: 11px;
  border-radius: 1px;
}

.grille.pills i {
  width: 3px;
  height: 9px;
  border-radius: 1.5px;
}

.grille.holes {
  grid-template-columns: repeat(7, 3px);
}

.grille.holes i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
}

.grille i {
  background: color-mix(in srgb, var(--e16-face) 25%, black);
  box-shadow:
    inset 0 1px 1px rgb(0 0 0 / 0.7),
    0 1px 0 color-mix(in srgb, var(--e16-sheen) 70%, transparent);
}

.glassy .grille i {
  background: rgb(0 0 0 / 0.38);
  box-shadow:
    inset 0 1px 1px rgb(0 0 0 / 0.5),
    0 1px 0 rgb(255 255 255 / 0.32);
}

.window {
  flex: none;
  min-height: 0;
}
</style>
