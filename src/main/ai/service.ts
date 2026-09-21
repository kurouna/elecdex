import {
  AI_CONTEXT,
  AI_LIMITS,
  type AiModelsResult,
  type AiProvider,
  type AiProviderKind,
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
  chatWindow,
  clipToTokens,
  compactPrompt,
  compactTranscript,
  contextWindow,
  estimateTokens,
  summaryRoom,
  withSummary,
} from '@shared/ai'
import {
  describeFailure,
  isUnreachable,
  type ProviderAdapter,
  type StreamResult,
} from './adapter.js'
import type { ChatStore } from './store.js'
import { type Target, targetFor } from './target.js'

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

/**
 * A provider's count of what it read corrects the estimate of what was sent -
 * once there is enough of it that the chat template's own tokens do not decide
 * the figure, and only ever upwards: a server that silently dropped the beginning
 * of a prompt too long for it reports a small count, and believing that would
 * send it more still.
 */
const MEASURE_FROM = 500
const RATIO_MAX = 2

/**
 * How often a summary is asked for at one cut: once, and once more with the next question if
 * that came to nothing - a passing failure should not leave a stretch of the conversation neither
 * sent nor summarised until the next cut, many turns away. Not for ever: a model that cannot
 * summarise is not asked with every question.
 */
const COMPACT_TRIES = 2

export interface AiDeps {
  store: ChatStore
  providers(): readonly AiProvider[]
  systemPrompt(): string
  /** Whether what stays behind of a long conversation is summarised (settings: `ai.compact`). */
  compact(): boolean
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

type Summary = NonNullable<NonNullable<Chat['context']>['summary']>

/** What goes to the model for one question: the conversation is longer when it did not all fit. */
interface Outgoing {
  /** The system prompt as typed, and as sent: with the summary of what stays behind after it. */
  typed: string
  system: string
  messages: { role: ChatMessage['role']; text: string }[]
  /** The id of the first message sent, when some stayed behind. */
  from: string | undefined
  /** The summary that still holds for this cut, if there is one. */
  summary: Summary | undefined
  /** Set when a summary is to be asked for before the question: what to summarise, and its room. */
  transcript: string | undefined
  room: number
  /** The uncorrected estimate of the messages, and whose correction the provider's count becomes. */
  estimate: number
  measures: string
}

interface Running {
  run: ChatRun
  chat: Chat
  outgoing: Outgoing
  abort: AbortController
  /** Where the page's copy of the run ends: what has been published so far. */
  sentText: number
  sentThinking: number
  timer: unknown
  finished: boolean
}

export class AiChatService {
  private readonly deps: AiDeps
  private readonly running = new Map<string, Running>()
  /** Real tokens to estimated ones, as last measured, by provider and model. Not kept across runs. */
  private readonly ratios = new Map<string, number>()
  /** By conversation: the cut a summary last came to nothing at, and how many times (`COMPACT_TRIES`). */
  private readonly failed = new Map<string, { from: string; tries: number }>()

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
    this.failed.delete(chatId)
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

    const outgoing = this.outgoingFor(chatId, messages, stored.context, target, request.model)
    const now = this.deps.now()
    const { context: previous, ...rest } = stored
    const chat: Chat = {
      ...rest,
      // Named after the first question - also when that question is the one being rewritten.
      title:
        stored.title === '' || messages.length === 1
          ? chatTitle(messages[0]?.text ?? '')
          : stored.title,
      updatedAt: now,
      messages,
      // What this question sends is what the pane shows as sent: a conversation that fits
      // again (rewritten shorter, or asked of a model with more room) loses its line.
      ...(outgoing.from === undefined
        ? {}
        : {
            context: {
              from: outgoing.from,
              at: previous?.from === outgoing.from ? previous.at : now,
              ...(outgoing.summary === undefined ? {} : { summary: outgoing.summary }),
            },
          }),
    }
    // The question is kept before the answer is asked for: a crash loses the answer, not the question.
    if (!this.deps.store.save(chat))
      return { ok: false, error: 'the conversation could not be saved' }
    this.deps.listChanged(this.list())
    this.start(chat, target, request.model, outgoing)
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
    return targetFor(this.deps.providers(), (id) => this.deps.keyFor(id), providerId)
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

