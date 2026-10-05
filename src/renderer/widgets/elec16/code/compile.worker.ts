/// <reference lib="webworker" />
import {
  buildCode,
  type Level,
  type Measured,
  measure,
  measuringMachine,
} from '@shared/e16c/program'
import type { Picture } from '@shared/elec16/kit/tiles'
import kitLib from '../../../../../resources/elec16/games/lib/kit.e16.ts?raw'
import runtime from '../../../../../resources/elec16/games/lib/runtime.s?raw'
import soundLib from '../../../../../resources/elec16/games/lib/sound.e16.ts?raw'
import { buildKitFiles } from './kit-files.ts'
import type { CodeReply, CodeRequest, KitReply, LevelResult } from './protocol.ts'

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
    const lib = (name: string) => LIB[name] ?? null
    void buildKitFiles(request.files, request.romTrap, lib, decode).then((outcome) => {
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

/**
 * A PNG's points as RGBA, exactly as the file has them: no colour space conversion and no
 * premultiplied alpha, so a colour matches its palette to the bit. Its size was checked from
 * its header first (kit-files.ts).
 */
async function decode(bytes: Uint8Array): Promise<Picture | null> {
  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/png' }), {
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
  } finally {
    // Its memory is the decoder's until closed, not the collector's.
    bitmap?.close()
  }
}
