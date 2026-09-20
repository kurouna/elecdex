import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describeFailure,
  type FetchLike,
  isUnreachable,
  ProviderError,
} from '../../src/main/ai/adapter.js'
import { anthropicAdapter } from '../../src/main/ai/anthropic.js'
import { openaiAdapter, SseLines } from '../../src/main/ai/openai.js'

/**
 * Both dialects against a server on this machine: what is sent (the path, the
 * key's header, the body), and what is made of the ways a server may answer.
 */

interface Seen {
  method: string
  path: string
  headers: IncomingMessage['headers']
  body: unknown
}

type Reply = (req: Seen, res: ServerResponse) => void

let server: Server
let origin: string
let other: Server
let otherOrigin: string
const seen: Seen[] = []
const seenByOther: string[] = []
let reply: Reply

const nodeFetch: FetchLike = (url, init) => fetch(url, init)

const listen = (s: Server): Promise<string> =>
  new Promise((resolve) =>
    s.listen(0, '127.0.0.1', () =>
      resolve(`http://127.0.0.1:${(s.address() as AddressInfo).port}`),
    ),
  )

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      const entry: Seen = {
        method: req.method ?? '',
        path: req.url ?? '',
        headers: req.headers,
        body: raw === '' ? null : JSON.parse(raw),
      }
      seen.push(entry)
      reply(entry, res)
    })
  })
  other = createServer((req, res) => {
    seenByOther.push(`${req.headers.authorization ?? ''}${req.headers['x-api-key'] ?? ''}`)
    res.writeHead(200).end('{}')
  })
  origin = await listen(server)
  otherOrigin = await listen(other)
})

afterAll(async () => {
  await Promise.all([server, other].map((s) => new Promise((resolve) => s.close(resolve))))
})

beforeEach(() => {
  seen.length = 0
  seenByOther.length = 0
})

const sse = (res: ServerResponse, events: string[]): void => {
  res.writeHead(200, { 'content-type': 'text/event-stream' })
  for (const event of events) res.write(event)
  res.end()
}

const collect = () => {
  const got = { text: '', thinking: '' }
  return {
    got,
    sink: {
      text: (piece: string) => {
        got.text += piece
      },
      thinking: (piece: string) => {
        got.thinking += piece
      },
    },
  }
}

const signal = () => new AbortController().signal

/** An address on this machine where nothing listens: a port that was just given back. */
async function closedOrigin(): Promise<string> {
  const gone = createServer()
  const at = await listen(gone)
  await new Promise((resolve) => gone.close(resolve))
  return at
}

describe('server-sent events', () => {
  it('lines are whole however the bytes were cut', () => {
    const lines = new SseLines()
    expect(lines.push('data: {"a"')).toEqual([])
    expect(lines.push(':1}\r\n\r\ndata: [DO')).toEqual(['{"a":1}'])
    expect(lines.push('NE]\n\n: comment\nevent: x\n')).toEqual(['[DONE]'])
  })
})

