<script lang="ts">
import { onFrame } from '../../lib/frame-loop.ts'
import { type CoreReading, changedRegisters, hex, REGISTER_NAMES, readCore } from './core.ts'
import type { Elec16Runner } from './runner.svelte.ts'

/**
 * CORE (docs/elec16.md section 7): the sixteen registers by their ABI names, the trap CSRs,
 * and the code from the program counter, named by the ROM's labels. Read on the shared
 * 10 fps loop while the machine runs awake - never at its own rate, and not at all while it
 * sleeps - and after anything done by hand; a register that just changed is marked.
 * Paused, STEP runs one instruction.
 */
const { runner, labels }: { runner: Elec16Runner; labels: ReadonlyMap<number, string> } = $props()

let tick = $state(0)
$effect(() => {
  if (runner.status !== 'running' || runner.asleep) return
  return onFrame(() => {
    tick++
  })
})

let before: number[] | null = null
const reading = $derived.by((): CoreReading | null => {
  void tick
  void runner.stepped
  void runner.status
  void runner.asleep
  const machine = runner.machine
  return machine === null ? null : readCore(machine, labels)
})

let changed = $state(new Set<number>())
$effect(() => {
  const now = reading
  if (now === null) return
  changed = changedRegisters(before, now.regs)
  before = now.regs
})
</script>

{#if reading !== null}
  <div class="core" data-testid="elec16-core">
    <div class="registers">
      <span class="name">pc</span>
      <span class="value" data-testid="elec16-pc">{hex(reading.pc)}</span>
      {#each REGISTER_NAMES as name, k (name)}
        {#if k > 0}
          <span class="name">{name}</span>
          <span class="value" class:changed={changed.has(k)} data-testid="elec16-register" data-register={name}
            >{hex(reading.regs[k] ?? 0)}</span
          >
        {/if}
      {/each}
    </div>
    <div class="registers csr">
      {#each reading.csr as csr (csr.name)}
        <span class="name">{csr.name}</span><span class="value">{hex(csr.value)}</span>
      {/each}
    </div>
    <ol class="code" data-testid="elec16-code">
      {#each reading.lines as line (line.address)}
        {#if line.label !== null}
          <li class="label">{line.label}:</li>
        {/if}
        <li class:current={line.current}>
          <span class="mark" aria-hidden="true">{line.current ? '▸' : ''}</span>
          <span class="address">{hex(line.address)}</span>
          <span class="bytes">{line.bytes}</span>
          <span class="text">{line.text}</span>
        </li>
      {/each}
    </ol>
    <div class="foot">
      <!-- The counts move every look while it runs: shown when it stands still. -->
      <span class="count" data-testid="elec16-instret">
        {runner.status === 'running' && !runner.asleep
          ? 'running'
          : `${reading.instret.toLocaleString('en-US')} instructions`}
      </span>
      {#if runner.status === 'paused'}
        <button type="button" class="e16-btn" onclick={() => runner.step()} data-testid="elec16-step">step ▸</button>
      {/if}
    </div>
  </div>
{/if}

<style>
.core {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.45;
}

.registers {
  display: grid;
  grid-template-columns: repeat(4, auto 1fr);
  gap: 0 var(--space-1);
}

.registers.csr {
  grid-template-columns: repeat(3, auto 1fr);
}

.name {
  color: var(--text-muted);
}

.value {
  color: var(--text);
}

.value.changed {
  color: var(--accent-strong);
}

.code {
  list-style: none;
  margin: 0;
  padding: 0;
}

.code li {
  display: grid;
  grid-template-columns: 1ch 4ch 8ch 1fr;
  gap: var(--space-1);
  white-space: nowrap;
  color: var(--text-muted);
}

.code li.label {
  display: block;
  color: var(--accent);
}

.code li.current {
  color: var(--accent-strong);
}

.text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--text-muted);
}
</style>
