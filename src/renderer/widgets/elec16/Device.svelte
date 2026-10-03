<script lang="ts">
import { MODELS } from '@shared/elec16/map'
import { watchRoom } from '../emu/screen.ts'
import Keyboard from './Keyboard.svelte'
import Lcd from './Lcd.svelte'
import { type Body, bodyFor } from './layout.ts'
import type { LcdColours } from './lcd-painter.ts'
import type { BodyMode } from './pane-state.ts'
import type { Elec16Runner } from './runner.svelte.ts'
import type { Skin } from './skins.ts'

/**
 * The ELEC-16 itself (docs/elec16.md section 7): a case in the skin's colours with the LCD
 * and, as the room allows or TUNE says, the whole keyboard, a row of keys, or nothing but
 * the LCD. The room is read from the observer's entry, never measured inside it.
 */
interface Props {
  runner: Elec16Runner
  skin: Skin
  lcdColours: LcdColours
  mode: BodyMode
  ghost: boolean
  contrast: number
  seen: boolean
}

const { runner, skin, lcdColours, mode, ghost, contrast, seen }: Props = $props()

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
const ratio = $derived(room.ratio)
const body = $derived<Body>(
  mode === 'auto'
    ? bodyFor(room, { w: (model.width * 2) / ratio, h: (model.height * 2) / ratio })
    : mode,
)
/** The shifted faces' engravings, where a key is wide enough for both. */
const legends = $derived(room.w >= 600)

const FONTS = { ui: 'var(--font-ui)', display: 'var(--font-display)', mono: 'var(--font-mono)' }
</script>

<div
  class="device"
  class:glow={skin.body.glow}
  class:brackets={skin.body.brackets}
  bind:this={host}
  style:--e16-face={skin.body.face}
  style:--e16-edge={skin.body.edge}
  style:--e16-print={skin.body.print}
  style:--e16-key={skin.body.key}
  style:--e16-key-text={skin.body.keyText}
  style:--e16-fn={skin.body.fnKey}
  style:--e16-fn-text={skin.body.fnText}
  style:--e16-radius="{skin.body.radius}px"
  style:--e16-font={FONTS[skin.body.font]}
  data-testid="elec16-device"
  data-body={body}
  data-skin={skin.id}
>
  <div class="brand" aria-hidden="true">
    <span class="name">ELEC-16</span>
    <span class="model">{model.id.toUpperCase()}</span>
  </div>
  <div class="window">
    <Lcd {runner} colours={lcdColours} {ghost} {contrast} {seen} />
  </div>
  {#if body !== 'lcd'}
    <Keyboard {runner} mode={body} {legends} big={room.w >= 900 && room.h >= 520} />
  {/if}
</div>

<style>
.device {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: var(--space-2) var(--space-3) var(--space-3);
  border: 1px solid var(--e16-edge);
  border-radius: calc(var(--e16-radius) * 2);
  background: var(--e16-face);
  font-family: var(--e16-font);
}

.device.glow {
  box-shadow:
    0 0 0 1px var(--e16-edge),
    0 0 12px color-mix(in srgb, var(--e16-edge) 45%, transparent);
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

.brand {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--e16-print);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
}

.name {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--e16-key-text);
}

.window {
  flex: 1 1 0;
  min-height: 0;
}
</style>
