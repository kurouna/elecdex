<script lang="ts">
import { KEY_BY_ID, type MachineKey } from '@shared/elec16/keys'
import { BRK, COMPACT_ROW, FULL_ROWS, HALF_COLUMNS, type KeySlot } from './layout.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * The ELEC-16's keys on its body (docs/elec16.md section 7): the whole keyboard, or the one
 * row a compact body keeps. A key is held while the pointer holds it, as KEYMAT reads it;
 * BRK/ON is its own line. The keys never take the focus: the pane keeps it, so the PC's
 * keyboard goes on typing into the machine.
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
}

const { runner, mode, legends, big, rowHeight }: Props = $props()

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

const label = (id: string): string => (id === BRK ? 'BRK' : (keyOf(id)?.label ?? id))
const legend = (id: string): string => {
  const shifted = keyOf(id)?.shifted ?? 0
  return shifted === 0 ? '' : String.fromCharCode(shifted)
}
/** The keys that are not characters, coloured apart. */
const isFn = (id: string): boolean => id === BRK || (keyOf(id)?.char ?? 0x20) < 0x20
const spoken = (id: string): string => (id === BRK ? 'BRK, ON' : id === ' ' ? 'space' : label(id))
</script>

{#snippet key(slot: KeySlot, column: number)}
  <button
    type="button"
    class="key"
    class:fn={isFn(slot.id)}
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
    <span class="cap">{label(slot.id)}</span>
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
        {@render key(slot, 1 + row.left.slice(0, k).reduce((sum, s) => sum + s.span, 0))}
      {/each}
      {#each row.right as slot, k (slot.id)}
        {@render key(slot, 22 + row.right.slice(0, k).reduce((sum, s) => sum + s.span, 0))}
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
      {@render key({ id, span: 2 }, 1 + k * 2)}
    {/each}
  </div>
{/if}

<style>
.keys {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  gap: var(--e16-key-gap);
  flex: none;
}

.key {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--e16-key-edge);
  border-radius: var(--e16-radius);
  background: var(--e16-key);
  color: var(--e16-key-text);
  font-family: var(--e16-font);
  font-size: var(--step--2);
  font-weight: 600;
  letter-spacing: 0.04em;
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
  background: var(--e16-fn);
  color: var(--e16-fn-text);
  letter-spacing: 0.1em;
}

.key.brk {
  background: var(--e16-brk);
  color: var(--e16-brk-text);
  letter-spacing: 0.1em;
}

.key.enter {
  background: var(--e16-enter);
  color: var(--e16-enter-text);
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
}

/* A shifted face, engraved small at the key's corner in the skin's own colour. */
.legend {
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-weight: 600;
  color: var(--e16-legend);
}
</style>
