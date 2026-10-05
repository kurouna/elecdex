import { assemble, romImage } from '@shared/elec16/asm'
import { buildGame } from '@shared/elec16/cart-build'
import {
  CART_BANK,
  CART_HEADER,
  CART_MAX_BANKS,
  CART_MAX_SIZE,
  type CartHeader,
  makeCart,
  readCart,
  readCartHeader,
  SAVE_BANK,
  slotOf,
} from '@shared/elec16/cartridge'
import { REG_NAMES } from '@shared/elec16/isa'
import { LINK_SERVICE, LINK_SERVICES, LINK_STATUS } from '@shared/elec16/link-services'
import { Elec16 } from '@shared/elec16/machine'
import { BANK_SIZE, MODEL_IDS, MODELS, type ModelId } from '@shared/elec16/map'
import { decodeSnapshot, SNAPSHOT_MAX_SIZE } from '@shared/elec16/snapshot'
import { describe, expect, it } from 'vitest'

/**
 * PLAY-320's cartridges (docs/elec16-play.md section 7, G4): the .E16G image and its header,
 * the slot that shows its ROM from bank 0x100 and its save RAM from 0x80, a snapshot that keeps
 * the slot but not the ROM, and CART's LOAD putting one in - and every other model without a slot.
 */

const HEADER: CartHeader = {
  banks: 3,
  saveBanks: 2,
  entry: 0xc000,
  id: 'DEMO-1',
  name: 'A DEMO GAME',
}
const DIGEST = new Uint8Array(32).fill(7)

/** A cartridge whose bank k starts with the word 0x1100 + k. */
function cart(h: CartHeader = HEADER): Uint8Array {
  const rom = new Uint8Array(h.banks * BANK_SIZE)
  for (let k = 0; k < h.banks; k++) {
    rom[k * BANK_SIZE] = k
    rom[k * BANK_SIZE + 1] = 0x11
  }
  return makeCart(h, rom)
}

function boot(src = 'ebreak', model: ModelId = 'play-320'): Elec16 {
  const out = assemble(`.org 0x8000\n${src}`)
  expect(out.errors).toEqual([])
  return Elec16.boot(romImage(out), model)
}

function finish(m: Elec16): Record<string, number> {
  const result = m.run(1_000_000)
  expect(result.halted?.cause, `stopped at ${result.halted?.pc.toString(16)}`).toBe('breakpoint')
  return Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
}

const bankIs = (m: Elec16, bank: number): number => {
  m.bus.write16(0xff04, bank)
  return m.bus.read16(0xff04)
}

describe('the .E16G image', () => {
  it('reads back what it was made of', () => {
    const image = cart()
    expect(image.length).toBe(CART_HEADER + 3 * BANK_SIZE)
    expect(readCart(image)).toEqual(HEADER)
    expect(readCartHeader(image.subarray(0, CART_HEADER))).toEqual(HEADER)
    expect(String.fromCharCode(...image.subarray(0, 4))).toBe('E16G')
    expect(CART_MAX_SIZE).toBe(64 + 1024 * 1024)
  })

  it('is not one when anything about its header is wrong', () => {
    const good = cart()
    const broken = (k: number, v: number) => {
      const b = good.slice()
      b[k] = v
      return readCart(b)
    }
    expect(broken(0, 0x58)).toBeNull() // the magic
    expect(broken(4, 2)).toBeNull() // the version
    expect(broken(5, 0)).toBeNull() // no banks
    expect(broken(6, 5)).toBeNull() // more save RAM than four banks
    expect(broken(7, 1)).toBeNull()
    expect(broken(8, 0x01)).toBeNull() // an odd entry
    expect(broken(9, 0xe0)).toBeNull() // an entry past the window
    expect(broken(9, 0xbf)).toBeNull() // and before it
    expect(broken(12, 1)).toBeNull() // reserved
    expect(broken(16, 0x61)).toBeNull() // a small letter in the id
    expect(broken(16, 0)).toBeNull() // no id
    expect(broken(22 + 2, 0x41)).toBeNull() // a character after the id's zero
    expect(broken(32, 0x07)).toBeNull() // an unprintable name
    expect(broken(60, 1)).toBeNull() // reserved
    expect(readCart(good.subarray(0, good.length - 1))).toBeNull()
    expect(readCart(new Uint8Array([...good, 0]))).toBeNull()
    expect(readCartHeader(good.subarray(0, 63))).toBeNull()
  })

  it('may have from one to 128 banks, the most a megabyte', () => {
    expect(readCart(cart({ ...HEADER, banks: 1 }))?.banks).toBe(1)
    expect(readCart(cart({ ...HEADER, banks: CART_MAX_BANKS }))?.banks).toBe(128)
    const over = cart({ ...HEADER, banks: 1 })
    over[5] = CART_MAX_BANKS + 1
    expect(readCartHeader(over)).toBeNull()
  })

  it('gives a slot its ROM, and its save RAM as kept: cut or filled to the size it says', () => {
    const slot = slotOf(cart(), DIGEST, new Uint8Array(3 * BANK_SIZE).fill(9))
    expect(slot?.save.length).toBe(2 * BANK_SIZE)
    expect(slot?.save.every((b) => b === 9)).toBe(true)
    expect(slot?.rom?.length).toBe(3 * BANK_SIZE)
    expect(slotOf(cart(), DIGEST)?.save.every((b) => b === 0)).toBe(true)
    const short = slotOf(cart(), DIGEST, new Uint8Array([1, 2]))
    expect([short?.save[0], short?.save[1], short?.save[2]]).toEqual([1, 2, 0])
    expect(slotOf(cart(), new Uint8Array(31))).toBeNull()
    expect(slotOf(cart().subarray(1), DIGEST)).toBeNull()
  })
})

