import { readFileSync } from 'node:fs'
import { CODE_START } from '@shared/e16c/code-area'
import { buildCode } from '@shared/e16c/program'
import { assemble, ramImage } from '@shared/elec16/asm'
import type { LinkAnswer, LinkRequest } from '@shared/elec16/link'
import { AI_TYPES, LINK_STATUS } from '@shared/elec16/link-services'
import type { Elec16 } from '@shared/elec16/machine'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { linkService, screen, settle, shown, switchOn, type } from './elec16-helpers'

/**
 * BASIC's ASK and the ROM's service 8 (resources/elec16/rom: link.s, basic/link.e16.ts; docs
 * section 12), on the machine, with main's LINK played by the helpers' `linkService`.
 */

const bytes = (text: string): Uint8Array => new Uint8Array([...text].map((c) => c.charCodeAt(0)))
const text = (data: Uint8Array): string => String.fromCharCode(...data)

/** main's AI as a test has it: the answer is the question turned round, upper case. */
const echo = (r: LinkRequest): LinkAnswer => ({
  status: LINK_STATUS.ready,
  data: bytes(`RE:${text(r.query)}`),
})

beforeEach(() => {
  linkService.answer = echo
  linkService.asked = []
})
afterEach(() => {
  linkService.answer = null
})

const last = (): LinkRequest | undefined => linkService.asked.at(-1)

