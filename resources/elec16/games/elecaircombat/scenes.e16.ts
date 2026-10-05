// ELECAIRCOMBAT's scenes round the sorties (docs/elec16-elecaircombat.md section 9): the title
// with an ace flying alongside, the briefing with the fighter turning on its stand, the
// results and their bonuses, the pause, the continue, the end of the campaign and the name
// for the best five. Kept in cartridge bank 2, out of RAM's room: they run seldom, and reach
// everything in RAM through far_call's return.
import {
  type bool,
  div,
  type i16,
  mulShift,
  peek16,
  str,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_DOWN,
  B_SELECT,
  B_START,
  B_UP,
  cos,
  frame_wait,
  padRead,
  palMix,
  pressed,
  randSeed,
  sin,
} from '../lib/kit.e16'
import { soundMaster } from '../lib/sound.e16'
import { aceFlares, aceMissiles } from './ai.e16'
import { roundsHit } from './arms.e16'
import { PAL_ACE_GANNET } from './assets.e16'
import { M_BRIEF, M_ENDING, M_OVER, M_TITLE, M_WIN, music, sfxSelect } from './audio.e16'
import { aceName, banditDraw, banditNew, banditShow, banditView } from './bandit.e16'
import { bestTime, stickToggle, tableEnter, tablePlace, tableShow, timeEnter } from './best.e16'
import { playerNew, stickReversed } from './flight.e16'
import { cloudsDraw, cloudsNew, cloudsStep, sunDraw, sunIs } from './fx.e16'
import {
  clock,
  cloudTint,
  damage,
  flown,
  frame,
  frameBegin,
  hitsAgainst,
  points,
  score,
  seen,
  seenIs,
  skyIs,
} from './game.e16'
import {
  orthonormal,
  rotq,
  turnWorld,
  V_EF,
  V_ER,
  V_EU,
  V_PF,
  V_PR,
  V_PU,
  V_REL,
  va,
  vcopy,
  vec,
  vget,
} from './math.e16'
import {
  cellXY,
  cockpitTilesIn,
  logoIn,
  mapsClear,
  palettesIn,
  rowsClear,
  SL_AMBER,
  SL_CLOUD,
  SL_ENEMY,
  SL_HUD_TEXT,
  SL_RED,
  SL_WHITE,
  say,
  sayChar,
  sayNumber,
  skyTint,
  slot,
  unsay,
} from './sky.e16'

/* ---------------- a calm flight behind the words ---------------- */

/** The player's view turns slowly, banking gently: the title's and the briefing's sky. */
function cruise(t: u16, turn: i16): void {
  turnWorld(V_PF, turn)
  turnWorld(V_PR, turn)
  turnWorld(V_PU, turn)
  // A slow rock of the wings.
  const a = sin(t) >> 2
  rotq(va(V_PR), va(V_PU), 16384 - (mulShift(a, a, 14) >> 1), -a)
  orthonormal(V_PF, V_PR, V_PU)
}

function sceneSky(k: u16): void {
  mapsClear()
  palettesIn(k)
  cloudTint(k)
  slot(PAL_ACE_GANNET + k, SL_ENEMY)
  playerNew(5200)
  cloudsNew(4200)
  sunIs(-3600, 1800, 420, k !== 4)
  skyIs(true)
}

/* ---------------- the title ---------------- */

export function title(): void {
  sceneSky(3)
  slot(PAL_ACE_GANNET + 3, SL_ENEMY)
  banditNew(3, 700)
  logoIn(3)
  music(M_TITLE)
  say(14, 17, str('PRESS START'), SL_AMBER)
  say(11, 19, str('BEST ACES'), SL_WHITE)
  tableShow(21)
  stickSay()
  say(10, 34, str('(C) ELECXZY PROJECT'), SL_WHITE)
  let t: u16 = 0
  for (;;) {
    frameBegin()
    cruise(t, 6)
    wingman(t)
    cloudsStep()
    cloudsDraw(32767, true)
    sunDraw()
    if ((t & 32) === 0) say(14, 17, str('PRESS START'), SL_AMBER)
    else unsay(14, 17, 11)
    if (pressed(B_SELECT)) {
      stickToggle()
      stickSay()
      sfxSelect()
    }
    if (t > 40 && pressed(B_START | B_A)) break
    t++
  }
  randSeed(frame ^ peek16(0x0202))
  sfxSelect()
  cockpitTilesIn()
}

