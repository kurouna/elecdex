import { describe, expect, it } from 'vitest'
import {
  etaText,
  fetchFoot,
  fetchLine,
  fetchPercent,
  firstSetupStep,
  formatBytes,
  modelName,
  phaseLamp,
  serverModelFacts,
  setupAnotherStep,
  shownModel,
  sourceOffset,
  tiers,
  whereTextGoes,
} from '../../src/renderer/widgets/translate/translate-view'
import type { EngineView, TranslateBoard } from '../../src/shared/translate/board'
import { MODELS } from '../../src/shared/translate/models'

const engine = (over: Partial<EngineView> = {}): EngineView => ({
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

const board = (over: Partial<TranslateBoard> = {}): TranslateBoard => ({
  engine: engine(),
  library: 0,
  models: MODELS.map((m) => ({
    id: m.id,
    installed: false,
    revision: null,
    update: null,
    partialBytes: 0,
    consentAt: null,
  })),
  fetch: null,
  fetchingModel: null,
  selectedModel: 'plamo3-2b-q4km',
  machine: { ramGB: 16, vramGB: null, gpu: null, freeBytes: null },
  ...over,
})

describe('translate view', () => {
  it("names an external server's own model, never elecdex's choice", () => {
    expect(shownModel(board(), 'plamo3-2b-q4km')).toBe('plamo3-2b-q4km')
    const external = (over: Partial<EngineView>) =>
      board({ engine: engine({ source: 'external', externalHost: '127.0.0.1:8210', ...over }) })
    // Until TEST has read it: the server, not the model elecdex has chosen.
    expect(shownModel(external({}), 'plamo3-2b-q4km')).toBe('127.0.0.1:8210')
    expect(shownModel(external({ externalHost: null }), 'x')).toBe('external server')
    const one = { name: 'plamo-3-translate-0.8b-kansai.gguf', bytes: 655e6, params: 0.8e9 }
    expect(shownModel(external({ serverModels: [one] }), 'x')).toBe('plamo-3-translate-0.8b-kansai')
    expect(shownModel(external({ serverModels: [one, { ...one, name: 'b' }] }), 'x')).toBe(
      'plamo-3-translate-0.8b-kansai, b',
    )
  })

  it('opens "Set up a model…" at MODEL, never READY of the model in place (review 2026-11-07)', () => {
    const installed = board({
      models: board().models.map((m) => ({ ...m, installed: m.id === 'plamo3-2b-q4km' })),
    })
    expect(firstSetupStep(installed)).toBe(5)
    expect(setupAnotherStep(installed)).toBe(2)
    // Where something is still needed first, that step as before.
    expect(setupAnotherStep(board({ engine: engine({ fetched: false }) }))).toBe(1)
  })

  it('says a download at NO MODEL as it stands', () => {
    const fetch = {
      kind: 'model' as const,
      id: 'm',
      phase: 'downloading' as const,
      received: 1.32e9,
      total: 5.28e9,
      speed: 1,
      error: null,
    }
    expect(fetchLine(fetch)).toBe('The model is being fetched: 25%, 1.32 GB of 5.28 GB.')
    expect(fetchLine({ ...fetch, phase: 'paused' })).toBe(
      "The model's download is paused at 1.32 GB of 5.28 GB.",
    )
    expect(fetchLine({ ...fetch, kind: 'engine', phase: 'failed', error: 'HTTP 404' })).toBe(
      "The engine's download failed: HTTP 404.",
    )
    expect(modelName('plamo3-2b-q4km')).toBe('plamo-3-translate-2b-q4km')
  })

  it('says another model’s download shortly, for the footer beside the model in use', () => {
    const fetch = {
      kind: 'model' as const,
      id: 'plamo3-31b-q4km',
      phase: 'downloading' as const,
      received: 5e9,
      total: 20e9,
      speed: 1,
      error: null,
    }
    expect(fetchFoot(fetch, 'plamo3-31b-q4km')).toBe('plamo-3-translate-31b-q4km 25% fetched')
    expect(fetchFoot({ ...fetch, phase: 'paused' }, 'plamo3-31b-q4km')).toBe(
      'plamo-3-translate-31b-q4km paused at 25%',
    )
    // The engine fetched first is said as the model's download it is for.
    expect(fetchFoot({ ...fetch, kind: 'engine', phase: 'failed' }, 'plamo3-31b-q4km')).toBe(
      'plamo-3-translate-31b-q4km download failed',
    )
  })

  it("writes a server model's size from what it said, leaving out what it did not", () => {
    expect(serverModelFacts({ bytes: 655e6, params: 0.84e9 })).toBe('0.8B params · 655 MB')
    expect(serverModelFacts({ bytes: null, params: null })).toBe('')
    expect(serverModelFacts({ bytes: 5.28e9, params: null })).toBe('5.28 GB')
  })

  it('says where the text goes, warning for a server off this machine', () => {
    expect(whereTextGoes(engine())).toEqual({ text: 'local, nothing leaves this PC', warn: false })
    expect(
      whereTextGoes(engine({ source: 'external', externalHost: '192.168.1.20:8080' })),
    ).toEqual({
      text: 'sent to 192.168.1.20:8080',
      warn: true,
    })
    expect(
      whereTextGoes(
        engine({ source: 'external', externalHost: 'localhost:8080', externalLoopback: true }),
      ).warn,
    ).toBe(false)
  })

  it('opens SETUP where it is needed', () => {
    expect(firstSetupStep(board())).toBe(1)
    const installed = board({
      models: board().models.map((m) => ({ ...m, installed: m.id === 'plamo3-2b-q4km' })),
    })
    expect(firstSetupStep(installed)).toBe(5)
    expect(
      firstSetupStep(board({ engine: engine({ fetched: false }), models: installed.models })),
    ).toBe(1)
    expect(
      firstSetupStep(
        board({
          fetch: {
            kind: 'model',
            id: 'x',
            phase: 'downloading',
            received: 1,
            total: 2,
            speed: 1,
            error: null,
          },
        }),
      ),
    ).toBe(4)
    // A failed fetch opens on FETCH too, where its error, RESUME and CANCEL are, never on READY
    // with the file before it.
    const failed = {
      kind: 'model' as const,
      id: 'plamo3-2b-q4km',
      phase: 'failed' as const,
      received: 1,
      total: 2,
      speed: 0,
      error: 'HTTP 403',
    }
    expect(firstSetupStep(board({ models: installed.models, fetch: failed }))).toBe(4)
  })

  it('opens SETUP from the start for a model only chosen, fetched or not', () => {
    const both = board({
      models: board().models.map((m) => ({
        ...m,
        installed: m.id === 'plamo3-2b-q4km' || m.id === 'plamo3-0.8b-q40',
      })),
    })
    // READY tests the settings' model: it is not where a model chosen in ENGINE is set up.
    expect(firstSetupStep(both, 'plamo3-0.8b-q4km')).toBe(1)
    expect(firstSetupStep(both, 'plamo3-0.8b-q40')).toBe(1)
    expect(firstSetupStep(both, 'plamo3-2b-q4km')).toBe(5)
  })

  it('lamps every phase', () => {
    expect(phaseLamp('absent').word).toBe('No model')
    expect(phaseLamp('fault').kind).toBe('bad')
    expect(phaseLamp('external-unreachable').kind).toBe('bad')
  })

  it('formats sizes and times as the setup shows them', () => {
    expect(formatBytes(573_116_288)).toBe('573 MB')
    expect(formatBytes(1_807_192_480)).toBe('1.81 GB')
    const fetch = {
      kind: 'model' as const,
      id: 'x',
      phase: 'downloading' as const,
      received: 362e6,
      total: 1810e6,
      speed: 34.6e6,
      error: null,
    }
    expect(fetchPercent(fetch)).toBe(20)
    expect(etaText(fetch)).toBe('about 0:42 left')
    expect(etaText({ ...fetch, speed: 0 })).toBe('')
  })

  it('groups the manifest by tier in order', () => {
    expect(tiers(MODELS).map((t) => `${t.tier}:${t.params}:${t.entries.length}`)).toEqual([
      'lite:0.8B:4',
      'standard:2B:4',
      'pro:8B:3',
      'max:31B:3',
    ])
  })
})

describe('sourceOffset', () => {
  const blocks = [
    { lead: '', source: 'First.' },
    { lead: '\n\n  ', source: 'Second.' },
  ]
  it('counts the blocks and leads before a point, and clamps it to its block', () => {
    expect(sourceOffset(blocks, 0, 0)).toBe(0)
    expect(sourceOffset(blocks, 0, 3)).toBe(3)
    expect(sourceOffset(blocks, 1, 0)).toBe(10)
    expect(sourceOffset(blocks, 1, 4)).toBe(14)
    expect(sourceOffset(blocks, 1, 99)).toBe(17)
    expect(sourceOffset(blocks, 1, -1)).toBe(10)
    expect(sourceOffset(blocks, 5, 0)).toBe(17)
  })
})
