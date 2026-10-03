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
import { byteKind, hex } from './core.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * MEM (docs/elec16.md section 7): the 64 KB address space eight bytes a row, round the
 * program counter, the stack, the video memory or where the wheel took it (FREE). RAM, the
 * code area, ROM, the bank window, video memory and I/O are told apart, and a byte that
 * changed since the last look is lit. Read through the bus's peek, so looking at the key
 * register never takes a key; on the shared 10 fps loop only while the machine runs awake.
 */
const { runner }: { runner: Elec16Runner } = $props()

type Follow = 'pc' | 'sp' | 'vram' | 'free'
const FOLLOWS: readonly Follow[] = ['pc', 'sp', 'vram', 'free']
const SIZE = 0x10000

let follow = $state<Follow>('pc')
let top = $state(0)
let tick = $state(0)
$effect(() => {
  if (runner.status !== 'running' || runner.asleep) return
  return onFrame(() => {
    tick++
  })
})

const target = (f: Follow): number => {
  const s = runner.machine?.state
  if (s === undefined) return 0
  if (f === 'pc') return s.pc
  if (f === 'sp') return s.regs[2] ?? 0
  return 0xe000
}

const rows = $derived.by((): MemRow[] | null => {
  void tick
  void runner.stepped
  void runner.status
  const machine = runner.machine
  if (machine === null) return null
  const start = follow === 'free' ? scrollWindow(top, 0, SIZE) : windowStart(target(follow), SIZE)
  return memoryRows({ size: SIZE, read: (a) => machine.bus.peek(a) }, start)
})

let before: Map<number, number> | null = null
let changed = $state(new Set<number>())
$effect(() => {
  const now = rows
  if (now === null) return
  changed = changedBytes(before, now)
  before = byteMap(now)
})

function choose(next: Follow): void {
  if (next === 'free') top = rows?.[0]?.address ?? 0
  follow = next
}

let grid = $state<HTMLElement | null>(null)
// The wheel moves the window, not the panel: a listener that may cancel the scroll.
$effect(() => {
  const el = grid
  if (el === null) return
  const wheel = (event: WheelEvent) => {
    event.preventDefault()
    const from = follow === 'free' ? top : (rows?.[0]?.address ?? 0)
    top = scrollWindow(from, Math.sign(event.deltaY) * 2, SIZE)
    follow = 'free'
  }
  el.addEventListener('wheel', wheel, { passive: false })
  return () => el.removeEventListener('wheel', wheel)
})

const COLUMNS = Array.from({ length: MEM_COLUMNS }, (_, k) => k)
const pc = $derived.by(() => {
  void rows
  return runner.machine?.state.pc ?? -1
})
</script>

{#if rows !== null}
  <div class="mem" data-testid="elec16-mem">
    <div class="chips" role="radiogroup" aria-label="follow">
      {#each FOLLOWS as f (f)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={follow === f}
          onclick={() => choose(f)}
          data-testid="elec16-mem-follow"
          data-follow={f}>{f.toUpperCase()}</button
        >
      {/each}
    </div>
    <div class="grid" bind:this={grid} data-testid="elec16-mem-rows">
      {#each rows as row (row.address)}
        <span class="address">{hex(row.address)}</span>
        {#each COLUMNS as k (k)}
          {@const address = row.address + k}
          <span
            class="byte {byteKind(address)}"
            class:pc={address === pc}
            class:changed={changed.has(address)}>{hex(row.bytes[k] ?? 0, 2)}</span
          >
        {/each}
      {/each}
    </div>
    <div class="key">
      <span class="byte ram">RAM</span>
      <span class="byte code">CODE</span>
      <span class="byte rom">ROM</span>
      <span class="byte bank">BANK</span>
      <span class="byte vram">VRAM</span>
      <span class="byte io">I/O</span>
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
  line-height: 1.4;
}

.chips {
  display: flex;
  gap: 2px;
}

.grid {
  display: grid;
  grid-template-columns: auto repeat(8, 1fr);
  gap: 0 0.5ch;
}

.address {
  color: var(--text-muted);
}

.byte.ram {
  color: var(--text);
}

.byte.code {
  color: var(--accent-strong);
}

.byte.rom,
.byte.bank {
  color: var(--text-muted);
}

.byte.vram {
  color: var(--info, var(--accent));
}

.byte.io,
.byte.none {
  color: var(--warn);
}

.byte.pc {
  outline: 1px solid var(--accent);
}

.byte.changed {
  background: var(--accent-faint);
}

.key {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-2);
  font-size: var(--step--2);
}
</style>