function stickSay(): void {
  say(
    9,
    32,
    stickReversed ? str('SELECT  STICK REVERSE') : str('SELECT  STICK NORMAL '),
    SL_HUD_TEXT,
  )
}

/**
 * An ace flying alongside, ahead and to the right, rolling round its own nose now and then:
 * its place and axes set from the player's each frame.
 */
function wingman(t: u16): void {
  const s = sin(t << 1)
  let k: u16 = 0
  while (k < 3) {
    vec[V_REL + k] = u16(
      mulShift(vget(V_PF + k), 430, 14) +
        mulShift(vget(V_PR + k), 130 + (s >> 2), 14) +
        mulShift(vget(V_PU + k), 30, 14),
    )
    k++
  }
  vcopy(V_EF, V_PF)
  vcopy(V_ER, V_PR)
  vcopy(V_EU, V_PU)
  // A full roll every eight seconds or so, else a gentle bank.
  const roll = (t & 511) < 96 ? div((t & 511) * 8, 3) : 0
  const bank = u16(roll) + 12
  rotq(va(V_ER), va(V_EU), cos(bank) * 64, -sin(bank) * 64)
  banditView()
  banditDraw()
}

/* ---------------- the controls ---------------- */

/**
 * After the title: the console's buttons and the PC's keys side by side (their names differ),
 * with what each does in the cockpit, over the dimmed sky. A or START goes on; SELECT turns
 * the stick round here too, and the stick's lines follow it.
 */
export function controls(): void {
  sceneSky(3)
  dim()
  say(16, 2, str('CONTROLS'), SL_AMBER)
  say(2, 5, str('PAD'), SL_AMBER)
  say(13, 5, str('PC KEY'), SL_AMBER)
  say(25, 5, str('ACTION'), SL_AMBER)
  rule(6)
  control(8, str('D-PAD < >'), str('ARROW < >'), str('ROLL, TURN'))
  stickLines()
  control(13, str('A'), str('Z'), str('GUN (HOLD)'))
  control(14, str('B'), str('X'), str('MISSILE'))
  control(15, str('X'), str('S'), str('FLARES'))
  control(17, str('R'), str('W'), str('AFTERBURNER'))
  control(18, str('L'), str('Q'), str('AIR BRAKE'))
  control(20, str('START'), str('ENTER'), str('PAUSE'))
  control(21, str('SELECT'), str('RIGHT SHIFT'), str('STICK REVERSE'))
  rule(23)
  say(2, 25, str('LOCK ON: KEEP THE TARGET IN THE'), SL_WHITE)
  say(2, 26, str('CIRCLE, THEN B. X DECOYS MISSILES.'), SL_WHITE)
  say(2, 27, str('SLOW + PULL = STALL. LOWER THE NOSE.'), SL_WHITE)
  let t: u16 = 0
  for (;;) {
    frameBegin()
    cruise(t, 6)
    if ((t & 32) === 0) say(12, 32, str('PRESS A OR START'), SL_AMBER)
    else unsay(12, 32, 16)
    if (pressed(B_SELECT)) {
      stickToggle()
      stickLines()
      sfxSelect()
    }
    if (t > 10 && pressed(B_A | B_START)) break
    t++
  }
  sfxSelect()
  rowsClear(0, 35)
}

/** The pad's up and down as the stick is set: pulling the nose up comes first. */
function stickLines(): void {
  const up = stickReversed ? str('D-PAD UP  ') : str('D-PAD DOWN')
  const upKey = stickReversed ? str('ARROW UP  ') : str('ARROW DOWN')
  const down = stickReversed ? str('D-PAD DOWN') : str('D-PAD UP  ')
  const downKey = stickReversed ? str('ARROW DOWN') : str('ARROW UP  ')
  control(9, up, upKey, str('PULL UP'))
  control(10, down, downKey, str('PUSH DOWN'))
  say(
    2,
    29,
    stickReversed
      ? str('STICK REVERSE  (SELECT TO CHANGE)')
      : str('STICK NORMAL   (SELECT TO CHANGE)'),
    SL_HUD_TEXT,
  )
}

/** One line: the pad's button, the PC's key, what it does. */
function control(y: u16, pad: u16, key: u16, does: u16): void {
  say(2, y, pad, SL_WHITE)
  say(13, y, key, SL_HUD_TEXT)
  say(25, y, does, SL_WHITE)
}

