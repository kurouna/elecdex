// ELECAIRCOMBAT, ELEC-16 PLAY's cockpit dogfight (docs/elec16-elecaircombat.md): the frame's
// round, a sortie against one ace from the first frame to the last, the score, and the
// campaign of five aces with its briefings, results, continues and the best five (scenes in
// bank 2). Everything else is in the files beside this one.
import {
  addr,
  type bool,
  csrr,
  div,
  i16,
  mulShift,
  str,
  u16,
  words,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_START,
  frame_wait,
  held,
  kitInit,
  load,
  padRead,
  pressed,
  scoreAdd,
  sprBegin,
  sprShow,
} from '../lib/kit.e16'
import { soundInit, soundTick } from '../lib/sound.e16'
import { aiInit, aiNew, aiStep } from './ai.e16'
import {
  armsNew,
  flaresLeft,
  flaresStep,
  gunFiring,
  hitsOnEnemy,
  hitsOnPlayer,
  LOCK_FRAMES,
  lockT,
  missileFired,
  missileOnClear,
  missileOnPlayer,
  missilePart,
  missileStruck,
  missilesLeft,
  missilesStep,
  muzzle,
  nearMiss,
  playerFlares,
  playerGun,
  playerMissile,
  railSide,
  roundPart,
  roundsStep,
  seekerStep,
  warnDist,
  warned,
} from './arms.e16'
import {
  BITS_AT,
  BITS_BANK,
  BITS_BYTES,
  BITS_TILE,
  BLAST16_AT,
  BLAST16_BANK,
  BLAST16_BYTES,
  BLAST16_TILE,
  BLAST32_AT,
  BLAST32_BANK,
  BLAST32_BYTES,
  BLAST32_TILE,
  BURST16_AT,
  BURST16_BANK,
  BURST16_BYTES,
  BURST16_TILE,
  CLOUD8_AT,
  CLOUD8_BANK,
  CLOUD8_BYTES,
  CLOUD8_TILE,
  CLOUD16_AT,
  CLOUD16_BANK,
  CLOUD16_BYTES,
  CLOUD16_TILE,
  CLOUD32_AT,
  CLOUD32_BANK,
  CLOUD32_BYTES,
  CLOUD32_TILE,
  CLOUD64_AT,
  CLOUD64_BANK,
  CLOUD64_BYTES,
  CLOUD64_TILE,
  FLARE_AT,
  FLARE_BANK,
  FLARE_BYTES,
  FLARE_TILE,
  FONT_AT,
  FONT_BANK,
  FONT_BYTES,
  FONT_TILE,
  HORIZON_AT,
  HORIZON_BANK,
  HORIZON_BYTES,
  HORIZON_TILE,
  HUD8_AT,
  HUD8_BANK,
  HUD8_BYTES,
  HUD8_TILE,
  HUD16_AT,
  HUD16_BANK,
  HUD16_BYTES,
  HUD16_TILE,
  MUZZLE_AT,
  MUZZLE_BANK,
  MUZZLE_BYTES,
  MUZZLE_TILE,
  PAL_ACE_GANNET,
  SEEKER_AT,
  SEEKER_BANK,
  SEEKER_BYTES,
  SEEKER_TILE,
  SHOTS_AT,
  SHOTS_BANK,
  SHOTS_BYTES,
  SHOTS_TILE,
  SMOKE_AT,
  SMOKE_BANK,
  SMOKE_BYTES,
  SMOKE_TILE,
  SUN_AT,
  SUN_BANK,
  SUN_BYTES,
  SUN_TILE,
  TRAIL8_AT,
  TRAIL8_BANK,
  TRAIL8_BYTES,
  TRAIL8_TILE,
  TRAIL16_AT,
  TRAIL16_BANK,
  TRAIL16_BYTES,
  TRAIL16_TILE,
} from './assets.e16'
import {
  M_FIGHT,
  M_FINAL,
  music,
  sfxAlert,
  sfxBoom,
  sfxFlare,
  sfxGun,
  sfxHit,
  sfxHush,
  sfxLock,
  sfxMissile,
  sfxNear,
  sfxOuch,
  sfxSeek,
  sfxSplash,
} from './audio.e16'
import {
  acesInit,
  banditDraw,
  banditNew,
  banditStep,
  banditView,
  eAlive,
  eBZ,
  eHP,
  eHPMax,
  eVel,
  viewsInit,
} from './bandit.e16'
import { pAlt, playerNew, playerStep, pSpeed, worldStep } from './flight.e16'
import {
  boomAt,
  cloudsDraw,
  cloudsNew,
  cloudsStep,
  cockpitFx,
  cueGun,
  cueHurt,
  cueRail,
  fxClear,
  fxStep,
  puffAt,
  shotDown,
  sparkAt,
  sunDraw,
  sunIs,
} from './fx.e16'
import { skyDraw } from './horizon.e16'
import {
  callout,
  hudDraw,
  hudInit,
  hudLabels,
  hudNumbers,
  hudScore,
  lamps,
  partHit,
} from './hud.e16'
import { V_PF, V_PU, V_REL, vget } from './math.e16'
import {
  CSR_CYCLE,
  cockpitIn,
  cockpitTilesIn,
  flashLeft,
  flashScreen,
  flashStep,
  frameStarts,
  frameT0,
  mapsClear,
  palettesIn,
  SL_CLOUD,
  SL_ENEMY,
  SL_RED,
  SL_WHITE,
  say,
  screenOn,
  seaTurn,
  shake,
  shakeStep,
  skyInit,
  slot,
  tintSlot,
  unsay,
} from './sky.e16'

