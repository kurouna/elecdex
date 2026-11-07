import { describe, expect, it } from 'vitest'
import {
  type Completion,
  type Endpoint,
  NoStopError,
  ServerAnswerError,
  ServerUnusableError,
  StalledError,
} from '../../src/main/translate/llama'
import {
  FLUSH_MS,
  LIVE_RECORD_MS,
  mergePatch,
  ORPHAN_MS,
  RELOAD_HOLD_MS,
  type RunsDeps,
  TranslateRuns,
} from '../../src/main/translate/runs'
import { applyPatch, type RunEvent, type RunView } from '../../src/shared/translate/run'

/**
 * The runs and their queue (docs/translate.md §8.5), with a made-up engine: each completion is a
 * call the test answers, so what happens while one block is written can be set up exactly.
 */

interface Call {
  prompt: string
  signal: AbortSignal
  onText: (text: string) => void
  resolve: (completion: Completion) => void
  reject: (error: unknown) => void
}

const ENDPOINT: Endpoint = { origin: 'http://127.0.0.1:1', key: 'k' }
const done = (tokens = 3): Completion => ({ stopType: 'eos', tokens, ms: 12 })

function harness(over: Partial<RunsDeps> = {}) {
  const calls: Call[] = []
  const events: RunEvent[] = []
  const timers = new Map<number, { fn: () => void; at: number }>()
  let clock = 0
  let next = 1
  let busy = 0
  const log: string[] = []
  const deps: RunsDeps = {
    ensure: async () => ENDPOINT,
    begin: () => {
      busy++
    },
    end: () => {
      busy--
    },
    settle: async () => {},
    stalled: async () => {},
    glossary: () => null,
    record: () => {},
    external: () => false,
    unreachable: () => log.push('unreachable'),
    ctx: () => 16384,
    tokenize: async (_e, text) => Math.ceil(text.length / 4),
    complete: (_e, body, signal, onText) =>
      new Promise<Completion>((resolve, reject) => {
        const call = { prompt: String(body.prompt), signal, onText, resolve, reject }
        calls.push(call)
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
    setTimer: (fn, ms) => {
      const id = next++
      timers.set(id, { fn, at: clock + ms })
      return id
    },
    clearTimer: (id) => timers.delete(id as number),
    publish: (event) => events.push(structuredClone(event)),
    ...over,
  }
  const runs = new TranslateRuns(deps)
  /** Moves the clock on and fires what came due. */
  const tick = (ms: number) => {
    clock += ms
    for (const [id, timer] of [...timers].sort((a, b) => a[1].at - b[1].at)) {
      if (timer.at > clock) continue
      timers.delete(id)
      timer.fn()
    }
  }
  const settle = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
  /** The run as a page following from the start would hold it. */
  const page = (paneId: string): RunView | null => {
    let view: RunView | null = null
    for (const event of events) {
      if (event.paneId !== paneId) continue
      if (event.kind === 'snapshot') view = event.run
      else if (view && !applyPatch(view, event)) throw new Error('a patch did not fit')
    }
    return view
  }
  return { runs, calls, events, timers, tick, settle, page, log, busy: () => busy }
}

const request = (paneId: string, text: string, tgtLang = 'ja') => ({
  paneId,
  draftId: 'd1',
  text,
  srcLang: 'en' as const,
  tgtLang,
  form: 'polite' as const,
  mode: 'translate' as const,
})

const answered = new WeakSet<Call>()

/** Answers the newest open call with `text`, and lets the run go on. */
async function answer(h: ReturnType<typeof harness>, text: string): Promise<Call> {
  await h.settle()
  // The newest call: one before it was answered, failed or called off.
  const call = h.calls.at(-1)
  if (!call || call.signal.aborted || answered.has(call)) throw new Error('nothing was asked')
  answered.add(call)
  call.onText(text)
  call.resolve(done())
  await h.settle()
  return call
}

describe('TranslateRuns', () => {
  it('writes the blocks in order, each with the two before it as history', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.\n\nTwo.\n\nThree.\n\nFour.'))
    const first = await answer(h, '一。')
    expect(first.prompt).not.toContain('Two.')
    await answer(h, '二。')
    await answer(h, '三。')
    const fourth = await answer(h, '四。')
    // Two blocks of history: Two and Three, not One.
    expect(fourth.prompt).toContain('二。')
    expect(fourth.prompt).toContain('三。')
    expect(fourth.prompt).not.toContain('一。')
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.state).toBe('done')
    expect(view?.blocks.map((b) => [b.text, b.state, b.history])).toEqual([
      ['一。', 'done', 0],
      ['二。', 'done', 1],
      ['三。', 'done', 2],
      ['四。', 'done', 2],
    ])
    expect(h.busy()).toBe(0)
  })

  it('gathers what is written and sends it every 100 ms, not piece by piece', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'Hello.'))
    await h.settle()
    const call = h.calls[0]
    if (!call) throw new Error('nothing asked')
    const before = h.events.length
    for (const piece of ['こ', 'ん', 'に', 'ち', 'は']) call.onText(piece)
    expect(h.events.length).toBe(before)
    h.tick(FLUSH_MS)
    expect(h.events.length).toBe(before + 1)
    expect(h.page('p1')?.blocks[0]?.text).toBe('こんにちは')
  })

  it('a new request from the same pane takes the place of the one being written', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'Old one.\n\nOld two.'))
    await h.settle()
    const old = h.calls[0]
    const version = h.runs.start(request('p1', 'New.'))
    expect(old?.signal.aborted).toBe(true)
    await answer(h, '新。')
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.version).toBe(version)
    expect(view?.blocks.map((b) => b.text)).toEqual(['新。'])
    expect(view?.state).toBe('done')
  })

  it("another pane's request waits its turn, and the first goes on", async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.follow('p2')
    h.runs.start(request('p1', 'A.\n\nB.'))
    h.runs.start(request('p2', 'C.'))
    h.tick(FLUSH_MS)
    expect(h.page('p2')?.state).toBe('waiting')
    await answer(h, 'あ')
    await answer(h, 'い')
    const third = await answer(h, 'う')
    expect(third.prompt).toContain('C.')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.state).toBe('done')
    expect(h.page('p2')?.state).toBe('done')
  })

  it('STOP keeps the block being written, says it, and leaves the rest untranslated', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.\n\nC.'))
    await answer(h, 'あ')
    await h.settle()
    h.calls[1]?.onText('い途')
    h.runs.stop('p1')
    await h.settle()
    const view = h.page('p1')
    expect(view?.state).toBe('stopped')
    expect(view?.blocks.map((b) => [b.text, b.state])).toEqual([
      ['あ', 'done'],
      ['い途', 'stopped'],
      ['', 'none'],
    ])
    expect(h.calls).toHaveLength(2)
    expect(h.busy()).toBe(0)
  })

  it('a change of engine stops every run with its reason', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.follow('p2')
    h.runs.start(request('p1', 'A.'))
    h.runs.start(request('p2', 'B.'))
    await h.settle()
    h.runs.stopAll('The model was changed.')
    expect(h.page('p1')?.reason).toBe('The model was changed.')
    expect(h.page('p2')?.state).toBe('stopped')
    expect(h.page('p2')?.blocks[0]?.state).toBe('none')
  })

  it('asks a block again once when the engine ends under it, from the beginning', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.calls[0]?.onText('途中')
    h.calls[0]?.reject(new TypeError('fetch failed'))
    await answer(h, 'あ')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks[0]).toMatchObject({ text: 'あ', state: 'done' })
  })

  it('stops the run when the engine ends under the same block twice', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    for (const _ of [1, 2]) {
      await h.settle()
      h.calls.at(-1)?.reject(new TypeError('fetch failed'))
    }
    await h.settle()
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.state).toBe('stopped')
    expect(view?.reason).toMatch(/engine stopped/)
    expect(view?.blocks.map((b) => b.state)).toEqual(['none', 'none'])
  })

  it('a stream without its end mark fails the block and stops the run, never taken as done', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await h.settle()
    h.calls[0]?.onText('半分')
    h.calls[0]?.reject(new NoStopError('The engine ended its answer without the end mark.'))
    await h.settle()
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.blocks.map((b) => b.state)).toEqual(['failed', 'none'])
    expect(view?.reason).toMatch(/end mark/)
    expect(h.calls).toHaveLength(1)
  })

  it('says a block cut at the length limit and goes on', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await h.settle()
    h.calls[0]?.onText('あ')
    h.calls[0]?.resolve({ stopType: 'limit', tokens: 9, ms: 1 })
    await answer(h, 'い')
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.blocks[0]?.note).toMatch(/limit/)
    expect(view?.state).toBe('done')
  })

  it('gives up history before saying a block is too long, and goes on to the next', async () => {
    // A context of 400 tokens: the third block fits only without the long one before it.
    const h = harness({ ctx: () => 400 })
    h.runs.follow('p1')
    const b = 'b'.repeat(400)
    h.runs.start(request('p1', `A.\n\n${b}\n\n${'x'.repeat(600)}\n\n${'y'.repeat(2000)}\n\nC.`))
    await answer(h, 'あ')
    await answer(h, 'い')
    const third = await answer(h, 'う')
    expect(third.prompt).not.toContain(b)
    await answer(h, 'え')
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.blocks.map((b) => b.state)).toEqual(['done', 'done', 'done', 'failed', 'done'])
    expect(view?.blocks[3]?.note).toMatch(/Too long/)
  })

  it('an external server that stops answering stops the run, said, and is not asked again', async () => {
    const h = harness({ external: () => true })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await h.settle()
    h.calls[0]?.reject(new TypeError('fetch failed'))
    await h.settle()
    h.tick(FLUSH_MS)
    expect(h.log).toContain('unreachable')
    expect(h.page('p1')?.reason).toMatch(/does not answer/)
    expect(h.calls).toHaveLength(1)
  })

  it('an external server that answers with an error is still there: refused, not unreachable', async () => {
    const h = harness({ external: () => true })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await h.settle()
    h.calls[0]?.reject(new ServerAnswerError('/completion answered HTTP 400'))
    await h.settle()
    h.tick(FLUSH_MS)
    expect(h.log).not.toContain('unreachable')
    expect(h.page('p1')?.reason).toMatch(/server refused the request/)
  })

  it("says why an external server asked again cannot be used, in the probe's own words", async () => {
    // Review 2026-11-07: a server running another model was said as one that does not answer.
    const why = 'That server does not run a PLaMo 3 Translate model.'
    const h = harness({
      external: () => true,
      ensure: async () => {
        throw new ServerUnusableError(why)
      },
    })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.reason).toBe(why)
    // The probe marked the engine as it found it: nothing more is said over it.
    expect(h.log).not.toContain('unreachable')
  })

  it('drops a run nobody follows after five seconds, stopping what it writes', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.runs.unfollow('p1')
    h.tick(ORPHAN_MS - 1)
    expect(h.runs.watching()).toEqual(['run:p1'])
    h.tick(1)
    expect(h.calls[0]?.signal.aborted).toBe(true)
    expect(h.runs.watching()).toEqual([])
  })

  it('keeps a run whose pane follows again in time (a moved pane), and gives it back whole', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await answer(h, 'あ')
    h.runs.unfollow('p1')
    h.tick(ORPHAN_MS - 100)
    const snapshot = h.runs.follow('p1')
    h.tick(ORPHAN_MS)
    expect(snapshot.kind === 'snapshot' && snapshot.run?.blocks[0]?.text).toBe('あ')
    expect(h.runs.watching()).toEqual(['run:p1'])
  })

  it('holds the clock while the page reloads, then counts five seconds from its load', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    h.runs.unfollow('p1', 'reload')
    h.tick(ORPHAN_MS * 3)
    expect(h.runs.watching()).toEqual(['run:p1'])
    h.runs.pageLoaded()
    h.tick(ORPHAN_MS)
    expect(h.runs.watching()).toEqual([])
  })

  it('does not hold a reloading page for ever', () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    h.runs.unfollow('p1', 'reload')
    h.tick(RELOAD_HOLD_MS + ORPHAN_MS)
    expect(h.runs.watching()).toEqual([])
  })

  it('stops a run asked by a pane that never follows (closed in between)', async () => {
    const h = harness()
    h.runs.start(request('p9', 'A.'))
    h.tick(ORPHAN_MS)
    expect(h.runs.watching()).toEqual([])
  })

  it('counts a page that followed before it asked', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    h.tick(ORPHAN_MS * 2)
    expect(h.runs.watching()).toEqual(['run:p1'])
  })

  it('numbers its events, so a page that missed one asks for the run again', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await answer(h, 'あ')
    h.tick(FLUSH_MS)
    await answer(h, 'い')
    h.tick(FLUSH_MS)
    const seqs = h.events.filter((e) => e.paneId === 'p1').map((e) => e.seq)
    expect(seqs).toEqual(seqs.map((_, i) => (seqs[0] ?? 0) + i))
    // A snapshot to a page that follows now carries the seq the next patch follows.
    const snapshot = h.runs.follow('p1')
    expect(snapshot.seq).toBe(seqs.at(-1))
  })
})

