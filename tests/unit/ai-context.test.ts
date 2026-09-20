import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  AI_CONTEXT,
  type AiProvider,
  AiProviderSchema,
  type ChatEvent,
  ChatSchema,
  chatWindow,
  contextWindow,
  estimateTokens,
} from '@shared/ai'
import { applySettingsPatch, defaultSettings } from '@shared/settings'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type {
  ProviderAdapter,
  StreamRequest,
  StreamResult,
  StreamSink,
} from '../../src/main/ai/adapter.js'
import { AiChatService } from '../../src/main/ai/service.js'
import { ChatStore } from '../../src/main/ai/store.js'

/** A hundred tokens by the estimate, 104 as a message. */
const HUNDRED = 'x'.repeat(400)

describe('an estimate of tokens', () => {
  it('is four ASCII characters to one, and one for every other character', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
    expect(estimateTokens(HUNDRED)).toBe(100)
    // Japanese runs at about a token a character: "four characters" would say 2.
    expect(estimateTokens('こんにちは世界')).toBe(7)
    expect(estimateTokens('東京 is big')).toBe(4)
  })
})

describe("a provider's window", () => {
  const at = (baseUrl: string, contextTokens?: number) =>
    contextWindow({ baseUrl, ...(contextTokens === undefined ? {} : { contextTokens }) })

  it('goes by the address until the user says: small on this network, none for a service', () => {
    expect(at('http://localhost:11434/v1')).toBe(AI_CONTEXT.localWindow)
    expect(at('http://192.168.1.20:1234/v1')).toBe(AI_CONTEXT.localWindow)
    expect(at('https://api.anthropic.com')).toBe(0)
    expect(at('not an address')).toBe(0)
  })

  it('is what the user typed: 0 for none, and never smaller than a window can be', () => {
    expect(at('http://localhost:11434/v1', 0)).toBe(0)
    expect(at('http://localhost:11434/v1', 32768)).toBe(32768)
    expect(at('https://api.openai.com/v1', 128000)).toBe(128000)
    expect(at('http://localhost:11434/v1', 12)).toBe(AI_CONTEXT.minWindow)
  })

  it('a figure that is not one costs the figure, not the provider or the settings', () => {
    const provider = { id: 'local', name: 'Local', kind: 'openai', baseUrl: 'http://localhost/v1' }
    expect(AiProviderSchema.parse({ ...provider, contextTokens: 'lots' })).toEqual({
      ...provider,
      model: '',
    })
    expect(AiProviderSchema.parse({ ...provider, contextTokens: -1 }).contextTokens).toBeUndefined()
    const next = applySettingsPatch(defaultSettings(), {
      ai: { providers: [{ ...provider, model: '', contextTokens: 4096 } as AiProvider] },
    })
    expect(next?.ai.providers[0]?.contextTokens).toBe(4096)
  })
})

/** `count` messages of 104 tokens each, a question first and last. */
function talk(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `m${i}`,
    role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
    text: HUNDRED,
  }))
}

