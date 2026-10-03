<script lang="ts">
import type { Elec16FileInfo } from '@shared/elec16-units'
import { untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import CardFileCard from './CardFileCard.svelte'
import { loadLine } from './file-card.ts'

/**
 * FILES (docs/elec16.md sections 7 and 8): the unit's memory card - its files and the room
 * left - and under it the SOFT CARD, elecdex's own programs, which every unit reads and none
 * writes. IMPORT from the PC and EXPORT of a file go through main's own pickers; LOAD ▸ types
 * the file's LOAD on the machine's keys, as a person would. The card's list is read again
 * whenever main says it changed (a program's SAVE, an IMPORT).
 */
interface Props {
  unit: string | null
  /** Whether the pane is seen: out of sight, a detail card goes. */
  seen: boolean
  /** Whether there is a machine on to type into. */
  canType: boolean
  /** LOAD ▸: this line typed on the machine, ENTER after it. */
  onload: (line: string) => void
}

const { unit, seen, canType, onload }: Props = $props()

const api = window.elecdex.elec16
let files = $state.raw<Elec16FileInfo[]>([])
let soft = $state.raw<Elec16FileInfo[]>([])
let picked = $state<{ name: string; soft: boolean } | null>(null)
/** What the last IMPORT or EXPORT came to, in words. */
let said = $state<{ text: string; bad: boolean } | null>(null)
let root = $state<HTMLDivElement | null>(null)

async function read(id: string): Promise<void> {
  const list = await api.files(id)
  if (id !== unit) return
  files = list
  if (picked !== null && !picked.soft && !list.some((f) => f.name === picked?.name)) picked = null
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

// The SOFT CARD does not change while the app runs: read once.
void api.soft().then((list) => {
  soft = list
})

const used = $derived(files.reduce((n, f) => n + f.size, 0))
const line = $derived(picked === null ? null : loadLine(picked.name))

async function importFile(): Promise<void> {
  if (unit === null) return
  const result = await api.import(unit)
  if (result === null) return
  said = result.ok
    ? { text: `Imported as ${result.name}.`, bad: false }
    : { text: result.problem, bad: true }
  if (result.ok) picked = { name: result.name, soft: false }
}

async function exportFile(): Promise<void> {
  if (unit === null || picked === null) return
  const name = picked.name
  const done = await api.export(unit, name)
  if (done) said = { text: `Exported ${name}.`, bad: false }
}

function load(): void {
  if (line !== null) onload(line)
}

const size = (n: number): string => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`)

/** The file whose card is up, and where its row is, in FILES' own pixels. */
let hover = $state.raw<{
  name: string
  soft: boolean
  anchor: CardAnchor
  bounds: CardSize
} | null>(null)
const resting = new HoverRest<string>(() => (hover = null))
const keyOf = (name: string, isSoft: boolean): string => `${isSoft ? 'soft' : 'card'}:${name}`

function rest(name: string, isSoft: boolean, event: PointerEvent): void {
  const row = event.currentTarget as HTMLElement
  const x = event.clientX
  resting.enter(keyOf(name, isSoft), () => {
    if (root === null) return
    const box = root.getBoundingClientRect()
    hover = {
      name,
      soft: isSoft,
      anchor: anchorOf(box, row.getBoundingClientRect(), x),
      bounds: { width: box.width, height: box.height },
    }
  })
}

const hovered = $derived.by(() => {
  if (hover === null) return null
  const name = hover.name
  return (hover.soft ? soft : files).find((f) => f.name === name) ?? null
})

// A row that goes from under the pointer (a KILL, another unit) sends no leave: its card goes.
$effect(() => {
  if (hover !== null && hovered === null) resting.leave()
})
$effect(() => {
  if (!seen) resting.leave()
})
$effect(() => () => resting.dispose())
</script>

{#snippet list(shown: readonly Elec16FileInfo[], isSoft: boolean, label: string)}
  <ul role="listbox" aria-label={label}>
    {#each shown as f (f.name)}
      <li
        role="option"
        aria-selected={picked?.name === f.name && picked.soft === isSoft}
        tabindex="-1"
        onclick={() => (picked = { name: f.name, soft: isSoft })}
        onkeydown={(e) => {
          if (e.key === 'Enter') picked = { name: f.name, soft: isSoft }
        }}
        onpointerenter={(e) => rest(f.name, isSoft, e)}
        onpointerleave={() => resting.leave(keyOf(f.name, isSoft))}
        data-testid={isSoft ? 'elec16-soft-file' : 'elec16-file'}
        data-name={f.name}
      >
        <span class="name">{f.name}</span>
        <span class="size">{size(f.size)}</span>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="files" bind:this={root} data-testid="elec16-files">
  <div class="actions">
    <button type="button" class="e16-btn" disabled={unit === null} onclick={(e) => afterBlink(e.currentTarget, importFile)} data-testid="elec16-import"
      >import</button
    >
    <button
      type="button"
      class="e16-btn"
      disabled={picked === null || unit === null}
      onclick={(e) => afterBlink(e.currentTarget, exportFile)}
      data-testid="elec16-export">export</button
    >
    <button
      type="button"
      class="e16-btn"
      disabled={line === null || !canType}
      onclick={(e) => afterBlink(e.currentTarget, load)}
      data-testid="elec16-load">load ▸</button
    >
    <span class="room" data-testid="elec16-room">{size(used)} of 256 KB</span>
  </div>
  {#if said !== null}
    <p class="said" class:bad={said.bad} data-testid="elec16-files-said">{said.text}</p>
  {/if}
  {#if files.length === 0}
    <p class="empty">The card is empty. SAVE "NAME" in BASIC, or IMPORT, puts a file on it.</p>
  {:else}
    {@render list(files, false, 'files on the card')}
  {/if}
  {#if soft.length > 0}
    <h3>soft card</h3>
    {@render list(soft, true, 'programs on the SOFT CARD')}
  {/if}
  {#if hovered !== null && hover !== null}
    <CardFileCard file={hovered} soft={hover.soft} anchor={hover.anchor} bounds={hover.bounds} />
  {/if}
</div>

<style>
.files {
  position: relative;
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

h3 {
  margin: var(--space-1) 0 0;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
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
