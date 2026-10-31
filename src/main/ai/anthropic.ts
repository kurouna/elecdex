import Anthropic from '@anthropic-ai/sdk'
import { AI_LIMITS, type AiModel } from '@shared/ai'
import {
  type AdapterTarget,
  type FetchLike,
  type Media,
  type ProviderAdapter,
  ProviderError,
  type StreamRequest,
  type StreamResult,
  type StreamSink,
  statusFailure,
  UnreachableError,
  type WireMessage,
} from './adapter.js'

/**
 * Anthropic's Messages API, through the official SDK.
 *
 * What a model can do is asked of the Models API rather than guessed from its
 * name: whether it takes adaptive thinking, and how long an answer it may write.
 * A proxy that does not serve that endpoint still works - the request then
 * carries neither, which every model accepts.
 *
 * A question's images and documents go as base64 blocks ahead of its text, as the API's
 * guidance puts them; never the Files API, which would leave copies with the service to manage.
 *
 * Only text is sent back as history. Thinking blocks are shown and kept, never
 * replayed: with no tools of ours in play (a web search is the server's own) the API does not
 * need them, and leaving them out is what lets an earlier question be edited without
 * invalidating anything. The one exception is within an answer: a turn a search paused goes
 * back whole, its thinking with it, for the server to go on from.
 */

/** Room for a long answer; streaming, so no request timeout stands in its way. */
const DEFAULT_MAX_TOKENS = 64_000

/**
 * Models whose safety classifiers may decline a request, for which the API can
 * re-run it on another model in the same call. Asked for only of Anthropic's own
 * endpoint: a proxy or a cloud platform may not know the parameter.
 */
const FALLBACK_MODELS = new Set(['claude-opus-5', 'claude-fable-5-1'])
const FALLBACK_BETA = 'server-side-fallback-2026-07-01'
const FIRST_PARTY_HOST = 'api.anthropic.com'

interface ModelFacts {
  maxTokens: number
  adaptiveThinking: boolean
}

const UNKNOWN_MODEL: ModelFacts = { maxTokens: DEFAULT_MAX_TOKENS, adaptiveThinking: false }

const options = (target: AdapterTarget) => ({ signal: target.signal })

function failure(error: unknown): unknown {
  // Most specific first: a connection failure is an APIError too, with no status.
  if (error instanceof Anthropic.APIUserAbortError) return error
  if (error instanceof Anthropic.APIConnectionError) {
    return new UnreachableError('could not reach the provider - check the address and the network')
  }
  if (error instanceof Anthropic.APIError && typeof error.status === 'number') {
    const body = error.error as { error?: { message?: unknown } } | undefined
    const said = body?.error?.message
    return statusFailure(error.status, typeof said === 'string' ? said : null)
  }
  if (error instanceof Anthropic.AnthropicError)
    return new ProviderError(error.message.slice(0, 300))
  return error
}

/** How many times a paused turn is sent back to go on: past this, the answer ends as it stands. */
const CONTINUATIONS = 3

/** The most sources listed under an answer: the rest are still cited in what it read. */
const SOURCES = 10

const paramsFor = (request: StreamRequest, model: ModelFacts) => ({
  model: request.model,
  max_tokens: Math.min(request.maxTokens ?? model.maxTokens, model.maxTokens),
  // The conversation so far is the same prefix on every turn: cache it.
  cache_control: { type: 'ephemeral' as const },
  ...(request.system === '' ? {} : { system: request.system }),
  // Summarized, or the reasoning arrives as empty blocks and the pane shows a long silence.
  ...(model.adaptiveThinking && request.noThinking !== true
    ? { thinking: { type: 'adaptive' as const, display: 'summarized' as const } }
    : {}),
  // The basic search, which every model with search takes, with no code run for it.
  ...(request.webSearch !== undefined
    ? {
        tools: [
          {
            type: 'web_search_20250305' as const,
            name: 'web_search' as const,
            max_uses: request.webSearch,
          },
        ],
      }
    : {}),
  messages: request.messages.map((m) => ({ role: m.role, content: contentOf(m) })),
})