describe('the slot', () => {
  it("shows the cartridge's ROM banks from 0x100, read only, and no bank past the last", () => {
    const m = boot()
    expect(m.insertCart(cart(), DIGEST)).toBe(true)
    for (let k = 0; k < 3; k++) {
      expect(bankIs(m, CART_BANK + k)).toBe(CART_BANK + k)
      expect(m.bus.read16(0xc000)).toBe(0x1100 + k)
    }
    expect(bankIs(m, CART_BANK + 3)).toBe(CART_BANK + 2)
    bankIs(m, CART_BANK)
    expect(m.bus.write8(0xc000, 1)).toBe(false)
  })

  it('shows its save RAM from 0x80, which takes writes and runs code', () => {
    const m = boot(`
      li t0, 0xff04
      li t1, ${SAVE_BANK + 1}
      sw t1, 0(t0)
      li t2, 0xc000
      li t1, 0x0513
      sw t1, 0(t2)
      lw a0, 0(t2)
      ebreak`)
    m.insertCart(cart(), DIGEST)
    const r = finish(m)
    expect(r.a0).toBe(0x0513)
    expect([m.state.cart?.save[BANK_SIZE], m.state.cart?.save[BANK_SIZE + 1]]).toEqual([0x13, 0x05])
    expect(bankIs(m, SAVE_BANK + 2)).toBe(SAVE_BANK + 1)
  })

  it('reads 0xFF in a ROM bank while its ROM waits to be put back, and nothing once taken out', () => {
    const m = boot()
    m.insertCart(cart(), DIGEST)
    bankIs(m, CART_BANK + 1)
    m.ejectCart()
    expect(m.state.cart).toBeNull()
    // The window goes back to bank 0: the bank it showed is gone.
    expect(m.bus.read16(0xff04)).toBe(0)
    expect(bankIs(m, 0)).toBe(0)
    expect(bankIs(m, CART_BANK)).toBe(0)
    expect(bankIs(m, SAVE_BANK)).toBe(0)
  })

  it('takes no image that is not one, and is none on any other model', () => {
    expect(boot().insertCart(cart().subarray(2), DIGEST)).toBe(false)
    for (const id of MODEL_IDS.filter((x) => !MODELS[x].cart)) {
      const m = boot('ebreak', id)
      expect(m.insertCart(cart(), DIGEST), id).toBe(false)
      expect(m.state.cart, id).toBeNull()
      expect(bankIs(m, CART_BANK), id).toBe(0)
      expect(bankIs(m, SAVE_BANK), id).toBe(0)
    }
    expect(MODEL_IDS.filter((x) => MODELS[x].cart)).toEqual(['play-320'])
  })

  it('stays in the slot across a reset, as a cartridge does', () => {
    const m = boot()
    m.insertCart(cart(), DIGEST)
    m.reset()
    expect(m.state.cart?.id).toBe('DEMO-1')
  })
})

