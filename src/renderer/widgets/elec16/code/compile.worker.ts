/// <reference lib="webworker" />
import {
  buildCode,
  type Level,
  type Measured,
  measure,
  measuringMachine,
} from '@shared/e16c/program'
import type { CodeReply, CodeRequest, LevelResult } from './protocol.ts'

/**
 * CODE's compiler (docs/elec16.md section 6, CODE): e16c, the assembler and a machine to
 * measure on, in a worker of their own - loaded the first time a CODE view opens, as
 * TypeScript's parser is megabytes. It compiles a person's text and runs the result only as
 * E16 code on the core; nothing of it is ever run as JavaScript.
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
