import { z } from 'zod'

/**
 * The AI chat pane: the providers a user lists, the conversations main keeps, and
 * what travels between main and a pane while an answer is written.
 *
 * Three decisions carry the design (docs/architecture.md section 5.7).
 *
 *  - A provider is an address and a dialect. Nearly every local server (Ollama,
 *    LM Studio, llama.cpp, vLLM) and most hosted ones speak OpenAI's chat
 *    completions, so that is one dialect; Anthropic's Messages API is the other.
 *    A new service is a preset below, not code.
 *  - A key never reaches the page. The page hands one to main once, and from then
 *    on only learns whether one is held; settings.json holds none, so it can still
 *    travel between machines.
 *  - A conversation is main's, like a note: it outlives the pane showing it, and
 *    an answer goes on being written while its pane is moved or the page reloads.
 */

export const AI_LIMITS = {
  providers: 12,
  /** Conversations kept; a new one is refused past this rather than an old one dropped. */
  chats: 200,
  /** Messages in one conversation. */
  messages: 400,
  /** Characters in one message, the user's or the model's. */
  text: 400_000,
  title: 80,
  systemPrompt: 8000,
  key: 512,
  /** Model ids listed for a provider (OpenRouter lists several hundred). */
  models: 1000,
  /** The largest context window a provider can be given, in tokens. */
  contextTokens: 4_000_000,
  /** Characters of the summary that stands in for the part of a conversation no longer sent. */
  summary: 4000,
} as const

export const AI_PROVIDER_KINDS = ['openai', 'anthropic'] as const
export type AiProviderKind = (typeof AI_PROVIDER_KINDS)[number]

export const AI_PROVIDER_ID = /^[a-z0-9][a-z0-9-]{0,39}$/

/**
 * One provider in settings.json. The address is kept as typed and judged when it
 * is used (`aiBaseUrl`), so a hand edit with a bad address costs that provider
 * and not the whole settings file.
 */
export const AiProviderSchema = z.object({
  id: z.string().regex(AI_PROVIDER_ID),
  name: z.string().min(1).max(40),
  kind: z.enum(AI_PROVIDER_KINDS),
  baseUrl: z.string().max(2048),
  /** The model a new chat pane starts with; empty until the user picks one. */
  model: z.string().max(120).default(''),
  /**
   * The context window of what answers at this address, in tokens; 0 sends every
   * conversation whole. Absent until the user says: `contextWindow` then goes by
   * the address. Judged when used, like the address, so a hand edit costs nothing.
   */
  contextTokens: z
    .number()
    .int()
    .nonnegative()
    .max(AI_LIMITS.contextTokens)
    .optional()
    .catch(undefined),
})
export type AiProvider = z.infer<typeof AiProviderSchema>

export interface AiPreset {
  id: string
  name: string
  kind: AiProviderKind
  baseUrl: string
  model: string
}

/** What "add a provider" offers. Every field can be edited afterwards. */
export const AI_PRESETS: readonly AiPreset[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    kind: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    model: '',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    kind: 'openai',
    baseUrl: 'http://localhost:1234/v1',
    model: '',
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp',
    kind: 'openai',
    baseUrl: 'http://localhost:8080/v1',
    model: '',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-opus-5',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: '',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    kind: 'openai',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: '',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: '',
  },
  {
    id: 'custom',
    name: 'Custom',
    kind: 'openai',
    baseUrl: 'http://localhost:8000/v1',
    model: '',
  },
]

/** An id no listed provider has yet: the preset's, then preset-2, preset-3... */
export function freshProviderId(preset: string, taken: readonly string[]): string {
  if (!taken.includes(preset)) return preset
  for (let n = 2; ; n += 1) {
    const id = `${preset}-${n}`
    if (!taken.includes(id)) return id
  }
}

/**
 * A provider's address in the one form main will use: http(s), no credentials,
 * no query or fragment, no trailing slash. Anything else is null and is never
 * fetched.
 */
export function aiBaseUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== '') {
    return null
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

const PRIVATE_V4 = /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/

/** This machine, or an address that only exists on the local network. */
function isNearby(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1') return true
  if (host.endsWith('.local')) return true
  return PRIVATE_V4.test(host)
}

/**
 * Whether a key may be sent to this address: over https, or in the clear only to
 * this machine or the local network. A key typed for a hosted service must not
 * cross the internet readable because the address was given as http.
 */
export function keyMayTravel(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl)
    return url.protocol === 'https:' || isNearby(url.hostname)
  } catch {
    return false
  }
}

