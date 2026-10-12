<script lang="ts">
import type { LogExplainEvent, LogExplainRequest } from '@shared/logwatch/types'
import { pulse } from '../../lib/pulse.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import Markdown from '../aichat/Markdown.svelte'

/**
 * EXPLAIN (docs/logwatch.md §7): first what would be sent, as main put it together, and SEND;
 * then the answer as it is written, drawn from the markdown tree, never as HTML. One question,
 * one answer: a conversation belongs in the AI chat pane.
 */
interface Props {
  request: LogExplainRequest
  /** The provider and model it will go to, for the eye. */
  to: string
  onclose: () => void
}

const { request, to, onclose }: Props = $props()

let preview = $state<string | null>(null)
let missing = $state(false)
let token = $state<string | null>(null)
let answer = $state.raw<LogExplainEvent | null>(null)
let problem = $state<string | null>(null)

$effect(() => {
  const asked = $state.snapshot(request)
  let gone = false
  preview = null
  missing = false
  token = null
  answer = null
  problem = null
  void window.elecdex.logwatch.preview(asked).then((text) => {
    if (gone) return
    preview = text
    missing = text === null
  })
  return () => {
    gone = true
  }
})

/**
 * What came before the token did: a provider that fails at once (nothing listening) can have its
 * last word sent before main's answer to the press arrives. The latest is kept until the token
 * says whose it is.
 */
let early: LogExplainEvent | null = null

function take(event: LogExplainEvent): void {
  answer = event
  if (event.done) sfx.play(event.failure === null ? 'panel' : 'glitch')
}

$effect(() =>
  window.elecdex.logwatch.onExplained((event) => {
    if (token === null) early = event
    else if (event.token === token) take(event)
  }),
)

const writing = $derived(token !== null && answer?.done !== true)
$effect(() => (writing ? pulse.use() : undefined))

// An answer being written stops when the panel goes.
$effect(() => () => {
  if (token !== null && answer?.done !== true) window.elecdex.logwatch.cancelExplain(token)
})

async function send(): Promise<void> {
  problem = null
  sfx.play('expand')
  const started = await window.elecdex.logwatch.explain($state.snapshot(request))
  if ('problem' in started) {
    problem = started.problem
    sfx.play('glitch')
    return
  }
  token = started.token
  if (early?.token === started.token) take(early)
  early = null
}

function stop(): void {
  if (token !== null) window.elecdex.logwatch.cancelExplain(token)
}
</script>

<section class="explain" data-testid="logwatch-explain" aria-label="explain">
  <header>
    <span class="title">EXPLAIN</span>
    <span class="to">{answer?.provider ?? to}{answer ? ` · ${answer.model}` : ''}</span>
    {#if writing}
      <span class="lamp" data-pulse={pulse.phase}>WRITING</span>
      <button type="button" onclick={stop} data-testid="logwatch-explain-stop">STOP</button>
    {:else if token === null}
      <button
        type="button"
        class="send"
        disabled={preview === null}
        onclick={() => void send()}
        data-testid="logwatch-explain-send">SEND</button
      >
    {/if}
    <button type="button" onclick={onclose} data-testid="logwatch-explain-close">CLOSE</button>
  </header>
  <div class="body">
    {#if problem !== null}
      <p class="failed" data-testid="logwatch-explain-problem">{problem}</p>
    {/if}
    {#if token === null}
      {#if missing}
        <p class="note">that line is no longer held: choose it again</p>
      {:else if preview !== null}
        <p class="note">sent only when you press SEND{request.mask ? '' : ' · MASK is off: the values go as written'}</p>
        <pre class="preview" data-testid="logwatch-explain-preview">{preview}</pre>
      {/if}
    {:else if answer !== null}
      {#if answer.failure !== null}
        <p class="failed" data-testid="logwatch-explain-failure">FAILED · {answer.failure}</p>
      {/if}
      <div class="answer" data-testid="logwatch-explain-answer"><Markdown source={answer.text} /></div>
    {/if}
  </div>
</section>

<style>
.explain {
  display: flex;
  flex-direction: column;
  flex: none;
  max-height: 45%;
  min-height: 6rem;
  border-top: 1px solid var(--panel-border);
}

header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.2rem 0.4rem;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  letter-spacing: var(--tracking-wide);
}

.title {
  color: var(--text);
}

.to {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lamp {
  color: var(--accent);
}

.lamp[data-pulse='1'],
.lamp[data-pulse='3'] {
  opacity: 0.7;
}

.lamp[data-pulse='2'] {
  opacity: 0.4;
}

header button {
  padding: 0 0.6rem;
  border: 1px solid var(--panel-rule);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
}

header button:hover {
  color: var(--text);
  border-color: var(--accent);
}

header .send {
  border-color: var(--accent);
  color: var(--text);
}

header .send:disabled {
  opacity: 0.4;
  cursor: default;
}

.body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.2rem 0.6rem 0.4rem;
}

.note {
  margin: 0 0 0.3rem;
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text-muted);
}

.preview {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.failed {
  margin: 0 0 0.3rem;
  color: var(--danger);
  font-family: var(--font-ui);
}

.answer {
  font-size: var(--step-0);
  color: var(--text);
}
</style>
