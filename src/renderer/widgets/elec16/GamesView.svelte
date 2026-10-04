<script lang="ts">
import type { Elec16Game } from '@shared/elec16-units'
import { sfx } from '../../stores/sound.svelte.ts'

/**
 * GAMES (docs/elec16-play.md section 7): ELEC-16 PLAY's shelf - the bundled games and the ones
 * imported - and the cartridge in this unit's slot. Putting one in (or taking it out) is the
 * unit's, kept by main; the machine finds it with START, through LINK's CART. An import goes
 * through main's picker. The shelf is CHIP-8's in nothing: its own list, files and channels.
 */
interface Props {
  /** The game in the unit's slot, by id; undefined when it is empty. */
  inSlot: string | undefined
  /** Whether this pane runs the unit now (only then can its slot be changed). */
  running: boolean
  /** A game put in the slot, or null to take the one there out. */
  oninsert: (id: string | null) => void
}

const { inSlot, running, oninsert }: Props = $props()

let games = $state<readonly Elec16Game[]>([])
let problem = $state<string | null>(null)

async function load(): Promise<void> {
  games = await window.elecdex.elec16.games()
}

$effect(() => {
  void load()
  return window.elecdex.elec16.onGamesChange(() => void load())
})

async function importGame(): Promise<void> {
  sfx.play('panel')
  const done = await window.elecdex.elec16.importGame()
  problem = done === null || done.ok ? null : done.problem
}

/** The imported game REMOVE is armed for: a second press within a few seconds takes it off. */
let armed = $state<string | null>(null)
let disarm: ReturnType<typeof setTimeout> | undefined

function remove(id: string): void {
  clearTimeout(disarm)
  if (armed !== id) {
    armed = id
    disarm = setTimeout(() => {
      armed = null
    }, 3000)
    return
  }
  armed = null
  if (inSlot === id) oninsert(null)
  void window.elecdex.elec16.removeGame(id)
}

$effect(() => () => clearTimeout(disarm))

function put(id: string | null): void {
  if (id === (inSlot ?? null)) return
  sfx.play('panel')
  oninsert(id)
}

const kb = (banks: number): string => `${banks * 8} KB`
</script>

<div class="games" data-testid="elec16-games">
  <section>
    <h3>in the slot</h3>
    <div class="chips">
      <span class="e16-chip plain" data-testid="elec16-game-slot"
        >{games.find((g) => g.id === inSlot)?.name ?? inSlot ?? 'empty'}</span
      >
      <button
        type="button"
        class="e16-chip"
        disabled={inSlot === undefined || !running}
        onclick={() => put(null)}
        data-testid="elec16-game-eject">take out</button
      >
    </div>
    <p class="note">Put a game in, then press START on the start screen.</p>
  </section>
  <section>
    <h3>shelf</h3>
    <ul class="list">
      {#each games as g (g.id)}
        <li class:in={g.id === inSlot}>
          <button
            type="button"
            class="e16-chip"
            aria-pressed={g.id === inSlot}
            disabled={!running}
            onclick={() => put(g.id)}
            data-testid="elec16-game"
            data-game={g.id}>{g.name || g.id}</button
          >
          <span class="about">{g.id} · {kb(g.banks)}{g.saveBanks > 0 ? ` · save ${kb(g.saveBanks)}` : ''}{g.about ? ` · ${g.about}` : ''}</span>
          {#if !g.bundled}
            <button
              type="button"
              class="e16-chip"
              class:armed={armed === g.id}
              aria-label={`take ${g.name || g.id} off the shelf`}
              onclick={() => remove(g.id)}
              data-testid="elec16-game-remove"
              data-game={g.id}>{armed === g.id ? 'remove?' : '×'}</button
            >
          {/if}
        </li>
      {:else}
        <li class="note">No games on the shelf.</li>
      {/each}
    </ul>
    <div class="chips">
      <button type="button" class="e16-chip" onclick={() => void importGame()} data-testid="elec16-game-import"
        >import .e16g</button
      >
    </div>
    {#if problem !== null}
      <p class="note failed" data-testid="elec16-game-problem">{problem}</p>
    {/if}
  </section>
</div>

<style>
.games {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

h3 {
  margin: 0 0 2px;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 0 4px;
  padding: 0;
  list-style: none;
}

.list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px var(--space-1);
}

.about {
  font-size: var(--step--1);
  color: var(--text-muted);
}

.armed {
  color: var(--danger);
}

.note {
  margin: 2px 0 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.note.failed {
  color: var(--danger);
  overflow-wrap: anywhere;
}
</style>
