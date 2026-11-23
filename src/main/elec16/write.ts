import type { AiProvider, AiProviderKind } from '@shared/ai'
import { MAX_FIXES } from '@shared/elec16/write-flow'
import {
  firstMessage,
  fixMessage,
  WRITE_LIMITS,
  writeSystemPrompt,
} from '@shared/elec16/write-prompt'
import {
  type Elec16WritePiece,
  type Elec16WriteResult,
  type Elec16WriteStop,
  WriteFixSchema,
  WriteRequestSchema,
} from '@shared/elec16-write'
import {
  describeFailure,
  type ProviderAdapter,
  type StreamResult,
  type StreamSink,
  type WireMessage,
} from '../ai/adapter.js'
import { type KeyLookup, type Target, targetFor } from '../ai/target.js'

/**
 * CODE's WRITE in main (docs/elec16-write.md section 5): a person's words put to a provider of
 * the AI settings - with its key, which never leaves main - under the prompt main writes, and
 * the answer passed on to the page that asked as it comes. Each pane has one conversation: a
 * SEND starts it, each fix (e16c's errors for the last answer) goes on with it, two at most,
 * and it is forgotten on the next SEND, a STOP, a failure, or the page going. The page only
 * ever gets the model's text, which becomes the editor's: nothing here runs or reads it.
 */

/** Nothing come for this long: the provider is taken to have gone quiet. */
export const WRITE_IDLE_MS = 60_000
/** A request never takes longer than this, however steadily it comes. */
export const WRITE_TOTAL_MS = 10 * 60_000
/** How often the text that has come is passed on. */
export const WRITE_FLUSH_MS = 100

export interface CodeWriterDeps {
  providers(): readonly AiProvider[]
  keyFor(providerId: string): ReturnType<KeyLookup>
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
  /** The text so far to the page that asked (by its id). */
  send(page: number, piece: Elec16WritePiece): void
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
}

/** Who asked: the page and its pane. */
export interface WriteKey {
  page: number
  pane: string
}

interface Talk {
  serial: number
  key: WriteKey
  target: Target
  model: string
  messages: WireMessage[]
  fixes: number
  /** The request under way, if any. */
  run: Run | null
}

interface Run {
  abort: AbortController
  /** Why it was aborted, when it was. */
  why: Elec16WriteStop | null
}

const keyOf = (k: WriteKey): string => `${k.page}/${k.pane}`

export class CodeWriter {
  readonly #deps: CodeWriterDeps
  readonly #talks = new Map<string, Talk>()
  /** Written once: it is the same for every request. */
  readonly #system = writeSystemPrompt()

  constructor(deps: CodeWriterDeps) {
    this.#deps = deps
  }