describe('what of a conversation is sent', () => {
  // A window of 1024: up to 768 may go, and a cut leaves 512 or less.
  const small = { window: 1024, system: 0, ratio: 1 }

  it('all of it, without a window or while it fits', () => {
    expect(chatWindow(talk(99), { ...small, window: 0 })).toEqual({ from: 0, estimate: 99 * 104 })
    expect(chatWindow(talk(7), small)).toEqual({ from: 0, estimate: 728 })
    expect(chatWindow([], small)).toEqual({ from: 0, estimate: 0 })
  })

  it('past that it is cut well back, to a question', () => {
    // Nine do not fit; five would (520 > 512 does not), so it begins at the question with three.
    expect(chatWindow(talk(9), small)).toEqual({ from: 6, estimate: 312 })
  })

  it('the cut stays where it is until what follows it no longer fits: the prompt keeps its beginning', () => {
    expect(chatWindow(talk(11), { ...small, from: 'm6' }).from).toBe(6)
    expect(chatWindow(talk(13), { ...small, from: 'm6' }).from).toBe(6)
    // Without the cut kept, each of these would have been cut somewhere else.
    expect(chatWindow(talk(11), small).from).toBe(8)
    expect(chatWindow(talk(13), small).from).toBe(10)
    // Nine messages from m6 are too many: it moves, again by a lot.
    expect(chatWindow(talk(15), { ...small, from: 'm6' }).from).toBe(12)
  })

  it('a conversation that fits is sent whole, whatever cut was kept', () => {
    expect(chatWindow(talk(15), { window: 8192, system: 0, ratio: 1, from: 'm6' }).from).toBe(0)
  })

  it('a kept cut that is no longer a question there is not used', () => {
    expect(chatWindow(talk(9), { ...small, from: 'gone' }).from).toBe(6)
    expect(chatWindow(talk(9), { ...small, from: 'm5' }).from).toBe(6)
  })

  it('what goes ahead of the messages takes its share, and the measured ratio scales it all', () => {
    expect(chatWindow(talk(7), { ...small, system: 100 })).toEqual({ from: 4, estimate: 412 })
    expect(chatWindow(talk(7), { ...small, ratio: 1.5 })).toEqual({ from: 4, estimate: 312 })
  })

  it('the last question always goes, fitting or not', () => {
    const huge = [...talk(4), { id: 'q', role: 'user' as const, text: 'y'.repeat(40_000) }]
    expect(chatWindow(huge, small)).toEqual({ from: 4, estimate: 10_004 })
    const only = [{ id: 'q', role: 'user' as const, text: 'y'.repeat(40_000) }]
    expect(chatWindow(only, small).from).toBe(0)
  })
})

describe('a conversation file', () => {
  const chat = {
    id: '11111111-2222-4333-8444-555555555555',
    createdAt: 1,
    updatedAt: 1,
    messages: [{ id: 'q', role: 'user', text: 'hi', at: 1 }],
  }

  it('keeps where what is sent begins, and reads one written before there was such a thing', () => {
    expect(ChatSchema.parse(chat).context).toBeUndefined()
    expect(ChatSchema.parse({ ...chat, context: { from: 'q', at: 5 } }).context).toEqual({
      from: 'q',
      at: 5,
    })
  })

  it('a context that does not read costs the line in the log, not the conversation', () => {
    const read = ChatSchema.parse({ ...chat, context: { from: 12 } })
    expect(read.context).toBeUndefined()
    expect(read.messages).toHaveLength(1)
  })
})

const SMALL: AiProvider = {
  id: 'small',
  name: 'Small',
  kind: 'openai',
  baseUrl: 'http://localhost:11434/v1',
  model: 'tiny',
  contextTokens: 1024,
}
const HOSTED: AiProvider = {
  id: 'hosted',
  name: 'Hosted',
  kind: 'openai',
  baseUrl: 'https://api.example.test/v1',
  model: 'large',
}

interface Pending {
  request: StreamRequest
  sink: StreamSink
  end(result?: StreamResult): void
}

