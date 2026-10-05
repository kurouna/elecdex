<script lang="ts">
import type { Elec16Game } from '@shared/elec16-units'
import { sfx } from '../../stores/sound.svelte.ts'
import type { DevGame } from './dev-game.svelte.ts'

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
  /** DEVELOP: a game's folder built into the slot (docs/elec16-play.md section 11). */
  dev: DevGame
}

const { inSlot, running, oninsert, dev }: Props = $props()

function develop(how: 'open' | 'create' | 'build' | 'close'): void {
  sfx.play('panel')
  if (how === 'open') void dev.open()
  else if (how === 'create') void dev.create()
  else if (how === 'build') void dev.build()
  else dev.close()
}

const where = (p: { file: string; line: number }): string =>
  p.file === '' ? '' : p.line > 0 ? `${p.file}:${p.line}: ` : `${p.file}: `

let games = $state<readonly Elec16Game[]>([])
/** Whether main has answered the shelf yet: until then a game in the slot is shown by its id. */
let loaded = $state(false)
let problem = $state<string | null>(null)

/**
 * The game in the slot as the shelf has it. A unit may name one the shelf no longer holds (a
 * game taken off it with the app closed, or once bundled: DEMO and SCROLL left the shelf on
 * 2026-10-06): its slot is empty to the machine (CART answers NO CARTRIDGE), so it is shown
 * empty here too, its id kept by main in case the same game is put on the shelf again.
 */
const shown = $derived(games.find((g) => g.id === inSlot))

/** Counts the lists asked for: an answer to an older ask, come after a newer one, is dropped. */
let asked = 0

async function load(): Promise<void> {
  const mine = ++asked
  const list = await window.elecdex.elec16.games()
  if (mine !== asked) return
  games = list
  loaded = true
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
        >{shown?.name ?? (loaded ? 'empty' : (inSlot ?? 'empty'))}</span
      >
      <button
        type="button"
        class="e16-chip"
        disabled={(loaded ? shown === undefined : inSlot === undefined) || !running}
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
  <section data-testid="elec16-dev" data-status={dev.status} data-builds={dev.builds}>
    <h3>develop</h3>
    {#if dev.folder === null}
      <div class="chips">
        <button type="button" class="e16-chip" disabled={!running} onclick={() => develop('open')} data-testid="elec16-dev-open"
          >open folder</button
        >
        <button type="button" class="e16-chip" disabled={!running} onclick={() => develop('create')} data-testid="elec16-dev-new"
          >new game</button
        >
      </div>
      <p class="note">
        A game's folder is built here and put in the slot each time you save a file in it. NEW GAME
        writes a working starting point into an empty folder.
      </p>
    {:else}
      <div class="chips">
        <span class="e16-chip plain" data-testid="elec16-dev-folder">{dev.folder}</span>
        <button type="button" class="e16-chip" disabled={dev.status === 'building'} onclick={() => develop('build')} data-testid="elec16-dev-build"
          >rebuild</button
        >
        <button type="button" class="e16-chip" onclick={() => develop('close')} data-testid="elec16-dev-close"
          >close</button
        >
      </div>
      <p class="note" data-testid="elec16-dev-state">
        {#if dev.status === 'building'}
          building…
        {:else if dev.status === 'built' && dev.report !== null}
          built: {kb(dev.report.banks)}, {dev.report.ramCode} bytes of code in RAM, {dev.report.tiles} tiles - press START
        {:else if dev.status === 'failed'}
          not built
        {:else}
          watching for changes
        {/if}
      </p>
    {/if}
    {#each dev.problems as p, k (k)}
      <p class="note failed" data-testid="elec16-dev-problem">{where(p)}{p.message}</p>
    {/each}
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