/** A rule across the table. */
function rule(y: u16): void {
  let x: u16 = 2
  while (x < 38) {
    sayChar(x, y, 45, SL_AMBER)
    x++
  }
}

/** The sky behind words darkened, so they read over the brightest of it. */
function dim(): void {
  skyTint(0, 6)
  palMix(SL_CLOUD, 0, 5)
}

/* ---------------- the briefing ---------------- */

export function briefing(k: u16): void {
  sceneSky(k)
  dim()
  music(M_BRIEF)
  say(2, 2, str('SORTIE'), SL_AMBER)
  sayChar(9, 2, 49 + k, SL_AMBER)
  say(12, 2, operation(k), SL_WHITE)
  say(2, 4, str('TARGET  ACE'), SL_AMBER)
  say(14, 4, aceName(k), SL_RED)
  say(2, 5, str('TYPE    ARCWING'), SL_AMBER)
  say(2, 6, str('ARMS'), SL_AMBER)
  sayNumber(cellXY(10, 6), aceMissiles[k], 2, SL_WHITE)
  say(13, 6, str('MISSILES'), SL_AMBER)
  sayNumber(cellXY(22, 6), aceFlares[k], 2, SL_WHITE)
  say(25, 6, str('FLARES'), SL_AMBER)
  brief(k)
  bestSay(k)
  let t: u16 = 0
  for (;;) {
    frameBegin()
    cruise(t, 4)
    cloudsStep()
    cloudsDraw(32767, true)
    turntable(t)
    sunDraw()
    if ((t & 32) === 0) say(10, 33, str('PRESS A TO TAKE OFF'), SL_AMBER)
    else unsay(10, 33, 19)
    if (t > 30 && pressed(B_A | B_START)) break
    t++
  }
  sfxSelect()
  rowsClear(0, 35)
}

function operation(k: u16): u16 {
  if (k === 0) return str('OPERATION FIRST LIGHT')
  if (k === 1) return str('OPERATION DUNE WIND')
  if (k === 2) return str('OPERATION IRON RAIN')
  if (k === 3) return str('OPERATION LONG SHADOW')
  return str('OPERATION NIGHTFALL')
}

/** Four lines on the ace: how it fights (docs section 7). */
function brief(k: u16): void {
  if (k === 0)
    lines(
      str('A CAREFUL PILOT. IT BREAKS ONE'),
      str('WAY ONLY, AND SEES A MISSILE'),
      str('COMING HALF THE TIME. STAY ON'),
      str('ITS TAIL: GUN, OR LOCK AND B.'),
    )
  else if (k === 1)
    lines(
      str('PRESSED, SHE GOES STRAIGHT UP,'),
      str('TURNS OVER AND DIVES ON YOU.'),
      str('FAR OFF SHE CLIMBS FOR HEIGHT.'),
      str('CATCH HER SLOW AT THE TOP.'),
    )
  else if (k === 2)
    lines(
      str('A SCISSORS FIGHTER: WITH YOU'),
      str('BEHIND HE BRAKES AND REVERSES'),
      str('TO MAKE YOU OVERSHOOT. BRAKE'),
      str('TOO (L) AND STAY INSIDE HIM.'),
    )
  else if (k === 3)
    lines(
      str('SHE LOCKS FROM FURTHER THAN'),
      str('ANYONE, AND COMES BACK HEAD'),
      str('ON FOR A GUN DUEL. DROP FLARES'),
      str('(X) EARLY. DO NOT TRADE NOSES.'),
    )
  else
    lines(
      str('THE LAST ACE, IN BLACK. HE'),
      str('FEINTS ONE WAY AND BREAKS THE'),
      str('OTHER, AND IS ON YOUR TAIL THE'),
      str('MOMENT YOU OVERSHOOT. BEST OF ALL.'),
    )
}

function lines(a: u16, b: u16, c: u16, d: u16): void {
  say(4, 25, a, SL_WHITE)
  say(4, 26, b, SL_WHITE)
  say(4, 27, c, SL_WHITE)
  say(4, 28, d, SL_WHITE)
}

function bestSay(k: u16): void {
  say(4, 30, str('BEST TIME'), SL_AMBER)
  if (bestTime[k] === 0xffff) say(15, 30, str('-:--'), SL_AMBER)
  else timeSay(15, 30, bestTime[k])
}

