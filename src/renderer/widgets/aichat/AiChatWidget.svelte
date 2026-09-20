<script lang="ts">
import {
  type AiModel,
  applyChatEvent,
  type ChatMessage,
  type ChatView,
  EMPTY_VIEW,
  paneAiChat,
} from '@shared/ai'
import { tick } from 'svelte'
import ConfirmButton from '../../ConfirmButton.svelte'
import { ai } from '../../stores/ai.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { layout } from '../../stores/layout.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import Markdown from './Markdown.svelte'

/**
 * A conversation with a language model: a local server or a hosted service the
 * user listed in the settings (shared/ai.ts).
 *
 * The pane holds three choices - which conversation, which provider, which
 * model - and nothing else. The conversation is main's, and so is the answer
 * being written: this component follows it, so being moved (which remounts it),
 * sitting behind another tab or a reload of the page costs the answer nothing.
 * Nothing is asked of any provider until the user sends a message, or opens the
 * model list.
 *
 *   Enter        send          Shift+Enter  a new line
 *   Esc          stop the answer, or leave the edit
 */
const { paneId, state: paneState }: WidgetProps = $props()

const choice = $derived(paneAiChat(paneState))
const providers = $derived(appearance.settings.ai.providers)
/** The provider in use: the pane's own, while it is still listed, or the first one. */
const provider = $derived(providers.find((p) => p.id === choice.provider) ?? providers[0] ?? null)
/** The model in use: the pane's own for its own provider, else the provider's default. */
const model = $derived(
  provider === null
    ? ''
    : ((provider.id === choice.provider ? choice.model : null) ?? provider.model),
)

$effect(() => ai.use())

function save(change: Record<string, unknown>): void {
  layout.setPaneState(paneId, { ...paneState, ...change })
}

let view = $state.raw<ChatView>(EMPTY_VIEW)
/** The conversation the view belongs to: a pane switched to another shows nothing of the last one. */
let viewOf: string | null = null
let problem = $state<string | null>(null)

$effect(() => {
  const chatId = choice.chat
  view = EMPTY_VIEW
  viewOf = chatId
  if (chatId === null) return
  let off: (() => void) | null = null
  const follow = (): void => {
    off = window.elecdex.ai.subscribe(chatId, (event) => {
      if (viewOf !== chatId) return
      // Deleted, here or from another pane: main says so, and the pane lets go of it.
      if (event.type === 'snapshot' && event.chat === null) {
        save({ chat: undefined })
        return
      }
      const next = applyChatEvent(view, event)
      if (next !== 'resync') {
        view = next
        return
      }
      // A piece went missing: start over from a snapshot rather than show a text with a hole.
      off?.()
      follow()
    })
  }
  follow()
  return () => off?.()
})

const messages = $derived(view.chat?.messages ?? [])
const run = $derived(view.run)
const busy = $derived(run !== null)
const title = $derived(view.chat?.title ?? '')

$effect(() => {
  const name = title === '' ? null : title
  const using = model === '' ? null : model
  paneMeta.set(paneId, {
    ...(name === null && using === null
      ? {}
      : { subtitle: [name, using].filter((part) => part !== null).join(' · ') }),
    ...(busy ? { badge: 'writing', badgeKind: 'ok' as const } : {}),
  })
})

/*
 * The list keeps to its end while an answer grows, unless the user has scrolled
 * up to read: then it stays where they put it.
 */
let list = $state<HTMLDivElement | null>(null)
let pinned = true

function scrolled(): void {
  if (list === null) return
  pinned = list.scrollHeight - list.scrollTop - list.clientHeight < 24
}

$effect(() => {
  // Everything that makes the list longer.
  void [messages.length, run?.text.length, run?.thinking.length]
  if (!pinned || list === null) return
  const el = list
  void tick().then(() => {
    el.scrollTop = el.scrollHeight
  })
})

let draft = $state('')
/** The earlier question being rewritten; sending replaces it and everything after it. */
let editing = $state<string | null>(null)
let composer = $state<HTMLTextAreaElement | null>(null)

