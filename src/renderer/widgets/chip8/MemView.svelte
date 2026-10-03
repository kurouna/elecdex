<script lang="ts">
import {
  byteMap,
  changedBytes,
  MEM_COLUMNS,
  type MemRow,
  memoryRows,
  scrollWindow,
  windowStart,
} from '@shared/emu/mem-window'
import { onFrame } from '../../lib/frame-loop.ts'
import { hex } from './core.ts'
import { byteKind, type MemFollow, SPRITE_ROWS, spriteAt } from './mem.ts'
import type { Chip8Runner } from './runner.svelte.ts'

/**
 * MEM (docs/architecture.md section 5.18): the machine's memory, eight bytes a row, round
 * the program counter, round I, or where the wheel took it (FREE). The instruction about to
 * run and the byte at I are marked, the fonts and the program told apart from the rest, and
 * a byte that changed since the last look is lit for a beat. Beside it, the bytes from I
 * drawn as the sprite they would be. Read as CORE is: on the shared 10 fps loop while the
 * program runs, and after each step by hand.
 */
const { runner }: { runner: Chip8Runner } = $props()

const FOLLOWS: readonly MemFollow[] = ['pc', 'i', 'free']

let follow = $state<MemFollow>('pc')
/** The first address shown while FREE. */
let top = $state(0)
let tick = $state(0)
$effect(() => {
  if (runner.status !== 'running') return
  return onFrame(() => {
    tick++
  })
})

interface MemReading {
  rows: MemRow[]
  pc: number
  i: number
  size: number
  sprite: number[]
  programSize: number
}

const reading = $derived.by((): MemReading | null => {
  void tick
  void runner.stepped
  void runner.status
  const machine = runner.machine
  if (machine === null) return null
  const s = machine.state
  const size = s.memory.length
  const start =
    follow === 'free'
      ? Math.min(top, scrollWindow(top, 0, size))
      : windowStart(follow === 'pc' ? s.pc : s.i, size)
  return {
    rows: memoryRows(s.memory, start),
    pc: s.pc,
    i: s.i,
    size,
    sprite: spriteAt(s),
    programSize: runner.rom?.length ?? 0,
  }
})

let before: Map<number, number> | null = null
let changed = $state(new Set<number>())
$effect(() => {
  const now = reading
  if (now === null) return
  changed = changedBytes(before, now.rows)
  before = byteMap(now.rows)
})

function choose(next: MemFollow): void {
  if (next === 'free' && reading !== null) top = reading.rows[0]?.address ?? 0
  follow = next
}

let grid = $state<HTMLElement | null>(null)
// The wheel moves the window, not the panel: a listener that may cancel the scroll.
$effect(() => {
  const el = grid
  if (el === null) return
  const wheel = (event: WheelEvent) => {
    const now = reading
    if (now === null) return
    event.preventDefault()
    const from = follow === 'free' ? top : (now.rows[0]?.address ?? 0)
    top = scrollWindow(from, Math.sign(event.deltaY) * 2, now.size)
    follow = 'free'
  }
  el.addEventListener('wheel', wheel, { passive: false })
  return () => el.removeEventListener('wheel', wheel)
})

const COLUMNS = Array.from({ length: MEM_COLUMNS }, (_, k) => k)
const BITS = [0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01]
const inSprite = (address: number, i: number, size: number): boolean =>
  ((address - i + size) & (size - 1)) < SPRITE_ROWS
</script>

{#if reading !== null}
  <div class="mem" data-testid="chip8-mem">
    <div class="head">
      <div class="chips" role="radiogroup" aria-label="follow">
        {#each FOLLOWS as f (f)}
          <button
            type="button"
            class="c8-chip"
            role="radio"
            aria-checked={follow === f}
            onclick={() => choose(f)}
            data-testid="chip8-mem-follow"
            data-follow={f}>{f === 'pc' ? 'PC' : f === 'i' ? 'I' : 'free'}</button
          >
        {/each}
      </div>
      <span class="size">{(reading.size / 1024).toLocaleString('en-US')} KB</span>
    </div>

    <div class="grid" bind:this={grid} data-testid="chip8-mem-grid" data-start={reading.rows[0]?.address ?? 0}>
      {#each reading.rows as row (row.address)}
        <span class="address">{hex(row.address, 4)}</span>
        {#each COLUMNS as k (k)}
          {@const address = row.address + k}
          <span
            class="byte {byteKind(address, reading.programSize)}"
            class:pc={address === reading.pc || address === reading.pc + 1}
            class:at-i={address === reading.i}
            class:sprite={inSprite(address, reading.i, reading.size)}
            class:changed={changed.has(address)}
            data-address={address}>{hex(row.bytes[k] ?? 0, 2)}</span
          >
        {/each}
      {/each}
    </div>

    <div class="foot">
      <div class="legend">
        <span class="key pc">PC {hex(reading.pc, 4)}</span>
        <span class="key at-i">I {hex(reading.i, 4)}</span>
        <span class="key font">font</span>
        <span class="key program">program</span>
      </div>
      <div class="sprite-box" aria-label="the bytes at I as a sprite" data-testid="chip8-sprite">
        {#each reading.sprite as byte, r (r)}
          {#each BITS as bit (bit)}
            <i class:on={(byte & bit) !== 0}></i>
          {/each}
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
.mem {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.45;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chips {
  display: flex;
  gap: 2px;
}

.size {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.grid {
  display: grid;
  grid-template-columns: auto repeat(8, 1fr);
  gap: 0 0.35em;
  border-top: 1px solid var(--panel-rule);
  padding-top: 2px;
  cursor: ns-resize;
}

.address {
  color: var(--text-muted);
  padding-right: 0.3em;
}

.byte {
  text-align: center;
  color: var(--text-muted);
  opacity: 0.55;
}

.byte.program {
  color: var(--text);
  opacity: 1;
}

.byte.font {
  color: var(--accent);
  opacity: 0.8;
}

.byte.sprite {
  box-shadow: inset 0 -1px 0 var(--accent-dim);
}

.byte.at-i {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
  opacity: 1;
}

.byte.pc {
  color: var(--accent-strong);
  background: var(--accent-faint);
  opacity: 1;
}

/* A byte that changed since the last look: lit for one beat of the reading. */
.byte.changed {
  background: var(--accent);
  color: var(--text-inverse);
  opacity: 1;
}

.foot {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  border-top: 1px solid var(--panel-rule);
  padding-top: var(--space-1);
}

.legend {
  display: grid;
  align-content: start;
  gap: 2px;
}

.key {
  font-size: var(--step--1);
  padding: 0 0.3em;
  justify-self: start;
}

.key.pc {
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.key.at-i {
  color: var(--text);
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

.key.font {
  color: var(--accent);
  font-size: var(--step--2);
}

.key.program {
  color: var(--text);
  font-size: var(--step--2);
}

.sprite-box {
  display: grid;
  grid-template-columns: repeat(8, 6px);
  grid-auto-rows: 6px;
  gap: 1px;
  padding: 2px;
  border: 1px solid var(--panel-rule);
  background: var(--surface-0);
}

.sprite-box i {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.sprite-box i.on {
  background: var(--accent);
}
</style>
