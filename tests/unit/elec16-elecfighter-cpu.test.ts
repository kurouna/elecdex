import type { Elec16 } from '@shared/elec16/machine'
import { padBit } from '@shared/elec16/pad'
import { describe, expect, it } from 'vitest'
import {
  again,
  C,
  CLOCK,
  cart,
  fight,
  I,
  LOG_ROW,
  MIRROR,
  MV,
  MV2,
  moves,
  O,
  O2,
  O3,
  opponents,
  PH,
  place,
  put,
  read,
  row,
  rowOf,
  rowText,
  SC,
  SLOT_IDS,
  ST,
  ST2,
  scaled,
  setRow,
  step,
  steps,
  table,
  until,
  WAIT,
} from './elec16-elecfighter-support'
import { frames, tap } from './elec16-kit-helpers'

/** ELECFIGHTER's CPU (design 7.10): what it sees, guards and reads, its habits and combos. */

/**
 * CPU fighter 1 kept still for a test: no whim, no habit, no anti-air or punish, not wary of the
 * other's swinging, waiting where it stands (its liked distance the one it is at) with nothing
 * new chosen for a long while.
 */
function still(m: Elec16): void {
  put(m, 'swing', 0, 1)
  setRow(m, 1, O3.whim, 0)
  setRow(m, 1, O.think, 250)
  setRow(m, 1, O2.pattern, 0)
  setRow(m, 1, O.aa, 0)
  setRow(m, 1, O2.punish, 0)
  setRow(m, 1, O2.range, Math.abs(read(m, 'fX', 1) - read(m, 'fX', 0)) >> 4)
  put(m, 'plan', WAIT, 1)
  put(m, 'planT', 250, 1)
  put(m, 'thinkT', 250, 1)
  // And its plan held as long: a plan run out is thought anew, a draw of the weights (seen
  // 2026-10-09, a jump in drawn once the CPU's chances were drawn in another order).
  put(m, 'planT', 250, 1)
  // Its presses before forgotten: a back pressed in a backdash's taps it was drawing before, and
  // the guard's back now, would be the two taps of one (seen 2026-10-08, a seed that drew it).
  for (let k = 0; k < 16; k++) put(m, 'ringD', 0, 16 + k)
}

/**
 * One frame of the CPU (P2) with `plan` forced (-1: thinking afresh) and P1 holding `p1`, played
 * on as it is and, from its snapshot, with P1 moved to the CPU's other side (from its left far
 * out of a throw's reach, from its right near) in another state: the CPU's buttons both times.
 */
function cpuTwice(m: Elec16, plan: number, p1: number): [number, number] {
  if (plan >= 0) {
    put(m, 'plan', plan, 1)
    put(m, 'planT', 30, 1)
  } else put(m, 'thinkT', 0, 1)
  const b = again(m.snapshot())
  const x1 = read(b, 'fX', 1)
  put(b, 'fX', read(b, 'fX', 0) < x1 ? x1 + 100 * 16 : x1 - 30 * 16, 0)
  put(b, 'fState', read(b, 'fState', 0) === ST.attack ? ST.stand : ST.attack, 0)
  put(b, 'fMove', MV2.throw, 0)
  put(b, 'fY', 0, 0)
  // P1's body box now (its pose's, `bx` word 2) made far wider: the throw's range is the
  // other's body as its slot stands, never as it is posed this frame.
  put(b, 'bx', read(b, 'bx', 2) + 60, 2)
  step(m, p1)
  step(b, p1)
  return [read(m, 'cpuHeld', 1), read(b, 'cpuHeld', 1)]
}

