import type { Elec16 } from '@shared/elec16/machine'
import { describe, expect, it } from 'vitest'
import {
  C,
  CLOCK,
  cart,
  fight,
  I,
  MIRROR,
  MV,
  moves,
  onceFor,
  PH,
  type Player,
  person,
  put,
  read,
  rng,
  ST,
  spammer,
  step,
} from './elec16-elecfighter-support'
import { frames } from './elec16-kit-helpers'

/**
 * ELECFIGHTER against one-button players (design 7.7, 7.10): a round against each of the
 * ladder's five, a heavy pressed whenever able and all four mashed.
 */

/** P1's one-button players: a heavy punch, or all four buttons, whenever able. */
const ONE_BUTTON: Record<string, (k: number) => number> = {
  hp: (k) => (k & 1 ? I.hp : 0),
  all: (k) => [I.lp, 0, I.hp, 0, I.lk, 0, I.hk, 0][k & 7] ?? 0,
}
/** The ladder's five as met: [P1's slot, the place] (KERNEL is S1's, so P1 takes S2 for it). */
const MET = { PACKET: [0, 0], MAINFRAME: [0, 1], DAEMON: [0, 2], KERNEL: [1, 2], ROOT: [0, MIRROR] }

/**
 * A round against the CPU of ladder place `at` (P1 in `slot`, the clock's second `second`), P1
 * playing `p1` and standing where it is: who took it (`roundWon`, 1 the CPU); P1's heavies
 * struck in their recovery (the CPU's punishes, whiffed or guarded); the CPU's hits taken, and
 * of them those taken while it walked forward (into an attack under way).
 */
function oneButton(slot: number, at: number, second: number, p1: (k: number) => number) {
  const m = fight({ ...CLOCK, second }, [2, 1], slot, at)
  const heavy = (mv: number) => [MV.sHP, MV.sHK, MV.cHP, MV.cHK].includes(mv)
  let punished = 0
  let taken = 0
  let walking = 0
  for (let k = 0; k < 7_000 && read(m, 'phase') === PH.fight; k++) {
    const mv = read(m, 'fMove', 0)
    const r = moves[slot]?.[mv] ?? []
    const recovering =
      read(m, 'fState', 0) === ST.attack &&
      heavy(mv) &&
      read(m, 'fMoveF', 0) >= (r[C.startup] ?? 0) + (r[C.active] ?? 0)
    const free = [ST.stand, ST.crouch].includes(read(m, 'fState', 1))
    step(m, p1(k), 0)
    if ([1, 3, 4].includes(read(m, 'struck', 1)) && recovering) punished++
    if ([1, 3].includes(read(m, 'struck', 0))) {
      taken++
      if (free && (read(m, 'outWas', 1) & I.fwd) !== 0) walking++
    }
  }
  expect(read(m, 'phase')).not.toBe(PH.fight)
  return { won: read(m, 'roundWon'), punished, taken, walking }
}

describe('ELECFIGHTER the CPU against one button (design 7.7, 7.10)', { timeout: 120_000 }, () => {
  // Measured 2026-10-08 in four seeds, before (the CPU walking in): the heavy punch beat
  // PACKET, MAINFRAME, DAEMON and KERNEL 4 of 4 times each, the CPU took 10 of the 60 matches
  // of the five against the three, and against DAEMON 50 of its 56 hits taken were walking
  // forward. After, in three seeds: 45 of 45, with 1 to 30 punishes a match. Since P4 a round
  // each of the heavy punch and the masher, in one seed (the heavy kick is the heavy punch's
  // kind, and every seed won). Since the second balance pass the CPU guards longer and the
  // rounds last longer (66 s for both players in one test, past the limit when the whole suite
  // runs side by side): a test for each player, the totals held by the last.
  let won = 0
  let all = 0
  let taken = 0
  let walking = 0
  for (const [player, p1] of Object.entries(ONE_BUTTON)) {
    it(`beats ${player} pressed whenever able: it keeps out of reach and punishes`, () => {
      for (const [name, [slot, at]] of Object.entries(MET)) {
        const r = oneButton(slot ?? 0, at ?? 0, 10, p1)
        const why = `${name} against ${player}: ${JSON.stringify(r)}`
        // Never a round without a punish - unless it was never struck at all: a TURTLE wary of a
        // masher keeps out of its heavies' reach by its swinging (2026-10-10), and MAINFRAME took
        // these rounds untouched, every heavy whiffed short of anything to punish.
        expect(r.punished > 0 || (r.won === 1 && r.taken === 0), why).toBe(true)
        if (r.won === 1) won++
        all++
        taken += r.taken
        walking += r.walking
      }
    })
  }

  it('wins eight rounds in ten of them, and is rarely hit walking in', () => {
    expect(all).toBe(Object.keys(MET).length * Object.keys(ONE_BUTTON).length)
    // PACKET, met first and slowed for it (cpu/ladder.txt), is the one these beat: over clocks
    // 10-17 it took 11 of the 16 rounds before the third balance pass and 10 after (2026-10-09),
    // the others all but one or two; this clock's two went to the player after the pass.
    expect(won / all).toBeGreaterThanOrEqual(0.8)
    // Walking into an attack under way: before, about half of the CPU's hits taken (DAEMON 14 of
    // 14); now a hit taken walking in is one the other started as it came, rarely. Counted, not
    // a share: these ten rounds leave the CPU only 2 to 6 hits taken, so one walking in was 20%
    // (measured over six clocks after the review: 0 or 1 walking in, of 2 to 6 taken).
    expect(walking, `${walking} of ${taken} hits taken walking in`).toBeLessThanOrEqual(2)
  })
})

