import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type FetcherDeps, fetchFile, partOf, rangeStart } from '../../src/main/translate/fetcher'
import { sha256File } from '../../src/main/translate/hash'

const BODY = Buffer.from(Array.from({ length: 50_000 }, (_, i) => i % 251))
const SHA = createHash('sha256').update(BODY).digest('hex')

/** How the stub answers a ranged request. */
let rangeMode: 'honest' | 'wrong-start' | 'ignore' = 'honest'
let requests: (string | undefined)[] = []
let server: Server
let base = ''
let dir = ''

beforeEach(async () => {
  rangeMode = 'honest'
  requests = []
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-fetch-'))
  server = createServer((req, res) => {
    const range = req.headers.range
    requests.push(range)
    const match = range ? /bytes=(\d+)-/.exec(range) : null
    if (match && rangeMode !== 'ignore') {
      const asked = Number(match[1])
      const start = rangeMode === 'wrong-start' ? 0 : asked
      res.writeHead(206, { 'content-range': `bytes ${start}-${BODY.length - 1}/${BODY.length}` })
      res.end(BODY.subarray(start))
      return
    }
    res.writeHead(200)
    res.end(BODY)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  rmSync(dir, { recursive: true, force: true })
})

const deps = (over: Partial<FetcherDeps> = {}): FetcherDeps => ({
  fetch: (url, init) => fetch(url, init),
  hash: (file, signal) => sha256File(file, signal),
  freeBytes: async () => null,
  place: (part, dest) => renameSync(part, dest),
  sleep: async () => {},
  now: () => Date.now(),
  ...over,
})

const target = () => ({
  url: `${base}/model.gguf`,
  dest: path.join(dir, 'm', 'model.gguf'),
  bytes: BODY.length,
  sha256: SHA,
})

describe('fetchFile', () => {
  it('fetches, checks and puts the file in place', async () => {
    const t = target()
    const phases: string[] = []
    await fetchFile(t, deps(), (p) => phases.push(p.phase), new AbortController().signal)
    expect(readFileSync(t.dest).equals(BODY)).toBe(true)
    expect(phases.at(-1)).toBe('verifying')
  })

  it('resumes a .part where it stopped', async () => {
    const t = target()
    mkdirSync(path.dirname(t.dest), { recursive: true })
    writeFileSync(partOf(t.dest), BODY.subarray(0, 20_000))
    await fetchFile(t, deps(), () => {}, new AbortController().signal)
    expect(requests.at(-1)).toBe('bytes=20000-')
    expect(readFileSync(t.dest).equals(BODY)).toBe(true)
  })

  it('starts over when a 206 does not begin where the file ends', async () => {
    const t = target()
    mkdirSync(path.dirname(t.dest), { recursive: true })
    writeFileSync(partOf(t.dest), BODY.subarray(0, 20_000))
    rangeMode = 'wrong-start'
    await fetchFile(t, deps(), () => {}, new AbortController().signal)
    expect(readFileSync(t.dest).equals(BODY)).toBe(true)
  })

  it('starts over when the server ignores the range', async () => {
    const t = target()
    mkdirSync(path.dirname(t.dest), { recursive: true })
    writeFileSync(partOf(t.dest), BODY.subarray(0, 20_000))
    rangeMode = 'ignore'
    await fetchFile(t, deps(), () => {}, new AbortController().signal)
    expect(readFileSync(t.dest).equals(BODY)).toBe(true)
  })

  it('throws away a file that does not match its sha256', async () => {
    const t = { ...target(), sha256: '0'.repeat(64) }
    await expect(fetchFile(t, deps(), () => {}, new AbortController().signal)).rejects.toThrow(
      /checksum/,
    )
    expect(() => readFileSync(partOf(t.dest))).toThrow()
  })

  it('refuses to start without room on the disk', async () => {
    const t = target()
    await expect(
      fetchFile(t, deps({ freeBytes: async () => 1000 }), () => {}, new AbortController().signal),
    ).rejects.toThrow(/disk space/)
    expect(requests).toEqual([])
  })

  it('does nothing for a file already in place', async () => {
    const t = target()
    await fetchFile(t, deps(), () => {}, new AbortController().signal)
    requests = []
    await fetchFile(t, deps(), () => {}, new AbortController().signal)
    expect(requests).toEqual([])
  })
})

describe('rangeStart', () => {
  it('reads where a Content-Range begins', () => {
    expect(rangeStart('bytes 100-199/200')).toBe(100)
    expect(rangeStart(null)).toBeNull()
    expect(rangeStart('nonsense')).toBeNull()
  })
})
