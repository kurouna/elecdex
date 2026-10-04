import { existsSync, readFileSync } from 'node:fs'
import { playRomFile } from '@shared/e16c/play-rom'
import { buildKitGame, type KitInput, type KitMeta } from '@shared/elec16/kit/build'
import type { Picture } from '@shared/elec16/kit/tiles'
import { LINK_STATUS } from '@shared/elec16/link-services'
import { Elec16 } from '@shared/elec16/machine'
import { XRAM_MAX } from '@shared/elec16/map'
import { padBit } from '@shared/elec16/pad'
import { buildRom } from '@shared/elec16/rom'
// @ts-expect-error: a plain script, read as it is.
import { readPng } from '../../scripts/png.mjs'
import playJson from '../../src/renderer/widgets/elec16/play-rom.json'

/**
 * The game kit's games on the core (docs/elec16-play.md section 10): built from a folder as
 * gen:elec16 builds them, put in the slot and started from the PLAY ROM's start screen with
 * START, then run a frame at a time.
 */

const LIB = 'resources/elec16/games/lib/'
const text = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : null)

export const ROM = buildRom((name) => text(`resources/elec16/${playRomFile(name)}`))
export const ROM_TRAP = playJson.symbols.trap ?? 0

/** A folder's picture, decoded. */
export function pictureFile(file: string): Picture | null {
  return existsSync(file) ? (readPng(readFileSync(file)) as Picture) : null
}

/** A kit game built from `dir`, with pictures from `pictures` before the folder's files. */
export function buildKit(dir: string, meta: KitMeta, pictures: Record<string, Picture> = {}) {
  const input: KitInput = {
    meta,
    read: (name) => text(`${dir}/${name}`),
    picture: (name) => pictures[name] ?? pictureFile(`${dir}/${name}`),
    lib: (name) => text(LIB + name),
    romTrap: ROM_TRAP,
  }
  return buildKitGame(input)
}

/** Runs until it sleeps or stops, answering CART's LINK with `cart`. */
export function settle(m: Elec16, cart: Uint8Array | null): void {
  for (let k = 0; k < 400; k++) {
    const r = m.run(2_000_000)
    const request = m.takeLinkRequest()
    if (request !== null) {
      if (cart === null) m.answerLink(request.serial, { status: LINK_STATUS.failed })
      else {
        m.answerLink(request.serial, {
          status: LINK_STATUS.ready,
          data: cart.subarray(0, 64),
          ...(request.type === 1 ? { cart: { image: cart, digest: new Uint8Array(32) } } : {}),
        })
      }
      continue
    }
    if (r.halted !== null || r.sleeping !== null) return
  }
  throw new Error('it never slept')
}

/** PLAY-320 switched on with `cart` in the slot, START pressed: the game running. */
export function startGame(cart: Uint8Array): Elec16 {
  const m = Elec16.boot(ROM.image, 'play-320', undefined, XRAM_MAX)
  settle(m, cart)
  tap(m, padBit('start'), cart)
  return m
}

/** Frames go by: a sixtieth of a second each, the machine run until it sleeps again. */
export function frames(m: Elec16, n: number, cart: Uint8Array | null = null): void {
  for (let k = 0; k < n; k++) {
    m.advance(1000 / 60)
    settle(m, cart)
  }
}

/** A button pressed for two frames and let go. */
export function tap(m: Elec16, bit: number, cart: Uint8Array | null = null): void {
  m.pad(bit)
  frames(m, 2, cart)
  m.pad(0)
  frames(m, 2, cart)
}

export const word = (m: Elec16, at: number) =>
  (m.state.ram[at] ?? 0) | ((m.state.ram[at + 1] ?? 0) << 8)

/**
 * A kit game's globals and arrays by name, from what e16c writes at the top of its output
 * (`; name at 0x0280` for a global, `name = 0x0300 ; 48 bytes` for an array).
 */
export function globalsOf(asm: string): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of asm.matchAll(/^; (\w+) at 0x([0-9a-f]+)$/gm)) {
    out.set(m[1] ?? '', Number.parseInt(m[2] ?? '0', 16))
  }
  for (const m of asm.matchAll(/^(\w+) = 0x([0-9a-f]+) ; \d+ bytes$/gm)) {
    out.set(m[1] ?? '', Number.parseInt(m[2] ?? '0', 16))
  }
  return out
}

/** A RAM word, and a word put there, by a game's global name. */
export function ramWord(m: Elec16, at: number): number {
  return (m.state.ram[at] ?? 0) | ((m.state.ram[at + 1] ?? 0) << 8)
}

export function ramPoke(m: Elec16, at: number, v: number): void {
  const ram = m.state.ram as Uint8Array
  ram[at] = v & 255
  ram[at + 1] = (v >> 8) & 255
}
