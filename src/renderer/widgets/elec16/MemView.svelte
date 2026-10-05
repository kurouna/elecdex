<script lang="ts">
import { BANK_SIZE, BANK_WINDOW, XRAM_BANK } from '@shared/elec16/map'
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
 *
 * PLAY-320 has two more memories the address space shows only a window of (docs/elec16-play.md):
 * extended RAM, every bank, named by bank and the address the window shows it at, and the
 * 64 KB of video memory. They are read as they are, not through the bus.
 */
const { runner }: { runner: Elec16Runner } = $props()

type Follow = 'pc' | 'sp' | 'vram' | 'free'
const FOLLOWS: readonly Follow[] = ['pc', 'sp', 'vram', 'free']
const SIZE = 0x10000

type Space = 'cpu' | 'xram' | 'video'
const SPACE_WORDS: Record<Space, string> = { cpu: 'CPU', xram: 'XRAM', video: 'VIDEO' }
/** The memories this machine has: the address space, and PLAY-320's own. */
const spaces = $derived.by((): Space[] => {
  void runner.stepped
  const s = runner.machine?.state
  return [
    'cpu',
    ...(s?.xram.length ? (['xram'] as const) : []),
    ...(s?.video ? (['video'] as const) : []),
  ]
})
let chosen = $state<Space>('cpu')
const space = $derived(spaces.includes(chosen) ? chosen : 'cpu')

/** A memory to read and how far it goes. */
function memory(where: Space): { size: number; read: (a: number) => number } | null {
  const machine = runner.machine
  if (machine === null) return null
  const s = machine.state
  if (where === 'xram') return { size: s.xram.length, read: (a) => s.xram[a] ?? 0 }
  if (where === 'video' && s.video !== null) {
    const mem = s.video.mem
    return { size: mem.length, read: (a) => mem[a] ?? 0 }
  }
  return { size: SIZE, read: (a) => machine.bus.peek(a) }
}

/** A row's address: extended RAM by its bank and where the window shows it, video by V. */
function where(address: number): string {
  if (space === 'xram') {
    return `${hex(XRAM_BANK + Math.floor(address / BANK_SIZE), 2)}:${hex(BANK_WINDOW + (address % BANK_SIZE))}`
  }
  return space === 'video' ? `V:${hex(address)}` : hex(address)
}

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
  // Falling asleep stops the ticks: what was written last is read then.
  void runner.asleep
  const mem = memory(space)
  if (mem === null || mem.size === 0) return null
  // PLAY-320's own memories are only looked through: from their start, where the wheel takes it.
  if (space !== 'cpu') return memoryRows(mem, scrollWindow(top, 0, mem.size))
  const start = follow === 'free' ? scrollWindow(top, 0, SIZE) : windowStart(target(follow), SIZE)
  return memoryRows(mem, start)
})

let before: Map<number, number> | null = null
/** The space `before` was read in: another space's bytes at the same addresses are not a change. */
let beforeIn: Space | null = null
let changed = $state(new Set<number>())
$effect(() => {
  const now = rows
  const inSpace = space
  if (now === null) return
  changed = changedBytes(inSpace === beforeIn ? before : null, now)
  before = byteMap(now)
  beforeIn = inSpace
})

function pickSpace(next: Space): void {
  chosen = next
  top = 0
  follow = next === 'cpu' ? 'pc' : 'free'
}

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
    top = scrollWindow(from, Math.sign(event.deltaY) * 2, memory(space)?.size ?? SIZE)
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
    {#if spaces.length > 1}
      <div class="chips" role="radiogroup" aria-label="memory">
        {#each spaces as m (m)}
          <button
            type="button"
            class="e16-chip"
            role="radio"
            aria-checked={space === m}
            onclick={() => pickSpace(m)}
            data-testid="elec16-mem-space"
            data-space={m}>{SPACE_WORDS[m]}</button
          >
        {/each}
      </div>
    {/if}
    {#if space === 'cpu'}
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
    {/if}
    <div class="grid" bind:this={grid} data-testid="elec16-mem-rows">
      {#each rows as row (row.address)}
        <span class="address">{where(row.address)}</span>
        {#each COLUMNS as k (k)}
          {@const address = row.address + k}
          <span
            class="byte {space === 'cpu' ? byteKind(address) : space === 'xram' ? 'ram' : 'vram'}"
            class:pc={space === 'cpu' && address === pc}
            class:changed={changed.has(address)}>{hex(row.bytes[k] ?? 0, 2)}</span
          >
        {/each}
      {/each}
    </div>
    {#if space === 'cpu'}
    <div class="key">
      <span class="byte ram">RAM</span>
      <span class="byte code">CODE</span>
      <span class="byte rom">ROM</span>
      <span class="byte bank">BANK</span>
      <span class="byte vram">VRAM</span>
      <span class="byte io">I/O</span>
    </div>
    {/if}
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