function harness(dir: string) {
  const events: ChatEvent[] = []
  const pending: Pending[] = []
  let clock = 1_000
  let ids = 0
  const adapter: ProviderAdapter = {
    stream: (request, sink) =>
      new Promise<StreamResult>((resolve) => {
        pending.push({ request, sink, end: (result = {}) => resolve(result) })
      }),
    models: async () => [],
  }
  const store = new ChatStore(dir)
  const service = new AiChatService({
    store,
    providers: () => [SMALL, HOSTED],
    systemPrompt: () => '',
    keyFor: () => null,
    adapter: async () => adapter,
    now: () => {
      clock += 1
      return clock
    },
    newId: () => {
      ids += 1
      return `00000000-0000-4000-8000-${String(ids).padStart(12, '0')}`
    },
    setTimer: (fn) => fn,
    clearTimer: () => {},
    publish: (event) => events.push(event),
    listChanged: () => {},
  })
  const settle = async () => {
    for (let i = 0; i < 5; i += 1) await Promise.resolve()
  }
  /** Asks, and returns what the provider was sent; the answer is a hundred tokens unless told. */
  async function ask(
    chatId: string,
    request: { provider?: string; model?: string; text?: string; replaceFrom?: string },
    result: StreamResult = {},
  ): Promise<StreamRequest> {
    const asked = { provider: 'small', model: 'tiny', text: HUNDRED, ...request }
    expect(service.send(chatId, asked)).toEqual({ ok: true })
    await settle()
    const call = pending.at(-1) as Pending
    call.sink.text(HUNDRED)
    call.end(result)
    await settle()
    return call.request
  }
  return { service, store, events, pending, settle, ask }
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-ai-context-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('a long conversation with a small model', () => {
  it('is kept whole, and sent from where it fits - which the pane is told', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (let i = 0; i < 4; i += 1) {
      const sent = await h.ask(chatId, {})
      expect(sent.messages).toHaveLength(i * 2 + 1)
    }
    // The fifth question makes nine messages: three go.
    const sent = await h.ask(chatId, {})
    expect(sent.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user'])

    const chat = h.store.get(chatId)
    expect(chat?.messages).toHaveLength(10)
    expect(chat?.context?.from).toBe(chat?.messages[6]?.id)
    // Told with the question, not after the answer: the line is there while it is written.
    const asked = h.events.filter((e) => e.type === 'snapshot' && e.run !== null).at(-1)
    expect(asked).toMatchObject({ chat: { context: { from: chat?.messages[6]?.id } } })
  })

  it('goes on from the same place, question after question', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (let i = 0; i < 5; i += 1) await h.ask(chatId, {})
    const cut = h.store.get(chatId)?.context
    expect((await h.ask(chatId, {})).messages).toHaveLength(5)
    expect((await h.ask(chatId, {})).messages).toHaveLength(7)
    expect(h.store.get(chatId)?.context).toEqual(cut)
    // Nine from there no longer fit.
    expect((await h.ask(chatId, {})).messages).toHaveLength(3)
    expect(h.store.get(chatId)?.context?.from).toBe(h.store.get(chatId)?.messages[12]?.id)
  })

  it('asked of a model with room, all of it goes again and the line is gone', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (let i = 0; i < 5; i += 1) await h.ask(chatId, {})
    expect(h.store.get(chatId)?.context).toBeDefined()
    expect((await h.ask(chatId, { provider: 'hosted', model: 'large' })).messages).toHaveLength(11)
    expect(h.store.get(chatId)?.context).toBeUndefined()
  })

  it('rewritten shorter, it fits again', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (let i = 0; i < 5; i += 1) await h.ask(chatId, {})
    const second = h.store.get(chatId)?.messages[2]?.id as string
    expect((await h.ask(chatId, { replaceFrom: second })).messages).toHaveLength(3)
    expect(h.store.get(chatId)?.context).toBeUndefined()
  })

  it('asking again sends what the question before it sent', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (let i = 0; i < 5; i += 1) await h.ask(chatId, {})
    expect(h.service.send(chatId, { provider: 'small', model: 'tiny' })).toEqual({ ok: true })
    await h.settle()
    expect(h.pending.at(-1)?.request.messages).toHaveLength(3)
    expect(h.store.get(chatId)?.messages).toHaveLength(9)
    expect(h.store.get(chatId)?.context?.from).toBe(h.store.get(chatId)?.messages[6]?.id)
  })
})

describe("the provider's own count", () => {
  it('corrects the estimate upwards, for that model', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    await h.ask(chatId, {})
    await h.ask(chatId, {})
    // Five messages, estimated at 520: the provider read twice that.
    await h.ask(chatId, {}, { usage: { input: 1040, output: 100 } })
    // Seven would have fitted by the estimate alone; at twice the size only the question does.
    expect((await h.ask(chatId, {})).messages).toHaveLength(1)

    const other = h.service.create() as string
    for (let i = 0; i < 3; i += 1) await h.ask(other, { model: 'another' })
    expect((await h.ask(other, { model: 'another' })).messages).toHaveLength(7)
  })

  it('never downwards: a server that dropped the beginning of a prompt reports a small one', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    await h.ask(chatId, {})
    await h.ask(chatId, {})
    await h.ask(chatId, {}, { usage: { input: 60, output: 100 } })
    expect((await h.ask(chatId, {})).messages).toHaveLength(7)
    // Nine still do not go, as they would if 60 had been believed.
    expect((await h.ask(chatId, {})).messages).toHaveLength(3)
  })

  it('is not believed of a short prompt, where the template decides the figure', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    await h.ask(chatId, {}, { usage: { input: 208, output: 100 } })
    for (let i = 0; i < 2; i += 1) await h.ask(chatId, {})
    expect((await h.ask(chatId, {})).messages).toHaveLength(7)
  })
})
