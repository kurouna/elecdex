// ELECFIGHTER's stand-in CPU (docs/elec16-elecfighter-design.md 14, P1): until the real one
// (7.10) comes in P2, an opponent that walks in to its reach and, every few frames, presses a
// normal, holds back or jumps in, by chance and its row of cpu/opponents.txt. It plays through
// the fighters' one entry (input.e16.ts), as a person does: buttons held, a press their first
// frame. In bank 2: once a frame.
import { u16, words } from '../../../../../src/shared/e16c/builtins'
import { randBelow } from '../../lib/kit.e16'
import { O_ATTACK, O_GUARD, O_JUMP, O_REACH, O_THINK, opp } from '../engine/data.e16'
import { fX } from '../engine/fighter.e16'
import { I_ATTACKS, I_BACK, I_DOWN, I_FWD, I_LP, I_UP } from '../engine/input.e16'

/** Frames each CPU fighter keeps its choice, and what it goes on holding. */
const cpuT = words(2)
const cpuKeep = words(2)

/** Fighter `i`'s buttons this frame, the CPU's. */
export function cpuThink(i: u16): u16 {
  if (cpuT[i] > 0) {
    cpuT[i]--
    return cpuKeep[i]
  }
  cpuT[i] = opp[O_THINK] + randBelow(8)
  const held = cpuChoose(i)
  // A button and a jump are pressed once; walking and guarding go on.
  cpuKeep[i] = held & ~(I_ATTACKS | I_UP)
  return held
}

function cpuChoose(i: u16): u16 {
  const a = fX[i] >> 4
  const b = fX[1 - i] >> 4
  const dist = a > b ? a - b : b - a
  const r = randBelow(256)
  const attack = opp[O_ATTACK]
  const guard = attack + opp[O_GUARD]
  const jump = guard + opp[O_JUMP]
  if (dist > opp[O_REACH] + 8) return r < opp[O_JUMP] ? I_UP | I_FWD : I_FWD
  if (r < attack) return u16(I_LP << randBelow(4)) | (randBelow(3) === 0 ? I_DOWN : 0)
  if (r < guard) return I_BACK | (randBelow(2) === 0 ? I_DOWN : 0)
  if (r < jump) return I_UP | I_FWD
  return 0
}