describe('the OpenAI dialect', () => {
  const chunk = (delta: object, extra: object = {}) =>
    `data: ${JSON.stringify({ choices: [{ delta, ...extra }] })}\n\n`
  const ask = (key: string | null = 'sk-test') => ({
    baseUrl: `${origin}/v1`,
    key,
    model: 'llama3',
    system: 'be brief',
    messages: [{ role: 'user' as const, text: 'hi' }],
    signal: signal(),
  })

  it('asks /chat/completions with the key as a bearer token and reads the stream', async () => {
    reply = (_req, res) =>
      sse(res, [
        chunk({ role: 'assistant', content: '' }),
        chunk({ reasoning_content: 'hmm' }),
        chunk({ content: 'Hel' }),
        chunk({ content: 'lo' }, { finish_reason: 'stop' }),
        `data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 9, completion_tokens: 2 } })}\n\n`,
        'data: [DONE]\n\n',
      ])
    const { got, sink } = collect()
    const result = await openaiAdapter(nodeFetch).stream(ask(), sink)

    expect(seen[0]).toMatchObject({ method: 'POST', path: '/v1/chat/completions' })
    expect(seen[0]?.headers.authorization).toBe('Bearer sk-test')
    expect(seen[0]?.body).toMatchObject({
      model: 'llama3',
      stream: true,
      messages: [
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'hi' },
      ],
    })
    expect(got).toEqual({ text: 'Hello', thinking: 'hmm' })
    expect(result).toEqual({ usage: { input: 9, output: 2 } })
  })

  it('a local server is asked with no key at all', async () => {
    reply = (_req, res) => sse(res, [chunk({ content: 'ok' }), 'data: [DONE]\n\n'])
    await openaiAdapter(nodeFetch).stream(ask(null), collect().sink)
    expect(seen[0]?.headers.authorization).toBeUndefined()
  })

  it("reads Ollama's `reasoning`, and reasoning written inline as <think>", async () => {
    reply = (_req, res) =>
      sse(res, [
        chunk({ reasoning: 'one. ' }),
        chunk({ content: '<thi' }),
        chunk({ content: 'nk>two.</think>Answer' }),
        'data: [DONE]\n\n',
      ])
    const { got, sink } = collect()
    await openaiAdapter(nodeFetch).stream(ask(), sink)
    expect(got).toEqual({ text: 'Answer', thinking: 'one. two.' })
  })

  it('says when the answer was cut off', async () => {
    reply = (_req, res) => sse(res, [chunk({ content: 'x' }, { finish_reason: 'length' })])
    expect(await openaiAdapter(nodeFetch).stream(ask(), collect().sink)).toEqual({ stop: 'length' })
  })

  it("an error status is worded with the server's own message, and never the key", async () => {
    reply = (_req, res) => {
      res.writeHead(401, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: 'Incorrect API key provided' } }))
    }
    const failure = await openaiAdapter(nodeFetch)
      .stream(ask(), collect().sink)
      .catch((error: unknown) => error)
    const words = describeFailure(failure, origin)
    expect(words).toBe('the key was refused (401): Incorrect API key provided')
    expect(words).not.toContain('sk-test')
  })

  it('an error sent inside the stream fails the answer', async () => {
    reply = (_req, res) =>
      sse(res, [chunk({ content: 'par' }), 'data: {"error":{"message":"model crashed"}}\n\n'])
    const { got, sink } = collect()
    const failure = await openaiAdapter(nodeFetch)
      .stream(ask(), sink)
      .catch((error: unknown) => error)
    expect(describeFailure(failure, origin)).toBe('model crashed')
    expect(got.text).toBe('par')
  })

  it('a redirect is not followed, so the key goes nowhere it was not sent', async () => {
    reply = (_req, res) => {
      res.writeHead(307, { location: `${otherOrigin}/v1/chat/completions` }).end()
    }
    const failure = await openaiAdapter(nodeFetch)
      .stream(ask(), collect().sink)
      .catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(Error)
    expect(seenByOther).toEqual([])
  })

  it('a server that is not there is said plainly', async () => {
    const nowhere = await closedOrigin()
    const failure = await openaiAdapter(nodeFetch)
      .stream({ ...ask(), baseUrl: `${nowhere}/v1` }, collect().sink)
      .catch((error: unknown) => error)
    expect(describeFailure(failure, `${nowhere}/v1`)).toBe(
      `could not reach ${new URL(nowhere).host} - is it running?`,
    )
    expect(isUnreachable(failure)).toBe(true)
  })

  it('a name that does not resolve is not found, not "not running"', () => {
    // As Node's fetch reports it: the reason is in the cause. No lookup is made here.
    const failure = Object.assign(new TypeError('fetch failed'), {
      cause: new Error('getaddrinfo ENOTFOUND llm.example.test'),
    })
    expect(describeFailure(failure, 'http://llm.example.test/v1')).toBe(
      'could not find llm.example.test',
    )
    expect(isUnreachable(failure)).toBe(true)
  })

  it('only the link itself is "unreachable": a refused key or a redirect is not', async () => {
    expect(isUnreachable(new ProviderError('the key was refused (401)'))).toBe(false)
    reply = (_req, res) => {
      res.writeHead(307, { location: `${otherOrigin}/v1/chat/completions` }).end()
    }
    const redirected = await openaiAdapter(nodeFetch)
      .stream(ask(), collect().sink)
      .catch((error: unknown) => error)
    expect(isUnreachable(redirected)).toBe(false)
  })

  it('stopping ends the read', async () => {
    reply = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      res.write(chunk({ content: 'first' }))
      // And then nothing: the answer hangs until the pane stops it.
    }
    const abort = new AbortController()
    const { got, sink } = collect()
    const running = openaiAdapter(nodeFetch).stream(
      { ...ask(), signal: abort.signal },
      {
        ...sink,
        text: (piece) => {
          sink.text(piece)
          abort.abort()
        },
      },
    )
    await expect(running).rejects.toBeDefined()
    expect(got.text).toBe('first')
  })

  it('lists models from /models, sorted', async () => {
    reply = (_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ data: [{ id: 'qwen3:8b' }, { id: 'llama3' }, { id: 7 }, {}] }))
    }
    const models = await openaiAdapter(nodeFetch).models({
      baseUrl: `${origin}/v1`,
      key: null,
      signal: signal(),
    })
    expect(seen[0]).toMatchObject({ method: 'GET', path: '/v1/models' })
    expect(models).toEqual([{ id: 'llama3' }, { id: 'qwen3:8b' }])
  })

  describe('a hosted service that is busy for a moment', () => {
    // The test servers are on this machine, where nothing is asked twice: say they are not.
    const hosted = { waits: () => [1, 1] }
    const busyThen = (failures: number, status = 503, headers: Record<string, string> = {}) => {
      let asked = 0
      reply = (req, res) => {
        asked += 1
        if (asked <= failures) {
          res.writeHead(status, { 'content-type': 'application/json', ...headers })
          res.end(JSON.stringify({ error: { message: 'The model is overloaded.' } }))
        } else if (req.path === '/v1/models') {
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ data: [{ id: 'gemini-test' }] }))
        } else sse(res, [chunk({ content: 'there' }), 'data: [DONE]\n\n'])
      }
    }
    const target = () => ({ baseUrl: `${origin}/v1`, key: 'sk-test', signal: signal() })

    it('is asked again, for the model list and for an answer, and the user sees only the answer', async () => {
      busyThen(2)
      expect(await openaiAdapter(nodeFetch, hosted).models(target())).toEqual([
        { id: 'gemini-test' },
      ])
      expect(seen).toHaveLength(3)

      seen.length = 0
      busyThen(1, 429)
      const { got, sink } = collect()
      await openaiAdapter(nodeFetch, hosted).stream(ask(), sink)
      expect(got.text).toBe('there')
      expect(seen).toHaveLength(2)
      // The same request, key and all.
      expect(seen[1]?.headers.authorization).toBe('Bearer sk-test')
      expect(seen[1]?.body).toEqual(seen[0]?.body)
    })

    it('but not for ever: the last failure is the one told', async () => {
      busyThen(9)
      const failure = await openaiAdapter(nodeFetch, hosted)
        .models(target())
        .catch((error: unknown) => error)
      expect(describeFailure(failure, origin)).toBe(
        'the provider is overloaded (503): The model is overloaded.',
      )
      expect(seen).toHaveLength(3)
    })

    it('a failure that asking again cannot mend is told at once', async () => {
      for (const status of [400, 401, 403, 404]) {
        seen.length = 0
        busyThen(9, status)
        await openaiAdapter(nodeFetch, hosted)
          .models(target())
          .catch(() => {})
        expect(seen, String(status)).toHaveLength(1)
      }
    })

    it('a service that says to come back much later is believed, not waited for', async () => {
      busyThen(9, 429, { 'retry-after': '3600' })
      const failure = await openaiAdapter(nodeFetch, hosted)
        .models(target())
        .catch((error: unknown) => error)
      expect(describeFailure(failure, origin)).toContain('rate limited')
      expect(seen).toHaveLength(1)
    })

    it('a connection dropped before any answer is asked again; nobody at the address is not', async () => {
      let asked = 0
      reply = (_req, res) => {
        asked += 1
        if (asked === 1) res.destroy()
        else {
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ data: [{ id: 'gemini-test' }] }))
        }
      }
      expect(await openaiAdapter(nodeFetch, hosted).models(target())).toHaveLength(1)
      expect(asked).toBe(2)

      let attempts = 0
      const refused: FetchLike = async () => {
        attempts += 1
        throw Object.assign(new TypeError('fetch failed'), {
          cause: new Error('connect ECONNREFUSED 127.0.0.1:9'),
        })
      }
      await openaiAdapter(refused, hosted)
        .models(target())
        .catch(() => {})
      expect(attempts).toBe(1)
    })

    it('stopping ends the wait between attempts', async () => {
      busyThen(9)
      const stop = new AbortController()
      const waiting = openaiAdapter(nodeFetch, { waits: () => [60_000] })
        .models({ ...target(), signal: stop.signal })
        .catch((error: unknown) => error)
      await vi.waitFor(() => expect(seen).toHaveLength(1))
      stop.abort()
      expect(await waiting).toBeDefined()
      expect(seen).toHaveLength(1)
    })

    it('a server on this computer or network is never asked twice', async () => {
      busyThen(9)
      await openaiAdapter(nodeFetch)
        .models(target())
        .catch(() => {})
      expect(seen).toHaveLength(1)
    })
  })

  it("reads an error Google's compatibility layer wraps in a list", async () => {
    reply = (_req, res) => {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify([{ error: { code: 400, message: 'API key not valid.' } }]))
    }
    const failure = await openaiAdapter(nodeFetch)
      .models({ baseUrl: `${origin}/v1`, key: 'sk-test', signal: signal() })
      .catch((error: unknown) => error)
    expect(describeFailure(failure, origin)).toBe(
      'the request was not accepted (400): API key not valid.',
    )
  })
})

