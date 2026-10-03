<script lang="ts">
import type { Elec16FileInfo } from '@shared/elec16-units'
import { untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'

/**
 * FILES (docs/elec16.md sections 7 and 8): the unit's memory card - its files and the room
 * left - with IMPORT from the PC and EXPORT of a file, both through main's own pickers. The
 * list is read again whenever main says the card changed (a program's SAVE, an IMPORT).
 */
interface Props {
  unit: string | null
}

const { unit }: Props = $props()

const api = window.elecdex.elec16
let files = $state.raw<Elec16FileInfo[]>([])
let picked = $state<string | null>(null)
/** What the last IMPORT or EXPORT came to, in words. */
let said = $state<{ text: string; bad: boolean } | null>(null)

async function read(id: string): Promise<void> {
  const list = await api.files(id)
  if (id !== unit) return
  files = list
  if (picked !== null && !list.some((f) => f.name === picked)) picked = null
}

$effect(() => {
  const id = unit
  said = null
  if (id === null) {
    files = []
    return
  }
  untrack(() => void read(id))
  return api.onFilesChange((changed) => {
    if (changed === id) void read(id)
  })
})

const used = $derived(files.reduce((n, f) => n + f.size, 0))

async function importFile(): Promise<void> {
  if (unit === null) return
  const result = await api.import(unit)
  if (result === null) return
  said = result.ok
    ? { text: `Imported as ${result.name}.`, bad: false }
    : { text: result.problem, bad: true }
  if (result.ok) picked = result.name
}

async function exportFile(): Promise<void> {
  if (unit === null || picked === null) return
  const done = await api.export(unit, picked)
  if (done) said = { text: `Exported ${picked}.`, bad: false }
}

const size = (n: number): string => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`)
</script>

<div class="files" data-testid="elec16-files">
  <div class="actions">
    <button type="button" class="e16-btn" disabled={unit === null} onclick={(e) => afterBlink(e.currentTarget, importFile)} data-testid="elec16-import"
      >import</button
    >
    <button
      type="button"
      class="e16-btn"
      disabled={picked === null}
      onclick={(e) => afterBlink(e.currentTarget, exportFile)}
      data-testid="elec16-export">export</button
    >
    <span class="room" data-testid="elec16-room">{size(used)} of 256 KB</span>
  </div>
  {#if said !== null}
    <p class="said" class:bad={said.bad} data-testid="elec16-files-said">{said.text}</p>
  {/if}
  {#if files.length === 0}
    <p class="empty">The card is empty. SAVE "NAME" in BASIC, or IMPORT, puts a file on it.</p>
  {:else}
    <ul role="listbox" aria-label="files on the card">
      {#each files as f (f.name)}
        <li
          role="option"
          aria-selected={picked === f.name}
          tabindex="-1"
          onclick={() => (picked = f.name)}
          onkeydown={(e) => {
            if (e.key === 'Enter') picked = f.name
          }}
          data-testid="elec16-file"
          data-name={f.name}
        >
          <span class="name">{f.name}</span>
          <span class="size">{size(f.size)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
.files {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.room {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.said,
.empty {
  margin: 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.said.bad {
  color: var(--danger);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 1px var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text);
  cursor: pointer;
}

li:hover {
  background: var(--accent-faint);
}

li[aria-selected='true'] {
  background: var(--accent);
  color: var(--text-inverse);
}
</style>
