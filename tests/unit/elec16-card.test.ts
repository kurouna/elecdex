import { assemble, romImage } from '@shared/elec16/asm'
import {
  CARD_CAPACITY,
  CARD_FILE_MAX,
  CARD_OP,
  CARD_REG,
  CARD_STATUS,
  type CardFile,
  type CardRequest,
  cardOp,
  isCardName,
} from '@shared/elec16/card'
import { Elec16 } from '@shared/elec16/machine'
import { IRQ } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'

/**
 * The memory card (docs/elec16.md sections 5 and 8): a program's command checked and captured
 * in the core, done by the pure cardOp as main does it, and the answer back in RAM.
 */

const BLOCK = 0x7000
const BUFFER = 0x7100

/** A machine whose program writes a block, gives a command, waits for the CARD line and stops. */
function commanding(op: number, fill: (ram: Uint8Array) => void, block = BLOCK): Elec16 {
  const src = [
    '.org 0x8000',
    `li t0, ${1 << IRQ.card}`,
    'csrw mie, t0',
    `li t0, ${CARD_REG.block}`,
    `li t1, ${block}`,
    'sw t1, 0(t0)',
    `li t0, ${CARD_REG.cmd}`,
    `li t1, ${op}`,
    'sw t1, 0(t0)',
    'wfi',
    `li t0, ${CARD_REG.status}`,
    'lw a0, 0(t0)',
    `li t0, ${CARD_REG.result}`,
    'lw a1, 0(t0)',
    'ebreak',
  ].join('\n')
  const out = assemble(src)
  expect(out.errors).toEqual([])
  const m = Elec16.boot(romImage(out))
  fill(m.state.ram)
  return m
}

function block(
  ram: Uint8Array,
  fields: { name?: string; newName?: string; offset?: number; address?: number; length?: number },
) {
  const text = (at: number, s: string) => {
    for (let k = 0; k < s.length; k++) ram[at + k] = s.charCodeAt(k)
  }
  text(BLOCK, fields.name ?? '')
  text(BLOCK + 12, fields.newName ?? '')
  const word = (at: number, v: number) => {
    ram[at] = v & 0xff
    ram[at + 1] = v >> 8
  }
  word(BLOCK + 24, fields.offset ?? 0)
  word(BLOCK + 26, fields.address ?? BUFFER)
  word(BLOCK + 28, fields.length ?? 0)
}

const file = (name: string, text: string): CardFile => ({
  name,
  data: new TextEncoder().encode(text),
  modified: 1,
})

/** Runs the machine's command through cardOp, as the page and main do; the files after it. */
function serve(
  m: Elec16,
  files: readonly CardFile[],
): { files: readonly CardFile[]; request: CardRequest | null } {
  expect(m.run(10_000).sleeping).not.toBeNull()
  const request = m.takeCardRequest()
  if (request === null) return { files, request }
  expect(m.takeCardRequest()).toBeNull()
  const done = cardOp(files, request, 5)
  m.answerCard(request, done.answer)
  expect(m.run(10_000).halted?.cause).toBe('breakpoint')
  return { files: done.files, request }
}

const regs = (m: Elec16) => [m.state.regs[4], m.state.regs[5]]

describe('the memory card', () => {
  it('reads a file into RAM, and wakes the program with the CARD line', () => {
    const m = commanding(CARD_OP.read, (ram) =>
      block(ram, { name: 'HI.DAT', offset: 1, length: 3 }),
    )
    const { request } = serve(m, [file('HI.DAT', 'HELLO')])
    expect(request).toMatchObject({
      op: 'read',
      name: 'HI.DAT',
      offset: 1,
      length: 3,
      address: BUFFER,
    })
    expect(String.fromCharCode(...m.state.ram.subarray(BUFFER, BUFFER + 4))).toBe('ELL\0')
    expect(regs(m)).toEqual([CARD_STATUS.ok, 3])
    // STATUS was read: the line is down.
    expect(m.state.card.pending).toBe(false)
  })

  it('writes the bytes RAM held when the command was given', () => {
    const m = commanding(CARD_OP.write, (ram) => {
      block(ram, { name: 'NEW.DAT', length: 2 })
      ram.set([7, 8], BUFFER)
    })
    m.run(20)
    m.state.ram.set([9, 9], BUFFER)
    const { files } = serve(m, [])
    expect(files).toEqual([{ name: 'NEW.DAT', data: new Uint8Array([7, 8]), modified: 5 }])
    expect(regs(m)).toEqual([CARD_STATUS.ok, 2])
  })

  it('lists the card into RAM, sixteen bytes a file, and counts them all', () => {
    const m = commanding(CARD_OP.dir, (ram) => block(ram, { length: 16 }))
    serve(m, [file('A.BAS', 'xy'), file('B.BIN', 'z')])
    expect(String.fromCharCode(...m.state.ram.subarray(BUFFER, BUFFER + 5))).toBe('A.BAS')
    expect(m.state.ram.subarray(BUFFER + 12, BUFFER + 14)).toEqual(new Uint8Array([2, 0]))
    expect(m.state.ram[BUFFER + 16]).toBe(0)
    expect(regs(m)).toEqual([CARD_STATUS.ok, 2])
  })

  it('refuses at once a bad name, a range outside RAM or an unknown command, and asks main nothing', () => {
    for (const [op, fields, status] of [
      [CARD_OP.read, { name: 'con' }, CARD_STATUS.badName],
      [CARD_OP.read, { name: 'TOOLONGNAME' }, CARD_STATUS.badName],
      [CARD_OP.rename, { name: 'A', newName: 'B/C' }, CARD_STATUS.badName],
      [CARD_OP.read, { name: 'A', address: 0x7ff0, length: 0x20 }, CARD_STATUS.badAddress],
      [0x77, {}, CARD_STATUS.badOp],
    ] as const) {
      const m = commanding(op, (ram) => block(ram, fields))
      // The line is up at once: WFI does not wait, and nothing goes to main.
      expect(m.run(10_000).halted?.cause).toBe('breakpoint')
      expect(m.takeCardRequest(), String(op)).toBeNull()
      expect(regs(m)[0], JSON.stringify(fields)).toBe(status)
    }
    const outside = commanding(CARD_OP.free, () => {}, 0x7ff0)
    expect(outside.run(10_000).halted?.cause).toBe('breakpoint')
    expect(regs(outside)[0]).toBe(CARD_STATUS.badAddress)
  })

  it('names files with one to eight letters or digits and an extension of up to three', () => {
    for (const ok of ['A', 'PRIMES.BAS', '12345678.ABC', 'CON', 'NUL.DAT'])
      expect(isCardName(ok), ok).toBe(true)
    for (const bad of [
      '',
      'a.bas',
      '123456789',
      'A.BASIC',
      'A..B',
      '.BAS',
      'A B',
      'C:\\X',
      'A/B',
    ]) {
      expect(isCardName(bad), bad).toBe(false)
    }
  })
})

