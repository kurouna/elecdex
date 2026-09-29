<script lang="ts">
import { onFrame } from '../../lib/frame-loop.ts'
import { type CoreReading, changedRegisters, hex, readCore } from './core.ts'
import type { Chip8Runner } from './runner.svelte.ts'

/**
 * CORE (docs/architecture.md section 5.18): the machine's registers, stack and the code
 * round the program counter. It reads the machine on the shared 10 fps loop while the
 * program runs - never at the game's 60 - and after each step by hand; a register that
 * just changed is marked for a beat. Paused, STEP runs one instruction.
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
</script>

{#if reading !== null}
  <div class="core" data-testid="chip8-core">
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
        <button type="button" class="c8-btn" onclick={() => runner.stepInstruction()} data-testid="chip8-step"
          >step ▸</button
        >
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
