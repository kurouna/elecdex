import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { partOf } from '../../src/main/translate/fetcher'
import { PID_FILE } from '../../src/main/translate/orphan'
import { type ServiceEnv, TranslateService } from '../../src/main/translate/service'
import { TRANSLATE_DEFAULTS } from '../../src/shared/translate/settings'

/**
 * The service's fetch lifecycle (docs/translate.md §5) against a local stub of Hugging Face: PAUSE
 * keeps the `.part`, CANCEL waits for the writer before removing it, removing a model being
 * fetched cancels it first, a failure is said and stops the watch; and the pid file of §4.2.
 */

const BODY = Buffer.from(Array.from({ length: 40_000 }, (_, i) => (i * 7) % 253))
const MODEL = {
  id: 'test-model',
  tier: 'lite',
  params: '0.1B',
  quant: 'Q4_K_M',
  repo: 'pfnet/test',
  revision: 'abcdef0',
  file: 'test.gguf',
  bytes: BODY.length,
  sha256: createHash('sha256').update(BODY).digest('hex'),
  ramGB: 1,
  vramGB: null,
} as const

let mode: 'serve' | 'stall' | 'missing' = 'serve'
/** The repository's newest commit as the stand-in tells it, and the file it serves at it. */
let latest = { commit: 'c'.repeat(40), body: BODY }
/** A commit whose files the stand-in refuses (404), as the CDN refused a superseded one. */
let gone: string | null = null
/** Holds the revision API's answer back, as a slow network would. */
let hold: Promise<void> | null = null
/** What was asked of the stand-in: the revision API, and the files. */
let asked: string[] = []
let server: Server
let dir = ''
let base = ''

beforeEach(async () => {
  mode = 'serve'
  latest = { commit: 'c'.repeat(40), body: BODY }
  gone = null
  hold = null
  asked = []
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-translate-'))
  server = createServer(async (req, res) => {
    asked.push(req.url ?? '')
    if (req.url?.startsWith('/api/models/')) {
      if (hold) await hold
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          sha: latest.commit,
          lastModified: '2026-11-06T00:49:00.000Z',
          siblings: [
            {
              rfilename: 'test.gguf',
              lfs: {
                sha256: createHash('sha256').update(latest.body).digest('hex'),
                size: latest.body.length,
              },
            },
          ],
        }),
      )
      return
    }
    const body = latest.body
    if (mode === 'missing' || (gone !== null && req.url?.includes(gone))) {
      res.writeHead(404)
      res.end()
      return
    }
    const match = /bytes=(\d+)-/.exec(req.headers.range ?? '')
    const start = match ? Number(match[1]) : 0
    res.writeHead(match ? 206 : 200, {
      ...(match ? { 'content-range': `bytes ${start}-${body.length - 1}/${body.length}` } : {}),
    })
    if (mode === 'stall') {
      res.write(body.subarray(start, Math.max(start, 15_000)))
      return
    }
    res.end(body.subarray(start))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterEach(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  rmSync(dir, { recursive: true, force: true })
})

const AGREEMENT = { licence: 'licence', openedAt: null, appVersion: '0.0.0' }

/** A second model of the same repository, so one can be fetched beside the one in use. */
const OTHER = { ...MODEL, id: 'test-other' } as const

async function make(
  over: Partial<ServiceEnv> = {},
  agreed = true,
  engines: unknown[] = [],
  models: unknown[] = [MODEL],
) {
  const manifest = path.join(dir, 'manifest.json')
  writeFileSync(manifest, JSON.stringify({ models, engines }))
  const service = new TranslateService(
    {
      userData: dir,
      platform: process.platform,
      arch: process.arch,
      hfBase: base,
      releasesBase: 'http://127.0.0.1:9',
      manifest,
      // A stand-in engine: the model alone is fetched.
      stubServer: path.join(dir, 'stub.mjs'),
      execPath: process.execPath,
      netFetch: (url, init) => fetch(url, init),
      gpuName: async () => null,
      processName: async () => null,
      ...over,
    },
    { ...TRANSLATE_DEFAULTS, modelId: MODEL.id },
  )
  if (agreed) await service.consent(MODEL.id, AGREEMENT)
  const modelPath = path.join(dir, 'translate', 'models', MODEL.id, MODEL.file)
  return { service, modelPath }
}

