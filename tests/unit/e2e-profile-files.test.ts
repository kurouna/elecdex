import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The shared e2e app's snapshot of main's files. On CI it once threw ENOENT on
 * `layouts.json.<pid>.tmp`: main was still writing the seeded presets, and renamed the temp
 * file away between the folder being listed and the file being read.
 */

const vanish = vi.hoisted(() => ({ name: '', code: 'ENOENT' }))

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>()
  return {
    ...fs,
    statSync: ((file: string, ...rest: unknown[]) => {
      if (vanish.name !== '' && path.basename(String(file)) === vanish.name) {
        throw Object.assign(new Error(`${vanish.code}: ${file}`), { code: vanish.code })
      }
      return (fs.statSync as (...a: unknown[]) => unknown)(file, ...rest)
    }) as typeof fs.statSync,
  }
})

const { profileFiles } = await import('../e2e/support/profile-files.js')

describe('profileFiles', () => {
  let dir = ''

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'elecdex-profile-'))
    vanish.name = ''
    vanish.code = 'ENOENT'
  })

  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it("leaves out main's writes in flight, at the top and below", () => {
    writeFileSync(path.join(dir, 'notes.json'), '{}')
    writeFileSync(path.join(dir, 'layouts.json.6304.tmp'), '{')
    writeFileSync(path.join(dir, 'weather-cache.json.tmp'), '{')
    mkdirSync(path.join(dir, 'chip8'))
    writeFileSync(path.join(dir, 'chip8', 'library.json'), '[]')
    writeFileSync(path.join(dir, 'chip8', 'library.json.12.tmp'), '[')
    expect(Object.keys(profileFiles(dir)).sort()).toEqual(['chip8/library.json', 'notes.json'])
  })

  it("leaves out the launcher's cache of this machine's apps, which main rewrites as it runs", () => {
    writeFileSync(path.join(dir, 'notes.json'), '{}')
    writeFileSync(path.join(dir, 'launcher-catalog.json'), '{}')
    mkdirSync(path.join(dir, 'launcher-icons'))
    writeFileSync(path.join(dir, 'launcher-icons', 'a.png'), 'png')
    expect(Object.keys(profileFiles(dir))).toEqual(['notes.json'])
  })

  it('skips a file that went between the listing and the read', () => {
    writeFileSync(path.join(dir, 'notes.json'), '{}')
    writeFileSync(path.join(dir, 'tasks.json'), '[]')
    vanish.name = 'tasks.json'
    expect(Object.keys(profileFiles(dir))).toEqual(['notes.json'])
  })

  it('still throws any other failure to read', () => {
    writeFileSync(path.join(dir, 'tasks.json'), '[]')
    vanish.name = 'tasks.json'
    vanish.code = 'EACCES'
    expect(() => profileFiles(dir)).toThrow(/EACCES/)
  })
})
