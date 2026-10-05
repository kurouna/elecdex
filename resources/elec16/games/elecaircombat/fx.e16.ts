// ELECAIRCOMBAT's effects (docs/elec16-elecaircombat.md section 6): sparks, bursts, launches,
// smoke, debris and a falling wreck, set in the world so the fighter flies past them; clouds
// that stream by for speed; the sun and its flare. Each is projected through the cockpit and
// drawn at the size its distance gives. Then what is drawn in the cockpit's own frame: the
// gun's flash, a launch leaving its rail, sparks on the canopy.
import { asm, type bool, div, i16, u16, words } from '../../../../src/shared/e16c/builtins'
import { rand, randBelow, S8, S16, S32, spr } from '../lib/kit.e16'
import {
  BITS_TILE,
  BLAST16_TILE,
  BLAST32_TILE,
  BURST16_TILE,
  CLOUD8_TILE,
  CLOUD16_TILE,
  CLOUD32_TILE,
  CLOUD64_TILE,
  FLARE_TILE,
  MUZZLE_TILE,
  SMOKE_TILE,
  SUN_TILE,
  TRAIL8_TILE,
  TRAIL16_TILE,
} from './assets.e16'
import { pAlt, pVel } from './flight.e16'
import { abs16, bodyV, mulq, V_PF, V_REL, V_T0, vget, vset } from './math.e16'
import {
  abovePanel,
  bodyZ,
  busy,
  CX,
  CY,
  SL_CLOUD,
  SL_FIRE,
  SL_SHOT,
  SL_SUN,
  scrX,
  scrY,
  see,
} from './sky.e16'

/* ---------------- effects in the world ---------------- */

const FX_SPARK = 1
const FX_BOOM = 2
const FX_PUFF = 3
const FX_TRAIL = 4
const FX_WRECK = 5
const FX_FLAME = 6
/** A missile leaving its rail: a burst of light. */
const FX_LAUNCH = 7
/** A piece of a fighter shot down, tumbling and falling. */
const FX_DEBRIS = 8

const XN = 24
const xKind = words(24)
const xX = words(24)
const xY = words(24)
const xZ = words(24)
const xVX = words(24)
const xVY = words(24)
const xVZ = words(24)
const xT = words(24)
let xNext: u16 = 0

/**
 * A frame's cycles past which smoke is no longer drawn (it still drifts), and past which
 * sparks and pieces are not either: what a frame has left after them is kept for the rest of
 * it, so a crowded sky never costs a frame. Bursts and the wreck are always drawn.
 */
const SMOKE_BUDGET: u16 = 44000
const SPARK_BUDGET: u16 = 50000

export function fxClear(): void {
  let k: u16 = 0
  while (k < XN) {
    xKind[k] = 0
    k++
  }
  fxLife[FX_SPARK] = 9
  fxLife[FX_BOOM] = 40
  fxLife[FX_PUFF] = 44
  fxLife[FX_TRAIL] = 36
  fxLife[FX_WRECK] = 170
  fxLife[FX_FLAME] = 24
  fxLife[FX_LAUNCH] = 8
  fxLife[FX_DEBRIS] = 56
}

/** Each kind's life, frames. */
const fxLife = words(9)

/** How much an effect matters: smoke least, a burst or a wreck most (a new one never takes its slot). */
function weight(kind: u16): u16 {
  if (kind === FX_PUFF || kind === FX_TRAIL) return 0
  if (kind === FX_BOOM || kind === FX_WRECK) return 2
  return 1
}

/**
 * An effect of `kind` at (x, y, z), units from the player; it stays where it is in the world.
 * It takes the next slot that is free or holds nothing that matters more; answers the slot,
 * or XN when every one does (a puff is then not made).
 */
function fxAt(kind: u16, x: i16, y: i16, z: i16): u16 {
  const w = weight(kind)
  let tries: u16 = 0
  let k = xNext
  while (xKind[k] !== 0 && weight(xKind[k]) > w) {
    k = k + 1 === XN ? 0 : k + 1
    tries++
    if (tries === XN) return XN
  }
  xNext = k + 1 === XN ? 0 : k + 1
  xKind[k] = kind
  xX[k] = u16(x)
  xY[k] = u16(y)
  xZ[k] = u16(z)
  xVX[k] = 0
  xVY[k] = 0
  xVZ[k] = 0
  xT[k] = 0
  return k
}

