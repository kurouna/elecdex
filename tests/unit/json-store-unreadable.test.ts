import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

/**
 * A file that is there but cannot be read for a moment - another program holding it open
 * without read sharing, as a virus scanner or a backup tool does on Windows (EBUSY, EPERM) - is
 * not a missing file. The store used to take it for one: it answered the default, and the next
 * write, made from that default, replaced the user's file whole (the saved layouts, the live
 * arrangement). Here the read is made to fail as Windows makes it fail.
 */
const busy = vi.hoisted(() => ({ files: new Set<string>() }))

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>()
  const readFileSync = ((file: Parameters<typeof fs.readFileSync>[0], ...rest: unknown[]) => {
    if (typeof file === 'string' && busy.files.has(file)) {
      throw Object.assign(new Error(`EBUSY: resource busy or locked, open '${file}'`), {
        code: 'EBUSY',
      })
    }
    return (fs.readFileSync as (...args: unknown[]) => unknown)(file, ...rest)
  }) as typeof fs.readFileSync
  return { ...fs, default: { ...fs, readFileSync }, readFileSync }
})

const { JsonStore } = await import('../../src/main/store/json-store.js')

const Schema = z.object({ version: z.number().int(), items: z.array(z.string()) })
type Value = z.infer<typeof Schema>

let dir: string
let file: string

const makeStore = () =>
  new JsonStore<Value>({
    file,
    schema: Schema,
    makeDefault: () => ({ version: 1, items: [] }),
  })

const MINE = `${JSON.stringify({ version: 1, items: ['a', 'b', 'c'] }, null, 2)}\n`

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-busy-'))
  file = path.join(dir, 'layouts.json')
  writeFileSync(file, MINE)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  busy.files.clear()
  vi.restoreAllMocks()
  rmSync(dir, { recursive: true, force: true })
})

describe('JsonStore and a file that cannot be read', () => {
  it('does not replace the file with a write made from the default it answered', () => {
    const store = makeStore()
    busy.files.add(file)
    const current = store.read()
    expect(current.items).toEqual([])
    expect(store.readFailed).toBe(true)
    // What a caller does next: adds to what it was given, and writes it.
    expect(() => store.write({ ...current, items: ['new'] })).toThrow(/could not be read/)
    busy.files.clear()
    expect(readFileSync(file, 'utf8')).toBe(MINE)
  })

  it('reads the file again on the next read, rather than keeping the default', () => {
    const store = makeStore()
    busy.files.add(file)
    store.read()
    busy.files.clear()
    expect(store.read().items).toEqual(['a', 'b', 'c'])
    expect(store.readFailed).toBe(false)
    store.write({ version: 1, items: ['a', 'b', 'c', 'd'] })
    expect(makeStore().read().items).toEqual(['a', 'b', 'c', 'd'])
  })

  it('goes on refusing, once the file is free, until it has been read again', () => {
    const store = makeStore()
    busy.files.add(file)
    store.read()
    busy.files.clear()
    // Free now, but nothing has read it: what is written is still made from the default. A
    // module that keeps what it read in memory writes again and again without reading.
    expect(() => store.write({ version: 1, items: [] })).toThrow(/could not be read/)
    expect(() => store.write({ version: 1, items: ['x'] })).toThrow(/could not be read/)
    expect(readFileSync(file, 'utf8')).toBe(MINE)
    // Read again, it is the file's own: the write made from it goes through.
    expect(store.read().items).toEqual(['a', 'b', 'c'])
    store.write({ version: 1, items: ['a', 'b', 'c', 'x'] })
    expect(makeStore().read().items).toEqual(['a', 'b', 'c', 'x'])
  })

  describe('writeHeld, for a module that keeps what it read in memory', () => {
    it('writes as write does when the last read was the file', () => {
      const store = makeStore()
      store.read()
      const take = vi.fn()
      store.writeHeld({ version: 1, items: ['a', 'b', 'c', 'd'] }, take)
      expect(take).not.toHaveBeenCalled()
      expect(makeStore().read().items).toEqual(['a', 'b', 'c', 'd'])
    })

    it('refuses while the file still cannot be read, and gives nothing to take', () => {
      const store = makeStore()
      busy.files.add(file)
      store.read()
      const take = vi.fn()
      expect(() => store.writeHeld({ version: 1, items: ['new'] }, take)).toThrow(
        /could not be read/,
      )
      expect(take).not.toHaveBeenCalled()
      busy.files.clear()
      expect(readFileSync(file, 'utf8')).toBe(MINE)
    })

    it('refuses once the file is free, and gives it to take in place of the default', () => {
      const store = makeStore()
      busy.files.add(file)
      store.read()
      busy.files.clear()
      const take = vi.fn()
      expect(() => store.writeHeld({ version: 1, items: ['new'] }, take)).toThrow(/read again/)
      expect(take).toHaveBeenCalledWith({ version: 1, items: ['a', 'b', 'c'] })
      expect(readFileSync(file, 'utf8')).toBe(MINE)
      // Taken in: the next change, made from the file, is written.
      store.writeHeld({ version: 1, items: ['a', 'b', 'c', 'new'] }, take)
      expect(makeStore().read().items).toEqual(['a', 'b', 'c', 'new'])
    })
  })

  it('still takes a missing file for the default, and writes it', () => {
    rmSync(file)
    const store = makeStore()
    expect(store.read().items).toEqual([])
    expect(store.readFailed).toBe(false)
    store.write({ version: 1, items: ['first'] })
    expect(makeStore().read().items).toEqual(['first'])
  })
})
