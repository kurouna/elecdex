import type { AiProvider } from '@shared/ai'
import type { LinkRequest } from '@shared/elec16/link'
import { AI_TYPES, LINK_STATUS } from '@shared/elec16/link-services'
import { describe, expect, it, vi } from 'vitest'
import type { ProviderAdapter, StreamRequest, StreamResult } from '../../src/main/ai/adapter'
import { AI_TURNS, AiLinkService } from '../../src/main/elec16/link/ai'
import { LINK_TIMEOUT_MS, LinkHub, type LinkService } from '../../src/main/elec16/link/hub'

/**
 * LINK in main (main/elec16/link): the hub that passes a unit's request to the service it
 * names, and the AI service that asks a provider - here a stand-in adapter that records what
 * it was asked and answers as a test says.
 */

const bytes = (text: string): Uint8Array =>
  new Uint8Array(
    [...text].map((c) => {
      const code = c.codePointAt(0) ?? 0
      return code >= 0xff61 ? code - 0xff61 + 0xa1 : code
    }),
  )
const text = (data: Uint8Array | undefined): string =>
  String.fromCharCode(...[...(data ?? [])].map((b) => (b >= 0xa1 ? b - 0xa1 + 0xff61 : b)))

const request = (query: string, change: Partial<LinkRequest> = {}): LinkRequest => ({
  serial: 1,
  service: 0,
  type: 0,
  query: bytes(query),
  max: 100,
  fresh: false,
  ...change,
})

const PROVIDERS: AiProvider[] = [
  { id: 'local', name: 'Local', kind: 'openai', baseUrl: 'http://127.0.0.1:11434/v1', model: 'm1' },
  {
    id: 'cloud',
    name: 'Cloud',
    kind: 'anthropic',
    baseUrl: 'https://api.example.com',
    model: 'm2',
  },
  { id: 'bare', name: 'Bare', kind: 'openai', baseUrl: 'http://127.0.0.1:1/v1', model: '' },
]

/** An adapter that answers `reply` (a function of what it was asked) and records the asks. */
function stand(reply: (r: StreamRequest) => string | StreamResult | Error = () => 'OK.') {
  const asked: StreamRequest[] = []
  const adapter: ProviderAdapter = {
    models: async () => [],
    stream: async (r, sink) => {
      asked.push(r)
      const said = reply(r)
      if (said instanceof Error) throw said
      if (typeof said === 'string') {
        sink.text(said)
        return {}
      }
      sink.text('searching... ')
      return said
    },
  }
  return { adapter, asked }
}

function aiService(reply?: Parameters<typeof stand>[0], provider = 'local') {
  const { adapter, asked } = stand(reply)
  const chosen = { provider }
  const service = new AiLinkService({
    providers: () => PROVIDERS,
    provider: () => chosen.provider,
    keyFor: (id) => (id === 'cloud' ? 'sk-test' : null),
    adapter: async () => adapter,
    today: () => '2026-10-04',
  })
  return { service, asked, chosen }
}

const context = (unit = 'u1') => ({ unit, signal: new AbortController().signal })

