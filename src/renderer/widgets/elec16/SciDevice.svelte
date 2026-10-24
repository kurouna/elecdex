<script lang="ts">
import { SCI_KEY_BY_ID } from '@shared/elec16/sci-keys'
import { watchRoom } from '../emu/screen.ts'
import Lcd from './Lcd.svelte'
import type { LcdColours } from './lcd-painter.ts'
import type { BodyMode } from './pane-state.ts'
import type { Elec16Runner } from './runner.svelte.ts'
import {
  faceRuns,
  faceScale,
  facesEm,
  type Rect,
  SCI_SKIN_COLOURS,
  type SciSkin,
  sciFit,
} from './sci-body.ts'

/**
 * SCI-128's body (docs/elec16-sci.md section 8.2), as the agreed mock draws it: the plate with
 * the name and the solar strip, the LCD in its bezel (Lcd.svelte, as the pocket models'), the
 * top keys round the cursor pad, the function keys and the number keys, each with its SHIFT
 * face printed above it on the left and its ALPHA face on the right. Every place comes from
 * sci-body.ts, the LCD at a whole number of device pixels a dot, never stretched. A key is
 * held while the pointer that pressed it is down; ON is the BRK line. The keys never take the
 * focus, so the PC's keyboard goes on reaching the machine.
 */
interface Props {
  runner: Elec16Runner
  mode: BodyMode
  skin: SciSkin
  /** The LCD's colours, read through the theme by the widget (PLAIN's are the theme's). */
  lcdColours: LcdColours
  ghost: boolean
  contrast: number
  seen: boolean
}

const { runner, mode, skin, lcdColours, ghost, contrast, seen }: Props = $props()

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

// The window moved to a screen of another density (or the page zoomed) without a resize: the
// body is fitted again for it. The query names the ratio now, so it fires when that changes.
$effect(() => {
  const ratio = room.ratio
  const query = window.matchMedia?.(`(resolution: ${ratio}dppx)`)
  if (query === undefined) return
  const moved = () => {
    const now = window.devicePixelRatio || 1
    if (now !== room.ratio) room = { ...room, ratio: now }
  }
  query.addEventListener('change', moved)
  return () => query.removeEventListener('change', moved)
})

const layout = $derived(sciFit(room, mode))
const colours = $derived(SCI_SKIN_COLOURS[skin])
const plain = $derived(skin === 'plain')

