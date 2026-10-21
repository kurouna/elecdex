<script lang="ts">
import { KEY_BY_ID, type MachineKey } from '@shared/elec16/keys'
import { capScale, emOf, keyWidth } from './cap-fit.ts'
import { faceFamily, faceReady } from './faces.ts'
import { BRK, COMPACT_ROW, FULL_ROWS, HALF_COLUMNS, KEY_GAP, type KeySlot } from './layout.ts'
import type { Elec16Runner } from './runner.svelte.ts'
import type { Skin } from './skins.ts'

/**
 * The ELEC-16's keys on its body (docs/elec16.md section 7): the whole keyboard, or the one
 * row a compact body keeps. A key is held while the pointer holds it, as KEYMAT reads it;
 * BRK/ON is its own line. The keys never take the focus: the pane keeps it, so the PC's
 * keyboard goes on typing into the machine.
 *
 * The arrows are drawn, not typed: no bundled face has all four (Fontsource's Latin subsets
 * hold ↑ and ↓ but not ← and →), and the system's would differ from key to key. A label wider
 * than its key is narrowed sideways to fit (cap-fit.ts), measured in its face once it is ready.
 */
interface Props {
  runner: Elec16Runner
  mode: 'full' | 'compact'
  /** The shifted faces' small engravings, where the keys have room for them. */
  legends: boolean
  /** Keys big enough for the engravings a step larger. */
  big: boolean
  /** A row's height, in CSS pixels: the device fits it to the body (layout.ts). */
  rowHeight: number
  /** The keyboard's width, in CSS pixels (the case's inside). */
  width: number
  skin: Skin
}

const { runner, mode, legends, big, rowHeight, width, skin }: Props = $props()

/** The key each pointer holds, to let go of whatever happens to the pointer. */
const held = new Map<number, number>()
let down = $state<ReadonlySet<string>>(new Set())

const keyOf = (id: string): MachineKey | undefined => KEY_BY_ID.get(id)