describe('ASK', () => {
  it('puts the question to the AI and the answer in the string', () => {
    const m = switchOn()
    type(m, 'DIM A$*40\nASK "HELLO",A$\nPRINT A$\n')
    expect(shown(m).slice(-2)).toEqual(['RE:HELLO', '>'])
    expect(last()).toMatchObject({ service: 0, type: 0, max: 40 })
    expect(text(last()?.query ?? new Uint8Array())).toBe('HELLO')
  })

  it('tells the AI how long the string is, and takes no more', () => {
    const m = switchOn()
    linkService.answer = () => ({ status: LINK_STATUS.ready, data: bytes('X'.repeat(40)) })
    type(m, 'ASK "Q",B$\nPRINT LEN(B$)\n')
    expect(last()?.max).toBe(16)
    expect(shown(m).slice(-2)).toEqual(['16', '>'])
  })

  it('asks from an expression into an element of an array', () => {
    const m = switchOn()
    type(m, '10 DIM C$(2)*30\n20 Q$="DOG"\n30 ASK Q$+"S",C$(1)\n40 PRINT C$(1)\nRUN\n')
    expect(shown(m).slice(-2)).toEqual(['RE:DOGS', '>'])
  })

  it('chooses the type by name or number, and says ARGUMENT for one it has not', () => {
    const m = switchOn()
    type(m, 'ASK TYPE "QUIZ"\nASK "Q",A$\n')
    expect(last()?.type).toBe(AI_TYPES.indexOf('QUIZ'))
    type(m, 'ASK TYPE 10\nASK "Q",A$\n')
    expect(last()?.type).toBe(10)
    type(m, 'ASK TYPE "WEATHER"\nASK "Q",A$\n')
    expect(last()?.type).toBe(AI_TYPES.indexOf('WEATHER'))
    type(m, 'ASK TYPE "NOPE"\n')
    expect(shown(m).at(-2)).toBe('ERR:ARGUMENT')
    type(m, 'ASK TYPE 11\n')
    expect(shown(m).at(-2)).toBe('ERR:ARGUMENT')
  })

  it('starts a new conversation after ASK NEW and a new type', () => {
    const m = switchOn()
    type(m, 'ASK "ONE",A$\n')
    expect(last()?.fresh).toBe(true)
    type(m, 'ASK "TWO",A$\n')
    expect(last()?.fresh).toBe(false)
    type(m, 'ASK NEW\nASK "THREE",A$\n')
    expect(last()?.fresh).toBe(true)
    type(m, 'ASK TYPE 1\nASK "FOUR",A$\n')
    expect(last()?.fresh).toBe(true)
  })

  it('puts what became of the question in a third variable, and then never stops', () => {
    const m = switchOn()
    type(m, '10 DIM A$*40\n20 ASK "Q",A$,S\n30 PRINT S;"/";A$;"/"\nRUN\n')
    expect(shown(m).slice(-2)).toEqual(['0 /RE:Q/', '>'])
    for (const status of [
      LINK_STATUS.off,
      LINK_STATUS.held,
      LINK_STATUS.failed,
      LINK_STATUS.badRequest,
      LINK_STATUS.interrupted,
    ]) {
      linkService.answer = () => ({ status })
      type(m, 'RUN\n')
      // The answer variable emptied, the status in S, and the program on to its end.
      expect(shown(m).slice(-2), `status ${status}`).toEqual([`${status} //`, '>'])
    }
  })

  it("runs the BASIC manual's example: an answer printed, a failure said, and on", () => {
    const manual = readFileSync('docs/elec16-basic.md', 'utf8')
    const at = manual.indexOf('10 DIM A$*200\n20 INPUT Q$\n30 ASK Q$,A$,S')
    const program = manual.slice(at, manual.indexOf('```', at))
    const m = switchOn()
    type(m, `${program}RUN\nDOG\n`)
    expect(shown(m).slice(-2)).toEqual(['RE:DOG', '?'])
    linkService.answer = () => ({ status: LINK_STATUS.failed })
    type(m, 'CAT\n')
    expect(shown(m).slice(-2)).toEqual(['NO ANSWER 4', '?'])
  })

  it('stops at BRK even with a third variable, and wants a number there', () => {
    const m = switchOn()
    linkService.answer = () => null
    type(m, '10 ASK "SLOW",A$,S\n20 PRINT "ON"\nRUN\n')
    m.brk()
    settle(m)
    expect(shown(m).some((l) => l.startsWith('BREAK IN 10'))).toBe(true)
    linkService.answer = echo
    type(m, 'ASK "Q",A$,B$\n')
    expect(shown(m).at(-2)).toBe('ERR:TYPE')
  })

  it('says why it got no answer', () => {
    const m = switchOn()
    for (const [status, said] of [
      [LINK_STATUS.off, 'ERR:LINK OFF'],
      [LINK_STATUS.failed, 'ERR:LINK'],
      [LINK_STATUS.interrupted, 'ERR:LINK'],
      [LINK_STATUS.badRequest, 'ERR:ARGUMENT'],
    ] as const) {
      linkService.answer = () => ({ status })
      type(m, 'ASK "Q",A$\n')
      expect(shown(m).at(-2)).toBe(said)
    }
  })

  it('is refused an empty question, and a number to answer into', () => {
    const m = switchOn()
    type(m, 'ASK "",A$\n')
    expect(shown(m).at(-2)).toBe('ERR:ARGUMENT')
    type(m, 'ASK "Q",A\n')
    expect(shown(m).at(-2)).toBe('ERR:TYPE')
  })

  it('is HELD when a program asks again with nobody pressing a key', () => {
    const m = switchOn()
    type(m, '10 ASK "ONE",A$\n20 ASK "TWO",B$\n30 PRINT "DONE"\nRUN\n')
    expect(shown(m).slice(-2)).toEqual(['ERR:LINK HELD IN 20', '>'])
    expect(linkService.asked).toHaveLength(1)
  })

  it('goes on asking in a program where a person answers between', () => {
    const m = switchOn()
    type(m, '10 INPUT Q$\n20 ASK Q$,A$\n30 PRINT A$\n40 GOTO 10\nRUN\nCAT\nDOG\n')
    expect(screen(m).filter((l) => l.startsWith('RE:'))).toEqual(['RE:CAT', 'RE:DOG'])
  })

  it('stops at BRK while it waits, the request dropped, and CONT asks again', () => {
    const m = switchOn()
    linkService.answer = () => null
    type(m, '10 ASK "SLOW",A$\n20 PRINT "GOT ";A$\nRUN\n')
    expect(m.state.link.busy).toBe(true)
    const out = last()
    m.brk()
    settle(m)
    expect(shown(m).some((l) => l.startsWith('BREAK IN 10'))).toBe(true)
    expect(m.state.link.busy).toBe(false)
    expect(m.takeLinkDrop()).toBe(out?.serial)
    linkService.answer = echo
    type(m, 'CONT\n')
    expect(shown(m).slice(-2)).toEqual(['GOT RE:SLOW', '>'])
  })

  it('lets go of a request at RUN, so its late answer writes nothing over the variables', () => {
    const m = switchOn()
    linkService.answer = () => null
    // Machine code sends and returns without waiting: CALL's way back cancels it.
    loadAsm(
      m,
      `
        li t0, 0x7100
        sw t0, -0x8a(zero)    ; QUERY
        li t0, 0x7200
        sw t0, -0x88(zero)    ; REPLY
        li t0, 20
        sw t0, -0x86(zero)    ; MAX
        li t0, 1
        sw t0, -0x90(zero)    ; SEND
        ret
      `,
    )
    m.state.ram.set([0x51, 0], 0x7100)
    type(m, 'CALL 28672\n')
    expect(m.state.link.busy).toBe(false)
    expect(m.state.link.status).toBe(LINK_STATUS.cancelled)
    // Dropped before the page took it: main never hears of it, and is told to drop it.
    expect(linkService.asked).toHaveLength(0)
    expect(m.takeLinkDrop()).toBe(m.state.link.serial)
  })
})

/** Machine code assembled at the code area and put in RAM. */
function loadAsm(m: Elec16, source: string): void {
  const out = assemble(`.org 0x7000\n${source}`)
  expect(out.errors).toEqual([])
  m.state.ram.set(ramImage(out, 0x7000), 0x7000)
}

