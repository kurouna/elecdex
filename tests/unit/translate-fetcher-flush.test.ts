import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Writable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The fetcher's last write (docs/translate.md §5): the bytes still buffered reach the disk only as
 * the stream ends, so a full disk there must be said as one, not left for the checksum to take for
 * a bad download that drops the whole `.part`. The `.part`'s stream is stood in for: it fails as it
 * is ended, or on a write, and then, like a file stream, says why only after closing (a while).
 */

/** Where the stand-in fails: as it is ended, or on the write of the body. */
const fails = { at: 'final' as 'final' | 'write' }
const full = () => Object.assign(new Error('no space'), { code: 'ENOSPC' })

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>()
  return {
    ...fs,
    createWriteStream: () =>
      new Writable({
        // As a file write: taken at once, its failure known a little later.
        write: (_chunk, _encoding, done) =>
          setTimeout(() => done(fails.at === 'write' ? full() : null), 5),
        final: (done) => done(full()),
        // A file stream says its error only once the file is closed: destroyed at once, heard later.
        destroy: (error, done) => setTimeout(() => done(error), 30),
      }),
  }
})

const { fetchFile } = await import('../../src/main/translate/fetcher')

const BODY = Buffer.alloc(10_000, 7)
let dir = ''

beforeEach(() => {
  fails.at = 'final'
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-flush-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

/** The body, its end coming after the write failed and before the stream says so. */
const slowBody = () =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(BODY))
      setTimeout(() => controller.close(), 15)
    },
  })

function fetchBody(hash: () => Promise<string>) {
  return fetchFile(
    {
      url: 'http://stand-in/model.gguf',
      dest: path.join(dir, 'model.gguf'),
      bytes: BODY.length,
      sha256: createHash('sha256').update(BODY).digest('hex'),
    },
    {
      fetch: async () => new Response(slowBody(), { status: 200 }),
      hash,
      freeBytes: async () => null,
      place: () => {},
      sleep: async () => {},
      now: () => 0,
    },
    () => {},
    new AbortController().signal,
  )
}

describe('fetchFile’s last write', () => {
  it('says a full disk met on a write the body ended before it was heard of', async () => {
    fails.at = 'write'
    const hash = vi.fn(async () => createHash('sha256').update(BODY).digest('hex'))
    await expect(fetchBody(hash)).rejects.toThrow(/disk is full/)
    expect(hash).not.toHaveBeenCalled()
  })

  it('says a full disk met as the file is closed, and never checks the sum of what is not there', async () => {
    const hash = vi.fn(async () => createHash('sha256').update(BODY).digest('hex'))
    const run = fetchFile(
      {
        url: 'http://stand-in/model.gguf',
        dest: path.join(dir, 'model.gguf'),
        bytes: BODY.length,
        sha256: createHash('sha256').update(BODY).digest('hex'),
      },
      {
        fetch: async () => new Response(BODY, { status: 200 }),
        hash,
        freeBytes: async () => null,
        place: () => {},
        sleep: async () => {},
        now: () => 0,
      },
      () => {},
      new AbortController().signal,
    )
    await expect(run).rejects.toThrow(/disk is full/)
    expect(hash).not.toHaveBeenCalled()
  })
})