describe('TranslateRuns with a glossary, a context and the history', () => {
  const glossary = {
    id: 'g1',
    name: 'Terms',
    targetLang: 'ja',
    terms: [
      { source: 'pane', target: 'ペイン' },
      { source: 'window', target: 'ウィンドウ' },
    ],
  }

  it('sends each block the glossary terms it holds, and the context with every one', async () => {
    const h = harness({ glossary: (id) => (id === 'g1' ? glossary : null) })
    h.runs.follow('p1')
    h.runs.start({
      ...request('p1', 'A pane.\n\nA window.'),
      glossaryId: 'g1',
      context: 'Release notes.',
    })
    const first = await answer(h, 'あ')
    const second = await answer(h, 'い')
    expect(first.prompt).toContain('ペイン')
    expect(first.prompt).not.toContain('ウィンドウ')
    expect(second.prompt).toContain('ウィンドウ')
    for (const call of [first, second]) expect(call.prompt).toContain('Release notes.')
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.glossary).toEqual({ name: 'Terms', used: true })
    expect(view?.blocks.map((b) => b.terms)).toEqual([1, 1])
  })

  it('does not use a glossary for another target, and says so', async () => {
    const h = harness({ glossary: () => glossary })
    h.runs.follow('p1')
    h.runs.start({ ...request('p1', 'A pane.', 'fr'), glossaryId: 'g1' })
    const call = await answer(h, 'x')
    expect(call.prompt).not.toContain('ペイン')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.glossary).toEqual({ name: 'Terms', used: false })
  })

  it('records a run that wrote everything, and one stopped part way with how far it got', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await answer(h, 'あ')
    expect(records.map((r) => r.state)).toEqual(['done'])
    h.runs.start(request('p1', 'A.\n\nB.'))
    await answer(h, 'あ')
    await h.settle()
    h.runs.stop('p1')
    expect(records.at(-1)?.state).toBe('stopped')
    expect(records.at(-1)?.blocks.map((b) => b.state)).toEqual(['done', 'stopped'])
  })

  it('never records a run that wrote nothing, one replaced, or one dropped', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.runs.stop('p1')
    h.runs.start(request('p1', 'B.\n\nC.'))
    await answer(h, 'あ')
    // One that wrote a block and is then dropped, nobody following it.
    h.runs.start(request('p1', 'D.\n\nE.'))
    await answer(h, 'え')
    h.runs.unfollow('p1')
    h.tick(ORPHAN_MS)
    expect(h.runs.watching()).toEqual([])
    expect(records).toEqual([])
  })

  it('says on AUTO what the letters make certain', () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start({
      ...request('p1', 'The metrics collector now runs in its own process, and it is fast.'),
      srcLang: 'auto' as never,
    })
    expect(h.page('p1')?.detected).toBe('en')
  })

  it('puts a finished translation from the history on a pane, done, without writing it again', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.show('p1', {
      draftId: 'd9',
      srcLang: 'en',
      tgtLang: 'ja',
      form: 'polite',
      blocks: [
        {
          index: 0,
          lead: '',
          source: 'Hi.',
          text: 'やあ。',
          state: 'done',
          note: null,
          tokens: null,
          ms: null,
          history: 0,
          terms: 0,
          edited: false,
          trip: null,
        },
      ],
      tail: '',
      detected: null,
      context: '',
      glossary: null,
    })
    await h.settle()
    expect(h.page('p1')).toMatchObject({ state: 'done', draftId: 'd9' })
    expect(h.calls).toEqual([])
    expect(records).toEqual([])
  })

  it('leaves a partial entry from the history done after a ROUND TRIP, so another can follow', async () => {
    // Review 2026-11-07: its blocks never written were taken for gaps, and the run stopped.
    const h = harness()
    h.runs.follow('p1')
    const block = (index: number, source: string, text: string, state: 'done' | 'none') => ({
      index,
      lead: index === 0 ? '' : '\n\n',
      source,
      text,
      state,
      note: null,
      tokens: null,
      ms: null,
      history: 0,
      terms: 0,
      edited: false,
      trip: null,
    })
    h.runs.show('p1', {
      draftId: 'd9',
      srcLang: 'en',
      tgtLang: 'ja',
      form: 'polite',
      blocks: [block(0, 'Hi.', 'やあ。', 'done'), block(1, 'Bye.', '', 'none')],
      tail: '',
      detected: null,
      context: '',
      glossary: null,
    })
    h.runs.roundTrip('p1', 'en')
    await answer(h, 'Hi.')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.state).toBe('done')
    h.runs.roundTrip('p1', 'fr')
    const again = await answer(h, 'Salut.')
    expect(again.prompt).toContain('やあ。')
  })

  it('records what a TRANSLATE wrote, as partial, when a history entry is opened over it', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await answer(h, 'あ')
    await h.settle()
    h.runs.show('p1', {
      draftId: 'd9',
      srcLang: 'en',
      tgtLang: 'ja',
      form: 'polite',
      blocks: [],
      tail: '',
      detected: null,
      context: '',
      glossary: null,
    })
    expect(records).toHaveLength(1)
    expect(records[0]?.state).toBe('stopped')
    expect(records[0]?.blocks.map((b) => b.state)).toEqual(['done', 'stopped'])
  })
})