export function sparkAt(x: i16, y: i16, z: i16): void {
  fxAt(
    FX_SPARK,
    x + i16(randBelow(40)) - 20,
    y + i16(randBelow(40)) - 20,
    z + i16(randBelow(40)) - 20,
  )
}

export function boomAt(x: i16, y: i16, z: i16): void {
  fxAt(FX_BOOM, x, y, z)
}

/** A missile's launch: a flash where it leaves the rail. */
export function launchAt(x: i16, y: i16, z: i16): void {
  fxAt(FX_LAUNCH, x, y, z)
}

/** Smoke: a missile's trail (0) or a dark puff (1). */
export function puffAt(x: i16, y: i16, z: i16, dark: u16): void {
  fxAt(dark === 0 ? FX_TRAIL : FX_PUFF, x, y, z)
}

/**
 * The enemy shot down: a fireball of bursts round it, pieces thrown out, and a wreck that
 * keeps its way, slows and falls, burning and trailing smoke. (vx, vy) its velocity across,
 * sixteenths.
 */
export function shotDown(vx: i16, vy: i16): void {
  const x = vget(V_REL)
  const y = vget(V_REL + 1)
  const z = vget(V_REL + 2)
  boomAt(x, y, z)
  boomAt(x + 40, y - 30, z + 20)
  boomAt(x - 30, y + 40, z - 20)
  launchAt(x, y, z)
  let n: u16 = 0
  while (n < 5) {
    const k = fxAt(FX_DEBRIS, x, y, z)
    if (k < XN) {
      xVX[k] = u16((vx >> 4) + i16(randBelow(24)) - 12)
      xVY[k] = u16((vy >> 4) + i16(randBelow(24)) - 12)
      xVZ[k] = u16(i16(randBelow(16)) - 4)
    }
    n++
  }
  const k = fxAt(FX_WRECK, x, y, z)
  if (k < XN) {
    xVX[k] = u16(vx >> 4)
    xVY[k] = u16(vy >> 4)
  }
}

/** Every effect on by a frame, and drawn. */
export function fxStep(): void {
  fxMove(pVel(0) >> 4, pVel(1) >> 4, pVel(2) >> 4)
  let k: u16 = 0
  while (k < XN) {
    if (xKind[k] !== 0) fxOne(k)
    k++
  }
}

/**
 * Every effect on by its velocity less the player's (px, py, pz: units this frame), in one
 * piece of assembly: the effects' own work below is only their ageing and drawing.
 */
function fxMove(_px: i16, _py: i16, _pz: i16): void {
  asm`
    li t3, 0
.mv_k:
    lw t0, xKind(t3)
    beqz t0, .mv_skip
    lw t0, xX(t3)
    lw t1, xVX(t3)
    add t0, t0, t1
    sub t0, t0, a0
    sw t0, xX(t3)
    lw t0, xY(t3)
    lw t1, xVY(t3)
    add t0, t0, t1
    sub t0, t0, a1
    sw t0, xY(t3)
    lw t0, xZ(t3)
    lw t1, xVZ(t3)
    add t0, t0, t1
    sub t0, t0, a2
    sw t0, xZ(t3)
.mv_skip:
    addi t3, t3, 2
    li t0, 48
    blt t3, t0, .mv_k
  `
}

function fxOne(k: u16): void {
  const t = xT[k] + 1
  xT[k] = t
  const kind = xKind[k]
  if (t > fxLife[kind]) {
    xKind[k] = 0
    return
  }
  fxAge(k, kind, t)
  // Smoke once the frame has had its share is not drawn, nor far smoke; sparks and pieces
  // not once the frame is nearly spent.
  const w = weight(kind)
  if (w === 0 && busy() > SMOKE_BUDGET) return
  if (w === 1 && busy() > SPARK_BUDGET) return
  if (fxFar(k, kind, w)) return
  vset(V_T0, i16(xX[k]), i16(xY[k]), i16(xZ[k]))
  if (see(V_T0) && abovePanel(scrY(), 16)) fxDraw(kind, t)
}