/** The frame count the runtime keeps, as `frame_wait` last answered it, and ours. */
export let seen: u16 = 0
export let frame: u16 = 0
/**
 * The player's speed (sixteenths of a unit a frame) summed towards the sea's next phase, and
 * what moves it on one: every fourth frame at cruise, sooner on the burner, later braking.
 */
let seaRun: u16 = 0
const SEA_STRIDE: u16 = 1280
/** A frame that has used more cycles than this copies no phase. */
const SEA_BUDGET: u16 = 44000
/** Set by a scene that wants the sky drawn as the frame begins. */
export let skyOn: bool = false

export function seenIs(v: u16): void {
  seen = v
}

export function skyIs(on: bool): void {
  skyOn = on
}

export function main(): void {
  kitInit()
  soundInit()
  screenOn()
  palettesIn(0)
  spritesIn()
  skyInit()
  viewsInit()
  acesInit()
  aiInit()
  hudInit()
  tableLoad()
  for (;;) {
    title()
    controls()
    campaign()
  }
}

/** Every sheet that stays into video memory (the fighter's frames are loaded as shown). */
function spritesIn(): void {
  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  load(HORIZON_BANK, HORIZON_AT, HORIZON_TILE * 32, HORIZON_BYTES)
  load(HUD8_BANK, HUD8_AT, HUD8_TILE * 32, HUD8_BYTES)
  load(HUD16_BANK, HUD16_AT, HUD16_TILE * 32, HUD16_BYTES)
  load(SEEKER_BANK, SEEKER_AT, SEEKER_TILE * 32, SEEKER_BYTES)
  load(SHOTS_BANK, SHOTS_AT, SHOTS_TILE * 32, SHOTS_BYTES)
  load(BLAST32_BANK, BLAST32_AT, BLAST32_TILE * 32, BLAST32_BYTES)
  load(BLAST16_BANK, BLAST16_AT, BLAST16_TILE * 32, BLAST16_BYTES)
  load(BITS_BANK, BITS_AT, BITS_TILE * 32, BITS_BYTES)
  load(SMOKE_BANK, SMOKE_AT, SMOKE_TILE * 32, SMOKE_BYTES)
  load(CLOUD64_BANK, CLOUD64_AT, CLOUD64_TILE * 32, CLOUD64_BYTES)
  load(CLOUD32_BANK, CLOUD32_AT, CLOUD32_TILE * 32, CLOUD32_BYTES)
  load(CLOUD16_BANK, CLOUD16_AT, CLOUD16_TILE * 32, CLOUD16_BYTES)
  load(CLOUD8_BANK, CLOUD8_AT, CLOUD8_TILE * 32, CLOUD8_BYTES)
  load(SUN_BANK, SUN_AT, SUN_TILE * 32, SUN_BYTES)
  load(FLARE_BANK, FLARE_AT, FLARE_TILE * 32, FLARE_BYTES)
  load(BURST16_BANK, BURST16_AT, BURST16_TILE * 32, BURST16_BYTES)
  load(MUZZLE_BANK, MUZZLE_AT, MUZZLE_TILE * 32, MUZZLE_BYTES)
  load(TRAIL16_BANK, TRAIL16_AT, TRAIL16_TILE * 32, TRAIL16_BYTES)
  load(TRAIL8_BANK, TRAIL8_AT, TRAIL8_TILE * 32, TRAIL8_BYTES)
}

