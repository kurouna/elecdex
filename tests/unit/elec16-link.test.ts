import { LINK_CMD, LINK_REG, LINK_STATUS } from '@shared/elec16/link-services'
import { Elec16 } from '@shared/elec16/machine'
import { decodeSnapshot } from '@shared/elec16/snapshot'
import { IRQ } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import { built, olderSnapshot, switchOn } from './elec16-helpers'

/**
 * LINK, the device a program reaches main's services through (shared/elec16/link.ts, docs
 * section 12): its registers, the request it makes, the answer written back, and the two
 * guards - a person's action before each SEND, and a fresh conversation after NEW, a new type,
 * RESET or the power going off.
 */

type Bus = { write16(a: number, v: number): boolean; read16(a: number): number }
const bus = (m: Elec16): Bus => (m as unknown as { bus: Bus }).bus

const Q = 0x7000
const R = 0x7100

/** A question at Q, LINK pointed at it, and the machine vouched for by a key. */
function ready(m: Elec16, question = 'HELLO', max = 40, type = 0): void {
  const bytes = [...question].map((c) => c.charCodeAt(0))
  m.state.ram.set([...bytes, 0], Q)
  const b = bus(m)
  b.write16(LINK_REG.type, type)
  b.write16(LINK_REG.query, Q)
  b.write16(LINK_REG.reply, R)
  b.write16(LINK_REG.max, max)
  m.vouch()
}

const send = (m: Elec16) => bus(m).write16(LINK_REG.cmd, LINK_CMD.send)
const status = (m: Elec16) => bus(m).read16(LINK_REG.status)
const text = (m: Elec16, at: number, n: number) =>
  String.fromCharCode(...m.state.ram.subarray(at, at + n))

