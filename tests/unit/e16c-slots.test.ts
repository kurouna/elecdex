import type { Fn, Op } from '@shared/e16c/ir'
import { shareSlots } from '@shared/e16c/slots'
import { describe, expect, it } from 'vitest'

/**
 * e16c's shared places (slots.ts): locals whose lives never overlap take one slot, so -O1
 * keeps more of them in registers and fewer in a frame. A life runs to where the back end
 * really reads the local - it leaves `ld` on its stack picture until a value is needed.
 */

function fnOf(params: number, slots: string[], body: Op[]): Fn {
  return {
    name: 'f',
    params,
    slots,
    returns: true,
    body,
    exported: true,
    file: 'f.ts',
    line: 1,
    bank: null,
  }
}

const ld = (slot: number): Op => ({ k: 'ld', slot })
const st = (slot: number): Op => ({ k: 'st', slot })
const push = (v: number): Op => ({ k: 'push', v })
const add: Op = { k: 'bin', op: 'add' }
const mul: Op = { k: 'bin', op: 'mul' }
const ret: Op = { k: 'ret', value: true }

/** The slot each `st` in the body writes, in order. */
const stores = (fn: Fn): number[] => fn.body.flatMap((op) => (op.k === 'st' ? [op.slot] : []))

describe('e16c shared places', () => {
  it('gives locals one after another one place, named by both', () => {
    // a = x + 1; G = a; b = x + 2; return b + x
    const fn = shareSlots(
      fnOf(
        1,
        ['x', 'a', 'b'],
        [
          ld(0),
          push(1),
          add,
          st(1),
          ld(1),
          { k: 'stg', at: 0x100, byte: false },
          ld(0),
          push(2),
          add,
          st(2),
          ld(2),
          ld(0),
          add,
          ret,
        ],
      ),
    )
    expect(fn.slots).toEqual(['x', 'a/b'])
    expect(stores(fn)).toEqual([1, 1])
  })

  it('keeps apart what a loop carries and what it makes each time', () => {
    // s = 0; i = 0; L: t = i * 2; s = s + t; i = i + 1; if (i < 3) goto L; return s
    const fn = shareSlots(
      fnOf(
        0,
        ['s', 'i', 't'],
        [
          push(0),
          st(0),
          push(0),
          st(1),
          { k: 'label', name: 'L' },
          ld(1),
          push(2),
          mul,
          st(2),
          ld(0),
          ld(2),
          add,
          st(0),
          ld(1),
          push(1),
          add,
          st(1),
          ld(1),
          push(3),
          { k: 'bin', op: 'lt' },
          { k: 'jnz', to: 'L' },
          ld(0),
          ret,
        ],
      ),
    )
    expect(fn.slots).toHaveLength(3)
  })

  it('keeps a local read but still waiting apart from one written before it is used', () => {
    // return a + (v = 5, v): a is read when the add needs it, after v is written.
    const waiting = shareSlots(
      fnOf(
        1,
        ['x', 'a', 'v'],
        [ld(0), push(3), mul, st(1), ld(1), push(5), st(2), ld(2), add, ret],
      ),
    )
    const [a, v] = stores(waiting)
    expect(a).not.toBe(v)
    // A sum on it waits too: (a + 1) + (v = 5, v).
    const sum = shareSlots(
      fnOf(
        1,
        ['x', 'a', 'v'],
        [ld(0), push(3), mul, st(1), ld(1), push(1), add, push(5), st(2), ld(2), add, ret],
      ),
    )
    const [a2, v2] = stores(sum)
    expect(a2).not.toBe(v2)
  })

  it('lets a local go once an operation has read it into a register', () => {
    // (a * 3) + (v = 5, v): the product is in a register before v is written.
    const fn = shareSlots(
      fnOf(
        1,
        ['x', 'a', 'v'],
        [ld(0), push(3), mul, st(1), ld(1), push(3), mul, push(5), st(2), ld(2), add, ret],
      ),
    )
    const [a, v] = stores(fn)
    expect(a).toBe(v)
  })

  it('reads a waiting local by the label it reaches at the latest', () => {
    // a = x * 3; push a; L: (another arm joins) ... the value is in a register at a label.
    const fn = shareSlots(
      fnOf(
        1,
        ['x', 'a', 'v'],
        [
          ld(0),
          push(3),
          mul,
          st(1),
          ld(1),
          { k: 'label', name: 'L' },
          push(5),
          st(2),
          ld(2),
          add,
          ret,
        ],
      ),
    )
    const [a, v] = stores(fn)
    expect(a).toBe(v)
  })

  it('never shares among parameters, and keeps them first', () => {
    // Each arrives in its own register, even one never read.
    const fn = shareSlots(fnOf(3, ['p', 'q', 'r'], [ld(2), ld(0), add, ret]))
    expect(fn.slots).toEqual(['p', 'q', 'r'])
    // A local may take the place of a parameter that is done with.
    const after = shareSlots(fnOf(2, ['p', 'q', 'k'], [ld(0), ld(1), add, st(2), ld(2), ret]))
    expect(after.slots.slice(0, 2).map((s) => s.split('/')[0])).toEqual(['p', 'q'])
    expect(after.slots).toHaveLength(2)
  })

  it('gives a copy its source’s place when the source is not read again', () => {
    // a = x * 2; b = a; return b + 1
    const fn = shareSlots(
      fnOf(
        1,
        ['x', 'a', 'b'],
        [ld(0), push(2), mul, st(1), ld(1), st(2), ld(2), push(1), add, ret],
      ),
    )
    const [a, b] = stores(fn)
    expect(a).toBe(b)
  })
})