  /** What of the conversation goes to this model (`chatWindow`). */
  private outgoingFor(
    chatId: string,
    all: readonly ChatMessage[],
    context: Chat['context'],
    target: Target,
    model: string,
  ): Outgoing {
    const typed = this.deps.systemPrompt()
    const compacts = this.deps.compact()
    // An answer that failed outright said nothing: it is not part of the history.
    const messages = all.filter((m) => m.text !== '')
    const measures = `${target.provider.id}\n${model}`
    const window = contextWindow(target.provider)
    const ratio = this.ratios.get(measures) ?? 1
    const room = summaryRoom(window)
    // The summary there is counts as what it is; one still to be written has its room already, so
    // that writing it does not move the cut it is written for (a later one may be longer, but
    // never by more than the room, which is well within what a cut leaves free).
    const kept = context?.summary
    const ahead = kept !== undefined ? estimateTokens(kept.text) : compacts ? room : 0
    const cut = chatWindow(messages, {
      window,
      system: estimateTokens(typed) + ahead,
      ratio,
      from: context?.from,
    })
    const from = cut.from === 0 ? undefined : messages[cut.from]?.id
    // A summary speaks for what is before `before`: it holds while that is still behind the cut
    // (a conversation rewritten from further back has lost it, and one sent whole needs none).
    const covered = kept === undefined ? -1 : messages.findIndex((m) => m.id === kept.before)
    const summary = covered > 0 && covered <= cut.from ? kept : undefined
    const unspoken = summary === undefined || covered < cut.from
    const asks = compacts && unspoken && this.mayAskSummary(chatId, from)
    return {
      typed,
      system: summary === undefined ? typed : withSummary(typed, summary.text),
      messages: messages.slice(cut.from).map((m) => ({ role: m.role, text: m.text })),
      from,
      summary,
      transcript: asks
        ? compactTranscript(
            summary?.text,
            messages.slice(summary === undefined ? 0 : covered, cut.from),
            (window * AI_CONTEXT.low) / ratio - estimateTokens(compactPrompt(room)),
          )
        : undefined,
      room,
      estimate: cut.estimate - estimateTokens(typed) - ahead,
      measures,
    }
  }

  /**
   * Whether a summary may still be asked for at this cut. What counts against it is a summary
   * that came to nothing (`compact`) - not a question that was never sent, and not the user
   * stopping the wait.
   */
  private mayAskSummary(chatId: string, from: string | undefined): boolean {
    if (from === undefined) return false
    const before = this.failed.get(chatId)
    return before?.from !== from || before.tries < COMPACT_TRIES
  }

  private measured(outgoing: Outgoing, usage: StreamResult['usage']): void {
    const estimate = outgoing.estimate + estimateTokens(outgoing.system)
    if (usage === undefined || estimate < MEASURE_FROM) return
    if (this.ratios.size >= 200) this.ratios.clear()
    const ratio = Math.min(RATIO_MAX, Math.max(1, usage.input / estimate))
    this.ratios.set(outgoing.measures, ratio)
  }

  /**
   * Asks the same model for a summary of what stays behind, ahead of the question. Whatever
   * goes wrong, the question is still asked - with the summary there was, or none: the messages
   * are then simply not sent, which is what happens with summaries off.
   */
  private async compact(
    running: Running,
    target: Target,
    model: string,
    adapter: ProviderAdapter,
  ): Promise<void> {
    const { outgoing } = running
    if (outgoing.transcript === undefined || outgoing.from === undefined) return
    let text = ''
    try {
      await adapter.stream(
        {
          baseUrl: target.baseUrl,
          key: target.key,
          model,
          system: compactPrompt(outgoing.room),
          messages: [{ role: 'user', text: outgoing.transcript }],
          signal: running.abort.signal,
        },
        {
          text: (piece) => {
            if (text.length < AI_LIMITS.summary) text += piece
          },
          thinking: () => {},
        },
      )
    } catch {
      text = ''
    }
    // Stopped, or deleted, while it was written: there is no question to go on to.
    if (running.finished) return
    const summary = clipToTokens(text.trim().slice(0, AI_LIMITS.summary), outgoing.room)
    if (summary === '') {
      const before = this.failed.get(running.chat.id)
      const tries = before?.from === outgoing.from ? before.tries : 0
      this.failed.set(running.chat.id, { from: outgoing.from, tries: tries + 1 })
    } else if (running.chat.context !== undefined) {
      this.failed.delete(running.chat.id)
      outgoing.summary = { text: summary, before: outgoing.from }
      outgoing.system = withSummary(outgoing.typed, summary)
      running.chat = {
        ...running.chat,
        context: { ...running.chat.context, summary: outgoing.summary },
      }
      if (this.deps.store.get(running.chat.id) !== null) this.deps.store.save(running.chat)
    }
    // The answer's clock starts with the question: tokens a second are the answer's, not the summary's.
    const { phase: _done, ...run } = running.run
    running.run = { ...run, startedAt: this.deps.now() }
    this.deps.publish(this.snapshot(running.chat.id))
  }

  private start(chat: Chat, target: Target, model: string, outgoing: Outgoing): void {
    const running: Running = {
      run: {
        id: this.deps.newId(),
        text: '',
        thinking: '',
        provider: target.provider.name,
        model,
        startedAt: this.deps.now(),
        ...(outgoing.transcript === undefined ? {} : { phase: 'compacting' as const }),
      },
      chat,
      outgoing,
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
      await this.compact(running, target, model, adapter)
      if (running.finished) return
      const result = await adapter.stream(
        {
          baseUrl: target.baseUrl,
          key: target.key,
          model,
          system: running.outgoing.system,
          messages: running.outgoing.messages,
          signal: running.abort.signal,
        },
        {
          text: (piece) => this.append(running, 'text', piece),
          thinking: (piece) => this.append(running, 'thinking', piece),
        },
      )
      this.finish(running, result)
    } catch (error) {
      this.finish(running, {
        stop: isUnreachable(error) ? 'unreachable' : 'error',
        note: describeFailure(error, target.baseUrl),
      })
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
    this.measured(running.outgoing, result.usage)

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
