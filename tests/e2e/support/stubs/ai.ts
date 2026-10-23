import { createServer, type IncomingHttpHeaders, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * One local stand-in for an AI provider, in both dialects the app speaks: OpenAI-compatible
 * (`…/chat/completions`, what Ollama, LM Studio and llama.cpp serve) and Anthropic's
 * (`…/v1/messages`), plus model lists. No test asks a real model; a provider is the user's own
 * address, so serving one here is all it takes.
 */

/** A message as the app sends it. */
export interface AiMessage {
  role: string
  content: string
}

/** A request the stand-in received, in order. */
export interface AiRequest {
  path: string
  headers: IncomingHttpHeaders
  body: { model?: string; messages?: AiMessage[] } | null
}

/**
 * What a chat request is answered with: pieces of text streamed one after another (with a
 * reasoning piece first and a usage line last, when given), or one piece and then nothing - the
 * answer held open in {@link AiStub.held} for the test to finish or abandon.
 */
export type AiAnswer =
  | {
      pieces: string[]
      reasoning?: string
      usage?: { prompt_tokens: number; completion_tokens: number }
    }
  | { hold: string }

export interface AiStubOptions {
  /** The answer to an OpenAI-dialect chat request. */
  openai?: (request: AiRequest) => AiAnswer
  /** The text of an Anthropic-dialect answer. */
  anthropic?: (request: AiRequest) => string
  /** Model lists by path (`/v1/models`): the ids each answers. */
  models?: Record<string, string[]>
}

export interface AiStub {
  /** `http://127.0.0.1:<port>`; a provider's address is this plus `/v1` (or a prefix). */
  readonly origin: string
  /** Every request, in order; a test empties it (`seen.length = 0`) to start afresh. */
  readonly seen: AiRequest[]
  /** Answers held open, the latest last. */
  readonly held: ServerResponse[]
  close(): Promise<void>
}

/** One server-sent event of the OpenAI dialect: a delta, with extra fields beside it. */
export const openaiChunk = (delta: object, extra: object = {}): string =>
  `data: ${JSON.stringify({ choices: [{ delta, ...extra }] })}\n\n`

/** Text cut into pieces of `size` characters, as a model streams it. */
export const piecesOf = (text: string, size: number): string[] =>
  text.match(new RegExp(`[\\s\\S]{1,${size}}`, 'g')) ?? []

/** The messages of a request: the first system one and the first user one. */
export const firstOf = (request: AiRequest, role: string): string =>
  request.body?.messages?.find((m) => m.role === role)?.content ?? ''

/** Whether a request is a chat request of either dialect (not a model list). */
export const isChat = (request: AiRequest): boolean =>
  request.path.endsWith('/chat/completions') || request.path.endsWith('/v1/messages')

const anthropicEvent = (type: string, data: object): string =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`

function answerOpenai(answer: AiAnswer, res: ServerResponse, held: ServerResponse[]): void {
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  if ('hold' in answer) {
    res.write(openaiChunk({ content: answer.hold }))
    held.push(res)
    return
  }
  if (answer.reasoning !== undefined) {
    res.write(openaiChunk({ reasoning_content: answer.reasoning }))
  }
  for (const piece of answer.pieces) res.write(openaiChunk({ content: piece }))
  if (answer.usage !== undefined) {
    res.write(`data: ${JSON.stringify({ choices: [], usage: answer.usage })}\n\n`)
  }
  res.end('data: [DONE]\n\n')
}

function answerAnthropic(text: string, res: ServerResponse): void {
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  res.write(
    anthropicEvent('message_start', {
      message: {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-test',
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 5, output_tokens: 1 },
      },
    }),
  )
  res.write(
    anthropicEvent('content_block_start', {
      index: 0,
      content_block: { type: 'text', text: '' },
    }),
  )
  res.write(
    anthropicEvent('content_block_delta', { index: 0, delta: { type: 'text_delta', text } }),
  )
  res.write(anthropicEvent('content_block_stop', { index: 0 }))
  res.write(
    anthropicEvent('message_delta', {
      delta: { stop_reason: 'end_turn', stop_sequence: null },
      usage: { output_tokens: 3 },
    }),
  )
  res.end(anthropicEvent('message_stop', {}))
}

/** Answers one request by its path: a model list, a chat in either dialect, or a 404. */
function answer(
  entry: AiRequest,
  res: ServerResponse,
  options: AiStubOptions,
  held: ServerResponse[],
): void {
  const listed = options.models?.[entry.path]
  if (listed !== undefined) {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ data: listed.map((id) => ({ id })) }))
  } else if (entry.path.endsWith('/chat/completions') && options.openai !== undefined) {
    answerOpenai(options.openai(entry), res, held)
  } else if (entry.path.endsWith('/v1/messages') && options.anthropic !== undefined) {
    answerAnthropic(options.anthropic(entry), res)
  } else {
    res.writeHead(404, { 'content-type': 'application/json' }).end('{}')
  }
}

/** Starts the stand-in on a free port of 127.0.0.1. */
export async function aiStub(options: AiStubOptions = {}): Promise<AiStub> {
  const seen: AiRequest[] = []
  const held: ServerResponse[] = []
  const server: Server = createServer((req, res) => {
    let raw = ''
    req.on('data', (piece) => {
      raw += piece
    })
    req.on('end', () => {
      const entry: AiRequest = {
        path: req.url ?? '',
        headers: req.headers,
        body: raw === '' ? null : JSON.parse(raw),
      }
      seen.push(entry)
      answer(entry, res, options, held)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    seen,
    held,
    close: async () => {
      for (const res of held) res.destroy()
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

/** A provider of the OpenAI dialect at `origin` + `/v1`, as the AI settings list one. */
export const openaiProvider = <O extends object>(origin: string, overrides?: O) => ({
  id: 'local',
  name: 'Local',
  kind: 'openai',
  baseUrl: `${origin}/v1`,
  model: 'tiny',
  ...overrides,
})

/** A provider of Anthropic's dialect at `origin` + `/claude`. */
export const anthropicProvider = <O extends object>(origin: string, overrides?: O) => ({
  id: 'claude',
  name: 'Claude',
  kind: 'anthropic',
  baseUrl: `${origin}/claude`,
  model: 'claude-test',
  ...overrides,
})

/** Settings with these providers (and the rest of `ai` from `extra`), sound off. */
export const aiSettings = <P, E extends object>(providers: P[], extra?: E) => ({
  sound: { enabled: false },
  ai: { ...extra, providers },
})