describe('a snapshot with a cartridge', () => {
  it('keeps the slot and its save RAM, not the ROM, and takes back only the same cartridge', () => {
    const m = boot()
    finish(m)
    m.insertCart(cart(), DIGEST)
    m.state.cart?.save.fill(0x5a, 0, 4)
    bankIs(m, CART_BANK + 2)
    const bytes = m.snapshot()
    expect(bytes.length).toBeLessThanOrEqual(SNAPSHOT_MAX_SIZE)
    const back = Elec16.restore(new Uint8Array(0x4000), bytes)
    expect(back).not.toBeNull()
    if (back === null) return
    const slot = back.state.cart
    expect([slot?.id, slot?.banks, slot?.rom, back.state.bank]).toEqual([
      'DEMO-1',
      3,
      null,
      CART_BANK + 2,
    ])
    expect(slot?.digest).toEqual(DIGEST)
    expect(Array.from(slot?.save.subarray(0, 5) ?? [])).toEqual([0x5a, 0x5a, 0x5a, 0x5a, 0])
    expect(back.bus.read16(0xc000)).toBe(0xffff)
    // Another hash, or another game under this one: refused.
    expect(back.attachCartRom(cart(), new Uint8Array(32).fill(8))).toBe(false)
    expect(back.attachCartRom(cart({ ...HEADER, id: 'OTHER' }), DIGEST)).toBe(false)
    expect(back.attachCartRom(cart(), DIGEST)).toBe(true)
    expect(back.bus.read16(0xc000)).toBe(0x1102)
    // Once there, not again.
    expect(back.attachCartRom(cart(), DIGEST)).toBe(false)
  })

  it('is not ours with a slot on a model without one, a bad id or bank counts out of range', () => {
    const m = boot()
    finish(m)
    m.insertCart(cart(), DIGEST)
    const good = m.snapshot()
    expect(decodeSnapshot(good)).not.toBeNull()
    // The slot follows video's registers: the byte, the id, the hash, the bank counts.
    const save = 2 * BANK_SIZE
    const cause = m.state.halt?.cause.length ?? 0
    const at = good.length - (0x8000 + 0x1800 + 0x10000 + save) - cause - 147 - (1 + 16 + 32 + 2)
    expect(good[at]).toBe(1)
    const broken = (k: number, v: number) => {
      const b = good.slice()
      b[k] = v
      return decodeSnapshot(b)
    }
    expect(broken(at + 1, 0x61)).toBeNull()
    expect(broken(at + 1, 0)).toBeNull()
    expect(broken(at + 1 + 16 + 32, 0)).toBeNull()
    expect(broken(at + 1 + 16 + 32, CART_MAX_BANKS + 1)).toBeNull()
    expect(broken(at + 1 + 16 + 32 + 1, 5)).toBeNull()
    expect(broken(5, MODEL_IDS.indexOf('pocket-48'))).toBeNull()
  })

  it('reads a version 4 snapshot with an empty slot', () => {
    const m = boot()
    finish(m)
    const now = m.snapshot()
    // Version 4: the same without mode 1's 19 bytes after video's registers and the cartridge
    // byte, just before the halt's cause.
    const cause = m.state.halt?.cause.length ?? 0
    // (And without the sound's 147 bytes after it.)
    const at = now.length - (0x8000 + 0x1800 + 0x10000) - cause - 147 - 1
    expect(now[at]).toBe(0)
    const v4 = new Uint8Array([...now.subarray(0, at - 19), ...now.subarray(at + 1 + 147)])
    v4[4] = 4
    expect(decodeSnapshot(v4)?.cart).toBeNull()
  })
})

