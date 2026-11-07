import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EngineView as EngineState, TranslateBoard } from '../../src/shared/translate/board'
import { MODELS } from '../../src/shared/translate/models'
import { TRANSLATE_DEFAULTS } from '../../src/shared/translate/settings'
import { stubMatchMedia, stubResizeObserver } from './support/dom.ts'
import { settle } from './support/settle.ts'

const { default: SetupView } = await import('../../src/renderer/widgets/translate/SetupView.svelte')
const { default: EngineView } = await import(
  '../../src/renderer/widgets/translate/EngineView.svelte'
)

/**
 * SETUP's LICENCE step and the external server's TEST (docs/translate.md §3): the licence is agreed
 * to only after its page is opened for that agreement, and a test with nothing typed asks the
 * saved server again with its own scheme.
 */

let translate: Record<string, ReturnType<typeof vi.fn>>

const engine = (over: Partial<EngineState> = {}): EngineState => ({
  phase: 'stopped',
  source: 'fetched',
  build: 'b12110',
  backend: null,
  device: null,
  port: null,
  ctx: 16384,
  error: null,
  fallback: null,
  bootLines: [],
  externalHost: null,
  externalLoopback: false,
  externalOrigin: null,
  serverModels: [],
  serverProblem: null,
  own: null,
  fetched: true,
  toFetchBytes: 0,
  ...over,
})

const AGREED = 'plamo3-2b-q4km'
const board = (over: Partial<TranslateBoard> = {}): TranslateBoard => ({
  engine: engine(),
  models: MODELS.map((m) => ({
    id: m.id,
    installed: false,
    partialBytes: 0,
    revision: null,
    update: null,
    consentAt: m.id === AGREED ? '2026-11-06T00:00:00.000Z' : null,
  })),
  fetch: null,
  fetchingModel: null,
  selectedModel: AGREED,
  library: 0,
  machine: { ramGB: 16, vramGB: null, gpu: null, freeBytes: null },
  ...over,
})

