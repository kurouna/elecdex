<script lang="ts" module>
/**
 * What each pane's CODEC was given, for as long as elecdex runs: kept here
 * rather than in pane state, which is written to disk and travels with saved
 * layouts - a token or the text behind a hash is often a secret. A pane moved
 * (and so remounted) finds its input where it left it.
 */
const inputs = new Map<string, string>()
</script>

<script lang="ts">
import {
  CODEC_GROUPS,
  CODEC_MAX_CHARS,
  CODEC_OPS,
  type CodecOp,
  type CodecResult,
  runCodec,
  takesInput,
} from '@shared/codec'
import { utf8Length } from '@shared/qr'
import type { UtilityPane } from '@shared/utility'
import { untrack } from 'svelte'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'

/**
 * CODEC (docs/architecture.md section 5.16): text encoded, decoded, hashed, a
 * time read both ways, widths changed - pure functions, run on every change of
 * the input, in the page. The operation is the pane's choice; the input is
 * never written to disk.
 */
interface Props {
  paneId: string
  pane: UtilityPane
}

const { paneId, pane }: Props = $props()

// A pane's id does not change while it is mounted: this is where it left off.
let input = $state(untrack(() => inputs.get(paneId) ?? ''))
let result = $state.raw<CodecResult | null>(null)
/** Pressing UUID again makes a new one. */
let again = $state(0)

function setInput(value: string): void {
  input = value.slice(0, CODEC_MAX_CHARS)
  inputs.set(paneId, input)
}

function choose(op: CodecOp): void {
  if (op === pane.codecOp) again += 1
  else widgetState.patch(paneId, { codecOp: op === 'b64' ? undefined : op })
  sfx.play('panel')
}

// The last answer to the last question: a slow hash of an old input never lands over a newer one.
let asked = 0
$effect(() => {
  const op = pane.codecOp
  const text = input
  void again
  asked += 1
  const mine = asked
  void runCodec(op, text, Date.now()).then((answer) => {
    if (mine === asked) result = answer
  })
})

const GROUP_LABELS = {
  encode: 'ENCODE',
  decode: 'DECODE',
  hash: 'HASH',
  time: 'TIME',
  width: 'WIDTH',
  uuid: 'ID',
} as const

const copied = new CopyFlag()
$effect(() => () => copied.dispose())

async function copy(): Promise<void> {
  if (result === null || !result.ok) return
  const text = result.text
  if (await copied.through('out', () => window.elecdex.utility.copy({ kind: 'text', text }))) sfx.play('folder')
}

/** The answer taken as the next question: decode twice, hash what was decoded. */
function carry(): void {
  if (result === null || !result.ok) return
  setInput(result.text)
  sfx.play('expand')
}

const reads = $derived(takesInput(pane.codecOp))
</script>

<div class="codec" data-testid="codec">
  <div class="ops">
    {#each CODEC_GROUPS as group (group)}
      <span class="group">
        <span class="u-label">{GROUP_LABELS[group]}</span>
        {#each CODEC_OPS.filter((op) => op.group === group) as op (op.id)}
          <button
            type="button"
            class="u-chip"
            class:on={pane.codecOp === op.id}
            aria-pressed={pane.codecOp === op.id}
            onclick={() => choose(op.id)}
            data-testid="codec-op"
            data-op={op.id}>{op.label}</button
          >
        {/each}
      </span>
    {/each}
  </div>

  <label class="box">
    <span class="head">
      <span class="u-label">IN</span>
      <span class="count">{input.length.toLocaleString('en-US')} ch · {utf8Length(input).toLocaleString('en-US')} B</span>
    </span>
    <textarea
      class="text"
      spellcheck="false"
      disabled={!reads}
      placeholder={reads ? (pane.codecOp === 'time' ? 'a Unix time or a date; empty is now' : 'text') : 'press UUID again for a new one'}
      value={input}
      oninput={(e) => setInput(e.currentTarget.value)}
      data-testid="codec-input"
    ></textarea>
  </label>

  <div class="box">
    <span class="head">
      <span class="u-label">OUT</span>
      {#if result !== null && result.ok}
        <span class="count">{result.text.length.toLocaleString('en-US')} ch</span>
      {/if}
      <span class="tools">
        <button
          type="button"
          class="u-chip"
          disabled={result === null || !result.ok || !reads}
          title="use the result as the input"
          onclick={carry}
          data-testid="codec-carry">⇅</button
        >
        <button
          type="button"
          class="u-chip"
          disabled={result === null || !result.ok}
          onclick={() => void copy()}
          data-testid="codec-copy">{copied.key === 'out' ? 'COPIED' : 'COPY'}</button
        >
      </span>
    </span>
    {#if result !== null && !result.ok}
      <p class="text error" data-testid="codec-error">{result.error}</p>
    {:else}
      <pre class="text out" data-testid="codec-output">{result?.text ?? ''}</pre>
    {/if}
    {#if result !== null && result.ok && result.note !== undefined}
      <span class="note" data-testid="codec-note">{result.note}</span>
    {/if}
  </div>
</div>

<style>
.codec {
  display: grid;
  flex: 1;
  grid-template-rows: auto minmax(3.5rem, 1fr) minmax(3.5rem, 1fr);
  gap: 0.45rem;
  min-height: 0;
}

.ops {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.8rem;
}

.group {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.box {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 0;
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.count {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.tools {
  display: flex;
  gap: 0.3rem;
  margin-left: auto;
}

.text {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.25rem 0.4rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  overflow: auto;
  resize: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

textarea.text:focus {
  border-color: var(--accent);
  outline: none;
}

textarea.text:disabled {
  opacity: 0.5;
}

.out {
  color: var(--accent-strong);
  user-select: text;
}

.error {
  color: var(--warn);
}

.note {
  font-size: var(--step--2);
  color: var(--text-muted);
}
</style>
