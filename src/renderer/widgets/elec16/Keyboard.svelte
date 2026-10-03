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
}

const { runner, mode, legends, big }: Props = $props()

/** The key each pointer holds, to let go of whatever happens to the pointer. */
const held = new Map<number, number>()
let down = $state<ReadonlySet<string>>(new Set())

const keyOf = (id: string): MachineKey | undefined => KEY_BY_ID.get(id)

function press(event: PointerEvent, id: string): void {
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
  <div class="keys full" class:big style:--columns={HALF_COLUMNS} data-testid="elec16-keys" data-mode="full">
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
  <div class="keys compact" style:--columns={COMPACT_ROW.length * 2} data-testid="elec16-keys" data-mode="compact">
    {#each COMPACT_ROW as id, k (id)}
      {@render key({ id, span: 2 }, 1 + k * 2)}
    {/each}
  </div>
{/if}

<style>
.keys {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  grid-auto-rows: minmax(22px, 1fr);
  gap: 4px;
  min-height: 0;
}

/* The keyboard takes a little more of the height than the LCD, its keys no taller than
   a finger wants. */
.keys.full {
  flex: 1.2 1 0;
  max-height: 260px;
}

.keys.compact {
  flex: none;
  grid-auto-rows: 28px;
}

.key {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--e16-edge);
  border-radius: var(--e16-radius);
  background: var(--e16-key);
  color: var(--e16-key-text);
  font-family: var(--e16-font);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  line-height: 1;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  overflow: hidden;
}

.big .key {
  font-size: var(--step--1);
}

.big .legend {
  font-size: var(--step--2);
}

.key.fn {
  background: var(--e16-fn);
  color: var(--e16-fn-text);
}

.key:hover {
  border-color: var(--e16-key-text);
}

/* Held: the face turns over, at once and for as long as it is held. */
.key.down {
  background: var(--e16-key-text);
  color: var(--e16-face);
}

.key.fn.down {
  background: var(--e16-fn-text);
  color: var(--e16-fn);
}

.cap {
  white-space: nowrap;
}

.legend {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: var(--step--2);
  color: var(--e16-print);
}
</style>
