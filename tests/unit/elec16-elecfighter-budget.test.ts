import type { Elec16 } from '@shared/elec16/machine'
import { padBit } from '@shared/elec16/pad'
import { describe, expect, it } from 'vitest'
import {
  boot,
  CLOCK,
  cart,
  fight,
  globals,
  I,
  PH,
  perLine,
  put,
  read,
  SC,
  spritesLeftOf,
  toSelect,
} from './elec16-elecfighter-support'
import { frames, tap } from './elec16-kit-helpers'

/**
 * ELECFIGHTER played whole by two CPUs (design 7.7, 10.4): the same match from the same clock,
 * a match begun within a frame, the rounds' length, z kept 0, and the frame budget.
 */

/** 1 if either fighter's z or its speed is not 0 (the fight is on a line: design 4.2). */
const zOff = (m: Elec16) =>
  [0, 1].some((i) => read(m, 'fZ', i) !== 0 || read(m, 'fVZ', i) !== 0) ? 1 : 0

/**
 * Two CPUs' matches (P1's CPU in S1 against the ladder's first two, the clock's second 20),
 * played once for the file and measured frame by frame (a frame that loads a round or a match
 * is not one of them): the rounds' lengths in seconds, the frames' average and busiest cycles,
 * the most sprites on a line, the outcomes, whether the machine stopped, and the frames either
 * fighter's z or its speed was not 0 (every frame, the screens between too).
 */

function playCpus() {
  const rounds: number[] = []
  const outcomes: number[] = []
  let sum = 0
  let worst = 0
  let line = 0
  let n = 0
  let halted = false
  let zMoved = 0
  for (const at of [0, 1]) {
    const m = fight({ ...CLOCK, second: 20 }, [1, 1], 0, at)
    let r = 0
    for (let k = 0; k < 30_000 && read(m, 'outcome') === 0; k++) {
      const fighting = read(m, 'phase') === PH.fight
      const c0 = m.state.cycles
      frames(m, 1, cart)
      zMoved += zOff(m)
      if (!fighting) continue
      r++
      if (read(m, 'phase') !== PH.fight) {
        rounds.push(r / 60)
        r = 0
        continue
      }
      const d = m.state.cycles - c0
      sum += d
      worst = Math.max(worst, d)
      line = Math.max(line, ...perLine(m))
      n++
    }
    outcomes.push(read(m, 'outcome'))
    halted ||= m.state.halt !== null
  }
  return { rounds, avg: sum / n, worst, line, outcomes, halted, zMoved }
}
let cpusPlayed: ReturnType<typeof playCpus> | undefined
const cpus = () => {
  cpusPlayed ??= playCpus()
  return cpusPlayed
}

