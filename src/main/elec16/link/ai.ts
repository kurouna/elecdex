import type { AiProvider, AiProviderKind } from '@shared/ai'
import type { LinkAnswer, LinkRequest } from '@shared/elec16/link'
import { LINK_SERVICE, LINK_STATUS } from '@shared/elec16/link-services'
import {
  aiSystemPrompt,
  aiTraits,
  answerScript,
  lcdReply,
  NO_SEARCH,
  queryText,
} from '@shared/elec16/link-text'
import {
  describeFailure,
  type ProviderAdapter,
  type StreamRequest,
  type WireMessage,
} from '../../ai/adapter.js'
import { type Target, targetFor } from '../../ai/target.js'
import type { LinkContext, LinkService } from './hub.js'

/**
 * LINK's service 0, the AI (docs/elec16.md section 12): a question from the machine put to
 * the provider TUNE chose, one of the AI settings' - with its key, which never leaves main -
 * and the answer made into the LCD's characters (link-text.ts) before the machine sees it.
 *
 * A provider with no key is allowed: a local server needs none, and one that does says so when
 * asked, which the pane shows. Every answer is short, without reasoning; SEARCH and WEATHER
 * let the provider search the web on its side. A unit's conversation is the last ten
 * exchanges, kept here in memory only, started afresh when the machine says so (NEW, a new
 * type, RESET, the power) or the provider changes.
 */

export interface AiLinkDeps {
  providers(): readonly AiProvider[]
  /** The provider TUNE chose; empty for none. */
  provider(): string
  keyFor(providerId: string): string | null
  adapter(kind: AiProviderKind): Promise<ProviderAdapter>
  /** Today's date, for the model (the searches). */
  today(): string
}

/** Exchanges a conversation keeps. */
export const AI_TURNS = 10

interface Talk {
  provider: string
  turns: { question: string; answer: string }[]
}

/** The LCD's bytes back as text, for the conversation: what the model said, as shown. */
const shownText = (bytes: Uint8Array): string =>
  String.fromCharCode(...[...bytes].map((b) => (b >= 0xa1 ? b - 0xa1 + 0xff61 : b)))

export class AiLinkService implements LinkService {
  readonly service = LINK_SERVICE.ai
  readonly #deps: AiLinkDeps
  readonly #talks = new Map<string, Talk>()

  constructor(deps: AiLinkDeps) {
    this.#deps = deps
  }

  forget(unit: string): void {
    this.#talks.delete(unit)
  }

  async ask(request: LinkRequest, context: LinkContext): Promise<LinkAnswer> {
    // NEW holds whatever becomes of this question: one refused here is still a fresh start.
    if (request.fresh) this.forget(context.unit)
    const found = this.#target()
    if ('status' in found) return found
    const { target, model } = found
    const traits = aiTraits(request.type)
    const script = answerScript(request.type, request.query)
    const talk = this.#talkFor(context.unit, target.provider.id, request.fresh)
    const question = queryText(request.query)
    const before: WireMessage[] = traits.remembers
      ? talk.turns.flatMap((t) => [
          { role: 'user' as const, text: t.question },
          { role: 'assistant' as const, text: t.answer },
        ])
      : []
    const said = await this.#put(target, {
      baseUrl: target.baseUrl,
      key: target.key,
      signal: context.signal,
      model,
      system: aiSystemPrompt(request.type, script, request.max, this.#deps.today()),
      messages: [...before, { role: 'user', text: question }],
      // No cap, as the AI chat pane asks (user decision 2026-10-06): a cap cut the answers of
      // models that reason first (Gemini 2.5 spends its thinking from it), and what the LCD
      // shows is cut to the room the program gave anyway (lcdReply).
      noThinking: true,
      ...(traits.search ? { webSearch: true } : {}),
    })
    if ('status' in said) return said
    if (traits.search && said.text.trim().toUpperCase().startsWith(NO_SEARCH)) {
      return { status: LINK_STATUS.failed, note: `${NO_SEARCH}: this model cannot search the web` }
    }
    const data = lcdReply(said.text, script, request.max, said.unfinished)
    if (data.length === 0) return { status: LINK_STATUS.failed, note: 'the answer was empty' }
    if (traits.remembers) {
      talk.turns.push({ question, answer: shownText(data) })
      talk.turns.splice(0, Math.max(0, talk.turns.length - AI_TURNS))
    }
    return { status: LINK_STATUS.ready, data }
  }

  /** The provider TUNE chose and its model, or why there is none to ask. */
  #target(): { target: Target; model: string } | LinkAnswer {
    const providerId = this.#deps.provider()
    if (providerId === '') {
      return { status: LINK_STATUS.off, note: 'no AI provider chosen: pick one in the LINK panel' }
    }
    const target = targetFor(this.#deps.providers(), this.#deps.keyFor, providerId)
    if (typeof target === 'string') return { status: LINK_STATUS.failed, note: target }
    const model = target.provider.model
    if (model === '') {
      return {
        status: LINK_STATUS.failed,
        note: `${target.provider.name}: no model chosen - pick one in the AI settings`,
      }
    }
    return { target, model }
  }

  /**
   * The question put: the answer's text and whether the length limit stopped it, or why there
   * is none. A dropped request throws.
   */
  async #put(
    target: Target,
    request: StreamRequest,
  ): Promise<{ text: string; unfinished: boolean } | LinkAnswer> {
    let text = ''
    try {
      const adapter = await this.#deps.adapter(target.provider.kind)
      const result = await adapter.stream(request, {
        text: (piece) => {
          text += piece
        },
        thinking: () => {},
      })
      if (result.stop === 'refusal') {
        return {
          status: LINK_STATUS.failed,
          note: `refused${result.note ? `: ${result.note}` : ''}`,
        }
      }
      return { text: result.answer ?? text, unfinished: result.stop === 'length' }
    } catch (error) {
      if (request.signal.aborted) throw error
      return { status: LINK_STATUS.failed, note: describeFailure(error, target.baseUrl) }
    }
  }

  /** The unit's conversation: a new one when the machine asks, or another provider answers. */
  #talkFor(unit: string, provider: string, fresh: boolean): Talk {
    const now = this.#talks.get(unit)
    if (now !== undefined && !fresh && now.provider === provider) return now
    const talk: Talk = { provider, turns: [] }
    this.#talks.set(unit, talk)
    return talk
  }
}