const partSize = (file: string): number => {
  try {
    return readFileSync(partOf(file)).length
  } catch {
    return 0
  }
}

describe('TranslateService fetching', () => {
  it('fetches the selected model and watches nothing once it is in place', async () => {
    const { service, modelPath } = await make()
    await service.fetchFor()
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
    expect(service.watching()).toEqual([])
    const board = await service.board()
    expect(board.models[0]?.installed).toBe(true)
    expect(board.fetch).toBeNull()
  })

  it('PAUSE keeps the .part and says paused; FETCH again resumes it', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    expect(service.watching()).toEqual(['fetch'])
    service.pause()
    await run
    expect((await service.board()).fetch?.phase).toBe('paused')
    expect(service.watching()).toEqual([])
    expect(partSize(modelPath)).toBe(15_000)
    mode = 'serve'
    await service.fetchFor()
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
  })

  it('CANCEL waits for the writer to let go, then removes the .part', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    void service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    await service.cancelFetch()
    expect(existsSync(partOf(modelPath))).toBe(false)
    expect((await service.board()).fetch).toBeNull()
    expect(service.watching()).toEqual([])
  })

  it('starts no fetch while CANCEL is removing the .part', async () => {
    // Review 2026-11-07: a RESUME pressed during CANCEL wrote into the file CANCEL then removed.
    mode = 'stall'
    const { service, modelPath } = await make()
    void service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    const cancelling = service.cancelFetch()
    expect(service.fetchProblem()).toMatch(/being cancelled/)
    await cancelling
    expect(service.fetchProblem()).toBeNull()
  })

  it('removing a model being fetched cancels the fetch first', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    await service.removeModel(MODEL.id)
    await run
    expect(existsSync(path.dirname(modelPath))).toBe(false)
    expect((await service.board()).fetch).toBeNull()
  })

  it('a failure is said on the board and stops the watch', async () => {
    mode = 'missing'
    const { service } = await make()
    await service.fetchFor()
    const fetching = (await service.board()).fetch
    expect(fetching?.phase).toBe('failed')
    expect(fetching?.error).toMatch(/404/)
    expect(service.watching()).toEqual([])
  })

  it('shares one fetch between two FETCH presses', async () => {
    const { service } = await make()
    const a = service.fetchFor()
    const b = service.fetchFor()
    expect(a).toBe(b)
    await a
  })

  it('refuses to fetch before the licence is agreed to', async () => {
    const { service, modelPath } = await make({}, false)
    expect(service.fetchProblem()).toMatch(/licence/)
    await service.fetchFor()
    expect(existsSync(partOf(modelPath))).toBe(false)
    await service.consent(MODEL.id, AGREEMENT)
    expect(service.fetchProblem()).toBeNull()
  })
})