function press(event: PointerEvent, id: string): void {
  // Only the main button presses: a right-click on the machine is PASTE (Elec16Widget).
  if (event.button !== 0) return
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture(event.pointerId)
  down = new Set([...down, id])
  if (id === BRK) {
    runner.brk()
    return
  }
  const key = keyOf(id)
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

/** The arrows' shapes, on a 12 x 10 box: a shaft and an open head. */
const ARROWS: Readonly<Record<string, string>> = {
  left: 'M10.5 5H1.5M5 1.5L1.5 5L5 8.5',
  right: 'M1.5 5H10.5M7 1.5L10.5 5L7 8.5',
  up: 'M6 9V1M2.5 4.5L6 1L9.5 4.5',
  down: 'M6 1V9M2.5 5.5L6 9L9.5 5.5',
}

const label = (id: string): string => (id === BRK ? 'BRK' : (keyOf(id)?.label ?? id))
const legend = (id: string): string => {
  const shifted = keyOf(id)?.shifted ?? 0
  return shifted === 0 ? '' : String.fromCharCode(shifted)
}
/** The keys that are not characters, coloured apart. */
const isFn = (id: string): boolean => id === BRK || (keyOf(id)?.char ?? 0x20) < 0x20
const spoken = (id: string): string => (id === BRK ? 'BRK, ON' : id === ' ' ? 'space' : label(id))

// ---- Fitting the labels. ----

/** Bumped when the skin's face is ready, so labels are measured in it, not its fallback. */
let faceRevision = $state(0)
$effect(() => {
  const b = skin.body
  let live = true
  void faceReady(b.font, [b.keyWeight, b.fnWeight]).then(() => {
    if (live) faceRevision++
  })
  return () => {
    live = false
  }
})

let measurer: CanvasRenderingContext2D | null = null
const widths = new Map<string, number>()
/** A label's width in em at a weight, in the skin's face; measured once and kept. */
function textEm(text: string, weight: number): number {
  const font = `${weight} 100px ${faceFamily(skin.body.font)}`
  const key = `${font}|${text}`
  const kept = widths.get(key)
  if (kept !== undefined) return kept
  measurer ??= document.createElement('canvas').getContext('2d')
  if (measurer === null) return 0
  measurer.font = font
  const em = measurer.measureText(text).width / 100
  widths.set(key, em)
  return em
}

/** The type's size in CSS pixels: --step--2, or --step--1 on big keys (tokens.css's rem). */
const fontPx = $derived.by(() => {
  void width
  const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return root * (big ? 0.75 : 0.625)
})

/** Each key's sideways narrowing, by id: 1 where its label fits. */
const squeeze = $derived.by((): ReadonlyMap<string, number> => {
  void faceRevision
  const b = skin.body
  const out = new Map<string, number>()
  // Only a skin printed in a face of its own: today's skins are drawn as they always were.
  if (!b.oneFace) return out
  const slots: { id: string; span: number; columns: number }[] =
    mode === 'full'
      ? FULL_ROWS.flatMap((row) =>
          [...row.left, ...row.right].map((s) => ({ ...s, columns: HALF_COLUMNS })),
        )
      : COMPACT_ROW.map((id) => ({ id, span: 2, columns: COMPACT_ROW.length * 2 }))
  for (const slot of slots) {
    if (ARROWS[slot.id] !== undefined) continue
    const fn = isFn(slot.id)
    const text = label(slot.id)
    const track = fn ? (b.relief && !big ? 0.01 : emOf(b.fnTrack)) : emOf(b.keyTrack)
    const scale = capScale(
      textEm(text, fn ? b.fnWeight : b.keyWeight),
      track,
      [...text].length,
      fontPx,
      keyWidth(width, slot.columns, KEY_GAP, slot.span),
      b.fitFloor,
    )
    if (scale < 1) out.set(slot.id, scale)
  }
  return out
})
</script>

{#snippet key(slot: KeySlot, column: number, pad: boolean)}
  <button
    type="button"
    class="key"
    class:fn={isFn(slot.id)}
    class:pad={pad && !isFn(slot.id)}
    class:brk={slot.id === BRK}
    class:enter={slot.id === 'enter'}
    class:down={down.has(slot.id)}
    tabindex="-1"
    style:grid-column="{column} / span {slot.span}"
    aria-label={spoken(slot.id)}
    onpointerdown={(e) => press(e, slot.id)}
    onpointerup={(e) => letGo(e, slot.id)}
    onpointercancel={(e) => letGo(e, slot.id)}
    onlostpointercapture={(e) => letGo(e, slot.id)}
    data-testid="elec16-key"
    data-key={slot.id}
  >
    {#if legends && legend(slot.id) !== ''}<span class="legend">{legend(slot.id)}</span>{/if}
    {#if ARROWS[slot.id] !== undefined}
      <span class="cap arrow" aria-hidden="true"
        ><svg viewBox="0 0 12 10"><path d={ARROWS[slot.id]} /></svg></span
      >
    {:else}
      <span
        class="cap"
        style:transform={squeeze.has(slot.id) ? `scaleX(${squeeze.get(slot.id)?.toFixed(3)})` : undefined}
        >{label(slot.id)}</span
      >
    {/if}
  </button>
{/snippet}

{#if mode === 'full'}
  <div
    class="keys full"
    class:big
    style:--columns={HALF_COLUMNS}
    style:grid-auto-rows="{rowHeight}px"
    data-testid="elec16-keys"
    data-mode="full"
  >
    {#each FULL_ROWS as row, r (r)}
      {#each row.left as slot, k (slot.id)}
        {@render key(slot, 1 + row.left.slice(0, k).reduce((sum, s) => sum + s.span, 0), false)}
      {/each}
      {#each row.right as slot, k (slot.id)}
        {@render key(slot, 22 + row.right.slice(0, k).reduce((sum, s) => sum + s.span, 0), true)}
      {/each}
    {/each}
  </div>
{:else}
  <div
    class="keys compact"
    style:--columns={COMPACT_ROW.length * 2}
    style:grid-auto-rows="{rowHeight}px"
    data-testid="elec16-keys"
    data-mode="compact"
  >
    {#each COMPACT_ROW as id, k (id)}
      {@render key({ id, span: 2 }, 1 + k * 2, false)}
    {/each}
  </div>
{/if}

<style>
.keys {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: var(--e16-key-gap);
  flex: none;
  isolation: isolate;
}

/* Each kind of key names its colour once, as --k and --kt; relief draws with them. */
.key {
  --k: var(--e16-key);
  --kt: var(--e16-key-text);
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--e16-key-edge);
  border-radius: var(--e16-radius);
  background: var(--k);
  color: var(--kt);
  font-family: var(--e16-font);
  font-size: var(--step--2);
  font-weight: var(--e16-key-weight);
  letter-spacing: var(--e16-key-track);
  line-height: 1;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  overflow: hidden;
}

.big .key {
  font-size: var(--step--1);
}

.key.fn {
  --k: var(--e16-fn);
  --kt: var(--e16-fn-text);
  font-weight: var(--e16-fn-weight);
  letter-spacing: var(--e16-fn-track);
}

.key.pad {
  --k: var(--e16-pad);
  --kt: var(--e16-pad-text);
}

.key.brk {
  --k: var(--e16-brk);
  --kt: var(--e16-brk-text);
  font-weight: var(--e16-fn-weight);
  letter-spacing: var(--e16-fn-track);
}

.key.enter {
  --k: var(--e16-enter);
  --kt: var(--e16-enter-text);
}

/* A narrow relief body's function labels go without tracking before anything is narrowed. */
:global(.relief) .keys:not(.big) .key.fn,
:global(.relief) .keys:not(.big) .key.brk {
  letter-spacing: 0.01em;
}

/* Raised keys stand on their side and go down when pressed (CLASSIC, IVORY, NIGHT). */
:global(.keys-raised) .key {
  box-shadow: 0 2px 0 var(--e16-key-edge);
}

:global(.keys-raised) .key.down {
  transform: translateY(2px);
  box-shadow: none;
  filter: brightness(1.25);
}

/* Plain rounded keys darken while held, as the Business themes' buttons do. */
:global(.keys-plain) .key.down {
  filter: brightness(0.88);
}

/* Flat tiles blink while held, as every press in elecdex does (ELEC, TRON). */
:global(.keys-flat) .key.down {
  animation: e16-press 100ms linear infinite;
  animation-play-state: var(--ambient-play-state);
}

.key:hover {
  border-color: var(--e16-key-text);
}

.cap {
  white-space: nowrap;
  font-feature-settings: var(--e16-key-features);
  transform-origin: 50% 50%;
}

.cap.arrow svg {
  display: block;
  width: 1.15em;
  height: 0.95em;
  overflow: visible;
}

.cap.arrow path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.35;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* A shifted face, engraved small at the key's corner in the skin's own colour. */
.legend {
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: var(--e16-legend-font);
  font-size: var(--step--2);
  font-weight: 600;
  color: var(--e16-legend);
}

.key.pad .legend {
  color: var(--e16-pad-legend);
}

/*
 * The deck the keys stand on, outside the keys' grid (inset -6px, inside the case's 14px
 * padding and the 8px gap), so no size moves. With relief it is sunk: dark along its top, a
 * lit lip where the case comes up again below it, its own grain.
 */
:global(.has-deck) .keys::before {
  content: '';
  position: absolute;
  inset: -6px;
  z-index: -1;
  background: var(--e16-deck);
  border: 1px solid var(--e16-deck-edge);
  border-radius: calc(var(--e16-radius) * 1.5);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.4);
}

:global(.relief.has-deck) .keys::before {
  background: var(--e16-deck-image, none) var(--e16-deck);
  box-shadow:
    inset 0 3px 5px -1px rgb(0 0 0 / 0.55),
    inset 0 -1px 0 rgb(255 255 255 / 0.05),
    0 -1px 0 rgb(0 0 0 / 0.3),
    0 1px 0 color-mix(in srgb, var(--e16-sheen) 85%, transparent);
}

/*
 * Relief's raised keys: a cap with a lit upper edge and a face that darkens towards its foot,
 * its side below it and its shadow on the deck. Held, it goes down by its side's height, the
 * shadow gone, the face in its own shade - a key does not light up.
 */
:global(.relief.keys-raised) .key {
  border-color: color-mix(in srgb, var(--e16-key-edge) 75%, black);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--k) 93%, white) 0%,
    var(--k) 40%,
    var(--k) 64%,
    color-mix(in srgb, var(--k) 89%, black) 100%
  );
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.2),
    inset 0 -1px 0 rgb(0 0 0 / 0.1),
    0 2px 0 var(--e16-key-edge),
    0 3px 3px rgb(0 0 0 / 0.38);
}

:global(.relief.keys-raised) .key:hover {
  border-color: color-mix(in srgb, var(--e16-key-edge) 75%, black);
}

:global(.relief.keys-raised) .key.down {
  transform: translateY(2px);
  filter: none;
  background: color-mix(in srgb, var(--k) 90%, black);
  box-shadow:
    inset 0 2px 3px rgb(0 0 0 / 0.35),
    0 1px 1px rgb(0 0 0 / 0.3);
}

/*
 * Chiclet keys (NEO, MOCHI): a low cap set in its own cut in the case - the hole's upper side
 * in shade - nearly flat on top. Held, it goes down a pixel and greys.
 */
:global(.keys-chiclet) .key {
  border-color: transparent;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--k) 95%, white) 0%,
    var(--k) 55%,
    color-mix(in srgb, var(--k) 96%, black) 100%
  );
  box-shadow:
    0 -1px 0 1.5px rgb(var(--e16-shade) / 0.1),
    0 0 0 1.5px var(--e16-well),
    inset 0 1px 0 rgb(255 255 255 / 0.45),
    inset 0 -1px 0 rgb(0 0 0 / 0.05),
    0 1px 0 var(--e16-key-edge),
    0 2px 2px rgb(var(--e16-shade) / 0.08);
}

