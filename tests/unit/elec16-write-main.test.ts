import type { AiProvider } from '@shared/ai'
import { SAMPLE } from '@shared/elec16/code-area'
import type { Elec16WritePiece } from '@shared/elec16-write'
import { describe, expect, it } from 'vitest'
import type {
  ProviderAdapter,
  StreamRequest,
  StreamResult,
  StreamSink,
} from '../../src/main/ai/adapter'
import { CodeWriter, WRITE_IDLE_MS } from '../../src/main/elec16/write'

/**
 * WRITE in main (main/elec16/write.ts): one conversation a pane, the model asked through the
 * AI settings' providers - here a stand-in adapter - its text passed on to the page that asked,
 * two fixes at most, and every way a request ends.
 */

const PROVIDERS: AiProvider[] = [
  { id: 'local', name: 'Local', kind: 'openai', baseUrl: 'http://127.0.0.1:11434/v1', model: 'm1' },
  {
    id: 'cloud',
    name: 'Cloud',
    kind: 'anthropic',
    baseUrl: 'https://api.example.com',
    model: 'm2',
  },
]

const ANSWER = '```ts\nexport function main(): void {}\n```'

type Reply = (
  r: StreamRequest,
  sink: StreamSink,
) => Promise<StreamResult | string> | StreamResult | string

function writer(reply: Reply = () => ANSWER) {
  const asked: StreamRequest[] = []
  const sent: { page: number; piece: Elec16WritePiece }[] = []
  const timers: { fn: () => void; ms: number; done: boolean }[] = []
  const adapter: ProviderAdapter = {
    models: async () => [],
    stream: async (r, sink) => {
      asked.push(r)
      const said = await reply(r, sink)
      if (typeof said === 'string') {
        sink.text(said)
        return { usage: { input: 10, output: 20 } }
      }
      return said
    },
  }
  const w = new CodeWriter({
    providers: () => PROVIDERS,
    keyFor: (id) => (id === 'cloud' ? 'sk-test' : null),
    adapter: async () => adapter,
    send: (page, piece) => sent.push({ page, piece }),
    setTimer: (fn, ms) => {
      const t = { fn, ms, done: false }
      timers.push(t)
      return t
    },
    clearTimer: (t) => {
      ;(t as { done: boolean }).done = true
    },
  })
  const fire = (ms: number) => {
    for (const t of timers.filter((x) => x.ms === ms && !x.done)) {
      t.done = true
      t.fn()
    }
  }
  return { w, asked, sent, fire }
}

const KEY = { page: 1, pane: 'p1' }
const req = (change: Record<string, unknown> = {}) => ({
  serial: 1,
  provider: 'local',
  model: 'm1',
  words: 'make a one-key game',
  code: SAMPLE,
  file: 'MAIN.TS',
  ...change,
})
const ERRORS = [{ file: 'MAIN.TS', line: 3, column: 5, message: 'x is not known' }]

