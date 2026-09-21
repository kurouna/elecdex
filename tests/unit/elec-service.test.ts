import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { AiProvider } from '@shared/ai'
import {
  applyElecEvent,
  defaultElecSettings,
  type ElecEvent,
  type ElecSettings,
  type ElecView,
  EMPTY_ELEC_VIEW,
  resolve,
  type Session,
} from '@shared/elec'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type {
  ProviderAdapter,
  StreamRequest,
  StreamResult,
  StreamSink,
} from '../../src/main/ai/adapter.js'
import { ElecService } from '../../src/main/ai/elec.js'
import { SessionStore } from '../../src/main/ai/store.js'

const LOCAL: AiProvider = {
  id: 'local',
  name: 'Local',
  kind: 'openai',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3',
}
const HOSTED: AiProvider = {
  id: 'hosted',
  name: 'Hosted',
  kind: 'openai',
  baseUrl: 'https://api.example.com/v1',
  model: 'big',
}
const FAR: AiProvider = { ...LOCAL, id: 'far', name: 'Far', baseUrl: 'http://far.example/v1' }

/** One answer under the test's control: pieces are pushed, then it is ended or failed. */
interface Pending {
  request: StreamRequest
  sink: StreamSink
  end(result?: StreamResult): void
  fail(error: unknown): void
}

function harness(
  dir: string,
  seats: ElecSettings['seats'],
  extra: Partial<ElecSettings> = {},
  providers: AiProvider[] = [LOCAL, HOSTED, FAR],
) {
  const events: ElecEvent[] = []
  const pending: Pending[] = []
  const timers: Array<() => void> = []
  let settings: ElecSettings = { ...defaultElecSettings(), seats, ...extra }
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

  const service = new ElecService({
    store: new SessionStore(dir),
    providers: () => providers,
    settings: () => settings,
    keyFor: (id) => (id === 'far' ? 'sk-far' : null),
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
    listChanged: () => {},
  })

  /** Folds every event so far, as a page following the deliberation would. */
  const view = (): ElecView => {
    let folded: ElecView = EMPTY_ELEC_VIEW
    for (const event of events) {
      const next = applyElecEvent(folded, event)
      if (next === 'resync') throw new Error('a delta did not fit')
      folded = next
    }
    return folded
  }

  return {
    service,
    events,
    pending,
    view,
    setSettings: (next: Partial<ElecSettings>) => {
      settings = { ...settings, ...next }
    },
    tick: () => timers.shift()?.(),
    settle: async () => {
      for (let i = 0; i < 8; i += 1) await Promise.resolve()
    },
  }
}

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-elec-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const hosted = [
  { provider: 'hosted', model: 'a' },
  { provider: 'hosted', model: 'b' },
  { provider: 'hosted', model: 'c' },
]
const local = [
  { provider: 'local', model: 'x' },
  { provider: 'local', model: 'x' },
  { provider: 'local', model: 'x' },
]

const onDisk = (id: string): Session =>
  JSON.parse(readFileSync(path.join(dir, `${id}.json`), 'utf8'))

