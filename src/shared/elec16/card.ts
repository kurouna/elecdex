/**
 * The memory card at FF60-FF6F (docs/elec16.md sections 5 and 8): named files a unit keeps,
 * read and written by a program through a command block in RAM.
 *
 * The core never touches the card. A command is checked and captured here as a request
 * (its names, its range of RAM, the bytes to write) with the card BUSY; the page takes the
 * request, main does it on the unit's card file, and the answer comes back through
 * `answerCard`, which writes what was read and raises the CARD line. What a card is - its
 * files, their names, its room - is the pure `cardOp`, which main runs.
 *
 * Block (32 bytes at BLOCK): name [12] and a second name [12] (RENAME's new one), as text
 * ended by a zero; offset in the file, address in RAM and length, words.
 */

import { RAM_SIZE } from './map.js'
import type { Elec16State } from './state.js'

export const CARD_REG = {
  cmd: 0xff60,
  block: 0xff62,
  status: 0xff64,
  result: 0xff66,
  resultHigh: 0xff68,
} as const

/** Commands, as written to CMD. */
export const CARD_OP = { dir: 1, read: 2, write: 3, delete: 4, rename: 5, free: 6 } as const
export type CardOpName = keyof typeof CARD_OP

/** STATUS: 0 done, 1 busy, the rest what went wrong (nothing changed on the card then). */
export const CARD_STATUS = {
  ok: 0,
  busy: 1,
  noFile: 2,
  badName: 3,
  full: 4,
  badAddress: 5,
  badOp: 6,
  /** The machine was put away (a snapshot) while a command was out: it was not done. */
  interrupted: 7,
  exists: 8,
  noCard: 9,
} as const

export const CARD_BLOCK_SIZE = 32
/** A card holds this much, every file's bytes together; a file at most FILE_MAX. */
export const CARD_CAPACITY = 256 * 1024
export const CARD_FILE_MAX = 32 * 1024
/** WRITE's offset that means the file's end: what is written is added to it. */
export const CARD_APPEND = 0xffff
/** A DIR entry in RAM: the name [12], its size [2], 2 bytes spare. */
export const DIR_ENTRY_SIZE = 16

/** A name the card takes: one to eight letters or digits, and a dot and one to three more. */
const NAME = /^[A-Z0-9]{1,8}(\.[A-Z0-9]{1,3})?$/
export const isCardName = (name: string): boolean => NAME.test(name)

export interface CardState {
  block: number
  status: number
  /** A count the last command gives: bytes read or written, files, bytes free. */
  result: number
  /** The CARD line: up from an answer until STATUS is read or another command starts. */
  pending: boolean
  /** The command out for the page to take and main to do; null once taken, or none. */
  request: CardRequest | null
  /** A command is out (taken or not) and not yet answered. */
  busy: boolean
}

export const createCardState = (): CardState => ({
  block: 0,
  status: CARD_STATUS.ok,
  result: 0,
  pending: false,
  request: null,
  busy: false,
})

export interface CardRequest {
  op: CardOpName
  name: string
  newName: string
  offset: number
  /** Bytes READ may bring and DIR may list (as entries); for WRITE, data's length. */
  length: number
  /** WRITE's bytes, copied from RAM when the command was given. */
  data: Uint8Array | null
  /** Where READ and DIR write their answer. */
  address: number
}

export interface CardFile {
  name: string
  data: Uint8Array
  /** When it was last written, epoch milliseconds. */
  modified: number
}

export interface CardAnswer {
  status: number
  /** READ: the bytes; DIR: the entries; the others: the count for RESULT. */
  data?: Uint8Array
  entries?: { name: string; size: number }[]
  result?: number
}

const OPS = Object.entries(CARD_OP) as [CardOpName, number][]
const NEEDS_NAME: ReadonlySet<CardOpName> = new Set(['read', 'write', 'delete', 'rename'])