/** A time of `frames` as m:ss. */
function timeSay(x: u16, y: u16, frames: u16): void {
  const sec = div(frames, 60)
  sayNumber(cellXY(x, y), div(sec, 60), 1, SL_AMBER)
  sayChar(x + 1, y, 58, SL_AMBER)
  sayChar(x + 2, y, 48 + div(sec % 60, 10), SL_AMBER)
  sayChar(x + 3, y, 48 + (sec % 10), SL_AMBER)
}

/** The fighter turning on its stand: tail, quarter, side, quarter, nose, and back round. */
function turntable(t: u16): void {
  const s = (t >> 4) & 7
  const view: u16 = s === 0 ? 0 : s === 4 ? 6 : s === 2 || s === 6 ? 4 : s === 1 || s === 7 ? 3 : 5
  banditShow(160, 120, view, s > 4)
}

/* ---------------- the pause ---------------- */

export function pause(): void {
  say(17, 16, str('PAUSE'), SL_AMBER)
  soundMaster(4)
  for (;;) {
    seenIs(frame_wait(seen))
    padRead()
    if (pressed(B_START)) break
  }
  soundMaster(15)
  unsay(17, 16, 5)
}

/* ---------------- the results ---------------- */

/** An ace down: the tally, the bonuses, the rank, a record kept. */
export function results(k: u16): void {
  rowsClear(0, 35)
  sceneSky(k)
  dim()
  music(M_WIN)
  say(10, 4, str('MISSION ACCOMPLISHED'), SL_AMBER)
  say(12, 6, aceName(k), SL_RED)
  say(12 + nameLen(k), 6, str(' DOWN'), SL_WHITE)
  wait(40)
  say(6, 10, str('TIME'), SL_WHITE)
  timeSay(24, 10, flown)
  if (timeEnter(k, flown)) say(29, 10, str('RECORD'), SL_RED)
  wait(20)
  say(6, 12, str('ROUNDS ON TARGET'), SL_WHITE)
  sayNumber(cellXY(24, 12), roundsHit, 4, SL_AMBER)
  wait(20)
  say(6, 14, str('DAMAGE TAKEN'), SL_WHITE)
  sayNumber(cellXY(24, 14), damage, 3, SL_AMBER)
  sayChar(27, 14, 37, SL_AMBER)
  wait(30)
  const timeBonus = div(clock, 60) * 10
  const dmgBonus = (100 - damage) * 10
  say(6, 17, str('TIME BONUS'), SL_WHITE)
  sayNumber(cellXY(22, 17), timeBonus, 5, SL_AMBER)
  sayChar(27, 17, 48, SL_AMBER)
  wait(20)
  say(6, 19, str('NO DAMAGE BONUS'), SL_WHITE)
  sayNumber(cellXY(22, 19), dmgBonus, 5, SL_AMBER)
  sayChar(27, 19, 48, SL_AMBER)
  points(timeBonus + dmgBonus)
  wait(30)
  say(6, 22, str('RANK'), SL_WHITE)
  sayChar(24, 22, rank(), SL_RED)
  say(6, 25, str('SCORE'), SL_WHITE)
  scoreSay(18, 25)
  waitPress(360)
  rowsClear(0, 35)
  skyIs(false)
}

function nameLen(k: u16): u16 {
  return k === 0 ? 6 : k === 1 ? 7 : k === 2 ? 6 : k === 3 ? 6 : 8
}

/** S, A, B or C by time left and damage taken. */
function rank(): u16 {
  const sec = div(clock, 60)
  const hits = hitsAgainst()
  if (sec > 120 && damage < 10 && hits < 4) return 83
  if (sec > 80 && damage < 40) return 65
  if (sec > 30 && damage < 75) return 66
  return 67
}

/** The score as eight digits from (x, y). */
function scoreSay(x: u16, y: u16): void {
  const hi = score[1]
  const lo = score[0]
  if (hi === 0) {
    sayNumber(cellXY(x + 4, y), lo, 4, SL_AMBER)
    sayChar(x + 8, y, 48, SL_AMBER)
    return
  }
  sayNumber(cellXY(x, y), hi, 4, SL_AMBER)
  sayChar(x + 4, y, 48 + div(lo, 1000), SL_AMBER)
  sayChar(x + 5, y, 48 + (div(lo, 100) % 10), SL_AMBER)
  sayChar(x + 6, y, 48 + (div(lo, 10) % 10), SL_AMBER)
  sayChar(x + 7, y, 48 + (lo % 10), SL_AMBER)
  sayChar(x + 8, y, 48, SL_AMBER)
}