describe('TranslateService and the licence agreed to', () => {
  const ENGINE = {
    target: `${process.platform}-${process.arch}-cpu`,
    platform: process.platform,
    arch: process.arch,
    backend: 'cpu',
    asset: 'llama-b12110-bin-test.zip',
    bytes: 62_000_000,
    sha256: 'a'.repeat(64),
  }

  it('records every agreement in a log only added to, with the licence and what is fetched', async () => {
    const { service } = await make({ stubServer: undefined }, false, [ENGINE])
    // The engine is elecdex's and not in place: the fetch brings it, and SETUP says how much.
    expect((await service.board()).engine.toFetchBytes).toBe(ENGINE.bytes)
    const opened = '2026-11-06T08:00:00.000Z'
    await service.consent(MODEL.id, {
      licence: 'https://example.test/licence',
      openedAt: opened,
      appVersion: '9.9.9',
    })
    await service.consent(MODEL.id, { ...AGREEMENT, appVersion: '9.9.9' })
    const log = readFileSync(path.join(dir, 'translate', 'licence-consents.txt'), 'utf8')
    const entries = log.split(/\n(?=\d{4}-)/)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z {2}agreed {2}test-model\n/)
    expect(entries[0]).toContain('https://example.test/licence')
    expect(entries[0]).toContain(`opened from elecdex ${opened}`)
    expect(entries[0]).toContain(`pfnet/test@${'c'.repeat(40)} test.gguf`)
    expect(entries[0]).toContain(`sha256 ${MODEL.sha256}`)
    expect(entries[0]).toContain(
      `the model from ${base}/pfnet/test/resolve/${'c'.repeat(40)}/test.gguf`,
    )
    expect(entries[0]).toContain(
      'llama.cpp b12110 (MIT) from http://127.0.0.1:9/b12110/llama-b12110-bin-test.zip',
    )
    expect(entries[0]).toContain('elecdex    9.9.9')
    // The second, with no page opened, says so; the first is kept as it was.
    expect(entries[1]).toContain('opened from elecdex (not opened for this agreement)')
  })

  it('keeps no agreement the log could not keep: nothing is fetched on it', async () => {
    const { service } = await make({}, false)
    // A folder where the log goes: the agreement cannot be written down.
    mkdirSync(path.join(dir, 'translate', 'licence-consents.txt'), { recursive: true })
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({
      problem: expect.stringMatching(/could not be written down/),
    })
    expect(service.fetchProblem()).toMatch(/licence/)
    expect((await service.board()).models[0]?.consentAt).toBeNull()
  })

  it('lists no engine to fetch once it is in place', async () => {
    const { service } = await make({ stubServer: undefined }, false, [ENGINE])
    const server = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'
    const folder = path.join(dir, 'translate', 'engine', 'b12110', ENGINE.target)
    mkdirSync(folder, { recursive: true })
    writeFileSync(path.join(folder, server), '')
    expect((await service.board()).engine.toFetchBytes).toBe(0)
    await service.consent(MODEL.id, AGREEMENT)
    const log = readFileSync(path.join(dir, 'translate', 'licence-consents.txt'), 'utf8')
    expect(log).toContain('the model from')
    expect(log).not.toContain('llama.cpp')
  })
})

describe('TranslateService and a server left running (§4.2)', () => {
  it('asks what the pid left in the file is, before starting anything of its own', async () => {
    const root = path.join(dir, 'translate')
    mkdirSync(root, { recursive: true })
    writeFileSync(path.join(root, PID_FILE), '4242')
    const asked: number[] = []
    await make({
      processName: async (pid) => {
        asked.push(pid)
        // Not a llama-server: the number was reused by something else, which is left alone.
        return 'notepad.exe'
      },
    })
    await expect.poll(() => asked).toEqual([4242])
  })

  it('quits without waiting, the fetch paused', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    service.quit()
    await run
    expect((await service.board()).fetch?.phase).toBe('paused')
  })

  it('shows a fetch paused before quitting as paused at the next start, and RESUME takes it up', async () => {
    // §5; review 2026-11-07: it used to be forgotten, and the setup walked again from the start.
    mode = 'stall'
    const first = await make()
    const run = first.service.fetchFor()
    await expect.poll(() => partSize(first.modelPath)).toBe(15_000)
    first.service.quit()
    await run
    mode = 'serve'
    // The next start, on the same folder, with no new agreement.
    const { service, modelPath } = await make({}, false)
    const board = await service.board()
    expect(board.fetch).toMatchObject({ kind: 'model', phase: 'paused', received: 15_000 })
    expect(service.watching()).toEqual([])
    expect(service.fetchProblem()).toBeNull()
    await service.fetchFor()
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
    expect(asked.filter((url) => url.includes('test.gguf')).length).toBe(2)
  })
})

