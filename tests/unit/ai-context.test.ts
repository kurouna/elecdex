import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  AI_CONTEXT,
  type AiProvider,
  AiProviderSchema,
  type ChatEvent,
  ChatSchema,
  COMPACT_PROMPT,
  chatWindow,
  clipToTokens,
  compactPrompt,
  compactTranscript,
  contextWindow,
  estimateTokens,
  summaryRoom,
  withSummary,
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
/** A window of 4096: 3072 may go, a cut leaves 2048, and a summary has 409 of it. */
const ROOMY: AiProvider = { ...SMALL, id: 'roomy', name: 'Roomy', contextTokens: 4096 }
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
  fail(error: unknown): void
}

function harness(dir: string, compacts = false) {
  const flags = { compacts }
  const events: ChatEvent[] = []
  const pending: Pending[] = []
  let clock = 1_000
  let ids = 0
  const adapter: ProviderAdapter = {
    stream: (request, sink) =>
      new Promise<StreamResult>((resolve, reject) => {
        pending.push({ request, sink, end: (result = {}) => resolve(result), fail: reject })
        request.signal.addEventListener('abort', () => reject(new Error('aborted')))
      }),
    models: async () => [],
  }
  const store = new ChatStore(dir)
  const service = new AiChatService({
    store,
    providers: () => [SMALL, ROOMY, HOSTED],
    systemPrompt: () => '',
    compact: () => flags.compacts,
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
  return { service, store, events, pending, settle, ask, flags }
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

describe('the summary that goes with a cut conversation', () => {
  it('follows the system prompt, or stands alone', () => {
    expect(withSummary('', 'They want X.')).toMatch(
      /^Summary of the earlier part.*:\nThey want X\.$/,
    )
    expect(withSummary('Be brief.', 'They want X.')).toMatch(/^Be brief\.\n\nSummary of/)
  })

  it('is written from the summary so far and what stays behind, the latest first to be kept', () => {
    const said = [
      { role: 'user' as const, text: 'first question' },
      { role: 'assistant' as const, text: 'first answer' },
      { role: 'user' as const, text: 'second question' },
    ]
    expect(compactTranscript(undefined, said, 1000)).toBe(
      'Conversation:\nUser: first question\n\nAssistant: first answer\n\nUser: second question',
    )
    expect(compactTranscript('They greeted.', said, 1000)).toMatch(
      /^Summary so far:\nThey greeted\.\n\nConversation:\nUser: first/,
    )
    // Room for the last two, and for the beginning of the one before them.
    const tight = compactTranscript(undefined, said, 16)
    expect(tight).toBe('Conversation:\nUs…\n\nAssistant: first answer\n\nUser: second question')
    expect(compactTranscript(undefined, said, 0)).toBe('Conversation:\n')
  })
})

/** Four hundred tokens by the estimate, numbered so a transcript can be told from another. */
const big = (n: number): string => `Q${n} ${'x'.repeat(1600 - 3)}`

describe('the room a summary is given', () => {
  it('is a tenth of the window, up to 600 tokens, and a summary is held to it', () => {
    expect(summaryRoom(8192)).toBe(600)
    expect(summaryRoom(4096)).toBe(409)
    expect(summaryRoom(1024)).toBe(102)
    expect(clipToTokens('abcdefgh', 1)).toBe('abcd')
    expect(clipToTokens('こんにちは', 3)).toBe('こんに')
    expect(clipToTokens('short', 100)).toBe('short')
    // Never between the halves of a character outside the basic plane.
    expect(clipToTokens('a😀b', 1.5)).toBe('a')
    expect(compactPrompt(600).startsWith(COMPACT_PROMPT)).toBe(true)
    expect(compactPrompt(600)).toContain('At most 300 words.')
    expect(compactPrompt(102)).toContain('At most 51 words.')
  })
})

describe('summaries, when they are on', () => {
  const summarising = (request: StreamRequest | undefined): boolean =>
    request?.system.startsWith(COMPACT_PROMPT) === true

  /**
   * One question and its answer. When the model is first asked for a summary, `summary` is what
   * it writes, or an error to fail with. With no `text`, the last answer is asked for again.
   */
  async function turn(
    h: ReturnType<typeof harness>,
    chatId: string,
    n: number,
    summary: string | Error = `summary at Q${n}`,
    extra: { replaceFrom?: string; provider?: string; text?: string | null; answer?: string } = {},
  ) {
    const before = h.pending.length
    const { provider = 'roomy', text = big(n), answer = 'x'.repeat(1600), replaceFrom } = extra
    const request = {
      provider,
      model: 'tiny',
      ...(text === null ? {} : { text }),
      ...(replaceFrom === undefined ? {} : { replaceFrom }),
    }
    expect(h.service.send(chatId, request)).toEqual({ ok: true })
    await h.settle()
    let compaction: StreamRequest | undefined
    if (summarising(h.pending.at(-1)?.request)) {
      const call = h.pending.at(-1) as Pending
      compaction = call.request
      if (summary instanceof Error) call.fail(summary)
      else {
        call.sink.thinking('hmm')
        call.sink.text(` ${summary}\n`)
        call.end()
      }
      await h.settle()
    }
    const call = h.pending.at(-1) as Pending
    call.sink.text(answer)
    call.end()
    await h.settle()
    return { compaction, asked: call.request, calls: h.pending.length - before }
  }

  it('the model is asked for one when the conversation is cut, and the question goes with it', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3]) expect((await turn(h, chatId, n)).calls).toBe(1)

    // Seven messages and the room a summary is given do not fit: three go, four are summarised.
    const fourth = await turn(h, chatId, 4, 'They asked Q1 to Q3.')
    expect(fourth.compaction?.model).toBe('tiny')
    expect(fourth.compaction?.system).toBe(compactPrompt(409))
    expect(fourth.compaction?.messages).toHaveLength(1)
    const transcript = fourth.compaction?.messages[0]?.text ?? ''
    expect(transcript.startsWith('Conversation:\nUser: Q1 ')).toBe(true)
    expect(transcript).toContain('User: Q2 ')
    expect(transcript).not.toContain('Q3 ')
    expect(fourth.asked.system).toBe(withSummary('', 'They asked Q1 to Q3.'))
    expect(fourth.asked.messages.map((m) => m.text.slice(0, 3))).toEqual(['Q3 ', 'xxx', 'Q4 '])

    const chat = h.store.get(chatId)
    expect(chat?.context).toMatchObject({
      from: chat?.messages[4]?.id,
      summary: { text: 'They asked Q1 to Q3.', before: chat?.messages[4]?.id },
    })
    // The pane is told it is summarising, then - with the summary - that the question is being asked.
    const runs = h.events.flatMap((e) => (e.type === 'snapshot' && e.run !== null ? [e] : []))
    const [compacting, asking] = runs.slice(-2)
    expect(compacting?.run?.phase).toBe('compacting')
    expect(asking?.run?.phase).toBeUndefined()
    expect(asking?.chat?.context?.summary?.text).toBe('They asked Q1 to Q3.')
    // The answer's clock is the answer's: tokens a second do not count the summary's time.
    expect(asking?.run?.startedAt).toBeGreaterThan(compacting?.run?.startedAt ?? 0)
  })

  it('once for each cut: the next questions go with the same summary and ask for no other', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3, 4]) await turn(h, chatId, n)
    // The summary counts as what it is - a few tokens - not as the room it was given: two more
    // questions fit behind the same cut.
    for (const [n, sent] of [
      [5, 5],
      [6, 7],
    ] as const) {
      const next = await turn(h, chatId, n)
      expect(next.calls).toBe(1)
      expect(next.asked.system).toBe(withSummary('', 'summary at Q4'))
      expect(next.asked.messages).toHaveLength(sent)
    }

    // The next cut is summarised from the summary so far and what it leaves behind since.
    const seventh = await turn(h, chatId, 7)
    const transcript = seventh.compaction?.messages[0]?.text ?? ''
    expect(
      transcript.startsWith('Summary so far:\nsummary at Q4\n\nConversation:\nUser: Q3 '),
    ).toBe(true)
    expect(transcript).toContain('User: Q4 ')
    expect(transcript).not.toContain('Q1 ')
    expect(transcript).not.toContain('Q5 ')
    expect(seventh.asked.system).toBe(withSummary('', 'summary at Q7'))
  })

  it('a summary that fails, or says nothing, costs the summary and not the question', async () => {
    for (const nothing of [new Error('HTTP 500'), '   ']) {
      const h = harness(dir, true)
      const chatId = h.service.create() as string
      for (const n of [1, 2, 3]) await turn(h, chatId, n)
      const fourth = await turn(h, chatId, 4, nothing)
      expect(fourth.compaction).toBeDefined()
      expect(fourth.asked.system).toBe('')
      expect(fourth.asked.messages).toHaveLength(3)
      const chat = h.store.get(chatId)
      expect(chat?.context?.from).toBe(chat?.messages[4]?.id)
      expect(chat?.context?.summary).toBeUndefined()
      expect(chat?.messages.at(-1)).toMatchObject({ role: 'assistant' })
      expect(chat?.messages.at(-1)?.stop).toBeUndefined()
    }
  })

  it('is asked for once more with the next question - a passing failure leaves no hole - and then no more', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3]) await turn(h, chatId, n)
    await turn(h, chatId, 4, new Error('HTTP 500'))

    // The same cut, and what is behind it still has nobody to speak for it.
    const fifth = await turn(h, chatId, 5, 'They asked Q1 and Q2.')
    expect(fifth.calls).toBe(2)
    expect(fifth.compaction?.messages[0]?.text.startsWith('Conversation:\nUser: Q1 ')).toBe(true)
    expect(fifth.asked.system).toBe(withSummary('', 'They asked Q1 and Q2.'))
    const chat = h.store.get(chatId)
    expect(chat?.context?.summary?.before).toBe(chat?.context?.from)

    // A model that cannot summarise is not asked with every question: twice a cut, and that is all.
    const other = h.service.create() as string
    for (const n of [1, 2, 3]) await turn(h, other, n)
    expect((await turn(h, other, 4, new Error('HTTP 500'))).calls).toBe(2)
    expect((await turn(h, other, 5, new Error('HTTP 500'))).calls).toBe(2)
    const again = await turn(h, other, 5, 'unused', { text: null })
    expect(again.calls).toBe(1)
    expect(again.asked.system).toBe('')
    // Until there is a new cut, with more to summarise.
    expect((await turn(h, other, 6)).calls).toBe(2)
  })

  it('what a failed summary missed is in the next one, and the one before it goes on being sent', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3, 4, 5, 6]) await turn(h, chatId, n)
    const seventh = await turn(h, chatId, 7, new Error('HTTP 500'))
    expect(seventh.compaction).toBeDefined()
    expect(seventh.asked.system).toBe(withSummary('', 'summary at Q4'))
    expect(h.store.get(chatId)?.context?.summary?.before).toBe(h.store.get(chatId)?.messages[4]?.id)

    const eighth = await turn(h, chatId, 8)
    const transcript = eighth.compaction?.messages[0]?.text ?? ''
    // From where the summary so far ends (Q3), not from the cut it failed at.
    expect(
      transcript.startsWith('Summary so far:\nsummary at Q4\n\nConversation:\nUser: Q3 '),
    ).toBe(true)
    expect(transcript).toContain('User: Q4 ')
    expect(eighth.asked.system).toBe(withSummary('', 'summary at Q8'))
  })

  it('a summary longer than its room is held to it, so it cannot push the cut along', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3]) await turn(h, chatId, n)
    await turn(h, chatId, 4, 'z'.repeat(5000))
    // 409 tokens of room in a window of 4096: four ASCII characters to one.
    expect(h.store.get(chatId)?.context?.summary?.text).toHaveLength(409 * 4)
    expect((await turn(h, chatId, 5)).calls).toBe(1)
  })

  it('in a small window it is asked for at a cut, not with every question', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    const small = { provider: 'small', text: HUNDRED, answer: HUNDRED }
    const calls: number[] = []
    for (const n of [1, 2, 3, 4, 5, 6, 7]) calls.push((await turn(h, chatId, n, 'ok', small)).calls)
    // A flat 600 tokens of room was most of a window of 1024: what was left for the messages was
    // outgrown by every question, and each of them cut the conversation and asked for a summary.
    expect(calls).toEqual([1, 1, 1, 2, 1, 1, 2])
  })

  it('stopped while it is summarised, nothing is asked and what there is is kept', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3]) await turn(h, chatId, n)
    h.service.send(chatId, { provider: 'roomy', model: 'tiny', text: big(4) })
    await h.settle()
    const calls = h.pending.length
    expect(summarising(h.pending.at(-1)?.request)).toBe(true)
    h.service.stop(chatId)
    await h.settle()
    expect(h.pending).toHaveLength(calls)
    expect(h.service.active()).toEqual([])
    const chat = h.store.get(chatId)
    expect(chat?.messages.at(-1)).toMatchObject({ role: 'assistant', text: '', stop: 'stopped' })
    expect(chat?.context?.summary).toBeUndefined()
  })

  it('a conversation deleted while it is summarised stays deleted', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3]) await turn(h, chatId, n)
    h.service.send(chatId, { provider: 'roomy', model: 'tiny', text: big(4) })
    await h.settle()
    const calls = h.pending.length
    h.service.remove(chatId)
    await h.settle()
    expect(h.pending).toHaveLength(calls)
    expect(h.store.get(chatId)).toBeNull()
  })

  it('turned off, the summary there is still goes, and no other is asked for', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3, 4]) await turn(h, chatId, n)
    h.flags.compacts = false
    const fifth = await turn(h, chatId, 5)
    expect(fifth.asked.system).toBe(withSummary('', 'summary at Q4'))
    for (const n of [6, 7, 8, 9]) expect((await turn(h, chatId, n)).calls).toBe(1)
  })

  it('turned on after a cut, what is already behind it is summarised with the next question', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3, 4, 5]) expect((await turn(h, chatId, n)).calls).toBe(1)
    const cut = h.store.get(chatId)?.context?.from
    expect(cut).toBeDefined()
    h.flags.compacts = true
    const sixth = await turn(h, chatId, 6)
    expect(sixth.calls).toBe(2)
    expect(h.store.get(chatId)?.context?.summary?.text).toBe('summary at Q6')
  })

  it('a conversation rewritten from before it loses it; one sent whole needs none', async () => {
    const h = harness(dir, true)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3, 4]) await turn(h, chatId, n)
    const second = h.store.get(chatId)?.messages[2]?.id as string
    const again = await turn(h, chatId, 9, 'unused', { replaceFrom: second })
    expect(again.calls).toBe(1)
    expect(again.asked.system).toBe('')
    expect(again.asked.messages).toHaveLength(3)
    expect(h.store.get(chatId)?.context).toBeUndefined()
  })

  it('off, nothing is asked but the question', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const asked = await turn(h, chatId, n)
      expect(asked.calls).toBe(1)
      expect(asked.asked.system).toBe('')
    }
    expect(h.store.get(chatId)?.context?.from).toBeDefined()
  })
})
