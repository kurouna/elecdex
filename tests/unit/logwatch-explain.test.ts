import type { AiProvider } from '@shared/ai'
import { EXPLAIN_SYSTEM } from '@shared/logwatch/explain'
import type { LogExplainEvent, LogExplainRequest, LogLine } from '@shared/logwatch/types'
import { describe, expect, it } from 'vitest'
import type { ProviderAdapter, StreamRequest } from '../../src/main/ai/adapter.js'
import { EXPLAIN_TIMEOUT_MS, LogExplainer } from '../../src/main/logwatch/explain.js'

const line = (seq: number, raw: string): LogLine => ({
  kind: 'line',
  seq,
  at: 0,
  timed: false,
  zoned: false,
  level: 'ERR',
  source: '',
  text: raw,
  fields: [],
  more: [],
  moreCut: 0,
  raw,
  sig: '',
  fresh: false,
  cut: false,
})

const PROVIDER = {
  id: 'p1',
  name: 'Local',
  kind: 'openai',
  baseUrl: 'http://127.0.0.1:1234/v1',
  model: 'small',
} as AiProvider

const REQUEST: LogExplainRequest = {
  id: '0123456789abcdef',
  encoding: 'auto',
  seq: 5,
  provider: '',
  model: '',
  mask: true,
}

function rig(adapter: Partial<ProviderAdapter>, providers: AiProvider[] = [PROVIDER]) {
  const sent: LogExplainEvent[] = []
  const asked: StreamRequest[] = []
  const timers = new Map<number, () => void>()
  let next = 1
  const explainer = new LogExplainer<string>({
    providers: () => providers,
    systemPrompt: () => '日本語で',
    keyFor: () => null,
    adapter: async () => ({
      models: async () => [],
      stream: async (request, sink) => {
        asked.push(request)
        return (adapter.stream ?? (async () => ({})))(request, sink)
      },
    }),
    context: (request) =>
      request.seq === 5
        ? {
            target: line(5, 'ERROR mail to rin@example.com failed'),
            before: [line(4, 'INFO before')],
            file: 'app.log',
            format: 'plain',
          }
        : null,
    newId: () => `token-${next}`,
    setTimer: (fn) => {
      const id = next++
      timers.set(id, fn)
      return id
    },
    clearTimer: (id) => {
      timers.delete(id as number)
    },
    send: (_page, event) => sent.push(event),
  })
  return { explainer, sent, asked, timers }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('LogExplainer', () => {
  it('previews what it sends, masked, and sends the same', async () => {
    const r = rig({
      stream: async (_request, sink) => {
        sink.text('It means ')
        sink.text('the mail server refused.')
        return {}
      },
    })
    const preview = r.explainer.preview(REQUEST)
    expect(preview).toContain('ERROR mail to ••• failed')
    expect(preview).toContain('INFO before')
    const started = r.explainer.start('page', REQUEST)
    expect(started).toEqual({ token: 'token-1' })
    await settle()
    expect(r.asked[0]?.messages[0]?.text).toBe(preview)
    expect(r.asked[0]?.system).toBe(`${EXPLAIN_SYSTEM}\n\n日本語で`)
    expect(r.asked[0]?.model).toBe('small')
    expect(r.sent.at(-1)).toMatchObject({
      token: 'token-1',
      text: 'It means the mail server refused.',
      done: true,
      failure: null,
      provider: 'Local',
    })
    expect(r.timers.size).toBe(0)
  })

  it('refuses without a provider, for a line no longer held, and a second at once', async () => {
    expect(rig({}, []).explainer.start('page', REQUEST)).toEqual({
      problem: 'no AI provider is set up in the settings',
    })
    const r = rig({ stream: () => new Promise(() => {}) })
    expect(r.explainer.start('page', { ...REQUEST, seq: 9 })).toMatchObject({
      problem: expect.stringContaining('no longer held'),
    })
    expect(r.explainer.start('page', REQUEST)).toHaveProperty('token')
    expect(r.explainer.start('page', REQUEST)).toEqual({
      problem: 'an answer is still being written',
    })
    expect(r.explainer.start('other', REQUEST)).toHaveProperty('token')
  })

  it('says a failure in the link vocabulary with the provider’s words', async () => {
    const r = rig({
      stream: async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:1234')
      },
    })
    r.explainer.start('page', REQUEST)
    await settle()
    expect(r.sent.at(-1)?.failure).toMatch(/^no carrier: /)
  })

  it('stops on cancel, on the page going, and after the time allowed', async () => {
    const stalled = (request: StreamRequest) =>
      new Promise<never>((_resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(new Error('aborted')))
      })
    const r = rig({ stream: stalled })
    const started = r.explainer.start('page', REQUEST) as { token: string }
    await settle()
    r.explainer.cancel('page', 'not-it-at-all')
    r.explainer.cancel('page', started.token)
    await settle()
    expect(r.sent.at(-1)).toMatchObject({ done: true, failure: 'stopped' })

    r.explainer.start('page', REQUEST)
    await settle()
    const before = r.sent.length
    r.explainer.dropPage('page')
    await settle()
    expect(r.sent.length).toBe(before)
    expect(r.explainer.busy('page')).toBe(false)

    r.explainer.start('page', REQUEST)
    await settle()
    const timeout = [...r.timers.values()].at(-1)
    expect(EXPLAIN_TIMEOUT_MS).toBe(180_000)
    timeout?.()
    await settle()
    // Found in review: given up for time, it said "stopped", as if the user had pressed STOP.
    expect(r.sent.at(-1)).toMatchObject({
      done: true,
      failure: 'link error: no answer within 180 seconds',
    })
  })
})
