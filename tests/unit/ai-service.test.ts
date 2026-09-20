import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { AI_LIMITS, type AiProvider, type ChatEvent, type ChatSummary } from '@shared/ai'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ProviderAdapter,
  ProviderError,
  type StreamRequest,
  type StreamResult,
  type StreamSink,
} from '../../src/main/ai/adapter.js'
import { emptyKeyFile, type KeyFile, KeyVault, stubCodec } from '../../src/main/ai/keys.js'
import { AiChatService } from '../../src/main/ai/service.js'
import { ChatStore } from '../../src/main/ai/store.js'

const LOCAL: AiProvider = {
  id: 'local',
  name: 'Local',
  kind: 'openai',
  baseUrl: 'http://localhost:11434/v1/',
  model: 'llama3',
}
const REMOTE_HTTP: AiProvider = {
  ...LOCAL,
  id: 'far',
  name: 'Far',
  baseUrl: 'http://far.example/v1',
}
const BROKEN: AiProvider = { ...LOCAL, id: 'broken', name: 'Broken', baseUrl: 'not a url' }

/** One answer under the test's control: pieces are pushed, then it is ended or failed. */
interface Pending {
  request: StreamRequest
  sink: StreamSink
  end(result?: StreamResult): void
  fail(error: unknown): void
}

function harness(dir: string, keys: Record<string, string> = {}) {
  const events: ChatEvent[] = []
  const lists: ChatSummary[][] = []
  const pending: Pending[] = []
  const timers: Array<() => void> = []
  let clock = 1_000
  let ids = 0

  const adapter: ProviderAdapter = {
    stream: (request, sink) =>
      new Promise<StreamResult>((resolve, reject) => {
        pending.push({ request, sink, end: (result = {}) => resolve(result), fail: reject })
        request.signal.addEventListener('abort', () => reject(new Error('aborted')))
      }),
    models: async () => [{ id: 'llama3' }],
  }

  const service = new AiChatService({
    store: new ChatStore(dir),
    providers: () => [LOCAL, REMOTE_HTTP, BROKEN],
    systemPrompt: () => 'be brief',
    compact: () => false,
    keyFor: (id) => keys[id] ?? null,
    adapter: async () => adapter,
    now: () => {
      clock += 1
      return clock
    },
    newId: () => {
      ids += 1
      return `00000000-0000-4000-8000-${String(ids).padStart(12, '0')}`
    },
    setTimer: (fn) => {
      timers.push(fn)
      return fn
    },
    clearTimer: (handle) => {
      const at = timers.indexOf(handle as () => void)
      if (at !== -1) timers.splice(at, 1)
    },
    publish: (event) => events.push(event),
    listChanged: (list) => lists.push(list),
  })

  return {
    service,
    events,
    lists,
    pending,
    /** Runs the flush timer, if one is waiting. */
    tick: () => timers.shift()?.(),
    /** Lets the service's own promises (the adapter being fetched, an answer ending) run. */
    settle: async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve()
    },
  }
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-ai-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const ASK = { provider: 'local', model: 'llama3' }