describe('the AI service', () => {
  it('asks the chosen provider in English, and answers in the LCD characters', async () => {
    const { service, asked } = aiService(() => 'A **pulsar** is a spinning star.\nIt blinks.')
    const answer = await service.ask(request('WHAT IS A PULSAR?'), context())
    expect(answer.status).toBe(LINK_STATUS.ready)
    expect(text(answer.data)).toBe('A pulsar is a spinning star. It blinks.')
    const r = asked[0]
    expect(r?.model).toBe('m1')
    expect(r?.key).toBeNull()
    expect(r?.noThinking).toBe(true)
    expect(r?.webSearch).toBeUndefined()
    expect(r?.maxTokens).toBeLessThanOrEqual(2000)
    expect(r?.system).toContain('only ASCII')
    expect(r?.messages).toEqual([{ role: 'user', text: 'WHAT IS A PULSAR?' }])
  })

  it('asks a kana question with full-width kana, and answers in half-width kana', async () => {
    const { service, asked } = aiService(() => 'ぱるさーは ほしです。')
    const answer = await service.ask(request('ﾊﾟﾙｻｰｯﾃ?'), context())
    expect(asked[0]?.messages[0]?.text).toBe('パルサーッテ?')
    expect(asked[0]?.system).toContain('漢字は使わず')
    expect(text(answer.data)).toBe('ﾊﾟﾙｻｰﾊ ﾎｼﾃﾞｽ｡')
  })

  it('remembers the last ten exchanges, and starts afresh when told', async () => {
    let n = 0
    const { service, asked } = aiService(() => `A${++n}.`)
    for (let k = 1; k <= AI_TURNS + 2; k++) await service.ask(request(`Q${k}`), context())
    const last = asked.at(-1)?.messages ?? []
    expect(last.length).toBe(AI_TURNS * 2 + 1)
    expect(last[0]).toEqual({ role: 'user', text: 'Q2' })
    expect(last[1]).toEqual({ role: 'assistant', text: 'A2.' })
    await service.ask(request('NEW ONE', { fresh: true }), context())
    expect(asked.at(-1)?.messages).toEqual([{ role: 'user', text: 'NEW ONE' }])
  })

  it('keeps each unit its own conversation, and forgets one when told', async () => {
    const { service, asked } = aiService()
    await service.ask(request('ONE'), context('u1'))
    await service.ask(request('TWO'), context('u2'))
    expect(asked[1]?.messages.length).toBe(1)
    service.forget('u1')
    await service.ask(request('THREE'), context('u1'))
    expect(asked[2]?.messages.length).toBe(1)
  })

  it('starts afresh when another provider answers', async () => {
    const { service, asked, chosen } = aiService()
    await service.ask(request('ONE'), context())
    chosen.provider = 'cloud'
    await service.ask(request('TWO'), context())
    expect(asked[1]?.messages.length).toBe(1)
    expect(asked[1]?.key).toBe('sk-test')
  })

  it('does not remember a DICT or TRANS question, and TRANS answers the other way', async () => {
    const { service, asked } = aiService(() => 'いぬ')
    const trans = AI_TYPES.indexOf('TRANS')
    await service.ask(request('NORMAL'), context())
    const answer = await service.ask(request('DOG', { type: trans, fresh: true }), context())
    expect(text(answer.data)).toBe('ｲﾇ')
    expect(asked[1]?.messages.length).toBe(1)
    expect(asked[1]?.system).toContain('English into natural Japanese')
  })

  it('lets SEARCH and WEATHER search, and takes only the answer after the search', async () => {
    const { service, asked } = aiService(() => ({ answer: 'Sunny, 24 C.' }))
    const answer = await service.ask(
      request('TOKYO', { type: AI_TYPES.indexOf('WEATHER') }),
      context(),
    )
    expect(asked[0]?.webSearch).toBe(true)
    expect(asked[0]?.system).toContain('Today is 2026-10-04.')
    expect(text(answer.data)).toBe('Sunny, 24 C.')
  })

  it('fails a search a model cannot make, rather than show a made-up one', async () => {
    const { service } = aiService(() => 'NO SEARCH')
    const answer = await service.ask(
      request('NEWS', { type: AI_TYPES.indexOf('SEARCH') }),
      context(),
    )
    expect(answer.status).toBe(LINK_STATUS.failed)
    expect(answer.note).toContain('NO SEARCH')
  })

  it("says why it failed in the provider's words", async () => {
    const { service } = aiService(() => new Error('401 invalid x-api-key'))
    const answer = await service.ask(request('HI'), context())
    expect(answer.status).toBe(LINK_STATUS.failed)
    expect(answer.note).toContain('401')
  })

  it('starts afresh on NEW even when that question fails before it is asked', async () => {
    const providers = PROVIDERS.map((p) => ({ ...p }))
    const { adapter, asked } = stand()
    const service = new AiLinkService({
      providers: () => providers,
      provider: () => 'local',
      keyFor: () => null,
      adapter: async () => adapter,
      today: () => 'x',
    })
    await service.ask(request('ONE'), context())
    // NEW, refused before anything is asked (no model): the talk is forgotten all the same.
    const local = providers[0] as AiProvider
    local.model = ''
    const refused = await service.ask(request('NEW', { fresh: true }), context())
    expect(refused.status).toBe(LINK_STATUS.failed)
    local.model = 'm1'
    await service.ask(request('TWO'), context())
    expect(asked.at(-1)?.messages).toEqual([{ role: 'user', text: 'TWO' }])
  })

  it('is OFF with no provider chosen, and fails one with no model or not listed', async () => {
    expect((await aiService(undefined, '').service.ask(request('HI'), context())).status).toBe(
      LINK_STATUS.off,
    )
    const bare = await aiService(undefined, 'bare').service.ask(request('HI'), context())
    expect(bare).toMatchObject({ status: LINK_STATUS.failed })
    expect(bare.note).toContain('no model')
    const gone = await aiService(undefined, 'gone').service.ask(request('HI'), context())
    expect(gone.status).toBe(LINK_STATUS.failed)
  })

  it('leaves room for a model that thinks before it answers', async () => {
    const { service, asked } = aiService()
    await service.ask(request('HI'), context())
    // Gemini 2.5 spends its reasoning from the same cap: 600 cut its answers at a line.
    expect(asked[0]?.maxTokens).toBeGreaterThanOrEqual(2000)
  })

  it('drops the sentence an answer was cut off in at the length limit', async () => {
    const { service } = aiService(() => ({ stop: 'length', answer: 'It is a star. It spins ve' }))
    const answer = await service.ask(request('HI'), context())
    expect(answer.status).toBe(LINK_STATUS.ready)
    expect(text(answer.data)).toBe('It is a star.')
  })

  it('fails an empty answer, and does not remember it', async () => {
    const { service } = aiService(() => '\n\n')
    expect((await service.ask(request('HI'), context())).status).toBe(LINK_STATUS.failed)
  })
})

