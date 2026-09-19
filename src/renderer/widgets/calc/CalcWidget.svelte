<script lang="ts">
import {
  bitNibbles,
  CALC_EXAMPLES,
  CALC_HELP,
  CALC_MAX_INPUT,
  CALC_MAX_VARS,
  evaluateLine,
  tally,
} from '@shared/calc'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import type { Bar } from '../common/bars.ts'
import LevelBars from '../common/LevelBars.svelte'
import Readout from '../common/Readout.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'

/**
 * The calculator: a tape, not a keypad.
 *
 * A grid of buttons is the worst instrument on a keyboard-first HUD - it is
 * slower than typing and it cannot show its working. This is a line you type
 * into with the answer already showing as a ghost beneath it, and everything
 * answered so far standing above as a tape you can take numbers back out of.
 *
 * The arithmetic is elecxzy's, vendored and wrapped (shared/calc). That is where
 * full-width digits, 3百万, the constants and the 12-significant-digit rounding
 * come from; nothing here re-implements any of it, and nothing here can `eval`.
 */

const { paneId, state: paneState }: WidgetProps = $props()

interface TapeEntry {
  src: string
  text: string
  grouped: string
  described: string
  assigned?: string
}

/** Entries kept on the tape. Enough to scroll back through, small in layout.json. */
const TAPE_LIMIT = 50

const mode = $derived<'calc' | 'tally'>(paneState?.mode === 'tally' ? 'tally' : 'calc')
const showHex = $derived(paneState?.hex === true)
const grouped = $derived(paneState?.group !== false)

const vars = $derived.by<Record<string, number>>(() => {
  const raw = paneState?.vars
  if (typeof raw !== 'object' || raw === null) return {}
  const out: Record<string, number> = {}
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) out[name] = value
    if (Object.keys(out).length >= CALC_MAX_VARS) break
  }
  return out
})

const tape = $derived.by<TapeEntry[]>(() => {
  const raw = paneState?.tape
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return []
    const { src, text, grouped: g, described, assigned } = entry as Record<string, unknown>
    if (typeof src !== 'string' || typeof text !== 'string') return []
    return [
      {
        src,
        text,
        grouped: typeof g === 'string' ? g : text,
        described: typeof described === 'string' ? described : text,
        ...(typeof assigned === 'string' ? { assigned } : {}),
      },
    ]
  })
})

const ans = $derived(typeof paneState?.ans === 'number' ? paneState.ans : 0)

let input = $state('')
let error = $state<string | null>(null)
/** Bumped on a refused line, to replay the glitch even for the same message. */
let shake = $state(0)
let historyAt = $state<number | null>(null)
let helpOpen = $state(false)
let tapeEl = $state<HTMLDivElement | null>(null)
let inputEl = $state<HTMLInputElement | null>(null)

/** The line being typed, evaluated as it is typed. Nothing is stored for it. */
const preview = $derived.by(() => {
  const line = input.trim()
  if (line === '' || line.length > CALC_MAX_INPUT) return null
  const result = evaluateLine(line, { ...vars, ans })
  return result.ok ? result : null
})

const shown = $derived(preview === null ? null : grouped ? preview.grouped : preview.text)
const nibbles = $derived(showHex && preview !== null ? bitNibbles(preview.value) : null)

function save(change: Record<string, unknown>): void {
  layout.setPaneState(paneId, { ...paneState, ...change })
}

function submit(): void {
  const line = input.trim()
  if (line === '') return
  if (line.length > CALC_MAX_INPUT) {
    fail(`Expression is too long (${CALC_MAX_INPUT} characters)`)
    return
  }

  const result = evaluateLine(line, { ...vars, ans })
  if (!result.ok) {
    fail(result.error)
    return
  }

  const entry: TapeEntry = {
    src: line,
    text: result.text,
    grouped: result.grouped,
    described: result.described,
    ...(result.assigned === undefined ? {} : { assigned: result.assigned }),
  }
  save({
    tape: [...tape, entry].slice(-TAPE_LIMIT),
    ans: result.value,
    ...(result.assigned === undefined
      ? {}
      : { vars: { ...vars, [result.assigned]: result.value } }),
  })
  input = ''
  error = null
  historyAt = null
  sfx.play('panel')
}

function fail(message: string): void {
  error = message
  shake += 1
  sfx.play('glitch')
}