describe('a motion', () => {
  it('is put to three units at once when each is a hosted service, and resolved from their votes', async () => {
    const h = harness(dir, hosted)
    const result = h.service.submit('Adopt the four-day week?')
    expect(result.ok).toBe(true)
    const id = (result as { sessionId: string }).sessionId
    await h.settle()

    // The motion is on disk before anyone answers.
    expect(onDisk(id)).toMatchObject({ motion: 'Adopt the four-day week?', ballots: [] })
    expect(h.pending.map((p) => p.request.model)).toEqual(['a', 'b', 'c'])
    const [first, second, third] = h.pending as [Pending, Pending, Pending]
    expect(first.request.system).toMatch(/You are UNIT-1 LOGOS\. Your standpoint:\nThe scientist/)
    expect(second.request.system).toMatch(/UNIT-2 ETHOS/)
    expect(first.request.messages).toEqual([
      { role: 'user', text: 'MOTION:\nAdopt the four-day week?' },
    ])

    first.sink.text('Productive.\nVERDICT: APPROVE\nCONFIDENCE: 80')
    first.end({ usage: { input: 50, output: 12 } })
    second.sink.text('Unfair to some.\nVERDICT: REJECT')
    second.end()
    await h.settle()
    expect(h.service.active()).toEqual([id])
    expect(h.view().live?.runs.map((r) => r.unit)).toEqual([2])

    third.sink.text('It feels right.\nVERDICT: APPROVE')
    third.end()
    await h.settle()

    const session = onDisk(id)
    expect(session.ballots.map((b) => [b.unit, b.verdict, b.confidence ?? null])).toEqual([
      [0, 'approve', 80],
      [1, 'reject', null],
      [2, 'approve', null],
    ])
    expect(resolve(session).outcome).toBe('approved')
    expect(h.service.active()).toEqual([])
    // The last word is a snapshot with nothing being written.
    expect(h.events.at(-1)).toMatchObject({ type: 'snapshot', live: null })
  })

  it('asks the units on one local server one after another', async () => {
    const h = harness(dir, local)
    h.service.submit('Rewrite it in Rust?')
    await h.settle()
    expect(h.pending).toHaveLength(1)
    expect(h.view().live?.runs).toHaveLength(1)

    h.pending[0]?.sink.text('VERDICT: REJECT')
    h.pending[0]?.end()
    await h.settle()
    expect(h.pending).toHaveLength(2)
    expect(h.pending[1]?.request.system).toMatch(/UNIT-2 ETHOS/)
  })

  it('sends its pieces gathered, where they go, to be folded by the page', async () => {
    const h = harness(dir, hosted)
    h.service.submit('Ship it?')
    await h.settle()
    const call = h.pending[1] as Pending
    call.sink.thinking('Weighing it.')
    call.sink.text('Yes, ')
    call.sink.text('ship.')
    h.tick()
    const run = h.view().live?.runs.find((r) => r.unit === 1)
    expect(run).toMatchObject({ text: 'Yes, ship.', thinking: 'Weighing it.' })
    expect(h.events.filter((e) => e.type === 'delta')).toHaveLength(1)
  })

  it('keeps the seats it was put to, whatever the settings say afterwards', async () => {
    const h = harness(dir, hosted)
    const id = (h.service.submit('Ship it?') as { sessionId: string }).sessionId
    h.setSettings({ seats: local, rule: 'unanimous' })
    await h.settle()
    expect(onDisk(id)).toMatchObject({
      rule: 'majority',
      seats: [
        { providerId: 'hosted', provider: 'Hosted', model: 'a' },
        { providerId: 'hosted', model: 'b' },
        { providerId: 'hosted', model: 'c' },
      ],
    })
    expect(h.pending.every((p) => p.request.baseUrl === 'https://api.example.com/v1')).toBe(true)
  })
})

describe('a vote that does not count', () => {
  it('is a link that failed, or an answer with no verdict - and the others still decide', async () => {
    const h = harness(dir, hosted)
    const id = (h.service.submit('Ship it?') as { sessionId: string }).sessionId
    await h.settle()
    const [first, second, third] = h.pending as [Pending, Pending, Pending]
    first.fail(
      Object.assign(new Error('fetch failed'), { cause: new Error('connect ECONNREFUSED') }),
    )
    second.sink.text('I would rather not say.')
    second.end()
    third.sink.text('VERDICT: APPROVE')
    third.end()
    await h.settle()

    const session = onDisk(id)
    expect(session.ballots.map((b) => [b.unit, b.verdict, b.stop ?? null])).toEqual([
      [0, null, 'unreachable'],
      [1, null, null],
      [2, 'approve', null],
    ])
    expect(session.ballots[0]?.error).toMatch(/could not reach api\.example\.com/)
    expect(resolve(session)).toMatchObject({ invalid: 2, approve: 1, outcome: 'no-quorum' })
  })

  it('is one whose verdict was written before its link failed', async () => {
    const h = harness(dir, hosted)
    const id = (h.service.submit('Ship it?') as { sessionId: string }).sessionId
    await h.settle()
    const first = h.pending[0] as Pending
    first.sink.text('VERDICT: APPROVE')
    first.fail(new Error('socket hang up'))
    await h.settle()
    expect(onDisk(id).ballots[0]).toMatchObject({ verdict: null, stop: 'error' })
  })
})

