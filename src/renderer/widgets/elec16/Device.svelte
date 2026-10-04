<script lang="ts">
import { MODELS } from '@shared/elec16/map'
import { watchRoom } from '../emu/screen.ts'
import Keyboard from './Keyboard.svelte'
import Lcd from './Lcd.svelte'
import { type Body, bodyFor, CASE, deviceFit, KEY_GAP } from './layout.ts'
import type { LcdColours } from './lcd-painter.ts'
import type { BodyMode } from './pane-state.ts'
import type { Elec16Runner } from './runner.svelte.ts'
import type { Skin } from './skins.ts'

/**
 * The ELEC-16 itself (docs/elec16.md section 7), as the agreed mock draws it: a case in the
 * skin's colours with its name plate (ELEC-16, 16-BIT POCKET COMPUTER and the POWER lamp;
 * none on the Business skins), the LCD in its bezel and, as the room allows or TUNE says,
 * the whole keyboard, a row of keys, or nothing but the LCD. The case is as high as its
 * parts, never stretched: in a tall pane it stays one body, the room left above and below.
 * The room is read from the observer's entry, never measured inside it.
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

const FONTS = { ui: 'var(--font-ui)', display: 'var(--font-display)', mono: 'var(--font-mono)' }
</script>

<div class="fit" bind:this={host}>
  <div
    class="device keys-{skin.body.keys}"
    class:glow={skin.body.glow}
    class:brackets={skin.body.brackets}
    class:off={runner.off}
    style:--e16-face={skin.body.face}
    style:--e16-edge={skin.body.edge}
    style:--e16-sheen={skin.body.sheen}
    style:--e16-plate={skin.body.plate}
    style:--e16-print={skin.body.print}
    style:--e16-led={skin.body.led}
    style:--e16-key={skin.body.key}
    style:--e16-key-text={skin.body.keyText}
    style:--e16-key-edge={skin.body.keyEdge}
    style:--e16-fn={skin.body.fnKey}
    style:--e16-fn-text={skin.body.fnText}
    style:--e16-brk={skin.body.brk}
    style:--e16-brk-text={skin.body.brkText}
    style:--e16-enter={skin.body.enter}
    style:--e16-enter-text={skin.body.enterText}
    style:--e16-legend={skin.body.legend}
    style:--e16-bezel={skin.body.bezel}
    style:--e16-radius="{skin.body.radius}px"
    style:--e16-font={FONTS[skin.body.font]}
    style:--e16-key-gap="{KEY_GAP}px"
    style:width="{fit.width}px"
    style:padding="{CASE.padTop}px {CASE.padX}px {CASE.padBottom}px"
    style:gap="{CASE.gap}px"
    data-testid="elec16-device"
    data-body={body}
    data-skin={skin.id}
  >
    {#if plate}
      <div class="plate" style:height="{CASE.plate}px" data-testid="elec16-plate">
        <span class="brand">ELEC-16</span>
        <span class="model">16-BIT POCKET COMPUTER</span>
        <span class="power" class:on={!runner.off} data-testid="elec16-power-lamp"><i></i>POWER</span>
      </div>
    {/if}
    <div class="window" style:height="{fit.glass.h}px">
      <Lcd {runner} colours={lcdColours} scale={fit.scale} {ghost} {contrast} {seen} {link} />
    </div>
    {#if body !== 'lcd'}
      <Keyboard {runner} mode={body} {legends} rowHeight={fit.keyRow} big={fit.keyRow >= 32} />
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
  background: var(--e16-face);
  font-family: var(--e16-font);
  box-shadow: inset 0 1px 0 var(--e16-sheen);
}

/* A raised case casts a shadow; the HUD's flat ones do not. */
.device.keys-raised,
.device.keys-plain {
  box-shadow:
    inset 0 1px 0 var(--e16-sheen),
    0 6px 18px rgb(0 0 0 / 0.35);
}

.device.glow {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--e16-edge) 25%, transparent),
    0 0 18px color-mix(in srgb, var(--e16-edge) 18%, transparent),
    inset 0 0 22px color-mix(in srgb, var(--e16-edge) 6%, transparent);
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

.brand {
  font-family: var(--font-ui);
  font-size: var(--step-1);
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1;
  color: var(--e16-plate);
}

.model,
.power {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 500;
  letter-spacing: 0.18em;
  color: var(--e16-print);
}

.power {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.16em;
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

.window {
  flex: none;
  min-height: 0;
}
</style>