/** `n` frames of the calm sky. */
function wait(n: u16): void {
  let t: u16 = 0
  while (t < n) {
    calmFrame(t)
    t++
  }
}

/** Up to `n` frames, or until A or START. */
function waitPress(n: u16): void {
  let t: u16 = 0
  while (t < n) {
    calmFrame(t)
    if (t > 30 && pressed(B_A | B_START)) break
    t++
  }
}

function calmFrame(_t: u16): void {
  frameBegin()
  cruise(frame, 4)
  cloudsStep()
  cloudsDraw(32767, true)
  sunDraw()
}

/* ---------------- the continue, the end ---------------- */

/** Shot down: ten seconds to press START and fly the sortie again. */
export function continueAsk(credits: u16): bool {
  rowsClear(0, 35)
  sceneSky(4)
  music(M_OVER)
  say(15, 12, str('CONTINUE?'), SL_AMBER)
  say(14, 20, str('CREDITS'), SL_WHITE)
  sayChar(22, 20, 48 + credits, SL_WHITE)
  let t: u16 = 0
  let yes = false
  while (t < 600) {
    calmFrame(t)
    sayChar(19, 15, 57 - div(t, 60), SL_RED)
    if (t > 20 && pressed(B_START | B_A)) {
      yes = true
      break
    }
    t++
  }
  rowsClear(0, 35)
  skyIs(false)
  if (yes) sfxSelect()
  return yes
}

/** Every ace down: the closing words. */
export function ending_(): void {
  rowsClear(0, 35)
  sceneSky(0)
  music(M_ENDING)
  say(13, 6, str('ALL ACES DOWN'), SL_AMBER)
  wait(60)
  say(7, 10, str('THE SKY IS QUIET AGAIN.'), SL_WHITE)
  wait(40)
  say(7, 12, str('VOLT ONE, RETURN TO BASE.'), SL_WHITE)
  wait(40)
  say(7, 16, str('GANNET  MISTRAL  CINDER'), SL_HUD_TEXT)
  say(11, 17, str('ORACLE  NOCTURNE'), SL_HUD_TEXT)
  wait(40)
  say(10, 22, str('FINAL SCORE'), SL_WHITE)
  scoreSay(14, 24)
  say(10, 34, str('(C) ELECXZY PROJECT'), SL_WHITE)
  waitPress(900)
  rowsClear(0, 35)
}

/** The campaign's end: the score, then the name if it made the best five. */
export function gameOver(): void {
  rowsClear(0, 35)
  sceneSky(4)
  music(M_OVER)
  say(15, 14, str('GAME OVER'), SL_RED)
  wait(160)
  const place = tablePlace()
  if (place < 5) nameEntry(place)
  rowsClear(0, 35)
  skyIs(false)
}

const letters = words(3)

function letterStep(k: u16, t: u16): void {
  let c = letters[k]
  if (pressed(B_UP)) c = c === 90 ? 65 : c + 1
  if (pressed(B_DOWN)) c = c === 65 ? 90 : c - 1
  letters[k] = c
  let j: u16 = 0
  while (j < 3) {
    const blink = j === k && (t & 16) !== 0
    sayChar(18 + j, 16, letters[j], blink ? SL_WHITE : SL_AMBER)
    j++
  }
}

/** Three letters with up and down and A; thirty seconds at most. */
function nameEntry(place: u16): void {
  music(M_ENDING)
  rowsClear(0, 35)
  say(12, 10, str('A NEW BEST SCORE'), SL_AMBER)
  say(12, 12, str('ENTER YOUR NAME'), SL_WHITE)
  letters[0] = 65
  letters[1] = 65
  letters[2] = 65
  let k: u16 = 0
  let t: u16 = 0
  while (k < 3 && t < 1800) {
    calmFrame(t)
    t++
    letterStep(k, t)
    if (pressed(B_A)) {
      sfxSelect()
      k++
    }
  }
  tableEnter(place, letters[0], letters[1], letters[2])
  rowsClear(0, 35)
  tableShow(12)
  wait(240)
}