  /** A SEND: the pane's conversation begun afresh (one under way is stopped first). */
  async write(key: WriteKey, raw: unknown): Promise<Elec16WriteResult> {
    this.stop(key)
    const parsed = WriteRequestSchema.safeParse(raw)
    const serial = serialOf(raw)
    if (!parsed.success) return refused(serial, 'that is not a request WRITE takes')
    const request = parsed.data
    const target = targetFor(this.#deps.providers(), this.#deps.keyFor, request.provider)
    if (typeof target === 'string') return { ok: false, serial, stop: 'failed', note: target }
    const talk: Talk = {
      key,
      serial: request.serial,
      target,
      model: request.model,
      messages: [{ role: 'user', text: firstMessage(request.words, request.code, request.file) }],
      fixes: 0,
      run: null,
    }
    this.#talks.set(keyOf(key), talk)
    return this.#ask(key, talk, 0)
  }

  /** A fix: e16c's errors for the last answer, in the same conversation. */
  async fix(key: WriteKey, raw: unknown): Promise<Elec16WriteResult> {
    const parsed = WriteFixSchema.safeParse(raw)
    const serial = serialOf(raw)
    if (!parsed.success) return refused(serial, 'that is not a fix WRITE takes')
    const talk = this.#talks.get(keyOf(key))
    if (talk === undefined || talk.serial !== parsed.data.serial || talk.run !== null) {
      return refused(serial, 'there is no answer of that SEND to fix')
    }
    if (talk.fixes >= MAX_FIXES) {
      this.#talks.delete(keyOf(key))
      return { ok: false, serial, stop: 'spent', note: `${MAX_FIXES} fixes were asked for already` }
    }
    talk.fixes++
    talk.messages.push({ role: 'user', text: fixMessage(parsed.data.errors) })
    return this.#ask(key, talk, talk.fixes)
  }

  /** STOP, or a SEND that ended: the request under way is stopped and the conversation forgotten. */
  stop(key: WriteKey): void {
    const k = keyOf(key)
    const talk = this.#talks.get(k)
    this.#talks.delete(k)
    if (talk?.run) {
      talk.run.why = 'stopped'
      talk.run.abort.abort()
    }
  }

  /** A page gone: everything it asked for. */
  dropPage(page: number): void {
    for (const talk of [...this.#talks.values()]) {
      if (talk.key.page === page) this.stop(talk.key)
    }
  }

  /** Everything stopped: main is going. */
  dispose(): void {
    for (const talk of [...this.#talks.values()]) this.stop(talk.key)
  }

  /** Diagnostics: the panes with a request under way, as `page/pane`, sorted. */
  watching(): string[] {
    return [...this.#talks.entries()]
      .filter(([, t]) => t.run !== null)
      .map(([k]) => k)
      .sort()
  }

  async #ask(key: WriteKey, talk: Talk, round: number): Promise<Elec16WriteResult> {
    const run: Run = { abort: new AbortController(), why: null }
    talk.run = run
    const relay = new Relay(
      this.#deps,
      { pane: key.pane, serial: talk.serial, round },
      key.page,
      run,
    )
    try {
      const adapter = await this.#deps.adapter(talk.target.provider.kind)
      // Stopped while the adapter loaded: nothing is asked.
      if (run.why !== null) return this.#ended(key, talk, run.why)
      const result = await adapter.stream(
        {
          baseUrl: talk.target.baseUrl,
          key: talk.target.key,
          signal: run.abort.signal,
          model: talk.model,
          system: this.#system,
          // A copy: the conversation goes on growing after this request.
          messages: [...talk.messages],
        },
        relay.sink(),
      )
      if (run.why !== null) return this.#ended(key, talk, run.why)
      return this.#answered(key, talk, result, relay.text)
    } catch (error) {
      if (run.why !== null) return this.#ended(key, talk, run.why)
      return this.#failed(key, talk, 'failed', describeFailure(error, talk.target.baseUrl))
    } finally {
      relay.close()
      if (talk.run === run) talk.run = null
    }
  }

  /** How a request that ran to its end ended: refused, failed, or the answer, kept for a fix. */
  #answered(key: WriteKey, talk: Talk, result: StreamResult, text: string): Elec16WriteResult {
    if (result.stop === 'refusal') {
      return this.#failed(key, talk, 'refused', `refused${result.note ? `: ${result.note}` : ''}`)
    }
    // Cut at the model's length: a part of a program, which a fix would only cut again.
    if (result.stop === 'length') {
      return this.#failed(
        key,
        talk,
        'failed',
        `the answer was cut off at the model's length limit${result.note ? `: ${result.note}` : ''} - ask for a smaller program`,
      )
    }
    if (result.stop === 'error' || result.stop === 'unreachable') {
      return this.#failed(key, talk, 'failed', result.note ?? 'the provider failed')
    }
    const whole = result.answer ?? text
    talk.messages.push({ role: 'assistant', text: whole })
    return {
      ok: true,
      serial: talk.serial,
      text: whole,
      ...(result.usage !== undefined ? { usage: result.usage } : {}),
    }
  }

  #ended(key: WriteKey, talk: Talk, why: Elec16WriteStop): Elec16WriteResult {
    const notes: Partial<Record<Elec16WriteStop, string>> = {
      stopped: 'stopped',
      timeout: 'the provider went quiet, or took too long',
      'too-long': `the answer passed ${WRITE_LIMITS.answer / 1024} KB: too long to be a program`,
    }
    return this.#failed(key, talk, why, notes[why] ?? why)
  }

  #failed(key: WriteKey, talk: Talk, stop: Elec16WriteStop, note: string): Elec16WriteResult {
    if (this.#talks.get(keyOf(key)) === talk) this.#talks.delete(keyOf(key))
    return { ok: false, serial: talk.serial, stop, note }
  }
}

/**
 * One request's answer as it comes: passed on to the page in batches, watched for silence and
 * for a length no program has, and its timers let go when it ends.
 */
class Relay {
  text = ''
  readonly #deps: Pick<CodeWriterDeps, 'send' | 'setTimer' | 'clearTimer'>
  readonly #to: Omit<Elec16WritePiece, 'text'>
  readonly #page: number
  readonly #run: Run
  #pending = ''
  #flushTimer: unknown = null
  #idleTimer: unknown = null
  readonly #totalTimer: unknown

  constructor(
    deps: Pick<CodeWriterDeps, 'send' | 'setTimer' | 'clearTimer'>,
    to: Omit<Elec16WritePiece, 'text'>,
    page: number,
    run: Run,
  ) {
    this.#deps = deps
    this.#to = to
    this.#page = page
    this.#run = run
    this.#heard()
    this.#totalTimer = deps.setTimer(() => this.#cut('timeout'), WRITE_TOTAL_MS)
  }

  sink(): StreamSink {
    return {
      text: (piece) => {
        if (this.#run.abort.signal.aborted) return
        this.#heard()
        this.text += piece
        this.#pending += piece
        if (this.text.length > WRITE_LIMITS.answer) {
          this.#cut('too-long')
          return
        }
        this.#flushTimer ??= this.#deps.setTimer(() => this.#flush(), WRITE_FLUSH_MS)
      },
      // A model that reasons first is heard, not quiet: its thoughts are not passed on (the
      // page shows THINKING until the first text).
      thinking: () => {
        if (!this.#run.abort.signal.aborted) this.#heard()
      },
    }
  }

  /** The request over: what is left passed on, the timers let go. */
  close(): void {
    if (this.#flushTimer !== null) this.#deps.clearTimer(this.#flushTimer)
    this.#flush()
    if (this.#idleTimer !== null) this.#deps.clearTimer(this.#idleTimer)
    this.#deps.clearTimer(this.#totalTimer)
  }

  #flush(): void {
    this.#flushTimer = null
    if (this.#pending === '') return
    this.#deps.send(this.#page, { ...this.#to, text: this.#pending })
    this.#pending = ''
  }

  #heard(): void {
    if (this.#idleTimer !== null) this.#deps.clearTimer(this.#idleTimer)
    this.#idleTimer = this.#deps.setTimer(() => this.#cut('timeout'), WRITE_IDLE_MS)
  }

  #cut(why: Elec16WriteStop): void {
    if (this.#run.why === null) this.#run.why = why
    this.#run.abort.abort()
  }
}

function serialOf(raw: unknown): number {
  const s = typeof raw === 'object' && raw !== null ? (raw as { serial?: unknown }).serial : null
  return typeof s === 'number' && Number.isSafeInteger(s) && s >= 0 ? s : 0
}

const refused = (serial: number, note: string): Elec16WriteResult => ({
  ok: false,
  serial,
  stop: 'refused',
  note,
})