/** A round against the CPU of ladder place `at`, P1 in `slot` played by `p1`: 0 if P1 took it. */
function roundBy(slot: number, at: number, second: number, p1: Player): number {
  const m: Elec16 = fight({ ...CLOCK, second }, [2, 1], slot, at)
  for (let k = 0; k < 7_000 && read(m, 'phase') === PH.fight; k++) {
    put(m, 'extHeld', p1(m), 0)
    frames(m, 1, cart)
  }
  expect(read(m, 'phase')).not.toBe(PH.fight)
  return read(m, 'roundWon')
}

describe('ELECFIGHTER the ladder against spammers and a person (design 3.1, 7.10)', {
  timeout: 120_000,
}, () => {
  it('beats a crouching light kick pressed whenever able, and a walk up and throw', () => {
    // Measured 2026-10-09 (the second balance pass), two clocks a slot: the kick's spam took
    // 44-89% of the rounds before (the CPU stood to it, and its -2 on guard was no opening); after,
    // 0-47% by place, and the throw's 0% (100% before at places 0-2: a guard held at its range,
    // a throw on each waking). Here a round each of the four slots against the first opponent,
    // the slowest, and the throw by S3 POWER, the longest.
    for (const slot of [0, 1, 2, 3]) {
      expect(roundBy(slot, 0, 10, spammer(I.down | I.lk, MV.cLK)), `S${slot + 1}`).toBe(1)
    }
    expect(roundBy(2, 0, 10, spammer(I.fwd | I.hp, 0, 'throw'))).toBe(1)
  })

  it('beats a jab pressed whenever able, closing in when behind late (LATE)', () => {
    // Measured 2026-10-10, eight clocks a slot: the jab's spam took 44% of the rounds at place 0
    // and 23% at place 1 - it struck first, and the wary CPU never came in again, so most went to
    // TIME UP with the spammer ahead (a TURTLE also stood unguarded just outside the jab's reach,
    // seen late, as the spammer walked in). After (LATE, the swinging-wide TURTLE guard): 18% and
    // 18%. Here rounds each lost before: S2 RUSH against MAINFRAME at place 0 (the guard), and S4
    // OUTBOX against MAINFRAME at place 1, to TIME (the pressing).
    const jab = () => spammer(I.lp, MV.sLP)
    for (const second of [10, 11]) expect(roundBy(1, 0, second, jab()), `S2 ${second}`).toBe(1)
    expect(roundBy(3, 1, 15, jab()), 'S4 at place 1').toBe(1)
  })

  it('is easier at the first place than at ROOT for a person', () => {
    // The tests' person (support's `person`) took 97% of the rounds at place 0 and 25% at ROOT
    // over four slots and four clocks (2026-10-09; 94% and 25% after the third balance pass).
    // Here S1 BALANCE, four clocks each.
    const won = (at: number) =>
      [10, 11, 12, 13].filter((second, k) => roundBy(0, at, second, person(k + 1)) === 0).length
    const first = won(0)
    const root = won(MIRROR)
    expect(first).toBeGreaterThanOrEqual(3)
    expect(root).toBeLessThan(first)
    expect(root).toBeLessThanOrEqual(2)
  })
})

describe("the tests' person (design 3.1's measure)", () => {
  it('chains half the lights that strike: one draw a move, kept through its frames', () => {
    const r = rng(7)
    const d = { id: -1, on: false }
    let on = 0
    for (let id = 1; id <= 400; id++) {
      const first = onceFor(d, id, r, 0.5)
      for (let f = 0; f < 12; f++) expect(onceFor(d, id, r, 0.5)).toBe(first)
      if (first) on++
    }
    expect(on).toBeGreaterThan(160)
    expect(on).toBeLessThan(240)
  })
})
