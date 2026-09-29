<script lang="ts">
import {
  CHIP8_SLOTS,
  type Chip8Program,
  type Chip8Slot,
  type Chip8SlotInfo,
} from '@shared/chip8-library'
import { sfx } from '../../stores/sound.svelte.ts'
import { whenWords } from './labels.ts'
import type { Palette } from './palette.ts'
import type { Chip8Runner } from './runner.svelte.ts'
import Thumb from './Thumb.svelte'

/**
 * SAVE (docs/architecture.md section 5.18): the program's kept machines - three slots the
 * player writes and AUTO, which the pane writes itself when it goes back to the library or
 * out of sight - each with its screen as it was. They are main's files, so they outlast the
 * pane, a restart and a layout switch. SAVE over a slot that holds a machine asks once more;
 * LOAD goes on from it, paused if the machine was.
 */
interface Props {
  runner: Chip8Runner
  program: Chip8Program
  palette: Palette
  onload: (slot: Chip8Slot) => Promise<boolean>
}

const { runner, program, palette, onload }: Props = $props()

/** The player's slots first, AUTO last: it is read, never written from here. */
const ORDER: readonly Chip8Slot[] = [...CHIP8_SLOTS.filter((s) => s !== 'auto'), 'auto']

let slots = $state.raw<Chip8SlotInfo[]>([])
let now = $state(Date.now())
let problem = $state<string | null>(null)

async function read(id: string): Promise<void> {
  const list = await window.elecdex.chip8.slots(id).catch(() => [])
  if (id === program.id) slots = list
  now = Date.now()
}

$effect(() => {
  void read(program.id)
})

const infoOf = (slot: Chip8Slot): Chip8SlotInfo | undefined => slots.find((s) => s.slot === slot)
const canSave = $derived(runner.status === 'running' || runner.status === 'paused')

/** A filled slot's SAVE asks once more: the first press arms it for a few seconds. */
let armed = $state<Chip8Slot | null>(null)
let armTimer: ReturnType<typeof setTimeout> | undefined
$effect(() => () => clearTimeout(armTimer))

async function save(slot: Chip8Slot): Promise<void> {
  clearTimeout(armTimer)
  if (infoOf(slot) !== undefined && armed !== slot) {
    armed = slot
    armTimer = setTimeout(() => {
      armed = null
    }, 3000)
    return
  }
  armed = null
  const bytes = runner.snapshot()
  if (bytes === null) return
  const id = program.id
  const info = await window.elecdex.chip8.save(id, slot, bytes).catch(() => null)
  if (info === null) {
    problem = 'That machine could not be kept.'
    sfx.play('glitch')
    return
  }
  problem = null
  sfx.play('granted')
  if (id === program.id) slots = [...slots.filter((s) => s.slot !== slot), info]
  now = Date.now()
}

async function load(slot: Chip8Slot): Promise<void> {
  armed = null
  const done = await onload(slot)
  problem = done ? null : 'That machine could not be read.'
  sfx.play(done ? 'panel' : 'glitch')
}
</script>

<div class="save" data-testid="chip8-save">
  {#each ORDER as slot (slot)}
    {@const info = infoOf(slot)}
    <div class="slot" class:empty={info === undefined} data-testid="chip8-slot" data-slot={slot} data-filled={info !== undefined}>
      <Thumb preview={info?.preview} {palette} rotation={program.rotation} width={64} height={32} />
      <div class="words">
        <b>{slot === 'auto' ? 'auto' : `slot ${slot}`}</b>
        <span>{info === undefined ? 'empty' : whenWords(info.at, now)}</span>
      </div>
      <div class="buttons">
        {#if slot !== 'auto'}
          <button
            type="button"
            class="c8-btn"
            class:armed={armed === slot}
            disabled={!canSave}
            aria-label={armed === slot ? `press again to write over slot ${slot}` : `save to slot ${slot}`}
            onclick={() => save(slot)}
            data-testid="chip8-slot-save">{armed === slot ? 'over?' : 'save'}</button
          >
        {/if}
        <button
          type="button"
          class="c8-btn"
          disabled={info === undefined}
          onclick={() => load(slot)}
          data-testid="chip8-slot-load">load</button
        >
      </div>
    </div>
  {/each}
  {#if problem !== null}
    <p class="problem" data-testid="chip8-save-problem">{problem}</p>
  {/if}
  <p class="note">Auto keeps where you left off, when the pane goes back to the library or out of sight.</p>
</div>

<style>
.save {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.slot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
}

.words {
  min-width: 0;
  display: grid;
}

.words b {
  font-family: var(--font-ui);
  font-weight: 400;
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text);
}

.words span {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.slot:not(.empty) .words span {
  color: var(--text);
}

.buttons {
  display: flex;
  gap: 2px;
}

.buttons .c8-btn {
  padding: 0 var(--space-1);
}

.armed {
  color: var(--warn);
  border-color: var(--warn);
}

.problem {
  margin: 0;
  font-size: var(--step--1);
  color: var(--warn);
}

.note {
  margin: 0;
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