/** The text after the last search result: the answer, without what was said while searching. */
function answerAfterSearch(message: Anthropic.Message | Anthropic.Beta.BetaMessage): string | null {
  const blocks = message.content as readonly { type: string; text?: string }[]
  let last = -1
  blocks.forEach((b, k) => {
    if (b.type === 'server_tool_use' || b.type === 'web_search_tool_result') last = k
  })
  if (last < 0) return null
  return blocks
    .slice(last + 1)
    .map((b) => (b.type === 'text' ? (b.text ?? '') : ''))
    .join('')
}

/** What is read of a citation: only a search result's has an address. */
type Citation = { type?: string; url?: unknown; title?: unknown }

/**
 * The pages an answer cited, as a markdown list to go after it: Anthropic asks that an answer
 * from its web search be shown with its sources, and the pane draws only text. A title loses its
 * brackets and an address its parentheses, so neither can end the link early; a title's line
 * breaks become spaces, or the item would end on its first line.
 */
export function sourcesOf(message: Anthropic.Message | Anthropic.Beta.BetaMessage): string {
  const found = new Map<string, string>()
  for (const block of message.content as readonly { type: string; citations?: unknown }[]) {
    if (block.type !== 'text' || !Array.isArray(block.citations)) continue
    for (const c of block.citations as readonly Citation[]) {
      if (c.type !== 'web_search_result_location' || typeof c.url !== 'string') continue
      if (!found.has(c.url)) found.set(c.url, typeof c.title === 'string' ? c.title : '')
    }
  }
  const lines = [...found].slice(0, SOURCES).map(([url, title]) => {
    const href = url.replace(/\(/g, '%28').replace(/\)/g, '%29')
    const name = title.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim() || href
    return `- [${name}](${href})`
  })
  return lines.length === 0 ? '' : `\n\nSources:\n${lines.join('\n')}`
}

/**
 * The sink a search's answer is written through: the text the model writes after a search
 * starts a new paragraph, where it would otherwise run on from what it said before searching.
 */
function searchingSink(sink: StreamSink) {
  let wrote = false
  let searched = false
  return {
    text(piece: string): void {
      if (searched && wrote) sink.text(`\n\n${piece}`)
      else sink.text(piece)
      searched = false
      wrote ||= piece !== ''
    },
    thinking: (piece: string): void => sink.thinking(piece),
    block(type: string): void {
      if (type === 'server_tool_use' || type === 'web_search_tool_result') searched = true
    },
  }
}

const mediaBlock = (media: Media): Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam =>
  media.kind === 'image'
    ? { type: 'image', source: { type: 'base64', media_type: media.mime, data: media.data } }
    : {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: media.data },
        title: media.name,
      }

/** A message's content: its text, or its images and documents first and then its text. */
export const contentOf = (message: WireMessage): string | Anthropic.ContentBlockParam[] =>
  message.media === undefined || message.media.length === 0
    ? message.text
    : [
        ...message.media.map(mediaBlock),
        ...(message.text === '' ? [] : [{ type: 'text' as const, text: message.text }]),
      ]

/** What the pane is told of a finished message. The stop reason is read before anything else. */
function resultOf(
  message: Anthropic.Message | Anthropic.Beta.BetaMessage,
  asked: string,
): StreamResult {
  const usage = message.usage
  const result: StreamResult = {
    usage: {
      input:
        usage.input_tokens +
        (usage.cache_read_input_tokens ?? 0) +
        (usage.cache_creation_input_tokens ?? 0),
      output: usage.output_tokens,
    },
  }
  // A fallback model answered in the first one's place: the answer names who wrote it.
  if (message.model !== asked) result.model = message.model
  const answer = answerAfterSearch(message)
  if (answer !== null) result.answer = answer
  if (message.stop_reason === 'max_tokens') result.stop = 'length'
  if (message.stop_reason === 'pause_turn') {
    result.stop = 'length'
    result.note = 'the web search paused the answer too many times'
  }
  if (message.stop_reason === 'refusal') {
    result.stop = 'refusal'
    const why = message.stop_details?.explanation
    if (typeof why === 'string' && why !== '') result.note = why.slice(0, 300)
  }
  return result
}