describe('TranslateRuns and LIVE, EDIT, RETRY, ROUND TRIP', () => {
  const live = (paneId: string, text: string) => ({
    ...request(paneId, text),
    mode: 'live' as const,
  })

  it('LIVE writes again only the blocks that changed, taking the rest from the run it replaces', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.\n\nTwo.'))
    await answer(h, 'いち')
    await answer(h, 'に')
    h.runs.start(live('p1', 'One.\n\nTwo, changed.\n\nThree.'))
    const changed = await answer(h, 'に改')
    expect(changed.prompt).toContain('Two, changed.')
    await answer(h, 'さん')
    h.tick(FLUSH_MS)
    // Three asked in all for the second run: the unchanged first block was not.
    expect(h.calls).toHaveLength(4)
    expect(h.page('p1')?.blocks.map((b) => b.text)).toEqual(['いち', 'に改', 'さん'])
  })

  it('LIVE takes nothing from a run in other languages, or with another context', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.start({ ...live('p1', 'One.'), tgtLang: 'fr' })
    await answer(h, 'un')
    h.runs.start({ ...live('p1', 'One.'), tgtLang: 'fr', context: 'x' })
    await answer(h, 'un')
    expect(h.calls).toHaveLength(3)
  })

  it('records a LIVE run once its draft has rested, and never one replaced or stopped before', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.'))
    await answer(h, 'いち')
    h.tick(LIVE_RECORD_MS - 1)
    // Typed on before it rested: that one is never recorded.
    h.runs.start(live('p1', 'One. And on.'))
    await answer(h, 'いち、続き')
    h.tick(LIVE_RECORD_MS)
    expect(records.map((r) => r.blocks[0]?.text)).toEqual(['いち、続き'])
    h.runs.start(live('p1', 'Other.'))
    await h.settle()
    h.runs.stop('p1')
    h.tick(LIVE_RECORD_MS)
    expect(records).toHaveLength(1)
  })

  it('stops a LIVE run when its pane goes out of sight, and leaves a TRANSLATE one alone', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.runs.cancelLive('p1')
    expect(h.calls[0]?.signal.aborted).toBe(false)
    h.runs.start(live('p1', 'B.'))
    await h.settle()
    h.runs.cancelLive('p1')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.state).toBe('stopped')
  })

  it('takes a block mended by hand as history for the ones written after it', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.\n\nTwo.\n\nThree.'))
    await answer(h, 'いち')
    // Mended while the second is written: the third takes the mended text as history.
    h.runs.editBlock('p1', 0, '一（直した）')
    const second = await answer(h, 'に')
    expect(second.prompt).not.toContain('一（直した）')
    const third = await answer(h, 'さん')
    expect(third.prompt).toContain('一（直した）')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks[0]).toMatchObject({ text: '一（直した）', edited: true })
  })

  it('RETRY writes one block again in its place, with the blocks before it as history', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.\n\nTwo.'))
    await answer(h, 'いち')
    await answer(h, 'に')
    h.runs.retry('p1', 0)
    const again = await answer(h, 'イチ')
    expect(again.prompt).not.toContain('に')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks.map((b) => b.text)).toEqual(['イチ', 'に'])
    expect(h.page('p1')?.state).toBe('done')
  })

  it('RETRY after STOP writes that block and leaves the run stopped, recorded partial', async () => {
    // Review 2026-11-07: the run used to end "done" with blocks never translated.
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.\n\nTwo.\n\nThree.'))
    await answer(h, 'いち')
    await h.settle()
    h.runs.stop('p1')
    h.runs.retry('p1', 1)
    await answer(h, 'に')
    await h.settle()
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.blocks.map((b) => b.state)).toEqual(['done', 'done', 'none'])
    expect(view?.state).toBe('stopped')
    expect(view?.reason).toMatch(/Not every block/)
    expect(records.at(-1)?.state).toBe('stopped')
    // Retried to the end, it is done.
    h.runs.retry('p1', 2)
    await answer(h, 'さん')
    await h.settle()
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.state).toBe('done')
    expect(records.at(-1)?.state).toBe('done')
  })

  it('ROUND TRIP puts every written block back, scores it, and records the run once', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'Hello.\n\nBye.'))
    await answer(h, 'こんにちは。')
    await answer(h, 'さようなら。')
    h.runs.roundTrip('p1', 'en')
    const back = await answer(h, 'Hello.')
    // Into the source language, from the target, with no history.
    expect(back.prompt).toContain('こんにちは。')
    expect(back.prompt).not.toContain('Bye.')
    await answer(h, 'Good bye.')
    h.tick(FLUSH_MS)
    const view = h.page('p1')
    expect(view?.blocks.map((b) => [b.trip?.text, b.trip?.state])).toEqual([
      ['Hello.', 'done'],
      ['Good bye.', 'done'],
    ])
    expect(view?.blocks[0]?.trip?.score).toBe(100)
    expect(view?.blocks[1]?.trip?.score).toBeLessThan(100)
    expect(view?.state).toBe('done')
    expect(records).toHaveLength(1)
  })

  it('a new request takes the round trips still waiting with it', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await answer(h, 'あ')
    await answer(h, 'い')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    h.runs.start(request('p1', 'C.'))
    await answer(h, 'う')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks.map((b) => b.trip)).toEqual([null])
  })
})