describe('LINK', () => {
  it('makes a request of a SEND, and writes the answer back with a zero after', () => {
    const m = switchOn()
    ready(m, 'WHAT IS A PULSAR?')
    send(m)
    expect(m.state.link.busy).toBe(true)
    expect(status(m)).toBe(LINK_STATUS.busy)
    const request = m.takeLinkRequest()
    expect(request).toMatchObject({ service: 0, type: 0, max: 40, fresh: true })
    expect(String.fromCharCode(...(request?.query ?? []))).toBe('WHAT IS A PULSAR?')
    // Taken once.
    expect(m.takeLinkRequest()).toBeNull()
    m.state.ram.fill(0xaa, R, R + 64)
    m.answerLink(request?.serial ?? -1, {
      status: LINK_STATUS.ready,
      data: new Uint8Array([...'A STAR'].map((c) => c.charCodeAt(0))),
    })
    expect(m.state.link.pending).toBe(true)
    expect(bus(m).read16(LINK_REG.length)).toBe(6)
    expect(text(m, R, 7)).toBe('A STAR\0')
    expect(status(m)).toBe(LINK_STATUS.ready)
    // Reading STATUS drops the line.
    expect(m.state.link.pending).toBe(false)
  })

  it('takes no more of an answer than MAX', () => {
    const m = switchOn()
    ready(m, 'Q', 4)
    send(m)
    const request = m.takeLinkRequest()
    m.state.ram.fill(0xaa, R, R + 8)
    m.answerLink(request?.serial ?? -1, {
      status: LINK_STATUS.ready,
      data: new Uint8Array([65, 66, 67, 68, 69, 70]),
    })
    expect(text(m, R, 6)).toBe('ABCD\0\xaa')
    expect(m.state.link.length).toBe(4)
  })

  it('is HELD when nobody did anything since the last SEND', () => {
    const m = switchOn()
    ready(m)
    send(m)
    const first = m.takeLinkRequest()
    m.answerLink(first?.serial ?? -1, { status: LINK_STATUS.ready, data: new Uint8Array() })
    send(m)
    expect(status(m)).toBe(LINK_STATUS.held)
    expect(m.takeLinkRequest()).toBeNull()
    // A key PASTE typed is not a person.
    m.press(0, false)
    send(m)
    expect(status(m)).toBe(LINK_STATUS.held)
    // A key of the machine is.
    m.press(0)
    send(m)
    expect(status(m)).toBe(LINK_STATUS.busy)
  })

  it('refuses a request it cannot make at once, raising the line', () => {
    const m = switchOn()
    const cases: [string, (b: Bus) => void, number][] = [
      ['no such service', (b) => b.write16(LINK_REG.service, 1), LINK_STATUS.noService],
      ['no such type', (b) => b.write16(LINK_REG.type, 11), LINK_STATUS.badRequest],
      ['MAX 0', (b) => b.write16(LINK_REG.max, 0), LINK_STATUS.badRequest],
      ['MAX past the service', (b) => b.write16(LINK_REG.max, 256), LINK_STATUS.badRequest],
      ['REPLY past RAM', (b) => b.write16(LINK_REG.reply, 0x7ff0), LINK_STATUS.badRequest],
      ['an empty question', (b) => b.write16(LINK_REG.query, Q + 5), LINK_STATUS.badRequest],
    ]
    for (const [, change, expected] of cases) {
      ready(m)
      bus(m).write16(LINK_REG.service, 0)
      change(bus(m))
      send(m)
      expect(m.state.link.pending).toBe(true)
      expect(status(m)).toBe(expected)
      expect(m.state.link.busy).toBe(false)
    }
  })

  it('refuses a question with no zero within 255 bytes, and takes one of 255', () => {
    const m = switchOn()
    ready(m, 'X'.repeat(256))
    send(m)
    expect(status(m)).toBe(LINK_STATUS.badRequest)
    ready(m, 'X'.repeat(255))
    send(m)
    expect(m.takeLinkRequest()?.query.length).toBe(255)
  })

  it('wakes a machine asleep for it: the LINK line is interrupt 4', () => {
    const m = switchOn()
    ready(m)
    send(m)
    const request = m.takeLinkRequest()
    m.state.csr.mie = 1 << IRQ.link
    m.waitForInterrupt()
    expect(m.state.sleeping).toBe(true)
    m.answerLink(request?.serial ?? -1, { status: LINK_STATUS.failed })
    ;(m.state as { sleeping: boolean }).sleeping = false
    m.waitForInterrupt()
    expect(m.state.sleeping).toBe(false)
  })

  it('lets mie hold the LINK line', () => {
    const m = switchOn()
    m.csrWrite(0x304, 0xffff)
    expect(m.state.csr.mie).toBe(0x1f)
  })

  it('drops a cancelled request, and does not take its late answer for the next', () => {
    const m = switchOn()
    ready(m, 'ONE')
    send(m)
    const first = m.takeLinkRequest()
    bus(m).write16(LINK_REG.cmd, LINK_CMD.cancel)
    expect(status(m)).toBe(LINK_STATUS.cancelled)
    expect(m.takeLinkDrop()).toBe(first?.serial)
    expect(m.takeLinkDrop()).toBeNull()
    ready(m, 'TWO')
    send(m)
    const second = m.takeLinkRequest()
    expect(second?.serial).not.toBe(first?.serial)
    m.answerLink(first?.serial ?? -1, { status: LINK_STATUS.ready, data: new Uint8Array([65]) })
    expect(m.state.link.busy).toBe(true)
    m.answerLink(second?.serial ?? -1, { status: LINK_STATUS.ready, data: new Uint8Array([66]) })
    expect(text(m, R, 1)).toBe('B')
  })

  it('starts a fresh conversation after NEW and a new type, and not otherwise', () => {
    const m = switchOn()
    const fresh = (): boolean | undefined => {
      m.vouch()
      send(m)
      const request = m.takeLinkRequest()
      m.answerLink(request?.serial ?? -1, { status: LINK_STATUS.ready })
      return request?.fresh
    }
    ready(m)
    expect(fresh()).toBe(true)
    expect(fresh()).toBe(false)
    bus(m).write16(LINK_REG.cmd, LINK_CMD.fresh)
    expect(fresh()).toBe(true)
    bus(m).write16(LINK_REG.type, 3)
    expect(fresh()).toBe(true)
    bus(m).write16(LINK_REG.type, 3)
    expect(fresh()).toBe(false)
  })

  it('lets go at RESET and when the power goes off: the request dropped, the talk fresh', () => {
    for (const end of [
      (m: Elec16) => m.reset(),
      (m: Elec16) => m.powerOff(),
      (m: Elec16) => bus(m).write16(0xff06, 0),
    ]) {
      const m = switchOn()
      ready(m)
      send(m)
      const out = m.takeLinkRequest()
      m.answerLink(out?.serial ?? -1, { status: LINK_STATUS.ready })
      m.vouch()
      send(m)
      const request = m.takeLinkRequest()
      end(m)
      expect(m.state.link.busy).toBe(false)
      expect(m.takeLinkDrop()).toBe(request?.serial)
      expect(m.state.link.fresh).toBe(true)
      // A late answer to it writes nothing.
      m.state.ram[R] = 0x55
      m.answerLink(request?.serial ?? -1, { status: LINK_STATUS.ready, data: new Uint8Array([1]) })
      expect(m.state.ram[R]).toBe(0x55)
    }
  })

  it('counts BRK/ON as a person', () => {
    const m = switchOn()
    ready(m)
    send(m)
    m.answerLink(m.takeLinkRequest()?.serial ?? -1, { status: LINK_STATUS.ready })
    m.brk()
    send(m)
    expect(status(m)).toBe(LINK_STATUS.busy)
  })

  it('writes the answer where SEND checked it would go, whatever REPLY and MAX say later', () => {
    const m = switchOn()
    ready(m, 'Q', 4)
    send(m)
    const request = m.takeLinkRequest()
    // Moved while it waits: once a RangeError past RAM, and the page's relay broken.
    bus(m).write16(LINK_REG.reply, 0x7ff0)
    bus(m).write16(LINK_REG.max, 255)
    m.state.ram.fill(0xaa, R, R + 8)
    expect(() =>
      m.answerLink(request?.serial ?? -1, {
        status: LINK_STATUS.ready,
        data: new Uint8Array(40).fill(0x41),
      }),
    ).not.toThrow()
    expect(text(m, R, 6)).toBe('AAAA\0\xaa')
    expect(m.state.link.length).toBe(4)
  })

  it('takes the low byte of SERVICE and TYPE, as a snapshot keeps them', () => {
    const m = switchOn()
    bus(m).write16(LINK_REG.service, 0x100)
    bus(m).write16(LINK_REG.type, 0x103)
    expect(bus(m).read16(LINK_REG.service)).toBe(0)
    expect(bus(m).read16(LINK_REG.type)).toBe(3)
    const back = Elec16.restore(built.image, m.snapshot())
    expect(back?.state.link).toMatchObject({ service: 0, type: 3 })
  })

  it('keeps NEW for the next SEND when the one that carried it was dropped', () => {
    const m = switchOn()
    ready(m)
    send(m)
    m.answerLink(m.takeLinkRequest()?.serial ?? -1, { status: LINK_STATUS.ready })
    bus(m).write16(LINK_REG.cmd, LINK_CMD.fresh)
    m.vouch()
    send(m)
    // BRK in the same frame: the page never took it, and main never heard of the NEW.
    bus(m).write16(LINK_REG.cmd, LINK_CMD.cancel)
    m.vouch()
    send(m)
    expect(m.takeLinkRequest()?.fresh).toBe(true)
  })

  it('counts RESET as a person, as the manuals say', () => {
    const m = switchOn()
    ready(m)
    send(m)
    m.answerLink(m.takeLinkRequest()?.serial ?? -1, { status: LINK_STATUS.ready })
    m.reset()
    send(m)
    expect(status(m)).not.toBe(LINK_STATUS.held)
  })

  it('reads its registers back, and nothing at the others of its block', () => {
    const m = switchOn()
    ready(m, 'Q', 99, 5)
    expect(bus(m).read16(LINK_REG.type)).toBe(5)
    expect(bus(m).read16(LINK_REG.query)).toBe(Q)
    expect(bus(m).read16(LINK_REG.reply)).toBe(R)
    expect(bus(m).read16(LINK_REG.max)).toBe(99)
    expect(bus(m).read16(LINK_REG.cmd)).toBe(0)
  })

  it('comes back from a snapshot as it was, a request that was out INTERRUPTED', () => {
    const m = switchOn()
    ready(m, 'Q', 30, 4)
    send(m)
    m.takeLinkRequest()
    const back = Elec16.restore(built.image, m.snapshot())
    expect(back?.state.link).toMatchObject({
      type: 4,
      query: Q,
      reply: R,
      max: 30,
      busy: false,
      status: LINK_STATUS.interrupted,
      pending: true,
      fresh: false,
    })
  })

  it('reads a snapshot from before LINK, its LINK a new machine', () => {
    const m = switchOn()
    const back = decodeSnapshot(olderSnapshot(m.snapshot(), 1))
    expect(back).not.toBeNull()
    expect(back?.link).toMatchObject({ busy: false, fresh: true, status: LINK_STATUS.ready })
    expect(back?.ram).toEqual(m.state.ram)
  })

  it('refuses a snapshot whose LINK is out of range', () => {
    const m = switchOn()
    const bytes = m.snapshot()
    // LINK is the last of the devices, before the count of extended RAM banks and the video byte.
    const at = bytes.length - (m.state.ram.length + m.state.vram.length) - 2 - 14
    const broken = bytes.slice()
    // STATUS: past service, type, QUERY, REPLY and MAX.
    broken[at + 8] = 9
    expect(decodeSnapshot(broken)).toBeNull()
  })
})
