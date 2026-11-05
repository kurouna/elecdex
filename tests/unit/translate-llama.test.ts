import { describe, expect, it } from 'vitest'
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