describe('the ROM service 8', () => {
  it('asks, waits asleep, and gives the length and where the answer is', () => {
    const m = switchOn()
    loadAsm(
      m,
      `
        la   a0, question
        li   a1, 0x7200
        li   a2, 30
        li   a3, 0 * 256 + 7     ; the AI, DICT
        li   t0, 8               ; LINK
        ecall
        li   t1, 0x7300
        sw   a0, 0(t1)
        sw   a1, 2(t1)
        ret
question: .asciz "PULSAR"
      `,
    )
    type(m, 'CALL 28672\n')
    expect(last()).toMatchObject({ service: 0, type: 7, max: 30 })
    const word = (at: number) => (m.state.ram[at] ?? 0) | ((m.state.ram[at + 1] ?? 0) << 8)
    expect(word(0x7300)).toBe(9)
    expect(word(0x7302)).toBe(0x7200)
    expect(text(m.state.ram.subarray(0x7200, 0x720a))).toBe('RE:PULSAR\0')
    // mie as it was: KEY and CARD.
    expect(m.state.csr.mie).toBe(0x06)
  })

  it('gives -STATUS for a question it got no answer to', () => {
    const m = switchOn()
    linkService.answer = () => ({ status: LINK_STATUS.held })
    loadAsm(
      m,
      `
        la   a0, question
        li   a1, 0x7200
        li   a2, 30
        li   a3, 0
        li   t0, 8
        ecall
        li   t1, 0x7300
        sw   a0, 0(t1)
        ret
question: .asciz "Q"
      `,
    )
    type(m, 'CALL 28672\n')
    expect(m.state.ram[0x7300]).toBe(0xfd)
    expect(m.state.ram[0x7301]).toBe(0xff)
  })

  it('is let go when BRK takes machine code to the monitor', () => {
    const m = switchOn()
    linkService.answer = () => null
    loadAsm(
      m,
      `
        la   a0, question
        li   a1, 0x7200
        li   a2, 30
        li   a3, 0
        li   t0, 8
        ecall
        ret
question: .asciz "Q"
      `,
    )
    type(m, 'CALL 28672\n')
    expect(m.state.link.busy).toBe(true)
    m.brk()
    settle(m)
    expect(screen(m).some((l) => l.includes('BREAK AT'))).toBe(true)
    expect(m.state.link.busy).toBe(false)
  })
})

describe("BASIC's names for the types", () => {
  it('are the AI types of link-services.ts, in order', () => {
    const source = readFileSync('resources/elec16/rom/basic/link.e16.ts', 'utf8')
    const names = /AI_TYPE_NAMES = str\(\s*'([^']*)'/.exec(source)?.[1]
    expect(names?.split(' ')).toEqual([...AI_TYPES])
    expect(source).toContain(`const AI_TYPES = ${AI_TYPES.length}`)
  })
})

describe("CODE's ask", () => {
  it('asks through the library at every level, with the type it names', () => {
    const source = [
      "const Q = str('HELLO')",
      'const answer = bytes(41)',
      'export function main(): void {',
      '  askNew()',
      '  const n = askAs(7, Q, addr(answer), 40)',
      '  if (n >= 0) puts(addr(answer))',
      '  newline()',
      '}',
    ].join('\n')
    for (const level of [0, 1, 2] as const) {
      const b = buildCode('MAIN.TS', source, level)
      expect(b.errors, `-O${level}`).toEqual([])
      const m = switchOn()
      linkService.asked = []
      expect(m.loadCode(CODE_START, b.image)).toBe(true)
      type(m, 'CALL 28672\n')
      expect(shown(m).slice(-2), `-O${level}`).toEqual(['RE:HELLO', '>'])
      expect(last()).toMatchObject({ type: 7, max: 40, fresh: true })
    }
  })
})

describe("the E16 manual's LINK examples", () => {
  const manual = readFileSync('docs/elec16-e16.md', 'utf8')
  const example = (first: string): string => {
    const at = manual.indexOf(first)
    expect(at, first).toBeGreaterThan(0)
    return manual.slice(at, manual.indexOf('```', at))
  }

  for (const [first, kind] of [
    ['; AI に聞いて、答えを出す', 0],
    ['; LINK: AI に辞書を引かせる', 7],
  ] as const) {
    it(`runs "${first}" and shows the answer`, () => {
      const m = switchOn()
      loadAsm(m, example(first))
      type(m, 'CALL 28672\n')
      expect(last()?.type).toBe(kind)
      expect(shown(m).some((row) => row.includes('RE:'))).toBe(true)
      expect(shown(m).at(-1)).toBe('>')
      expect(m.state.csr.mie).toBe(0x06)
    })
  }
})

describe("the e16c manual's ask example", () => {
  it('builds at every level, asks what is typed, shows the answer, and ends on ENTER alone', () => {
    const manual = readFileSync('docs/elec16-e16c.md', 'utf8')
    const at = manual.indexOf('// 打った問いを AI に聞いて')
    const source = manual.slice(at, manual.indexOf('```', at))
    for (const level of [0, 1, 2] as const) {
      const b = buildCode('MAIN.TS', source, level)
      expect(b.errors, `-O${level}`).toEqual([])
      const m = switchOn()
      expect(m.loadCode(CODE_START, b.image)).toBe(true)
      type(m, 'CALL 28672\nDOG\nCAT\n\n')
      expect(
        shown(m).filter((row) => row.startsWith('RE:')),
        `-O${level}`,
      ).toEqual(['RE:DOG', 'RE:CAT'])
      expect(shown(m).at(-1)).toBe('>')
    }
  })
})
