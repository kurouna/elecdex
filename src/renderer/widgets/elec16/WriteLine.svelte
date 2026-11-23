<script lang="ts">
import type { AiModel, AiProvider } from '@shared/ai'
import { MAX_FIXES, writeSteps } from '@shared/elec16/write-flow'
import { WRITE_LIMITS } from '@shared/elec16/write-prompt'
import { untrack } from 'svelte'
import { afterBlink } from '../../lib/blink.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import { composing } from '../../lib/ime.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { focusStart, type Question, questionFocus, questionKey } from '../../lib/question-keys.ts'
import ModelField from '../aichat/ModelField.svelte'
import type { WriteFlow } from './write-flow.svelte.ts'

/**
 * CODE's WRITE line (docs/elec16-write.md section 2; the mock in docs/elec16-ai-code-mock): the
 * steps a SEND goes through, the composer as the AI chat pane's - the words, the provider and
 * model, SEND or STOP - and one line under it that says what is sent, asks before code of one's
 * own is replaced, or says how the SEND ended. It draws the pane's WriteFlow and keeps nothing.
 */
interface Props {
  flow: WriteFlow
  file: string
  providers: readonly AiProvider[]
  /** The provider in use (the pane's, else the first) and its model; null: none set. */
  provider: AiProvider | null
  model: string
  /** Whether the pane is seen: the elapsed seconds count only then. */
  seen: boolean
  /** Why SEND cannot be pressed beyond the words (no unit, the source not read yet). */
  blocked: boolean
  onprovider: (id: string) => void
  onmodel: (model: string) => void
}

const { flow, file, providers, provider, model, seen, blocked, onprovider, onmodel }: Props =
  $props()

let words = $state<HTMLTextAreaElement | null>(null)
let box = $state<HTMLDivElement | null>(null)
let line = $state<HTMLParagraphElement | null>(null)
let replaceButton = $state<HTMLButtonElement | null>(null)
let cancelButton = $state<HTMLButtonElement | null>(null)
let sendButton = $state<HTMLButtonElement | null>(null)

const BUSY_STATES: ReadonlySet<string> = new Set(['thinking', 'writing', 'compiling', 'fixing'])
const busy = $derived(flow.busy)
const asking = $derived(flow.state === 'confirm')
const sendable = $derived(
  !blocked && provider !== null && model.trim() !== '' && flow.words.trim() !== '',
)

$effect(() => (busy && seen ? pulse.use() : undefined))

/** Seconds since the SEND, counted on the wall clock's seconds while the pane is seen. */
let elapsed = $state(0)
$effect(() => {
  const began = flow.startedAt
  if (began === null) return
  const count = (): void => {
    const next = Math.max(0, Math.floor((Date.now() - began) / 1000))
    if (next !== elapsed) elapsed = next
  }
  untrack(count)
  return seen ? onBoundary(1000, count) : undefined
})