/** What a frame does to an effect's way: the wreck's fall, a piece's, smoke's slow rise. */
function fxAge(k: u16, kind: u16, t: u16): void {
  if (kind === FX_WRECK) wreckStep(k, t)
  else if (kind === FX_DEBRIS && (t & 3) === 0) xVZ[k] = u16(i16(xVZ[k]) - 1)
  else if (kind === FX_PUFF || kind === FX_TRAIL) xVZ[k] = u16(t > 8 ? 1 : 0)
}

/** Whether effect `k` (of weight `w`) is too far off to be worth projecting. */
function fxFar(k: u16, kind: u16, w: u16): bool {
  const x = i16(xX[k])
  const y = i16(xY[k])
  const z = i16(xZ[k])
  const ax = x < 0 ? -x : x
  const ay = y < 0 ? -y : y
  const az = z < 0 ? -z : z
  if (kind !== FX_WRECK && (ax > 9000 || ay > 9000 || az > 9000)) return true
  return w === 0 && ax + ay + az > 5600
}

/** The wreck slows, falls faster, burns, and smokes. */
function wreckStep(k: u16, t: u16): void {
  if ((t & 3) === 0) {
    xVX[k] = u16(i16(xVX[k]) - (i16(xVX[k]) >> 3))
    xVY[k] = u16(i16(xVY[k]) - (i16(xVY[k]) >> 3))
    xVZ[k] = u16(i16(xVZ[k]) - 1)
  }
  const x = i16(xX[k])
  const y = i16(xY[k])
  const z = i16(xZ[k])
  if ((t & 3) === 1) fxAt(FX_PUFF, x, y, z + 10)
  if ((t & 7) === 2 && t < 120) fxAt(FX_FLAME, x + i16(randBelow(30)) - 15, y, z)
}

/** An effect drawn by how far it is (bodyZ): near ones large. */
function fxDraw(kind: u16, t: u16): void {
  const fire = (SL_FIRE - 8) << 10
  const z = bodyZ()
  if (kind === FX_BOOM || kind === FX_FLAME) boomDraw(kind === FX_BOOM ? t : t + 12, z, fire)
  else if (kind === FX_WRECK) wreckDraw(t, z, fire)
  else if (kind === FX_PUFF || kind === FX_TRAIL) puffDraw(kind, t, z)
  else smallDraw(kind, t, fire)
}

/** A spark, a launch's flash or a piece: the same size at any distance. */
function smallDraw(kind: u16, t: u16, fire: u16): void {
  if (kind === FX_SPARK) {
    spr(scrX() - 4, scrY() - 4, (BITS_TILE + 4 + (t > 4 ? 1 : 0)) | fire, S8)
  } else if (kind === FX_LAUNCH) {
    const f: u16 = t > 5 ? 8 : t > 2 ? 4 : 0
    spr(scrX() - 8, scrY() - 8, (BURST16_TILE + f) | fire, S16)
  } else spr(scrX() - 4, scrY() - 4, (BITS_TILE + ((t >> 1) & 3)) | fire, S8)
}

function wreckDraw(t: u16, z: i16, fire: u16): void {
  if (z < 900) spr(scrX() - 8, scrY() - 8, (BLAST16_TILE + 4 + ((t >> 2) & 1) * 4) | fire, S16)
  else spr(scrX() - 4, scrY() - 4, (BITS_TILE + 4) | fire, S8)
}

/**
 * A burst at frame `f` of its life (40), as large as its distance allows - and never smaller
 * than a flash of 16 points while it is young, so one far off still reads.
 */
function boomDraw(f: u16, z: i16, fire: u16): void {
  const x = scrX()
  const y = scrY()
  if (f < 3) spr(x - 8, y - 8, (BURST16_TILE + f * 4) | fire, S16)
  if (z < 1000) spr(x - 16, y - 16, (BLAST32_TILE + (f >> 2 > 7 ? 7 : f >> 2) * 16) | fire, S32)
  else if (z < 4000 || f < 16) {
    spr(x - 8, y - 8, (BLAST16_TILE + div(f > 35 ? 35 : f, 7) * 4) | fire, S16)
  } else spr(x - 4, y - 4, (BITS_TILE + 4 + ((f >> 2) & 1)) | fire, S8)
}

