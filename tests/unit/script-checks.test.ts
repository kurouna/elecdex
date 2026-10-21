import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { archiveIds, checkSha256, fetchChecked } from '../../scripts/script-checks.mjs'

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

describe('a download kept only once it is the release (review of issue 33)', () => {
  let dir = ''
  afterEach(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true })
    dir = ''
  })
  const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

  it('downloads beside the file, checks, and only then puts it in place', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'elecdex-dl-'))
    const zip = path.join(dir, 'asset.zip')
    const asked: string[] = []
    fetchChecked(zip, ABC, (to) => {
      asked.push(to)
      writeFileSync(to, 'abc')
    })
    expect(asked).toEqual([`${zip}.part`])
    expect(readFileSync(zip, 'utf8')).toBe('abc')
    expect(existsSync(`${zip}.part`)).toBe(false)
    // Kept: the next run downloads nothing.
    fetchChecked(zip, ABC, () => {
      throw new Error('downloaded again')
    })
  })

  it('keeps nothing that is not the release, so the next run tries again', () => {
    // Found in review: a 404 page or a cut download stayed in the cache, and every later run
    // failed the same way until someone deleted it.
    dir = mkdtempSync(path.join(tmpdir(), 'elecdex-dl-'))
    const zip = path.join(dir, 'asset.zip')
    expect(() => fetchChecked(zip, ABC, (to) => writeFileSync(to, '<html>404</html>'))).toThrow(
      /expected ba7816bf/,
    )
    expect(existsSync(zip)).toBe(false)
    expect(existsSync(`${zip}.part`)).toBe(false)
    // One left by a run from before is let go too.
    writeFileSync(zip, 'stale')
    expect(() => fetchChecked(zip, ABC, () => {})).toThrow(/expected ba7816bf/)
    expect(existsSync(zip)).toBe(false)
  })
})

describe('a cached download that cannot be read just now (review)', () => {
  it('is told from one that is not the release, which alone is let go', () => {
    // A virus scanner or an indexer holding the file is no reason to download it again.
    const dir = mkdtempSync(path.join(tmpdir(), 'elecdex-dl-'))
    try {
      const zip = path.join(dir, 'asset.zip')
      writeFileSync(zip, 'abd')
      const mismatch = (() => {
        try {
          checkSha256(zip, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
        } catch (error) {
          return (error as { mismatch?: boolean }).mismatch
        }
      })()
      expect(mismatch).toBe(true)
      const unread = (() => {
        try {
          checkSha256(path.join(dir, 'gone.zip'), 'ba7816bf')
        } catch (error) {
          return (error as { mismatch?: boolean }).mismatch
        }
      })()
      expect(unread).toBeUndefined()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
