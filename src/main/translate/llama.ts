/**
 * What main asks llama-server (docs/translate.md §6.2): `/tokenize` to count, and `/completion`
 * streamed as server-sent events. Not the OpenAI-compatible `/v1`: its answers leave out `timings`
 * and `stop_type`.
 */

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

function headers(key: string | null): Record<string, string> {
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
  const response = await fetchFn(`${endpoint.origin}/tokenize`, {
    method: 'POST',
    headers: headers(endpoint.key),
    body: JSON.stringify({ content }),
    redirect: 'error',
    signal,
  })
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
): Promise<Completion> {
  const response = await fetchFn(`${endpoint.origin}/completion`, {
    method: 'POST',
    headers: headers(endpoint.key),
    body: JSON.stringify({ ...body, stream: true }),
    redirect: 'error',
    signal,
  })
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
    const { done, value } = await reader.read()
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
