import { buildKitGame, type KitMeta } from '@shared/elec16/kit/build'
import type { Picture } from '@shared/elec16/kit/tiles'
import type { KitFiles, KitOutcome } from './protocol.ts'

/**
 * A game built from its folder's files with the game kit (docs/elec16-play.md section 11), as
 * CODE's worker does it: the pictures decoded by the decoder given, then the kit's builder.
 * Apart from the worker so a test runs it: it always answers, an error rather than a
 * rejection (a worker that posted nothing left GAMES building for ever).
 */

/**
 * The largest picture a game may have, far past any the machine shows: 4096 points wide, as
 * tall as a cartridge's map can be (ELECLANCE's stage is 320 x 4864), 16M points in all.
 */
export const MAX_PICTURE = { width: 4096, height: 65536, points: 16 * 1024 * 1024 }

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/**
 * A PNG's size from its IHDR (the first chunk, bytes 16-23), read before anything is decoded;
 * null when the bytes are not a PNG.
 */
export function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || PNG_SIGNATURE.some((b, k) => bytes[k] !== b)) return null
  if (String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

const fail = (file: string, message: string): KitOutcome => ({
  ok: false,
  errors: [{ file, line: 0, message }],
})

/** The game's cartridge built from its files, or what is wrong: never a rejection. */
export async function buildKitFiles(
  files: KitFiles,
  romTrap: number,
  lib: (name: string) => string | null,
  decode: (bytes: Uint8Array) => Promise<Picture | null>,
): Promise<KitOutcome> {
  try {
    return await build(files, romTrap, lib, decode)
  } catch (e) {
    return fail('game.json', e instanceof Error ? e.message : String(e))
  }
}

async function build(
  files: KitFiles,
  romTrap: number,
  lib: (name: string) => string | null,
  decode: (bytes: Uint8Array) => Promise<Picture | null>,
): Promise<KitOutcome> {
  let meta: unknown
  try {
    meta = JSON.parse(files.meta)
  } catch (e) {
    return fail('game.json', e instanceof Error ? e.message : String(e))
  }
  const pictures = new Map<string, Picture>()
  for (const [name, bytes] of Object.entries(files.pictures)) {
    const size = pngSize(bytes)
    if (size === null) return fail(name, 'it is not a picture this can read (PNG)')
    const { width, height, points } = MAX_PICTURE
    if (size.width > width || size.height > height || size.width * size.height > points) {
      return fail(name, `${size.width} x ${size.height} is larger than a game's picture can be`)
    }
    const picture = await decode(bytes)
    if (picture === null) return fail(name, 'it is not a picture this can read (PNG)')
    pictures.set(name, picture)
  }
  const built = buildKitGame({
    meta: meta as KitMeta,
    read: (name) => files.texts[name] ?? null,
    picture: (name) => pictures.get(name) ?? null,
    lib,
    romTrap,
  })
  if ('errors' in built) return { ok: false, errors: built.errors.slice(0, 8) }
  const r = built.report
  return {
    ok: true,
    image: built.image,
    assets: r.assets,
    compiled: r.asm,
    banks: r.banks,
    ramCode: r.ramCode,
    tiles: r.tiles,
  }
}
