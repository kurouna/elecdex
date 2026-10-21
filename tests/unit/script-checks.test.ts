import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { archiveIds, checkSha256 } from '../../scripts/script-checks.mjs'

/**
 * What the asset generators check before they trust what they read (issue 33): a chip8Archive
 * checkout's program ids, which become file names, and the time zone release they download.
 */

describe("a chip8Archive checkout's program ids", () => {
  it('are taken when each is a plain name', () => {
    expect(archiveIds({ br8kout: {}, 'octo-ber': {}, snake_2: {} })).toEqual([
      'br8kout',
      'octo-ber',
      'snake_2',
    ])
  })

  it('are refused, all of them, when one would name a file outside the archive', () => {
    for (const id of ['../../src/main/index', 'a/b', 'a\\b', '..', '', 'C:x', 'a.b', ' x']) {
      expect(() => archiveIds({ fine: {}, [id]: {} }), JSON.stringify(id)).toThrow(/program id/)
    }
  })

  it('hold every id of the bundled archive', async () => {
    const { default: source } = await import('../../resources/chip8/archive/source.json', {
      with: { type: 'json' },
    })
    expect(archiveIds(source).length).toBe(Object.keys(source).length)
  })
})

describe('a downloaded file checked against its SHA-256', () => {
  let dir = ''
  afterEach(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true })
    dir = ''
  })

  const file = (content: string) => {
    dir = mkdtempSync(path.join(tmpdir(), 'elecdex-sha-'))
    const at = path.join(dir, 'asset.zip')
    writeFileSync(at, content)
    return at
  }

  it('passes when the bytes are the release', () => {
    // sha256("abc")
    const at = file('abc')
    expect(() =>
      checkSha256(at, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),
    ).not.toThrow()
  })

  it('throws, naming both, when they are not', () => {
    const at = file('abd')
    expect(() =>
      checkSha256(at, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),
    ).toThrow(/expected ba7816bf.*got /)
  })
})