describe("CART's LOAD", () => {
  it('is LINK service 1, INFO and LOAD, answering a 64-byte header', () => {
    expect(LINK_SERVICE.cart).toBe(1)
    expect(LINK_SERVICES[1]).toEqual({ name: 'CART', types: ['INFO', 'LOAD'], max: 64 })
  })

  it('puts the cartridge in the slot with its answer, and the header in RAM', () => {
    const m = boot(`
      li t0, 0x6000
      li t1, 0x4f
      sb t1, 0(t0)
      sb zero, 1(t0)
      li t0, 0xff72
      li t1, 1
      sw t1, 0(t0)
      li t1, 1
      sw t1, 2(t0)
      li t1, 0x6000
      sw t1, 4(t0)
      li t1, 0x6100
      sw t1, 6(t0)
      li t1, 64
      sw t1, 8(t0)
      li t0, 0xff70
      li t1, 1
      sw t1, 0(t0)
      ebreak`)
    m.vouch()
    finish(m)
    const asked = m.takeLinkRequest()
    expect([asked?.service, asked?.type, asked?.max]).toEqual([1, 1, 64])
    if (asked === null) return
    const image = cart()
    m.answerLink(asked.serial, {
      status: LINK_STATUS.ready,
      data: image.subarray(0, 64),
      cart: { image, digest: DIGEST, save: new Uint8Array([3]) },
    })
    expect(m.state.cart?.id).toBe('DEMO-1')
    expect(m.state.cart?.save[0]).toBe(3)
    expect(readCartHeader(m.state.ram.subarray(0x6100, 0x6140))).toEqual(HEADER)
  })

  it('puts nothing in for an answer that was not READY, or came for another request', () => {
    const m = boot()
    const image = cart()
    m.answerLink(5, { status: LINK_STATUS.ready, cart: { image, digest: DIGEST } })
    expect(m.state.cart).toBeNull()
  })

  /** A LOAD out, as the ROM's START sends it. */
  const loadOut = (m: Elec16, serial: number) => {
    const l = m.s.link
    l.busy = true
    l.serial = serial
    l.outReply = 0x6100
    l.outMax = 64
  }

  it('keeps the save RAM of the game in the slot when the same game is loaded again', () => {
    const m = boot()
    const image = cart()
    expect(m.insertCart(image, DIGEST, new Uint8Array([1]))).toBe(true)
    m.bus.write16(0xff04, 0x80)
    m.bus.write8(0xc000, 0x42)
    // START again: main answers with the save it kept, older than the game's own.
    loadOut(m, 5)
    m.answerLink(5, {
      status: LINK_STATUS.ready,
      data: image.subarray(0, 64),
      cart: { image, digest: DIGEST, save: new Uint8Array([1]) },
    })
    expect(m.state.cart?.save[0]).toBe(0x42)
    // Another game takes its own.
    const other = cart({ ...HEADER, id: 'OTHER' })
    expect(m.insertCart(other, DIGEST, new Uint8Array([9]))).toBe(true)
    expect(m.state.cart?.save[0]).toBe(9)
  })

  it('answers FAILED, not READY, when the image it brings is no cartridge', () => {
    const m = boot()
    const broken = cart().slice(0, CART_HEADER + BANK_SIZE)
    loadOut(m, 6)
    m.answerLink(6, {
      status: LINK_STATUS.ready,
      data: broken.subarray(0, 64),
      cart: { image: broken, digest: DIGEST },
    })
    expect(m.state.cart).toBeNull()
    expect(m.state.link.status).toBe(LINK_STATUS.failed)
    expect(m.state.link.length).toBe(0)
  })

  it('shows bank 0 once the bank in the window is taken out, so its snapshot reads back', () => {
    for (const bank of [0x101, 0x81]) {
      const m = boot()
      m.insertCart(cart(), DIGEST)
      expect(bankIs(m, bank)).toBe(bank)
      m.ejectCart()
      expect(m.state.bank).toBe(0)
      expect(decodeSnapshot(m.snapshot())).not.toBeNull()
    }
    // A smaller cartridge in its place: a bank it has not is no longer shown.
    const m = boot()
    m.insertCart(cart(), DIGEST)
    expect(bankIs(m, 0x102)).toBe(0x102)
    expect(m.insertCart(cart({ ...HEADER, banks: 1, saveBanks: 0 }), DIGEST)).toBe(true)
    expect(m.state.bank).toBe(0)
    expect(decodeSnapshot(m.snapshot())).not.toBeNull()
    // One that still has it keeps it.
    m.insertCart(cart(), DIGEST)
    expect(bankIs(m, 0x101)).toBe(0x101)
    m.insertCart(cart({ ...HEADER, id: 'OTHER' }), DIGEST)
    expect(m.state.bank).toBe(0x101)
  })
})

describe('a game built from assembly', () => {
  const META = { id: 'T', name: 'T', saveBanks: 0, about: '' }
  const SOURCE = '.bank 0\n.org 0xc000\nstart: ebreak'
  const said = (r: ReturnType<typeof buildGame>) =>
    'errors' in r ? r.errors.map((e) => e.message).join('; ') : 'built'

  it('is a cartridge readCart takes', () => {
    const r = buildGame(SOURCE, META)
    expect('image' in r && readCart(r.image)).toMatchObject({ id: 'T', entry: 0xc000 })
  })

  it('refuses what readCart would not take, saying why, never an image', () => {
    expect(said(buildGame(SOURCE, { ...META, saveBanks: 9 }))).toMatch(/save/)
    expect(said(buildGame(SOURCE, { ...META, saveBanks: -1 }))).toMatch(/save/)
    expect(said(buildGame(SOURCE, { ...META, name: 'CAFÉ' }))).toMatch(/name/)
    expect(said(buildGame(SOURCE, { ...META, name: 'X'.repeat(25) }))).toMatch(/name/)
    // The entry: an even address in the window.
    expect(said(buildGame('.bank 0\n.org 0xc000\n ebreak\nstart = 0x7000', META))).toMatch(/start/)
    // Every byte in its bank's window.
    expect(said(buildGame('.bank 0\n.org 0xdffe\nstart: ebreak\n ebreak', META))).toMatch(
      /bank|window/,
    )
    expect(said(buildGame('.bank 0\n.org 0xbffe\n ebreak\nstart: ebreak', META))).toMatch(
      /bank|window/,
    )
  })
})
