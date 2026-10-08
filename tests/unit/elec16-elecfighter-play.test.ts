import { describe, expect, it } from 'vitest'
import {
  C,
  CLOCK,
  fight,
  I,
  MIRROR,
  MV,
  moves,
  PH,
  read,
  ST,
  step,
} from './elec16-elecfighter-support'

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
  it('beats a heavy pressed whenever able, and all four mashed: it keeps out of reach and punishes', () => {
    // Measured 2026-10-08 in four seeds, before (the CPU walking in): the heavy punch beat
    // PACKET, MAINFRAME, DAEMON and KERNEL 4 of 4 times each, the CPU took 10 of the 60 matches
    // of the five against the three, and against DAEMON 50 of its 56 hits taken were walking
    // forward. After, in three seeds: 45 of 45, with 1 to 30 punishes a match. Since P4 a round
    // each of the heavy punch and the masher, in one seed (the heavy kick is the heavy punch's
    // kind, and every seed won): the test took two and a half minutes.
    let won = 0
    let all = 0
    let taken = 0
    let walking = 0
    for (const [name, [slot, at]] of Object.entries(MET)) {
      for (const [player, p1] of Object.entries(ONE_BUTTON)) {
        const r = oneButton(slot ?? 0, at ?? 0, 10, p1)
        const why = `${name} against ${player}: ${JSON.stringify(r)}`
        // Never a round without a punish.
        expect(r.punished, why).toBeGreaterThan(0)
        if (r.won === 1) won++
        all++
        taken += r.taken
        walking += r.walking
      }
    }
    expect(won / all).toBeGreaterThanOrEqual(0.9)
    // Walking into an attack under way: before, about half of the CPU's hits taken (DAEMON 14 of
    // 14); now a hit taken walking in is one the other started as it came, rarely. Counted, not
    // a share: these ten rounds leave the CPU only 2 to 6 hits taken, so one walking in was 20%
    // (measured over six clocks after the review: 0 or 1 walking in, of 2 to 6 taken).
    expect(walking, `${walking} of ${taken} hits taken walking in`).toBeLessThanOrEqual(2)
  })
})
