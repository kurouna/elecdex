// ELECAIRCOMBAT's effects (docs/elec16-elecaircombat.md section 7): sparks, bursts, smoke and a
// falling wreck, set in the world so the fighter flies past them; clouds that stream by for
// speed; the sun and its flare. Each is projected through the cockpit and drawn at the size
// its distance gives.
import { type bool, div, i16, u16, words } from '../../../../src/shared/e16c/builtins'
import { rand, randBelow, S8, S16, S32, spr } from '../lib/kit.e16'
import {
  BITS_TILE,
  BLAST16_TILE,
  BLAST32_TILE,
  CLOUD8_TILE,
  CLOUD16_TILE,
  CLOUD32_TILE,
  CLOUD64_TILE,
  FLARE_TILE,
  SMOKE_TILE,
  SUN_TILE,
} from './assets.e16'
import { pAlt, pVel } from './flight.e16'
import { abs16, mulq, V_PF, V_REL, V_T0, vget, vset } from './math.e16'
import {
  abovePanel,
  bodyZ,
  CX,
  CY,
  project,
  SL_CLOUD,
  SL_FIRE,
  SL_SUN,
  scrX,
  scrY,
  toBody,
} from './sky.e16'

/* ---------------- effects in the world ---------------- */

const FX_SPARK = 1
const FX_BOOM = 2
const FX_PUFF = 3
const FX_TRAIL = 4
const FX_WRECK = 5
const FX_FLAME = 6

const XN = 20
const xKind = words(20)
const xX = words(20)
const xY = words(20)
const xZ = words(20)
const xVX = words(20)
const xVY = words(20)
const xVZ = words(20)
const xT = words(20)
let xNext: u16 = 0

export function fxClear(): void {
  let k: u16 = 0
  while (k < XN) {
    xKind[k] = 0
    k++
  }
}

/** An effect of `kind` at (x, y, z), units from the player; it stays where it is in the world. */
function fxAt(kind: u16, x: i16, y: i16, z: i16): u16 {
  const k = xNext
  xNext = xNext + 1 === XN ? 0 : xNext + 1
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

/** Smoke: a missile's trail (0) or a dark puff (1). */
export function puffAt(x: i16, y: i16, z: i16, dark: u16): void {
  fxAt(dark === 0 ? FX_TRAIL : FX_PUFF, x, y, z)
}

/**
 * The enemy shot down: bursts round it and a wreck that keeps its way, slows and falls,
 * burning and trailing smoke. (vx, vy) its velocity across, sixteenths.
 */
export function shotDown(vx: i16, vy: i16): void {
  const x = vget(V_REL)
  const y = vget(V_REL + 1)
  const z = vget(V_REL + 2)
  boomAt(x, y, z)
  boomAt(x + 40, y - 30, z + 20)
  boomAt(x - 30, y + 40, z - 20)
  const k = fxAt(FX_WRECK, x, y, z)
  xVX[k] = u16(vx >> 4)
  xVY[k] = u16(vy >> 4)
}

/** Every effect on by a frame, and drawn. */
export function fxStep(): void {
  const px = pVel(0) >> 4
  const py = pVel(1) >> 4
  const pz = pVel(2) >> 4
  let k: u16 = 0
  while (k < XN) {
    if (xKind[k] !== 0) fxOne(k, px, py, pz)
    k++
  }
}

function fxOne(k: u16, px: i16, py: i16, pz: i16): void {
  const t = xT[k] + 1
  xT[k] = t
  const kind = xKind[k]
  if (t > lifeOf(kind)) {
    xKind[k] = 0
    return
  }
  if (kind === FX_WRECK) wreckStep(k, t)
  if (kind === FX_PUFF || kind === FX_TRAIL) xVZ[k] = u16(t > 8 ? 1 : 0)
  xX[k] = u16(i16(xX[k]) + i16(xVX[k]) - px)
  xY[k] = u16(i16(xY[k]) + i16(xVY[k]) - py)
  xZ[k] = u16(i16(xZ[k]) + i16(xVZ[k]) - pz)
  // Far smoke is not worth projecting.
  const x = i16(xX[k])
  const y = i16(xY[k])
  const z = i16(xZ[k])
  if (kind !== FX_WRECK && abs16(x) + abs16(y) + abs16(z) > 4800) return
  vset(V_T0, x, y, z)
  toBody(V_T0)
  if (project() && abovePanel(scrY, 16)) fxDraw(kind, t)
}

function lifeOf(kind: u16): u16 {
  if (kind === FX_SPARK) return 9
  if (kind === FX_BOOM) return 40
  if (kind === FX_FLAME) return 24
  if (kind === FX_TRAIL) return 24
  if (kind === FX_PUFF) return 44
  return 170
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
  const z = bodyZ
  if (kind === FX_SPARK) {
    spr(scrX - 4, scrY - 4, (BITS_TILE + 4 + (t > 4 ? 1 : 0)) | fire, S8)
  } else if (kind === FX_BOOM || kind === FX_FLAME) {
    const f = kind === FX_BOOM ? t : t + 12
    boomDraw(f, z, fire)
  } else if (kind === FX_WRECK) {
    if (z < 900) spr(scrX - 8, scrY - 8, (BLAST16_TILE + 4 + ((t >> 2) & 1) * 4) | fire, S16)
    else spr(scrX - 4, scrY - 4, (BITS_TILE + 4) | fire, S8)
  } else puffDraw(kind, t, z)
}

/** A burst at frame `f` of its life (40), as large as its distance allows. */
function boomDraw(f: u16, z: i16, fire: u16): void {
  if (z < 700)
    spr(scrX - 16, scrY - 16, (BLAST32_TILE + (f >> 2 > 7 ? 7 : f >> 2) * 16) | fire, S32)
  else if (z < 2200)
    spr(scrX - 8, scrY - 8, (BLAST16_TILE + div(f > 35 ? 35 : f, 7) * 4) | fire, S16)
  else spr(scrX - 4, scrY - 4, (BITS_TILE + 4 + ((f >> 2) & 1)) | fire, S8)
}

function puffDraw(kind: u16, t: u16, z: i16): void {
  if (z > 2400) return
  const life = kind === FX_TRAIL ? 24 : 44
  const f = div(t * 4, life + 1)
  const pal = (SL_CLOUD - 8) << 10
  if (z < 1000 || kind === FX_PUFF) spr(scrX - 8, scrY - 8, (SMOKE_TILE + f * 4) | pal, S16)
  else spr(scrX - 4, scrY - 4, (CLOUD8_TILE + (t & 1)) | pal, S8)
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
    toBody(V_T0)
    if (bodyZ < -400 || abs16(i16(cX[k])) > 9000 || abs16(i16(cY[k])) > 9000) {
      cloudPlace(k, 7000 + i16(randBelow(100)) * 10)
    }
    cloudShown[k] = project() && abovePanel(scrY, 16) ? 1 : 0
    cloudSX[k] = u16(scrX)
    cloudSY[k] = u16(scrY)
    cloudZ[k] = u16(bodyZ)
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
  toBody(V_T0)
  if (!project() || !abovePanel(scrY, 16)) return
  const sx = scrX
  const sy = scrY
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
