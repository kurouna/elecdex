import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TranslateService } from '../../src/main/translate/service'
import type { RunEvent, RunView } from '../../src/shared/translate/run'
import { TRANSLATE_DEFAULTS } from '../../src/shared/translate/settings'

/**
 * What a run leaves in the history (docs/translate.md §7), through the service as it runs: the
 * stand-in llama-server (tests/e2e/support/llama-stub.mjs) started by node, a model file in place.
 */

const STUB = path.resolve(__dirname, '../e2e/support/llama-stub.mjs')
const MODEL = {
  id: 'test-model',
  tier: 'lite',
  params: '0.1B',
  quant: 'Q4_K_M',
  repo: 'pfnet/test',
  revision: 'abcdef0',
  file: 'test.gguf',
  bytes: 1,
  sha256: 'a'.repeat(64),
  ramGB: 1,
  vramGB: null,
} as const

let dir = ''
let service: TranslateService | null = null

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-history-'))
  const models = path.join(dir, 'translate', 'models', MODEL.id)
  mkdirSync(models, { recursive: true })
  writeFileSync(path.join(models, MODEL.file), 'x')
})

afterEach(() => {
  service?.quit()
  service = null
  rmSync(dir, { recursive: true, force: true })
})

function make(saveHistory = true): TranslateService {
  const manifest = path.join(dir, 'manifest.json')
  writeFileSync(manifest, JSON.stringify({ models: [MODEL] }))
  service = new TranslateService(
    {
      userData: dir,
      platform: process.platform,
      arch: process.arch,
      hfBase: 'http://127.0.0.1:9',
      releasesBase: 'http://127.0.0.1:9',
      manifest,
      stubServer: STUB,
      execPath: process.execPath,
      netFetch: (url, init) => fetch(url, init),
      gpuName: async () => null,
      processName: async () => null,
    },
    { ...TRANSLATE_DEFAULTS, modelId: MODEL.id, saveHistory },
  )
  return service
}

/** The run of a pane as its events leave it: waits until `until` holds. */
function watch(s: TranslateService, paneId: string) {
  let view: RunView | null = null
  s.onRunEvent((event: RunEvent) => {
    if (event.paneId !== paneId) return
    if (event.kind === 'snapshot') view = event.run
    else if (view) {
      for (const patch of event.blocks) {
        const block = view.blocks[patch.index]
        if (!block) continue
        view.blocks[patch.index] = {
          ...block,
          text: (patch.text ?? block.text) + (patch.append ?? ''),
          ...(patch.state ? { state: patch.state } : {}),
        }
      }
      if (event.state) view.state = event.state
    }
  })
  return () => view
}

const request = (paneId: string, text: string) => ({
  paneId,
  draftId: 'd1',
  text,
  srcLang: 'en',
  tgtLang: 'ja',
  mode: 'translate' as const,
})

describe('TranslateService and the history', () => {
  it('records a finished run, with its languages, model and every block written', async () => {
    const s = make()
    s.runs.follow('p1')
    s.runs.start(request('p1', 'Hello.'))
    await expect.poll(() => s.library.history().length, { timeout: 15_000 }).toBe(1)
    expect(s.library.history()[0]).toMatchObject({
      draftId: 'd1',
      srcLang: 'en',
      tgtLang: 'ja',
      partial: null,
      model: MODEL.id,
      blocks: [{ source: 'Hello.', text: '[ja] Hello.', done: true }],
    })
  })

  it('records nothing while the history is turned off', async () => {
    const s = make(false)
    const view = watch(s, 'p1')
    s.runs.follow('p1')
    s.runs.start(request('p1', 'Hello.'))
    await expect.poll(() => view()?.state, { timeout: 15_000 }).toBe('done')
    expect(s.library.history()).toEqual([])
  })

  it('marks a run stopped part way with how far it got, and reopens it so', async () => {
    const s = make()
    const view = watch(s, 'p1')
    s.runs.follow('p1')
    s.runs.start(request('p1', `Short.\n\n${'A long block that takes a while. '.repeat(20)}`))
    await expect.poll(() => view()?.blocks[0]?.state, { timeout: 15_000 }).toBe('done')
    s.runs.stop('p1')
    await expect.poll(() => s.library.history().length).toBe(1)
    const entry = s.library.history()[0]
    expect(entry?.partial).toEqual({ done: 1, total: 2 })
    expect(entry?.blocks.map((b) => b.done)).toEqual([true, false])
    s.runs.follow('p2')
    expect(s.showEntry('p2', entry?.id ?? '')).toMatchObject({ version: expect.any(Number) })
    const shown = s.runs.follow('p2')
    expect(shown.kind === 'snapshot' && shown.run?.blocks.map((b) => b.state)).toEqual([
      'done',
      'none',
    ])
    expect(s.showEntry('p2', 'gone')).toEqual({ problem: 'That entry is gone.' })
  })
})