:global(.keys-chiclet) .key:hover {
  border-color: transparent;
}

:global(.keys-chiclet) .key.down {
  transform: translateY(1px);
  background: color-mix(in srgb, var(--k) 94%, black);
  box-shadow:
    0 -1px 0 1.5px rgb(var(--e16-shade) / 0.1),
    0 0 0 1.5px var(--e16-well),
    inset 0 1px 2px rgb(var(--e16-shade) / 0.18);
}

/* A sugar-glaze highlight on each key's upper third (MOCHI). */
:global(.gloss) .key::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(ellipse 60% 40% at 50% 0%, rgb(255 255 255 / 0.38), transparent);
}

:global(.gloss.keys-chiclet) .key {
  box-shadow:
    0 -1px 0 1.5px rgb(var(--e16-shade) / 0.1),
    0 0 0 1.5px var(--e16-well),
    inset 0 1px 0 rgb(255 255 255 / 0.7),
    inset 0 -1px 0 rgb(var(--e16-shade) / 0.06),
    0 1px 0 var(--e16-key-edge),
    0 2px 3px rgb(var(--e16-shade) / 0.1);
}

/*
 * Glass keys (GLASS): capsules of glass on the case - a core that hides the board behind the
 * letters, light at the top fading down, a bright upper rim and a fainter lower one. ENTER is
 * glass tinted by the theme's accent, its rim lit in it. Held, a key goes down and shades.
 */
