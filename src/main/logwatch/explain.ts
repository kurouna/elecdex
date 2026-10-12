import { type AiProvider, type AiProviderKind, type ChatStop, STOP_CODES } from '@shared/ai'
import { explainSystem, explainText } from '@shared/logwatch/explain'
import type { LogExplainEvent, LogExplainRequest, LogFormat, LogLine } from '@shared/logwatch/types'
import { describeFailure, isUnreachable, type ProviderAdapter } from '../ai/adapter.js'
import { targetFor } from '../ai/target.js'

/**
 * EXPLAIN (docs/logwatch.md §7): one line of a log, and the lines before it, asked of a provider
 * of the AI settings - on a press only, one answer at a time for a page, given up after
 * `EXPLAIN_TIMEOUT_MS`. What is sent is put together here from what main read, never from text
 * the page sends; the key stays in main. Free of Electron: everything comes in.
 */

export const EXPLAIN_TIMEOUT_MS = 180_000
const FLUSH_MS = 100

export interface ExplainDeps<P> {
  providers(): readonly AiProvider[]
  /** The user's own instructions of the AI settings. */
  systemPrompt(): string
  keyFor(providerId: string): string | null
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
  context(
    request: LogExplainRequest,
  ): { target: LogLine; before: LogLine[]; file: string; format: LogFormat } | null
  newId(): string
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  send(page: P, event: LogExplainEvent): void
}

interface Asking {
  token: string
  abort: AbortController
  event: LogExplainEvent
  flush: unknown
  timeout: unknown
  /** Given up for taking too long, rather than stopped by the user. */
  late: boolean
}

export type ExplainStart = { token: string } | { problem: string }

export class LogExplainer<P> {
  readonly #deps: ExplainDeps<P>
  readonly #asking = new Map<P, Asking>()

  constructor(deps: ExplainDeps<P>) {
    this.#deps = deps
  }

  /** What would be sent, for the pane to show before SEND; null when the line is gone. */
  preview(request: LogExplainRequest): string | null {
    const found = this.#deps.context(request)
    if (found === null) return null
    return explainText(found.target, found.before, found, request.mask)
  }

  /** Whether a page has an answer being written. */
  busy(page: P): boolean {
    return this.#asking.has(page)
  }

  start(page: P, request: LogExplainRequest): ExplainStart {
    if (this.#asking.has(page)) return { problem: 'an answer is still being written' }
    const providers = this.#deps.providers()
    const provider =
      request.provider === '' ? providers[0] : providers.find((p) => p.id === request.provider)
    if (provider === undefined) return { problem: 'no AI provider is set up in the settings' }
    const target = targetFor(providers, this.#deps.keyFor, provider.id)
    if (typeof target === 'string') return { problem: target }
    const found = this.#deps.context(request)
    if (found === null) return { problem: 'that line is no longer held: choose it again' }
    const model = request.model !== '' ? request.model : provider.model
    const asking: Asking = {
      token: this.#deps.newId(),
      abort: new AbortController(),
      event: { token: '', text: '', done: false, failure: null, provider: provider.name, model },
      flush: null,
      timeout: null,
      late: false,
    }
    asking.event.token = asking.token
    asking.timeout = this.#deps.setTimer(() => {
      asking.late = true
      asking.abort.abort()
    }, EXPLAIN_TIMEOUT_MS)
    this.#asking.set(page, asking)
    void this.#ask(page, asking, {
      kind: provider.kind,
      baseUrl: target.baseUrl,
      key: target.key,
      model,
      text: explainText(found.target, found.before, found, request.mask),
    })
    return { token: asking.token }
  }

  /** Stops a page's answer; what was written stays. */
  cancel(page: P, token: string): void {
    const asking = this.#asking.get(page)
    if (asking?.token === token) asking.abort.abort()
  }

  /** The page went: its answer is stopped and nothing more is sent. */
  dropPage(page: P): void {
    const asking = this.#asking.get(page)
    if (asking === undefined) return
    this.#asking.delete(page)
    this.#end(asking)
    asking.abort.abort()
  }

  dispose(): void {
    for (const page of [...this.#asking.keys()]) this.dropPage(page)
  }

  async #ask(
    page: P,
    asking: Asking,
    to: { kind: AiProviderKind; baseUrl: string; key: string | null; model: string; text: string },
  ): Promise<void> {
    try {
      const adapter = await this.#deps.adapter(to.kind)
      const result = await adapter.stream(
        {
          baseUrl: to.baseUrl,
          key: to.key,
          model: to.model,
          system: explainSystem(this.#deps.systemPrompt()),
          messages: [{ role: 'user', text: to.text }],
          signal: asking.abort.signal,
        },
        {
          text: (piece) => {
            asking.event.text += piece
            asking.flush ??= this.#deps.setTimer(() => {
              asking.flush = null
              this.#send(page, asking)
            }, FLUSH_MS)
          },
          thinking: () => {},
        },
      )
      if (result.answer !== undefined) asking.event.text = result.answer
      if (result.stop !== undefined) asking.event.failure = failure(result.stop, result.note)
    } catch (error) {
      asking.event.failure = asking.late
        ? failure('error', `no answer within ${EXPLAIN_TIMEOUT_MS / 1000} seconds`)
        : asking.abort.signal.aborted
          ? failure('stopped')
          : failure(
              isUnreachable(error) ? 'unreachable' : 'error',
              describeFailure(error, to.baseUrl),
            )
    }
    if (this.#asking.get(page) !== asking) return
    this.#asking.delete(page)
    this.#end(asking)
    asking.event.done = true
    this.#send(page, asking)
  }

  #end(asking: Asking): void {
    if (asking.flush !== null) this.#deps.clearTimer(asking.flush)
    if (asking.timeout !== null) this.#deps.clearTimer(asking.timeout)
    asking.flush = null
    asking.timeout = null
  }

  #send(page: P, asking: Asking): void {
    this.#deps.send(page, { ...asking.event })
  }
}

/** The link vocabulary's code, with the provider's own words beside it (never in a tooltip). */
function failure(stop: ChatStop, note?: string): string {
  return note ? `${STOP_CODES[stop]}: ${note}` : STOP_CODES[stop]
}