/** Walks back through what was typed before, the way a shell's history does. */
function recall(delta: number): void {
  if (tape.length === 0) return
  const at = historyAt === null ? tape.length : historyAt
  const next = Math.max(0, Math.min(tape.length, at + delta))
  historyAt = next === tape.length ? null : next
  input = next === tape.length ? '' : (tape[next]?.src ?? '')
  error = null
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    submit()
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    recall(-1)
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    recall(1)
    return
  }
  if (event.key === 'Escape') {
    if (helpOpen) {
      event.preventDefault()
      helpOpen = false
      return
    }
    if (input !== '') {
      event.preventDefault()
      input = ''
      error = null
    }
    return
  }
  // "?" on an empty line asks what the calculator knows; typed into an
  // expression it is a character like any other.
  if (event.key === '?' && input === '') {
    event.preventDefault()
    helpOpen = !helpOpen
    return
  }
  // Ctrl+L clears the tape, as it clears a terminal.
  if (event.key.toLowerCase() === 'l' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    save({ tape: [] })
  }
}

/** Puts a past answer back in the line, which is what a tape is for. */
function reuse(entry: TapeEntry): void {
  input = `${input}${entry.text}`
  inputEl?.focus()
}

function copy(text: string): void {
  void navigator.clipboard?.writeText(text)
  sfx.play('stdout')
}

function forget(name: string): void {
  const next = { ...vars }
  delete next[name]
  save({ vars: next })
}

// The tape grows downward; the newest line is the one to keep in view.
$effect(() => {
  void tape.length
  if (tapeEl !== null) tapeEl.scrollTop = tapeEl.scrollHeight
})

/**
 * The header shows the last answer, not the half-typed one.
 *
 * Publishing the ghost would rewrite the pane's header on every keystroke - a
 * new object each time, so every reader of the meta redraws - and it would put a
 * number there that has not been committed to anything.
 */
$effect(() => {
  const last = tape.at(-1)
  paneMeta.set(paneId, {
    subtitle: mode === 'tally' ? 'tally' : (last?.grouped ?? ''),
  })
})

// ---- tally ----

let pasted = $state('')
const report = $derived(mode === 'tally' && pasted.trim() !== '' ? tally(pasted) : null)

const histogram = $derived.by<Bar[]>(() => {
  if (report === null || report.bins.length === 0) return []
  const tallest = Math.max(...report.bins)
  if (tallest <= 0) return []
  return report.bins.map((count) => ({ value: count / tallest }))
})
</script>

