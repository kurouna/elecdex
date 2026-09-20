import {
  AI_LIMITS,
  type AiModelsResult,
  type AiProvider,
  type AiProviderKind,
  aiBaseUrl,
  CHAT_VERSION,
  type Chat,
  type ChatEvent,
  type ChatMessage,
  type ChatRequest,
  type ChatRun,
  type ChatSendResult,
  type ChatStop,
  type ChatSummary,
  chatTitle,
  keyMayTravel,
} from '@shared/ai'
import { describeFailure, type ProviderAdapter, type StreamResult } from './adapter.js'
import type { ChatStore } from './store.js'

/**
 * The conversations and the answers being written.
 *
 * Free of Electron, with everything it touches passed in, so it is tested as it
 * runs. An answer belongs to main: the pane that asked may be moved (which
 * remounts it) or the page reloaded while it is written, and whoever subscribes
 * next is given the conversation and the run as they stand.
 *
 * Pieces of an answer are gathered and sent on every FLUSH_MS, not as they
 * arrive: a fast local model emits hundreds a second, and the page draws ten
 * frames a second.
 */

const FLUSH_MS = 100

export interface AiDeps {
  store: ChatStore
  providers(): readonly AiProvider[]
  systemPrompt(): string
  keyFor(providerId: string): string | null
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
  now(): number
  newId(): string
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(event: ChatEvent): void
  /** The list of conversations changed. */
  listChanged(list: ChatSummary[]): void
}

interface Running {
  run: ChatRun
  chat: Chat
  abort: AbortController
  /** Where the page's copy of the run ends: what has been published so far. */
  sentText: number
  sentThinking: number
  timer: unknown
  finished: boolean
}

interface Target {
  provider: AiProvider
  baseUrl: string
  key: string | null
}

export class AiChatService {
  private readonly deps: AiDeps
  private readonly running = new Map<string, Running>()

  constructor(deps: AiDeps) {
    this.deps = deps
  }

  list(): ChatSummary[] {
    return this.deps.store.list()
  }

  /** Chats an answer is being written for. */
  active(): string[] {
    return [...this.running.keys()]
  }