describe('the LINK hub', () => {
  const echo = (): LinkService & { asked: LinkRequest[]; forgot: string[] } => {
    const asked: LinkRequest[] = []
    const forgot: string[] = []
    return {
      service: 0,
      asked,
      forgot,
      ask: async (r) => {
        asked.push(r)
        return { status: LINK_STATUS.ready, data: r.query }
      },
      forget: (unit) => forgot.push(unit),
    }
  }
  const hubWith = (services: LinkService[], on = true) =>
    new LinkHub({
      services,
      enabled: () => on,
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (h) => clearTimeout(h as NodeJS.Timeout),
    })

  it('gives a request to the service it names', async () => {
    const service = echo()
    const answer = await hubWith([service]).ask('u1', request('HI'))
    expect(answer).toMatchObject({ status: LINK_STATUS.ready })
    expect(service.asked).toHaveLength(1)
  })

  it('checks what the page passes on', async () => {
    const hub = hubWith([echo()])
    for (const bad of [
      null,
      { ...request('HI'), query: [72] },
      { ...request('HI'), query: new Uint8Array(256) },
      { ...request('HI'), query: new Uint8Array() },
      { ...request('HI'), serial: -1 },
      { ...request('HI'), fresh: 'yes' },
    ]) {
      expect((await hub.ask('u1', bad)).status).toBe(LINK_STATUS.badRequest)
    }
    expect((await hub.ask('u1', request('HI', { type: 99 }))).status).toBe(LINK_STATUS.badRequest)
    expect((await hub.ask('u1', request('HI', { max: 256 }))).status).toBe(LINK_STATUS.badRequest)
    expect((await hub.ask('u1', request('HI', { service: 1 }))).status).toBe(LINK_STATUS.noService)
  })

  it('answers OFF while LINK is off, asking nobody and forgetting the talk', async () => {
    const service = echo()
    const answer = await hubWith([service], false).ask('u1', request('HI'))
    expect(answer.status).toBe(LINK_STATUS.off)
    expect(service.asked).toHaveLength(0)
    expect(service.forgot).toEqual(['u1'])
  })

  it('drops a request the machine let go, and one past the time limit', async () => {
    vi.useFakeTimers()
    try {
      const waits: LinkService = {
        service: 0,
        ask: (_r, c) =>
          new Promise((_resolve, reject) =>
            c.signal.addEventListener('abort', () => reject(new Error('aborted'))),
          ),
        forget: () => {},
      }
      const hub = hubWith([waits])
      const cancelled = hub.ask('u1', request('HI', { serial: 7 }))
      expect(hub.watching()).toEqual(['u1'])
      hub.drop('u1', 6)
      hub.drop('u1', 7)
      expect((await cancelled).status).toBe(LINK_STATUS.cancelled)
      expect(hub.watching()).toEqual([])

      const late = hub.ask('u1', request('HI'))
      await vi.advanceTimersByTimeAsync(LINK_TIMEOUT_MS)
      const answer = await late
      expect(answer.status).toBe(LINK_STATUS.failed)
      expect(answer.note).toContain('minute')

      const gone = hub.ask('u2', request('HI'))
      hub.dropUnit('u2')
      expect((await gone).status).toBe(LINK_STATUS.cancelled)
    } finally {
      vi.useRealTimers()
    }
  })

  it('drops the request a unit had out when it sends another', async () => {
    const signals: AbortSignal[] = []
    const hub = hubWith([
      {
        service: 0,
        ask: (_r, c) => {
          signals.push(c.signal)
          return new Promise(() => {})
        },
        forget: () => {},
      },
    ])
    void hub.ask('u1', request('ONE', { serial: 1 }))
    void hub.ask('u1', request('TWO', { serial: 2 }))
    await Promise.resolve()
    expect(signals[0]?.aborted).toBe(true)
    expect(signals[1]?.aborted).toBe(false)
    hub.dispose()
    expect(signals[1]?.aborted).toBe(true)
  })
})