describe('an answer', () => {
  it('is written in pieces, gathered, and ends as the next message', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    expect(h.service.send(chatId, { ...ASK, text: 'What is 2+2?' })).toEqual({ ok: true })
    await h.settle()

    // The question is on disk before anything is asked of the provider.
    expect(h.service.list()[0]).toMatchObject({ title: 'What is 2+2?', messages: 1 })
    const call = h.pending[0] as Pending
    expect(call.request.baseUrl).toBe('http://localhost:11434/v1')
    expect(call.request.system).toBe('be brief')
    expect(call.request.messages).toEqual([{ role: 'user', text: 'What is 2+2?' }])

    const first = h.events.at(-1)
    expect(first).toMatchObject({ type: 'snapshot', run: { text: '', model: 'llama3' } })

    call.sink.thinking('adding')
    call.sink.text('It ')
    call.sink.text('is ')
    // Not one event per piece: they wait for the flush.
    expect(h.events.at(-1)).toBe(first)
    h.tick()
    expect(h.events.at(-1)).toMatchObject({
      type: 'delta',
      textAt: 0,
      text: 'It is ',
      thinkingAt: 0,
      thinking: 'adding',
    })
    call.sink.text('4.')
    h.tick()
    expect(h.events.at(-1)).toMatchObject({ type: 'delta', textAt: 6, text: '4.', thinking: '' })

    call.end({ usage: { input: 12, output: 5 } })
    await h.settle()
    const last = h.events.at(-1)
    expect(last).toMatchObject({ type: 'snapshot', run: null })
    const messages = last?.type === 'snapshot' ? last.chat?.messages : undefined
    expect(messages?.[1]).toMatchObject({
      role: 'assistant',
      text: 'It is 4.',
      thinking: 'adding',
      provider: 'Local',
      model: 'llama3',
      usage: { input: 12, output: 5 },
    })
    // How long it took, for the pane's tokens a second.
    expect(messages?.[1]?.ms).toBeGreaterThan(0)
    expect(h.service.active()).toEqual([])
    // And it is what a new service reads back.
    expect(harness(dir).service.get(chatId)?.messages).toHaveLength(2)
  })

  it('a pane that joins midway gets the text so far, and deltas that continue from it', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'hi' })
    await h.settle()
    const call = h.pending[0] as Pending
    call.sink.text('Hello')

    const before = h.events.length
    const snapshot = h.service.snapshot(chatId)
    // Those already listening are brought up to the same place first.
    expect(h.events.slice(before)).toMatchObject([{ type: 'delta', textAt: 0, text: 'Hello' }])
    expect(snapshot).toMatchObject({ type: 'snapshot', run: { text: 'Hello' } })

    call.sink.text(' there')
    h.tick()
    expect(h.events.at(-1)).toMatchObject({ type: 'delta', textAt: 5, text: ' there' })
  })

  it('stopped keeps what was written, and says it was stopped', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'count to ten' })
    await h.settle()
    const call = h.pending[0] as Pending
    call.sink.text('1, 2, 3')

    h.service.stop(chatId)
    expect(call.request.signal.aborted).toBe(true)
    await h.settle()
    const messages = h.service.get(chatId)?.messages ?? []
    expect(messages[1]).toMatchObject({ text: '1, 2, 3', stop: 'stopped' })
    // The stream's own rejection arrives afterwards and must not add a second answer.
    expect(messages).toHaveLength(2)
    expect(h.events.filter((e) => e.type === 'snapshot' && e.run === null)).toHaveLength(1)
  })

  it('a failure is kept as the answer, worded for the pane, and never part of the history sent', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'hi' })
    await h.settle()
    ;(h.pending[0] as Pending).fail(new ProviderError('the key was refused (401)'))
    await h.settle()
    expect(h.service.get(chatId)?.messages[1]).toMatchObject({
      text: '',
      stop: 'error',
      error: 'the key was refused (401)',
    })

    h.service.send(chatId, { ...ASK, text: 'again?' })
    await h.settle()
    expect((h.pending[1] as Pending).request.messages).toEqual([
      { role: 'user', text: 'hi' },
      { role: 'user', text: 'again?' },
    ])
  })

  it('nobody answering is told apart from an error: the pane says NO CARRIER', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'hi' })
    await h.settle()
    const refused = Object.assign(new TypeError('fetch failed'), {
      cause: new Error('connect ECONNREFUSED 127.0.0.1:11434'),
    })
    ;(h.pending[0] as Pending).fail(refused)
    await h.settle()
    expect(h.service.get(chatId)?.messages[1]).toMatchObject({
      stop: 'unreachable',
      error: 'could not reach localhost:11434 - is it running?',
    })
  })

  it('a refusal and a length stop are recorded with what the provider said', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'hi' })
    await h.settle()
    ;(h.pending[0] as Pending).end({ stop: 'refusal', note: 'declined', model: 'other-model' })
    await h.settle()
    expect(h.service.get(chatId)?.messages[1]).toMatchObject({
      stop: 'refusal',
      error: 'declined',
      model: 'other-model',
    })
  })

  it('only one at a time per conversation', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'one' })
    expect(h.service.send(chatId, { ...ASK, text: 'two' })).toMatchObject({ ok: false })
    expect(h.service.active()).toEqual([chatId])
  })

  it('on quit, what was written so far is on disk before anything is torn down', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'hi' })
    await h.settle()
    ;(h.pending[0] as Pending).sink.text('half an ans')
    h.service.dispose()
    // Read straight from the file: nothing asynchronous has had a chance to run.
    const onDisk = JSON.parse(readFileSync(path.join(dir, `${chatId}.json`), 'utf8'))
    expect(onDisk.messages[1]).toMatchObject({ text: 'half an ans', stop: 'stopped' })
  })
})