beforeEach(() => {
  stubMatchMedia()
  stubResizeObserver()
  translate = {
    openLicence: vi.fn(async () => undefined),
    consent: vi.fn(async () => ({ revision: 'b'.repeat(40) })),
    fetch: vi.fn(async () => ({ problem: 'stop here' })),
    testExternal: vi.fn(async () => ({ ok: false, problem: 'no' })),
    checkUpdates: vi.fn(async () => undefined),
    removeModel: vi.fn(async () => undefined),
    setSource: vi.fn(async () => null),
    logs: vi.fn(async () => []),
    selfTest: vi.fn(async () => ({ problem: 'no' })),
  }
  vi.stubGlobal('elecdex', { translate })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function licence(chosen: string, over: Partial<TranslateBoard> = {}) {
  return render(SetupView, {
    props: {
      board: board(over),
      step: 3,
      chosen,
      onstep: () => {},
      onselect: () => {},
      oncommit: async () => {},
      ondone: () => {},
    },
  })
}

const agree = () => screen.getByTestId('translate-agree') as HTMLButtonElement

describe('SETUP’s LICENCE', () => {
  it('asks a model not agreed to for the licence’s page, even after one that was', async () => {
    const view = licence(AGREED)
    await settle()
    // Agreed to before: both boxes ticked, nothing to open.
    expect(agree().disabled).toBe(false)
    expect(agree().getAttribute('aria-checked')).toBe('true')
    // Back to MODEL and another model: its agreement needs the page opened for it.
    await view.rerender({ chosen: 'plamo3-0.8b-q4km' })
    await settle()
    expect(agree().disabled).toBe(true)
    expect(agree().getAttribute('aria-checked')).toBe('false')
    await fireEvent.click(screen.getByTestId('translate-licence-open'))
    await settle()
    expect(translate.openLicence).toHaveBeenCalledWith('plamo')
    expect(agree().disabled).toBe(false)
  })

  it('spends an opening on one agreement: the next model asks for the page again', async () => {
    const view = licence('plamo3-0.8b-q4km')
    await fireEvent.click(screen.getByTestId('translate-licence-open'))
    await settle()
    await fireEvent.click(agree())
    await fireEvent.click(screen.getByTestId('translate-agree-fetch'))
    await settle()
    await fireEvent.click(screen.getByTestId('translate-next'))
    // afterBlink, then the consent and the fetch's answer.
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
    expect(translate.consent).toHaveBeenCalledWith('plamo3-0.8b-q4km')
    await view.rerender({ chosen: 'plamo3-0.8b-q40' })
    await settle()
    expect(agree().disabled).toBe(true)
  })

  it('lists the engine with what Agree and fetch brings when elecdex fetches it', async () => {
    licence(AGREED, { engine: engine({ fetched: false, toFetchBytes: 62_000_000 }) })
    await settle()
    expect(screen.getByTestId('translate-setup').textContent).toMatch(
      /llama\.cpp b12110 · 62 MB · github\.com · MIT/,
    )
  })
})

describe('ENGINE and the newest commits', () => {
  function engineView(over: Partial<TranslateBoard>, onupdate = vi.fn()) {
    render(EngineView, {
      props: {
        board: board(over),
        settings: TRANSLATE_DEFAULTS,
        chosen: AGREED,
        onpick: () => {},
        onsetup: () => {},
        onupdate,
        ondone: () => {},
      },
    })
    return onupdate
  }

  it('asks main to look for newer commits as it opens', async () => {
    engineView({})
    await settle()
    expect(translate.checkUpdates).toHaveBeenCalledTimes(1)
  })

  it('says another model’s download comes first, and holds UPDATE until it is done (review 2026-11-07)', async () => {
    const onsetup = vi.fn()
    const models = board().models.map((m) =>
      m.id === AGREED
        ? {
            ...m,
            installed: true,
            revision: 'a'.repeat(40),
            update: { revision: 'e'.repeat(40), date: '2026-11-06T00:49:00.000Z' },
          }
        : m,
    )
    const fetch = {
      kind: 'model' as const,
      id: 'plamo3-0.8b-q4km',
      phase: 'paused' as const,
      received: 1,
      total: 2,
      speed: 0,
      error: null,
    }
    render(EngineView, {
      props: {
        board: board({ models, fetch, fetchingModel: 'plamo3-0.8b-q4km' }),
        settings: TRANSLATE_DEFAULTS,
        chosen: AGREED,
        onpick: () => {},
        onsetup,
        onupdate: () => {},
        ondone: () => {},
      },
    })
    await settle()
    expect(screen.getByTestId('translate-fetch-left').textContent).toMatch(
      /plamo-3-translate-0\.8b-q4km's download is paused: setting up or updating another model waits/,
    )
    expect((screen.getByTestId('translate-update') as HTMLButtonElement).disabled).toBe(true)
    await fireEvent.click(screen.getByTestId('translate-fetch-left-open'))
    expect(onsetup).toHaveBeenCalledWith(4)
  })

  it('offers UPDATE, with the date, for a model behind its repository', async () => {
    const models = board().models.map((m) =>
      m.id === AGREED
        ? {
            ...m,
            installed: true,
            revision: 'a'.repeat(40),
            update: { revision: 'e'.repeat(40), date: '2026-11-06T00:49:00.000Z' },
          }
        : m,
    )
    const onupdate = engineView({ models })
    await settle()
    expect(screen.getByTestId('translate-engine').textContent).toContain('newer, 2026-11-06')
    await fireEvent.click(screen.getByTestId('translate-update'))
    expect(onupdate).toHaveBeenCalledWith(AGREED)
  })

  it('marks the model in use, and says a choice waits for DONE (review 2026-11-07)', async () => {
    const models = board().models.map((m) => (m.id === AGREED ? { ...m, installed: true } : m))
    render(EngineView, {
      props: {
        board: board({ models }),
        settings: TRANSLATE_DEFAULTS,
        chosen: 'plamo3-0.8b-q4km',
        onpick: () => {},
        onsetup: () => {},
        onupdate: () => {},
        ondone: () => {},
      },
    })
    await settle()
    expect(screen.getByTestId('translate-in-use').closest('.acts')).not.toBeNull()
    expect(screen.getByTestId('translate-model-pending').textContent).toMatch(
      /plamo-3-translate-0\.8b-q4km is chosen: Set up this model › fetches it; leaving otherwise keeps plamo-3-translate-2b-q4km/,
    )
  })

  it('deletes a model only on a second press, saying what the first one would do', async () => {
    translate.removeModel = vi.fn(async () => undefined)
    const models = board().models.map((m) => (m.id === AGREED ? { ...m, installed: true } : m))
    engineView({ models })
    await settle()
    const del = screen.getByTestId('translate-delete')
    await fireEvent.click(del)
    expect(translate.removeModel).not.toHaveBeenCalled()
    expect(del.textContent).toMatch(/stopping the engine/)
    await fireEvent.click(del)
    expect(translate.removeModel).toHaveBeenCalledWith(AGREED)
  })

  it('stops an engine that is starting, and starts one on standby', async () => {
    translate.engineStop = vi.fn(async () => undefined)
    translate.engineStart = vi.fn(async () => undefined)
    engineView({ engine: engine({ phase: 'starting' }) })
    await settle()
    const stop = screen.getByTestId('translate-engine-stop') as HTMLButtonElement
    expect(stop.disabled).toBe(false)
    cleanup()
    engineView({ engine: engine({ phase: 'stopped' }) })
    await settle()
    await fireEvent.click(screen.getByTestId('translate-engine-start'))
    expect(translate.engineStart).toHaveBeenCalled()
  })

  it('switches to a llama-server chosen before without its picker, which Choose… opens', async () => {
    translate.pickOwn = vi.fn(async () => null)
    engineView({ engine: engine({ own: { name: 'llama-server.exe', build: 12110 } }) })
    await settle()
    await fireEvent.click(screen.getByRole('button', { name: /My own llama-server/ }))
    expect(translate.setSource).toHaveBeenCalledWith('own')
    expect(translate.pickOwn).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('button', { name: 'Choose…' }))
    expect(translate.pickOwn).toHaveBeenCalled()
  })

  it('says why an external server is not used, and tests an address on Enter', async () => {
    engineView({
      engine: engine({
        source: 'external',
        phase: 'external-unreachable',
        externalHost: '127.0.0.1:8210',
        externalOrigin: 'http://127.0.0.1:8210',
        serverProblem: 'That server does not run a PLaMo 3 Translate model.',
      }),
    })
    await settle()
    expect(screen.getByTestId('translate-server-models').textContent).toContain(
      'does not run a PLaMo',
    )
    expect(screen.getByTestId('translate-external-saved').textContent).toContain(
      'In use: http://127.0.0.1:8210',
    )
    const field = screen.getByLabelText('Server address')
    await fireEvent.input(field, { target: { value: 'http://127.0.0.1:9000' } })
    await fireEvent.keyDown(field, { key: 'Enter' })
    expect(translate.testExternal).toHaveBeenCalledWith('http://127.0.0.1:9000')
  })

  it('offers no UPDATE for a model at its newest commit', async () => {
    const models = board().models.map((m) => (m.id === AGREED ? { ...m, installed: true } : m))
    engineView({ models })
    await settle()
    expect(screen.queryByTestId('translate-update')).toBeNull()
  })
})

describe('SETUP’s agreement when Hugging Face does not answer', () => {
  it('says so and stays on LICENCE, fetching nothing', async () => {
    translate.consent = vi.fn(async () => ({
      problem: 'Hugging Face did not answer: try again in a while.',
    }))
    const onstep = vi.fn()
    render(SetupView, {
      props: {
        board: board(),
        step: 3,
        chosen: 'plamo3-0.8b-q4km',
        onstep,
        onselect: () => {},
        oncommit: async () => {},
        ondone: () => {},
      },
    })
    await fireEvent.click(screen.getByTestId('translate-licence-open'))
    await settle()
    await fireEvent.click(agree())
    await fireEvent.click(screen.getByTestId('translate-agree-fetch'))
    await settle()
    await fireEvent.click(screen.getByTestId('translate-next'))
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
    expect(screen.getByTestId('translate-problem').textContent).toMatch(/did not answer/)
    expect(translate.fetch).not.toHaveBeenCalled()
    expect(onstep).not.toHaveBeenCalled()
  })
})

describe('TEST of an external server with nothing typed', () => {
  const saved = engine({
    source: 'external',
    externalHost: 'llm.example.test:8443',
    externalOrigin: 'https://llm.example.test:8443',
  })

  it('asks the saved server again with its scheme, in ENGINE', async () => {
    render(EngineView, {
      props: {
        board: board({ engine: saved }),
        settings: TRANSLATE_DEFAULTS,
        chosen: AGREED,
        onpick: () => {},
        onsetup: () => {},
        onupdate: () => {},
        ondone: () => {},
      },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Test' }))
    expect(translate.testExternal).toHaveBeenCalledWith('https://llm.example.test:8443')
  })

  it('asks the saved server again with its scheme, in SETUP', async () => {
    render(SetupView, {
      props: {
        board: board({ engine: saved }),
        step: 1,
        chosen: AGREED,
        onstep: () => {},
        onselect: () => {},
        oncommit: async () => {},
        ondone: () => {},
      },
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Test' }))
    expect(translate.testExternal).toHaveBeenCalledWith('https://llm.example.test:8443')
  })
})

describe('SETUP with a tested external server', () => {
  // User's request 2026-11-07: the server runs its own model, so nothing is chosen or fetched.
  const ready = engine({
    source: 'external',
    phase: 'external-ready',
    externalHost: '127.0.0.1:8210',
    externalOrigin: 'http://127.0.0.1:8210',
    serverModels: [{ name: 'plamo-3-translate-0.8b-kansai.gguf', bytes: null, params: null }],
  })

  it('goes from ENGINE straight to READY', async () => {
    const onstep = vi.fn()
    render(SetupView, {
      props: {
        board: board({ engine: ready }),
        step: 1,
        chosen: AGREED,
        onstep,
        onselect: () => {},
        oncommit: async () => {},
        ondone: () => {},
      },
    })
    await fireEvent.click(screen.getByTestId('translate-next'))
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(onstep).toHaveBeenCalledWith(5)
  })

  it("names the server's model on READY, not the one chosen here", async () => {
    render(SetupView, {
      props: {
        board: board({ engine: ready }),
        step: 5,
        chosen: AGREED,
        onstep: () => {},
        onselect: () => {},
        oncommit: async () => {},
        ondone: () => {},
      },
    })
    await settle()
    const text = screen.getByTestId('translate-selftest').textContent ?? ''
    expect(text).toContain('plamo-3-translate-0.8b-kansai')
    expect(text).not.toContain('2b')
  })
})

describe('SETUP fetching a model beside the one in use', () => {
  // User's choice 2026-11-07: the model in use goes on translating while another is fetched, and
  // the fetched one becomes the settings' at READY - before its self test, so that test is its.
  const OTHER = 'plamo3-0.8b-q4km'
  const inUse = (over: Partial<TranslateBoard> = {}) =>
    board({
      models: board().models.map((m) =>
        m.id === AGREED ? { ...m, installed: true } : { ...m, consentAt: '2026-11-06T00:00:00Z' },
      ),
      ...over,
    })

  it('fetches the model chosen without making it the settings’', async () => {
    translate.fetch = vi.fn(async () => null)
    const oncommit = vi.fn(async () => {})
    const onstep = vi.fn()
    render(SetupView, {
      props: {
        board: inUse(),
        step: 3,
        chosen: OTHER,
        onstep,
        onselect: () => {},
        oncommit,
        ondone: () => {},
      },
    })
    await settle()
    await fireEvent.click(screen.getByTestId('translate-next'))
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
    expect(translate.fetch).toHaveBeenCalledWith(OTHER)
    expect(oncommit).not.toHaveBeenCalled()
    expect(onstep).toHaveBeenCalledWith(4)
  })

  it('says on FETCH that the model in use goes on translating', async () => {
    const fetch = {
      kind: 'model' as const,
      id: OTHER,
      phase: 'downloading' as const,
      received: 1,
      total: 10,
      speed: 0,
      error: null,
    }
    render(SetupView, {
      props: {
        board: inUse({ fetch, fetchingModel: OTHER }),
        step: 4,
        chosen: OTHER,
        onstep: () => {},
        onselect: () => {},
        oncommit: async () => {},
        ondone: () => {},
      },
    })
    await settle()
    expect(screen.getByTestId('translate-fetch-in-use').textContent).toMatch(
      /plamo-3-translate-2b-q4km goes on translating meanwhile; plamo-3-translate-0\.8b-q4km takes over at Ready/,
    )
  })

  it('moves to READY once the model chosen is in place, though another is in use', async () => {
    const onstep = vi.fn()
    const placed = inUse()
    placed.models = placed.models.map((m) => (m.id === OTHER ? { ...m, installed: true } : m))
    render(SetupView, {
      props: {
        board: placed,
        step: 4,
        chosen: OTHER,
        onstep,
        onselect: () => {},
        oncommit: async () => {},
        ondone: () => {},
      },
    })
    await settle()
    expect(onstep).toHaveBeenCalledWith(5)
  })

  it('makes the model the settings’ on READY before asking for the self test', async () => {
    const order: string[] = []
    let commit!: () => void
    const oncommit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          commit = () => {
            order.push('commit')
            resolve()
          }
        }),
    )
    translate.selfTest = vi.fn(async () => {
      order.push('selfTest')
      return { text: 'おはよう', tokensPerSecond: 50 }
    })
    render(SetupView, {
      props: {
        board: inUse({
          models: inUse().models.map((m) => (m.id === OTHER ? { ...m, installed: true } : m)),
        }),
        step: 5,
        chosen: OTHER,
        onstep: () => {},
        onselect: () => {},
        oncommit,
        ondone: () => {},
      },
    })
    await settle()
    expect(oncommit).toHaveBeenCalledOnce()
    expect(translate.selfTest).not.toHaveBeenCalled()
    commit()
    await settle()
    expect(order).toEqual(['commit', 'selfTest'])
  })
})

describe('SETUP when the download ends without the model in place', () => {
  // Review 2026-11-07: cancelled in another pane, FETCH let NEXT through to READY, which made a
  // model not in place the settings' and left every pane without the one that translated.
  const OTHER = 'plamo3-0.8b-q4km'
  const fetch = {
    kind: 'model' as const,
    id: OTHER,
    phase: 'downloading' as const,
    received: 1,
    total: 10,
    speed: 0,
    error: null,
  }
  const inUse = (over: Partial<TranslateBoard> = {}) =>
    board({
      models: board().models.map((m) => (m.id === AGREED ? { ...m, installed: true } : m)),
      ...over,
    })
  const props = (b: TranslateBoard, step: number, oncommit = vi.fn(async () => {})) => ({
    board: b,
    step,
    chosen: OTHER,
    onstep: vi.fn(),
    onselect: () => {},
    oncommit,
    ondone: () => {},
  })

  it('says so on FETCH, keeps NEXT off, and goes back to the models', async () => {
    const p = props(inUse({ fetch, fetchingModel: OTHER }), 4)
    const view = render(SetupView, { props: p })
    await settle()
    expect(screen.queryByTestId('translate-fetch-gone')).toBeNull()
    await view.rerender({ board: inUse() })
    await settle()
    expect(screen.getByTestId('translate-fetch-gone').textContent).toMatch(
      /ended without plamo-3-translate-0\.8b-q4km in place/,
    )
    expect((screen.getByTestId('translate-next') as HTMLButtonElement).disabled).toBe(true)
    await fireEvent.click(screen.getByRole('button', { name: 'Back to models' }))
    expect(p.onstep).toHaveBeenCalledWith(2)
    expect(p.onstep).not.toHaveBeenCalledWith(5)
  })

  it('says nothing ended before the fetch just asked for is on the board', async () => {
    render(SetupView, { props: props(inUse(), 4) })
    await settle()
    expect(screen.queryByTestId('translate-fetch-gone')).toBeNull()
  })

  it('never makes a model not in place the settings’ on READY', async () => {
    const oncommit = vi.fn(async () => {})
    render(SetupView, { props: props(inUse(), 5, oncommit) })
    await settle()
    expect(oncommit).not.toHaveBeenCalled()
    expect(translate.selfTest).toHaveBeenCalledOnce()
  })
})

describe('SETUP opened again, or a step taken twice', () => {
  // Review 2026-11-07: SETUP is mounted afresh when the pane goes to TEXT and back, and forgets the
  // commit agreed to; FETCH and READY are left and come back in one mount.
  const OTHER = 'plamo3-0.8b-q4km'
  const downloading = (id: string) => ({
    kind: 'model' as const,
    id,
    phase: 'downloading' as const,
    received: 1,
    total: 10,
    speed: 0,
    error: null,
  })
  /** The model in use, its file of an older commit in place, and a newer one out. */
  const updating = (over: Partial<TranslateBoard> = {}) =>
    board({
      models: board().models.map((m) =>
        m.id === AGREED
          ? {
              ...m,
              installed: true,
              revision: 'a'.repeat(40),
              update: { revision: 'b'.repeat(40), date: null },
            }
          : m,
      ),
      ...over,
    })
  const props = (
    b: TranslateBoard,
    step: number,
    chosen = AGREED,
    oncommit = vi.fn(async () => {}),
  ) => ({
    board: b,
    step,
    chosen,
    onstep: vi.fn(),
    onselect: () => {},
    oncommit,
    ondone: () => {},
  })

  it('takes the older file of an update for no fetch finished, opened again on FETCH', async () => {
    const p = props(updating({ fetch: downloading(AGREED), fetchingModel: AGREED }), 4)
    const view = render(SetupView, { props: p })
    await settle()
    expect((screen.getByTestId('translate-next') as HTMLButtonElement).disabled).toBe(true)
    // CANCEL, here or in another pane: the update ended without its file, never READY.
    await view.rerender({ board: updating() })
    await settle()
    expect(p.onstep).not.toHaveBeenCalledWith(5)
    expect(screen.getByTestId('translate-fetch-gone')).toBeTruthy()
  })

  it('waits for the engine too: a model in place alone is not READY', async () => {
    const placed = (over: Partial<TranslateBoard> = {}) =>
      board({
        engine: engine({ fetched: false, toFetchBytes: 62_000 }),
        models: board().models.map((m) => (m.id === AGREED ? { ...m, installed: true } : m)),
        ...over,
      })
    // The fetch just asked for, not on the board yet: the engine is still to come.
    const p = props(placed(), 4)
    const view = render(SetupView, { props: p })
    await settle()
    expect(p.onstep).not.toHaveBeenCalledWith(5)
    expect((screen.getByTestId('translate-next') as HTMLButtonElement).disabled).toBe(true)
    await view.rerender({ board: placed({ engine: engine() }) })
    await settle()
    expect(p.onstep).toHaveBeenCalledWith(5)
  })

  it('says nothing ended on a second FETCH before its fetch is on the board', async () => {
    const p = props(board({ fetch: downloading(OTHER), fetchingModel: OTHER }), 4, OTHER)
    const view = render(SetupView, { props: p })
    await settle()
    await view.rerender({ board: board() })
    await settle()
    expect(screen.getByTestId('translate-fetch-gone')).toBeTruthy()
    // Back to the models, agreed again: FETCH before the board names the new fetch.
    await view.rerender({ step: 2 })
    await settle()
    await view.rerender({ step: 4 })
    await settle()
    expect(screen.queryByTestId('translate-fetch-gone')).toBeNull()
  })

  it('tests READY again, with the model made the settings’, each time it is reached', async () => {
    const inPlace = board({
      models: board().models.map((m) =>
        m.id === AGREED || m.id === OTHER ? { ...m, installed: true } : m,
      ),
    })
    const oncommit = vi.fn(async () => {})
    const view = render(SetupView, { props: props(inPlace, 5, AGREED, oncommit) })
    await settle()
    expect(translate.selfTest).toHaveBeenCalledTimes(1)
    // Another model's fetch, opened from the foot, finishes: READY again, for that one.
    await view.rerender({
      step: 4,
      chosen: OTHER,
      board: { ...inPlace, fetch: downloading(OTHER), fetchingModel: OTHER },
    })
    await settle()
    await view.rerender({ step: 5, board: inPlace })
    await settle()
    expect(translate.selfTest).toHaveBeenCalledTimes(2)
    expect(oncommit).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('translate-selftest').textContent).toMatch(/no/)
  })

  it('says why RESUME is refused', async () => {
    translate.fetch = vi.fn(async () => ({ problem: 'Agree to the newer version first.' }))
    const failed = { ...downloading(AGREED), phase: 'failed' as const, error: 'newer' }
    render(SetupView, { props: props(board({ fetch: failed, fetchingModel: AGREED }), 4) })
    await settle()
    await fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    await settle()
    expect(screen.getByTestId('translate-problem').textContent).toBe(
      'Agree to the newer version first.',
    )
  })
})