export function anthropicAdapter(fetchLike: FetchLike): ProviderAdapter {
  const facts = new Map<string, ModelFacts>()

  const clientFor = (target: AdapterTarget): Anthropic =>
    new Anthropic({
      baseURL: target.baseUrl,
      // With no key of ours the SDK looks where it always does (ANTHROPIC_API_KEY,
      // an `ant auth login` profile), so a machine already set up needs nothing typed.
      // A key goes out as X-Api-Key, as it always has: SDK 1.x (API version 2026-10-21) would
      // send it as `Authorization: Bearer`, and a gateway in front of the address may read only
      // X-Api-Key (the migration guide's own recipe; the Claude API takes either).
      ...(target.key === null
        ? {}
        : { apiKey: target.key, defaultHeaders: { 'X-Api-Key': target.key, Authorization: null } }),
      fetch: (url, init) => fetchLike(String(url), { ...init, redirect: 'error' }),
    })

  const factsFor = async (client: Anthropic, target: AdapterTarget, model: string) => {
    const cacheKey = `${target.baseUrl}\n${model}`
    const known = facts.get(cacheKey)
    if (known !== undefined) return known
    try {
      const info = await client.models.retrieve(model, {}, { signal: target.signal, maxRetries: 0 })
      const found: ModelFacts = {
        maxTokens: Math.min(info.max_tokens ?? DEFAULT_MAX_TOKENS, DEFAULT_MAX_TOKENS),
        adaptiveThinking: info.capabilities?.thinking.types.adaptive.supported === true,
      }
      facts.set(cacheKey, found)
      return found
    } catch {
      // Not remembered: the endpoint may only be down for a moment.
      return UNKNOWN_MODEL
    }
  }

  const stream = async (request: StreamRequest, sink: StreamSink): Promise<StreamResult> => {
    const client = clientFor(request)
    try {
      const params = paramsFor(request, await factsFor(client, request, request.model))
      const fallbacks =
        FALLBACK_MODELS.has(request.model) && new URL(request.baseUrl).host === FIRST_PARTY_HOST
      const out = searchingSink(sink)
      const onEvent = (event: { type: string; content_block?: { type: string } }): void => {
        if (event.type === 'content_block_start' && event.content_block !== undefined)
          out.block(event.content_block.type)
      }
      type Turn = Anthropic.Message | Anthropic.Beta.BetaMessage
      const once = (messages: typeof params.messages): Promise<Turn> =>
        fallbacks
          ? // The beta surface only where its parameter is used: a proxy need not know it.
            client.beta.messages
              .stream(
                { ...params, messages, betas: [FALLBACK_BETA], fallbacks: 'default' },
                options(request),
              )
              .on('streamEvent', onEvent)
              .on('text', (piece) => out.text(piece))
              .on('thinking', (piece) => out.thinking(piece))
              .finalMessage()
          : client.messages
              .stream({ ...params, messages }, options(request))
              .on('streamEvent', onEvent)
              .on('text', (piece) => out.text(piece))
              .on('thinking', (piece) => out.thinking(piece))
              .finalMessage()
      // A search that ran the server's loop to its limit pauses the turn: sent back as it
      // stands, with no new question, it goes on where it stopped.
      const turns: Turn[] = []
      let messages = params.messages
      for (;;) {
        const turn = await once(messages)
        turns.push(turn)
        if (turn.stop_reason !== 'pause_turn' || turns.length > CONTINUATIONS) break
        const content = turn.content as Anthropic.ContentBlockParam[]
        messages = [...messages, { role: 'assistant', content }]
      }
      const last = turns.at(-1) as Turn
      const content = turns.flatMap((t): readonly unknown[] => t.content)
      const message = { ...last, content } as Turn
      const sources = sourcesOf(message)
      if (sources !== '') sink.text(sources)
      const result = resultOf(message, request.model)
      if (result.usage !== undefined)
        result.usage.output = turns.reduce((sum, t) => sum + t.usage.output_tokens, 0)
      return result
    } catch (error) {
      throw failure(error)
    }
  }

  const models = async (target: AdapterTarget): Promise<AiModel[]> => {
    const client = clientFor(target)
    const found: AiModel[] = []
    try {
      for await (const model of client.models.list({ limit: 100 }, { signal: target.signal })) {
        found.push({ id: model.id, label: model.display_name })
        facts.set(`${target.baseUrl}\n${model.id}`, {
          maxTokens: Math.min(model.max_tokens ?? DEFAULT_MAX_TOKENS, DEFAULT_MAX_TOKENS),
          adaptiveThinking: model.capabilities?.thinking.types.adaptive.supported === true,
        })
        if (found.length >= AI_LIMITS.models) break
      }
    } catch (error) {
      throw failure(error)
    }
    return found
  }

  return { stream, models }
}
