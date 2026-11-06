import { describe, expect, it, vi } from 'vitest'
import {
  type FetchLike,
  NoStopError,
  ServerAnswerError,
  StalledError,
  streamCompletion,
  tokenize,
} from '../../src/main/translate/llama'

/** What main asks llama-server (docs/translate.md §6.2): the stream read as llama-server writes it. */

const ENDPOINT = { origin: 'http://127.0.0.1:1', key: 'k' }

/** A fetch answering with a stream of the given chunks, then closing (or never, with `hold`). */
function streaming(chunks: string[], hold = false): { fetch: FetchLike; asked: RequestInit[] } {
  const asked: RequestInit[] = []
  const fetch: FetchLike = async (_url, init) => {
    asked.push(init)
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
        if (!hold) controller.close()
      },
    })
    return new Response(body, { status: 200 })
  }
  return { fetch, asked }
}

const data = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`

describe('streamCompletion', () => {
  it('hands on the text as it comes, and how it ended', async () => {
    const { fetch, asked } = streaming([
      data({ content: 'こん', stop: false }),
      // A line cut between two chunks.
      'data: {"content":"にち',
      'は","stop":false}\n\n',
      data({
        content: '',
        stop: true,
        stop_type: 'limit',
        tokens_predicted: 9,
        timings: { predicted_ms: 40 },
      }),
    ])
    const pieces: string[] = []
    const end = await streamCompletion(
      fetch,
      ENDPOINT,
      { prompt: 'x' },
      new AbortController().signal,
      (t) => pieces.push(t),
    )
    expect(pieces.join('')).toBe('こんにちは')
    expect(end).toEqual({ stopType: 'limit', tokens: 9, ms: 40 })
    // The key goes in the header, and redirects are refused.
    expect(asked[0]?.headers).toMatchObject({ Authorization: 'Bearer k' })
    expect(asked[0]?.redirect).toBe('error')
  })

  it('refuses a stream that ends without its end mark', async () => {
    const { fetch } = streaming([data({ content: 'half', stop: false })])
    await expect(
      streamCompletion(fetch, ENDPOINT, {}, new AbortController().signal, () => {}),
    ).rejects.toThrow(NoStopError)
  })

  it('gives up a stream that sends nothing for the stall time', async () => {
    const { fetch } = streaming([data({ content: 'a', stop: false })], true)
    await expect(
      streamCompletion(fetch, ENDPOINT, {}, new AbortController().signal, () => {}, 30),
    ).rejects.toThrow(StalledError)
  })

  it('says an HTTP error as the server’s answer, not a crash', async () => {
    const fetch: FetchLike = async () => new Response('bad prompt', { status: 400 })
    await expect(
      streamCompletion(fetch, ENDPOINT, {}, new AbortController().signal, () => {}),
    ).rejects.toThrow(ServerAnswerError)
  })
})

describe('tokenize', () => {
  it('counts the tokens llama-server answers', async () => {
    const fetch: FetchLike = async () => Response.json({ tokens: [1, 2, 3] })
    expect(await tokenize(fetch, ENDPOINT, 'abc', new AbortController().signal)).toBe(3)
  })
})

describe('a server that answers nothing', () => {
  /** A fetch that never answers, until its signal is aborted. */
  const silent: FetchLike = (_url, init) =>
    new Promise((_, reject) => {
      init.signal?.addEventListener('abort', () =>
        reject(init.signal?.reason ?? new Error('aborted')),
      )
    })

  it('gives /completion up as stalled when no answer begins in the stall time', async () => {
    const asking = streamCompletion(
      silent,
      ENDPOINT,
      { prompt: 'p' },
      new AbortController().signal,
      () => {},
      30,
    )
    await expect(asking).rejects.toBeInstanceOf(StalledError)
  })

  it('gives /tokenize up as stalled', async () => {
    vi.useFakeTimers()
    try {
      const asking = tokenize(silent, ENDPOINT, 'text', new AbortController().signal)
      const caught = asking.catch((error: unknown) => error)
      await vi.advanceTimersByTimeAsync(15_000)
      expect(await caught).toBeInstanceOf(StalledError)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops timing once the answer begins: a stream longer than the stall time, with short gaps, is read whole', async () => {
    const encoder = new TextEncoder()
    const fetch: FetchLike = async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          async start(controller) {
            for (const piece of ['あ', 'い', 'う', 'え']) {
              await new Promise((resolve) => setTimeout(resolve, 20))
              controller.enqueue(encoder.encode(data({ content: piece, stop: false })))
            }
            controller.enqueue(encoder.encode(data({ content: '', stop: true, stop_type: 'eos' })))
            controller.close()
          },
        }),
        { status: 200 },
      )
    let text = ''
    // 50 ms for the gaps (20 ms each), 80 ms the whole.
    await streamCompletion(
      fetch,
      ENDPOINT,
      { prompt: 'p' },
      new AbortController().signal,
      (t) => {
        text += t
      },
      50,
    )
    expect(text).toBe('あいうえ')
  })

  it('asks for the progress of reading the prompt, which keeps a long prompt from timing out', async () => {
    const { fetch, asked } = streaming([data({ content: 'x', stop: true, stop_type: 'eos' })])
    await streamCompletion(fetch, ENDPOINT, { prompt: 'p' }, new AbortController().signal, () => {})
    expect(JSON.parse(String(asked[0]?.body)).return_progress).toBe(true)
  })

  it('reads a progress chunk as a sign of life, with no text of its own', async () => {
    const { fetch } = streaming([
      data({ prompt_progress: { total: 100, cache: 0, processed: 50, time_ms: 10 } }),
      data({ content: 'x', stop: false }),
      data({ content: '', stop: true, stop_type: 'eos' }),
    ])
    let text = ''
    await streamCompletion(fetch, ENDPOINT, { prompt: 'p' }, new AbortController().signal, (t) => {
      text += t
    })
    expect(text).toBe('x')
  })
})