describe('cardOp, what main does on a card', () => {
  const request = (r: Partial<CardRequest>): CardRequest => ({
    op: 'read',
    name: 'A.DAT',
    newName: '',
    offset: 0,
    length: 0,
    data: null,
    address: 0,
    ...r,
  })
  const bytes = (n: number) => new Uint8Array(n).fill(1)

  it('writes from 0 afresh, appends or writes over later, and leaves no gap', () => {
    let files: readonly CardFile[] = [file('A.DAT', 'abcdef')]
    files = cardOp(files, request({ op: 'write', data: new TextEncoder().encode('xy') }), 2).files
    expect(new TextDecoder().decode(files[0]?.data)).toBe('xy')
    files = cardOp(
      files,
      request({ op: 'write', offset: 2, data: new TextEncoder().encode('zz') }),
      3,
    ).files
    expect(new TextDecoder().decode(files[0]?.data)).toBe('xyzz')
    files = cardOp(
      files,
      request({ op: 'write', offset: 1, data: new TextEncoder().encode('Q') }),
      4,
    ).files
    expect(new TextDecoder().decode(files[0]?.data)).toBe('xQzz')
    const gap = cardOp(files, request({ op: 'write', offset: 9, data: bytes(1) }), 5)
    expect([gap.answer.status, gap.files]).toEqual([CARD_STATUS.badAddress, files])
  })

  it('is FULL for a file over its limit or a card over its room, and changes nothing', () => {
    const big = cardOp([], request({ op: 'write', data: bytes(CARD_FILE_MAX + 1) }), 1)
    expect(big.answer.status).toBe(CARD_STATUS.full)
    const many = Array.from({ length: CARD_CAPACITY / CARD_FILE_MAX }, (_, k) => ({
      name: `F${k}`,
      data: bytes(CARD_FILE_MAX),
      modified: 0,
    }))
    const full = cardOp(many, request({ op: 'write', name: 'MORE', data: bytes(1) }), 1)
    expect([full.answer.status, full.files]).toEqual([CARD_STATUS.full, many])
    // Writing over a file takes back the room it had.
    const over = cardOp(many, request({ op: 'write', name: 'F0', data: bytes(10) }), 1)
    expect(over.answer.status).toBe(CARD_STATUS.ok)
    expect(cardOp(over.files, request({ op: 'free' }), 1).answer.result).toBe(CARD_FILE_MAX - 10)
  })

  it('renames, but never over another file, and deletes', () => {
    const files = [file('A.DAT', 'a'), file('B.DAT', 'b')]
    expect(cardOp(files, request({ op: 'rename', newName: 'B.DAT' }), 1).answer.status).toBe(
      CARD_STATUS.exists,
    )
    const renamed = cardOp(files, request({ op: 'rename', newName: 'C.DAT' }), 1).files
    expect(renamed.map((f) => f.name)).toEqual(['C.DAT', 'B.DAT'])
    expect(
      cardOp(renamed, request({ op: 'delete', name: 'B.DAT' }), 1).files.map((f) => f.name),
    ).toEqual(['C.DAT'])
    expect(cardOp(renamed, request({ op: 'delete', name: 'X' }), 1).answer.status).toBe(
      CARD_STATUS.noFile,
    )
  })
})
