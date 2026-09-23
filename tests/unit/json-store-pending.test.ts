import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { z } from 'zod'

/**
 * A store whose rename is still being retried (Windows refuses it while
 * anything has the file open - main/store/replace-file.ts) has newer data in
 * memory than on disk. Dropping the copy in memory then would read the older
 * file back, and the next write would be built on it: a layout just saved
 * vanished from the list that way when the dialog asked for it again.
 */

const blocked = vi.hoisted(() => ({ on: false }))
vi.mock('node:fs', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs')>()
  const renameSync: typeof fs.renameSync = (from, to) => {
    if (blocked.on)
      throw Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })
    fs.renameSync(from, to)
  }
  return { ...fs, default: { ...fs, renameSync }, renameSync }
})

const { JsonStore } = await import('../../src/main/store/json-store.js')

const Schema = z.object({ version: z.number().int(), name: z.string() })
let dir = ''
let file = ''

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-pending-'))
  file = path.join(dir, 'layouts.json')
  blocked.on = false
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  blocked.on = false
  vi.restoreAllMocks()
  rmSync(dir, { recursive: true, force: true })
})

it('keeps what it wrote while the file on disk is still the older one', async () => {
  const store = new JsonStore({
    file,
    schema: Schema,
    makeDefault: () => ({ version: 1, name: 'default' }),
  })
  store.write({ version: 1, name: 'one' })
  // Something has the file open: the rename of the next write waits its turn.
  blocked.on = true
  store.write({ version: 1, name: 'one and two' })
  expect(JSON.parse(readFileSync(file, 'utf8')).name).toBe('one')

  store.invalidate()
  expect(store.read().name).toBe('one and two')

  // Let go: the retry lands, and from then on the disk is the truth again.
  blocked.on = false
  await vi.waitFor(() => expect(JSON.parse(readFileSync(file, 'utf8')).name).toBe('one and two'))
  store.invalidate()
  expect(store.read().name).toBe('one and two')
})