describe('WRITE in main', () => {
  it('asks the chosen provider and model with the prompt main writes, and answers the whole text', async () => {
    const { w, asked } = writer()
    const done = await w.write(KEY, req({ provider: 'cloud', model: 'my-model' }))
    expect(done).toEqual({ ok: true, serial: 1, text: ANSWER, usage: { input: 10, output: 20 } })
    expect(asked[0]?.model).toBe('my-model')
    expect(asked[0]?.key).toBe('sk-test')
    expect(asked[0]?.system).toMatch(/ELEC-16 POCKET/)
    expect(asked[0]?.messages).toEqual([
      { role: 'user', text: 'Write an ELEC-16 program for this request:\n\nmake a one-key game' },
    ])
    // Reasoning is the provider's default, as the AI chat pane's.
    expect(asked[0]?.noThinking).toBeUndefined()
  })

  it('passes the text on to the page that asked, a batch at a time; a model thinking is not quiet', async () => {
    const { w, sent, fire } = writer(async (_r, sink) => {
      sink.thinking('hmm')
      sink.text('```ts\n')
      fire(100)
      sink.text('export function main')
      sink.text('(): void {}\n```')
      return {}
    })
    await w.write(KEY, req({ serial: 7 }))
    expect(sent.every((s) => s.page === 1 && s.piece.pane === 'p1' && s.piece.serial === 7)).toBe(
      true,
    )
    expect(sent.map((s) => s.piece.text).join('')).toBe(ANSWER)
    // Two batches of text; thinking is not passed on.
    expect(sent).toHaveLength(2)
  })

  it('goes on with the same conversation for a fix, two fixes at most', async () => {
    const { w, asked } = writer()
    await w.write(KEY, req())
    expect((await w.fix(KEY, { serial: 1, errors: ERRORS })).ok).toBe(true)
    expect(asked[1]?.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])
    expect(asked[1]?.messages[2]?.text).toContain('MAIN.TS:3:5 x is not known')
    expect((await w.fix(KEY, { serial: 1, errors: ERRORS })).ok).toBe(true)
    expect(await w.fix(KEY, { serial: 1, errors: ERRORS })).toMatchObject({
      ok: false,
      stop: 'spent',
    })
    expect(asked).toHaveLength(3)
  })

  it('refuses a fix for another serial or no conversation, and forgets on a new SEND', async () => {
    const { w, asked } = writer()
    expect(await w.fix(KEY, { serial: 1, errors: ERRORS })).toMatchObject({
      ok: false,
      stop: 'refused',
    })
    await w.write(KEY, req({ serial: 1 }))
    expect(await w.fix(KEY, { serial: 2, errors: ERRORS })).toMatchObject({
      ok: false,
      stop: 'refused',
    })
    await w.write(KEY, req({ serial: 2, words: 'again' }))
    await w.fix(KEY, { serial: 2, errors: ERRORS })
    expect(asked.at(-1)?.messages[0]?.text).toContain('again')
    expect(asked.at(-1)?.messages).toHaveLength(3)
  })

  it('sends the code of one’s own with a change', async () => {
    const { w, asked } = writer()
    await w.write(KEY, req({ code: 'export function main(): void { cls() }', words: 'add a beep' }))
    expect(asked[0]?.messages[0]?.text).toContain('export function main(): void { cls() }')
  })

  it('stops on STOP, on a new SEND of the same pane, and when the page goes', async () => {
    const hang: Reply = (r) =>
      new Promise((_resolve, reject) =>
        r.signal.addEventListener('abort', () => reject(new Error('aborted'))),
      )
    const { w } = writer(hang)
    const first = w.write(KEY, req())
    expect(w.watching()).toEqual(['1/p1'])
    w.stop(KEY)
    expect(await first).toMatchObject({ ok: false, stop: 'stopped' })
    const second = w.write(KEY, req({ serial: 2 }))
    const third = w.write(KEY, req({ serial: 3 }))
    expect(await second).toMatchObject({ ok: false, serial: 2, stop: 'stopped' })
    w.dropPage(1)
    expect(await third).toMatchObject({ ok: false, serial: 3, stop: 'stopped' })
    expect(w.watching()).toEqual([])
  })

  it('times out when nothing comes for a while, and cuts an answer too long to be a program', async () => {
    const hang: Reply = (r) =>
      new Promise((_resolve, reject) =>
        r.signal.addEventListener('abort', () => reject(new Error('aborted'))),
      )
    const idle = writer(hang)
    const waiting = idle.w.write(KEY, req())
    await Promise.resolve()
    idle.fire(WRITE_IDLE_MS)
    expect(await waiting).toMatchObject({ ok: false, stop: 'timeout' })

    const long = writer(async (r, sink) => {
      for (let k = 0; k < 100 && !r.signal.aborted; k++) sink.text('x'.repeat(1000))
      if (r.signal.aborted) throw new Error('aborted')
      return {}
    })
    expect(await long.w.write(KEY, req())).toMatchObject({ ok: false, stop: 'too-long' })
  })

  it('says why in the provider’s words, and refuses what is not a request', async () => {
    const failing = writer(() => {
      throw new Error('ECONNREFUSED')
    })
    const failed = await failing.w.write(KEY, req())
    expect(failed).toMatchObject({ ok: false, stop: 'failed' })
    if (!failed.ok) expect(failed.note).toMatch(/could not reach/)

    const refusing = writer(() => ({ stop: 'refusal', note: 'no' }))
    expect(await refusing.w.write(KEY, req())).toMatchObject({ ok: false, stop: 'refused' })

    const { w, asked } = writer()
    for (const bad of [
      null,
      req({ provider: 'gone' }),
      req({ model: '  ' }),
      req({ words: '' }),
      req({ words: 'x'.repeat(2001) }),
      req({ file: '../X' }),
      req({ serial: -1 }),
    ]) {
      expect((await w.write(KEY, bad)).ok, JSON.stringify(bad)?.slice(0, 60)).toBe(false)
    }
    expect(await w.fix(KEY, { serial: 1, errors: [] })).toMatchObject({ ok: false })
    expect(asked).toHaveLength(0)
  })

  it('says an answer the model cut off at its length is cut, never takes it as whole', async () => {
    const { w } = writer(async (_r, sink) => {
      sink.text('```ts\nexport function main(): void {')
      return { stop: 'length' }
    })
    const cut = await w.write(KEY, req())
    expect(cut).toMatchObject({ ok: false, stop: 'failed' })
    if (!cut.ok) expect(cut.note).toMatch(/cut off/)
  })
})