/** Smoke: a dark puff of 16 points, thinning as it ages; or a missile's white trail. */
function puffDraw(kind: u16, t: u16, z: i16): void {
  const pal = (SL_CLOUD - 8) << 10
  if (kind === FX_TRAIL) trailDraw(t, z, pal)
  else if (z < 2400) spr(scrX() - 8, scrY() - 8, (SMOKE_TILE + div(t * 4, 45) * 4) | pal, S16)
}

/** A puff of a missile's trail: white, as large as its distance gives, smaller as it ages. */
function trailDraw(t: u16, z: i16, pal: u16): void {
  const old: u16 = t > 26 ? 1 : 0
  if (z < 700) spr(scrX() - 8, scrY() - 8, (TRAIL16_TILE + old * 4) | pal, S16)
  else if (z < 1500 && old === 0) spr(scrX() - 8, scrY() - 8, (TRAIL16_TILE + 4) | pal, S16)
  else {
    const f: u16 = (z < 2600 ? 0 : z < 4000 ? 1 : 2) + old
    spr(scrX() - 4, scrY() - 4, (TRAIL8_TILE + f) | pal, S8)
  }
}

/* ---------------- in the cockpit ---------------- */

/** Frames the gun's flash, a launch's flash and the canopy's sparks still show. */
let gunFlashT: u16 = 0
let gunRight: bool = false
let railT: u16 = 0
let railX: i16 = 0
let hurtT: u16 = 0

/** The gun fired, from the right of the nose or the left. */
export function cueGun(right: bool): void {
  gunFlashT = 2
  gunRight = right
}

/** A missile left its rail, on `side` (positive the right). */
export function cueRail(side: i16): void {
  railT = 6
  railX = side > 0 ? 84 : -84
}

/** The fighter was hit. */
export function cueHurt(): void {
  hurtT = 6
}

/**
 * What is drawn in the cockpit's own frame, not the world's: the gun's flash low on the nose,
 * a missile's flash leaving its rail, sparks across the canopy when the fighter is hit.
 */
export function cockpitFx(): void {
  const shot = (SL_SHOT - 8) << 10
  const fire = (SL_FIRE - 8) << 10
  if (gunFlashT > 0) {
    gunFlashT--
    spr(gunRight ? CX + 14 : CX - 30, 189, (MUZZLE_TILE + (rand() & 4)) | shot, S16)
  }
  if (railT > 0) {
    railT--
    const f: u16 = railT > 3 ? 0 : railT > 1 ? 4 : 8
    spr(i16(CX) + railX - 8, 184 + i16(6 - railT) * 2, (BURST16_TILE + f) | fire, S16)
  }
  if (hurtT > 0) {
    hurtT--
    let n: u16 = 0
    while (n < 3) {
      const x = i16(randBelow(240)) + 40
      const y = i16(randBelow(160)) + 24
      spr(x - 4, y - 4, (BITS_TILE + 4 + (rand() & 1)) | fire, S8)
      n++
    }
  }
}

/* ---------------- clouds ---------------- */

const CN = 6
const cX = words(8)
const cY = words(8)
const cZ = words(8)
const cKind = words(8)
/** The cloud layer's height (world), units. */
export let cloudLayer: i16 = 4200

/** Clouds about the player at the start of a sortie. */
export function cloudsNew(layer: i16): void {
  cloudLayer = layer
  let k: u16 = 0
  while (k < CN) {
    cloudPlace(k, i16(randBelow(250)) * 24 - 3000)
    k++
  }
}

/** Cloud `k` placed `ahead` units along the player's way (across the world, level), a little aside. */
function cloudPlace(k: u16, ahead: i16): void {
  const fx = vget(V_PF)
  const fy = vget(V_PF + 1)
  const side = i16(randBelow(250)) * 24 - 3000
  cX[k] = u16(mulq(fx, ahead) + mulq(fy, side))
  cY[k] = u16(mulq(fy, ahead) - mulq(fx, side))
  cZ[k] = u16(cloudLayer - pAlt + i16(randBelow(200)) * 3 - 300)
  cKind[k] = rand() & 7
}