/** On this computer or network, reached in the clear: the kind of server that asks for no key. */
export function isLocalAddress(raw: string): boolean {
  const url = aiBaseUrl(raw)
  return url?.startsWith('http:') === true && keyMayTravel(url)
}

/**
 * How a long conversation is fitted to a model (architecture.md §5.7).
 *
 * A local server answers with whatever window it was started with - a few
 * thousand tokens - and, handed more, silently drops the beginning, system prompt
 * first. A hosted model's window is its own business and large.
 */
export const AI_CONTEXT = {
  /** The window assumed of a local server nobody has described. */
  localWindow: 8192,
  /** The smallest window worth the name: a smaller figure is read as this. */
  minWindow: 1024,
  /** What may be sent, of the window: the rest is the answer's, and its reasoning's. */
  high: 0.75,
  /** What a cut leaves, so the next one is many turns away (see `chatWindow`). */
  low: 0.5,
  /** The most a summary may take of the window, in tokens - and never more than a tenth of it. */
  summaryTokens: 600,
} as const

/**
 * The room a summary is given in this window. It is held to it (`clipToTokens`), so that writing
 * one never moves the cut it was written for: the room is well under what lies between `high`
 * and `low`. A flat 600 was most of a small window - at 1024 it left so little for the messages
 * that every question cut the conversation again, and asked for another summary.
 */
export function summaryRoom(window: number): number {
  return Math.min(AI_CONTEXT.summaryTokens, Math.floor(window / 10))
}

/** The provider's window in tokens, or 0 when its conversations are sent whole. */
export function contextWindow(provider: Pick<AiProvider, 'baseUrl' | 'contextTokens'>): number {
  const set = provider.contextTokens
  if (set === undefined) return isLocalAddress(provider.baseUrl) ? AI_CONTEXT.localWindow : 0
  return set === 0 ? 0 : Math.max(AI_CONTEXT.minWindow, set)
}

/**
 * Roughly how many tokens a text is, without a tokenizer (each model has its own,
 * and none is worth shipping): four ASCII characters to a token, and a token for
 * every other character - Japanese and Chinese run at about that, which a flat
 * "four characters" would miss by four times. Main corrects it upwards with what
 * providers report (`AiChatService`), never downwards.
 */
export function estimateTokens(text: string): number {
  let ascii = 0
  for (let i = 0; i < text.length; i += 1) if (text.charCodeAt(i) < 0x80) ascii += 1
  return Math.ceil(ascii / 4 + (text.length - ascii))
}

/** The beginning of a text that fits in `max` estimated tokens. */
export function clipToTokens(text: string, max: number): string {
  let cost = 0
  for (let i = 0; i < text.length; i += 1) {
    cost += text.charCodeAt(i) < 0x80 ? 0.25 : 1
    if (cost <= max) continue
    // Not between the halves of a character outside the basic plane.
    const high = i > 0 && (text.charCodeAt(i - 1) & 0xfc00) === 0xd800
    return text.slice(0, high ? i - 1 : i)
  }
  return text
}

/** What a message costs beyond its text: its role and the template's marks around it. */
const MESSAGE_OVERHEAD = 4

/**
 * Where the history sent to a model begins: an index into `messages`, 0 for all
 * of it. The conversation itself is never touched - this only chooses what goes.
 *
 * It cuts rarely and by a lot, not a message a turn: every cut changes the
 * beginning of the prompt, which throws away a local server's KV cache (the whole
 * prompt is read again, slowly) and a hosted one's prompt cache. So the place cut
 * at is kept (`from`) and used until what follows it outgrows `high`; then the
 * cut moves far enough to leave `low`. A conversation that fits is sent whole,
 * whatever was kept - the pane may have moved to a model with more room.
 *
 * A cut lands on a user message, so what is sent still opens with a question.
 * The last question always goes, fitting or not: the provider says so if not.
 */