<div class="calc" data-testid="calc" data-mode={mode}>
  <SettingsButton
    open={helpOpen}
    label="calculator help"
    testid="calc-help-toggle"
    ontoggle={() => (helpOpen = !helpOpen)}
  />

  <div class="modes">
    <button
      type="button"
      class:on={mode === 'calc'}
      onclick={() => save({ mode: 'calc' })}
      data-testid="calc-mode-calc">calc</button
    >
    <button
      type="button"
      class:on={mode === 'tally'}
      onclick={() => save({ mode: 'tally' })}
      data-testid="calc-mode-tally">tally</button
    >
    {#if mode === 'calc'}
      <button
        type="button"
        class:on={showHex}
        title="Show the result in hex and binary"
        onclick={() => save({ hex: !showHex })}
        data-testid="calc-hex">0x</button
      >
      <button
        type="button"
        class:on={grouped}
        title="Group thousands"
        onclick={() => save({ group: !grouped })}
        data-testid="calc-group">,</button
      >
    {/if}
  </div>

  {#if helpOpen}
    <div class="help" data-testid="calc-help">
      {#each CALC_HELP as group (group.title)}
        <div class="group">
          <span class="group-title">{group.title}</span>
          {#each group.items as item (item.name)}
            <div class="item">
              <code>{item.name}</code>
              {#if item.note}<span class="note">{item.note}</span>{/if}
            </div>
          {/each}
        </div>
      {/each}
      <div class="group">
        <span class="group-title">try</span>
        {#each CALC_EXAMPLES as example (example)}
          <button type="button" class="example" onclick={() => (input = example)}>
            {example}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if mode === 'calc'}
    {#if Object.keys(vars).length > 0}
      <div class="registers" data-testid="calc-registers">
        <span class="reg-label">reg</span>
        {#each Object.entries(vars) as [name, value] (name)}
          <button
            type="button"
            class="reg"
            title="Insert {name}; right-click to forget it"
            onclick={() => {
              input = `${input}${name}`
              inputEl?.focus()
            }}
            oncontextmenu={(e) => {
              e.preventDefault()
              forget(name)
            }}
            data-testid="calc-register"
            data-name={name}
          >
            <span class="reg-name">{name}</span>
            <span class="reg-value">{value}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="tape" bind:this={tapeEl} data-testid="calc-tape">
      {#each tape as entry, i (i)}
        <div class="row" class:landed={i === tape.length - 1} data-testid="calc-tape-row">
          <button
          type="button"
          class="src"
          onclick={() => (input = entry.src)}
          title="Put this line back"
        >
            {#if entry.assigned}<span class="assigned">{entry.assigned}</span>{/if}{entry.src}
          </button>
          <button
            type="button"
            class="value"
            onclick={() => reuse(entry)}
            oncontextmenu={(e) => {
              e.preventDefault()
              copy(entry.text)
            }}
            title={`${entry.described} — click to use it, right-click to copy`}
          >
            {grouped ? entry.grouped : entry.text}
          </button>
        </div>
      {:else}
        <p class="empty">
          type an expression · 1920*1080 · 3百万/12 · 2*tb/(512*gib)
          <span class="keys">↑ history · ? help</span>
        </p>
      {/each}
    </div>

    <div class="entry" data-shake={shake}>
      <span class="caret" aria-hidden="true">&gt;</span>
      <input
        bind:this={inputEl}
        bind:value={input}
        onkeydown={onKeydown}
        oninput={() => {
          error = null
        }}
        maxlength={CALC_MAX_INPUT}
        spellcheck="false"
        autocomplete="off"
        aria-label="Expression"
        placeholder=""
        data-testid="calc-input"
      />
      {#if input.length > CALC_MAX_INPUT - 50}
        <span class="left">{CALC_MAX_INPUT - input.length}</span>
      {/if}
      <!-- Escape clears the line and Ctrl+L the tape, but a keyboard shortcut
           nobody can see is a shortcut nobody uses. -->
      <button
        type="button"
        class="clear"
        title={input === '' ? 'Clear the tape (Ctrl+L)' : 'Clear the line (Esc)'}
        aria-label={input === '' ? 'clear the tape' : 'clear the line'}
        onclick={() => {
          if (input === '') save({ tape: [] })
          else input = ''
          error = null
          inputEl?.focus()
        }}
        data-testid="calc-clear"
      >
        {input === '' ? 'AC' : 'C'}
      </button>
    </div>

    <div class="answer" class:has={shown !== null}>
      {#if error !== null}
        <span class="error" data-testid="calc-error">{error}</span>
      {:else if shown !== null}
        <Readout value={shown} size="step-2" testid="calc-preview" label="Result" />
      {/if}
    </div>

    {#if nibbles !== null}
      <div class="bits" data-testid="calc-bits">
        {#each nibbles as nibble, n (n)}
          <span class="nibble">
            {#each [...nibble] as bit, b (b)}
              <span class="bit" class:on={bit === '1'}>{bit}</span>
            {/each}
          </span>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="tally">
      <textarea
        bind:value={pasted}
        placeholder="paste numbers - a column, a table, a log line"
        spellcheck="false"
        aria-label="Numbers to tally"
        data-testid="calc-tally-input"
      ></textarea>

      {#if report !== null}
        <div class="report" data-testid="calc-tally-report" data-count={report.count}>
          <div class="chart">
            <LevelBars bars={histogram} label="Distribution" testid="calc-tally-histogram" />
            {#if report.box !== null}
              <div class="box" aria-hidden="true">
                <span class="whisker" style:left="0%" style:right="0%"></span>
                <span
                  class="iqr"
                  style:left="{report.box.q1 * 100}%"
                  style:right="{(1 - report.box.q3) * 100}%"
                ></span>
                <span class="median" style:left="{report.box.median * 100}%"></span>
              </div>
            {/if}
          </div>
          <div class="figures">
            <span class="count">{report.count} numbers{report.truncated ? ' (first)' : ''}</span>
            {#each report.figures as figure (figure.label)}
              <!-- A figure is a number like any other: taking it into the
                   calculator is one click, rather than reading it back by eye. -->
              <button
                type="button"
                class="figure"
                title="Use this in the calculator"
                onclick={() => {
                  input = `${input}${figure.value.text}`
                  save({ mode: 'calc' })
                }}
                data-testid="calc-tally-figure"
                data-label={figure.label}
              >
                <span class="figure-label">{figure.label}</span>
                <span class="figure-value">{figure.value.grouped}</span>
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <p class="empty">nothing to count yet</p>
      {/if}
    </div>
  {/if}
</div>

<style>
.calc {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

/*
 * A wide pane is not a reason for a long thin line of digits with a hand's width
 * of nothing on either side of it: the column keeps a readable measure and sits
 * in the middle, and the tally puts its figures beside its chart.
 */
@container (min-width: 32rem) {
  .tape,
  .entry,
  .answer,
  .bits,
  .registers {
    width: min(100%, 40rem);
    margin-inline: auto;
  }

  .tally {
    flex-direction: row;
    gap: var(--space-2);
  }

  .tally textarea {
    flex: 0 0 40%;
    height: 100%;
  }

  .report {
    flex: 1;
    min-width: 0;
  }

  .figures {
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  }
}

.modes {
  display: flex;
  gap: var(--space-1);
  /* Clear of the settings button, which floats in the corner. */
  padding-right: 1.5rem;
}

.modes button {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.modes button.on {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.registers {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--panel-rule);
}

.reg-label,
.group-title,
.reg-name,
.figure-label {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.reg {
  display: inline-flex;
  gap: var(--space-1);
  padding: 0 var(--space-1);
  border: 0;
  border-left: 2px solid var(--accent-dim);
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.reg:hover {
  background: var(--accent-faint);
}

.reg-value {
  color: var(--accent-strong);
}

.tape {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 1px;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.row:hover {
  background: var(--accent-faint);
}

/* The answer lands on the tape rather than appearing on it: a single wipe from
   the left, in the phosphor, the width of the row. */
.row.landed {
  animation: land calc(260ms * var(--motion-scale)) var(--ease-out) backwards;
}

@keyframes land {
  from {
    clip-path: inset(0 100% 0 0);
    background: var(--accent-dim);
  }
  60% {
    background: var(--accent-faint);
  }
  to {
    clip-path: inset(0 0 0 0);
    background: transparent;
  }
}

.src,
.value {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.src {
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assigned {
  color: var(--accent);
}

.assigned::after {
  content: ' = ';
  color: var(--text-muted);
}

.value {
  color: var(--accent-strong);
  text-align: right;
  white-space: nowrap;
}

.empty {
  margin: auto 0;
  color: var(--text-muted);
  font-size: var(--step--2);
  text-align: center;
}

.keys {
  display: block;
  margin-top: var(--space-1);
  letter-spacing: var(--tracking-wide);
  opacity: 0.7;
}

.entry {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  border-top: 1px solid var(--panel-border);
  padding-top: var(--space-1);
}

/* A refused line jolts once, the way a machine refuses rather than a form. */
.entry[data-shake] {
  animation: refuse calc(140ms * var(--motion-scale)) var(--ease-out);
}

@keyframes refuse {
  0%, 100% { transform: none; }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.caret {
  color: var(--accent);
}

input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--step-0);
  outline: none;
}

.left {
  color: var(--warn);
  font-size: var(--step--2);
}

.clear {
  flex: none;
  border: 1px solid var(--panel-rule);
  padding: 0 var(--space-2);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

.clear:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.answer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 1.6rem;
  /* The ghost is dim until it is committed, so the eye is not pulled to a
     half-typed number as if it were the answer. */
  opacity: 0.75;
}

.error {
  color: var(--warn);
  font-size: var(--step--1);
}

.bits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  justify-content: flex-end;
}

.nibble {
  display: flex;
}

.bit {
  width: 0.62em;
  text-align: center;
  color: var(--accent-faint);
  font-size: var(--step--2);
}

.bit.on {
  color: var(--accent-strong);
  text-shadow: 0 0 4px var(--accent-dim);
}

.help {
  position: absolute;
  inset: 1.6rem var(--space-1) var(--space-1);
  z-index: 3;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
}

.group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.item code {
  color: var(--accent-strong);
}

.note {
  color: var(--text-muted);
  text-align: right;
}

.example {
  align-self: flex-start;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  cursor: pointer;
}

.example:hover {
  text-decoration: underline;
}

.tally {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

textarea {
  flex: 0 0 4.5rem;
  resize: none;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font: inherit;
  padding: var(--space-1);
  outline: none;
}

textarea:focus {
  border-color: var(--accent);
}

.report {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.chart {
  position: relative;
  flex: 0 0 3.5rem;
}

.box {
  position: absolute;
  inset: auto 0 -0.35rem;
  height: 0.5rem;
}

.whisker {
  position: absolute;
  top: 50%;
  height: 1px;
  background: var(--accent-dim);
}

.iqr {
  position: absolute;
  top: 0;
  bottom: 0;
  border: 1px solid var(--accent);
  background: var(--accent-faint);
}

.median {
  position: absolute;
  top: -1px;
  bottom: -1px;
  width: 1px;
  background: var(--accent-strong);
}

.figures {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0 var(--space-2);
  align-content: start;
  margin-top: var(--space-2);
}

.count {
  grid-column: 1 / -1;
  color: var(--text-muted);
  font-size: var(--step--2);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.figure {
  display: flex;
  justify-content: space-between;
  gap: var(--space-1);
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  font: inherit;
  padding: 0;
  cursor: pointer;
}

.figure:hover {
  border-bottom-color: var(--accent-dim);
}

.figure-value {
  color: var(--accent-strong);
}
</style>
