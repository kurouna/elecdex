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
  seqs: [5],
  provider: '',
  model: '',
  mask: true,
}

function rig(
  adapter: Partial<ProviderAdapter>,
  providers: AiProvider[] = [PROVIDER],
  key: string | null = null,
  more: LogLine[] = [],
) {
  const sent: LogExplainEvent[] = []
  const asked: StreamRequest[] = []
  const timers = new Map<number, () => void>()
  let next = 1
  const explainer = new LogExplainer<string>({
    providers: () => providers,
    systemPrompt: () => '日本語で',
    keyFor: () => key,
    adapter: async () => ({
      models: async () => [],
      stream: async (request, sink) => {
        asked.push(request)
        return (adapter.stream ?? (async () => ({})))(request, sink)
      },
    }),
    lines: (request) => {
      const held = new Map([
        [4, line(4, 'INFO before')],
        [5, line(5, 'ERROR mail to rin@example.com failed')],
        [6, line(6, 'WARN after')],
        ...more.map((l) => [l.seq, l] as const),
      ])
      const found = request.seqs.map((seq) => held.get(seq))
      return found.every((l) => l !== undefined) ? (found as LogLine[]) : null
    },
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
    const shown = r.explainer.preview(REQUEST)
    expect(shown?.fits).toBe(true)
    const preview = shown?.text ?? ''
    expect(preview).toContain('ERROR mail to ••• failed')
    // Only what was chosen: not the line before it, nor the one after.
    expect(preview).not.toContain('INFO before')
    expect(preview).not.toContain('WARN after')
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
    expect(r.explainer.start('page', { ...REQUEST, seqs: [5, 9] })).toMatchObject({
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

  it('asks the provider and model of the pane and model, or the first provider and its own model when gone', async () => {
    const second = { ...PROVIDER, id: 'p2', name: 'Other', model: 'big' } as AiProvider
    const r = rig({}, [PROVIDER, second])
    r.explainer.start('a', { ...REQUEST, provider: 'p2', model: 'custom' })
    await settle()
    expect(r.asked.at(-1)?.model).toBe('custom')
    // Found writing these tests: a provider removed from the settings was "no provider at all".
    r.explainer.start('b', { ...REQUEST, provider: 'gone', model: 'custom' })
    await settle()
    expect(r.asked.at(-1)?.model).toBe('small')
    expect(r.sent.at(-1)?.provider).toBe('Local')
  })

  it('refuses where the AI settings would: a key over plain http to another network', () => {
    const remote = { ...PROVIDER, baseUrl: 'http://203.0.113.5/v1' } as AiProvider
    const refused = rig({}, [remote], 'sk-secret').explainer.start('page', REQUEST)
    expect(refused).toEqual({ problem: expect.stringContaining('plain http') })
    // Without a key, nothing secret travels: it may be asked.
    expect(rig({}, [remote], null).explainer.start('page', REQUEST)).toHaveProperty('token')
  })

  it('takes the answer after a search, and says how an answer ended short', async () => {
    const searched = rig({
      stream: async (_request, sink) => {
        sink.text('Searching... ')
        sink.text('The answer.')
        return { answer: 'The answer.' }
      },
    })
    searched.explainer.start('page', REQUEST)
    await settle()
    expect(searched.sent.at(-1)?.text).toBe('The answer.')
    const cut = rig({
      stream: async (_request, sink) => {
        sink.text('Half')
        return { stop: 'length', note: 'max tokens' }
      },
    })
    cut.explainer.start('page', REQUEST)
    await settle()
    expect(cut.sent.at(-1)).toMatchObject({
      text: 'Half',
      done: true,
      failure: 'truncated: max tokens',
    })
  })

  it('sends what is written at most once a flush, whole each time', async () => {
    let finish: () => void = () => {}
    const r = rig({
      stream: (_request, sink) =>
        new Promise((resolve) => {
          sink.text('a')
          sink.text('b')
          sink.text('c')
          finish = () => resolve({})
        }),
    })
    r.explainer.start('page', REQUEST)
    await settle()
    expect(r.sent).toHaveLength(0)
    const flush = [...r.timers.entries()].at(-1)
    flush?.[1]()
    expect(r.sent).toEqual([expect.objectContaining({ text: 'abc', done: false })])
    finish()
    await settle()
    expect(r.sent.at(-1)).toMatchObject({ text: 'abc', done: true })
  })

  it('lets go of everything on dispose', async () => {
    const r = rig({
      stream: (request) =>
        new Promise((_resolve, reject) =>
          request.signal.addEventListener('abort', () => reject(new Error('x'))),
        ),
    })
    r.explainer.start('a', REQUEST)
    r.explainer.start('b', REQUEST)
    await settle()
    r.explainer.dispose()
    await settle()
    expect(r.explainer.busy('a') || r.explainer.busy('b')).toBe(false)
    expect(r.timers.size).toBe(0)
    expect(r.sent).toHaveLength(0)
  })

  it('sends several chosen lines together, in their order, and only those', async () => {
    const r = rig({})
    r.explainer.start('page', { ...REQUEST, seqs: [6, 4], mask: false })
    await settle()
    const text = r.asked[0]?.messages[0]?.text ?? ''
    expect(text.startsWith('Explain these 2 log lines:')).toBe(true)
    expect(text.indexOf('INFO before')).toBeLessThan(text.indexOf('WARN after'))
    expect(text).not.toContain('ERROR mail')
  })

  it('refuses a choice too long to send, rather than send part of it', () => {
    const long = line(7, `ERROR ${'x'.repeat(20_000)}`)
    const r = rig({}, [PROVIDER], null, [long])
    // The preview says so first, for the pane to show before SEND.
    expect(r.explainer.preview({ ...REQUEST, seqs: [7] })?.fits).toBe(false)
    expect(r.explainer.start('page', { ...REQUEST, seqs: [7] })).toEqual({
      problem: 'too long to send (over 12,000 characters): choose fewer lines',
    })
    expect(r.asked).toHaveLength(0)
  })
})
