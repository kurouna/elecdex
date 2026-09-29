import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { encodePreview } from '@shared/chip8/preview'
import { decodeSnapshot, SNAPSHOT_MAX_SIZE } from '@shared/chip8/snapshot'
import { HIRES, LORES } from '@shared/chip8/types'
import {
  CHIP8_SLOTS,
  type Chip8Slot,
  type Chip8SlotInfo,
  isChip8ProgramId,
  isChip8Slot,
} from '@shared/chip8-library'
import { replaceFile } from '../store/replace-file.js'

/**
 * A CHIP-8 program's saved machines (docs/architecture.md section 5.18): AUTO, which the
 * pane writes when it goes back to the library or out of sight, and three slots the player
 * writes, as files under userData/chip8/saves/<program>/<slot>.c8s - main's, never a pane's
 * state, which travels with a layout to other machines.
 *
 * What comes in is checked whole with the core's own decoder before it is written, and again
 * when it is read: a file that is not a snapshot of ours is nothing. Writes go through a temp
 * file and replaceFile, so a crash mid-write never leaves half a machine.
 */

/** A program id as a folder name: its one slash turned into two dashes, which ids never hold. */
const folderOf = (id: string): string => id.replace('/', '--')

export class Chip8Saves {
  readonly #dir: string
  readonly #now: () => number

  constructor(dir: string, now: () => number = Date.now) {
    this.#dir = dir
    this.#now = now
  }

  #file(id: string, slot: Chip8Slot): string {
    return path.join(this.#dir, folderOf(id), `${slot}.c8s`)
  }

  /** Keeps a machine in a slot; false for what is not a snapshot of ours. */
  save(id: unknown, slot: unknown, bytes: unknown): Chip8SlotInfo | null {
    if (!isChip8ProgramId(id) || !isChip8Slot(slot) || !(bytes instanceof Uint8Array)) return null
    if (bytes.length > SNAPSHOT_MAX_SIZE || decodeSnapshot(bytes) === null) return null
    const file = this.#file(id, slot)
    mkdirSync(path.dirname(file), { recursive: true })
    const temp = `${file}.tmp`
    writeFileSync(temp, bytes)
    replaceFile(temp, file)
    return this.#info(slot, bytes, this.#now())
  }

  /** A slot's machine, or null for an empty slot or a file that is not one of ours. */
  load(id: unknown, slot: unknown): Uint8Array | null {
    if (!isChip8ProgramId(id) || !isChip8Slot(slot)) return null
    const bytes = this.#read(this.#file(id, slot))
    return bytes !== null && decodeSnapshot(bytes) !== null ? bytes : null
  }

  /** What each slot holds, with its screen, for the SAVE view and the library. */
  slots(id: unknown): Chip8SlotInfo[] {
    if (!isChip8ProgramId(id)) return []
    const infos: Chip8SlotInfo[] = []
    for (const slot of CHIP8_SLOTS) {
      const file = this.#file(id, slot)
      const bytes = this.#read(file)
      if (bytes === null) continue
      const info = this.#info(slot, bytes, statSync(file).mtimeMs)
      if (info !== null) infos.push(info)
    }
    return infos
  }

  /** Forgets every slot of a program (an imported one removed). */
  forget(id: string): void {
    if (!isChip8ProgramId(id)) return
    rmSync(path.join(this.#dir, folderOf(id)), { recursive: true, force: true })
  }

  #read(file: string): Uint8Array | null {
    try {
      if (statSync(file).size > SNAPSHOT_MAX_SIZE) return null
      return new Uint8Array(readFileSync(file))
    } catch {
      return null
    }
  }

  #info(slot: Chip8Slot, bytes: Uint8Array, at: number): Chip8SlotInfo | null {
    const state = decodeSnapshot(bytes)
    if (state === null) return null
    const size = state.hires ? HIRES : LORES
    const planes = state.config.platform === 'xochip' ? 2 : 1
    const preview = encodePreview(
      { w: size.w, h: size.h, pixels: state.pixels.subarray(0, size.w * size.h) },
      planes,
    )
    return { slot, at, preview }
  }
}
