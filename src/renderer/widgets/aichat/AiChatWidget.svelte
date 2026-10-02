<script lang="ts">
import {
  type AiModel,
  ATTACH_LIMITS,
  aiBaseUrl,
  applyChatEvent,
  type ChatAttachment,
  type ChatMessage,
  type ChatView,
  compactCount,
  EMPTY_VIEW,
  FAILED_STOPS,
  fileSize,
  paneAiChat,
  STOP_CODES,
  takesPdf,
  tokensPerSecond,
  usageText,
} from '@shared/ai'
import { tick } from 'svelte'
import { CopyFlag } from '../../lib/copied.svelte.ts'
import { crtPower } from '../../lib/crt-transitions.ts'
import { onBoundary } from '../../lib/frame-loop.ts'
import { anchorOf, type CardAnchor, type CardSize, HoverRest } from '../../lib/hover-card.ts'
import { pulse } from '../../lib/pulse.svelte.ts'
import { ai } from '../../stores/ai.svelte.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import { sfx } from '../../stores/sound.svelte.ts'
import { ui } from '../../stores/ui.svelte.ts'
import { widgetState } from '../../stores/widget-state.svelte.ts'
import CodeLine from '../common/CodeLine.svelte'
import SessionLog from '../common/SessionLog.svelte'
import SettingsButton from '../common/SettingsButton.svelte'
import type { WidgetProps } from '../registry.ts'
import { ChatDraft } from './draft.svelte.ts'
import FileCard from './FileCard.svelte'
import Markdown from './Markdown.svelte'
import ModelField from './ModelField.svelte'
import Payload from './Payload.svelte'

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
 *
 * Files go with a question when the user picks them (+), drops them on the pane or pastes a
 * picture: read here as bytes, never a path, and judged by main (shared/ai-attach.ts).
 */
const { paneId, state: paneState }: WidgetProps = $props()

const choice = $derived(paneAiChat(paneState))
const providers = $derived(appearance.settings.ai.providers)

$effect(() => ai.use())