describe('ELECFIGHTER the CPU (P2, design 7.10)', { timeout: 120_000 }, () => {
  it('guards on sight only what starts slower than its reaction, and never reads nearer than it', () => {
    /** P1's `button` (a crouching move with down) against the CPU of reaction R: how it landed. */
    const landed = (r: number, button: number) => {
      const m = fight(CLOCK, [2, 1])
      still(m)
      place(m, 236, 270)
      still(m)
      setRow(m, 1, O.rGuard, r)
      setRow(m, 1, O.rSwitch, r)
      setRow(m, 1, O.guard, 256)
      steps(m, 40)
      still(m)
      let s = 0
      for (let k = 0; k < 30; k++) {
        step(m, k === 0 ? button : button & I.down, 0)
        s = Math.max(s, read(m, 'struck', 0))
      }
      const reactions = [O.rGuard, O.rAA, O.rPunish, O.rSwitch].map((c) => rowOf(m, 1, c))
      expect(read(m, 'seenLate', 1)).toBeGreaterThanOrEqual(Math.min(...reactions))
      expect(read(m, 'seenLate', 1)).toBeGreaterThanOrEqual(r)
      return s
    }
    const sweep = row(MV.cHK)[C.startup] ?? 0
    expect(sweep).toBe(10)
    // The sweep starts in 10: seen 10 frames late, too late; 9, in time.
    expect(landed(10, I.down | I.hk)).toBe(1)
    expect(landed(9, I.down | I.hk)).toBe(2)
    // The light kick (5) is never seen in time, even by the quickest (8).
    expect(landed(8, I.down | I.lk)).toBe(1)
    // The standing heavy kick (11), by 10.
    expect(landed(10, I.hk)).toBe(2)
    // The table: no reaction under 8 but the tech's (cpu/ladder.txt slows or quickens it by place).
    for (const r of opponents) {
      for (const c of [O.rGuard, O.rAA, O.rPunish, O.rSwitch])
        expect(r[c]).toBeGreaterThanOrEqual(8)
    }
  })

  it('chooses the same buttons whatever the other is doing now: it sees only the ring of what was', () => {
    // Found in review 2026-10-08: the throw's range and "its back to the wall" read the other's
    // place now (fX), not as seen R frames late. Each frame is played twice from the same
    // snapshot, once with P1 moved to the CPU's other side, in another state, in RAM just before
    // it: the CPU's buttons for that frame (chosen before P1 moves) must be the same.
    const THROW = 5
    // At the left wall with P1 beside it (its back to the wall), the throw planned or not; and
    // the throw planned in the open.
    for (const c of [
      { cpu: 60, p1: 100, plan: THROW },
      { cpu: 60, p1: 100, plan: -1 },
      { cpu: 300, p1: 270, plan: THROW },
    ]) {
      const m = fight(CLOCK, [2, 1], 0, 3)
      place(m, c.p1, c.cpu)
      for (let k = 0; k < 120 && read(m, 'phase') === PH.fight; k++) {
        const [now, moved] = cpuTwice(m, c.plan, k & 8 ? I.fwd : 0)
        expect(moved, `frame ${k} of ${JSON.stringify(c)}`).toBe(now)
        // Each run goes on from the true one.
        if (k % 30 === 29) place(m, c.p1, c.cpu)
      }
    }
  })

  it('combos no more than 4 hits on one who stands still, whichever opponent', () => {
    for (const at of [0, 1, 2, 3]) {
      const m = fight(CLOCK, [2, 1], 0, at)
      let hit = 0
      // A round is enough: every opponent knocks the one standing still out in it.
      for (let k = 0; k < 3000 && read(m, 'phase') === PH.fight; k++) {
        step(m)
        if (read(m, 'struck', 1) !== 0) hit++
      }
      expect(hit, `place ${at}`).toBeGreaterThan(0)
      expect(read(m, 'fComboMax', 0), `place ${at}`).toBeLessThanOrEqual(4)
    }
  })

  it("shows each opponent's habit as a tendency: due at counts drawn afresh, out by its chance, never always", () => {
    const cases = [
      // PACKET, its lights guarded; MAINFRAME, the person walking back; DAEMON, in and out on
      // its gap; KERNEL (P1 in S2 RUSH, so it is met third), its heavies guarded.
      { slot: 0, at: 0, row: 0, p1: (_: number) => I.back | I.down },
      { slot: 0, at: 1, row: 1, p1: (k: number) => ((k >> 6) & 1 ? I.back : I.fwd) },
      { slot: 0, at: 2, row: 2, p1: (_: number) => I.back | I.down },
      { slot: 1, at: 2, row: 3, p1: (_: number) => I.back | I.down },
    ]
    for (const c of cases) {
      const r = opponents[c.row] ?? []
      const chance = (r[O2.habit] ?? 0) / 256
      expect(chance).toBeGreaterThan(0)
      expect(chance).toBeLessThanOrEqual(0.7)
      const { due, fired, drawn, whims } = habitWatched(c.slot, c.at, c.p1)
      const why = `row ${c.row}: ${fired} of ${due}, ${drawn.join(' ')}`
      expect(due, why).toBeGreaterThanOrEqual(8)
      expect(fired, why).toBeGreaterThan(0)
      expect(fired, why).toBeLessThan(due)
      expect(Math.abs(fired / due - chance), why).toBeLessThan(0.3)
      expect(Math.min(...drawn)).toBeGreaterThanOrEqual(r[O2.min] ?? 0)
      expect(Math.max(...drawn)).toBeLessThanOrEqual(r[O2.max] ?? 0)
      expect(new Set(drawn).size, why).toBeGreaterThanOrEqual(2)
      expect(
        drawn.some((d, k) => k > 0 && d === drawn[k - 1]),
        why,
      ).toBe(false)
      expect(whims, why).toBeGreaterThan(0)
    }
  })

  it('gives S4 a body no nearer than the others and DAEMON a range at the tip of its long kick', () => {
    // Measured 2026-10-08, two CPUs of the same scaling, sides taken in turn: S4 under DAEMON
    // lost all 4 matches against each slot, and 0 of 4 against S1 even under KERNEL's row -
    // its drafted hurt boxes stood 3 points ahead of everyone's (its long guard arms and knee
    // taken for the body), and DAEMON liked 90 points, out of its own reach (67 with the heavy
    // kick, 76 the sweep) and inside the others' heavy punch. After (boxes, range, its habit at
    // 100 in 256), in 6 seeds a pairing: 2, 1 and 1 of 6 against S1, S2 and S3.
    const art = SLOT_IDS.map((s) => table(`fighters/${s}/poses.txt`, 24))
    const front = (s: number, pose: number, boxes: number[]) =>
      Math.max(
        ...boxes.map((k) => {
          const b = art[s]?.[pose] ?? []
          return (b[k * 4 + 2] ?? 0) === 0 ? -99 : (b[k * 4] ?? 0) + (b[k * 4 + 2] ?? 0)
        }),
      )
    const body = (s: number) => front(s, 0, [1, 2, 3])
    // Standing, guarding, at rest: S4 is the slim one (slots.json's girth 0.88).
    for (const pose of [0, 7, 60]) {
      expect(front(3, pose, [1, 2, 3])).toBeLessThanOrEqual(
        Math.max(front(0, pose, [1, 2, 3]), front(2, pose, [1, 2, 3])),
      )
    }
    // The power slot's heavy punch reaches as the standard's (design 3.1).
    const active = (s: number, m: number) => (moves[s]?.[m]?.[14] ?? 0) + 1
    expect(front(2, active(2, MV.sHP), [4, 5])).toBe(front(0, active(0, MV.sHP), [4, 5]))
    // DAEMON's liked range: past its heavy kick's tip on a standing S1 by at most its width, and
    // within its sweep's.
    const tip = (m: number) => front(3, active(3, m), [4, 5]) + body(0) - 1
    const daemon = opponents[2] ?? []
    expect(daemon[0]).toBe(3)
    expect(daemon[O2.range] ?? 0).toBeGreaterThanOrEqual(tip(MV.sHK))
    expect((daemon[O2.range] ?? 0) - (daemon[13] ?? 0)).toBeLessThanOrEqual(tip(MV.sHK))
    expect(daemon[O2.range] ?? 0).toBeLessThanOrEqual(tip(MV.cHK))
  })

  it('reads more the later it is met, but never one that does not read at all', () => {
    // Found in review 2026-10-08: KERNEL's read of 0 became 52 as the third met.
    const kernel = opponents[3] ?? []
    expect(kernel[O2.read]).toBe(0)
    const m = fight(CLOCK, [2, 1], 1, 2)
    expect(read(m, 'ladder', 2)).toBe(3)
    expect(rowOf(m, 1, O2.read)).toBe(0)
    // One that reads, met later, reads more: DAEMON as the third.
    const d = fight(CLOCK, [2, 1], 0, 2)
    expect(rowOf(d, 1, O2.read)).toBe(scaled(2, 2)[O2.read])
    expect(rowOf(d, 1, O2.read)).toBeGreaterThan(opponents[2]?.[O2.read] ?? 0)
  })

  it('has ROOT read a habit kept up, and lose to it changed', () => {
    const m = fight(CLOCK, [2, 1], 0, MIRROR)
    expect(rowOf(m, 1, O2.read)).toBe(scaled(4, 3)[O2.read])
    const wake = (button: number) => wakeBeside(m, button)
    // Counted from here: the seed (the select's press) may give it a read before.
    const hits = read(m, 'readHits', 1)
    const miss = read(m, 'readMiss', 1)
    const kept = Array.from({ length: 10 }, () => wake(I.down | I.lp))
    // Twice before it knows; from then on it reads the strike and is crouched guarding.
    expect(kept.slice(0, 2).map((r) => r.guarded)).toEqual([1, 1])
    expect(kept.slice(2).map((r) => r.guarded)).toEqual(Array(8).fill(2))
    // Eight reads of the habit right (another of the fight's moments may be read right too).
    expect(read(m, 'readHits', 1) - hits).toBeGreaterThanOrEqual(8)
    expect(read(m, 'readMiss', 1) - miss).toBe(0)
    // The habit changed: still reading the strike, it guards and is thrown.
    const changed = wake(I.fwd | I.hp)
    expect(changed.threw).toBe(1)
    expect(read(m, 'readMiss', 1) - miss).toBe(1)
  })

  it('counts the lows in a row only as it sees them, R late, and forgets them with the match', () => {
    // Found in review 2026-10-09: the lows (and throws) in a row were counted from the record's
    // frame, 1 late, so a TURTLE crouched to the second low as it began - quicker than its eyes -
    // and the count carried into the next match.
    const m = fight(CLOCK, [2, 1], 0, 0)
    place(m, 100, 200)
    still(m)
    const r = rowOf(m, 1, O.rGuard)
    const lows = () => read(m, 'lastML', 1) >> 8
    const low = () => {
      step(m, I.down | I.lk)
      for (let k = 0; k < 60 && read(m, 'fState', 0) !== ST.crouch; k++) step(m, I.down)
    }
    low()
    steps(m, 30, I.down)
    expect(lows()).toBe(1)
    // The second: still one until R frames after it began, then two.
    step(m, I.down | I.lk)
    let at = 1
    while (at < 40 && lows() < 2) {
      step(m, I.down)
      at++
    }
    expect(at).toBeGreaterThanOrEqual(r)
    expect(lows()).toBe(2)
    // Two throws in a row and a FEINT's choice, left from a match, are gone at the next.
    put(m, 'lastML', 0x0233, 1)
    for (let k = 0; k < 3000 && read(m, 'screen') !== SC.result; k++) {
      if (read(m, 'phase') === PH.fight) put(m, 'fLife', 0, 1)
      step(m)
    }
    frames(m, 20, cart)
    tap(m, padBit('start'), cart)
    until(m, SC.fight, 600)
    expect(read(m, 'lastML', 1)).toBe(0)
  })

  it('logs READ when a read was right', () => {
    const m = fight(CLOCK, [2, 1], 0, MIRROR)
    const logged = Array.from({ length: 6 }, () => wakeBeside(m, I.down | I.lp).log)
    expect(logged.slice(0, 2)).not.toContain('> READ')
    expect(logged.slice(2)).toEqual(Array(4).fill('> READ'))
  })
})