:global(.keys-glass) .key {
  border: 1px solid rgb(255 255 255 / 0.3);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.22) 0%, rgb(255 255 255 / 0.06) 48%, rgb(255 255 255 / 0.02) 100%),
    var(--gl-key-core),
    var(--k);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.55),
    inset 0 -1px 0 rgb(255 255 255 / 0.14),
    inset 0 0 8px rgb(255 255 255 / 0.05),
    0 1px 2px rgb(0 0 0 / 0.16),
    0 6px 12px -6px rgb(0 0 0 / 0.28);
}

:global(.keys-glass) .key.enter,
:global(.keys-glass) .key.brk {
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.22) 0%, rgb(255 255 255 / 0.06) 48%, rgb(255 255 255 / 0.02) 100%),
    var(--k);
}

:global(.keys-glass) .key.enter {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--accent) 70%, transparent),
    inset 0 0 10px color-mix(in srgb, var(--accent) 30%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 0.55),
    0 1px 2px rgb(0 0 0 / 0.16),
    0 6px 12px -6px rgb(0 0 0 / 0.28);
}

:global(.keys-glass) .key:hover {
  border-color: rgb(255 255 255 / 0.55);
}

/* Light glass; a held key and ENTER keep their own shadows (below). */
:global(:root[data-mode='light'] .keys-glass) .key:not(.down):not(.enter) {
  border-color: rgb(255 255 255 / 0.9);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.95),
    inset 0 -1px 0 rgb(255 255 255 / 0.4),
    0 1px 2px rgb(0 0 0 / 0.08),
    0 6px 12px -6px rgb(0 0 0 / 0.16);
}

:global(:root[data-mode='light'] .keys-glass) .key:hover {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 0.95),
    0 6px 12px -6px rgb(0 0 0 / 0.16);
}

/* Held, the core stays: the board is not seen through a pressed key's letters either. */
:global(.keys-glass) .key.down {
  transform: translateY(1px);
  background: linear-gradient(180deg, rgb(0 0 0 / 0.1), rgb(0 0 0 / 0)), var(--gl-key-core), var(--k);
  box-shadow:
    inset 0 1px 3px rgb(0 0 0 / 0.28),
    inset 0 -1px 0 rgb(255 255 255 / 0.18),
    0 0 1px rgb(0 0 0 / 0.2);
}

/* The homing bumps on F, J and the keypad's 5: a short ridge low on the cap. */
:global(.relief) .key[data-key='f']::after,
:global(.relief) .key[data-key='j']::after,
:global(.relief) .key[data-key='5']::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 4px;
  width: 6px;
  height: 1px;
  margin-left: -3px;
  border-radius: 1px;
  background: rgb(0 0 0 / 0.2);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.16);
}
</style>