/** A frame's start: last frame's sprites and sky shown, the shake, the pad and the sound. */
export function frameBegin(): void {
  // As the frame ends, the sea's waves move on by the player's speed (sky.e16.ts's seaTurn),
  // unless the frame has used much already: the busiest frames never pay for the copy, and
  // the waves wait a frame.
  if (skyOn) {
    seaRun = seaRun + u16(pSpeed)
    if (seaRun >= SEA_STRIDE && wrap16(csrr(CSR_CYCLE) - frameT0) <= SEA_BUDGET) {
      seaTurn()
      seaRun = seaRun - SEA_STRIDE
    }
  }
  seen = frame_wait(seen)
  frameStarts()
  sprShow()
  shakeStep()
  if (skyOn) skyDraw()
  if (flashLeft !== 0) flashStep()
  padRead()
  soundTick()
  sprBegin()
  frame++
}

/* ---------------- the score ---------------- */

/** The score and the best, two words each (tens). */
export const score = words(2)
export const best = words(2)

/** `tens` points (any number: added a piece at a time). */
export function points(tens: u16): void {
  let left = tens
  while (left > 0) {
    const n = left > 9000 ? 9000 : left
    scoreAdd(addr(score), n)
    left = left - n
  }
}

/* ---------------- a sortie ---------------- */

/** The sortie's ace (0-4) and how it went. */
export let sortie: u16 = 0
export let damage: u16 = 0
/** Frames flown, and frames left on the clock. */
export let flown: u16 = 0
export let clock: u16 = 0
/** How the sortie ended: 1 the ace down, 2 shot down, 3 into the sea, 4 out of time. */
export let outcome: u16 = 0
let endT: u16 = 0
let hitsTaken: u16 = 0

export const SORTIE_FRAMES = 10800

/** The sky's time of day for each sortie (palette rows of the skies), the cloud layer, the sun. */
function sortieSetup(k: u16): void {
  mapsClear()
  palettesIn(k)
  cloudTint(k)
  slot(PAL_ACE_GANNET + k, SL_ENEMY)
  cockpitTilesIn()
  cockpitIn()
  playerNew(5200)
  banditNew(k, 5200)
  hudLabels()
  aiNew()
  armsNew()
  fxClear()
  cloudsNew(i16(k === 2 ? 5600 : 4200))
  if (k === 4) sunIs(-1400, 3000, 600, false)
  else if (k === 3 || k === 1) sunIs(-3600, 1800, 420, true)
  else sunIs(1600, 3000, 2400, true)
  skyIs(true)
  damage = 0
  flown = 0
  clock = SORTIE_FRAMES
  outcome = 0
  endT = 0
  hitsTaken = 0
  music(k === 4 ? M_FINAL : M_FIGHT)
}

