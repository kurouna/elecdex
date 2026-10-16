import { describe, expect, it } from 'vitest'
import { I, MV, roundBy, spammer } from './elec16-elecfighter-support'

/**
 * ELECFIGHTER's ladder against spammers (design 3.1, 7.10): rounds each lost before a balance
 * pass. Apart from the one-button and person rounds so that vitest runs them side by side.
 */

describe('ELECFIGHTER the ladder against spammers (design 3.1, 7.10)', {
  timeout: 120_000,
}, () => {
  it('beats a crouching light kick pressed whenever able, and a walk up and throw', () => {
    // Measured 2026-10-09 (the second balance pass), two clocks a slot: the kick's spam took
    // 44-89% of the rounds before (the CPU stood to it, and its -2 on guard was no opening); after,
    // 0-47% by place, and the throw's 0% (100% before at places 0-2: a guard held at its range,
    // a throw on each waking). Here a round each of the four slots against the first opponent,
    // the slowest, and the throw by S3 POWER, the longest. Chance is seeded from the cycle
    // counter too, so faster code moves which rounds are lost: the second was 10 until e16c
    // divided by MULHU and read inlined arguments in place (2026-10-11), which left the rates as
    // they were (eight clocks a slot: the kick 0/32 before and 2/32 after, the throw 0/8 and 0/8).
    for (const slot of [0, 1, 2, 3]) {
      expect(roundBy(slot, 0, 11, spammer(I.down | I.lk, MV.cLK)), `S${slot + 1}`).toBe(1)
    }
    expect(roundBy(2, 0, 11, spammer(I.fwd | I.hp, 0, 'throw'))).toBe(1)
  })

  it('beats a jab pressed whenever able, closing in when behind late (LATE)', () => {
    // Measured 2026-10-10, eight clocks a slot: the jab's spam took 44% of the rounds at place 0
    // and 23% at place 1 - it struck first, and the wary CPU never came in again, so most went to
    // TIME UP with the spammer ahead (a TURTLE also stood unguarded just outside the jab's reach,
    // seen late, as the spammer walked in). After (LATE, the swinging-wide TURTLE guard): 18% and
    // 18%. Here rounds each lost before: S2 RUSH against MAINFRAME at place 0 (the guard), and S4
    // OUTBOX against MAINFRAME at place 1, to TIME (the pressing). S4's second was 15 until e16c's
    // change of 2026-10-11 moved the cycle count chance is seeded from; the rates held (eight
    // clocks a slot, places 0 and 1: 11/64 before, 12/64 after).
    const jab = () => spammer(I.lp, MV.sLP)
    for (const second of [10, 11]) expect(roundBy(1, 0, second, jab()), `S2 ${second}`).toBe(1)
    expect(roundBy(3, 1, 13, jab()), 'S4 at place 1').toBe(1)
  })
})