/** The text ended by a zero at `at` (at most `max` bytes), as a string. */
function textAt(ram: Uint8Array, at: number, max: number): string {
  let out = ''
  for (let k = 0; k < max; k++) {
    const c = ram[at + k] ?? 0
    if (c === 0) break
    out += String.fromCharCode(c)
  }
  return out
}

const wordAt = (ram: Uint8Array, at: number): number => (ram[at] ?? 0) | ((ram[at + 1] ?? 0) << 8)

/** A command written to CMD: checked, then made a request (or answered at once with an error). */
export function cardCommand(s: Elec16State, value: number): void {
  const card = s.card
  if (card.busy) return
  card.pending = false
  const made = commandOf(s, value)
  if (typeof made === 'number') {
    card.status = made
    card.result = 0
    card.pending = true
    return
  }
  card.request = made
  card.busy = true
  card.status = CARD_STATUS.busy
}

/** The request a command makes from its block, or the status that refuses it. */
function commandOf(s: Elec16State, value: number): CardRequest | number {
  const op = OPS.find(([, code]) => code === value)?.[0]
  if (op === undefined) return CARD_STATUS.badOp
  const b = s.card.block
  if (b + CARD_BLOCK_SIZE > RAM_SIZE) return CARD_STATUS.badAddress
  const name = textAt(s.ram, b, 12)
  const newName = textAt(s.ram, b + 12, 12)
  const offset = wordAt(s.ram, b + 24)
  const address = wordAt(s.ram, b + 26)
  const length = wordAt(s.ram, b + 28)
  if (NEEDS_NAME.has(op) && !isCardName(name)) return CARD_STATUS.badName
  if (op === 'rename' && !isCardName(newName)) return CARD_STATUS.badName
  const ranged = op === 'read' || op === 'write' || op === 'dir'
  if (ranged && address + length > RAM_SIZE) return CARD_STATUS.badAddress
  const data = op === 'write' ? s.ram.slice(address, address + length) : null
  return { op, name, newName, offset, length, data, address }
}

/** The request out, for the page to send to main; null when there is none (or it was taken). */
export function takeCardRequest(s: Elec16State): CardRequest | null {
  const request = s.card.request
  s.card.request = null
  return request
}

/** main's answer: what was read is written to RAM, the status and count set, the line raised. */
export function answerCard(s: Elec16State, request: CardRequest, answer: CardAnswer): void {
  const card = s.card
  if (!card.busy) return
  card.busy = false
  card.status = answer.status
  card.result = answer.result ?? 0
  card.pending = true
  if (answer.status !== CARD_STATUS.ok) return
  if (request.op === 'read' && answer.data !== undefined) {
    const bytes = answer.data.subarray(0, request.length)
    s.ram.set(bytes, request.address)
    card.result = bytes.length
  }
  if (request.op === 'dir' && answer.entries !== undefined) {
    const room = Math.floor(request.length / DIR_ENTRY_SIZE)
    answer.entries.slice(0, room).forEach((entry, k) => {
      const at = request.address + k * DIR_ENTRY_SIZE
      s.ram.fill(0, at, at + DIR_ENTRY_SIZE)
      for (let c = 0; c < entry.name.length && c < 12; c++) s.ram[at + c] = entry.name.charCodeAt(c)
      s.ram[at + 12] = entry.size & 0xff
      s.ram[at + 13] = entry.size >> 8
    })
    card.result = answer.entries.length
  }
}

/** A register of the card read; STATUS (not a peek) drops the CARD line. */
export function cardRead(s: Elec16State, address: number, peek: boolean): number {
  const card = s.card
  switch (address) {
    case CARD_REG.block:
      return card.block
    case CARD_REG.status:
      if (!peek) card.pending = false
      return card.status
    case CARD_REG.result:
      return card.result & 0xffff
    case CARD_REG.resultHigh:
      return (card.result >>> 16) & 0xffff
    default:
      return 0
  }
}