describe('TranslateRuns, round trips and the history together', () => {
  const live = (paneId: string, text: string) => ({
    ...request(paneId, text),
    mode: 'live' as const,
  })

  it('never records a LIVE run while its round trips are written; it waits for them', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    h.tick(LIVE_RECORD_MS)
    expect(records).toEqual([])
    await answer(h, 'One.')
    h.tick(LIVE_RECORD_MS)
    expect(records.map((r) => r.state)).toEqual(['done'])
  })

  it('calls off the round trip of a block that is written again or mended', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    const trip = h.calls.at(-1)
    h.runs.retry('p1', 0)
    expect(trip?.signal.aborted).toBe(true)
    await answer(h, 'イチ')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks[0]).toMatchObject({ text: 'イチ', trip: null })
  })

  it('keeps a LIVE run’s round trips of the blocks that did not change', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.\n\nTwo.'))
    await answer(h, 'いち')
    await answer(h, 'に')
    h.runs.roundTrip('p1', 'en')
    await answer(h, 'One.')
    await answer(h, 'Two.')
    h.runs.start(live('p1', 'One.\n\nTwo, changed.'))
    await answer(h, 'に改')
    h.runs.roundTrip('p1', 'en')
    const back = await answer(h, 'Two, changed.')
    // Only the changed block went back: the first kept its trip.
    expect(back.prompt).toContain('に改')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks.map((b) => b.trip?.state)).toEqual(['done', 'done'])
    expect(h.calls).toHaveLength(6)
  })

  it('asks every block again when the trips go into another language', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.roundTrip('p1', 'en')
    await answer(h, 'One.')
    h.runs.roundTrip('p1', 'fr')
    const back = await answer(h, 'Un.')
    expect(back.prompt).toContain('lang<|plamo:val|>fr')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks[0]?.trip).toMatchObject({ text: 'Un.', lang: 'fr' })
  })

  it('compares nothing of a stopped translation', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.\n\nTwo.'))
    await answer(h, 'いち')
    await h.settle()
    h.runs.stop('p1')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    expect(h.calls).toHaveLength(2)
  })

  it('calls off a round trip being written when the pane asks anew', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    const trip = h.calls.at(-1)
    h.runs.start(request('p1', 'Two.'))
    expect(trip?.signal.aborted).toBe(true)
  })

  it('goes back politely into Japanese, and with no form into anything else', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start({ ...request('p1', 'Bonjour.'), srcLang: 'fr', tgtLang: 'ja' })
    await answer(h, 'こんにちは。')
    h.runs.roundTrip('p1', 'fr')
    const intoFrench = await answer(h, 'Bonjour.')
    expect(intoFrench.prompt).not.toContain('form')
    h.runs.start({ ...request('p1', 'Hello.'), srcLang: 'en', tgtLang: 'en' })
    h.runs.start({ ...request('p2', 'Hello.'), srcLang: 'en', tgtLang: 'fr' })
    h.runs.follow('p2')
    await answer(h, 'Hello.')
    await answer(h, 'Bonjour.')
    h.runs.roundTrip('p2', 'ja')
    const intoJapanese = await answer(h, 'こんにちは。')
    expect(intoJapanese.prompt).toContain('form<|plamo:val|>polite')
  })

  it('never records a LIVE run whose pane closed before it rested', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.unfollow('p1')
    h.tick(ORPHAN_MS)
    h.tick(LIVE_RECORD_MS)
    expect(records).toEqual([])
  })

  it('writes a mended LIVE run into the history again, once its draft has rested', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(live('p1', 'One.'))
    await answer(h, 'いち')
    h.tick(LIVE_RECORD_MS)
    h.runs.editBlock('p1', 0, '一')
    expect(records).toHaveLength(1)
    h.tick(LIVE_RECORD_MS)
    expect(records.map((r) => r.blocks[0]?.text)).toEqual(['いち', '一'])
    h.runs.retry('p1', 0)
    await answer(h, 'イチ')
    h.tick(LIVE_RECORD_MS)
    expect(records.map((r) => r.blocks[0]?.text)).toEqual(['いち', '一', 'イチ'])
  })

  it('writes a mended TRANSLATE run into the history again', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.editBlock('p1', 0, '一')
    expect(records.map((r) => r.blocks[0]?.text)).toEqual(['いち', '一'])
  })
})