describe('TranslateService fetching a model beside the one in use', () => {
  // User's choice 2026-11-07: the model in use goes on translating while another is fetched; the
  // page makes the fetched one the settings' at READY.
  const otherPath = (): string => path.join(dir, 'translate', 'models', OTHER.id, OTHER.file)

  async function inUse() {
    const made = await make({}, true, [], [MODEL, OTHER])
    await made.service.fetchFor()
    await made.service.consent(OTHER.id, AGREEMENT)
    return made
  }

  it('fetches the model named, and the engine keeps the model in use', async () => {
    const { service, modelPath } = await inUse()
    expect(service.engine.config.modelPath).toBe(modelPath)
    mode = 'stall'
    const run = service.fetchFor(OTHER.id)
    await expect.poll(() => partSize(otherPath())).toBe(15_000)
    const during = await service.board()
    expect(during.fetchingModel).toBe(OTHER.id)
    expect(during.selectedModel).toBe(MODEL.id)
    service.pause()
    await run
    mode = 'serve'
    await service.fetchFor(OTHER.id)
    const after = await service.board()
    expect(readFileSync(otherPath()).equals(BODY)).toBe(true)
    expect(after.models.find((m) => m.id === OTHER.id)?.installed).toBe(true)
    expect(after.fetchingModel).toBeNull()
    expect(after.selectedModel).toBe(MODEL.id)
    expect(service.engine.config.modelPath).toBe(modelPath)
  })

  it('refuses another fetch while one is paused, and names none once it is cancelled', async () => {
    const { service } = await inUse()
    mode = 'stall'
    const run = service.fetchFor(OTHER.id)
    await expect.poll(() => partSize(otherPath())).toBe(15_000)
    service.pause()
    await run
    expect(service.fetchProblem(MODEL.id)).toMatch(/paused or failed/)
    expect(service.fetchProblem(OTHER.id)).toBeNull()
    await service.cancelFetch()
    expect((await service.board()).fetchingModel).toBeNull()
    expect(service.fetchProblem(MODEL.id)).toBeNull()
  })

  it('refuses another model from the moment a fetch starts, before its progress is on the board', async () => {
    // Review 2026-11-07: in that window a second fetch was let through and joined the first's run.
    const { service } = await inUse()
    mode = 'stall'
    const run = service.fetchFor(OTHER.id)
    expect(service.fetchProblem(MODEL.id)).toMatch(/Another model is being fetched/)
    expect((await service.board()).fetchingModel).toBe(OTHER.id)
    await expect.poll(() => partSize(otherPath())).toBe(15_000)
    service.pause()
    await run
    expect(service.fetchProblem(MODEL.id)).toMatch(/paused or failed/)
  })

  it('shows a paused fetch of a model not in use at the next start, for that model', async () => {
    const first = await inUse()
    mode = 'stall'
    const run = first.service.fetchFor(OTHER.id)
    await expect.poll(() => partSize(otherPath())).toBe(15_000)
    first.service.quit()
    await run
    const { service } = await make({}, false, [], [MODEL, OTHER])
    const board = await service.board()
    expect(board.fetch).toMatchObject({ kind: 'model', id: OTHER.id, phase: 'paused' })
    expect(board.fetchingModel).toBe(OTHER.id)
  })
})