const place = (r: Rect): string => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`

/** The key each pointer holds, to let go of whatever happens to the pointer. */
const held = new Map<number, number>()
let down = $state<ReadonlySet<string>>(new Set())

function press(event: PointerEvent, id: string): void {
  if (event.button !== 0) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  down = new Set([...down, id])
  if (id === 'on') {
    runner.brk()
    return
  }
  const key = SCI_KEY_BY_ID.get(id)
  if (key === undefined) return
  held.set(event.pointerId, key.code)
  runner.press(key.code)
}

function letGo(event: PointerEvent, id: string): void {
  const code = held.get(event.pointerId)
  held.delete(event.pointerId)
  if (code !== undefined) runner.release(code)
  if (down.has(id)) down = new Set([...down].filter((d) => d !== id))
}

const cap = (id: string): string => (id === 'on' ? 'ON' : (SCI_KEY_BY_ID.get(id)?.cap ?? id))
const shiftFace = (id: string): string =>
  id === 'on' ? 'OFF' : (SCI_KEY_BY_ID.get(id)?.shift ?? '')
const alphaFace = (id: string): string => SCI_KEY_BY_ID.get(id)?.alpha ?? ''
const spoken = (id: string): string =>
  id === 'on' ? 'ON, break' : `${cap(id)}${shiftFace(id) === '' ? '' : `, shift ${shiftFace(id)}`}`

// ---- Fitting the faces over the keys. ----

/** Bumped when the page's faces are ready, so the printing is measured in them. */
let faceRevision = $state(0)
$effect(() => {
  let live = true
  void document.fonts?.ready.then(() => {
    if (live) faceRevision++
  })
  return () => {
    live = false
  }
})

let measurer: CanvasRenderingContext2D | null = null
const widths = new Map<string, number>()
/** A run's width in em, in the UI face at 600 (the mono face at 500), measured once and kept. */
function runEm(text: string, mono: boolean): number {
  const key = `${mono ? 'm' : 'u'}|${text}`
  const kept = widths.get(key)
  if (kept !== undefined) return kept
  measurer ??= document.createElement('canvas').getContext('2d')
  if (measurer === null) return 0
  const css = getComputedStyle(document.documentElement)
  const family = css.getPropertyValue(mono ? '--font-mono' : '--font-ui')
  measurer.font = `${mono ? 500 : 600} 100px ${family}`
  const em = measurer.measureText(text).width / 100
  widths.set(key, em)
  return em
}

/**
 * Each key's faces narrowed sideways, by id, where they would run past their band: on a dense
 * screen at the smallest body the type's floor (--step--2) no longer shrinks with the band.
 */
const squeeze = $derived.by((): ReadonlyMap<string, number> => {
  void faceRevision
  const out = new Map<string, number>()
  if (layout === null) return out
  const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const floor = root * 0.625
  const fontPx = Math.max(floor, 3.4 * layout.unit)
  const raised = Math.max(floor, 0.72 * fontPx) / fontPx
  for (const k of layout.keys) {
    const em = facesEm(shiftFace(k.id), alphaFace(k.id), runEm, raised)
    const scale = faceScale(em, fontPx, k.over.w)
    if (scale < 1) out.set(k.id, scale)
  }
  return out
})

/** The faces' box: the band, or wider and narrowed back into it. */
const facesPlace = (id: string, r: Rect): string => {
  const s = squeeze.get(id)
  if (s === undefined) return place(r)
  return `${place(r)};width:${r.w / s}px;transform:scaleX(${s.toFixed(3)});transform-origin:left`
}

/** The arrows on the pad: which way each points, on a 10 x 10 box. */
const ARROWS: readonly { id: string; turn: number }[] = [
  { id: 'up', turn: 0 },
  { id: 'right', turn: 90 },
  { id: 'down', turn: 180 },
  { id: 'left', turn: 270 },
]
/** Where each end of the pad is, as a share of the pad. */
const PAD_ENDS: Readonly<Record<string, string>> = {
  up: 'left:30%;right:30%;top:0;height:34%',
  down: 'left:30%;right:30%;bottom:0;height:34%',
  left: 'top:26%;bottom:26%;left:0;width:30%',
  right: 'top:26%;bottom:26%;right:0;width:30%',
}
</script>

{#snippet print(text: string)}
  {#each faceRuns(text) as run, i (i)}{#if run.sup}<sup>{run.text}</sup>{:else if run.mono}<span
        class="mono">{run.text}</span
      >{:else}{run.text}{/if}{/each}
{/snippet}

<div class="room" bind:this={host} data-testid="elec16-sci-device">
  {#if layout !== null}
    <div
      class="body"
      class:plain
      class:bare={layout.mode === 'lcd'}
      data-mode={layout.mode}
      data-skin={skin}
      style:width="{layout.width}px"
      style:height="{layout.height}px"
      style:--u="{layout.unit}px"
      style:--case={colours.case}
      style:--case-hi={colours.caseHi}
      style:--case-lo={colours.caseLo}
      style:--print={colours.print}
      style:--plate={colours.plate}
      style:--seam={colours.seam}
      style:--bezel={colours.bezel}
      style:--solar={colours.solar}
      style:--fn-key={colours.fn[0]}
      style:--fn-hi={colours.fn[1]}
      style:--fn-side={colours.fn[2]}
      style:--fn-text={colours.fn[3]}
      style:--num-key={colours.num[0]}
      style:--num-hi={colours.num[1]}
      style:--num-side={colours.num[2]}
      style:--num-text={colours.num[3]}
      style:--shift={colours.shift}
      style:--on-shift={colours.onShift}
      style:--shift-print={colours.shiftPrint}
      style:--alpha={colours.alpha}
      style:--on-alpha={colours.onAlpha}
      style:--alpha-print={colours.alphaPrint}
      style:--warm={colours.warm}
      style:--eq={colours.eq}
      style:--on-eq={colours.onEq}
      style:--e16-bezel={colours.bezel}
      style:--e16-sheen={colours.caseHi}
      style:--e16-radius="{2 * layout.unit}px"
    >
      {#if layout.plate !== null}
        <div class="plate" style={place(layout.plate)}>
          <span class="name">ELEC-16 SCI<small>16-BIT SCIENTIFIC · SCI-128</small></span>
          {#if !plain}<span class="solar" aria-hidden="true"></span>{/if}
        </div>
      {/if}
      <div class="bezel" style={place(layout.glass)}>
        <Lcd
          {runner}
          colours={lcdColours}
          {ghost}
          {contrast}
          {seen}
          scale={layout.scale}
          link={false}
          flat={colours.lcd.flat}
          relief={!colours.lcd.flat}
          glassy={false}
          unlit={colours.lcd.unlit}
          glare={colours.lcd.glare}
        />
      </div>
      {#if layout.seam !== null}
        <div class="seam" style:top="{layout.seam}px" aria-hidden="true"></div>
      {/if}
      {#if layout.pad !== null}
        <div class="pad" style={place(layout.pad)} data-testid="elec16-sci-pad">
          {#each ARROWS as arrow (arrow.id)}
            <button
              type="button"
              class="end"
              class:down={down.has(arrow.id)}
              tabindex="-1"
              style={PAD_ENDS[arrow.id]}
              aria-label={arrow.id}
              onpointerdown={(e) => press(e, arrow.id)}
              onpointerup={(e) => letGo(e, arrow.id)}
              onpointercancel={(e) => letGo(e, arrow.id)}
              onlostpointercapture={(e) => letGo(e, arrow.id)}
              data-testid="elec16-sci-key"
              data-key={arrow.id}
              ><svg viewBox="0 0 10 10" aria-hidden="true"
                ><path d="M2 7 L5 3 L8 7 Z" transform="rotate({arrow.turn} 5 5)" /></svg
              ></button
            >
          {/each}
        </div>
      {/if}
      {#each layout.keys as k (k.id)}
        {#if k.over.h > 0 && (shiftFace(k.id) !== '' || alphaFace(k.id) !== '')}
          <span class="faces" style={facesPlace(k.id, k.over)} aria-hidden="true"
            ><span class="sh">{@render print(shiftFace(k.id))}</span><span class="al"
              >{@render print(alphaFace(k.id))}</span
            ></span
          >
        {/if}
        <button
          type="button"
          class="key {k.block}"
          class:shift={k.id === 'shift'}
          class:alpha={k.id === 'alpha'}
          class:warm={k.id === 'del' || k.id === 'ac'}
          class:eq={k.id === 'eq'}
          class:down={down.has(k.id)}
          tabindex="-1"
          style={place(k.at)}
          aria-label={spoken(k.id)}
          onpointerdown={(e) => press(e, k.id)}
          onpointerup={(e) => letGo(e, k.id)}
          onpointercancel={(e) => letGo(e, k.id)}
          onlostpointercapture={(e) => letGo(e, k.id)}
          data-testid="elec16-sci-key"
          data-key={k.id}><span class="cap">{@render print(cap(k.id))}</span></button
        >
      {/each}
    </div>
  {/if}
</div>

<style>
.room {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.body {
  position: relative;
  border-radius: calc(9 * var(--u)) calc(9 * var(--u)) calc(14 * var(--u)) calc(14 * var(--u));
  background: var(--case);
  box-shadow:
    inset 0 1px 0 var(--case-hi),
    inset 0 -2px 0 var(--case-lo),
    0 calc(8 * var(--u)) calc(16 * var(--u)) calc(-8 * var(--u)) rgb(0 0 0 / 0.8);
  color: var(--print);
  user-select: none;
  touch-action: none;
}

/* PLAIN: elecdex's own look - no moulding, the panel rule, flat keys, the theme's colours. */
.body.plain {
  box-shadow: inset 0 0 0 1px var(--panel-rule);
}

/* The LCD alone: no case round it. */
.body.bare {
  background: none;
  box-shadow: none;
}

.plate {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: max(var(--step--1), calc(8 * var(--u)));
  letter-spacing: 0.06em;
  line-height: 1;
  color: var(--plate);
}

.name small {
  display: block;
  margin-top: calc(1.2 * var(--u));
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: max(var(--step--2), calc(3.6 * var(--u)));
  letter-spacing: 0.2em;
  color: var(--print);
}

.solar {
  width: calc(40 * var(--u));
  height: calc(9 * var(--u));
  border-radius: calc(1.2 * var(--u));
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0 calc(9.6 * var(--u)),
      rgb(0 0 0 / 0.55) calc(9.6 * var(--u)) calc(10 * var(--u))
    ),
    var(--solar);
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.6), 0 1px 0 var(--case-hi);
}

.bezel {
  position: absolute;
}

.seam {
  position: absolute;
  left: calc(8 * var(--u));
  right: calc(8 * var(--u));
  height: 1px;
  background: var(--seam);
}

.key,
.end {
  position: absolute;
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-family: var(--font-ui);
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 40ms,
    box-shadow 40ms;
}

.key {
  border-radius: calc(2 * var(--u)) calc(2 * var(--u)) calc(3.6 * var(--u)) calc(3.6 * var(--u));
  background: var(--fn-key);
  color: var(--fn-text);
  font-size: max(var(--step--2), calc(4.4 * var(--u)));
  box-shadow:
    inset 0 1px 0 var(--fn-hi),
    0 calc(1.2 * var(--u)) 0 var(--fn-side),
    0 calc(2 * var(--u)) calc(2 * var(--u)) rgb(0 0 0 / 0.45);
}

.key.top {
  border-radius: calc(3.6 * var(--u));
  font-size: max(var(--step--2), calc(3.8 * var(--u)));
}

.key.num {
  border-radius: calc(2.4 * var(--u)) calc(2.4 * var(--u)) calc(4 * var(--u)) calc(4 * var(--u));
  background: var(--num-key);
  color: var(--num-text);
  font-size: max(var(--step--1), calc(6 * var(--u)));
  box-shadow:
    inset 0 1px 0 var(--num-hi),
    0 calc(1.2 * var(--u)) 0 var(--num-side),
    0 calc(2 * var(--u)) calc(2 * var(--u)) rgb(0 0 0 / 0.4);
}

.key.shift {
  background: var(--shift);
  color: var(--on-shift);
}

.key.alpha {
  background: var(--alpha);
  color: var(--on-alpha);
}

.key.warm {
  background: var(--warm);
  color: #fff;
}

.key.eq {
  background: var(--eq);
  color: var(--on-eq);
}

/* A press sinks the key: it moves down onto its side, its shadow shrinks. */
.key.down {
  transform: translateY(calc(0.8 * var(--u)));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 calc(0.4 * var(--u)) 0 var(--fn-side);
}

.key sup,
.faces sup {
  font-size: max(var(--step--2), 0.72em);
  line-height: 0;
  vertical-align: 0.5em;
}

/* The prime marks the UI face lacks, in the mono face, which has them. */
.mono {
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: -0.05em;
}

.faces {
  position: absolute;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: max(var(--step--2), calc(3.4 * var(--u)));
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
}

.faces .sh {
  color: var(--shift-print);
}

.faces .al {
  color: var(--alpha-print);
  margin-left: auto;
}

.pad {
  position: absolute;
  border-radius: calc(10 * var(--u));
  background: var(--fn-key);
  box-shadow:
    inset 0 1px 0 var(--fn-hi),
    0 calc(1.2 * var(--u)) 0 var(--fn-side),
    0 calc(2.4 * var(--u)) calc(3 * var(--u)) rgb(0 0 0 / 0.5);
}

.end {
  background: none;
  color: var(--fn-text);
}

.end svg {
  width: calc(3.8 * var(--u));
  height: calc(3.8 * var(--u));
  fill: currentColor;
}

.end.down svg {
  transform: scale(0.85);
  opacity: 0.6;
}

/* PLAIN's keys: flat, outlined by the panel rule, darkened while held. */
.body.plain .key,
.body.plain .pad {
  box-shadow: none;
  outline: 1px solid var(--panel-rule);
  border-radius: 2px;
}

.body.plain .key.shift,
.body.plain .key.alpha,
.body.plain .key.warm {
  outline: 0;
}

.body.plain .key.down {
  transform: none;
  background: var(--accent-faint);
}
</style>