describe('the second round', () => {
  it("tells each unit what the others said, and resolves on the second round's votes", async () => {
    const h = harness(dir, hosted, { rounds: 2 })
    const id = (h.service.submit('Adopt the plan?') as { sessionId: string }).sessionId
    await h.settle()
    const words = ['Risky.\nVERDICT: REJECT', 'Fair.\nVERDICT: APPROVE', 'Scary.\nVERDICT: REJECT']
    h.pending.forEach((p, i) => {
      p.sink.text(words[i] ?? '')
      p.end()
    })
    await h.settle()

    expect(h.pending).toHaveLength(6)
    expect(h.view().live?.round).toBe(2)
    const again = h.pending[3]?.request.messages[0]?.text ?? ''
    expect(again).toContain('[UNIT-2 ETHOS · APPROVE]\nFair.')
    expect(again).toContain('[UNIT-3 PATHOS · REJECT]\nScary.')
    expect(again).toContain(
      'Your own statement in the first round:\n\n[UNIT-1 LOGOS · REJECT]\nRisky.',
    )
    // A statement is passed on without its vote lines: the head already says the vote.
    expect(again).not.toContain('VERDICT: APPROVE')

    for (const p of h.pending.slice(3)) {
      p.sink.text('Persuaded.\nVERDICT: APPROVE')
      p.end()
    }
    await h.settle()
    const session = onDisk(id)
    expect(session.ballots).toHaveLength(6)
    expect(resolve(session)).toMatchObject({ outcome: 'approved', approve: 3, round: 2 })
  })
})

describe('stopping', () => {
  it('keeps what was written, voids the rest, and ends at the round being voted', async () => {
    const h = harness(dir, local, { rounds: 2 })
    const id = (h.service.submit('Ship it?') as { sessionId: string }).sessionId
    await h.settle()
    h.pending[0]?.sink.text('VERDICT: APPROVE')
    h.pending[0]?.end()
    await h.settle()
    h.pending[1]?.sink.text('Half a thought')
    h.tick()

    h.service.stop(id)
    await h.settle()
    const session = onDisk(id)
    expect(session.rounds).toBe(1)
    expect(session.ballots.map((b) => [b.unit, b.verdict, b.stop ?? null, b.text])).toEqual([
      [0, 'approve', null, 'VERDICT: APPROVE'],
      [1, null, 'stopped', 'Half a thought'],
      [2, null, 'stopped', ''],
    ])
    expect(resolve(session).outcome).toBe('no-quorum')
    expect(h.service.active()).toEqual([])
    // The unit never asked is not asked after the stop either.
    expect(h.pending).toHaveLength(2)
    expect(h.events.at(-1)).toMatchObject({ type: 'snapshot', live: null })
  })

  it('by deleting: nothing of it is kept', async () => {
    const h = harness(dir, hosted)
    const id = (h.service.submit('Ship it?') as { sessionId: string }).sessionId
    await h.settle()
    expect(h.service.remove(id)).toBe(true)
    h.pending[0]?.sink.text('VERDICT: APPROVE')
    h.pending[0]?.end()
    await h.settle()
    expect(readdirSync(dir)).toEqual([])
    expect(h.events.at(-1)).toMatchObject({ type: 'snapshot', session: null })
  })
})

describe('a motion that is refused', () => {
  it('when no provider is set up, or a seat has no model', () => {
    expect(harness(dir, hosted, {}, []).service.submit('Ship it?')).toEqual({
      ok: false,
      error: 'no provider is set up - add one in settings › ai',
    })
    const bare = { ...LOCAL, id: 'bare', model: '' }
    const h = harness(dir, [{ provider: 'bare', model: '' }, ...hosted.slice(1)], {}, [
      bare,
      HOSTED,
    ])
    expect(h.service.submit('Ship it?')).toEqual({
      ok: false,
      error: 'UNIT-1 LOGOS: no model is chosen',
    })
    expect(readdirSync(dir)).toEqual([])
  })

  it('when a key would travel over plain http to another network', () => {
    const h = harness(dir, [
      { provider: 'hosted', model: 'a' },
      { provider: 'far', model: 'b' },
      { provider: 'hosted', model: 'c' },
    ])
    const result = h.service.submit('Ship it?')
    expect(result).toEqual({
      ok: false,
      error:
        'UNIT-2 ETHOS: Far: the key is not sent over plain http to another network - use https',
    })
    expect(readdirSync(dir)).toEqual([])
  })
})
