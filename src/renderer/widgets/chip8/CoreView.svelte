<script lang="ts">
import { untrack } from 'svelte'
import { onFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  BOOT_CHARS_A_FRAME,
  bootLine,
  type CoreReading,
  changedRegisters,
  hex,
  readCore,
} from './core.ts'
import type { Chip8Runner } from './runner.svelte.ts'

/**
 * CORE (docs/architecture.md section 5.18): the machine's registers, stack and the code
 * round the program counter. It reads the machine on the shared 10 fps loop while the
 * program runs - never at the game's 60 - and after each step by hand; a register that
 * just changed is marked for a beat. Paused, STEP runs one instruction and FRAME a frame.
 *
 * Above them, the boot line: typed on the same loop when a program is loaded while CORE is
 * open, and shown whole when CORE opens on one already running (a remount types nothing).
 */
const { runner }: { runner: Chip8Runner } = $props()

let tick = $state(0)
$effect(() => {
  if (runner.status !== 'running') return
  return onFrame(() => {
    tick++
  })
})

let before: number[] | null = null
const reading = $derived.by((): CoreReading | null => {
  void tick
  void runner.stepped
  void runner.status
  const machine = runner.machine
  return machine === null ? null : readCore(machine.state)
})

let changed = $state(new Set<number>())
$effect(() => {
  const now = reading
  if (now === null) return
  changed = changedRegisters(before, now.v)
  before = now.v
})

const REGISTERS = Array.from({ length: 16 }, (_, k) => k)

const boot = $derived.by(() => {
  void runner.loads
  const machine = runner.machine
  const rom = runner.rom
  if (machine === null || rom === null) return ''
  return untrack(() =>
    bootLine({
      size: rom.length,
      quirks: machine.state.config.quirks,
      resumed: runner.resumed,
      pc: machine.state.pc,
    }),
  )
})
/** How much of the boot line shows; whole unless a load is being typed. */
let typed = $state(Number.POSITIVE_INFINITY)
let loadsSeen = untrack(() => runner.loads)
$effect(() => {
  const loads = runner.loads
  if (loads === loadsSeen) return
  loadsSeen = loads
  // Read once, not followed: a change of the setting mid-line must not end the typing
  // halfway (the effect's cleanup would stop it and leave the caret).
  if (untrack(() => appearance.reducedMotion)) return
  typed = 0
  const stop = onFrame(() => {
    typed += BOOT_CHARS_A_FRAME
    if (typed >= boot.length) {
      typed = Number.POSITIVE_INFINITY
      stop()
    }
  })
  return stop
})
</script>

{#if reading !== null}
  <div class="core" data-testid="chip8-core">
    <div class="boot" data-testid="chip8-boot" data-line={boot}>
      {boot.slice(0, typed)}{#if typed < boot.length}<span class="caret">▌</span>{/if}
    </div>
    <div class="registers">
      {#each REGISTERS as k (k)}
        <span class="name">V{k.toString(16).toUpperCase()}</span>
        <span class="value" class:changed={changed.has(k)} data-testid="chip8-register" data-register={k}
          >{hex(reading.v[k] ?? 0, 2)}</span
        >
      {/each}
    </div>
    <div class="line">
      <span class="name">I</span><span class="value">{hex(reading.i, 4)}</span>
      <span class="name">PC</span><span class="value" data-testid="chip8-pc">{hex(reading.pc, 3)}</span>
      <span class="name">SP</span><span class="value">{reading.sp}</span>
      <span class="name">DT</span><span class="value">{hex(reading.dt, 2)}</span>
      <span class="name">ST</span><span class="value">{hex(reading.st, 2)}</span>
    </div>
    <div class="line stack">
      <span class="name">STACK</span>
      <span class="value">{reading.stack.length === 0 ? '—' : reading.stack.map((a) => hex(a, 3)).join(' ')}</span>
    </div>
    <ol class="code" data-testid="chip8-code">
      {#each reading.lines as line (line.address)}
        <li class:current={line.current} class:fault={line.current && runner.status === 'halted'}>
          <span class="mark" aria-hidden="true">{line.current ? '▸' : ''}</span>
          <span class="address">{hex(line.address, 3)}</span>
          <span class="op">{hex(line.op, 4)}</span>
          <span class="text">{line.text}</span>
        </li>
      {/each}
    </ol>
    <div class="foot">
      <!-- The count moves every look while it runs, and repainted the panel ten times a second
           for a number nobody reads then: running, the speed; stopped, the count. -->
      <span class="cycles" data-testid="chip8-cycles" data-cycles={reading.cycles}
        >{runner.status === 'running'
          ? `${runner.machine?.state.config.ipf ?? 0} a frame`
          : `${reading.cycles.toLocaleString('en-US')} cycles`}</span
      >
      {#if runner.status === 'paused'}
        <span class="steps">
          <button type="button" class="c8-btn" onclick={() => runner.stepInstruction()} data-testid="chip8-step"
            >step ▸</button
          >
          <button
            type="button"
            class="c8-btn"
            title="one frame (Enter)"
            onclick={() => runner.stepFrame()}
            data-testid="chip8-frame">frame ▸▸</button
          >
        </span>
      {/if}
    </div>
  </div>
{/if}

<style>
.core {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.45;
}

.boot {
  min-height: 1.45em;
  color: var(--accent-strong);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.caret {
  color: var(--accent);
}

.steps {
  display: flex;
  gap: 2px;
}

.registers {
  display: grid;
  grid-template-columns: repeat(4, auto 1fr);
  gap: 0 var(--space-1);
}

.name {
  color: var(--text-muted);
}

.value {
  color: var(--text);
  justify-self: start;
  padding: 0 1px;
}

/* A register that changed since the last look: marked for one beat of the reading. */
.value.changed {
  background: var(--accent);
  color: var(--text-inverse);
}

.line {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-1);
}

.line .value {
  margin-right: var(--space-1);
}

.stack .value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--panel-rule);
  padding-top: 2px;
}

.code li {
  display: grid;
  grid-template-columns: 1ch 3.5ch 4.5ch 1fr;
  gap: var(--space-1);
  color: var(--text-muted);
  white-space: nowrap;
}

.code .text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.code li.current {
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.code li.fault {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 14%, transparent);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.cycles {
  color: var(--text-muted);
  font-size: var(--step--2);
}
</style>
