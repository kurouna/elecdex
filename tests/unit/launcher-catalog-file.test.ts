import { describe, expect, it } from 'vitest'
import type { CatalogEntry } from '../../src/main/launcher/catalog.js'
import {
  CatalogFileSchema,
  catalogFileOf,
  emptyCatalogFile,
  savedCatalog,
} from '../../src/main/launcher/catalog-file.js'

/** launcher-catalog.json: the last scan's list, read back only on the platform that wrote it. */

const entry = (over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id: '0123456789abcdef',
  name: 'Code',
  group: 'Visual Studio Code',
  source: 'system',
  target: 'C:\\Start Menu\\Code.lnk',
  args: [],
  ...over,
})

describe('launcher-catalog.json', () => {
  it('gives back the entries it saved, with and without a command line', () => {
    const entries = [entry(), entry({ id: 'fedcba9876543210', exec: 'code --new-window %F' })]
    const file = CatalogFileSchema.parse(
      JSON.parse(JSON.stringify(catalogFileOf(entries, 'linux'))),
    )
    expect(savedCatalog(file, 'linux')).toEqual(entries)
  })

  it('has nothing for another platform, or when nothing was saved', () => {
    expect(savedCatalog(catalogFileOf([entry()], 'win32'), 'darwin')).toBeNull()
    expect(savedCatalog(emptyCatalogFile('win32'), 'win32')).toBeNull()
  })

  it('refuses a file of another version, an id that is not one, and lists past the bounds', () => {
    const good = catalogFileOf([entry()], 'win32')
    expect(CatalogFileSchema.safeParse(good).success).toBe(true)
    expect(CatalogFileSchema.safeParse({ ...good, version: 2 }).success).toBe(false)
    expect(
      CatalogFileSchema.safeParse({ ...good, entries: [{ ...entry(), id: '../x' }] }).success,
    ).toBe(false)
    expect(
      CatalogFileSchema.safeParse({ ...good, entries: [{ ...entry(), source: 'user' }] }).success,
    ).toBe(false)
    expect(
      CatalogFileSchema.safeParse({ ...good, entries: Array(2001).fill(entry()) }).success,
    ).toBe(false)
    expect(
      CatalogFileSchema.safeParse({ ...good, entries: [entry({ args: Array(33).fill('x') })] })
        .success,
    ).toBe(false)
  })
})