async function ask(text: string | undefined, replaceFrom?: string): Promise<boolean> {
  if (provider === null || model === '' || busy) return false
  problem = null
  const request = {
    provider: provider.id,
    model,
    ...(text === undefined ? {} : { text }),
    ...(replaceFrom === undefined ? {} : { replaceFrom }),
  }
  const fresh = choice.chat === null
  const chatId = choice.chat ?? (await window.elecdex.ai.create())
  if (chatId === null) {
    problem = 'no more conversations can be kept - delete some from the history'
    return false
  }
  pinned = true
  const result = await window.elecdex.ai.send(chatId, request)
  if (result.ok) {
    if (fresh) save({ chat: chatId })
    return true
  }
  problem = result.error
  // A conversation made for a message that was never taken is not one.
  if (fresh) void window.elecdex.ai.remove(chatId)
  return false
}

async function send(): Promise<void> {
  const text = draft.trim()
  if (text === '') return
  const replaced = editing
  if (await ask(text, replaced ?? undefined)) {
    draft = ''
    editing = null
  }
}

function edit(message: ChatMessage): void {
  editing = message.id
  draft = message.text
  composer?.focus()
}

function leaveEdit(): void {
  editing = null
  draft = ''
}

function onComposerKey(event: KeyboardEvent): void {
  // Enter that confirms an IME conversion is not the Enter that sends.
  if (event.isComposing || event.keyCode === 229) return
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    void send()
  } else if (event.key === 'Escape') {
    if (busy && choice.chat !== null) window.elecdex.ai.stop(choice.chat)
    else if (editing !== null) leaveEdit()
    else return
    event.stopPropagation()
  }
}

function newChat(): void {
  leaveEdit()
  problem = null
  historyOpen = false
  save({ chat: undefined })
  composer?.focus()
}

let historyOpen = $state(false)

function openChat(id: string): void {
  leaveEdit()
  problem = null
  historyOpen = false
  save({ chat: id })
}

async function removeChat(id: string): Promise<void> {
  await window.elecdex.ai.remove(id)
  if (id === choice.chat) save({ chat: undefined })
}

/*
 * The provider's models are asked for when the user opens the list, never on
 * mount: a pane sitting in a layout must not call anyone by itself.
 */
let models = $state.raw<AiModel[]>([])
let modelsOf: string | null = null
let modelsProblem = $state<string | null>(null)

async function loadModels(): Promise<void> {
  if (provider === null || modelsOf === provider.id) return
  const id = provider.id
  modelsOf = id
  const result = await window.elecdex.ai.models(id)
  if (modelsOf !== id) return
  models = result.models
  modelsProblem = result.error
  // Asked again next time, in case the server was only not running yet.
  if (result.error !== null) modelsOf = null
}

function chooseProvider(id: string): void {
  models = []
  modelsOf = null
  modelsProblem = null
  save({ provider: id, model: undefined })
}

function chooseModel(value: string): void {
  const next = value.trim()
  if (provider === null || next === '' || next === model) return
  save({ provider: provider.id, model: next })
}

const time = (at: number): string => new Date(at).toTimeString().slice(0, 5)

const STOP_WORDS: Record<NonNullable<ChatMessage['stop']>, string> = {
  stopped: 'stopped',
  length: 'cut off at the length limit',
  refusal: 'the model declined',
  error: 'failed',
}

let copiedId = $state<string | null>(null)
function copyMessage(message: ChatMessage): void {
  void navigator.clipboard.writeText(message.text).then(() => {
    copiedId = message.id
    setTimeout(() => {
      if (copiedId === message.id) copiedId = null
    }, 1500)
  })
}
</script>