export function chatWindow(
  messages: readonly Pick<ChatMessage, 'id' | 'role' | 'text'>[],
  options: {
    /** The window in tokens; 0 for no limit. */
    window: number
    /** Estimated tokens of what is sent ahead of the messages. */
    system: number
    /** Estimated to real tokens, as last measured for this model; 1 when unknown. */
    ratio: number
    /** The id of the message the last cut was made at. */
    from?: string | undefined
  },
): { from: number; estimate: number } {
  // after[i]: the estimate of messages i.. on their own.
  const after = new Array<number>(messages.length + 1).fill(0)
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    after[i] = (after[i + 1] ?? 0) + estimateTokens(messages[i]?.text ?? '') + MESSAGE_OVERHEAD
  }
  const at = (from: number) => ({ from, estimate: options.system + (after[from] ?? 0) })
  const fits = (from: number, share: number): boolean =>
    at(from).estimate * options.ratio <= options.window * share

  if (options.window <= 0 || fits(0, AI_CONTEXT.high)) return at(0)
  const kept = options.from === undefined ? -1 : messages.findIndex((m) => m.id === options.from)
  if (kept > 0 && messages[kept]?.role === 'user' && fits(kept, AI_CONTEXT.high)) return at(kept)

  let last = 0
  for (let i = 0; i < messages.length; i += 1) {
    if (messages[i]?.role !== 'user') continue
    if (fits(i, AI_CONTEXT.low)) return at(i)
    last = i
  }
  return at(last)
}

/**
 * What the model is asked when the part of a conversation that stays behind is
 * summarised (settings: `ai.compact`). The answer is drawn in the log for the
 * user to read, and sent after the system prompt from then on.
 */
export const COMPACT_PROMPT = [
  'You are compacting a conversation so that it can go on in a small context window.',
  'Summarise the conversation below so that an assistant who has read only your summary can continue it as if it had read everything.',
  'Keep: what the user wants, constraints, decisions made, names, numbers, identifiers from code, and questions still open.',
  'Drop: pleasantries, repetition, and attempts that were corrected later.',
  'Write in the language the conversation is in. Plain text. Output the summary and nothing else.',
].join(' ')

/** The prompt with the length the window has room for: about a word to two tokens, as a guide - the text is clipped to the room anyway. */
export function compactPrompt(room: number): string {
  return `${COMPACT_PROMPT} At most ${Math.max(30, Math.round(room / 2))} words.`
}

const SUMMARY_HEAD =
  'Summary of the earlier part of this conversation, which you no longer see in full:'

/** The system prompt with the summary after it: it changes only when a cut does, like the rest of the beginning. */
export function withSummary(system: string, summary: string): string {
  const said = `${SUMMARY_HEAD}\n${summary}`
  return system === '' ? said : `${system}\n\n${said}`
}

/**
 * What is handed over to be summarised: the summary so far, then the messages
 * that stay behind - the latest of them first to be kept when not all fit in
 * `budget` estimated tokens, since the summary so far speaks for the oldest.
 */
export function compactTranscript(
  summary: string | undefined,
  messages: readonly Pick<ChatMessage, 'role' | 'text'>[],
  budget: number,
): string {
  const head = summary === undefined ? '' : `Summary so far:\n${summary}\n\n`
  let room = budget - estimateTokens(head)
  const said: string[] = []
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message === undefined) continue
    const line = `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.text}`
    const cost = estimateTokens(line) + 1
    // The one that does not fit gives its beginning to the room that is left, and ends the list.
    if (cost > room) {
      if (room >= 1) said.unshift(`${line.slice(0, Math.floor(room))}…`)
      break
    }
    room -= cost
    said.unshift(line)
  }
  return `${head}Conversation:\n${said.join('\n\n')}`
}

/** A model a provider lists. `label` is set when the service gives a friendlier name. */
export interface AiModel {
  id: string
  label?: string
}

export interface AiModelsResult {
  models: AiModel[]
  error: string | null
}

/** Where a provider's key is held: encrypted on disk, only until elecdex quits, or not at all. */
export type AiKeyStorage = 'stored' | 'session' | null

/** What the page may know about a provider's key: never the key. */
export interface AiProviderStatus {
  id: string
  key: AiKeyStorage
}

export const CHAT_VERSION = 1
export const CHAT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Why an answer ended, when it did not simply finish. */
/** `unreachable` is an error too, told apart because the pane says it differently: nobody answered. */
export const CHAT_STOPS = ['stopped', 'length', 'refusal', 'error', 'unreachable'] as const
export type ChatStop = (typeof CHAT_STOPS)[number]

/**
 * How an answer that did not simply finish is marked: a short code, as a link reports its
 * state, with the provider's own words after it - the code is for the eye, the words are
 * what the fault is fixed with. The chat pane, the ELEC pane and its console all say these.
 */
export const STOP_CODES: Readonly<Record<ChatStop, string>> = {
  stopped: 'stopped',
  length: 'truncated',
  refusal: 'declined',
  error: 'link error',
  unreachable: 'no carrier',
}

/**
 * The ways an answer can end that are a failure: one set, for the colour of its mark and
 * for the sound it ends with. Stopping it yourself, or being cut at the length, is not one.
 */