/**
 * Against the CPU of ladder place `at` (P1 in `slot`, driven by `p1` frame by frame and never
 * falling, so the habit is watched as long as the test runs): its habit's counts once it has
 * been due 16 times (at most 6,000 frames: DAEMON's gap comes round in 600; at 8, tried
 * 2026-10-08, DAEMON had taken no whim yet) - times due, times out, the counts drawn in order -
 * and its whims.
 */
function habitWatched(slot: number, at: number, p1: (k: number) => number) {
  const m = fight(CLOCK, [2, 1], slot, at)
  for (let k = 0; k < 6000 && read(m, 'outcome') === 0 && read(m, 'habDue', 1) < 16; k++) {
    put(m, 'fLife', 90, 0)
    step(m, p1(k))
  }
  const n = read(m, 'habDrawnN', 1)
  const last = Math.min(16, n)
  return {
    due: read(m, 'habDue', 1),
    fired: read(m, 'habFired', 1),
    drawn: Array.from({ length: last }, (_, k) => read(m, 'habDrawn', 16 + ((n - last + k) & 15))),
    whims: read(m, 'whims', 1),
  }
}

/**
 * P1 knocked down beside ROOT (kept still, always reading, never teching); as it stands,
 * `button`: whether that was guarded, whether it threw, and the log line meanwhile.
 */
function wakeBeside(m: Elec16, button: number): { guarded: number; threw: number; log: string } {
  still(m)
  place(m, 236, 270)
  for (const i of [0, 1]) put(m, 'fLife', 100, i)
  put(m, 'fState', ST2.down, 0)
  put(m, 'fStateT', 30, 0)
  still(m)
  setRow(m, 1, O2.read, 256)
  setRow(m, 1, O.rTech, 30)
  for (let k = 0; k < 40 && read(m, 'fState', 0) !== ST.stand; k++) step(m)
  let guarded = 0
  let threw = 0
  let log = ''
  for (let k = 0; k < 14; k++) {
    step(m, k === 0 ? button : button & I.down)
    guarded = Math.max(guarded, read(m, 'struck', 0))
    threw = Math.max(threw, read(m, 'threw', 0))
    if (k < 3) log = rowText(m, LOG_ROW) || log
  }
  steps(m, 30)
  return { guarded, threw, log }
}
