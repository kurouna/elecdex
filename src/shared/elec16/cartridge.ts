/**
 * PLAY-320's cartridges (docs/elec16-play.md section 7): the .E16G image - a 64-byte header
 * and up to 128 ROM banks of 8 KB - and the slot that holds one. The ROM shows in the bank
 * window from bank 0x100, the cartridge's save RAM from 0x80. Pure, as the rest of the core:
 * main reads the images and works out their hash, the page passes them in, and the core only
 * checks what it is given.
 *
 * A snapshot keeps the slot's id, hash, bank count and save RAM, never the ROM (main has it on
 * the shelf): the page puts the ROM back after a restore, and only one with the same hash.
 */

import { BANK_SIZE } from './map.js'

export const CART_MAGIC = [0x45, 0x31, 0x36, 0x47] // "E16G"
export const CART_VERSION = 1
export const CART_HEADER = 64
export const CART_MAX_BANKS = 128
export const CART_MAX_SAVE_BANKS = 4
/** The longest image there is: the header and every bank. */
export const CART_MAX_SIZE = CART_HEADER + CART_MAX_BANKS * BANK_SIZE

/** Where the cartridge's ROM and save RAM are in the bank window's numbers. */
export const CART_BANK = 0x100
export const SAVE_BANK = 0x80

export const CART_ID_LENGTH = 16
export const CART_NAME_LENGTH = 24
/** A game's id: what its save RAM is kept by. */
export const CART_ID = /^[A-Z0-9-]{1,16}$/

/** The SHA-256 of the whole image, as main works it out. */
export const DIGEST_LENGTH = 32

export interface CartHeader {
  banks: number
  saveBanks: number
  /** Where the game starts, in the bank window with bank 0x100 shown. */
  entry: number
  id: string
  name: string
}

/** What the slot holds. */
export interface CartSlot {
  id: string
  digest: Uint8Array
  banks: number
  /** The cartridge's own RAM, kept with the unit for its id. */
  save: Uint8Array
  /** The ROM banks; null after a restore until the page puts them back. */
  rom: Uint8Array | null
}

const text = (bytes: Uint8Array): string => {
  const end = bytes.indexOf(0)
  return String.fromCharCode(...bytes.subarray(0, end < 0 ? bytes.length : end))
}

/** Zero after the text, and nothing but zero. */
const padded = (bytes: Uint8Array): boolean => {
  const end = bytes.indexOf(0)
  return end < 0 || bytes.subarray(end).every((b) => b === 0)
}

/** The header of an image, checked; null when it is not one. Only the header is read. */
export function readCartHeader(bytes: Uint8Array): CartHeader | null {
  if (bytes.length < CART_HEADER || CART_MAGIC.some((b, k) => bytes[k] !== b)) return null
  const at = (k: number) => bytes[k] ?? 0
  if (at(4) !== CART_VERSION || at(7) !== 0) return null
  const banks = at(5)
  const saveBanks = at(6)
  const entry = at(8) | (at(9) << 8)
  const idBytes = bytes.subarray(16, 32)
  const nameBytes = bytes.subarray(32, 56)
  const id = text(idBytes)
  const name = text(nameBytes)
  const reserved = [...bytes.subarray(10, 16), ...bytes.subarray(56, 64)]
  if (banks < 1 || banks > CART_MAX_BANKS || saveBanks > CART_MAX_SAVE_BANKS) return null
  if (entry < 0xc000 || entry >= 0xe000 || (entry & 1) !== 0) return null
  if (!CART_ID.test(id) || !padded(idBytes) || !padded(nameBytes)) return null
  if (!/^[\x20-\x7e]*$/.test(name) || reserved.some((b) => b !== 0)) return null
  return { banks, saveBanks, entry, id, name }
}

/** A whole image checked: its header, and exactly the banks it says. */
export function readCart(bytes: Uint8Array): CartHeader | null {
  const header = readCartHeader(bytes)
  if (header === null || bytes.length !== CART_HEADER + header.banks * BANK_SIZE) return null
  return header
}

/** An image made from its parts (the generator, the tests). */
export function makeCart(h: CartHeader, rom: Uint8Array): Uint8Array {
  const image = new Uint8Array(CART_HEADER + h.banks * BANK_SIZE)
  image.set(CART_MAGIC, 0)
  image[4] = CART_VERSION
  image[5] = h.banks
  image[6] = h.saveBanks
  image[8] = h.entry & 0xff
  image[9] = h.entry >> 8
  image.set(
    Array.from(h.id, (c) => c.charCodeAt(0)),
    16,
  )
  image.set(
    Array.from(h.name, (c) => c.charCodeAt(0)),
    32,
  )
  image.set(rom.subarray(0, h.banks * BANK_SIZE), CART_HEADER)
  return image
}

/**
 * The slot holding the image: its ROM, and its save RAM - `save` as main kept it, cut or
 * filled with zeros to the size the header gives. Null for an image that is not one, or a
 * digest of the wrong length.
 */
export function slotOf(image: Uint8Array, digest: Uint8Array, save?: Uint8Array): CartSlot | null {
  const h = readCart(image)
  if (h === null || digest.length !== DIGEST_LENGTH) return null
  const ram = new Uint8Array(h.saveBanks * BANK_SIZE)
  if (save !== undefined) ram.set(save.subarray(0, ram.length))
  return {
    id: h.id,
    digest: digest.slice(),
    banks: h.banks,
    save: ram,
    rom: image.slice(CART_HEADER),
  }
}

/**
 * Whether a bank is the slot's: one of its ROM banks, or of its save RAM. The ROM's are the
 * slot's even while its ROM waits to be put back after a restore (they read 0xFF till then).
 */
export function cartBankTaken(slot: CartSlot | null, bank: number): boolean {
  if (slot === null) return false
  if (bank >= CART_BANK) return bank < CART_BANK + slot.banks
  return bank >= SAVE_BANK && bank < SAVE_BANK + slot.save.length / BANK_SIZE
}

export const sameDigest = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, k) => v === b[k])
