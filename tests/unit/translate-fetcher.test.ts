import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  FetchError,
  type FetcherDeps,
  fetchFile,
  partOf,
  rangeStart,
  sizeSaid,
  writeFailure,
} from '../../src/main/translate/fetcher'
import { sha256File, stopHashing } from '../../src/main/translate/hash'

const BODY = Buffer.from(Array.from({ length: 50_000 }, (_, i) => i % 251))
const SHA = createHash('sha256').update(BODY).digest('hex')

/** How the stub answers a ranged request. */
let rangeMode: 'honest' | 'wrong-start' | 'ignore' | 'stall' | 'too-much' | 'wrong-size' = 'honest'
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
    if (rangeMode === 'stall') {
      // Half the file, then nothing: a download in progress when PAUSE or CANCEL comes.
      res.writeHead(200)
      res.write(BODY.subarray(0, 20_000))
      return
    }
    if (rangeMode === 'too-much') {
      // A broken server or proxy: far more than the file, and not the file, its size unsaid.
      res.writeHead(200)
      res.write(Buffer.alloc(BODY.length * 3 + 1, 9))
      res.end()
      return
    }
    if (rangeMode === 'wrong-size') {
      // Another file, its size said up front.
      res.writeHead(200, { 'content-length': String(BODY.length * 2) })
      res.end(Buffer.alloc(BODY.length * 2, 9))
      return
    }
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
  server.closeAllConnections()
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

describe('fetchFile when it cannot go on', () => {
  it('stops on abort with what it had written kept in the .part', async () => {
    rangeMode = 'stall'
    const t = target()
    const controller = new AbortController()
    const run = fetchFile(t, deps(), () => {}, controller.signal)
    // Wait until the first half is on disk.
    await expect
      .poll(() => {
        try {
          return readFileSync(partOf(t.dest)).length
        } catch {
          return 0
        }
      })
      .toBe(20_000)
    controller.abort()
    await expect(run).rejects.toThrow()
    expect(readFileSync(partOf(t.dest)).equals(BODY.subarray(0, 20_000))).toBe(true)
  })

  it('says a write it cannot make, rather than ending main with an unheard stream error', async () => {
    const t = target()
    // A folder where the .part goes: opening it for writing fails.
    mkdirSync(partOf(t.dest), { recursive: true })
    await expect(fetchFile(t, deps(), () => {}, new AbortController().signal)).rejects.toThrow(
      FetchError,
    )
  })

  it('stops a server that sends more than the file holds before it fills the disk', async () => {
    rangeMode = 'too-much'
    const t = target()
    await expect(fetchFile(t, deps(), () => {}, new AbortController().signal)).rejects.toThrow(
      /more than the file's 50000 bytes/,
    )
    // The wrong object every time: not asked for again.
    expect(requests).toHaveLength(1)
    // Never more than the file on disk, whatever came.
    let size = 0
    try {
      size = readFileSync(partOf(t.dest)).length
    } catch {}
    expect(size).toBeLessThanOrEqual(BODY.length)
  })

  it('refuses an answer that says another size before reading a byte of it', async () => {
    rangeMode = 'wrong-size'
    const t = target()
    await expect(fetchFile(t, deps(), () => {}, new AbortController().signal)).rejects.toThrow(
      /is 100000 bytes, not 50000/,
    )
    expect(requests).toHaveLength(1)
    let size = 0
    try {
      size = readFileSync(partOf(t.dest)).length
    } catch {}
    expect(size).toBe(0)
  })

  it('does not retry a full disk, and retries a passing lock', () => {
    const full = Object.assign(new Error('no space'), { code: 'ENOSPC' })
    const locked = Object.assign(new Error('busy'), { code: 'EBUSY' })
    expect(writeFailure(full).retryable).toBe(false)
    expect(writeFailure(full).message).toMatch(/disk is full/)
    expect(writeFailure(locked).retryable).toBe(true)
  })
})

describe('sha256File', () => {
  it('settles when its worker is ended before it answers (quitting)', async () => {
    const file = path.join(dir, 'big.bin')
    writeFileSync(file, Buffer.alloc(64 * 1024 * 1024))
    const hashing = sha256File(file)
    stopHashing()
    await expect(hashing).rejects.toThrow(/stopped before it finished/)
  })

  it('leaves no handle on the file it read: it can be replaced and removed at once', async () => {
    // A worker ended between the stream's 'end' and its 'close' kept the file open for the
    // rest of the process; on Windows a file held open cannot be replaced (an UPDATE) or
    // removed (a DELETE). Hashed again and again, so a leak cannot hide behind timing.
    const file = path.join(dir, 'model.gguf')
    const next = path.join(dir, 'model.gguf.part')
    for (let i = 0; i < 80; i++) {
      writeFileSync(file, Buffer.alloc(256 * 1024, i))
      await sha256File(file)
      writeFileSync(next, Buffer.alloc(256 * 1024, i + 1))
      renameSync(next, file)
      rmSync(file)
    }
  })

  it('leaves no handle either when it is stopped half way (PAUSE, CANCEL)', async () => {
    const file = path.join(dir, 'model.gguf')
    for (let i = 0; i < 20; i++) {
      writeFileSync(file, Buffer.alloc(16 * 1024 * 1024, i))
      const controller = new AbortController()
      const hashing = sha256File(file, controller.signal)
      await new Promise((resolve) => setTimeout(resolve, i % 5))
      controller.abort()
      await hashing.catch(() => {})
      // As RESUME's placing or an UPDATE does: another file renamed over it.
      const next = `${file}.next`
      writeFileSync(next, 'x')
      renameSync(next, file)
      rmSync(file)
    }
  })
})

describe('rangeStart', () => {
  it('reads the whole file’s size an answer says, and none from an encoded body', () => {
    const answer = (status: number, headers: Record<string, string>) =>
      new Response(status === 206 || status === 200 ? 'x' : null, { status, headers })
    expect(sizeSaid(answer(200, { 'content-length': '50000' }))).toBe(50_000)
    expect(sizeSaid(answer(206, { 'content-range': 'bytes 100-49999/50000' }))).toBe(50_000)
    expect(sizeSaid(answer(206, { 'content-range': 'bytes 100-49999/*' }))).toBeNull()
    expect(sizeSaid(answer(200, { 'content-length': '12', 'content-encoding': 'gzip' }))).toBeNull()
  })

  it('reads where a Content-Range begins', () => {
    expect(rangeStart('bytes 100-199/200')).toBe(100)
    expect(rangeStart(null)).toBeNull()
    expect(rangeStart('nonsense')).toBeNull()
  })
})
