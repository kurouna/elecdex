<script lang="ts">
import { CODE_END, CODE_START, MEASURE_LIMIT, SAMPLE } from '@shared/e16c/code-area'
import { sourceFromMachine, sourceToMachine } from '@shared/elec16/charset'
import { onDestroy, untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { compileCode, holdCompiler } from './code/compiler.ts'
import type { LevelResult } from './code/protocol.ts'
import { CODE_FILE } from './pane-state.ts'

/**
 * CODE (docs/elec16.md section 6, CODE): TypeScript on the left, compiled by e16c in a worker
 * into E16 code on the right, every level's size and cycles side by side. The source is a .TS
 * file on the unit's card, written before each COMPILE and when the view goes; SAVE also
 * writes the chosen level's program as a .BIN. RUN and LOAD hand the program to the machine.
 */
interface Props {
  /** The unit whose card holds the source; none while the pane has none running. */
  unit: string | null
  rom: Uint8Array
  file: string
  level: 0 | 1 | 2
  onfile: (file: string) => void
  onlevel: (level: 0 | 1 | 2) => void
  /** RUN or LOAD: the program, for the machine to take. */
  ongive: (image: Uint8Array, how: 'run' | 'load') => void
  /** Why the last RUN or LOAD did nothing, when it did not (the pane comes back here). */
  notice?: string | null
}

const { unit, rom, file, level, onfile, onlevel, ongive, notice = null }: Props = $props()

const api = window.elecdex.elec16
let source = $state('')
/** The text as last read or written: what differs is not on the card yet. */
let kept = ''
let loaded = $state(false)
let results = $state.raw<LevelResult[] | null>(null)
/** A build under way: the button gives way to COMPILING, stepping with the shared pulse. */
let compiling = $state(false)
$effect(() => (compiling ? pulse.use() : undefined))
let said = $state<{ text: string; bad: boolean } | null>(null)
let sources = $state.raw<string[]>([])
let editor = $state<HTMLTextAreaElement | null>(null)

const release = holdCompiler()

async function readSources(id: string): Promise<void> {
  const list = await api.files(id)
  if (id !== unit) return
  sources = list.map((f) => f.name).filter((n) => n.endsWith('.TS'))
}

/**
 * The unit and file the text was read for. The props are read again whenever the pane's state
 * changes - a level chosen, say - with the same values: only another unit or file reads the
 * card again, or what was typed and not yet kept would be lost.
 */
let readFor = ''

$effect(() => {
  const id = unit
  const name = file
  if (id === null || `${id}/${name}` === readFor) return
  readFor = `${id}/${name}`
  untrack(() => {
    loaded = false
    results = null
    said = null
    void readSources(id)
    void api.readFile(id, name).then((bytes) => {
      if (id !== unit || name !== file) return
      source = bytes === null ? (name === CODE_FILE ? SAMPLE : '') : sourceFromMachine(bytes)
      kept = bytes === null ? '' : source
      loaded = true
    })
  })
})

/** The source onto the card, when it changed; false when it could not go there. */
async function keep(): Promise<boolean> {
  if (unit === null || !loaded || source === kept) return true
  const made = sourceToMachine(source)
  if ('problem' in made) {
    said = { text: made.problem, bad: true }
    return false
  }
  const status = await api.writeFile(unit, file, made.bytes)
  if (status !== 0) {
    said = { text: `${file} could not be written to the card.`, bad: true }
    return false
  }
  kept = source
  return true
}

async function compile(): Promise<void> {
  if (compiling) return
  compiling = true
  said = null
  try {
    if (!(await keep())) return
    results = await compileCode(rom, file, source)
  } catch (error) {
    said = { text: `The compiler could not run: ${(error as Error).message}`, bad: true }
  } finally {
    compiling = false
  }
}

const chosen = $derived(results?.[level] ?? null)
const ready = $derived(chosen !== null && chosen.errors.length === 0)

async function saveBin(): Promise<void> {
  if (unit === null || chosen === null || !ready) return
  const bin = file.replace(/\.TS$/, '.BIN')
  const status = await api.writeFile(unit, bin, chosen.image)
  said =
    status === 0
      ? { text: `Saved ${bin}: CALL 28672 after LOAD "${bin}".`, bad: false }
      : { text: `${bin} could not be written to the card.`, bad: true }
}

function give(how: 'run' | 'load'): void {
  if (chosen !== null && ready) ongive(chosen.image, how)
}

/** A new or another .TS file: what is typed is kept first. */
let naming = $state('')
async function open(name: string): Promise<void> {
  const upper = name.trim().toUpperCase()
  const full = upper.endsWith('.TS') ? upper : `${upper}.TS`
  if (!/^[A-Z0-9]{1,8}\.TS$/.test(full)) {
    said = { text: 'A name is up to eight letters and digits.', bad: true }
    return
  }
  if (!(await keep())) return
  naming = ''
  onfile(full)
}

/** The caret to an error's place. */
function goTo(line: number, column: number): void {
  if (editor === null || line < 1) return
  const lines = source.split('\n')
  let at = 0
  for (let k = 0; k < line - 1 && k < lines.length; k++) at += (lines[k]?.length ?? 0) + 1
  at += Math.max(0, column - 1)
  editor.focus()
  editor.setSelectionRange(at, at)
}

const cyclesText = (r: LevelResult): string => {
  const m = r.measured
  if (m === null) return '—'
  const n = m.cycles.toLocaleString('en-US')
  if (m.end === 'returned') return n
  if (m.end === 'waits') return `${n} · waits for a key`
  if (m.end === 'limit') return `> ${MEASURE_LIMIT.toLocaleString('en-US')}`
  return `${n} · fault`
}

onDestroy(() => {
  void keep()
  release()
})
</script>

<div class="code" data-testid="elec16-code-view">
  <div class="bar">
    <select
      aria-label="source file"
      value={file}
      onchange={(e) => void open(e.currentTarget.value)}
      data-testid="elec16-code-file"
    >
      {#each [...new Set([file, ...sources])].sort() as name (name)}
        <option value={name}>{name}</option>
      {/each}
    </select>
    <input
      class="name"
      placeholder="new name"
      maxlength="11"
      spellcheck="false"
      bind:value={naming}
      onkeydown={(e) => {
        if (e.key === 'Enter') void open(naming)
      }}
      data-testid="elec16-code-new"
    />
    <span class="gap"></span>
    {#if compiling}
      <span class="busy" data-phase={pulse.phase} data-testid="elec16-compile-busy">COMPILING</span>
    {:else}
      <button
        type="button"
        class="e16-btn"
        disabled={unit === null || !loaded}
        onclick={(e) => afterBlink(e.currentTarget, compile)}
        data-testid="elec16-compile">compile</button
      >
    {/if}
    <div class="chips" role="radiogroup" aria-label="optimisation">
      {#each [0, 1, 2] as const as l (l)}
        <button
          type="button"
          class="e16-chip"
          role="radio"
          aria-checked={level === l}
          onclick={() => onlevel(l)}
          data-testid="elec16-level"
          data-level={l}>-O{l}</button
        >
      {/each}
    </div>
    <button type="button" class="e16-btn" disabled={!ready} onclick={(e) => afterBlink(e.currentTarget, () => give('run'))} data-testid="elec16-run"
      >run ▸</button
    >
    <button type="button" class="e16-btn" disabled={!ready} onclick={(e) => afterBlink(e.currentTarget, () => give('load'))} data-testid="elec16-load-code"
      >load ▸</button
    >
    <button type="button" class="e16-btn" disabled={!ready} onclick={(e) => afterBlink(e.currentTarget, saveBin)} data-testid="elec16-save-bin"
      >save .bin</button
    >
  </div>
  {#if said !== null}
    <p class="said" class:bad={said.bad} data-testid="elec16-code-said">{said.text}</p>
  {:else if notice !== null}
    <p class="said bad" data-testid="elec16-code-said">{notice}</p>
  {/if}
  <div class="sides">
    <textarea
      bind:this={editor}
      bind:value={source}
      spellcheck="false"
      wrap="off"
      aria-label="TypeScript source"
      disabled={!loaded}
      data-testid="elec16-source"
    ></textarea>
    <pre class="asm" aria-label="E16 assembly" data-testid="elec16-asm">{chosen?.asm ?? ''}</pre>
  </div>
  {#if results !== null}
    {#if chosen !== null && chosen.errors.length > 0}
      <ul class="errors" data-testid="elec16-code-errors">
        {#each chosen.errors as e, k (k)}
          <li>
            <button type="button" onclick={() => goTo(e.line, e.column)}
              >{e.file}{e.line > 0 ? `:${e.line}:${e.column}` : ''}</button
            >
            {e.message}
          </li>
        {/each}
      </ul>
    {/if}
    <table class="levels" data-testid="elec16-levels">
      <thead>
        <tr><th>level</th><th>bytes</th><th>cycles to return</th></tr>
      </thead>
      <tbody>
        {#each results as r (r.level)}
          <tr class:chosen={r.level === level} data-level={r.level}>
            <td>-O{r.level}</td>
            <td data-testid="elec16-level-bytes">{r.errors.length > 0 ? '—' : r.image.length.toLocaleString('en-US')}</td>
            <td data-testid="elec16-level-cycles">{cyclesText(r)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="note">
      Code from {CODE_START.toString(16).toUpperCase()} (up to {(CODE_END - CODE_START).toLocaleString('en-US')} bytes); RUN types
      CALL 28672 at BASIC's prompt or G 7000 in the monitor.
    </p>
  {/if}
</div>

<style>
.code {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1);
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
}

.gap {
  flex: 1;
}

/* As the git pane's FETCHING: framed in the accent, stepping with the shared pulse. */
.busy {
  padding: 0 var(--space-2);
  border: 1px solid var(--accent);
  color: var(--accent-strong);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
}

.busy[data-phase='2'] {
  opacity: 0.45;
}

.chips {
  display: flex;
  gap: 2px;
}

select,
.name {
  border: 0;
  border-bottom: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  padding: 1px var(--space-1);
  outline: none;
}

.name {
  width: 9ch;
}

select option {
  background: var(--panel-bg, var(--bg));
}

.sides {
  flex: 1;
  min-height: 8rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-1);
}

textarea,
.asm {
  min-height: 8rem;
  margin: 0;
  padding: var(--space-1);
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  line-height: 1.4;
  overflow: auto;
  resize: none;
  tab-size: 2;
}

textarea:focus-visible {
  outline: none;
  border-color: var(--accent);
}

.asm {
  color: var(--text-muted);
  white-space: pre;
}

.said,
.note {
  margin: 0;
  font-size: var(--step--1);
  color: var(--text-muted);
}

.said.bad {
  color: var(--danger);
}

.errors {
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--danger);
}

.errors button {
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
}

.levels {
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.levels th {
  text-align: left;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  font-weight: 400;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  padding-right: var(--space-2);
}

.levels td {
  padding-right: var(--space-2);
  color: var(--text-muted);
}

.levels tr.chosen td {
  color: var(--accent-strong);
}
</style>
