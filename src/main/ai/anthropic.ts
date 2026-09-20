import Anthropic from '@anthropic-ai/sdk'
import { AI_LIMITS, type AiModel } from '@shared/ai'
import {
  type AdapterTarget,
  type FetchLike,
  type ProviderAdapter,
  ProviderError,
  type StreamRequest,
  type StreamResult,
  type StreamSink,
  statusFailure,
} from './adapter.js'

/**
 * Anthropic's Messages API, through the official SDK.
 *
 * What a model can do is asked of the Models API rather than guessed from its
 * name: whether it takes adaptive thinking, and how long an answer it may write.
 * A proxy that does not serve that endpoint still works - the request then
 * carries neither, which every model accepts.
 *
 * Only text is sent back as history. Thinking blocks are shown and kept, never
 * replayed: with no tools in play the API does not need them, and leaving them
 * out is what lets an earlier question be edited without invalidating anything.
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
    return new ProviderError('could not reach the provider - check the address and the network')
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

const paramsFor = (request: StreamRequest, model: ModelFacts) => ({
  model: request.model,
  max_tokens: model.maxTokens,
  // The conversation so far is the same prefix on every turn: cache it.
  cache_control: { type: 'ephemeral' as const },
  ...(request.system === '' ? {} : { system: request.system }),
  // Summarized, or the reasoning arrives as empty blocks and the pane shows a long silence.
  ...(model.adaptiveThinking
    ? { thinking: { type: 'adaptive' as const, display: 'summarized' as const } }
    : {}),
  messages: request.messages.map((m) => ({ role: m.role, content: m.text })),
})

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
  if (message.stop_reason === 'max_tokens') result.stop = 'length'
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
      ...(target.key === null ? {} : { apiKey: target.key }),
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
      const message = await (fallbacks
        ? // The beta surface only where its parameter is used: a proxy need not know it.
          client.beta.messages
            .stream({ ...params, betas: [FALLBACK_BETA], fallbacks: 'default' }, options(request))
            .on('text', (piece) => sink.text(piece))
            .on('thinking', (piece) => sink.thinking(piece))
            .finalMessage()
        : client.messages
            .stream(params, options(request))
            .on('text', (piece) => sink.text(piece))
            .on('thinking', (piece) => sink.thinking(piece))
            .finalMessage())
      return resultOf(message, request.model)
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
