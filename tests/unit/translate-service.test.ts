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
let server: Server
let dir = ''
let base = ''

beforeEach(async () => {
  mode = 'serve'
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-translate-'))
  server = createServer((req, res) => {
    if (mode === 'missing') {
      res.writeHead(404)
      res.end()
      return
    }
    const match = /bytes=(\d+)-/.exec(req.headers.range ?? '')
    const start = match ? Number(match[1]) : 0
    res.writeHead(match ? 206 : 200, {
      ...(match ? { 'content-range': `bytes ${start}-${BODY.length - 1}/${BODY.length}` } : {}),
    })
    if (mode === 'stall') {
      res.write(BODY.subarray(start, Math.max(start, 15_000)))
      return
    }
    res.end(BODY.subarray(start))
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

async function make(over: Partial<ServiceEnv> = {}, agreed = true, engines: unknown[] = []) {
  const manifest = path.join(dir, 'manifest.json')
  writeFileSync(manifest, JSON.stringify({ models: [MODEL], engines }))
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
    await service.fetchSelected()
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
    expect(service.watching()).toEqual([])
    const board = await service.board()
    expect(board.models[0]?.installed).toBe(true)
    expect(board.fetch).toBeNull()
  })

  it('PAUSE keeps the .part and says paused; FETCH again resumes it', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchSelected()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    expect(service.watching()).toEqual(['fetch'])
    service.pause()
    await run
    expect((await service.board()).fetch?.phase).toBe('paused')
    expect(service.watching()).toEqual([])
    expect(partSize(modelPath)).toBe(15_000)
    mode = 'serve'
    await service.fetchSelected()
    expect(readFileSync(modelPath).equals(BODY)).toBe(true)
  })

  it('CANCEL waits for the writer to let go, then removes the .part', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    void service.fetchSelected()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    await service.cancelFetch()
    expect(existsSync(partOf(modelPath))).toBe(false)
    expect((await service.board()).fetch).toBeNull()
    expect(service.watching()).toEqual([])
  })

  it('removing a model being fetched cancels the fetch first', async () => {
    mode = 'stall'
    const { service, modelPath } = await make()
    const run = service.fetchSelected()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    await service.removeModel(MODEL.id)
    await run
    expect(existsSync(path.dirname(modelPath))).toBe(false)
    expect((await service.board()).fetch).toBeNull()
  })

  it('a failure is said on the board and stops the watch', async () => {
    mode = 'missing'
    const { service } = await make()
    await service.fetchSelected()
    const fetching = (await service.board()).fetch
    expect(fetching?.phase).toBe('failed')
    expect(fetching?.error).toMatch(/404/)
    expect(service.watching()).toEqual([])
  })

  it('shares one fetch between two FETCH presses', async () => {
    const { service } = await make()
    const a = service.fetchSelected()
    const b = service.fetchSelected()
    expect(a).toBe(b)
    await a
  })

  it('refuses to fetch before the licence is agreed to', async () => {
    const { service, modelPath } = await make({}, false)
    expect(service.fetchProblem()).toMatch(/licence/)
    await service.fetchSelected()
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
    expect(entries[0]).toContain(`pfnet/test@abcdef0 test.gguf`)
    expect(entries[0]).toContain(`sha256 ${MODEL.sha256}`)
    expect(entries[0]).toContain(`the model from ${base}/pfnet/test/resolve/abcdef0/test.gguf`)
    expect(entries[0]).toContain(
      'llama.cpp b12110 (MIT) from http://127.0.0.1:9/b12110/llama-b12110-bin-test.zip',
    )
    expect(entries[0]).toContain('elecdex    9.9.9')
    // The second, with no page opened, says so; the first is kept as it was.
    expect(entries[1]).toContain('opened from elecdex (not this session)')
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
    const run = service.fetchSelected()
    await expect.poll(() => partSize(modelPath)).toBe(15_000)
    service.quit()
    await run
    expect((await service.board()).fetch?.phase).toBe('paused')
  })
})
