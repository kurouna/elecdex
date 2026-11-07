/**
 * What main asks llama-server (docs/translate.md §6.2): `/tokenize` to count, and `/completion`
 * streamed as server-sent events. Not the OpenAI-compatible `/v1`: its answers leave out `timings`
 * and `stop_type`.
 */

/** Where llama-server answers, and its key: null for an external server, which elecdex holds none for. */
export interface Endpoint {
  origin: string
  key: string | null
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

/** How a completion ended: `limit` when it ran out of room; tokens written and the time taken. */
export interface Completion {
  stopType: 'eos' | 'word' | 'limit'
  tokens: number
  ms: number
}

/** The stream ended without its end mark: what came is not taken as a whole translation. */
export class NoStopError extends Error {}

/** The server answered, but not with a translation (an HTTP error): not a crash of the engine. */
export class ServerAnswerError extends Error {}

/**
 * An external server asked again before text goes to it, and not usable now: it did not answer,
 * runs a model that is not PLaMo, or asks for a key. The message says which, in full, and the
 * engine already shows the server unreachable.
 */
export class ServerUnusableError extends Error {}

/** Nothing came for the stall time while a block was written: taken as an engine that stopped. */
export class StalledError extends Error {}

/** How long a stream may go without a byte before it is given up (§4.2's minute). */
export const STREAM_STALL_MS = 60_000

/** How long /tokenize may take: the HTTP thread answers it at once, unless the server is wedged. */
export const TOKENIZE_MS = 15_000

/**
 * A request that sends nothing back for `ms`, as a StalledError: a server alive but wedged (a GPU
 * job that never ends, 2026-11-06) keeps accepting requests and answers none.
 */
async function within<T>(
  ms: number,
  signal: AbortSignal,
  ask: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  // Its own controller, stopped once the answer has begun: the body that follows (a stream that
  // may run for minutes) is timed by its gaps, never cut by this.
  const late = new AbortController()
  const timer = setTimeout(() => late.abort(), ms)
  try {
    return await ask(AbortSignal.any([signal, late.signal]))
  } catch (error) {
    if (late.signal.aborted && !signal.aborted) {
      throw new StalledError(`Nothing came for ${Math.round(ms / 1000)} s.`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

/** The headers of a request to llama-server: its key, when elecdex started it with one. */
export function authHeaders(key: string | null): Record<string, string> {
  return key
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
    : { 'Content-Type': 'application/json' }
}

export async function tokenize(
  fetchFn: FetchLike,
  endpoint: Endpoint,
  content: string,
  signal: AbortSignal,
): Promise<number> {
  const response = await within(TOKENIZE_MS, signal, (s) =>
    fetchFn(`${endpoint.origin}/tokenize`, {
      method: 'POST',
      headers: authHeaders(endpoint.key),
      body: JSON.stringify({ content }),
      redirect: 'error',
      signal: s,
    }),
  )
  if (!response.ok) throw new ServerAnswerError(`/tokenize answered HTTP ${response.status}`)
  const body = (await response.json()) as { tokens?: unknown[] }
  return Array.isArray(body.tokens) ? body.tokens.length : 0
}

interface StreamChunk {
  content?: string
  stop?: boolean
  stop_type?: string
  tokens_predicted?: number
  timings?: { predicted_ms?: number }
}

/** Streams a completion, handing each piece of text on as it comes. */
export async function streamCompletion(
  fetchFn: FetchLike,
  endpoint: Endpoint,
  body: Record<string, unknown>,
  signal: AbortSignal,
  onText: (text: string) => void,
  stallMs = STREAM_STALL_MS,
): Promise<Completion> {
  // The answer's start is timed as its gaps are: the progress of reading the prompt is streamed
  // (return_progress), so a long prompt keeps the timer fed and a wedged server does not.
  const response = await within(stallMs, signal, (s) =>
    fetchFn(`${endpoint.origin}/completion`, {
      method: 'POST',
      headers: authHeaders(endpoint.key),
      body: JSON.stringify({ ...body, stream: true, return_progress: true }),
      redirect: 'error',
      signal: s,
    }),
  )
  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '')
    throw new ServerAnswerError(
      `/completion answered HTTP ${response.status} ${detail.slice(0, 200)}`.trim(),
    )
  }
  const decoder = new TextDecoder()
  const reader = response.body.getReader()
  let buffer = ''
  for (;;) {
    const { done, value } = await readWithin(reader, stallMs)
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const end = readLine(line, onText)
      if (end) {
        await reader.cancel().catch(() => {})
        return end
      }
    }
  }
  const end = readLine(buffer, onText)
  if (end) return end
  throw new NoStopError('The engine ended its answer without the end mark.')
}

/**
 * The next chunk, or a StalledError when none comes in time: a server that keeps the socket open
 * and writes nothing would otherwise hold the block, and the queue behind it, for ever.
 */
async function readWithin(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  ms: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const stalled = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new StalledError(`Nothing came for ${Math.round(ms / 1000)} s.`)),
      ms,
    )
  })
  try {
    return await Promise.race([reader.read(), stalled])
  } catch (error) {
    if (error instanceof StalledError) await reader.cancel().catch(() => {})
    throw error
  } finally {
    clearTimeout(timer)
  }
}

/** One `data:` line: its text handed on, and how it ended when it is the last. */
function readLine(line: string, onText: (text: string) => void): Completion | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return null
  let chunk: StreamChunk
  try {
    chunk = JSON.parse(trimmed.slice(5)) as StreamChunk
  } catch {
    return null
  }
  if (chunk.content) onText(chunk.content)
  if (!chunk.stop) return null
  const stopType =
    chunk.stop_type === 'limit' ? 'limit' : chunk.stop_type === 'word' ? 'word' : 'eos'
  return { stopType, tokens: chunk.tokens_predicted ?? 0, ms: chunk.timings?.predicted_ms ?? 0 }
}
