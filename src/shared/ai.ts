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
})
export type AiProvider = z.infer<typeof AiProviderSchema>

export interface AiPreset {
  id: string
  name: string
  kind: AiProviderKind
  baseUrl: string
  model: string
  /** Runs on this machine: no key is asked for. */
  local: boolean
}

/** What "add a provider" offers. Every field can be edited afterwards. */
export const AI_PRESETS: readonly AiPreset[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    kind: 'openai',
    baseUrl: 'http://localhost:11434/v1',
    model: '',
    local: true,
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    kind: 'openai',
    baseUrl: 'http://localhost:1234/v1',
    model: '',
    local: true,
  },
  {
    id: 'llamacpp',
    name: 'llama.cpp',
    kind: 'openai',
    baseUrl: 'http://localhost:8080/v1',
    model: '',
    local: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-opus-5',
    local: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: '',
    local: false,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    kind: 'openai',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: '',
    local: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: '',
    local: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    kind: 'openai',
    baseUrl: 'http://localhost:8000/v1',
    model: '',
    local: true,
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
export const CHAT_STOPS = ['stopped', 'length', 'refusal', 'error'] as const
export type ChatStop = (typeof CHAT_STOPS)[number]

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

/** A conversation as a markdown document, for "export". */
export function chatMarkdown(chat: Chat): string {
  const parts = [`# ${chat.title === '' ? 'untitled' : chat.title}`]
  for (const message of chat.messages) {
    const who = message.role === 'user' ? 'You' : (message.model ?? 'Assistant')
    parts.push(`## ${who}\n\n${message.text}`)
  }
  return `${parts.join('\n\n')}\n`
}
