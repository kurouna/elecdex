// ELECLANCE's ship (docs/elec16-eleclance.md sections 3 and 6): moved by the d-pad, banking as
// it goes; A taps SHOT, held becomes the LANCE; B the bomb; X or R OVERDRIVE when VOLT is full.
import { type bool, i16, mulShift, u16 } from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_DOWN,
  B_LEFT,
  B_R,
  B_RIGHT,
  B_UP,
  B_X,
  held,
  pressed,
  S16,
  spr,
} from '../lib/kit.e16'
import { FLAME_TILE, LANCE_ENDS_TILE, LANCE_TILE, SHIP_TILE } from './assets.e16'
import { burst, FX_SPARK, fx, itemsAll } from './fx.e16'
import { cancelAll, shot, target } from './shots.e16'
import { FIELD_W, FIELD_X, SL_SHIP, SL_SHOT, shake, shakeDX, shakeDY, wave } from './view.e16'

/** The ship's state. */
export const SH_ENTER = 0
export const SH_PLAY = 1
export const SH_DEAD = 2
export const SH_GONE = 3

export let shipState: u16 = SH_ENTER
export let shipX: i16 = 2560
export let shipY: i16 = 5000
/** -16 to 16: the bank, eased toward where the pad points. */
let tilt: i16 = 0
let timer: u16 = 0
/** Frames the ship cannot be hit (after coming back, while bombing). */
export let guard: u16 = 0
let holdA: u16 = 0
let cooldown: u16 = 0
let tick: u16 = 0

export let lives: u16 = 3
export let bombs: u16 = 3
/** VOLT, 0 to 1024: grazes fill it; full, OVERDRIVE may be called. */
export let volt: u16 = 0
export let overdrive: u16 = 0
export let bombing: u16 = 0
/** Whether the lance is out this tick, and where it strikes (sixteenths, its top). */
export let lancing: bool = false
let lanceTop: i16 = 0

/** Power, 0-4, from P pickups: more shots, missiles, the lance's chain, a wider bomb. */
export let power: u16 = 0
export const POWER_MAX = 4

export const VOLT_FULL = 1024
const OVERDRIVE_FRAMES = 480
const BOMB_FRAMES = 120

/** A new game: its difficulty's ships and bombs, the ship flying in. */
export function shipNew(): void {
  lives = levelLives()
  bombs = levelBombs()
  volt = 0
  overdrive = 0
  power = 0
  shipEnter()
}

/** The ship flies in from below, guarded. */
export function shipEnter(): void {
  shipState = SH_ENTER
  shipX = (FIELD_X + 112) * 16
  shipY = 5000
  tilt = 0
  timer = 0
  guard = 180
  holdA = 0
  bombing = 0
  lancing = false
}

/** One tick: answers the shot damage for the tick (2 in OVERDRIVE). */
export function shipStep(): void {
  tick++
  if (guard > 0) guard--
  if (overdrive > 0) overdrive--
  if (bombing > 0) bombStep()
  if (shipState === SH_ENTER) enterStep()
  else if (shipState === SH_PLAY) playStep()
  else if (shipState === SH_DEAD) deadStep()
  target(shipX, shipY)
}

function enterStep(): void {
  timer++
  const step: i16 = timer < 40 ? 40 : 12
  shipY = shipY - step
  if (shipY <= 3800) shipState = SH_PLAY
}

function playStep(): void {
  move()
  fire()
  if (pressed(B_B) && bombs > 0 && bombing === 0) bomb()
  if (pressed(B_X | B_R) && volt >= VOLT_FULL && overdrive === 0) {
    overdrive = OVERDRIVE_FRAMES
    volt = 0
    sfxOverdrive()
  }
}

/** The d-pad: eight ways, slower while the lance is out; the bank eases after. */
function move(): void {
  const speed: i16 = lancing ? 20 : 40
  let dx: i16 = 0
  let dy: i16 = 0
  if (held(B_LEFT)) dx = -speed
  if (held(B_RIGHT)) dx = speed
  if (held(B_UP)) dy = -speed
  if (held(B_DOWN)) dy = speed
  // Diagonals at the same speed: about 0.7 each way.
  if (dx !== 0 && dy !== 0) {
    dx = mulShift(dx, 11, 4)
    dy = mulShift(dy, 11, 4)
  }
  shipX = shipX + dx
  shipY = shipY + dy
  const left = (FIELD_X + 8) * 16
  const right = (FIELD_X + FIELD_W - 8) * 16
  if (shipX < left) shipX = left
  if (shipX > right) shipX = right
  if (shipY < 16 * 16) shipY = 16 * 16
  if (shipY > 276 * 16) shipY = 276 * 16
  let want: i16 = 0
  if (dx < 0) want = -16
  if (dx > 0) want = 16
  if (tilt < want) tilt = tilt + 2
  if (tilt > want) tilt = tilt - 2
}

/** A: tapped, shots in threes every four frames; held twelve frames, the lance. */
function fire(): void {
  if (held(B_A)) holdA++
  else holdA = 0
  lancing = holdA >= 12
  if (cooldown > 0) cooldown--
  // Missiles from power 3, with SHOT or the lance alike: every half second, at 4 twice as often.
  const every: u16 = power >= 4 ? 15 : 30
  if (holdA > 0 && power >= 3 && tick % every === 0) missilesFire(shipX, shipY)
  if (holdA === 0 || lancing || cooldown > 0) return
  cooldown = 4
  volley()
  sfxShot()
}

