<script lang="ts">
import type { AiProvider } from '@shared/ai'
import { sourceFromMachine, sourceToMachine } from '@shared/elec16/charset'
import { CODE_END, CODE_START, MEASURE_LIMIT, newFileName, SAMPLE } from '@shared/elec16/code-area'
import { MAX_FIXES } from '@shared/elec16/write-flow'
import { onDestroy, untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { composing } from '../../lib/ime.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { compileCode, holdCompiler } from './code/compiler.ts'
import type { LevelResult } from './code/protocol.ts'
import { CODE_FILE } from './pane-state.ts'
import WriteLine from './WriteLine.svelte'
import type { WriteFlow, WriteView } from './write-flow.svelte.ts'

/**
 * CODE (docs/elec16.md section 6, CODE): TypeScript on the left, compiled by e16c in a worker
 * into E16 code on the right, every level's size and cycles side by side. The source is a .TS
 * file on the unit's card, written before each COMPILE and when the view goes; SAVE also
 * writes the chosen level's program as a .BIN. RUN and LOAD hand the program to the machine.
 *
 * On the pocket models WRITE sits at the foot (docs/elec16-write.md): words to the AI, its
 * program into the editor. The flow is the pane's (the view goes whenever the machine shows);
 * the view attaches to it, and while it writes the editor is the model's, drawn as text.
 */
interface WriteProps {
  flow: WriteFlow
  providers: readonly AiProvider[]
  provider: AiProvider | null
  model: string
  seen: boolean
  onprovider: (id: string) => void
  onmodel: (model: string) => void
}

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
  /** WRITE, on the pocket models; none elsewhere. */
  write?: WriteProps | null
}

const {
  unit,
  rom,
  file,
  level,
  onfile,
  onlevel,
  ongive,
  notice = null,
  write = null,
}: Props = $props()
const flow = $derived(write?.flow ?? null)
/** WRITE is under way: the editor, the file and the buttons that act on the source wait for it. */
const writing = $derived(flow?.busy === true)

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
    // What WRITE built here while the view was away (RUN goes to the machine) is shown again.
    results = flow?.resultsFor(id, name) ?? null
    said = null
    void readSources(id)
    void api.readFile(id, name).then((bytes) => {
      if (id !== unit || name !== file) return
      source = bytes === null ? (name === CODE_FILE ? SAMPLE : '') : sourceFromMachine(bytes)
      kept = bytes === null ? '' : source
      // What WRITE left in the editor, not on the card, while the view was away.
      source = flow?.takePending(id, name) ?? source
      loaded = true
    })
  })
})

// WRITE reads and replaces the editor through the view while it is mounted.
$effect(() => {
  const f = flow
  if (f === null) return
  const view: WriteView = {
    source: () => source,
    replaced: (text, onCard) => {
      source = text
      if (onCard) kept = text
    },
    built: (levels) => {
      results = levels
    },
    began: () => {
      results = null
    },
  }
  f.attach(view)
  return () => f.detach(view)
})

/** WRITE's errors while a fix is asked for, and a failure's that no build here shows. */
const flowErrors = $derived(
  // Only where no build shows errors of its own: once one does (a COMPILE by hand), it speaks.
  flow === null || results !== null
    ? []
    : flow.state === 'fixing' || flow.state === 'failed'
      ? flow.errors
      : [],
)

let shown = $state<HTMLPreElement | null>(null)
const liveLines = $derived((flow?.live ?? '').split('\n'))
// The code coming in stays in sight; while a fix is asked for, the first refused line does.
$effect(() => {
  void flow?.live
  const pre = shown
  if (pre === null) return
  const mark = pre.querySelector('mark')
  pre.scrollTop =
    mark instanceof HTMLElement ? mark.offsetTop - pre.clientHeight / 2 : pre.scrollHeight
})

/** The source onto the card, when it changed; false when it could not go there. */
async function keep(): Promise<boolean> {
  if (unit === null || !loaded || source === kept) return true
  // What is written is the text now: what is typed while the card writes is not kept by it.
  const text = source
  const at = `${unit}/${file}`
  const made = sourceToMachine(text)
  if ('problem' in made) {
    said = { text: made.problem, bad: true }
    return false
  }
  const status = await api.writeFile(unit, file, made.bytes)
  if (status !== 0) {
    said = { text: `${file} could not be written to the card.`, bad: true }
    return false
  }
  // Another file open by now has its own kept text, read from the card.
  if (`${unit}/${file}` === at) kept = text
  // On the card by the person's own COMPILE: whatever WRITE left there is theirs now.
  flow?.kept()
  return true
}

async function compile(): Promise<void> {
  if (compiling) return
  compiling = true
  said = null
  // What it is built for: another unit or file open by the time it comes back, it is not
  // shown there - RUN would have run the other file's program.
  const asked = `${unit}/${file}`
  try {
    if (!(await keep())) return
    const built = await compileCode(rom, file, source)
    if (`${unit}/${file}` === asked) results = built
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
  // What a STOP or FAILED left is parked with WRITE, never written over the person's program.
  if (flow?.park(unit, file, source) !== true) void keep()
  release()
})
</script>