describe('TranslateRuns, items once left for later', () => {
  const live = (paneId: string, text: string) => ({
    ...request(paneId, text),
    mode: 'live' as const,
  })

  it('LIVE writes a block again when the glossary terms it takes have changed', async () => {
    let terms = [{ source: 'pane', target: 'ペイン' }]
    const h = harness({
      glossary: () => ({ id: 'g1', name: 'Terms', targetLang: 'ja', terms }),
    })
    h.runs.follow('p1')
    h.runs.start({ ...live('p1', 'A pane.\n\nOther.'), glossaryId: 'g1' })
    await answer(h, 'ペイン。')
    await answer(h, '他。')
    terms = [{ source: 'pane', target: '窓枠' }]
    h.runs.start({ ...live('p1', 'A pane.\n\nOther.'), glossaryId: 'g1' })
    const again = await answer(h, '窓枠。')
    expect(again.prompt).toContain('窓枠')
    h.tick(FLUSH_MS)
    // The block without the term was kept.
    expect(h.calls).toHaveLength(3)
  })

  it('says a RETRY waits behind another pane’s block, not that it runs', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.follow('p2')
    h.runs.start(request('p1', 'A.'))
    await answer(h, 'あ')
    h.runs.start(request('p2', 'B.'))
    await h.settle()
    h.runs.retry('p1', 0)
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.state).toBe('waiting')
  })

  it('stops a server that answered nothing before the block is asked again, and only then', async () => {
    const seen: string[] = []
    const h = harness({
      settle: async () => {
        seen.push('settle')
      },
      stalled: async () => {
        seen.push('stalled')
      },
    })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    // Nothing came: the wedged server is stopped, never waited for.
    h.calls[0]?.reject(new StalledError('Nothing came for 60 s.'))
    await h.settle()
    expect(seen).toEqual(['stalled'])
    await answer(h, 'あ')
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks[0]?.state).toBe('done')
    // A crash (the connection lost) is waited for, as before.
    h.runs.start(request('p1', 'B.'))
    await h.settle()
    h.calls.at(-1)?.reject(new TypeError('fetch failed'))
    await h.settle()
    expect(seen).toEqual(['stalled', 'settle'])
  })

  it('stops a server that answers nothing on the second attempt too, and under a round trip', async () => {
    let stalled = 0
    const h = harness({
      stalled: async () => {
        stalled++
      },
    })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.calls[0]?.reject(new StalledError('Nothing came for 60 s.'))
    await h.settle()
    h.calls[1]?.reject(new StalledError('Nothing came for 60 s.'))
    await h.settle()
    // Not asked a third time, but the second wedged server is stopped as the first was.
    expect(h.page('p1')?.blocks[0]?.state).not.toBe('done')
    expect(stalled).toBe(2)
    h.runs.start(request('p1', 'B.'))
    await answer(h, 'び')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    h.calls.at(-1)?.reject(new StalledError('Nothing came for 60 s.'))
    await h.settle()
    expect(h.page('p1')?.blocks[0]?.trip?.state).toBe('failed')
    expect(stalled).toBe(3)
  })

  it('puts a Japanese block back in its own form: だ・である stays plain', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start({ ...request('p1', '隣の客はよく柿食う客だ', 'en'), srcLang: 'ja' })
    await answer(h, 'The guest next door eats a lot of persimmons.')
    h.runs.roundTrip('p1', 'ja')
    await h.settle()
    expect(h.calls.at(-1)?.prompt).toContain('form<|plamo:val|>plain')
    expect(h.calls.at(-1)?.prompt).not.toContain('polite')
  })

  it('gives a round trip room by its block, and fails one cut at the limit', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.'))
    await answer(h, 'いち')
    h.runs.roundTrip('p1', 'en')
    await h.settle()
    const trip = h.calls.at(-1)
    trip?.onText('One')
    trip?.resolve({ stopType: 'limit', tokens: 1, ms: 1 })
    await h.settle()
    h.tick(FLUSH_MS)
    expect(h.page('p1')?.blocks[0]?.trip?.state).toBe('failed')
  })
})