describe('the Anthropic dialect', () => {
  const event = (type: string, data: object) =>
    `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`

  const answer = (model: string, stop = 'end_turn'): string[] => [
    event('message_start', {
      message: {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model,
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 1, cache_read_input_tokens: 30 },
      },
    }),
    event('content_block_start', {
      index: 0,
      content_block: { type: 'thinking', thinking: '', signature: '' },
    }),
    event('content_block_delta', { index: 0, delta: { type: 'thinking_delta', thinking: 'plan' } }),
    event('content_block_stop', { index: 0 }),
    event('content_block_start', { index: 1, content_block: { type: 'text', text: '' } }),
    event('content_block_delta', { index: 1, delta: { type: 'text_delta', text: 'Bon' } }),
    event('content_block_delta', { index: 1, delta: { type: 'text_delta', text: 'jour' } }),
    event('content_block_stop', { index: 1 }),
    event('message_delta', {
      delta: { stop_reason: stop, stop_sequence: null },
      usage: { output_tokens: 7 },
    }),
    event('message_stop', {}),
  ]

  const modelInfo = (adaptive: boolean) => ({
    id: 'claude-test',
    type: 'model',
    display_name: 'Claude Test',
    created_at: '2026-01-01T00:00:00Z',
    max_input_tokens: 200_000,
    max_tokens: 32_000,
    capabilities: {
      thinking: {
        supported: adaptive,
        types: { adaptive: { supported: adaptive }, enabled: { supported: false } },
      },
    },
  })

  const ask = (model = 'claude-test') => ({
    baseUrl: origin,
    key: 'sk-ant-test',
    model,
    system: 'be brief',
    messages: [
      { role: 'user' as const, text: 'hi' },
      { role: 'assistant' as const, text: 'hello' },
      { role: 'user' as const, text: 'in French?' },
    ],
    signal: signal(),
  })

  const serve = (adaptive: boolean | null, stop = 'end_turn'): void => {
    reply = (req, res) => {
      if (req.path.startsWith('/v1/models/')) {
        if (adaptive === null) {
          res.writeHead(404, { 'content-type': 'application/json' })
          res.end(
            JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'x' } }),
          )
          return
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(modelInfo(adaptive)))
        return
      }
      sse(res, answer('claude-test', stop))
    }
  }

  it('sends the key as x-api-key, the history as text, and reads text and reasoning', async () => {
    serve(true)
    const { got, sink } = collect()
    const result = await anthropicAdapter(nodeFetch).stream(ask(), sink)

    const post = seen.find((entry) => entry.method === 'POST')
    expect(post?.path).toBe('/v1/messages')
    expect(post?.headers['x-api-key']).toBe('sk-ant-test')
    expect(post?.body).toMatchObject({
      model: 'claude-test',
      stream: true,
      system: 'be brief',
      // What the Models API said the model can do: its own ceiling, and adaptive thinking shown.
      max_tokens: 32_000,
      thinking: { type: 'adaptive', display: 'summarized' },
      cache_control: { type: 'ephemeral' },
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'in French?' },
      ],
    })
    expect(post?.body).not.toHaveProperty('fallbacks')
    expect(got).toEqual({ text: 'Bonjour', thinking: 'plan' })
    expect(result).toEqual({ usage: { input: 40, output: 7 } })
  })

  it('asks a model that has no adaptive thinking without it', async () => {
    serve(false)
    await anthropicAdapter(nodeFetch).stream(ask(), collect().sink)
    expect(seen.find((entry) => entry.method === 'POST')?.body).not.toHaveProperty('thinking')
  })

  it('works through a proxy that does not serve the Models API', async () => {
    serve(null)
    const { got, sink } = collect()
    await anthropicAdapter(nodeFetch).stream(ask(), sink)
    const body = seen.find((entry) => entry.method === 'POST')?.body
    expect(body).not.toHaveProperty('thinking')
    expect(body).toMatchObject({ max_tokens: 64_000 })
    expect(got.text).toBe('Bonjour')
  })

  it('asks what a model can do once, not before every answer', async () => {
    serve(true)
    const adapter = anthropicAdapter(nodeFetch)
    await adapter.stream(ask(), collect().sink)
    await adapter.stream(ask(), collect().sink)
    expect(seen.filter((entry) => entry.path.startsWith('/v1/models/'))).toHaveLength(1)
  })

  it('a refusal is a stop with a reason, read before the content', async () => {
    serve(true, 'refusal')
    const result = await anthropicAdapter(nodeFetch).stream(ask(), collect().sink)
    expect(result.stop).toBe('refusal')
  })

  it('names the model that answered when it is not the one asked for', async () => {
    serve(true)
    const result = await anthropicAdapter(nodeFetch).stream(ask('claude-other'), collect().sink)
    expect(result.model).toBe('claude-test')
  })

  it("an error status is worded with the API's own message", async () => {
    reply = (_req, res) => {
      res.writeHead(401, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          type: 'error',
          error: { type: 'authentication_error', message: 'invalid x-api-key' },
        }),
      )
    }
    const failure = await anthropicAdapter(nodeFetch)
      .stream(ask(), collect().sink)
      .catch((error: unknown) => error)
    expect(describeFailure(failure, origin)).toBe('the key was refused (401): invalid x-api-key')
    expect(isUnreachable(failure)).toBe(false)
  })

  it('nobody at the address is the link, whatever the SDK calls it', async () => {
    const failure = await anthropicAdapter(nodeFetch)
      .stream({ ...ask(), baseUrl: await closedOrigin() }, collect().sink)
      .catch((error: unknown) => error)
    expect(isUnreachable(failure)).toBe(true)
  }, 20_000)

  it('lists models with their display names', async () => {
    reply = (_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          data: [modelInfo(true)],
          has_more: false,
          first_id: 'claude-test',
          last_id: 'claude-test',
        }),
      )
    }
    const models = await anthropicAdapter(nodeFetch).models({
      baseUrl: origin,
      key: 'sk-ant-test',
      signal: signal(),
    })
    expect(models).toEqual([{ id: 'claude-test', label: 'Claude Test' }])
  })
})
