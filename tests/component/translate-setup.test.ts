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
    consentAt: m.id === AGREED ? '2026-11-06T00:00:00.000Z' : null,
  })),
  fetch: null,
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
    consent: vi.fn(async () => undefined),
    fetch: vi.fn(async () => ({ problem: 'stop here' })),
    testExternal: vi.fn(async () => ({ ok: false, problem: 'no' })),
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