describe('ELECFIGHTER two CPUs, chance and the frame budget', { timeout: 120_000 }, () => {
  /** P1 idle on the pad, the stand-in against it: the match's RAM after `n` frames. */
  const match = (clock: Elec16 | typeof CLOCK = CLOCK, n = 300) => {
    const m = fight(clock, [0, 1])
    frames(m, n, cart)
    return m
  }

  it('plays the same match from the same clock and buttons, another from another clock', () => {
    // One played from its first frame, one from the snapshot the tests keep: the same.
    const a = match(boot())
    const b = match()
    expect(globals(a)).toEqual(globals(b))
    const c = match({ ...CLOCK, second: 13 })
    const moves = (m: Elec16) => [read(m, 'fX', 1), read(m, 'fLife', 0), read(m, 'fMove', 1)]
    expect(globals(c)).not.toEqual(globals(a))
    expect(moves(c)).not.toEqual(moves(a))
  })

  /** A match played frame by frame: the average and busiest frame's cycles, the most sprites on a line. */
  function measured(m: Elec16, n: number, pad: (k: number) => number) {
    let sum = 0
    let worst = 0
    let line = 0
    let k = 0
    for (; k < n && read(m, 'outcome') === 0; k++) {
      put(m, 'extHeld', pad(k), 0)
      const c0 = m.state.cycles
      frames(m, 1, cart)
      const d = m.state.cycles - c0
      sum += d
      worst = Math.max(worst, d)
      line = Math.max(line, ...perLine(m))
    }
    expect(m.state.halt).toBeNull()
    return { avg: sum / k, worst, line, frames: k, outcome: read(m, 'outcome') }
  }

  it('begins a match within a frame: the select to the versus and the fight, two CPUs measuring', () => {
    // Found in review 2026-10-08: the frame the select gave way to the versus took 212,461
    // cycles (both sides' reaches measured on the boxes, 60,000 each, a word and a bank a time;
    // both backgrounds cleared a word at a time, 49,000), over three frames' worth.
    const m = boot()
    toSelect(m)
    tap(m, padBit('a'), cart)
    put(m, 'ctl', 1, 0)
    put(m, 'ctl', 1, 1)
    let worst = 0
    for (let k = 0; k < 300 && read(m, 'phase') !== PH.fight; k++) {
      const c0 = m.state.cycles
      frames(m, 1, cart)
      worst = Math.max(worst, m.state.cycles - c0)
    }
    expect(read(m, 'screen')).toBe(SC.fight)
    expect(worst).toBeLessThan(66_667)

    // Found in review 2026-10-08: START on the versus's first frame went on at once, and both
    // sides were measured in that one frame. Pressed as the versus waits for its first frame.
    const n = boot()
    toSelect(n)
    n.pad(padBit('a'))
    frames(n, 1, cart)
    n.pad(0)
    put(n, 'ctl', 1, 0)
    put(n, 'ctl', 1, 1)
    for (let k = 0; k < 60 && read(n, 'screen') !== SC.versus; k++) frames(n, 1, cart)
    expect(read(n, 'screen')).toBe(SC.versus)
    n.pad(padBit('start'))
    let first = 0
    // Found in review 2026-10-08: gone on before the versus laid any sprite, its frames showed
    // the select's last list - the figure at its left (x 72), on tiles refilled for the fight.
    let stray = 0
    for (let k = 0; k < 300 && read(n, 'phase') !== PH.fight; k++) {
      const c0 = n.state.cycles
      frames(n, 1, cart)
      if (k === 1) n.pad(0)
      first = Math.max(first, n.state.cycles - c0)
      if (read(n, 'phase') !== PH.fight) stray += spritesLeftOf(n, 80)
    }
    expect(read(n, 'screen')).toBe(SC.fight)
    expect(first).toBeLessThan(66_667)
    expect(stray).toBe(0)
  })

  it("plays a scripted fight and two CPUs' matches within their frames, 32 sprites a line", () => {
    const script = [
      I.fwd,
      I.fwd | I.lp,
      I.hp,
      I.back,
      I.down | I.lk,
      I.up | I.fwd,
      I.hk,
      I.down | I.hp,
      0,
    ]
    // Its first 2,400 frames (since P4; before, the match to its end, 2,780 frames): rounds,
    // a KO and the next round's start come in them.
    const scripted = measured(
      fight(CLOCK, [2, 1]),
      2400,
      (k) => script[(k >> 4) % script.length] ?? 0,
    )
    // Two CPUs' matches are measured once for the file (cpus()).
    const both = cpus()
    expect(both.halted).toBe(false)
    expect(both.outcomes.every((o) => o !== 0)).toBe(true)
    // The ladder's measures before P4 (they stood in its test): over a whole ladder of CPUs on
    // 2026-10-08, 3,950 frames of fighting, 9,240 cycles on average and 17,069 at worst; a frame
    // that loads a match runs past the frame (76,879: both backgrounds cleared whole, the stage's
    // map and both slots' tables) and the picture waits a frame there. With GRID's raster 17,271
    // and 25,413; with the drawn fighters (P3) 16,673 and 29,116, 16 sprites at most on a line;
    // with the screens and the sound (P3) 17,191 to 18,030 and 29,189 to 32,084 (the ladder the
    // seed gives moves with any change to the code before START). Since P4 the two CPUs' matches
    // stand for it.
    // 4 MHz at 60 frames: 66,667 cycles a frame (design 10.4: under 25,000 on average, 40,000 at worst).
    for (const r of [scripted, both]) {
      expect(r.avg).toBeLessThan(25_000)
      expect(r.worst).toBeLessThan(40_000)
      expect(r.line).toBeLessThanOrEqual(32)
    }
    // As measured on 2026-10-08 with the coloured boxes and the CPU (P2): the scripted match
    // against PACKET 8,230 cycles on average and 15,291 at worst over 3,104 frames, two CPUs'
    // 8,965 and 16,531 over 3,604 (P1's stand-ins: 7,505 and 15,130); 21 sprites on the busiest
    // line. The match follows the seed, which takes the cycle counter at START, so any change to
    // the code plays another: held with room, to be tightened as the phases come. With GRID's
    // raster (the floor a line at a time) on 2026-10-08: the scripted match 15,451 and 24,489
    // over 1,749 frames, two CPUs' 16,667 and 24,499 over 3,125. With the drawn fighters (P3) on
    // 2026-10-08: the scripted match 15,355 and 27,644 over 2,575 frames, two CPUs' 16,521 and
    // 30,078 over 2,460; 16 sprites on the busiest line. With the screens and the sound (P3: the
    // kit's sound ticked every frame, the fight's effects heard in the look, the wider bodies) on
    // 2026-10-08: the scripted match 16,597 and 32,696 over 2,780 frames, two CPUs' 17,430 and
    // 30,388 over 3,519; 26 sprites on the busiest line.
    // With the in-between pictures on 2026-10-08 (more pictures, so more copies into the rooms):
    // the scripted match 18,248 and 33,236.
    expect(scripted.avg).toBeLessThanOrEqual(18_600)
    expect(scripted.worst).toBeLessThanOrEqual(34_000)
    // With places rounded from the way each faces (`pointX`, a call where a shift was) and S4's
    // and DAEMON's new numbers on 2026-10-08: two CPUs' 18,822 on average and 32,667 at worst.
    // With the in-between pictures on 2026-10-08: 19,269 and 32,609. With the transitions and
    // the throw's frames on 2026-10-08: 19,860 and 31,660 (the scripted match 17,693 and 28,215).
    expect(both.avg).toBeLessThanOrEqual(20_200)
    expect(both.worst).toBeLessThanOrEqual(33_500)
  })

  it("keeps z and its speed 0 through two CPUs' whole matches", () => {
    // Before, a match of two CPUs of its own (1,500 frames); now every frame of the two that
    // cpus() plays for the rounds and the frame budget.
    expect(cpus().zMoved).toBe(0)
  })

  it('plays rounds of about half a minute CPU against CPU', () => {
    // Measured 2026-10-08: 16.4 s a round on average before (every round a KO); after the CPU
    // kept to its reach and the life went up by a quarter, 32.5 s over 36 rounds (13 to 66 s).
    // Since P4 the rounds of the two CPUs' matches the frame budget measures.
    const { rounds } = cpus()
    const avg = rounds.reduce((a, b) => a + b, 0) / rounds.length
    expect(rounds.length).toBeGreaterThanOrEqual(4)
    expect(avg, rounds.map((r) => r.toFixed(0)).join(' ')).toBeGreaterThanOrEqual(25)
    expect(avg).toBeLessThanOrEqual(50)
  })
})