describe('TranslateRuns and CLEAR', () => {
  it('puts the run away: stops what it writes, tells the pages, records nothing', async () => {
    const records: RunView[] = []
    const h = harness({ record: (view) => records.push(view) })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'One.\n\nTwo.'))
    await answer(h, 'いち')
    await h.settle()
    h.runs.discard('p1')
    expect(h.calls.at(-1)?.signal.aborted).toBe(true)
    expect(h.events.at(-1)).toMatchObject({ kind: 'snapshot', run: null, cleared: true })
    expect(h.runs.watching()).toEqual([])
    await h.settle()
    expect(records).toEqual([])
    // A page that follows again is given nothing.
    expect(h.runs.follow('p1')).toMatchObject({ kind: 'snapshot', run: null })
  })
})

describe('TranslateRuns and asking again', () => {
  it('does not ask again what the server refused (an HTTP error), and says it refused', async () => {
    const h = harness()
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.\n\nB.'))
    await h.settle()
    h.calls[0]?.reject(new ServerAnswerError('/completion answered HTTP 400'))
    await h.settle()
    h.tick(FLUSH_MS)
    expect(h.calls).toHaveLength(1)
    expect(h.page('p1')?.reason).toBe(
      'The engine refused the request: /completion answered HTTP 400',
    )
  })

  it('never starts the engine again for a run stopped while the last attempt settled', async () => {
    let ensures = 0
    let release: () => void = () => {}
    const h = harness({
      ensure: async () => {
        ensures++
        return ENDPOINT
      },
      settle: () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.calls[0]?.reject(new TypeError('fetch failed'))
    await h.settle()
    h.runs.stop('p1')
    release()
    await h.settle()
    expect(ensures).toBe(1)
    expect(h.calls).toHaveLength(1)
  })

  it('waits for the engine to settle before it asks again', async () => {
    const order: string[] = []
    const h = harness({
      settle: async () => {
        order.push('settle')
      },
      ensure: async () => {
        order.push('ensure')
        return ENDPOINT
      },
    })
    h.runs.follow('p1')
    h.runs.start(request('p1', 'A.'))
    await h.settle()
    h.calls[0]?.reject(new TypeError('fetch failed'))
    await h.settle()
    expect(order).toEqual(['ensure', 'settle', 'ensure'])
  })
})

describe('mergePatch', () => {
  it('appends in order, and a whole text drops what came before it', () => {
    expect(mergePatch({ index: 0, append: 'a' }, { index: 0, append: 'b' })).toEqual({
      index: 0,
      append: 'ab',
    })
    expect(mergePatch({ index: 0, append: 'a' }, { index: 0, text: '', append: 'c' })).toEqual({
      index: 0,
      text: '',
      append: 'c',
    })
    expect(mergePatch({ index: 0, text: '' }, { index: 0, append: 'd', state: 'done' })).toEqual({
      index: 0,
      text: '',
      append: 'd',
      state: 'done',
    })
  })
})