export const FAILED_STOPS: ReadonlySet<ChatStop | undefined> = new Set<ChatStop | undefined>([
  'error',
  'unreachable',
  'refusal',
])

export const ChatMessageSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['user', 'assistant']),
  text: z.string().max(AI_LIMITS.text),
  /** The model's reasoning, where the provider shows it. Shown folded; never sent back. */
  thinking: z.string().max(AI_LIMITS.text).optional(),
  /** Epoch milliseconds. */
  at: z.number().int().nonnegative(),
  /** An answer names who wrote it: the provider's name and the model that answered. */
  provider: z.string().max(40).optional(),
  model: z.string().max(120).optional(),
  usage: z
    .object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() })
    .optional(),
  /** How long the answer took to write, in milliseconds: with `usage`, the pane's tokens a second. */
  ms: z.number().int().nonnegative().optional(),
  stop: z.enum(CHAT_STOPS).optional(),
  error: z.string().max(600).optional(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ChatSchema = z.object({
  version: z.literal(CHAT_VERSION).default(CHAT_VERSION),
  id: z.string().regex(CHAT_ID),
  title: z.string().max(AI_LIMITS.title).default(''),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  messages: z.array(ChatMessageSchema).max(AI_LIMITS.messages).default([]),
  /**
   * What the last question sent of the conversation, when not all of it: the
   * messages before `from` stayed behind (`chatWindow`). The pane draws a line
   * there. A value that does not read costs the line, not the conversation.
   */
  context: z
    .object({
      from: z.string().max(64),
      at: z.number().int().nonnegative(),
      /** What stands in for everything before the message `before`, written by a model. */
      summary: z
        .object({ text: z.string().min(1).max(AI_LIMITS.summary), before: z.string().max(64) })
        .optional(),
    })
    .optional()
    .catch(undefined),
})
export type Chat = z.infer<typeof ChatSchema>

export interface ChatSummary {
  id: string
  title: string
  updatedAt: number
  messages: number
}

export const summaryOf = (chat: Chat): ChatSummary => ({
  id: chat.id,
  title: chat.title,
  updatedAt: chat.updatedAt,
  messages: chat.messages.length,
})

/** A conversation is named after what was first asked: its first line, cut to fit. */
export function chatTitle(text: string): string {
  for (const line of text.split('\n', 20)) {
    const trimmed = line.replace(/^[\s#>*+-]+/, '').trim()
    if (trimmed !== '') return trimmed.slice(0, AI_LIMITS.title)
  }
  return 'untitled'
}

/** An answer being written. */
export interface ChatRun {
  id: string
  text: string
  thinking: string
  provider: string
  model: string
  startedAt: number
  /** Set while what stays behind is being summarised, before the question itself is asked. */
  phase?: 'compacting'
}

/**
 * main -> page. A snapshot is the whole truth (on subscribing, and at the start
 * and end of every answer); a delta appends to the run and says where, so a page
 * that missed one notices (`applyChatEvent`) instead of showing a text with a hole.
 */
export type ChatEvent =
  | { type: 'snapshot'; chatId: string; chat: Chat | null; run: ChatRun | null }
  | {
      type: 'delta'
      chatId: string
      runId: string
      textAt: number
      text: string
      thinkingAt: number
      thinking: string
    }

export interface ChatView {
  chat: Chat | null
  run: ChatRun | null
}

export const EMPTY_VIEW: ChatView = { chat: null, run: null }

/** The view after an event, or 'resync' when the event does not fit what the page holds. */
export function applyChatEvent(view: ChatView, event: ChatEvent): ChatView | 'resync' {
  if (event.type === 'snapshot') return { chat: event.chat, run: event.run }
  const run = view.run
  if (run === null || run.id !== event.runId) return 'resync'
  if (run.text.length !== event.textAt || run.thinking.length !== event.thinkingAt) return 'resync'
  return {
    chat: view.chat,
    run: { ...run, text: run.text + event.text, thinking: run.thinking + event.thinking },
  }
}

/** What a pane asks main to answer. */
export interface ChatRequest {
  provider: string
  model: string
  /** The user's message. Absent to answer the conversation as it stands again (regenerate). */
  text?: string
  /**
   * Rewrites history from this message on: it and everything after it go before
   * the new text is added (editing an earlier question).
   */
  replaceFrom?: string
}

export type ChatSendResult = { ok: true } | { ok: false; error: string }

export function chatRequest(raw: unknown): ChatRequest | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.provider !== 'string' || !AI_PROVIDER_ID.test(r.provider)) return null
  if (typeof r.model !== 'string' || r.model === '' || r.model.length > 120) return null
  if (r.text !== undefined && (typeof r.text !== 'string' || r.text.trim() === '')) return null
  if (r.replaceFrom !== undefined && typeof r.replaceFrom !== 'string') return null
  return {
    provider: r.provider,
    model: r.model,
    ...(typeof r.text === 'string' ? { text: r.text.slice(0, AI_LIMITS.text) } : {}),
    ...(typeof r.replaceFrom === 'string' ? { replaceFrom: r.replaceFrom } : {}),
  }
}

/** A pane's own choices; the conversation itself is main's. */
export interface AiChatPaneState {
  chat: string | null
  provider: string | null
  model: string | null
}

/** Pane state comes from layout.json, which may be edited by hand: nothing in it is trusted. */
export function paneAiChat(raw: Record<string, unknown> | undefined): AiChatPaneState {
  const text = (value: unknown, pattern: RegExp): string | null =>
    typeof value === 'string' && pattern.test(value) ? value : null
  return {
    chat: text(raw?.chat, CHAT_ID),
    provider: text(raw?.provider, AI_PROVIDER_ID),
    model: text(raw?.model, /^.{1,120}$/),
  }
}

/**
 * Splits a model's visible text from reasoning written inline as
 * `<think>...</think>`, which is how local reasoning models (DeepSeek-R1, Qwen)
 * answer through servers that do not separate it. Fed piece by piece as the
 * answer streams, so a tag cut in two by a chunk boundary is still one tag.
 */
export class ThinkSplitter {
  private inside = false
  /** The end of the last piece, held back because it may be the start of a tag. */
  private held = ''
  /** Only a tag that opens the answer counts: `<think>` quoted in prose is text. */
  private started = false

  push(piece: string): { text: string; thinking: string } {
    let rest = this.held + piece
    this.held = ''
    let text = ''
    let thinking = ''
    while (rest !== '') {
      const tag = this.inside ? '</think>' : '<think>'
      const at = this.tagAt(rest, tag)
      const upTo = at === -1 ? this.safeLength(rest, tag) : at
      const chunk = rest.slice(0, upTo)
      if (this.inside) thinking += chunk
      else text += chunk
      if (chunk.trim() !== '') this.started = true
      if (at === -1) {
        this.held = rest.slice(upTo)
        break
      }
      this.inside = !this.inside
      this.started = true
      rest = rest.slice(at + tag.length)
    }
    return { text, thinking }
  }

  /** What was held back when the stream ended: it was text after all. */
  flush(): { text: string; thinking: string } {
    const held = this.held
    this.held = ''
    return this.inside ? { text: '', thinking: held } : { text: held, thinking: '' }
  }

  private tagAt(rest: string, tag: string): number {
    if (this.inside) return rest.indexOf(tag)
    if (this.started) return -1
    const at = rest.indexOf(tag)
    return at !== -1 && rest.slice(0, at).trim() === '' ? at : -1
  }

  /** How much of `rest` cannot be the beginning of `tag`. */
  private safeLength(rest: string, tag: string): number {
    if (!this.inside && this.started) return rest.length
    for (let keep = Math.min(tag.length - 1, rest.length); keep > 0; keep -= 1) {
      if (tag.startsWith(rest.slice(rest.length - keep))) return rest.length - keep
    }
    return rest.length
  }
}

/** Tokens written a second, when the provider counted them and the answer took long enough to say. */
export function tokensPerSecond(message: ChatMessage): number | null {
  if (message.usage === undefined || message.ms === undefined || message.ms < 200) return null
  if (message.usage.output === 0) return null
  return Math.round((message.usage.output / message.ms) * 1000)
}

/** How long ago, as a log says it: "now", "5m", "2h", "3d", then the date. */
export function ago(at: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - at) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`
  if (minutes < 60 * 24 * 30) return `${Math.floor(minutes / (60 * 24))}d`
  return new Date(at).toISOString().slice(0, 10)
}

/** 1234 -> "1.2k": a count for a readout, not for accounting. */
export function compactCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n / 1000)}k`
}

/** A conversation as a markdown document, for "export". */
export function chatMarkdown(chat: Chat): string {
  const parts = [`# ${chat.title === '' ? 'untitled' : chat.title}`]
  for (const message of chat.messages) {
    const who = message.role === 'user' ? 'You' : (message.model ?? 'Assistant')
    parts.push(`## ${who}\n\n${message.text}`)
  }
  return `${parts.join('\n\n')}\n`
}
