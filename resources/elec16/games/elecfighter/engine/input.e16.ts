// ELECFIGHTER's input (docs/elec16-elecfighter-design.md 6, 7.1): both fighters' buttons go in
// through one entry, `inputPut` - P1's from the pad, P2's from the CPU (or, for tests, either
// from `extHeld`) - as the buttons held and the buttons pressed, already turned into forward
// and back as seen from the opponent. A 16-frame ring keeps them; a press waits there 8 frames
// (the buffer) for a fighter that cannot act yet. L and R are never read.
import { type bool, type u16, words } from '../../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_DOWN,
  B_LEFT,
  B_RIGHT,
  B_UP,
  B_X,
  B_Y,
  padNow,
  pressed,
} from '../../lib/kit.e16'

/** A fighter's buttons, as the engine reads them. */
export const I_UP = 1
export const I_DOWN = 2
export const I_BACK = 4
export const I_FWD = 8
export const I_LP = 16
export const I_HP = 32
export const I_LK = 64
export const I_HK = 128
export const I_ATTACKS = 240

/** Where a fighter's buttons come from. */
export const C_PAD = 0
export const C_CPU = 1
export const C_EXT = 2
export const ctl = words(2)
/** The buttons held, for a fighter driven from outside (C_EXT): tests set them. */
export const extHeld = words(2)
const lastHeld = words(2)

/** The button set: 0 TYPE A (the pad's diamond), 1 TYPE B (the kicks swapped, for PC keys). */
export let buttonSet: u16 = 0
export function buttonSetIs(t: u16): void {
  buttonSet = t & 1
}

/** The rings: 16 frames of each fighter's held and pressed buttons, `ringAt` the newest. */
export const ringH = words(32)
export const ringD = words(32)
export let ringAt: u16 = 0
const BUFFER = 8

/** A new frame in the rings: nothing held or pressed until the frame's input is put. */
export function ringStep(): void {
  ringAt = (ringAt + 1) & 15
  ringH[ringAt] = 0
  ringD[ringAt] = 0
  ringH[16 + ringAt] = 0
  ringD[16 + ringAt] = 0
}

/** The ring emptied, for a new round. */
export function ringClear(): void {
  let k: u16 = 0
  while (k < 32) {
    ringH[k] = 0
    ringD[k] = 0
    k++
  }
  lastHeld[0] = 0
  lastHeld[1] = 0
}

/** The one entry (FighterInput): fighter `i`'s buttons this frame, held and newly pressed. */
export function inputPut(i: u16, held: u16, down: u16): void {
  ringH[i * 16 + ringAt] = held
  ringD[i * 16 + ringAt] = down
}

/**
 * Fighter `i`'s buttons from the pad (`faceRight` as it faces): the pad's directions turned to
 * forward and back, its four buttons by the button set. Only what the pad's map names: L, R,
 * START and SELECT are not a fighter's.
 */
export function inputPad(i: u16, faceRight: bool): void {
  const p = padNow()
  let held = padButtons(p)
  if ((p & B_LEFT) !== 0) held |= faceRight ? I_BACK : I_FWD
  if ((p & B_RIGHT) !== 0) held |= faceRight ? I_FWD : I_BACK
  inputPut(i, held, padPresses(faceRight))
  lastHeld[i] = held
}

/** The kicks' buttons in the set: B the light kick in TYPE A, the heavy in TYPE B. */
function lightKick(): u16 {
  return buttonSet === 0 ? B_B : B_A
}

function heavyKick(): u16 {
  return buttonSet === 0 ? B_A : B_B
}

/** Up, down and the four buttons held on pad `p`. */
function padButtons(p: u16): u16 {
  let held: u16 = 0
  if ((p & B_UP) !== 0) held |= I_UP
  if ((p & B_DOWN) !== 0) held |= I_DOWN
  if ((p & B_Y) !== 0) held |= I_LP
  if ((p & B_X) !== 0) held |= I_HP
  if ((p & lightKick()) !== 0) held |= I_LK
  if ((p & heavyKick()) !== 0) held |= I_HK
  return held
}

/** The pad's presses since the last read (PADHIT's too), as the engine's buttons. */
function padPresses(faceRight: bool): u16 {
  let down: u16 = 0
  if (pressed(B_LEFT)) down |= faceRight ? I_BACK : I_FWD
  if (pressed(B_RIGHT)) down |= faceRight ? I_FWD : I_BACK
  if (pressed(B_Y)) down |= I_LP
  if (pressed(B_X)) down |= I_HP
  if (pressed(lightKick())) down |= I_LK
  if (pressed(heavyKick())) down |= I_HK
  if (pressed(B_UP)) down |= I_UP
  if (pressed(B_DOWN)) down |= I_DOWN
  return down
}

/** Fighter `i`'s buttons from what is held only (the CPU, a test): a press is a new hold. */
export function inputHeld(i: u16, held: u16): void {
  inputPut(i, held, held & ~lastHeld[i])
  lastHeld[i] = held
}

/** Fighter `i`'s buttons from outside, for a test. */
export function inputExt(i: u16): void {
  inputHeld(i, extHeld[i])
}

/** No buttons for fighter `i` this frame (a banner is up, the round is over). */
export function inputNone(i: u16): void {
  inputHeld(i, 0)
}

/** What fighter `i` holds now. */
export function heldNow(i: u16): u16 {
  return ringH[i * 16 + ringAt]
}

/** The buttons of `mask` fighter `i` pressed in the last 8 frames, this one too. */
export function buffered(i: u16, mask: u16): u16 {
  let out: u16 = 0
  let k: u16 = 0
  let at = ringAt
  while (k < BUFFER) {
    out |= ringD[i * 16 + at]
    at = (at + 15) & 15
    k++
  }
  return out & mask
}

/** What fighter `i` pressed this frame. */
export function pressNow(i: u16): u16 {
  return ringD[i * 16 + ringAt]
}

/** Whether fighter `i` pressed any of `mask` in the `n` frames before this one (n under 16). */
export function pressedBefore(i: u16, mask: u16, n: u16): bool {
  let k: u16 = 1
  while (k <= n) {
    if ((ringD[i * 16 + ((ringAt - k) & 15)] & mask) !== 0) return true
    k++
  }
  return false
}

/** The presses of `mask` used: gone from the buffer. */
export function consume(i: u16, mask: u16): void {
  let k: u16 = 0
  let at = ringAt
  while (k < BUFFER) {
    ringD[i * 16 + at] &= ~mask
    at = (at + 15) & 15
    k++
  }
}