/** The clouds in the light of sortie `k`'s hour: dawn gold, storm grey, dusk rose, night dark. */
export function cloudTint(k: u16): void {
  if (k === 1) tintSlot(SL_CLOUD, 0x433f, 5)
  else if (k === 2) tintSlot(SL_CLOUD, 0x3dcd, 6)
  else if (k === 3) tintSlot(SL_CLOUD, 0x29bc, 6)
  else if (k === 4) tintSlot(SL_CLOUD, 0x1441, 11)
}

/** One sortie against ace `k`: answers how it ended. */
export function fly(k: u16): u16 {
  sortie = k
  sortieSetup(k)
  calloutT = 0
  say(13, 8, str('ENGAGE'), SL_WHITE)
  for (;;) {
    frameBegin()
    if (pressed(B_START) && outcome === 0) {
      gunSound(false)
      pause()
    }
    if (flown === 120) unsay(13, 8, 7)
    flyFrame()
    if (outcome !== 0) {
      endT++
      if (endT > 200) break
    }
  }
  skyIs(false)
  gunSound(false)
  return outcome
}

/** A frame of a sortie: everything moves, fights, scores and is drawn. */
function flyFrame(): void {
  const alive = outcome === 0 || outcome === 1
  flown++
  if (clock > 0 && outcome === 0) clock--
  playerStep(alive)
  if (!alive) gunSound(false)
  aiStep()
  banditStep()
  worldStep(eVel(0), eVel(1), eVel(2))
  banditView()
  if (alive) shoot()
  roundsStep()
  missilesStep()
  flaresStep()
  cloudsStep()
  struck()
  ending()
  sounds()
  draw()
}

function shoot(): void {
  playerGun()
  playerMissile()
  if (playerFlares()) sfxFlare()
  gunSound(held(B_A))
  if (gunFiring) cueGun(muzzle === 0)
  if (missileFired) {
    sfxMissile()
    cueRail(railSide)
  }
}

/** Whether the gun's loop is sounding: it starts and stops with the trigger, never per round. */
let gunSounding: bool = false

function gunSound(on: bool): void {
  if (on === gunSounding) return
  gunSounding = on
  sfxGun(on)
}

/** What struck what this frame: points, damage, the enemy's end. */
function struck(): void {
  if (hitsOnEnemy > 0) {
    points(3 * hitsOnEnemy)
    sfxHit()
  }
  if (missileStruck > 0) {
    points(30)
    shake(6)
  }
  if (nearMiss && outcome === 0) {
    shake(12)
    sfxNear()
  }
  if (hitsOnPlayer > 0 && outcome === 0) hurt(hitsOnPlayer * 3, roundPart)
  if (missileOnPlayer && outcome === 0) hurt(34, missilePart)
  missileOnClear()
  if (!eAlive && outcome === 0) aceDown()
  wounds()
  ownSmoke()
}

/**
 * Our own damage: smoke streaming back past the canopy from half, thick and burning once
 * shot down.
 */
function ownSmoke(): void {
  const every: u16 = outcome === 2 ? 1 : damage >= 75 ? 3 : 7
  if (damage < 50 || (frame & every) !== 0) return
  const x = mulShift(vget(V_PF), 70, 14) - mulShift(vget(V_PU), 18, 14)
  const y = mulShift(vget(V_PF + 1), 70, 14) - mulShift(vget(V_PU + 1), 18, 14)
  const z = mulShift(vget(V_PF + 2), 70, 14) - mulShift(vget(V_PU + 2), 18, 14)
  puffAt(x, y, z, 1)
  if (outcome === 2 && (frame & 3) === 0) boomAt(x, y, z)
}

/**
 * A wounded ace trails smoke, more as it is hurt: a wisp now and then below three quarters,
 * thicker below half, and thick and burning below a quarter.
 */
function wounds(): void {
  if (!eAlive || eHP * 4 > eHPMax * 3) return
  const every: u16 = eHP * 4 < eHPMax ? 3 : eHP * 2 < eHPMax ? 7 : 15
  if ((frame & every) !== 0) return
  puffAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2), 1)
  if (eHP * 4 < eHPMax && (frame & 7) === 0) sparkAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2))
}