  create(): string | null {
    const now = this.deps.now()
    const chat: Chat = {
      version: CHAT_VERSION,
      id: this.deps.newId(),
      title: '',
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    if (!this.deps.store.save(chat)) return null
    this.deps.listChanged(this.list())
    return chat.id
  }

  remove(chatId: string): boolean {
    // The answer being written goes with it: nothing of it is kept, so nothing is written
    // only to be deleted.
    const running = this.running.get(chatId)
    if (running !== undefined) {
      this.close(running)
      running.abort.abort()
    }
    if (!this.deps.store.remove(chatId)) return false
    this.deps.publish({ type: 'snapshot', chatId, chat: null, run: null })
    this.deps.listChanged(this.list())
    return true
  }

  get(chatId: string): Chat | null {
    return this.running.get(chatId)?.chat ?? this.deps.store.get(chatId)
  }

  snapshot(chatId: string): ChatEvent {
    const running = this.running.get(chatId)
    if (running === undefined) {
      return { type: 'snapshot', chatId, chat: this.deps.store.get(chatId), run: null }
    }
    // Everyone is brought up to the same place first, so the deltas that follow
    // fit both the page given this snapshot and the ones already listening.
    this.flush(running)
    return { type: 'snapshot', chatId, chat: running.chat, run: { ...running.run } }
  }

  send(chatId: string, request: ChatRequest): ChatSendResult {
    if (this.running.has(chatId)) return { ok: false, error: 'an answer is still being written' }
    const stored = this.deps.store.get(chatId)
    if (stored === null) return { ok: false, error: 'no such conversation' }
    const target = this.targetFor(request.provider)
    if (typeof target === 'string') return { ok: false, error: target }

    const messages = this.nextMessages(stored.messages, request)
    if (typeof messages === 'string') return { ok: false, error: messages }

    const chat: Chat = {
      ...stored,
      // Named after the first question - also when that question is the one being rewritten.
      title:
        stored.title === '' || messages.length === 1
          ? chatTitle(messages[0]?.text ?? '')
          : stored.title,
      updatedAt: this.deps.now(),
      messages,
    }
    // The question is kept before the answer is asked for: a crash loses the answer, not the question.
    if (!this.deps.store.save(chat))
      return { ok: false, error: 'the conversation could not be saved' }
    this.deps.listChanged(this.list())
    this.start(chat, target, request.model)
    return { ok: true }
  }

  /** Ends the answer being written, keeping what there is of it. */
  stop(chatId: string): void {
    const running = this.running.get(chatId)
    if (running === undefined) return
    this.finish(running, { stop: 'stopped' })
    running.abort.abort()
  }

  async models(providerId: string, signal: AbortSignal): Promise<AiModelsResult> {
    const target = this.targetFor(providerId)
    if (typeof target === 'string') return { models: [], error: target }
    try {
      const adapter = await this.deps.adapter(target.provider.kind)
      const models = await adapter.models({ baseUrl: target.baseUrl, key: target.key, signal })
      return { models, error: null }
    } catch (error) {
      return { models: [], error: describeFailure(error, target.baseUrl) }
    }
  }

  /** On quit: what has been written so far is kept, synchronously, before anything is torn down. */
  dispose(): void {
    for (const chatId of this.active()) this.stop(chatId)
  }

  private targetFor(providerId: string): Target | string {
    const provider = this.deps.providers().find((p) => p.id === providerId)
    if (provider === undefined) return 'that provider is no longer listed in the settings'
    const baseUrl = aiBaseUrl(provider.baseUrl)
    if (baseUrl === null) return `${provider.name}: the address is not a usable http(s) URL`
    const key = this.deps.keyFor(provider.id)
    if (key !== null && !keyMayTravel(baseUrl)) {
      return `${provider.name}: the key is not sent over plain http to another network - use https`
    }
    return { provider, baseUrl, key }
  }

  /** The history the request leaves, ending in a user message for the model to answer. */
  private nextMessages(
    current: readonly ChatMessage[],
    request: ChatRequest,
  ): ChatMessage[] | string {
    let messages = [...current]
    if (request.replaceFrom !== undefined) {
      const at = messages.findIndex((m) => m.id === request.replaceFrom)
      if (at === -1) return 'that message is no longer in the conversation'
      messages = messages.slice(0, at)
    }
    if (request.text === undefined) {
      // Regenerate: the last answer goes, the question it answered stays.
      while (messages.at(-1)?.role === 'assistant') messages.pop()
      if (messages.length === 0) return 'there is nothing to answer yet'
      return messages
    }
    if (messages.length + 2 > AI_LIMITS.messages) {
      return 'this conversation is full - start a new one'
    }
    messages.push({
      id: this.deps.newId(),
      role: 'user',
      text: request.text,
      at: this.deps.now(),
    })
    return messages
  }

  private start(chat: Chat, target: Target, model: string): void {
    const running: Running = {
      run: {
        id: this.deps.newId(),
        text: '',
        thinking: '',
        provider: target.provider.name,
        model,
        startedAt: this.deps.now(),
      },
      chat,
      abort: new AbortController(),
      sentText: 0,
      sentThinking: 0,
      timer: null,
      finished: false,
    }
    this.running.set(chat.id, running)
    this.deps.publish(this.snapshot(chat.id))
    void this.generate(running, target, model)
  }

  private async generate(running: Running, target: Target, model: string): Promise<void> {
    try {
      const adapter = await this.deps.adapter(target.provider.kind)
      const result = await adapter.stream(
        {
          baseUrl: target.baseUrl,
          key: target.key,
          model,
          system: this.deps.systemPrompt(),
          // An answer that failed outright said nothing: it is not part of the history.
          messages: running.chat.messages
            .filter((m) => m.text !== '')
            .map((m) => ({ role: m.role, text: m.text })),
          signal: running.abort.signal,
        },
        {
          text: (piece) => this.append(running, 'text', piece),
          thinking: (piece) => this.append(running, 'thinking', piece),
        },
      )
      this.finish(running, result)
    } catch (error) {
      this.finish(running, { stop: 'error', note: describeFailure(error, target.baseUrl) })
    }
  }

  private append(running: Running, part: 'text' | 'thinking', piece: string): void {
    if (running.finished) return
    const room = AI_LIMITS.text - running.run[part].length
    if (room <= 0) return
    running.run[part] += piece.slice(0, room)
    running.timer ??= this.deps.setTimer(() => {
      running.timer = null
      this.flush(running)
    }, FLUSH_MS)
  }

  private flush(running: Running): void {
    if (running.finished) return
    const { run } = running
    if (run.text.length === running.sentText && run.thinking.length === running.sentThinking) return
    this.deps.publish({
      type: 'delta',
      chatId: running.chat.id,
      runId: run.id,
      textAt: running.sentText,
      text: run.text.slice(running.sentText),
      thinkingAt: running.sentThinking,
      thinking: run.thinking.slice(running.sentThinking),
    })
    running.sentText = run.text.length
    running.sentThinking = run.thinking.length
  }

  /** The run is over, whatever becomes of it: no more pieces, no more flushes. */
  private close(running: Running): void {
    running.finished = true
    if (running.timer !== null) this.deps.clearTimer(running.timer)
    this.running.delete(running.chat.id)
  }

  /** Turns the run into the conversation's next message, once: a stop and the stream's own end both arrive here. */
  private finish(running: Running, result: StreamResult): void {
    if (running.finished) return
    this.close(running)

    const { run } = running
    const now = this.deps.now()
    const stop: ChatStop | undefined = result.stop
    const message: ChatMessage = {
      id: run.id,
      role: 'assistant',
      text: run.text,
      at: now,
      ms: Math.max(0, now - run.startedAt),
      provider: run.provider,
      model: result.model ?? run.model,
      ...(run.thinking === '' ? {} : { thinking: run.thinking }),
      ...(result.usage === undefined ? {} : { usage: result.usage }),
      ...(stop === undefined ? {} : { stop }),
      ...(result.note === undefined ? {} : { error: result.note.slice(0, 600) }),
    }
    const chat: Chat = {
      ...running.chat,
      updatedAt: now,
      messages: [...running.chat.messages, message],
    }
    // A conversation deleted while it was being answered stays deleted.
    const kept = this.deps.store.get(chat.id) !== null && this.deps.store.save(chat)
    this.deps.publish({ type: 'snapshot', chatId: chat.id, chat: kept ? chat : null, run: null })
    if (kept) this.deps.listChanged(this.list())
  }
}