function save(change: Record<string, unknown>): void {
  widgetState.patch(paneId, change)
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

/** Who last answered here. A provider is remembered by name: its id goes when it is removed. */
const lastAnswer = $derived(
  messages.findLast((m) => m.role === 'assistant' && m.model !== undefined),
)
/**
 * The provider in use: the pane's own while it is listed; else the one that
 * answered this conversation, by name (removed and added again, it has a new
 * id); else the first.
 */
const provider = $derived(
  providers.find((p) => p.id === choice.provider) ??
    providers.find((p) => p.name === lastAnswer?.provider) ??
    providers[0] ??
    null,
)
/** The model in use: the pane's own for its own provider, else what answered here, else the provider's default. */
const model = $derived.by(() => {
  if (provider === null) return ''
  const own = provider.id === choice.provider ? choice.model : null
  if (own != null && own !== '') return own
  const before = provider.name === lastAnswer?.provider ? lastAnswer.model : undefined
  return before ?? provider.model
})

const CUT_WHY =
  "This model's context window is full, so the messages above this line are no longer sent to it. They stay here and in the export. The window is set per provider in settings › ai."

/** Where what the model is sent begins, when the conversation outgrew its window. */
const sentFrom = $derived(view.chat?.context?.from ?? null)
/** What the model is told in place of what is above that line, when a summary was written. */
const summary = $derived(view.chat?.context?.summary ?? null)
const run = $derived(view.run)
const busy = $derived(run !== null)
const title = $derived(view.chat?.title ?? '')

/*
 * While an answer is written the pane reads like a link in use: a caret that
 * steps with the shared pulse, and the seconds since it began. Both hang off the
 * wall-clock ticks everything else uses, and off the run's start - a number - not
 * the run itself, which is a new object ten times a second.
 */
const startedAt = $derived(run?.startedAt ?? null)
let elapsed = $state(0)

$effect(() => {
  if (startedAt === null) return
  const began = startedAt
  const count = (): void => {
    const next = Math.max(0, Math.floor((Date.now() - began) / 1000))
    if (next !== elapsed) elapsed = next
  }
  count()
  return onBoundary(1000, count)
})

$effect(() => {
  if (busy) return pulse.use()
})

/** An answer that ends while this pane watches is heard: landed, or lost. */
let wasBusy = false
$effect(() => {
  const now = busy
  if (wasBusy && !now) sfx.play(FAILED_STOPS.has(messages.at(-1)?.stop) ? 'glitch' : 'granted')
  wasBusy = now
})

/** The pane's heading names the conversation; the model is already in the bar below it. */
$effect(() => {
  paneMeta.set(paneId, {
    ...(title === '' ? {} : { subtitle: title }),
    // In words, like the other panes' badges: RX means something inside the pane, not beside its title.
    ...(busy
      ? {
          badge: run?.phase === 'compacting' ? 'compacting' : 'receiving',
          badgeKind: 'ok' as const,
        }
      : {}),
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

/** The files for the next question: waiting in main under the draft id kept in pane state. */
const files = new ChatDraft(() => {
  const id = crypto.randomUUID()
  save({ filesDraft: id })
  return id
})
$effect(() => {
  void files.use(choice.filesDraft)
})

/** What goes with a question besides its text: the draft's files, and those an edit keeps. */
interface Carried {
  draft?: string
  files?: string[]
  keep?: string[]
}

async function ask(
  text: string | undefined,
  replaceFrom?: string,
  carried: Carried = {},
): Promise<boolean> {
  if (provider === null || model === '' || busy) return false
  problem = null
  const request = {
    provider: provider.id,
    model,
    ...(text === undefined ? {} : { text }),
    ...(replaceFrom === undefined ? {} : { replaceFrom }),
    ...carried,
  }
  const fresh = choice.chat === null
  const chatId = choice.chat ?? (await window.elecdex.ai.create())
  if (chatId === null) {
    problem = 'no more conversations can be kept - delete some from the log'
    return false
  }
  pinned = true
  const result = await window.elecdex.ai.send(chatId, request)
  if (result.ok) {
    if (fresh) save({ chat: chatId })
    sfx.play('stdout')
    return true
  }
  problem = result.error
  // Refused, perhaps for a file main let go: the chips show again what it really holds.
  if (carried.draft !== undefined) void files.refresh()
  // A conversation made for a message that was never taken is not one.
  if (fresh) void window.elecdex.ai.remove(chatId)
  return false
}

async function send(): Promise<void> {
  const text = draft.trim()
  if (!sendable) return
  const replaced = editing
  const carried: Carried = {
    // The draft's files are named, so a file main no longer holds stops the question instead of
    // leaving it without a word.
    ...(files.files.length > 0 && files.id !== null
      ? { draft: files.id, files: files.files.map((file) => file.id) }
      : {}),
    // An edited question keeps only what is listed; none listed, it keeps none.
    ...(replaced === null || files.kept.length === 0
      ? {}
      : { keep: files.kept.map((file) => file.id) }),
  }
  if (await ask(text, replaced ?? undefined, carried)) {
    draft = ''
    editing = null
    files.sent()
    // The chips go; their files, now the question's, keep their ids - the card goes by hand.
    resting.leave()
    hover = null
  }
}

function edit(message: ChatMessage): void {
  editing = message.id
  draft = message.text
  // The composer carries the question as it was: its text, and its files to keep or leave out.
  files.edit(message.attachments ?? [])
  composer?.focus()
}

/**
 * Leaves the composer empty. The files waiting for the next question stay - through a change of
 * conversation and an edit left as it was: picking them again would be the cost. Only an edited
 * question's own files go back to it.
 */
function leaveEdit(): void {
  files.unedit()
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
/** When the log was opened: its "2h" are said from then, and do not tick. */
let openedAt = $state(Date.now())

function toggleHistory(): void {
  historyOpen = !historyOpen
  if (historyOpen) openedAt = Date.now()
}

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
let modelsLoading = $state(false)
/** Counts the requests, so an answer can tell whether it is still the one being waited for. */
let modelsAsked = 0

async function loadModels(): Promise<void> {
  if (provider === null || modelsOf === provider.id) return
  const id = provider.id
  modelsAsked += 1
  const asked = modelsAsked
  modelsOf = id
  modelsLoading = true
  const result = await window.elecdex.ai.models(id)
  // An answer for a provider since left: the request that replaced it owns the state now.
  if (asked !== modelsAsked) return
  modelsLoading = false
  models = result.models
  modelsProblem = result.error
  // Asked again next time, in case the server was only not running yet.
  if (result.error !== null) modelsOf = null
}

function chooseProvider(id: string): void {
  // Whatever was being asked of the provider left behind is nobody's answer now.
  modelsAsked += 1
  modelsLoading = false
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

/** What the link is doing while an answer comes: sent and waiting, or receiving. */
const phase = $derived.by(() => {
  if (run === null) return ''
  if (run.phase === 'compacting') return 'tx · compacting'
  if (run.text !== '') return 'rx'
  return run.thinking === '' ? 'tx' : 'rx · reasoning'
})

/** Why nothing can be sent, when that is so: a button that is merely dark says nothing. */
const blocked = $derived(
  model === '' && (messages.length > 0 || draft.trim() !== '' || files.count > 0)
    ? 'no model is chosen - pick one in the bar above'
    : null,
)

/** The PDFs the chosen provider is not sent, by id: marked on their chips, and said. */
const unsentPdfs = $derived(
  new Set(
    provider === null || takesPdf(provider)
      ? []
      : [...files.all, ...messages.flatMap((m) => m.attachments ?? [])]
          .filter((file) => file.kind === 'pdf')
          .map((file) => file.id),
  ),
)
const pdfWhy = $derived(
  provider === null
    ? ''
    : `${provider.name} is not sent PDF files - Anthropic's API, OpenAI and OpenRouter are`,
)
/** A question carrying a PDF this provider is not sent does not go: said before it is tried. */
const pdfBlocked = $derived(files.all.some((file) => unsentPdfs.has(file.id)))

/**
 * More than a question takes: possible only while an edit carries its own files beside the ones
 * waiting. Said before sending, not left to main to refuse.
 */
const overfull = $derived.by(() => {
  const all = files.all
  if (all.length > ATTACH_LIMITS.perMessage) {
    return `a question takes up to ${ATTACH_LIMITS.perMessage} files - leave ${all.length - ATTACH_LIMITS.perMessage} out`
  }
  const bytes = all.reduce((sum, file) => sum + file.bytes, 0)
  return bytes > ATTACH_LIMITS.message
    ? `a question takes up to ${fileSize(ATTACH_LIMITS.message)} of files - leave some out`
    : null
})

/** A question can go: something to ask, a model to ask it of, and every file read. */
const sendable = $derived(
  (draft.trim() !== '' || files.all.length > 0) &&
    model !== '' &&
    files.reading.length === 0 &&
    !pdfBlocked &&
    overfull === null,
)

/*
 * The small pictures of the images this conversation was sent with: asked of main when the
 * conversation, or which images it has, changes - not with every delta of an answer.
 */
let sentThumbs = $state.raw<Record<string, string>>({})
const imageIds = $derived(
  messages
    .flatMap((m) => m.attachments ?? [])
    .filter((file) => file.kind === 'image')
    .map((file) => file.id)
    .join(' '),
)
$effect(() => {
  const chatId = choice.chat
  if (chatId === null || imageIds === '') {
    sentThumbs = {}
    return
  }
  let live = true
  void window.elecdex.ai.thumbs(chatId).then((found) => {
    if (live) sentThumbs = found
  })
  return () => {
    live = false
  }
})

/*
 * A file's detail card: which one, and where its chip is in the pane. The card waits for a
 * moment's rest; the keyboard, or a click, brings it at once.
 */
let root = $state<HTMLDivElement | null>(null)
let hover = $state.raw<{ file: ChatAttachment; anchor: CardAnchor; bounds: CardSize } | null>(null)
const resting = new HoverRest<string>(() => (hover = null))
$effect(() => () => resting.dispose())

function onFileHover(file: ChatAttachment, event: { row: DOMRect; x: number | null } | null): void {
  if (event === null) {
    resting.leave(file.id)
    return
  }
  resting.enter(
    file.id,
    () => {
      if (root === null) return
      const box = root.getBoundingClientRect()
      hover = {
        file,
        anchor: anchorOf(box, event.row, event.x),
        bounds: { width: box.width, height: box.height },
      }
    },
    event.x === null,
  )
}

/*
 * A chip that goes while its card is up - sent, left out, another conversation opened - sends no
 * pointerleave: the card goes with it.
 */
const shownFiles = $derived(
  new Set([...files.all, ...messages.flatMap((m) => m.attachments ?? [])].map((file) => file.id)),
)
$effect(() => {
  if (hover !== null && !shownFiles.has(hover.file.id)) {
    resting.leave()
    hover = null
  }
})

const hoverThumb = $derived.by(() => {
  if (hover === null) return undefined
  const id = hover.file.id
  return files.files.find((file) => file.id === id)?.thumb ?? sentThumbs[id]
})

/*
 * Files come three ways, all of them the user's own act: the picker behind +, a drop on the
 * pane, a picture pasted into the line. Each is read here as bytes; no path leaves the page.
 */
let picker = $state<HTMLInputElement | null>(null)

function picked(event: Event): void {
  const input = event.currentTarget as HTMLInputElement
  const chosen = [...(input.files ?? [])]
  // Emptied, so choosing the same file again is a change.
  input.value = ''
  if (chosen.length > 0) void files.add(chosen)
  composer?.focus()
}

/** How many more files the question takes. */
const room = $derived(Math.max(0, ATTACH_LIMITS.perMessage - files.count))

/** Counts the drag's entries and leaves over the pane's children, so the sign stays up across them. */
let dragDepth = 0
let dropping = $state(false)
const carriesFiles = (event: DragEvent): boolean =>
  event.dataTransfer?.types.includes('Files') === true

function dragEnter(event: DragEvent): void {
  if (!carriesFiles(event) || provider === null) return
  event.preventDefault()
  dragDepth += 1
  dropping = true
}

function dragOver(event: DragEvent): void {
  if (!carriesFiles(event) || provider === null) return
  event.preventDefault()
  if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'copy'
}

function dragLeave(event: DragEvent): void {
  if (!carriesFiles(event)) return
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dropping = false
}

function dropped(event: DragEvent): void {
  if (!carriesFiles(event)) return
  event.preventDefault()
  dragDepth = 0
  dropping = false
  // While an answer is written too: files wait for the next question, as a typed line does.
  if (provider === null) return
  const chosen = [...(event.dataTransfer?.files ?? [])]
  if (chosen.length > 0) void files.add(chosen)
  composer?.focus()
}

/** A picture pasted into the line is attached; text pasted is text, even with a picture beside it. */
function pasted(event: ClipboardEvent): void {
  const data = event.clipboardData
  if (data === null || data.files.length === 0 || data.getData('text/plain') !== '') return
  event.preventDefault()
  void files.add([...data.files], true)
}

/** The sweep of a link sending: one of four marks lit, stepping with the shared pulse. */
const SWEEP = ['▰▱▱▱', '▱▰▱▱', '▱▱▰▱', '▱▱▱▰'] as const

const copied = new CopyFlag()
$effect(() => () => copied.dispose())

/** "42 > 180 tok - 38 t/s": what the provider counted, and how fast it wrote. */
function telemetry(message: ChatMessage): string | null {
  if (message.usage === undefined) return null
  const counted = usageText(message.usage)
  const speed = tokensPerSecond(message)
  return speed === null ? counted : `${counted} · ${speed} t/s`
}

/** Where the provider is, for the standby line: the host, never the path or a key. */
const host = $derived.by(() => {
  const url = provider === null ? null : aiBaseUrl(provider.baseUrl)
  return url === null ? null : new URL(url).host
})
</script>

<div
  class="chat"
  data-testid="aichat"
  data-busy={busy}
  data-pulse={busy ? pulse.phase : undefined}
  bind:this={root}
  role="presentation"
  ondragenter={dragEnter}
  ondragover={dragOver}
  ondragleave={dragLeave}
  ondrop={dropped}
>
  <SettingsButton
    open={false}
    label="ai settings"
    testid="aichat-settings"
    ontoggle={() => ui.openSettings('ai')}
  />

  {#if provider === null}
    <div class="standby fx-rise" data-testid="aichat-setup">
      <span class="state"><span class="lamp"></span>no link</span>
      <span class="hint">a local server, or a service you have a key for</span>
      <button type="button" class="command" onclick={() => ui.openSettings('ai')} data-testid="aichat-open-settings">
        <span aria-hidden="true">&gt;</span> set up provider
      </button>
    </div>
  {:else}
    <div class="bar">
      <!-- The conversation's own controls first, where a "new" is looked for; then what it talks to. -->
      <button
        type="button"
        class="cmd lit"
        onclick={newChat}
        disabled={busy || choice.chat === null}
        title={choice.chat === null ? 'this is a new conversation' : 'start a new conversation'}
        data-testid="aichat-new"
      >
        <span aria-hidden="true">+</span> new
      </button>
      <button
        type="button"
        class="cmd"
        aria-expanded={historyOpen}
        onclick={toggleHistory}
        title="the conversations kept on this computer"
        data-testid="aichat-history-toggle"
      >
        log
      </button>
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
      <span class="field">
        <ModelField
          value={model}
          {models}
          title={modelsProblem ?? 'the model to ask; the list is read from the provider when you open it'}
          wanting={blocked !== null}
          onopen={() => void loadModels()}
          onchoose={chooseModel}
          testid="aichat-model"
        />
        <!-- Over the field's end, so it shows whether or not a model is already typed there. -->
        {#if modelsLoading}
          <span class="tag" data-testid="aichat-models-state">querying</span>
        {:else if modelsProblem !== null}
          <span class="tag warn" title={modelsProblem} data-testid="aichat-models-state">no list</span>
        {/if}
      </span>
    </div>

    {#if historyOpen}
      <SessionLog
        entries={ai.chats.filter((chat) => chat.messages > 0)}
        current={choice.chat}
        {openedAt}
        empty="No conversations yet."
        deleteTitle="Delete this conversation"
        suffix={(chat) => String(chat.messages)}
        testids={{ list: 'aichat-history', item: 'aichat-history-item', delete: 'aichat-history-delete' }}
        onopen={openChat}
        onexport={(id) => void window.elecdex.ai.export(id)}
        ondelete={(id) => void removeChat(id)}
      />
    {/if}

    <div class="messages" bind:this={list} onscroll={scrolled} data-testid="aichat-messages">
      {#if messages.length === 0 && !busy}
        <div class="standby rising" data-testid="aichat-empty">
          <span class="state"><span class="lamp" class:ready={model !== ''}></span>{model === '' ? 'no model chosen' : 'link standby'}</span>
          <span class="target" title="nothing is sent until you ask · conversations stay on this computer">
            <span class="part"><span class="mark" aria-hidden="true">▌</span>{provider.name}</span>{#if model !== ''}<span class="part">&nbsp;· {model}</span>{/if}
          </span>
          <span class="host">{host ?? 'unusable address'}</span>
          <span class="state">{model === '' ? 'choose a model above' : 'awaiting input'}</span>
        </div>
      {/if}
      {#each messages as message, i (message.id)}
        {@const readout = telemetry(message)}
        {#if message.id === sentFrom && i > 0}
          <!-- Said in the log, where it happened: the model no longer reads what is above. -->
          {#if summary === null}
            <p class="cut" title={CUT_WHY} data-testid="aichat-cut">
              <span class="rule back"></span>not sent · {i} above<span class="rule"></span>
            </p>
          {:else}
            <!-- What the model is told on the user's behalf is theirs to read: a model wrote it, so as text. -->
            <details class="cut-summary" data-testid="aichat-summary">
              <summary class="cut" class:told={summary.before === sentFrom} title={CUT_WHY} data-testid="aichat-cut">
                <span class="rule back"></span>{summary.before === sentFrom ? 'summarised' : 'not sent'} · {i} above<span class="more" aria-hidden="true"></span><span class="rule"></span>
              </summary>
              <p>{summary.text}</p>
            </details>
          {/if}
        {/if}
        <article class="message {message.role} fx-rise" data-testid="aichat-message" data-role={message.role}>
          <header>
            <span class="who">{message.role === 'user' ? 'you' : (message.model ?? 'remote')}</span>
            <span class="meta">{time(message.at)}</span>
            <span class="rule"></span>
            <button type="button" class="act" onclick={() => void copied.copy(message.id, message.text)}>
              {copied.key === message.id ? 'copied' : 'copy'}
            </button>
            {#if message.role === 'user'}
              <button type="button" class="act" disabled={busy} onclick={() => edit(message)} data-testid="aichat-edit">edit</button>
            {:else if i === messages.length - 1}
              <button type="button" class="act" disabled={busy} onclick={() => void ask(undefined)} data-testid="aichat-regenerate">
                again
              </button>
            {/if}
            {#if readout !== null}
              <span class="meta" title="tokens read › tokens written · tokens a second" data-testid="aichat-usage">{readout}</span>
            {/if}
          </header>
          {#if message.thinking}
            <details class="thinking">
              <summary>reasoning</summary>
              <p>{message.thinking}</p>
            </details>
          {/if}
          {#if message.role === 'user'}
            {#if message.attachments !== undefined && message.attachments.length > 0}
              <Payload
                files={message.attachments}
                thumbs={sentThumbs}
                unsent={unsentPdfs}
                onhover={onFileHover}
                testid="aichat-message-files"
              />
            {/if}
            {#if message.text !== ''}
              <p class="said">{message.text}</p>
            {/if}
          {:else if message.text !== ''}
            <Markdown source={message.text} />
          {/if}
          {#if message.stop}
            <CodeLine
              code={STOP_CODES[message.stop]}
              detail={message.error}
              warn={FAILED_STOPS.has(message.stop)}
              testid="aichat-stop"
            />
          {/if}
        </article>
      {/each}
      {#if run !== null}
        <article class="message assistant running fx-rise" data-testid="aichat-run">
          <header>
            <span class="who">{run.model}</span>
            <span class="rule"></span>
            <span class="meta live" data-testid="aichat-telemetry">
              {#if run.text === '' && run.thinking === ''}
                <span class="sweep" aria-hidden="true">{SWEEP[pulse.phase] ?? SWEEP[0]}</span>
              {:else}
                <span class="lamp rx" aria-hidden="true"></span>
              {/if}{phase} · T+{elapsed}s · {compactCount(run.text.length + run.thinking.length)} ch
            </span>
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
            <p class="note">
              {run.phase === 'compacting' ? 'summarising what no longer fits' : `waiting for ${run.provider}`}<span class="caret">▍</span>
            </p>
          {/if}
        </article>
      {/if}
    </div>

    {#if problem !== null}
      <CodeLine code="refused" detail={problem} warn testid="aichat-problem" />
    {:else if files.problem !== null}
      <CodeLine code={files.problem.code} detail={files.problem.detail} warn testid="aichat-attach-problem" />
    {:else if overfull !== null}
      <CodeLine code="payload full" detail={overfull} warn testid="aichat-blocked" />
    {:else if pdfBlocked}
      <CodeLine code="no document" detail={`${pdfWhy} - leave the PDF out, or choose another provider`} warn testid="aichat-blocked" />
    {:else if blocked !== null}
      <CodeLine code="no model" detail={blocked} warn testid="aichat-blocked" />
    {/if}

    {#if files.count > 0}
      <Payload
        files={[...files.kept, ...files.files]}
        reading={files.reading}
        thumbs={sentThumbs}
        editable
        unsent={unsentPdfs}
        onremove={(id) => void files.remove(id)}
        onhover={onFileHover}
        testid="aichat-payload"
      />
    {/if}

    <form
      class="composer"
      class:editing={editing !== null}
      class:loaded={files.count > 0}
      onsubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <button
        type="button"
        class="attach"
        onclick={() => picker?.click()}
        aria-label="attach files"
        title="attach text, images or PDF files - or drop them on the pane, or paste a picture"
        data-testid="aichat-attach"
      >+</button>
      <input bind:this={picker} type="file" multiple hidden onchange={picked} data-testid="aichat-attach-input" />
      <span class="prompt" aria-hidden="true">{editing === null ? '>' : '±'}</span>
      <textarea
        bind:this={composer}
        bind:value={draft}
        rows="1"
        placeholder={editing === null ? 'message · enter to send, shift+enter for a new line' : 'rewriting an earlier message · esc to leave it as it was'}
        onkeydown={onComposerKey}
        onpaste={pasted}
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
        <button type="submit" class="cmd lit" disabled={!sendable} data-testid="aichat-send">
          {editing === null ? 'send' : 'resend'}
        </button>
      {/if}
    </form>

    {#if dropping}
      <!-- Over the pane while files are held over it: where they go, and what is taken. -->
      <div class="drop-sign crt-on" transition:crtPower data-testid="aichat-drop">
        <span class="drop-title">drop to attach</span>
        <span class="drop-kinds"
          >{room > 0 ? `text · images · pdf · room for ${room}` : `payload full · ${ATTACH_LIMITS.perMessage} files`}</span
        >
      </div>
    {/if}

    {#if hover !== null}
      <FileCard
        file={hover.file}
        thumb={hoverThumb}
        unsent={unsentPdfs.has(hover.file.id) ? pdfWhy : null}
        anchor={hover.anchor}
        bounds={hover.bounds}
      />
    {/if}
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

.bar {
  display: flex;
  /* Too narrow for all of it, the link drops under the conversation's buttons. */
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--space-1);
  /* Clears the settings button in the corner. */
  padding-right: 1.6rem;
  min-height: 1.4rem;
}

select {
  flex: 0 1 9rem;
  min-width: 0;
  padding: 0 var(--space-1);
  border: 1px solid var(--panel-border);
  background: var(--app-bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.field {
  position: relative;
  display: flex;
  flex: 1 1 8rem;
  min-width: 0;
}

/* What the model list is doing, over the end of the field it fills. */
.tag {
  position: absolute;
  top: 1px;
  right: 1px;
  bottom: 1px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-1);
  background: var(--app-bg);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent);
  pointer-events: none;
}

.tag.warn {
  color: var(--warn);
  pointer-events: auto;
}

select:focus {
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

/*
 * The buttons that begin something - a new conversation, a message on its way: lit while they
 * can be pressed, where the rest wait to be pointed at. "send" goes from dark to lit the moment
 * there is something to send, and that has to be seen in every theme: the muted text of an idle
 * button is, on Tron, hardly brighter than a disabled one.
 */
.cmd.lit:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent-strong);
}

.composer .cmd.lit:not(:disabled) {
  background: var(--accent-faint);
}

.cmd.lit:not(:disabled):hover,
.cmd.lit:not(:disabled):focus-visible {
  background: var(--accent);
  color: var(--app-bg);
  outline: none;
}

/* The link coming up, a line at a time. Once, like every entrance here (styles/motion.css). */
.rising > * {
  animation: fx-rise calc(360ms * var(--motion-scale)) var(--ease-emphasized) backwards;
}

.rising > :nth-child(2) {
  animation-delay: calc(70ms * var(--motion-scale));
}

.rising > :nth-child(3) {
  animation-delay: calc(140ms * var(--motion-scale));
}

.rising > :nth-child(4) {
  animation-delay: calc(210ms * var(--motion-scale));
}

/* Sending, before anything comes back: it rides the pulse the caret already keeps. */
.sweep {
  margin-right: var(--space-1);
  letter-spacing: 0.05em;
}

.messages {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
  padding: var(--space-1) var(--space-1) var(--space-1) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-dim) transparent;
  /* Text here is for reading and copying, unlike the HUD around it. */
  user-select: text;
}

/*
 * No conversation yet: the link's state, the way the rest of the HUD states
 * things - a lamp, a label, what it is pointed at.
 */
.standby {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  margin: auto;
  max-width: 90%;
  text-align: center;
  user-select: none;
}

.state {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-muted);
}

.lamp {
  width: 0.5rem;
  height: 0.5rem;
  border: 1px solid var(--warn);
}

.lamp.ready,
.lamp.rx {
  border-color: var(--ok);
  background: var(--ok);
}

/* The receive lamp beats with the caret, on the same shared pulse. */
.lamp.rx {
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  margin-right: var(--space-1);
}

.target {
  font-family: var(--font-display);
  font-size: var(--step-1);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--accent-strong);
  overflow-wrap: anywhere;
}

/* Too narrow for both, the line breaks between the provider and the model before it breaks inside a name. */
.part {
  display: inline-block;
  max-width: 100%;
}

.mark {
  margin-right: var(--space-1);
  color: var(--accent);
}

/*
 * A line of its own under the target: beside it, a narrow pane broke the address
 * in the middle. Read, not announced - as typed, in the readouts' face.
 */
.host {
  max-width: 100%;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

/* "> set up provider": a command, where a pane with no provider has nothing else to offer. */
.command {
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent-strong);
  font-family: var(--font-mono);
  font-size: var(--step--1);
  cursor: pointer;
}

.command:hover,
.command:focus-visible {
  background: var(--accent-faint);
  outline: none;
}

.hint {
  font-size: var(--step--1);
  color: var(--text-muted);
  line-height: 1.5;
}

/*
 * A message is an entry in a log: who, a rule out to the readouts, then the
 * text hung from a line down its left - the accent for what you said, the
 * panel's rule for what came back, lit while it is still arriving.
 */
.message {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  padding-left: var(--space-2);
  border-left: 1px solid var(--panel-rule);
}

.message.user {
  padding: var(--space-1) var(--space-2);
  border-left: 2px solid var(--accent);
  background: var(--accent-faint);
  /* The cut corner the panels have. */
  clip-path: polygon(0 0, calc(100% - 0.5rem) 0, 100% 0.5rem, 100% 100%, 0 100%);
}

.message.running {
  border-left-color: var(--accent);
}

.message header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  user-select: none;
}

.who {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--font-display);
  color: var(--accent-strong);
}

.rule {
  flex: 1;
  min-width: var(--space-2);
  height: 1px;
  background: linear-gradient(to right, var(--accent-dim), transparent);
}

.rule.back {
  background: linear-gradient(to left, var(--accent-dim), transparent);
}

/* Where the model's view of the conversation begins. */
.cut {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--step--2);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--warn);
  user-select: none;
  cursor: help;
}

/* A summary stands in for what is above: said, not warned. It opens. */
summary.cut {
  list-style: none;
  cursor: pointer;
}

summary.cut::-webkit-details-marker {
  display: none;
}

.cut.told {
  color: var(--accent);
}

/* That it opens, and that it is open. */
.more::after {
  content: '▸';
}

.cut-summary[open] .more::after {
  content: '▾';
}

.cut-summary > p {
  margin: var(--space-1) 0 0;
  padding: var(--space-1) var(--space-2);
  border-left: 1px dashed var(--accent-dim);
  font-size: var(--step--1);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--text-muted);
}

.meta {
  flex: none;
  font-family: var(--font-mono);
  letter-spacing: 0;
  color: var(--text-muted);
}

.meta.live {
  color: var(--accent);
}

.act {
  flex: none;
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

.thinking summary:hover {
  color: var(--accent);
}

.thinking p {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-2);
  border-left: 1px dashed var(--panel-rule);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.4;
}

/*
 * The caret at the end of what is being written. It steps with the shared pulse
 * (lib/pulse.svelte.ts) rather than blinking as an animation of its own, which
 * would be the compositor's for as long as a slow model takes. It hangs off the
 * last thing the answer holds: the last paragraph, the last item, the code.
 */
.caret,
.running :global(.markdown > :last-child:not(.code, .table-frame, ul, ol, hr)::after),
.running :global(.markdown > :is(ul, ol):last-child > li:last-child > :last-child::after),
.running :global(.markdown > .code:last-child pre > code::after) {
  content: '▍';
  margin-left: 0.1em;
  color: var(--accent);
}

.chat[data-pulse='1'] .lamp.rx,
.chat[data-pulse='3'] .lamp.rx,
.chat[data-pulse='1'] .caret,
.chat[data-pulse='3'] .caret,
.chat[data-pulse='1'] .running :global(.markdown ::after),
.chat[data-pulse='3'] .running :global(.markdown ::after) {
  opacity: 0.6;
}

.chat[data-pulse='2'] .lamp.rx,
.chat[data-pulse='2'] .caret,
.chat[data-pulse='2'] .running :global(.markdown ::after) {
  opacity: 0.15;
}

.note {
  margin: 0;
  color: var(--text-muted);
}

/* A command line: the prompt, what is typed, and the key that sends it. */
.composer {
  display: flex;
  align-items: stretch;
  margin-bottom: var(--space-1);
  border: 1px solid var(--panel-border);
}

/* The line that has the keyboard is lit down its left, like the message being written. */
.composer:focus-within {
  border-color: var(--accent);
  box-shadow: inset 2px 0 0 var(--accent);
}

.composer:not(:focus-within) .prompt {
  color: var(--text-muted);
}

.composer.editing {
  border-style: dashed;
}

.prompt {
  flex: none;
  padding: var(--space-1) 0 0 var(--space-2);
  font-family: var(--font-mono);
  line-height: 1.4;
  color: var(--accent);
  user-select: none;
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
  font-size: var(--step--1);
  line-height: 1.4;
  field-sizing: content;
  min-height: 1.4em;
  max-height: 12rem;
}

.composer .cmd {
  display: flex;
  align-items: center;
  border-width: 0 0 0 1px;
}

/* With files loaded, the payload above and the line are one frame. */
.composer.loaded {
  margin-top: calc(-1 * var(--space-1));
}

/* +: files for the question, before the prompt that takes its words. */
.attach {
  flex: none;
  padding: 0 var(--space-2);
  border: 0;
  border-right: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--step-0);
  line-height: 1;
  cursor: pointer;
}

.attach:hover,
.attach:focus-visible {
  color: var(--accent);
  background: var(--accent-faint);
  outline: none;
}

/* Files held over the pane: the whole of it is where they may go. */
.drop-sign {
  position: absolute;
  inset: var(--space-2);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  border: 1px dashed var(--accent);
  background: color-mix(in srgb, var(--app-bg) 96%, transparent);
  pointer-events: none;
}

.drop-title {
  font-family: var(--font-display);
  font-size: var(--step-1);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.drop-kinds {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--text-muted);
}
</style>
