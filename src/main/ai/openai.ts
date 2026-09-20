import { AI_LIMITS, type AiModel, ThinkSplitter } from '@shared/ai'
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
 * The OpenAI chat completions dialect, as local servers and most hosted services
 * speak it: POST {base}/chat/completions with `stream`, answered as server-sent
 * events; GET {base}/models for the list.
 *
 * Spoken with plain fetch rather than a client library: the servers behind it
 * differ in the details (where reasoning arrives, whether usage is reported), and
 * what is read here is only what they have in common, read leniently.
 */

/** A server that has sent nothing for this long is given up on; a local model may take minutes to load. */
const IDLE_TIMEOUT_MS = 5 * 60_000
const MODELS_TIMEOUT_MS = 15_000
/** An error body is read this far, for its message. */
const ERROR_BODY_BYTES = 8192

const headersFor = (key: string | null): Record<string, string> => ({
  accept: 'application/json, text/event-stream',
  'content-type': 'application/json',
  ...(key === null ? {} : { authorization: `Bearer ${key}` }),
})

/** Server-sent events, decoded line by line: only `data:` lines matter to this dialect. */
export class SseLines {
  private buffer = ''

  push(chunk: string): string[] {
    this.buffer += chunk
    const lines = this.buffer.split(/\r?\n/)
    this.buffer = lines.pop() ?? ''
    return lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim())
  }
}

async function errorDetail(response: Response): Promise<string | null> {
  try {
    const text = (await response.text()).slice(0, ERROR_BODY_BYTES)
    try {
      const body = JSON.parse(text) as { error?: { message?: unknown } | string; message?: unknown }
      const said =
        typeof body.error === 'string' ? body.error : (body.error?.message ?? body.message)
      return typeof said === 'string' ? said : null
    } catch {
      return text.trim() === '' || text.trimStart().startsWith('<') ? null : text.trim()
    }
  } catch {
    return null
  }
}

interface Chunk {
  error?: { message?: unknown }
  choices?: Array<{
    delta?: { content?: unknown; reasoning_content?: unknown; reasoning?: unknown }
    finish_reason?: unknown
  }>
  usage?: { prompt_tokens?: unknown; completion_tokens?: unknown } | null
  model?: unknown
}

/** One answer being read: what the chunks said, passed on to the sink as they come. */
class Reading {
  private readonly splitter = new ThinkSplitter()
  private readonly sink: StreamSink
  result: StreamResult = {}

  constructor(sink: StreamSink) {
    this.sink = sink
  }

  take(data: string): void {
    if (data === '' || data === '[DONE]') return
    let chunk: Chunk
    try {
      chunk = JSON.parse(data) as Chunk
    } catch {
      return // A keep-alive comment or a half line from a lenient server.
    }
    if (chunk.error !== undefined) {
      const said = chunk.error.message
      throw new ProviderError(typeof said === 'string' ? said.slice(0, 300) : 'the provider failed')
    }
    const choice = chunk.choices?.[0]
    if (choice !== undefined) this.takeChoice(choice)
    this.takeUsage(chunk.usage)
  }

  end(): StreamResult {
    this.emit(this.splitter.flush())
    return this.result
  }

  private takeChoice(choice: NonNullable<Chunk['choices']>[number]): void {
    const delta = choice.delta
    // DeepSeek, llama.cpp and vLLM say `reasoning_content`; Ollama and OpenRouter `reasoning`.
    const reasoning = delta?.reasoning_content ?? delta?.reasoning
    if (typeof reasoning === 'string' && reasoning !== '') this.sink.thinking(reasoning)
    if (typeof delta?.content === 'string' && delta.content !== '') {
      this.emit(this.splitter.push(delta.content))
    }
    if (choice.finish_reason === 'length') this.result.stop = 'length'
    if (choice.finish_reason === 'content_filter') this.result.stop = 'refusal'
  }

  private takeUsage(usage: Chunk['usage']): void {
    if (typeof usage?.prompt_tokens !== 'number' || typeof usage.completion_tokens !== 'number') {
      return
    }
    this.result.usage = { input: usage.prompt_tokens, output: usage.completion_tokens }
  }

  private emit(piece: { text: string; thinking: string }): void {
    if (piece.thinking !== '') this.sink.thinking(piece.thinking)
    if (piece.text !== '') this.sink.text(piece.text)
  }
}

/** Aborts when `signal` does, or when `touch` has not been called for IDLE_TIMEOUT_MS. */
function idleGuard(signal: AbortSignal): { signal: AbortSignal; touch(): void; done(): void } {
  const controller = new AbortController()
  const abort = (): void => controller.abort(signal.reason)
  if (signal.aborted) abort()
  else signal.addEventListener('abort', abort, { once: true })
  let timer: NodeJS.Timeout | undefined
  const touch = (): void => {
    clearTimeout(timer)
    timer = setTimeout(
      () => controller.abort(new ProviderError('the provider stopped answering')),
      IDLE_TIMEOUT_MS,
    )
  }
  touch()
  return {
    signal: controller.signal,
    touch,
    done: () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
    },
  }
}

const bodyFor = (request: StreamRequest): string =>
  JSON.stringify({
    model: request.model,
    stream: true,
    // Asks for the token counts in a last chunk; a server that does not know it ignores it.
    stream_options: { include_usage: true },
    messages: [
      ...(request.system === '' ? [] : [{ role: 'system', content: request.system }]),
      ...request.messages.map((m) => ({ role: m.role, content: m.text })),
    ],
  })

async function readAnswer(
  response: Response,
  sink: StreamSink,
  touch: () => void,
): Promise<StreamResult> {
  if (!response.ok) throw statusFailure(response.status, await errorDetail(response))
  if (response.body === null) throw new ProviderError('the provider sent no answer')
  const reading = new Reading(sink)
  const lines = new SseLines()
  const decoder = new TextDecoder()
  for await (const bytes of response.body as unknown as AsyncIterable<Uint8Array>) {
    touch()
    for (const data of lines.push(decoder.decode(bytes, { stream: true }))) reading.take(data)
  }
  return reading.end()
}

export function openaiAdapter(fetchLike: FetchLike): ProviderAdapter {
  const stream = async (request: StreamRequest, sink: StreamSink): Promise<StreamResult> => {
    const guard = idleGuard(request.signal)
    try {
      const response = await fetchLike(`${request.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: headersFor(request.key),
        body: bodyFor(request),
        // A key must not follow a redirect to wherever it points.
        redirect: 'error',
        signal: guard.signal,
      })
      return await readAnswer(response, sink, guard.touch)
    } catch (error) {
      // The guard's own reason (the idle timeout) says more than "aborted".
      const idle = guard.signal.reason instanceof ProviderError && !request.signal.aborted
      throw idle ? guard.signal.reason : error
    } finally {
      guard.done()
    }
  }

  const models = async (target: AdapterTarget): Promise<AiModel[]> => {
    const response = await fetchLike(`${target.baseUrl}/models`, {
      method: 'GET',
      headers: headersFor(target.key),
      redirect: 'error',
      signal: AbortSignal.any([target.signal, AbortSignal.timeout(MODELS_TIMEOUT_MS)]),
    })
    if (!response.ok) throw statusFailure(response.status, await errorDetail(response))
    const body = (await response.json()) as { data?: unknown }
    const list = Array.isArray(body.data) ? body.data : []
    return list
      .map((entry) => (entry as { id?: unknown }).id)
      .filter((id): id is string => typeof id === 'string' && id !== '' && id.length <= 120)
      .slice(0, AI_LIMITS.models)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id }))
  }

  return { stream, models }
}