export function cardWrite(s: Elec16State, address: number, value: number): void {
  if (address === CARD_REG.block) s.card.block = value
  else if (address === CARD_REG.cmd) cardCommand(s, value)
}

/* ---------------- the card itself: what main does ---------------- */

const used = (files: readonly CardFile[]): number => files.reduce((n, f) => n + f.data.length, 0)

/** DIR of this name lists the SOFT CARD instead of the unit's own. */
export const SOFT_CARD = 'SOFT'

/**
 * A request done on a card's files: the files after it (the same array when nothing
 * changed) and the answer. `soft` is the SOFT CARD, read-only: a READ of a name the card does
 * not have reads it there, and DIR "SOFT" lists it (DIR of another name has no such card);
 * nothing ever writes it, and a file of the same name on the card is the one read. Pure, so
 * main and the tests run the same thing.
 */
export function cardOp(
  files: readonly CardFile[],
  request: CardRequest,
  now: number,
  soft: readonly CardFile[] = [],
): { files: readonly CardFile[]; answer: CardAnswer } {
  const at = files.findIndex((f) => f.name === request.name)
  const found = files[at]
  const no = (status: number) => ({ files, answer: { status } })
  switch (request.op) {
    case 'dir': {
      if (request.name !== '' && request.name !== SOFT_CARD) return no(CARD_STATUS.noFile)
      const listed = request.name === SOFT_CARD ? soft : files
      return {
        files,
        answer: {
          status: CARD_STATUS.ok,
          entries: listed.map((f) => ({ name: f.name, size: f.data.length })),
        },
      }
    }
    case 'free':
      return { files, answer: { status: CARD_STATUS.ok, result: CARD_CAPACITY - used(files) } }
    case 'read': {
      const file = found ?? soft.find((f) => f.name === request.name)
      if (file === undefined) return no(CARD_STATUS.noFile)
      const data = file.data.slice(request.offset, request.offset + request.length)
      return { files, answer: { status: CARD_STATUS.ok, data, result: data.length } }
    }
    case 'delete':
      if (found === undefined) return no(CARD_STATUS.noFile)
      return { files: files.filter((_, k) => k !== at), answer: { status: CARD_STATUS.ok } }
    case 'rename': {
      if (found === undefined) return no(CARD_STATUS.noFile)
      if (files.some((f) => f.name === request.newName)) return no(CARD_STATUS.exists)
      const renamed = { ...found, name: request.newName }
      return {
        files: files.map((f, k) => (k === at ? renamed : f)),
        answer: { status: CARD_STATUS.ok },
      }
    }
    case 'write':
      return writeFile(files, at, request, now)
  }
}

/**
 * WRITE: the bytes at the offset of the file (made when there is none). An offset of 0 starts
 * the file afresh with them; a later one writes over and past what is there, but may not
 * leave a gap; CARD_APPEND adds them at the end. FULL when the file or the card would overflow.
 */
function writeFile(
  files: readonly CardFile[],
  at: number,
  request: CardRequest,
  now: number,
): { files: readonly CardFile[]; answer: CardAnswer } {
  const data = request.data ?? new Uint8Array()
  const old = request.offset === 0 ? new Uint8Array() : (files[at]?.data ?? new Uint8Array())
  const offset = request.offset === CARD_APPEND ? old.length : request.offset
  if (offset > old.length) return { files, answer: { status: CARD_STATUS.badAddress } }
  const size = Math.max(old.length, offset + data.length)
  const before = files[at]?.data.length ?? 0
  if (size > CARD_FILE_MAX || used(files) - before + size > CARD_CAPACITY) {
    return { files, answer: { status: CARD_STATUS.full } }
  }
  const next = new Uint8Array(size)
  next.set(old)
  next.set(data, offset)
  const file: CardFile = { name: request.name, data: next, modified: now }
  const list = at < 0 ? [...files, file] : files.map((f, k) => (k === at ? file : f))
  return { files: list, answer: { status: CARD_STATUS.ok, result: data.length } }
}