describe('rewriting history', () => {
  async function answered(
    h: ReturnType<typeof harness>,
    chatId: string,
    text: string,
    answer: string,
  ) {
    h.service.send(chatId, { ...ASK, text })
    await h.settle()
    const call = h.pending.at(-1) as Pending
    call.sink.text(answer)
    call.end()
    await h.settle()
  }

  it('asking again drops the last answer and keeps its question', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    await answered(h, chatId, 'q1', 'a1')
    expect(h.service.send(chatId, ASK)).toEqual({ ok: true })
    await h.settle()
    expect((h.pending.at(-1) as Pending).request.messages).toEqual([{ role: 'user', text: 'q1' }])
  })

  it('editing an earlier question replaces it and everything after it', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    await answered(h, chatId, 'q1', 'a1')
    await answered(h, chatId, 'q2', 'a2')
    const q2 = h.service.get(chatId)?.messages[2]?.id as string
    h.service.send(chatId, { ...ASK, text: 'q2, reworded', replaceFrom: q2 })
    await h.settle()
    expect((h.pending.at(-1) as Pending).request.messages).toEqual([
      { role: 'user', text: 'q1' },
      { role: 'assistant', text: 'a1' },
      { role: 'user', text: 'q2, reworded' },
    ])
  })

  it('rewriting the first question renames the conversation after it', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    await answered(h, chatId, 'about cats', 'a1')
    await answered(h, chatId, 'and dogs', 'a2')
    expect(h.service.list()[0]?.title).toBe('about cats')
    const q1 = h.service.get(chatId)?.messages[0]?.id as string
    h.service.send(chatId, { ...ASK, text: 'about birds', replaceFrom: q1 })
    expect(h.service.list()[0]?.title).toBe('about birds')
  })

  it('refuses what cannot be done', () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    expect(h.service.send(chatId, ASK)).toMatchObject({ ok: false })
    expect(h.service.send(chatId, { ...ASK, text: 'x', replaceFrom: 'nope' })).toMatchObject({
      ok: false,
    })
    expect(h.service.send('00000000-0000-4000-8000-999999999999', { ...ASK, text: 'x' })).toEqual({
      ok: false,
      error: 'no such conversation',
    })
  })
})

describe('which provider is asked', () => {
  it('not one that is not listed, nor one whose address is not an address', () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    expect(h.service.send(chatId, { provider: 'gone', model: 'm', text: 'x' })).toMatchObject({
      ok: false,
    })
    expect(h.service.send(chatId, { provider: 'broken', model: 'm', text: 'x' })).toMatchObject({
      ok: false,
    })
    expect(h.pending).toHaveLength(0)
    // Nothing of the refused message was kept.
    expect(h.service.get(chatId)?.messages).toEqual([])
  })

  it('a key is never sent in the clear to another network', async () => {
    const h = harness(dir, { far: 'sk-secret', local: 'sk-local' })
    const chatId = h.service.create() as string
    const refused = h.service.send(chatId, { provider: 'far', model: 'm', text: 'x' })
    expect(refused).toMatchObject({ ok: false })
    expect(JSON.stringify(refused)).not.toContain('sk-secret')
    expect(h.pending).toHaveLength(0)

    h.service.send(chatId, { ...ASK, text: 'x' })
    await h.settle()
    expect((h.pending[0] as Pending).request.key).toBe('sk-local')
  })

  it('the model list is asked of the same address, and a failure is words', async () => {
    const h = harness(dir)
    expect(await h.service.models('local', new AbortController().signal)).toEqual({
      models: [{ id: 'llama3' }],
      error: null,
    })
    expect(await h.service.models('broken', new AbortController().signal)).toMatchObject({
      models: [],
      error: expect.stringContaining('address'),
    })
  })
})