/** A blow of `n` on part `part` of the player (the panel shows where; the damage is one). */
function hurt(n: u16, part: u16): void {
  damage = damage + n > 100 ? 100 : damage + n
  partHit(part, n)
  hitsTaken++
  cueHurt()
  sfxOuch()
  shake(n > 10 ? 24 : 8)
  flashScreen(n > 10 ? 12 : 5, 0x001f)
}

function aceDown(): void {
  outcome = 1
  shotDown(eVel(0), eVel(1))
  sfxBoom()
  sfxSplash()
  shake(28)
  flashScreen(10, 0x7fff)
  points(500 * (sortie + 1))
  unsay(13, 8, 7)
  say(12, 8, str('TARGET DESTROYED'), SL_WHITE)
  calloutT = 150
}

/** Frames the kill's callout still shows on the HUD. */
let calloutT: u16 = 0

/** Shot down, into the sea, or out of time: the sortie is lost. */
function ending(): void {
  if (outcome !== 0) return
  if (damage >= 100) lost(2, str('YOU ARE HIT'))
  else if (pAlt <= 0) lost(3, str('CRASHED'))
  else if (clock === 0) lost(4, str('TIME OVER'))
}

function lost(how: u16, words_: u16): void {
  unsay(13, 8, 7)
  outcome = how
  shake(40)
  flashScreen(16, how === 4 ? 0x7fff : 0x001f)
  sfxBoom()
  say(15, 8, words_, SL_RED)
}

/** Frames until the steady lock tone is played again; whether a tone is sounding. */
let lockToneT: u16 = 0
let toneOn: bool = false

/**
 * The seeker's tones - short ones while it tracks, rising as the lock nears, two quick ones
 * as it locks, then one steady tone, hushed when the lock is lost - and the missile alarm.
 */
function sounds(): void {
  const s = seekerStep()
  if (s === 1) {
    sfxLock(true)
    lockToneT = 4
  } else if (s === 2 && (frame & 7) === 0) sfxSeek(div(lockT * 4, LOCK_FRAMES))
  else if (s === 3) {
    if (lockToneT > 0) lockToneT--
    else {
      sfxLock(false)
      lockToneT = 15
    }
  } else if (s === 0 && toneOn) sfxHush()
  toneOn = s !== 0
  if (!warned) return
  const every: u16 = warnDist < 1500 ? 7 : warnDist < 4000 ? 15 : 31
  if ((frame & every) === 0) sfxAlert()
}

/** Front to back: the HUD, near clouds, the enemy, effects, far clouds, the sun. */
function draw(): void {
  const low = pAlt < 1200 && outcome !== 3
  if (outcome === 0 || outcome === 1) hudDraw(frame, low)
  cloudsDraw(eBZ, true)
  banditDraw()
  fxStep()
  cloudsDraw(eBZ, false)
  sunDraw()
  if (calloutT > 0) {
    calloutT--
    callout(calloutT)
  }
  cockpitFx()
  hudNumbers(damage, missilesLeft, flaresLeft, div(clock, 60))
  hudScore(score[1], score[0])
  lamps(frame, low)
}

export function hitsAgainst(): u16 {
  return hitsTaken
}

/* ---------------- the campaign ---------------- */

/** Five aces in turn; a sortie lost may be flown again while continues last. */
function campaign(): void {
  score[0] = 0
  score[1] = 0
  let k: u16 = 0
  let credits: u16 = 3
  while (k < 5) {
    const before0 = score[0]
    const before1 = score[1]
    briefing(k)
    const how = fly(k)
    if (how === 1) {
      results(k)
      k++
    } else {
      if (credits === 0 || !continueAsk(credits)) break
      credits--
      score[0] = before0
      score[1] = before1
    }
  }
  if (k === 5) ending_()
  gameOver()
}

import { tableLoad } from './best.e16'
import {
  briefing,
  continueAsk,
  controls,
  ending_,
  gameOver,
  pause,
  results,
  title,
} from './scenes.e16'