describe('TranslateService and an external server', () => {
  /** A llama-server elsewhere: /completion may send the text on to `elsewhere` by a redirect. */
  async function external(state: { model: string; redirect?: string; hold?: Promise<void> }) {
    const hits: string[] = []
    const ext = createServer(async (req, res) => {
      hits.push(req.url ?? '')
      if (req.url === '/props' && state.hold) await state.hold
      if (req.url === '/completion' && state.redirect) {
        res.writeHead(302, { location: `${state.redirect}/completion` })
        res.end()
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      const props = {
        model_path: `/m/${state.model}`,
        default_generation_settings: { n_ctx: 2048 },
      }
      res.end(JSON.stringify(req.url === '/props' ? props : { status: 'ok' }))
    })
    await new Promise<void>((resolve) => ext.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${(ext.address() as AddressInfo).port}`
    return { ext, origin, hits }
  }

  it('never follows a redirect with the self test’s text', async () => {
    // §4.1; review 2026-11-07: the self test followed one where translations did not.
    const { service } = await make()
    const state = { model: 'plamo-3-translate-2b-Q4_K_M.gguf', redirect: base }
    const { ext, origin } = await external(state)
    try {
      expect(await service.testExternal(origin)).toMatchObject({ ok: true })
      await expect(service.selfTest()).rejects.toThrow()
      expect(asked).not.toContain('/completion')
    } finally {
      ext.closeAllConnections()
      ext.close()
    }
  })

  it('stops using a server that no longer runs PLaMo 3 Translate, and says why', async () => {
    const { service } = await make()
    const state = { model: 'plamo-3-translate-2b-Q4_K_M.gguf' }
    const { ext, origin } = await external(state)
    try {
      await service.testExternal(origin)
      expect(service.engine.phase).toBe('external-ready')
      state.model = 'qwen3-8b.gguf'
      await service.refreshServer()
      const board = await service.board()
      expect(service.engine.phase).toBe('external-unreachable')
      expect(board.engine.serverProblem).toMatch(/does not run a PLaMo/)
      expect(board.engine.serverModels).toEqual([])
      // Asked again before it is used, it still refuses: no text goes to it.
      await expect(service.engine.ensure()).rejects.toThrow(/does not run a PLaMo/)
      state.model = 'plamo-3-translate-2b-Q4_K_M.gguf'
      await service.engine.ensure()
      expect((await service.board()).engine.serverProblem).toBeNull()
    } finally {
      ext.closeAllConnections()
      ext.close()
    }
  })

  it('keeps what TEST read of a new server when the old one answers a probe late', async () => {
    // Review 2026-11-07: the old server's answer, asked before TEST, overwrote the new one's model.
    const { service } = await make()
    let release!: () => void
    const old = { model: 'plamo-3-translate-2b-Q4_K_M.gguf' } as {
      model: string
      hold?: Promise<void>
    }
    const a = await external(old)
    const b = await external({ model: 'plamo-3-translate-8b-Q4_K_M.gguf' })
    try {
      await service.testExternal(a.origin)
      old.hold = new Promise<void>((resolve) => {
        release = resolve
      })
      // Not known ready: the next request asks the server what it runs first.
      service.engine.tested(false)
      const probe = service.engine.ensure().catch(() => {})
      await expect.poll(() => a.hits.filter((url) => url === '/props').length).toBe(2)
      expect(await service.testExternal(b.origin)).toMatchObject({ ok: true })
      release()
      await probe
      const board = await service.board()
      expect(board.engine.serverModels.map((m) => m.name)).toEqual([
        'plamo-3-translate-8b-Q4_K_M.gguf',
      ])
      // Nor does the old server's answer decide whether the new one is up.
      expect(service.engine.phase).toBe('external-ready')
    } finally {
      for (const { ext } of [a, b]) {
        ext.closeAllConnections()
        ext.close()
      }
    }
  })

  it('RESTART asks the builds for their GPUs again', async () => {
    const { service } = await make()
    const file = path.join(dir, 'translate', 'engine.json')
    const before = JSON.parse(readFileSync(file, 'utf8'))
    writeFileSync(file, JSON.stringify({ ...before, devices: { 'b1:/x': [] } }))
    const again = await make({}, false)
    await again.service.restartEngine()
    expect(JSON.parse(readFileSync(file, 'utf8')).devices).toEqual({})
    void service
  })
})

describe('TranslateService and the newest commits (§5)', () => {
  const NEW = 'e'.repeat(40)
  const DAY = 24 * 60 * 60 * 1000
  const apiAsks = () => asked.filter((url) => url.startsWith('/api/models/')).length

  it('agrees to the newest commit and fetches that one, checked against its own sha256', async () => {
    const newer = Buffer.from(Array.from({ length: 41_000 }, (_, i) => (i * 11) % 251))
    latest = { commit: NEW, body: newer }
    const { service, modelPath } = await make({}, false)
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({ revision: NEW })
    await service.fetchFor()
    expect(readFileSync(modelPath).equals(newer)).toBe(true)
    expect(asked).toContain(`/pfnet/test/resolve/${NEW}/test.gguf`)
    const model = (await service.board()).models[0]
    expect(model?.installed).toBe(true)
    expect(model?.revision).toBe(NEW)
    expect(model?.update).toBeNull()
  })

  it('agrees to nothing when Hugging Face does not answer', async () => {
    const { service } = await make({ hfBase: 'http://127.0.0.1:9' }, false)
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({
      problem: expect.stringMatching(/Hugging Face did not answer/),
    })
    expect(service.fetchProblem()).toMatch(/licence/)
  })

  it('takes a file fetched before commits were followed, and asks for newer ones once a day', async () => {
    const { service, modelPath } = await make({}, false)
    mkdirSync(path.dirname(modelPath), { recursive: true })
    writeFileSync(modelPath, BODY)
    let model = (await service.board()).models[0]
    // The first release, by its size: in place, and nothing known newer yet.
    expect(model?.installed).toBe(true)
    expect(model?.revision).toBe(MODEL.revision)
    expect(model?.update).toBeNull()
    latest = { commit: NEW, body: Buffer.from(BODY.map((byte) => (byte + 7) % 256)) }
    const now = Date.parse('2026-11-06T09:00:00.000Z')
    await service.checkUpdates(now)
    expect(apiAsks()).toBe(1)
    model = (await service.board()).models[0]
    expect(model?.update).toEqual({ revision: NEW, date: '2026-11-06T00:49:00.000Z' })
    // Asked again only a day later.
    await service.checkUpdates(now + DAY - 1)
    expect(apiAsks()).toBe(1)
    await service.checkUpdates(now + DAY)
    expect(apiAsks()).toBe(2)
  })

  it('fetches nothing again for a newer commit that left the file as it was', async () => {
    const { service, modelPath } = await make()
    await service.fetchFor()
    // Another commit (the README, say), the same file.
    latest = { commit: NEW, body: BODY }
    await service.checkUpdates(Date.parse('2026-11-06T09:00:00.000Z'))
    expect((await service.board()).models[0]?.update).toBeNull()
    asked = []
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({ revision: NEW })
    await service.fetchFor()
    expect(asked.filter((url) => url.includes('/resolve/'))).toEqual([])
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
    expect((await service.board()).models[0]?.revision).toBe(NEW)
  })

  it('drops a paused part of another file when a newer one is agreed to', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    // Agreeing while it writes is refused; paused, the part of the old file goes.
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({
      problem: expect.stringMatching(/fetch is under way/),
    })
    service.pause()
    await run
    latest = { commit: NEW, body: Buffer.from(BODY.map((byte) => (byte + 3) % 256)) }
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({ revision: NEW })
    expect(partSize(modelPath)).toBe(0)
    expect((await service.board()).fetch).toBeNull()
  })

  it('says in plain words that a newer version came out when the agreed one is refused', async () => {
    const { service } = await make()
    // The commit agreed to is no longer served, and a newer file is.
    mode = 'missing'
    latest = { commit: NEW, body: Buffer.from(BODY.map((byte) => (byte + 5) % 256)) }
    await service.fetchFor()
    // Failed at once, with the server's answer; why, once Hugging Face was asked.
    expect((await service.board()).fetch?.phase).toBe('failed')
    await expect
      .poll(async () => (await service.board()).fetch?.error)
      .toMatch(/newer version of this model/)
    // LICENCE asks again, for the newer file.
    expect((await service.board()).models[0]?.consentAt).toBeNull()
    // RESUME is refused (review 2026-11-07): it would ask for the refused commit again.
    expect(service.fetchProblem()).toMatch(/newer version/)
    asked = []
    await service.fetchFor()
    expect(asked.filter((url) => url.includes('/resolve/'))).toEqual([])
  })

  it('agrees to nothing while the engine is being fetched, before the model', async () => {
    mode = 'stall'
    const engine = {
      target: `${process.platform}-${process.arch}-cpu`,
      platform: process.platform,
      arch: process.arch,
      backend: 'cpu',
      asset: 'llama-b12110-bin-test.zip',
      bytes: 62_000,
      sha256: 'a'.repeat(64),
    }
    const { service } = await make({ stubServer: undefined, releasesBase: base }, true, [engine])
    void service.fetchFor()
    await expect.poll(async () => (await service.board()).fetch?.kind).toBe('engine')
    // The run goes on to the model after the engine: an agreement now would come between.
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({
      problem: expect.stringMatching(/fetch is under way/),
    })
    await service.cancelFetch()
  })

  it('removing a model cancels its fetch while the engine is fetched for it', async () => {
    // Review 2026-11-07: only a model's own download was cancelled; the run went on to fetch it.
    mode = 'stall'
    const engine = {
      target: `${process.platform}-${process.arch}-cpu`,
      platform: process.platform,
      arch: process.arch,
      backend: 'cpu',
      asset: 'llama-b12110-bin-test.zip',
      bytes: 62_000,
      sha256: 'a'.repeat(64),
    }
    const { service } = await make({ stubServer: undefined, releasesBase: base }, true, [engine])
    const run = service.fetchFor()
    await expect.poll(async () => (await service.board()).fetch?.kind).toBe('engine')
    await service.removeModel(MODEL.id)
    await run
    const board = await service.board()
    expect(board.fetch).toBeNull()
    expect(board.fetchingModel).toBeNull()
    expect(asked.filter((url) => url.includes('/resolve/'))).toEqual([])
  })

  it("CANCEL drops the model's part while the engine is fetched for it", async () => {
    // Review 2026-11-07: only a part whose own download was on the board went; a model's part
    // left from before stayed, and came back paused at the next start.
    mode = 'stall'
    const engine = {
      target: `${process.platform}-${process.arch}-cpu`,
      platform: process.platform,
      arch: process.arch,
      backend: 'cpu',
      asset: 'llama-b12110-bin-test.zip',
      bytes: 62_000,
      sha256: 'a'.repeat(64),
    }
    const { service, modelPath } = await make({ stubServer: undefined, releasesBase: base }, true, [
      engine,
    ])
    mkdirSync(path.dirname(modelPath), { recursive: true })
    writeFileSync(partOf(modelPath), BODY.subarray(0, 9_000))
    void service.fetchFor()
    await expect.poll(async () => (await service.board()).fetch?.kind).toBe('engine')
    await service.cancelFetch()
    expect(existsSync(partOf(modelPath))).toBe(false)
  })

  it('CANCEL drops the part of a fetch cancelled before its progress is on the board', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    mkdirSync(path.dirname(modelPath), { recursive: true })
    writeFileSync(partOf(modelPath), BODY.subarray(0, 9_000))
    void service.fetchFor()
    await service.cancelFetch()
    expect(existsSync(partOf(modelPath))).toBe(false)
    expect((await service.board()).fetch).toBeNull()
  })

  it('starts no fetch of a model while it is being agreed to', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const first = service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    service.pause()
    await first
    // An agreement to a newer file, its answer held back while RESUME is pressed.
    let release = () => {}
    hold = new Promise((resolve) => {
      release = resolve
    })
    latest = { commit: NEW, body: Buffer.from(BODY.map((byte) => (byte + 9) % 256)) }
    const agreeing = service.consent(MODEL.id, AGREEMENT)
    await expect.poll(() => asked.filter((url) => url.startsWith('/api/')).length).toBe(2)
    // RESUME waits: a fetch now would read the agreement before this one and mix two files.
    expect(service.fetchProblem()).toMatch(/being agreed to/)
    await service.fetchFor()
    expect(service.watching()).not.toContain('fetch')
    release()
    expect(await agreeing).toEqual({ revision: NEW })
    // The old file's part went with the agreement to the new one; the fetch starts afresh.
    expect(existsSync(partOf(modelPath))).toBe(false)
    expect(service.fetchProblem()).toBeNull()
  })

  it('lets RESUME go on when the very file moved to a newer commit', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchFor()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    service.pause()
    await run
    // A README-only commit: the commit agreed to is refused now, the file is the same.
    mode = 'serve'
    gone = 'c'.repeat(40)
    latest = { commit: NEW, body: BODY }
    await service.fetchFor()
    await expect.poll(async () => (await service.board()).fetch?.error).toMatch(/press Resume/)
    // The agreement followed its file, and the log says so.
    const log = readFileSync(path.join(dir, 'translate', 'licence-consents.txt'), 'utf8')
    expect(log).toContain('moved   test-model')
    expect(log).toContain(`commit     ${'c'.repeat(40)} -> ${NEW}`)
    expect((await service.board()).models[0]?.consentAt).not.toBeNull()
    // RESUME: from the newer commit, from where it stopped.
    asked = []
    await service.fetchFor()
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
    expect(asked.filter((url) => url.includes('/resolve/'))).toEqual([
      `/pfnet/test/resolve/${NEW}/test.gguf`,
    ])
    expect((await service.board()).models[0]?.revision).toBe(NEW)
  })

  it('forgets the file in place when the model is removed', async () => {
    const { service, modelPath } = await make()
    await service.fetchFor()
    await service.removeModel(MODEL.id)
    const engine = JSON.parse(readFileSync(path.join(dir, 'translate', 'engine.json'), 'utf8'))
    expect(engine.installed[MODEL.id]).toBeUndefined()
    expect(existsSync(modelPath)).toBe(false)
    // The agreements stay (user's request 2026-11-06): the log as it was, and the consent.
    expect(engine.consents[MODEL.id]).toBeDefined()
    const log = readFileSync(path.join(dir, 'translate', 'licence-consents.txt'), 'utf8')
    expect(log).toMatch(/agreed {2}test-model/)
  })

  it('asks nothing while no model is in place', async () => {
    const { service } = await make({}, false)
    await service.checkUpdates(Date.parse('2026-11-06T09:00:00.000Z'))
    expect(apiAsks()).toBe(0)
  })

  it('asks for the agreement again once a newer commit is heard, and the update replaces the file', async () => {
    const { service, modelPath } = await make()
    await service.fetchFor()
    expect((await service.board()).models[0]?.consentAt).not.toBeNull()
    // A newer commit of the same size: never taken for the file in place by its size.
    const same = Buffer.from(BODY.map((byte) => (byte + 1) % 256))
    latest = { commit: NEW, body: same }
    await service.checkUpdates(Date.parse('2026-11-06T09:00:00.000Z'))
    let model = (await service.board()).models[0]
    expect(model?.update?.revision).toBe(NEW)
    expect(model?.consentAt).toBeNull()
    expect(await service.consent(MODEL.id, AGREEMENT)).toEqual({ revision: NEW })
    await service.fetchFor()
    expect(readFileSync(modelPath).equals(same)).toBe(true)
    model = (await service.board()).models[0]
    expect(model?.revision).toBe(NEW)
    expect(model?.update).toBeNull()
    expect(model?.consentAt).not.toBeNull()
  })
})