/**
 * A volley of shots by power: two ahead; at 1 the pair leaning out every time (before, every
 * other volley); at 2 a wider pair too.
 */
function volley(): void {
  shot(shipX - 64, shipY - 96, 0)
  shot(shipX + 64, shipY - 96, 0)
  if (power >= 1 || (tick & 4) === 0 || overdrive > 0) {
    shot(shipX - 96, shipY - 64, -1)
    shot(shipX + 96, shipY - 64, 1)
  }
  if (power >= 2) {
    shot(shipX - 128, shipY - 32, -2)
    shot(shipX + 128, shipY - 32, 2)
  }
}

/** A P picked up: a level more, or points at the top. Answers whether it was a level. */
export function powerAdd(): bool {
  if (power >= POWER_MAX) return false
  power++
  return true
}

/**
 * The bomb: a ring grows from the ship, every bullet it passes a star, every foe it passes hurt;
 * it reaches 80 points and 32 more for each power. Two seconds unhurt, the screen shaken.
 */
function bomb(): void {
  bombs--
  bombing = BOMB_FRAMES
  guard = BOMB_FRAMES
  ringStart(shipX, shipY, 80 + power * 32)
  itemsAll()
  shake(30)
  wave(90, 12)
  sfxBomb()
}

function bombStep(): void {
  bombing--
  ringStep()
}

/** Hit: the ship blows up; after a while it comes back, or the game is over. */
export function shipHit(): void {
  shipState = SH_DEAD
  timer = 0
  lancing = false
  overdrive = 0
  burst(shipX, shipY, 1)
  burst(shipX - 160, shipY + 80, 0)
  burst(shipX + 160, shipY - 80, 0)
  shake(24)
  sfxDie()
}

function deadStep(): void {
  timer++
  if (timer === 20) burst(shipX, shipY - 200, 0)
  if (timer < 90) return
  if (lives === 0) {
    shipState = SH_GONE
    return
  }
  lives--
  bombs = levelBombs()
  // A ship lost costs a level of power.
  if (power > 0) power--
  cancelAll()
  shipEnter()
}

/** Whether the ship can be hit now. */
export function shipVulnerable(): bool {
  return shipState === SH_PLAY && guard === 0
}

/**
 * The lance's reach this tick: from the nose up to what it strikes, which it hurts every other
 * frame; from power 2 a spark jumps on from what it struck (to two more at power 4).
 */
export function lanceStep(damage: u16): void {
  if (!lancing || shipState !== SH_PLAY) return
  const now: u16 = (tick & 1) === 0 ? damage : 0
  lanceTop = foeLance(shipX, shipY - 192, now)
  if (power >= 2 && lanceVictim !== 0xffff) chainFrom(lanceVictim, power >= 4 ? 2 : 1, now)
  if (lanceTop > 0 && (tick & 3) === 0) fx(FX_SPARK, shipX + i16(tick & 7) * 16 - 64, lanceTop, 0)
}

/** The ship, its flame, the lance and the bomb's ring, drawn. */
export function shipDraw(): void {
  if (shipState === SH_DEAD || shipState === SH_GONE) return
  ringDraw()
  const x = (shipX >> 4) + shakeDX()
  const y = (shipY >> 4) + shakeDY()
  // Guarded, the ship blinks.
  if (guard > 0 && bombing === 0 && (tick & 4) !== 0) return
  const pose = u16((tilt + 16 + 4) >> 3)
  spr(x - 8, y - 8, (SHIP_TILE + (pose > 4 ? 4 : pose) * 4) | ((SL_SHIP - 8) << 10), S16)
  spr(x - 8, y + 6, (FLAME_TILE + ((tick >> 1) % 3) * 4) | ((SL_SHIP - 8) << 10), S16)
  if (lancing && shipState === SH_PLAY) lanceDraw(x, y)
}

function lanceDraw(x: i16, y: i16): void {
  const pal = (SL_SHOT - 8) << 10
  const top = (lanceTop >> 4) + shakeDY()
  let at = y - 24
  let k: u16 = 0
  while (at > top - 8 && k < 18) {
    spr(x - 8, at - 8, (LANCE_TILE + ((tick + k) & 3) * 4) | pal, S16)
    at = at - 16
    k++
  }
  spr(x - 8, y - 22, (LANCE_ENDS_TILE + ((tick >> 1) & 1) * 4) | pal, S16)
  if (lanceTop > 0) spr(x - 8, top - 8, (LANCE_ENDS_TILE + 8 + ((tick >> 1) & 1) * 4) | pal, S16)
}

/** VOLT up by `n`, to full. */
export function voltAdd(n: u16): void {
  if (overdrive > 0) return
  volt = volt + n > VOLT_FULL ? VOLT_FULL : volt + n
}

/** A bomb picked up (up to five). */
export function bombsAdd(): void {
  if (bombs < 5) bombs++
}

/** An extra ship (up to five). */
export function livesAdd(): void {
  if (lives < 5) lives++
  sfxExtend()
}

import { sfxBomb, sfxDie, sfxExtend, sfxOverdrive, sfxShot } from './audio.e16'
import { foeLance, lanceVictim } from './foes.e16'
import { levelBombs, levelLives } from './level.e16'
import { chainFrom, missilesFire, ringDraw, ringStart, ringStep } from './weapons.e16'
