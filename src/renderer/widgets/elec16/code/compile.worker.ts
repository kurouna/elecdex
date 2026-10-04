/// <reference lib="webworker" />
import {
  buildCode,
  type Level,
  type Measured,
  measure,
  measuringMachine,
} from '@shared/e16c/program'
import { buildKitGame, type KitMeta } from '@shared/elec16/kit/build'
import type { Picture } from '@shared/elec16/kit/tiles'
import kitLib from '../../../../../resources/elec16/games/lib/kit.e16.ts?raw'
import runtime from '../../../../../resources/elec16/games/lib/runtime.s?raw'
import soundLib from '../../../../../resources/elec16/games/lib/sound.e16.ts?raw'
import type {
  CodeReply,
  CodeRequest,
  KitFiles,
  KitOutcome,
  KitReply,
  LevelResult,
} from './protocol.ts'

/** The kit's library, the same for every game: the app's own, never a folder's copy. */
const LIB: Record<string, string> = {
  'kit.e16.ts': kitLib,
  'sound.e16.ts': soundLib,
  'runtime.s': runtime,
}

/**
 * CODE's compiler (docs/elec16.md section 6, CODE): e16c, the assembler and a machine to
 * measure on, in a worker of their own - loaded the first time a CODE view opens, as
 * TypeScript's parser is megabytes. It compiles a person's text and runs the result only as
 * E16 code on the core; nothing of it is ever run as JavaScript. It also builds a game from
 * its folder's files with the game kit (docs/elec16-play.md section 11).
 */

const scope = self as unknown as DedicatedWorkerGlobalScope
let rom: Uint8Array | null = null
let snapshot: Uint8Array | null = null

scope.onmessage = (event: MessageEvent<CodeRequest>) => {
  const request = event.data
  if (request.kind === 'rom') {
    rom = request.rom
    snapshot = null
    return
  }
  if (request.kind === 'kit') {
    void kit(request.files, request.romTrap).then((outcome) => {
      const reply: KitReply = { id: request.id, kit: outcome }
      scope.postMessage(reply, outcome.ok ? [outcome.image.buffer as ArrayBuffer] : [])
    })
    return
  }
  const levels = ([0, 1, 2] as Level[]).map((level): LevelResult => {
    const built = buildCode(request.file, request.source, level)
    return { ...built, measured: built.errors.length === 0 ? measured(built.image) : null }
  })
  const reply: CodeReply = { id: request.id, levels }
  scope.postMessage(
    reply,
    levels.map((l) => l.image.buffer as ArrayBuffer),
  )
}

function measured(image: Uint8Array): Measured | null {
  if (rom === null) return null
  snapshot ??= measuringMachine(rom)
  return measure(rom, snapshot, image)
}

/** A game built from its files: the pictures decoded here, then the kit's builder. */
async function kit(files: KitFiles, romTrap: number): Promise<KitOutcome> {
  const fail = (file: string, message: string): KitOutcome => ({
    ok: false,
    errors: [{ file, line: 0, message }],
  })
  let meta: unknown
  try {
    meta = JSON.parse(files.meta)
  } catch (e) {
    return fail('game.json', e instanceof Error ? e.message : String(e))
  }
  const pictures = new Map<string, Picture>()
  for (const [name, bytes] of Object.entries(files.pictures)) {
    const picture = await decode(bytes)
    if (picture === null) return fail(name, 'it is not a picture this can read (PNG)')
    pictures.set(name, picture)
  }
  const built = buildKitGame({
    meta: meta as KitMeta,
    read: (name) => files.texts[name] ?? null,
    picture: (name) => pictures.get(name) ?? null,
    lib: (name) => LIB[name] ?? null,
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

/**
 * A PNG's points as RGBA, exactly as the file has them: no colour space conversion and no
 * premultiplied alpha, so a colour matches its palette to the bit.
 */
async function decode(bytes: Uint8Array): Promise<Picture | null> {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/png' }), {
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const g = canvas.getContext('2d')
    if (g === null) return null
    g.drawImage(bitmap, 0, 0)
    const data = g.getImageData(0, 0, bitmap.width, bitmap.height).data
    return { width: bitmap.width, height: bitmap.height, data: new Uint8Array(data.buffer) }
  } catch {
    return null
  }
}