/** The clouds on by a frame: those passed or too far are placed again ahead. */
export function cloudsStep(): void {
  const px = pVel(0) >> 4
  const py = pVel(1) >> 4
  const pz = pVel(2) >> 4
  let k: u16 = 0
  while (k < CN) {
    cX[k] = u16(i16(cX[k]) - px)
    cY[k] = u16(i16(cY[k]) - py)
    cZ[k] = u16(i16(cZ[k]) - pz)
    vset(V_T0, i16(cX[k]), i16(cY[k]), i16(cZ[k]))
    cloudShown[k] = see(V_T0) && abovePanel(scrY(), 16) ? 1 : 0
    cloudSX[k] = bodyV[3]
    cloudSY[k] = bodyV[4]
    cloudZ[k] = bodyV[2]
    if (bodyZ() < -400 || abs16(i16(cX[k])) > 9000 || abs16(i16(cY[k])) > 9000) {
      cloudPlace(k, 7000 + i16(randBelow(100)) * 10)
      cloudShown[k] = 0
    }
    k++
  }
}

const cloudShown = words(8)
const cloudSX = words(8)
const cloudSY = words(8)
const cloudZ = words(8)

/** The clouds nearer than `zNear` (units ahead) drawn, or the farther ones (`near` false). */
export function cloudsDraw(zNear: i16, near: bool): void {
  let k: u16 = 0
  while (k < CN) {
    const z = i16(cloudZ[k])
    if (cloudShown[k] !== 0 && z < zNear === near) cloudDraw(k, z)
    k++
  }
}

function cloudDraw(k: u16, z: i16): void {
  const x = i16(cloudSX[k])
  const y = i16(cloudSY[k])
  const pal = (SL_CLOUD - 8) << 10
  const v = cKind[k] & 1
  if (z < 900) {
    const t = CLOUD64_TILE + v * 32
    spr(x - 32, y - 16, t | pal, S32)
    spr(x, y - 16, (t + 16) | pal, S32)
  } else if (z < 1900) spr(x - 16, y - 16, (CLOUD32_TILE + v * 16) | pal, S32)
  else if (z < 3800) spr(x - 8, y - 8, (CLOUD16_TILE + v * 4) | pal, S16)
  else spr(x - 4, y - 4, (CLOUD8_TILE + v) | pal, S8)
}

/* ---------------- the sun ---------------- */

/** The sun's direction in the world (Q14 >> 2: a far point), and whether it shines. */
let sunX: i16 = 0
let sunY: i16 = 0
let sunZ: i16 = 0
let sunOn: bool = true

export function sunIs(x: i16, y: i16, z: i16, on: bool): void {
  sunX = x
  sunY = y
  sunZ = z
  sunOn = on
}

/** The sun and, when it is on the screen, its flare: ghosts on the line through the centre. */
export function sunDraw(): void {
  if (!sunOn) return
  vset(V_T0, sunX, sunY, sunZ)
  if (!see(V_T0) || !abovePanel(scrY(), 16)) return
  const sx = scrX()
  const sy = scrY()
  spr(sx - 16, sy - 16, SUN_TILE | ((SL_SUN - 8) << 10), S32)
  // The flare only while the sun itself is in the glass, not behind the frame.
  if (sy < 16 || sy > 196 || sx < 30 || sx > 290) return
  const dx = i16(CX) - sx
  const dy = i16(CY) - sy
  ghost(sx + dx - (dx >> 2), sy + dy - (dy >> 2), 0)
  ghost(sx + dx + (dx >> 1), sy + dy + (dy >> 1), 1)
  ghost(sx + (dx >> 1) + dx, sy + (dy >> 1) + dy, 2)
  ghost(sx + dx * 2, sy + dy * 2, 1)
}

function ghost(x: i16, y: i16, k: u16): void {
  if (!abovePanel(y, 8)) return
  spr(x - 8, y - 8, (FLARE_TILE + k * 4) | ((SL_SUN - 8) << 10), S16)
}
