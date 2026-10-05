import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  buildKitFiles,
  MAX_PICTURE,
  pngSize,
} from '../../src/renderer/widgets/elec16/code/kit-files'

/**
 * A game built from its folder's files in CODE's worker (docs/elec16-play.md section 11): the
 * build always answers - never a rejection that leaves GAMES waiting - and a PNG's size is
 * read from its header before anything is decoded, so a huge one is refused, not allocated.
 */

const LIB: Record<string, string> = Object.fromEntries(
  ['kit.e16.ts', 'sound.e16.ts', 'runtime.s'].map((name) => [
    name,
    readFileSync(`resources/elec16/games/lib/${name}`, 'utf8'),
  ]),
)
const lib = (name: string) => LIB[name] ?? null

/** A PNG's first bytes: the signature and an IHDR of `width` x `height`. */
function pngHead(width: number, height: number): Uint8Array {
  const b = new Uint8Array(33)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  new DataView(b.buffer).setUint32(16, width)
  new DataView(b.buffer).setUint32(20, height)
  return b
}

describe("a kit build from a folder's files", () => {
  it('answers with an error, never a rejection, when the build itself throws', async () => {
    const files = { meta: JSON.stringify({ id: 'X' }), texts: {}, pictures: {} }
    const outcome = await buildKitFiles(files, 0x8000, lib, async () => null)
    expect(outcome.ok).toBe(false)
    const thrown = await buildKitFiles(
      { meta: '{}', texts: {}, pictures: { 'a.png': pngHead(8, 8) } },
      0x8000,
      lib,
      async () => {
        throw new Error('the decoder broke')
      },
    )
    expect(thrown.ok).toBe(false)
    expect(JSON.stringify(thrown)).toContain('the decoder broke')
  })

  it('reads a PNG size from its header, and refuses one too large before decoding it', async () => {
    expect(pngSize(pngHead(320, 288))).toEqual({ width: 320, height: 288 })
    expect(pngSize(pngHead(320, 4864))).toEqual({ width: 320, height: 4864 })
    expect(pngSize(new Uint8Array([1, 2, 3]))).toBeNull()
    let decoded = 0
    const outcome = await buildKitFiles(
      {
        meta: '{}',
        texts: {},
        pictures: { 'huge.png': pngHead(MAX_PICTURE.width, MAX_PICTURE.height) },
      },
      0x8000,
      lib,
      async () => {
        decoded++
        return null
      },
    )
    expect(decoded).toBe(0)
    expect(outcome.ok).toBe(false)
    expect(JSON.stringify(outcome)).toContain('huge.png')
  })
})