const clock = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`

/** The steps as the state has them (write-flow.ts): FIX only once a fix has been asked for. */
const steps = $derived(writeSteps(flow.state, flow.fixes, flow.bytes))

const meta = $derived.by((): string => {
  if (steps.length === 0) return ''
  // While a SEND runs, the seconds counting; after, what it took.
  const parts = [clock(busy ? elapsed : flow.took)]
  if (flow.bytes > 0) parts.push(kb(flow.bytes))
  if (!busy && flow.tokens !== null) parts.push(`${flow.tokens.toLocaleString('en-US')} tokens`)
  return parts.join(' · ')
})

/** Said to a screen reader as the state changes; the code coming in is not. */
const spoken = $derived(
  {
    idle: '',
    confirm: 'Replace the code?',
    thinking: 'Thinking',
    writing: 'Writing',
    compiling: 'Compiling',
    fixing: `Fixing, ${flow.fixes} of ${MAX_FIXES}`,
    ready: 'Ready',
    stopped: 'Stopped',
    failed: 'Failed',
  }[flow.state],
)

const lines = (n: number): string => `${n} line${n === 1 ? '' : 's'}`

const readyText = $derived.by((): string => {
  const how =
    flow.fixes === 0
      ? 'compiled at once'
      : `compiled after ${flow.fixes} fix${flow.fixes === 1 ? '' : 'es'}`
  const level =
    flow.switched !== null ? ` at -O${flow.level} (moved there: smaller)` : ` at -O${flow.level}`
  // A change to a program says how much it changed; a new one, how long it is.
  const what = flow.changedOwn
    ? `Changed from “${flow.sentWords}”`
    : `Written from “${flow.sentWords}”`
  const size = flow.changedOwn ? `${lines(flow.changed)} changed` : lines(flow.changed)
  return `${what}, ${how} · ${flow.size.toLocaleString('en-US')} bytes${level} · ${size}.`
})

function send(): void {
  if (busy) {
    flow.stop()
    return
  }
  if (!sendable) return
  flow.send()
}

/** Escape anywhere in the line stops a SEND under way: the words, SEND/STOP, the model. */
function onWriteKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !busy) return
  event.preventDefault()
  flow.stop()
}

function onWordsKey(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey || composing(event) || event.repeat) return
  event.preventDefault()
  if (!busy && sendable && sendButton !== null) afterBlink(sendButton, send)
}

const question = (): Question => ({
  box: line,
  row: [replaceButton, cancelButton],
  start: replaceButton,
  cancel: () => flow.cancel(),
})

$effect(() => {
  if (!asking) return
  return focusStart(question)
})

/**
 * The question's keys, only where it is: inline in one pane, it never takes a key typed elsewhere
 * (a shell the keyboard went to). The keyboard leaving it answers it as CANCEL.
 */
function onLineKey(event: KeyboardEvent): void {
  if (asking) questionKey(event, question())
}

function onLineFocusOut(event: FocusEvent): void {
  const to = event.relatedTarget
  // The pane taking the keyboard back on a press inside it (its root holds the line) is not
  // leaving: only somewhere beside the question is.
  if (!asking || !(to instanceof Node) || line === null) return
  if (!line.contains(to) && !to.contains(line)) flow.cancel()
}

/** The question is the line's, not the pane's: a press anywhere else answers it as CANCEL. */
function onWindowPointer(event: PointerEvent): void {
  if (asking && !(event.target instanceof Node && line?.contains(event.target))) flow.cancel()
}

/**
 * READY gives the words the keyboard, for the next change - only as it is reached, and only if the
 * keyboard was nowhere or in this line: one typing in a shell meanwhile keeps it there.
 */
let wasBusy = false
$effect(() => {
  const now = flow.state
  const ended = wasBusy && now === 'ready'
  wasBusy = BUSY_STATES.has(now)
  if (!ended) return
  const active = document.activeElement
  if (active === null || active === document.body || (box?.contains(active) ?? false)) {
    words?.focus({ preventScroll: true })
  }
})

let models = $state.raw<AiModel[]>([])
let modelsOf: string | null = null
let modelsProblem = $state<string | null>(null)
let modelsLoading = $state(false)

async function loadModels(): Promise<void> {
  if (provider === null || modelsOf === provider.id) return
  const id = provider.id
  modelsOf = id
  modelsLoading = true
  const result = await window.elecdex.ai.models(id)
  if (modelsOf !== id) return
  modelsLoading = false
  models = result.models
  modelsProblem = result.error
  if (result.error !== null) modelsOf = null
}

$effect(() => {
  // Another provider: its list is read again when the field is next opened.
  void provider?.id
  models = []
  modelsOf = null
  modelsProblem = null
  modelsLoading = false
})
</script>

<svelte:window onpointerdowncapture={onWindowPointer} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={box}
  class="write"
  onkeydown={onWriteKey}
  data-owns-escape={busy || undefined}
  data-testid="elec16-write"
>
  <div class="steps" aria-hidden="true" data-testid="elec16-write-steps">
    {#each steps as step, k (step.name)}
      {#if k > 0}<span class="rule"></span>{/if}
      <span class="step {step.kind}" data-phase={step.kind === 'now' ? pulse.phase : undefined}>{step.name}</span>
    {/each}
    {#if meta !== ''}<span class="meta" data-testid="elec16-write-meta">{meta}</span>{/if}
  </div>

  <form
    class="composer"
    onsubmit={(e) => {
      e.preventDefault()
    }}
  >
    <span class="label">write</span>
    <span class="words">
      <span class="prompt" aria-hidden="true">&gt;</span>
      <textarea
        bind:this={words}
        bind:value={flow.words}
        rows="1"
        maxlength={WRITE_LIMITS.words}
        aria-label="what to write"
        placeholder={provider === null
          ? 'an AI provider in Settings ▸ AI is needed to write code'
          : flow.lastWritten !== null
            ? 'what to change · enter to send'
            : 'what to make · enter to send, shift+enter for a new line'}
        disabled={provider === null}
        readonly={busy || asking}
        onkeydown={onWordsKey}
        data-owns-escape={busy || undefined}
        data-testid="elec16-write-words"
      ></textarea>
    </span>
    {#if provider !== null}
      <span class="ends">
        <select
          value={provider.id}
          disabled={busy}
          onchange={(e) => onprovider(e.currentTarget.value)}
          aria-label="AI provider"
          data-testid="elec16-write-provider"
        >
          {#each providers as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
        <span class="model">
          <ModelField
            value={model}
            {models}
            title={modelsProblem ?? 'the model to ask; the list is read from the provider when you open it'}
            wanting={model.trim() === ''}
            onopen={() => void loadModels()}
            onchoose={onmodel}
            up
            testid="elec16-write-model"
          />
          {#if modelsLoading}
            <span class="tag">querying</span>
          {:else if modelsProblem !== null}
            <span class="tag warn">no list</span>
          {/if}
        </span>
        <button
          bind:this={sendButton}
          type="button"
          class="cmd"
          class:stop={busy}
          class:lit={!busy}
          disabled={!busy && (!sendable || asking)}
          onclick={(e) => (busy ? flow.stop() : afterBlink(e.currentTarget, send))}
          data-testid="elec16-write-send">{busy ? 'stop' : 'send'}</button
        >
      </span>
    {/if}
  </form>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <p
    bind:this={line}
    class="line"
    tabindex="-1"
    onfocusin={(e) => asking && questionFocus(e, question())}
    onfocusout={onLineFocusOut}
    onkeydown={onLineKey}
    data-owns-escape={asking || undefined}
    data-testid="elec16-write-line"
  >
    {#if provider === null}
      <span class="warn">No AI provider is set.</span>
      <span>Add one in <b>Settings ▸ AI</b> to write code from words.</span>
    {:else if model.trim() === ''}
      <span class="warn">{provider.name} has no model chosen:</span>
      <span>pick one here or in Settings ▸ AI.</span>
    {:else if asking}
      <span class="mark warn">replace?</span>
      <span>WRITE replaces the code in <b>{file}</b> with what the AI writes. UNDO puts it back.</span>
      <span class="gap"></span>
      <button bind:this={replaceButton} type="button" class="e16-btn" onclick={(e) => afterBlink(e.currentTarget, () => flow.replace())} data-testid="elec16-write-replace">replace</button>
      <button bind:this={cancelButton} type="button" class="e16-btn" onclick={() => flow.cancel()} data-testid="elec16-write-cancel">cancel</button>
    {:else if busy}
      <span
        >{flow.state === 'fixing'
          ? `COMPILE found ${flow.errors.length} error${flow.errors.length === 1 ? '' : 's'}. It goes back to the model; the code stays as it is until the fix has all come.`
          : 'The editor is the model’s until it is done. Esc or STOP keeps what has come.'}</span
      >
    {:else if flow.state === 'ready' || flow.state === 'failed' || flow.state === 'stopped'}
      {#if flow.undone}
        <span class="mark ok">undone</span>
        <span>The code before WRITE is back.</span>
      {:else if flow.state === 'ready'}
        <span class="mark ok">ready</span>
        <span data-testid="elec16-write-result">{readyText}</span>
      {:else}
        <span class="mark" class:bad={flow.state === 'failed'} class:warn={flow.state === 'stopped'}>{flow.state}</span>
        <span class:bad={flow.state === 'failed' && flow.errors.length === 0} data-testid="elec16-write-result">{flow.note}</span>
      {/if}
      {#if flow.canUndo}
        <span class="gap"></span>
        <button type="button" class="e16-btn" onclick={(e) => afterBlink(e.currentTarget, () => flow.undo())} data-testid="elec16-write-undo">{flow.undone ? 'redo' : 'undo'}</button>
      {/if}
    {:else}
      <span>Sent: your words and the code in <b>{file}</b>, to {provider.name} · {model}.</span>
    {/if}
  </p>
  <p class="sr" aria-live="polite" data-testid="elec16-write-live">{spoken}</p>
</div>

<style>
.write {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* The steps a SEND goes through. Its height is kept while idle, so nothing above moves when it lights. */
.steps {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 1.4rem;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.step {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.step::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  border: 1px solid currentColor;
  transform: rotate(45deg);
}

.step.done {
  color: var(--text);
}

.step.done::before {
  background: currentColor;
}

.step.now {
  color: var(--accent-strong);
}

.step.now::before {
  background: var(--accent);
  border-color: var(--accent);
}

.step.now[data-phase='2']::before {
  background: transparent;
}

.step.bad {
  color: var(--danger);
}

.step.bad::before {
  background: var(--danger);
  border-color: var(--danger);
}

.step.off {
  color: var(--warn);
}

.rule {
  flex: 0 0 1.2rem;
  height: 1px;
  background: var(--panel-rule);
}

.meta {
  margin-left: auto;
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

/* A command line as the AI chat pane's: the label, the prompt, the words, the provider and model, SEND. */
.composer {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  border: 1px solid var(--panel-border);
}

.composer:focus-within {
  border-color: var(--accent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.label {
  flex: none;
  display: flex;
  align-items: center;
  padding: 0 var(--space-2);
  border-right: 1px solid var(--panel-rule);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.composer:focus-within .label {
  color: var(--accent);
}

.words {
  flex: 1 1 16rem;
  display: flex;
  min-width: 0;
}

.prompt {
  flex: none;
  padding: var(--space-1) 0 0 var(--space-2);
  font-family: var(--font-mono);
  line-height: 1.4;
  color: var(--accent);
}

.composer:not(:focus-within) .prompt {
  color: var(--text-muted);
}

textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  padding: var(--space-1) var(--space-2);
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step-1);
  line-height: 1.4;
  field-sizing: content;
  min-height: 1.4em;
  max-height: 8rem;
}

textarea:disabled,
textarea[readonly] {
  color: var(--text-muted);
}

/*
 * The provider, the model and SEND keep together, drawn as the AI chat pane's: the provider and
 * the model as its bar's boxes, SEND and STOP as its composer's key. In a narrow pane they wrap
 * under the words as one row.
 */
.ends {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  padding-left: var(--space-1);
}

select {
  flex: 0 1 9rem;
  min-width: 0;
  align-self: center;
  height: 1.5rem;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

select:focus {
  border-color: var(--accent);
  outline: none;
}

/* The list the system draws takes its ground from here: never transparent (white on Windows). */
select option {
  background: var(--app-bg);
  color: var(--text);
}

.model {
  position: relative;
  display: flex;
  align-items: stretch;
  width: 14rem;
  height: 1.5rem;
}

.model .tag {
  position: absolute;
  right: var(--space-1);
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
  pointer-events: none;
}

.model .tag.warn {
  color: var(--warn);
}

/* SEND and STOP: the AI chat composer's key, its rule down its left. */
.cmd {
  flex: none;
  align-self: stretch;
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  border: 0;
  border-left: 1px solid var(--panel-border);
  background: transparent;
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
  cursor: pointer;
}

.cmd.lit:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent-strong);
  background: var(--accent-faint);
}

.cmd.lit:not(:disabled):hover,
.cmd.lit:not(:disabled):focus-visible {
  background: var(--accent);
  color: var(--app-bg);
  outline: none;
}

.cmd:disabled {
  opacity: 0.5;
  cursor: default;
}

/* STOP: in words of the warning colour; its rule stays the line's own, not a second colour. */
.cmd.stop {
  color: var(--warn);
}

/* The answer the keyboard is on, which Enter presses: filled, as every question's (QuitDialog). */
.line .e16-btn:focus {
  border-color: var(--accent-strong);
  background: var(--accent-strong);
  color: var(--text-inverse);
  outline: none;
}

/* One line under the composer: what is sent, the question before a REPLACE, or how the SEND ended. */
.line {
  margin: 0;
  min-height: 1.6rem;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--step--1);
  color: var(--text-muted);
  outline: none;
}

.line b {
  font-weight: 500;
  color: var(--text);
}

.mark {
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.warn {
  color: var(--warn);
}

.mark.ok {
  color: var(--accent-strong);
}

.bad {
  color: var(--danger);
}

.gap {
  flex: 1;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
