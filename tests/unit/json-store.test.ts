import { spawn } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { JsonStore } from '../../src/main/store/json-store.js'

const Schema = z.object({ version: z.number().int(), name: z.string() })
type Value = z.infer<typeof Schema>

let dir: string
let file: string

const makeStore = () =>
  new JsonStore<Value>({
    file,
    schema: Schema,
    makeDefault: () => ({ version: 1, name: 'default' }),
  })

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-store-'))
  file = path.join(dir, 'nested', 'layout.json')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(dir, { recursive: true, force: true })
})

describe('JsonStore', () => {
  it('returns the default without creating a file when none exists', () => {
    expect(makeStore().read()).toEqual({ version: 1, name: 'default' })
    expect(existsSync(file)).toBe(false)
  })

  it('round-trips a written value, creating parent directories', () => {
    makeStore().write({ version: 1, name: 'mine' })
    expect(makeStore().read()).toEqual({ version: 1, name: 'mine' })
  })

  it('never overwrites an existing valid file with the default', () => {
    // The original project re-copied its bundled config over userData on every
    // launch, destroying user edits. Reading must not write.
    makeStore().write({ version: 1, name: 'edited by hand' })
    const before = readFileSync(file, 'utf8')
    makeStore().read()
    expect(readFileSync(file, 'utf8')).toBe(before)
  })

  it('quarantines invalid JSON to .bak instead of deleting it', () => {
    mkdirp()
    writeFileSync(file, '{ not json', 'utf8')
    expect(makeStore().read()).toEqual({ version: 1, name: 'default' })
    expect(readFileSync(`${file}.bak`, 'utf8')).toBe('{ not json')
    expect(existsSync(file)).toBe(false)
  })

  it('quarantines schema-invalid JSON', () => {
    mkdirp()
    writeFileSync(file, JSON.stringify({ version: 'x' }), 'utf8')
    expect(makeStore().read().name).toBe('default')
    expect(existsSync(`${file}.bak`)).toBe(true)
  })

  it('quarantines a value the repair step rejects, and applies one it accepts', () => {
    makeStore().write({ version: 9, name: 'future' })
    expect(makeStore().read((v) => (v.version > 1 ? null : v)).name).toBe('default')
    expect(existsSync(`${file}.bak`)).toBe(true)

    makeStore().write({ version: 0, name: 'old' })
    expect(makeStore().read((v) => ({ ...v, version: 1 }))).toEqual({ version: 1, name: 'old' })
  })

  describe('keepInvalid (a file edited by hand)', () => {
    const makeKeeping = () =>
      new JsonStore<Value>({
        file,
        schema: Schema,
        makeDefault: () => ({ version: 1, name: 'default' }),
        keepInvalid: true,
      })

    it.each([
      ['invalid JSON', '{ not json'],
      ['schema-invalid JSON', JSON.stringify({ version: 'x' })],
    ])('leaves %s in place on read and writes nothing', (_label, broken) => {
      mkdirp()
      writeFileSync(file, broken, 'utf8')
      expect(makeKeeping().read()).toEqual({ version: 1, name: 'default' })
      expect(readFileSync(file, 'utf8')).toBe(broken)
      expect(existsSync(`${file}.bak`)).toBe(false)
    })

    it('backs up a file that was broken at startup before a write replaces it', () => {
      mkdirp()
      writeFileSync(file, '{ not json', 'utf8')
      const store = makeKeeping()
      store.read()
      store.write({ version: 1, name: 'from the UI' })
      expect(readFileSync(`${file}.bak`, 'utf8')).toBe('{ not json')
      expect(makeKeeping().read().name).toBe('from the UI')
    })

    it('backs up a file broken after it was read, before a write replaces it', () => {
      const store = makeKeeping()
      store.write({ version: 1, name: 'good' })
      writeFileSync(file, '{ "name": ', 'utf8')
      store.write({ version: 1, name: 'from the UI' })
      expect(readFileSync(`${file}.bak`, 'utf8')).toBe('{ "name": ')
      expect(makeKeeping().read().name).toBe('from the UI')
    })

    it('does not touch .bak when the file on disk is valid', () => {
      const store = makeKeeping()
      store.write({ version: 1, name: 'a' })
      store.write({ version: 1, name: 'b' })
      expect(existsSync(`${file}.bak`)).toBe(false)
    })
  })

  it('refuses to write an invalid value and leaves the file untouched', () => {
    makeStore().write({ version: 1, name: 'good' })
    const before = readFileSync(file, 'utf8')
    expect(() => makeStore().write({ version: 'bad' } as unknown as Value)).toThrow(/invalid/i)
    expect(readFileSync(file, 'utf8')).toBe(before)
  })

  it('leaves no temp files behind after a write', () => {
    makeStore().write({ version: 1, name: 'a' })
    makeStore().write({ version: 1, name: 'b' })
    expect(readdirSync(path.dirname(file)).filter((f) => f.endsWith('.tmp'))).toEqual([])
  })

  it('caches reads until invalidated', () => {
    const store = makeStore()
    store.write({ version: 1, name: 'first' })
    writeFileSync(file, JSON.stringify({ version: 1, name: 'changed on disk' }), 'utf8')
    expect(store.read().name).toBe('first')
    store.invalidate()
    expect(store.read().name).toBe('changed on disk')
  })
})

describe('JsonStore while another process reads the file', () => {
  // On Windows a rename over a file someone has open fails with EPERM. The e2e
  // test polling layout.json for a save lost that save now and then, and so would
  // an antivirus scan or an editor: the layout, settings or notes of that moment.
  // The reader here opens the file every millisecond, far more often than any of those.
  it.runIf(process.platform === 'win32')('keeps every write', async () => {
    const store = makeStore()
    store.write({ version: 1, name: 'first' })
    const reader = spawn(process.execPath, [
      '-e',
      `const fs = require('fs')
      console.log('ready')
      setInterval(() => { try { fs.readFileSync(process.argv[1]) } catch {} }, 1)`,
      file,
    ])
    try {
      await new Promise((resolve) => reader.stdout.once('data', resolve))
      for (let i = 0; i < 500; i++) store.write({ version: 1, name: `write ${i}` })
      // Still being read: the last write reaches the disk anyway, soon after.
      await vi.waitFor(
        () => expect(JSON.parse(readFileSync(file, 'utf8')).name).toBe('write 499'),
        {
          timeout: 10_000,
          interval: 20,
        },
      )
    } finally {
      reader.kill()
    }
  })
})

/** The store creates directories on write; a test that pre-seeds a file must too. */
function mkdirp(): void {
  mkdirSync(path.dirname(file), { recursive: true })
}