<div class="code" data-testid="elec16-code-view">
  <div class="bar">
    <select
      aria-label="source file"
      value={file}
      disabled={writing}
      onchange={(e) => void open(e.currentTarget.value)}
      data-testid="elec16-code-file"
    >
      {#each [...new Set([file, ...sources])].sort() as name (name)}
        <option value={name}>{name}</option>
      {/each}
    </select>
    <button
      type="button"
      class="e16-btn"
      disabled={unit === null || !loaded || writing}
      onclick={(e) => afterBlink(e.currentTarget, () => void open(newFileName([file, ...sources])))}
      data-testid="elec16-code-new-file">new</button
    >
    <input
      class="name"
      placeholder="new name"
      maxlength="11"
      spellcheck="false"
      disabled={writing}
      bind:value={naming}
      onkeydown={(e) => {
        if (composing(e)) return
        if (e.key === 'Enter') void open(naming)
      }}
      data-testid="elec16-code-new"
    />
    <span class="gap"></span>
    {#if writing && flow !== null}
      <span class="busy" data-phase={pulse.phase} data-testid="elec16-compile-busy"
        >{flow.state === 'fixing' ? 'FIXING' : flow.state === 'compiling' ? 'COMPILING' : 'WRITING'}</span
      >
    {:else if compiling}
      <span class="busy" data-phase={pulse.phase} data-testid="elec16-compile-busy">COMPILING</span>
    {:else}
      <button
        type="button"
        class="e16-btn"
        disabled={unit === null || !loaded || flow?.state === 'confirm'}
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
    <button type="button" class="e16-btn" disabled={!ready || writing} onclick={(e) => afterBlink(e.currentTarget, () => give('run'))} data-testid="elec16-run"
      >run ▸</button
    >
    <button type="button" class="e16-btn" disabled={!ready || writing} onclick={(e) => afterBlink(e.currentTarget, () => give('load'))} data-testid="elec16-load-code"
      >load ▸</button
    >
    <button type="button" class="e16-btn" disabled={!ready || writing} onclick={(e) => afterBlink(e.currentTarget, saveBin)} data-testid="elec16-save-bin"
      >save .bin</button
    >
  </div>
  {#if said !== null}
    <p class="said" class:bad={said.bad} data-testid="elec16-code-said">{said.text}</p>
  {:else if notice !== null}
    <p class="said bad" data-testid="elec16-code-said">{notice}</p>
  {/if}
  <div class="sides">
    {#if writing && flow !== null}
      <!-- The model's text while it writes: drawn, never typed into; the lines e16c refused marked. -->
      <div class="side">
        <pre
          bind:this={shown}
          class="src writing"
          role="region"
          aria-label="TypeScript source, being written"
          data-testid="elec16-source-writing">{#each liveLines as text, k (k)}{#if flow.marks.includes(k + 1)}<mark>{text}</mark>{:else}{text}{/if}{k < liveLines.length - 1 ? '\n' : ''}{/each}{#if flow.state === 'writing'}<span class="caret" data-phase={pulse.phase}></span>{/if}</pre>
        <span class="tag"
          >{flow.state === 'fixing'
            ? `fixing · ${flow.fixes} of ${MAX_FIXES}`
            : flow.state === 'compiling'
              ? 'compiling'
              : `writing · ${(flow.bytes / 1024).toFixed(1)} KB`}</span
        >
      </div>
    {:else}
      <textarea
        bind:this={editor}
        bind:value={source}
        spellcheck="false"
        wrap="off"
        aria-label="TypeScript source"
        disabled={!loaded}
        readonly={flow?.state === 'confirm'}
        data-testid="elec16-source"
      ></textarea>
    {/if}
    <pre class="asm" aria-label="E16 assembly" data-testid="elec16-asm">{chosen?.asm ?? ''}</pre>
  </div>
  {#if results !== null}
    {#if chosen !== null && chosen.errors.length > 0}
      <ul class="errors" data-testid="elec16-code-errors">
        {#each chosen.errors as e, k (k)}
          <li>
            <button data-press="off" type="button" onclick={() => goTo(e.line, e.column)}
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
  {#if write !== null && flowErrors.length > 0}
    <!-- What WRITE gives back, or left unfixed where no build shows it (no code, a character). -->
    <ul class="errors" data-testid="elec16-write-errors">
      {#each flowErrors as e, k (k)}
        <li>
          {#if writing || e.line === 0}
            <span class="at">{e.file}{e.line > 0 ? `:${e.line}:${e.column}` : ''}</span>
          {:else}
            <button data-press="off" type="button" onclick={() => goTo(e.line, e.column)}
              >{e.file}:{e.line}:{e.column}</button
            >
          {/if}
          {e.message}
        </li>
      {/each}
    </ul>
  {/if}
  {#if write !== null}
    <WriteLine
      flow={write.flow}
      {file}
      providers={write.providers}
      provider={write.provider}
      model={write.model}
      seen={write.seen}
      blocked={unit === null || !loaded || compiling}
      onprovider={write.onprovider}
      onmodel={write.onmodel}
    />
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
  /* Opaque: the list is drawn by the system, and a transparent ground shows it white. */
  background: var(--app-bg);
}

.sides {
  flex: 1;
  min-height: 8rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-1);
}

.side {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 8rem;
}

/* While the model writes, the editor is its text, dashed in the accent: not to be typed into. */
.src.writing {
  flex: 1;
  border-style: dashed;
  border-color: var(--accent);
  white-space: pre;
}

.src mark {
  background: color-mix(in srgb, var(--danger) 18%, transparent);
  color: inherit;
  outline: 1px solid var(--danger);
}

.caret {
  display: inline-block;
  width: 0.55em;
  height: 1.1em;
  vertical-align: text-bottom;
  background: var(--accent);
}

.caret[data-phase='2'] {
  opacity: 0.2;
}

.side .tag {
  position: absolute;
  top: 0;
  right: 0.9rem;
  transform: translateY(-50%);
  padding: 0 0.35rem;
  background: var(--app-bg);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
}

.errors .at {
  color: var(--accent);
}

textarea,
.src,
.asm {
  min-height: 8rem;
  margin: 0;
  padding: var(--space-1);
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  /* Code is read line by line and written: the body size, not the panel's small one. */
  font-size: var(--step-0);
  line-height: 1.45;
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