describe('the conversations folder', () => {
  it('removing one ends its answer and tells the panes showing it', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.service.send(chatId, { ...ASK, text: 'hi' })
    await h.settle()
    ;(h.pending[0] as Pending).sink.text('half')
    const before = h.events.length
    expect(h.service.remove(chatId)).toBe(true)
    expect((h.pending[0] as Pending).request.signal.aborted).toBe(true)
    // The half answer is not written only to be deleted: one event, saying it is gone.
    expect(h.events.slice(before)).toEqual([{ type: 'snapshot', chatId, chat: null, run: null }])
    expect(h.service.active()).toEqual([])
    expect(h.lists.at(-1)).toEqual([])
    expect(readdirSync(dir)).toEqual([])
    await h.settle()
    // The aborted stream's end must not bring the file back.
    expect(readdirSync(dir)).toEqual([])
  })

  it('an id that is not one never becomes a path', () => {
    const store = new ChatStore(dir)
    expect(store.get('../settings')).toBeNull()
    expect(store.remove('../settings')).toBe(false)
  })

  it('a file renamed by hand does not answer to an id it does not carry', () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    const other = '00000000-0000-4000-8000-0000000000ff'
    writeFileSync(path.join(dir, `${other}.json`), readFileSync(path.join(dir, `${chatId}.json`)))
    expect(new ChatStore(dir).list().map((c) => c.id)).toEqual([chatId])
  })

  it('a file that does not parse is left alone and not listed', () => {
    const name = '00000000-0000-4000-8000-00000000abcd.json'
    writeFileSync(path.join(dir, name), '{ not json')
    const store = new ChatStore(dir)
    expect(store.list()).toEqual([])
    expect(readdirSync(dir)).toEqual([name])
  })

  it('refuses a new conversation past the limit rather than dropping an old one', () => {
    const h = harness(dir)
    for (let i = 0; i < AI_LIMITS.chats; i += 1) expect(h.service.create()).not.toBeNull()
    expect(h.service.create()).toBeNull()
    expect(h.service.list()).toHaveLength(AI_LIMITS.chats)
  })
})

describe('keys', () => {
  const vaultOn = (codec = stubCodec) => {
    let file: KeyFile = emptyKeyFile()
    const vault = new KeyVault({
      codec,
      load: () => file,
      save: (next) => {
        file = next
      },
    })
    return { vault, file: () => file }
  }

  it('are written encrypted, and read back by main only', () => {
    const { vault, file } = vaultOn()
    expect(vault.set('openai', '  sk-abc  ')).toBe('stored')
    expect(vault.storage('openai')).toBe('stored')
    expect(vault.get('openai')).toBe('sk-abc')
    expect(JSON.stringify(file())).not.toContain('sk-abc')
    vault.remove('openai')
    expect(vault.storage('openai')).toBeNull()
    expect(vault.get('openai')).toBeNull()
    expect(file().keys).toEqual({})
  })

  it('forgetting a key that was never held writes nothing', () => {
    let saves = 0
    const vault = new KeyVault({
      codec: stubCodec,
      load: emptyKeyFile,
      save: () => {
        saves += 1
      },
    })
    vault.remove('openai')
    expect(saves).toBe(0)
  })

  it('a key stored after a session key replaces it', () => {
    let canEncrypt = false
    const { vault, file } = vaultOn({ ...stubCodec, available: () => canEncrypt })
    expect(vault.set('openai', 'sk-one')).toBe('session')
    canEncrypt = true
    expect(vault.set('openai', 'sk-two')).toBe('stored')
    expect(vault.get('openai')).toBe('sk-two')
    expect(Object.keys(file().keys)).toEqual(['openai'])
  })

  it('stay in memory where the system cannot encrypt', () => {
    const { vault, file } = vaultOn({ ...stubCodec, available: () => false })
    expect(vault.set('openai', 'sk-abc')).toBe('session')
    expect(vault.storage('openai')).toBe('session')
    expect(vault.get('openai')).toBe('sk-abc')
    expect(file().keys).toEqual({})
  })

  it('asking whether a key is held decrypts nothing', () => {
    let decrypted = 0
    const { vault } = vaultOn({
      ...stubCodec,
      decrypt: (data) => {
        decrypted += 1
        return stubCodec.decrypt(data)
      },
    })
    vault.set('openai', 'sk-abc')
    vault.storage('openai')
    expect(decrypted).toBe(0)
  })

  it('a key that no longer decrypts is no key', () => {
    const { vault } = vaultOn({
      ...stubCodec,
      decrypt: () => {
        throw new Error('wrong machine')
      },
    })
    vault.set('openai', 'sk-abc')
    expect(vault.get('openai')).toBeNull()
  })

  it('refuses what is not a key or not a provider', () => {
    const { vault } = vaultOn()
    expect(vault.set('openai', '   ')).toBeNull()
    expect(vault.set('../x', 'sk-abc')).toBeNull()
    expect(vault.set('openai', 'x'.repeat(AI_LIMITS.key + 1))).toBeNull()
  })
})