<div class="chat" data-testid="aichat" data-busy={busy}>
  <SettingsButton
    open={false}
    label="ai settings"
    testid="aichat-settings"
    ontoggle={() => ui.openSettings('ai')}
  />

  {#if provider === null}
    <div class="setup" data-testid="aichat-setup">
      <p>
        No provider yet. Add a local server (Ollama, LM Studio, llama.cpp) or a service you have an
        API key for; nothing is sent anywhere until you send a message.
      </p>
      <button type="button" class="cmd" onclick={() => ui.openSettings('ai')} data-testid="aichat-open-settings">
        set up a provider
      </button>
    </div>
  {:else}
    <div class="bar">
      <select
        value={provider.id}
        onchange={(e) => chooseProvider(e.currentTarget.value)}
        aria-label="provider"
        data-testid="aichat-provider"
      >
        {#each providers as p (p.id)}
          <option value={p.id}>{p.name}</option>
        {/each}
      </select>
      <input
        type="text"
        class="model"
        list={`models-${paneId}`}
        value={model}
        placeholder="model"
        spellcheck="false"
        aria-label="model"
        title={modelsProblem ?? 'the model to ask; the list is read from the provider when you open it'}
        onfocus={() => void loadModels()}
        onchange={(e) => chooseModel(e.currentTarget.value)}
        data-testid="aichat-model"
      />
      <datalist id={`models-${paneId}`}>
        {#each models as m (m.id)}
          <option value={m.id}>{m.label ?? ''}</option>
        {/each}
      </datalist>
      <button type="button" class="cmd" onclick={newChat} disabled={busy} data-testid="aichat-new">new</button>
      <button
        type="button"
        class="cmd"
        aria-expanded={historyOpen}
        onclick={() => (historyOpen = !historyOpen)}
        data-testid="aichat-history-toggle"
      >
        history
      </button>
    </div>

    {#if historyOpen}
      <ul class="history" data-testid="aichat-history">
        {#each ai.chats.filter((chat) => chat.messages > 0) as chat (chat.id)}
          <li class:current={chat.id === choice.chat}>
            <button type="button" class="open" onclick={() => openChat(chat.id)} data-testid="aichat-history-item">
              <span class="name">{chat.title === '' ? 'untitled' : chat.title}</span>
              <span class="when">{new Date(chat.updatedAt).toLocaleDateString()} · {chat.messages}</span>
            </button>
            <button
              type="button"
              class="cmd"
              title="save as markdown"
              onclick={() => void window.elecdex.ai.export(chat.id)}
            >
              export
            </button>
            <ConfirmButton
              label="delete"
              action="delete"
              title="Delete this conversation"
              testid="aichat-history-delete"
              onconfirm={() => void removeChat(chat.id)}
            />
          </li>
        {:else}
          <li class="none">No conversations yet.</li>
        {/each}
      </ul>
    {/if}

    <div class="messages" bind:this={list} onscroll={scrolled} data-testid="aichat-messages">
      {#if messages.length === 0 && !busy}
        <p class="note" data-testid="aichat-empty">
          {model === ''
            ? 'Choose a model above, then ask.'
            : `Ask ${provider.name} · ${model}. Conversations are kept on this computer.`}
        </p>
      {/if}
      {#each messages as message, i (message.id)}
        <article class="message {message.role}" data-testid="aichat-message" data-role={message.role}>
          <header>
            <span>{message.role === 'user' ? 'you' : (message.model ?? 'assistant')}</span>
            <span class="when">{time(message.at)}</span>
            {#if message.usage}
              <span class="when" title="tokens read · tokens written">{message.usage.input} · {message.usage.output} tok</span>
            {/if}
            <span class="spacer"></span>
            <button type="button" class="act" onclick={() => copyMessage(message)}>
              {copiedId === message.id ? 'copied' : 'copy'}
            </button>
            {#if message.role === 'user'}
              <button type="button" class="act" disabled={busy} onclick={() => edit(message)} data-testid="aichat-edit">edit</button>
            {:else if i === messages.length - 1}
              <button type="button" class="act" disabled={busy} onclick={() => void ask(undefined)} data-testid="aichat-regenerate">
                again
              </button>
            {/if}
          </header>
          {#if message.thinking}
            <details class="thinking">
              <summary>reasoning</summary>
              <p>{message.thinking}</p>
            </details>
          {/if}
          {#if message.role === 'user'}
            <p class="said">{message.text}</p>
          {:else if message.text !== ''}
            <Markdown source={message.text} />
          {/if}
          {#if message.stop}
            <p class="stop" class:failed={message.stop === 'error' || message.stop === 'refusal'} data-testid="aichat-stop">
              {STOP_WORDS[message.stop]}{message.error ? `: ${message.error}` : ''}
            </p>
          {/if}
        </article>
      {/each}
      {#if run !== null}
        <article class="message assistant running" data-testid="aichat-run">
          <header>
            <span>{run.model}</span>
            <span class="when">writing…</span>
          </header>
          {#if run.thinking !== ''}
            <details class="thinking" open={run.text === ''}>
              <summary>reasoning</summary>
              <p>{run.thinking}</p>
            </details>
          {/if}
          {#if run.text !== ''}
            <Markdown source={run.text} />
          {:else if run.thinking === ''}
            <p class="note">waiting for {run.provider}…</p>
          {/if}
        </article>
      {/if}
    </div>

    {#if problem !== null}
      <p class="problem" data-testid="aichat-problem">{problem}</p>
    {/if}

    <form
      class="composer"
      onsubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <textarea
        bind:this={composer}
        bind:value={draft}
        rows="2"
        placeholder={editing === null ? 'message · enter to send, shift+enter for a new line' : 'rewriting an earlier message · esc to leave it as it was'}
        onkeydown={onComposerKey}
        data-testid="aichat-input"
      ></textarea>
      {#if busy}
        <button
          type="button"
          class="cmd stop"
          onclick={() => choice.chat !== null && window.elecdex.ai.stop(choice.chat)}
          data-testid="aichat-stop-button"
        >
          stop
        </button>
      {:else}
        <button type="submit" class="cmd" disabled={draft.trim() === '' || model === ''} data-testid="aichat-send">
          {editing === null ? 'send' : 'resend'}
        </button>
      {/if}
    </form>
  {/if}
</div>

<style>
.chat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  position: relative;
  padding: 0 var(--space-1);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  color: var(--text);
}

.setup {
  margin: auto;
  max-width: 28rem;
  text-align: center;
  color: var(--text-muted);
  line-height: 1.5;
}

.bar {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  /* Clears the settings button in the corner. */
  padding-right: 1.6rem;
  min-height: 1.4rem;
}

select,
.model {
  min-width: 0;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

select {
  flex: 0 1 9rem;
}

.model {
  flex: 1 1 8rem;
}

select:focus,
.model:focus,
textarea:focus {
  border-color: var(--accent);
  outline: none;
}

.cmd {
  padding: 0 var(--space-2);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
}

.cmd:not(:disabled):hover,
.cmd[aria-expanded='true'] {
  color: var(--accent);
  border-color: var(--accent);
}

.cmd:disabled {
  opacity: 0.5;
  cursor: default;
}

.cmd.stop {
  border-color: var(--warn);
  color: var(--warn);
}

.history {
  flex: 0 1 40%;
  min-height: 3rem;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  border: 1px solid var(--panel-border);
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
}

.history li {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  padding: 0.1rem var(--space-1);
}

.history li + li {
  border-top: 1px solid var(--panel-rule);
}

.history li.current .name {
  color: var(--accent-strong);
}

.history .none {
  color: var(--text-muted);
}

.open {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: var(--space-2);
  justify-content: space-between;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.open:hover .name,
.open:focus-visible .name {
  color: var(--accent);
}

.name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.when {
  flex: none;
  color: var(--text-muted);
  font-size: var(--step--2);
}

.messages {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-y: auto;
  padding-right: var(--space-1);
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
  /* Text here is for reading and copying, unlike the HUD around it. */
  user-select: text;
}

.message {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.message header {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent-strong);
  user-select: none;
}

.message.user {
  padding: var(--space-1) var(--space-2);
  border-left: 2px solid var(--accent);
  background: var(--accent-faint);
}

.spacer {
  flex: 1;
}

.act {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
  opacity: 0;
}

.message:hover .act,
.act:focus-visible {
  opacity: 1;
}

.act:not(:disabled):hover {
  color: var(--accent);
}

.act:disabled {
  cursor: default;
}

.said {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.thinking {
  color: var(--text-muted);
  font-size: var(--step--2);
}

.thinking summary {
  cursor: pointer;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  user-select: none;
}

.thinking p {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-2);
  border-left: 1px solid var(--panel-rule);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.4;
}

.note {
  margin: 0;
  color: var(--text-muted);
}

.stop {
  margin: 0;
  font-size: var(--step--2);
  color: var(--text-muted);
}

.stop.failed,
.problem {
  color: var(--warn);
}

.problem {
  margin: 0;
  font-size: var(--step--2);
}

.composer {
  display: flex;
  align-items: stretch;
  gap: var(--space-1);
  padding-bottom: var(--space-1);
}

textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  padding: var(--space-1);
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text);
  font-family: var(--font-ui);
  font-size: var(--step--1);
  line-height: 1.4;
  field-sizing: content;
  min-height: 2.6rem;
  max-height: 40%;
}
</style>
