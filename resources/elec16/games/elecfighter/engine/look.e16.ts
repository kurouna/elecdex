// ELECFIGHTER's look (docs/elec16-elecfighter-design.md 2.3, 2.4, 10.2): each frame's sprites -
// the effects in front, the fighters from their rooms (the cells of their pose, laid by the pose's
// places, mirrored with FLIP_H when facing left), a KO's pieces, the shadows behind - and the
// fighters' palettes, the only way a fighter changes colour: drawn in from the void as a round
// begins, white for a hit, blue-white behind a hexagonal firewall for a guard, magenta while
// thrown, the wire blinking under a quarter of the life, and at a KO the fill gone to the void
// before the body breaks into triangles of its own mesh - cut from the pose it breaks in - that
// fly apart both ways and fade. The fight's sounds are heard here too, from what the frame did
// (design 9: engine/audio.e16.ts's effects, by event, never by slot). In bank 4: entered once
// a frame (`lookStep`), calling the kit and the RAM tables.
import { type bool, i16, idiv, u16, words, wrap16 } from '../../../../../src/shared/e16c/builtins'
import { colour, FLIP_H, mix, palCopy, S16, S32, spr, sprBegin } from '../../lib/kit.e16'
import {
  FRAMES_AT,
  FRAMES_BANK,
  S1_TILE,
  SHADOW_TILE,
  SPARK_TILE,
  THROWS_AT,
  THROWS_BANK,
  THROWS_LEN,
  TRANS_AT,
  TRANS_BANK,
} from '../assets.e16'
import {
  sfx,
  X_DASH,
  X_DOWN,
  X_FIGHT,
  X_GUARD,
  X_HEAVY,
  X_KO,
  X_LAND,
  X_LIGHT,
  X_MAT,
  X_ROUND,
  X_SHARDS,
  X_THROW,
  X_TIME,
  X_WHIFF,
} from './audio.e16'
import {
  ART_W,
  art,
  artCopy,
  artHold,
  artPic,
  boxPose,
  groundY,
  K_HEAVY,
  M_KIND,
  M_STARTUP,
  MV_THROW,
  mvAt,
  P_LIFE,
  POSE_W,
  prAt,
  SHARDS_AIR,
  SHARDS_ROW,
  slPosesA,
  slPosesB,
  tableWord,
} from './data.e16'
import { camX } from './draw.e16'
import {
  fAir,
  faceSign,
  fFace,
  fLife,
  fMove,
  fMoveF,
  fPose,
  fRowT,
  fRowWas,
  fSlot,
  fState,
  fStateT,
  fThrowBack,
  fWin,
  fY,
  half,
  PO_DOWN,
  PO_WALK,
  pointX,
  RING_L,
  RING_R,
  ST_ATTACK,
  ST_BACKDASH,
  ST_DASH,
  ST_DOWN,
  ST_LAND,
  ST_THROW,
  ST_THROWN,
} from './fighter.e16'
import { struck, threw, wb } from './hit.e16'
import {
  frame,
  PH_END,
  PH_FIGHT,
  PH_OVER,
  PH_ROUND,
  phase,
  phaseT,
  roundWon,
  timeLeft,
} from './main.e16'

/** Sprites' palette fields: P1 slot 8, P2 slot 9, the effects and shadows slot 10. */
const FX_PAL = 2 << 10

/** One frame's look: the palettes, then the sprites. */
export function lookStep(): void {
  eventsTake(0)
  eventsTake(1)
  koStep(0)
  koStep(1)
  picStep(0)
  picStep(1)
  soundStep()
  palStep(0)
  palStep(1)
  sprBegin()
  fxSprites(0)
  fxSprites(1)
  const front = fState[1] === ST_ATTACK && fState[0] !== ST_ATTACK ? 1 : 0
  bodySprites(front)
  bodySprites(1 - front)
  shadow(0)
  shadow(1)
}

/* ---------------- the frame's strikes: sparks, firewalls, flashes ---------------- */

/**
 * Each striker's effect: 0 none, 1 the spark, 2 the firewall; its frames, where (world x, screen
 * y).
 */
const fxK = words(2)
const fxT = words(2)
const fxX = words(2)
const fxY = words(2)
/** Frames of a hit's flash and a guard's blue-white left on each fighter. */
const flashT = words(2)
const guardT = words(2)
const SPARK_F = 9
const WALL_F = 8
const FLASH_F = 3
const GUARD_F = 2

/** Each fighter's strikes that hit this match (the result's HITS): the match clears them. */
export const hitsN = words(2)

/** What fighter `a`'s strike did this frame, seen as the frame ends. */
function eventsTake(a: u16): void {
  if (flashT[a] > 0) flashT[a]--
  if (guardT[a] > 0) guardT[a]--
  if (fxK[a] !== 0) {
    fxT[a]++
    if (fxT[a] >= (fxK[a] === 1 ? SPARK_F : WALL_F)) fxK[a] = 0
  }
  const s = struck[a]
  if (s === 0) return
  const d = 1 - a
  if (s === 1 || s === 3) hitsN[a]++
  if (s === 2) {
    guardT[d] = GUARD_F
    fxAt(a, 2)
    return
  }
  flashT[d] = FLASH_F
  if (s !== 4) fxAt(a, 1)
}

/** An effect where fighter `a`'s hit box strikes: its front end, half way up. */
function fxAt(a: u16, k: u16): void {
  // The first hit box: box 4 of the pose's six, four words each.
  const o = a * POSE_W + 4 * 4
  const right = fFace[a] !== 0
  fxK[a] = k
  fxT[a] = 0
  fxX[a] = u16(right ? i16(wb[o + 1]) - 6 : i16(wb[o]) + 6)
  fxY[a] = u16(i16(groundY) - ((i16(wb[o + 2]) + i16(wb[o + 3])) >> 1))
}

function fxSprites(a: u16): void {
  if (fxK[a] === 0) return
  const t = fxT[a]
  let f: u16 = 0
  if (fxK[a] === 1) f = t < 3 ? 0 : t < 6 ? 1 : 2
  else f = t < 4 ? 3 : 4
  spr(i16(fxX[a]) - i16(camX) - 16, i16(fxY[a]) - 16, (SPARK_TILE + f * 16) | FX_PAL, S32)
}

/* ---------------- the fighters ---------------- */

/**
 * Fighter `i`'s picture for this frame (design 2.5): its pose row's pictures in turn, as
 * fighters/frames.txt has them - a row of SEQ_W words, the clock's kind, four pairs of an art
 * row and the clock it shows until, then where the row's transitions are. The clock is the
 * frames the fighter has been in the row, or, for a walk's step, the points walked into it
 * (counted the way it faces, rounded back as `pointX` is, so a mirrored walk steps alike and
 * walking back plays the step backwards). The row's first frames may show other pictures, by the
 * row it came from (fighters/transitions.txt); a throw's both fighters show the throw's, frame
 * by frame (fighters/throws.txt). A row entered after this frame's pose was set (a strike's, a
 * landing's: its clock 0xffff) begins next frame: until then, through a hitstop too, the picture
 * showing holds. A new picture is copied into its room as the next frame begins; none while its
 * pieces are held.
 */
const SEQ_W = 10
const SEQ_PICS = 4
/** frames.txt's word of a row's transitions: the first entry | the count << 8. */
const SEQ_TRANS = 9
/** A transition's entry: the rows from (first | last << 8), two pictures (art row | until << 8). */
const TRANS_W = 3
/** Every transition is over by this frame of its row; art row 255 is none. */
const TRANS_MOST = 16
const NO_PIC = 255
/**
 * A throw frame's words (thrower, thrown, share | off << 8, up); its frames each way are as
 * many as the table holds (`throwWord`: the thrower's frames till it is free, hit.e16.ts THROW_F).
 */
const THROW_W = 4
function picStep(i: u16): void {
  if (artHold[i] !== 0) return
  const st = fState[i]
  let pic: u16 = 0
  if (st === ST_THROW || st === ST_THROWN) pic = throwWord(i, st === ST_THROW ? 0 : 1) & 255
  else {
    if (fRowT[i] === 0xffff) return
    pic = rowPic(i)
  }
  if (pic === artPic[i]) return
  artPic[i] = pic
  artCopy(i, fSlot[i], pic)
}

/**
 * The picture of fighter `i`'s row by its clock: a transition's first, else the row's own. A
 * walk's step is the place's now, as its clock is: the pose was chosen before this frame's move,
 * and a step's last picture then showed the step's first again (8 points a step, as
 * fighter.e16.ts `standPose` counts them).
 */
function rowPic(i: u16): u16 {
  let row = fPose[i] * SEQ_W
  let t = fRowT[i]
  if (t < TRANS_MOST) {
    const p = transPic(i, row, t)
    if (p !== NO_PIC) return p
  }
  if (tableWord(FRAMES_BANK, FRAMES_AT, row) !== 0) {
    const d = fFace[i] !== 0 ? pointX(i) : wrap16(0 - pointX(i))
    t = d & 7
    row = (PO_WALK + ((d >> 3) & 3)) * SEQ_W
  }
  let k: u16 = 0
  while (k < SEQ_PICS - 1 && t >= tableWord(FRAMES_BANK, FRAMES_AT, row + 2 + k * 2)) k++
  return tableWord(FRAMES_BANK, FRAMES_AT, row + 1 + k * 2)
}

/**
 * The transition's picture `t` frames into the row (at `row` of frames.txt) fighter `i` came to
 * from `fRowWas`: the first of the row's entries whose rows hold that one, while its ends last.
 */
function transPic(i: u16, row: u16, t: u16): u16 {
  const w = tableWord(FRAMES_BANK, FRAMES_AT, row + SEQ_TRANS)
  let k = w & 255
  const end = k + (w >> 8)
  const was = fRowWas[i]
  while (k < end) {
    const from = tableWord(TRANS_BANK, TRANS_AT, k * TRANS_W)
    if (was >= (from & 255) && was <= from >> 8) {
      const a = tableWord(TRANS_BANK, TRANS_AT, k * TRANS_W + 1)
      if (t < a >> 8) return a & 255
      const b = tableWord(TRANS_BANK, TRANS_AT, k * TRANS_W + 2)
      return t < b >> 8 ? b & 255 : NO_PIC
    }
    k++
  }
  return NO_PIC
}

/**
 * Word `w` of the throw's frame fighter `i` is in, thrower or thrown (design 7.9): by the
 * thrower's frames since it took hold, forward or back.
 */
function throwWord(i: u16, w: u16): u16 {
  const a = fState[i] === ST_THROW ? i : 1 - i
  const n = THROWS_LEN >> 3
  const k = fStateT[a] < n ? fStateT[a] : n - 1
  return tableWord(THROWS_BANK, THROWS_AT, (fThrowBack[a] * n + k) * THROW_W + w)
}

/**
 * Where held fighter `d` is drawn, in world points: from the thrower by the throw's share of
 * the way (their places are still till the slam) and its points more, ahead of the thrower as
 * it faces. A share from 16 to 0 is the way from where the held one stands to the thrower; one
 * below 0 the way from the thrower to where the slam will land it (`landX`), -16 there.
 */
function heldX(d: u16): i16 {
  const a = 1 - d
  const xa = i16(pointX(a))
  const w = throwWord(d, 2)
  const s = lowOf(w)
  const to = s < 0 ? landX(d) : i16(pointX(d))
  return xa + idiv((to - xa) * (s < 0 ? -s : s), 16) + faceSign(a) * highOf(w)
}

/**
 * Where the slam will put held fighter `d`, in world points, as the engine will (drawing only:
 * hit.e16.ts `slam`, then fighter.e16.ts `wall` and `bodies`): a back throw's mirror of its
 * place about the thrower, kept inside the ring by its down pose's body and parted from the
 * thrower - so at a wall a back throw may land it in front. Its push after is left out.
 */
function landX(d: u16): i16 {
  const a = 1 - d
  const xa = i16(pointX(a))
  let x = i16(pointX(d))
  if (fThrowBack[a] !== 0) x = xa * 2 - x
  const s = fSlot[d]
  const hd = i16(tableWord(slPosesB[s], slPosesA[s], PO_DOWN * POSE_W + 2) >> 1)
  const ha = i16(half(a))
  x = inRing(x, hd)
  // Which is on the left as `bodies` sees it: by place, then by the way each faces.
  const dLeft = x !== xa ? x < xa : (fFace[1] !== 0 && fFace[0] === 0 ? 1 : 0) === d
  const reach = ha + hd
  const gap = dLeft ? xa - x : x - xa
  if (gap >= reach) return x
  const each = (reach - gap + 1) >> 1
  const hl = dLeft ? hd : ha
  const hr = dLeft ? ha : hd
  let xl = inRing((dLeft ? x : xa) - each, hl)
  let xr = inRing((dLeft ? xa : x) + each, hr)
  const left = reach - (xr - xl)
  if (left > 0) {
    if (xl <= i16(RING_L) + hl) xr = xr + left
    else xl = xl - left
  }
  return dLeft ? xl : xr
}

/** Place `x` kept inside the ring for a body of half `h`. */
function inRing(x: i16, h: i16): i16 {
  const lo = i16(RING_L) + h
  const hi = i16(RING_R) - h
  return x < lo ? lo : x > hi ? hi : x
}

/**
 * Whether thrower `a`'s throw puts the other behind it: where the slam will land it while it
 * is held, where it is after.
 */
function landsBehind(a: u16): bool {
  const d = 1 - a
  const x = fState[d] === ST_THROWN ? landX(d) : i16(pointX(d))
  return faceSign(a) * (x - i16(pointX(a))) < 0
}

/** Signed places of a cell from its packed word. */
function lowOf(w: u16): i16 {
  const v = i16(w & 255)
  return v > 127 ? v - 256 : v
}

function highOf(w: u16): i16 {
  const v = i16(w >> 8)
  return v > 127 ? v - 256 : v
}

/** Fighter `i`'s cells from its room, or its pieces once it has broken. */
function bodySprites(i: u16): void {
  if (shOn[i] !== 0) {
    shardSprites(i)
    return
  }
  let x = i16(pointX(i)) - i16(camX)
  let y = i16(groundY) - i16(fY[i] >> 4)
  let right = fFace[i] !== 0
  const st = fState[i]
  if (st === ST_THROW || st === ST_THROWN) {
    // Held, drawn where the throw carries it; either drawn turned about where the throw says,
    // the thrower only when the other lands behind it (a back throw at a wall lands in front).
    const turned = (throwWord(i, st === ST_THROW ? 0 : 1) & 256) !== 0
    if (turned && (st === ST_THROWN || landsBehind(i))) right = !right
    if (st === ST_THROWN) {
      x = heldX(i) - i16(camX)
      y = i16(groundY) - i16(throwWord(i, 3))
    }
  }
  const tile = (S1_TILE + i * 128) | (i << 10) | (right ? 0 : FLIP_H)
  const n = art[i * ART_W + 1]
  let c: u16 = 0
  while (c < n) {
    const w = art[i * ART_W + 2 + c]
    const dx = lowOf(w)
    spr(right ? x + dx : x - dx - 16, y + highOf(w), tile + c * 4, S16)
    c++
  }
}

/**
 * The shadow on the floor under fighter `i`, narrower the higher it is: 48 points on the floor,
 * 32 from 20 up, 16 from 50 up. None once it has broken.
 */
function shadow(i: u16): void {
  if (shOn[i] !== 0) return
  const held = fState[i] === ST_THROWN
  const x = (held ? heldX(i) : i16(pointX(i))) - i16(camX)
  const h = held ? throwWord(i, 3) : fY[i] >> 4
  const y = i16(groundY) - 4
  const t = SHADOW_TILE | FX_PAL
  if (h < 20) {
    spr(x - 24, y, t, S16)
    spr(x - 8, y, t + 4, S16)
    spr(x + 8, y, t | FLIP_H, S16)
  } else if (h < 50) {
    spr(x - 16, y, t + 8, S16)
    spr(x, y, (t + 8) | FLIP_H, S16)
  } else spr(x - 8, y, t + 12, S16)
}

/* ---------------- the KO (design 2.4): the void, then the pieces ---------------- */

/**
 * The KO's frames (the round's over-phase): its hitstop, the fill gone by 40, the pieces fade from
 * 96.
 */
const VOID_FROM = 24
const BREAK_AT = 40
const FADE_AT = 96
/**
 * The pieces: each fighter's 32, where (1/16 points, the world's x and the screen's y) and how
 * fast.
 */
const shOn = words(2)
const shX = words(64)
const shY = words(64)
const shVX = words(64)
const shVY = words(64)
const GRAVITY = 3
/** The round won: the winner's picture from this frame of the over-phase. */
const WIN_AT = 60

/** A fighter knocked out breaks at its frame; the winner takes its pose; the pieces fly. */
function koStep(i: u16): void {
  const over = phase === PH_OVER || phase === PH_END
  if (!over) {
    shOn[i] = 0
    return
  }
  if (phase === PH_OVER && roundWon === i && phaseT >= WIN_AT) fWin[i] = 1
  if (fLife[i] !== 0) return
  if (phase === PH_OVER && phaseT === BREAK_AT && shOn[i] === 0) {
    shatter(i)
    sfx(X_SHARDS)
  }
  if (shOn[i] !== 0) shardsMove(i)
}

/**
 * Fighter `i` in pieces: its picture becomes the KO pieces of the pose it is in - lying down, or
 * still falling - (copied into its room next frame) and each flies from where it was, away from
 * the pieces' middle - so both ways - and up.
 */
function shatter(i: u16): void {
  artHold[i] = 1
  boxPose[i] = 0xffff
  artCopy(i, fSlot[i], fAir[i] !== 0 ? SHARDS_AIR : SHARDS_ROW)
  shOn[i] = 1
  const right = fFace[i] !== 0
  const x0 = i16(pointX(i))
  const y0 = i16(groundY) - i16(fY[i] >> 4)
  const n = art[i * ART_W + 1]
  let mean: i16 = 0
  let c: u16 = 0
  while (c < n) {
    mean = mean + lowOf(art[i * ART_W + 2 + c])
    c++
  }
  if (n > 0) mean = idiv(mean, i16(n))
  c = 0
  while (c < n) {
    const w = art[i * ART_W + 2 + c]
    const dx = lowOf(w)
    const e = i * 32 + c
    const px = right ? x0 + dx : x0 - dx - 16
    const away = right ? dx - mean : mean - dx
    shX[e] = u16(px * 16)
    // Every other piece lifted a piece's height: a body lying flat breaks into about 30 pieces
    // on the same lines, which with a winner standing near passed 32 sprites a line.
    shY[e] = u16((y0 + highOf(w) - i16((c & 1) * 16)) * 16)
    shVX[e] = u16(away * 3 + i16((c * 7) & 15) - 8)
    shVY[e] = u16(-24 - i16((c * 13) & 31))
    c++
  }
}

function shardsMove(i: u16): void {
  const n = art[i * ART_W + 1]
  let c: u16 = 0
  while (c < n) {
    const e = i * 32 + c
    shVY[e] = u16(i16(shVY[e]) + GRAVITY)
    shX[e] = u16(i16(shX[e]) + i16(shVX[e]))
    shY[e] = u16(i16(shY[e]) + i16(shVY[e]))
    c++
  }
}

function shardSprites(i: u16): void {
  const n = art[i * ART_W + 1]
  const tile = (S1_TILE + i * 128) | (i << 10) | (fFace[i] !== 0 ? 0 : FLIP_H)
  let c: u16 = 0
  while (c < n) {
    const e = i * 32 + c
    const y = i16(shY[e]) >> 4
    if (y < 300) spr((i16(shX[e]) >> 4) - i16(camX), y, tile + c * 4, S16)
    c++
  }
}

/* ---------------- the palettes (design 2.3, 2.4) ---------------- */

/** The palette's roles: wire 1 and 2, the fills 3-11, the void 13. */
export const M_NORMAL = 0
export const M_INTRO = 1
const M_FLASH = 2
const M_GUARD = 3
const M_THROWN = 4
const M_LOW = 5
const M_KO = 6
const M_PIECES = 7
const WHITE = 0x7fff
const GUARD_1 = 0x7fb8
const GUARD_2 = 0x66af
const THROWN_1 = 0x759f
const THROWN_2 = 0x48d3
/** The palette each fighter shows (mode << 8 | step); 0xffff to write it whatever it is. */
export const palKey = words(2)

/** Fighter `i`'s palette for this frame, written only when it changes. */
function palStep(i: u16): void {
  const key = palWanted(i)
  if (key === palKey[i]) return
  palKey[i] = key
  palShow(8 + i, key >> 8, key & 255)
}

/**
 * The step of the drawing-in `t` frames after it began (6 once whole): the round's start's pace.
 */
export function introStep(t: u16): u16 {
  const k = introKey(t)
  return k >> 8 === M_NORMAL ? 6 : k & 255
}

/**
 * The palette's mode and step, the first that applies: KO, the round's start, thrown, struck,
 * guarding, low.
 */
function palWanted(i: u16): u16 {
  if (shOn[i] !== 0) {
    const t = phaseT > FADE_AT ? phaseT - FADE_AT : 0
    return (M_PIECES << 8) | (t > 16 ? 16 : t)
  }
  if (phase === PH_OVER && fLife[i] === 0 && phaseT >= VOID_FROM) {
    const t = phaseT - VOID_FROM
    return (M_KO << 8) | (t > 16 ? 16 : t)
  }
  if (phase === PH_ROUND) return introKey(phaseT)
  if (fState[i] === ST_THROWN) return M_THROWN << 8
  if (flashT[i] > 0) return M_FLASH << 8
  if (guardT[i] > 0) return M_GUARD << 8
  if (fLife[i] * 4 < prAt(i, P_LIFE) && (frame & 16) !== 0) return M_LOW << 8
  return M_NORMAL << 8
}

/** Drawn in as a round begins: the dim wire, the whole wire, then the fill in four steps. */
function introKey(t: u16): u16 {
  if (t < 10) return M_INTRO << 8
  if (t < 18) return (M_INTRO << 8) | 1
  const s = 2 + ((t - 18) >> 2)
  return s >= 6 ? M_NORMAL << 8 : (M_INTRO << 8) | s
}

/**
 * A fighter's palette slot `sl` (its colours kept there with `palKeep`) shown in a mode: the
 * fight's two (8 and 9) and the title's four (11-14) alike. The drawing-in's step 6 is whole.
 */
export function palShow(sl: u16, mode: u16, step: u16): void {
  const base = sl * 16
  const empty = palCopy[base + 13]
  const m = mode === M_INTRO && step >= 6 ? M_NORMAL : mode
  let k: u16 = 1
  while (k < 16) {
    colour(sl, k, colourOf(base, k, (m << 8) | step, empty))
    k++
  }
}

function isFill(k: u16): bool {
  return k >= 3 && k <= 13
}

/** Colour `k` of the slot whose kept colours start at `base`, for `key` (mode << 8 | step). */
function colourOf(base: u16, k: u16, key: u16, empty: u16): u16 {
  const c = palCopy[base + k]
  const mode = key >> 8
  const step = key & 255
  if (mode === M_INTRO) return introColour(base, k, step, empty)
  if (mode === M_KO) return isFill(k) ? mix(c, empty, step) : c
  if (mode === M_PIECES) return mix(isFill(k) ? empty : c, 0, step)
  if (mode === M_FLASH) return flashColour(c, k)
  if (k > 2) return c
  return wireColour(base, k, mode)
}

/** The hit's flash: the wire white, the fills 6/16 of the way to it. */
function flashColour(c: u16, k: u16): u16 {
  if (k <= 2) return WHITE
  return k <= 11 ? mix(c, WHITE, 6) : c
}

/** Wire `k` (1 or 2) for a guard, a throw or the low life's blink. */
function wireColour(base: u16, k: u16, mode: u16): u16 {
  const one = k === 1
  if (mode === M_GUARD) return one ? GUARD_1 : GUARD_2
  if (mode === M_THROWN) return one ? THROWN_1 : THROWN_2
  if (mode === M_LOW && one) return palCopy[base + 2]
  return palCopy[base + k]
}

function introColour(base: u16, k: u16, step: u16, empty: u16): u16 {
  const c = palCopy[base + k]
  if (k === 1 && step === 0) return palCopy[base + 2]
  if (!isFill(k)) return c
  if (step < 2) return empty
  return mix(empty, c, (step - 1) * 4)
}

/* ---------------- the fight's sounds (design 9), by event ---------------- */

/** What was heard last frame: the phase, TIME, each fighter's state and move frame. */
let soundPhase: u16 = 0xffff
let soundTime: u16 = 0
const soundSt = words(2)
const soundF = words(2)
/** The drawing-in's sound, this many frames into a round's start. */
const MAT_AT = 18

/**
 * The frame's sounds from what it did: the banners' cues, a KO's chord, the materialising, TIME's
 * last ten; each fighter's blows, guards, throws, swings, dashes, landings and falls.
 */
function soundStep(): void {
  if (phase !== soundPhase) {
    soundPhase = phase
    if (phase === PH_ROUND) sfx(X_ROUND)
    else if (phase === PH_FIGHT) sfx(X_FIGHT)
    else if (phase === PH_OVER) sfx(fLife[0] === 0 || fLife[1] === 0 ? X_KO : X_ROUND)
  }
  if (phase === PH_ROUND && phaseT === MAT_AT) sfx(X_MAT)
  if (phase === PH_FIGHT && timeLeft !== soundTime && timeLeft <= 10 && timeLeft > 0) sfx(X_TIME)
  soundTime = timeLeft
  fighterSounds(0)
  fighterSounds(1)
}

function fighterSounds(a: u16): void {
  const s = struck[a]
  if (s === 1 || s === 3) sfx((mvAt(a, fMove[a], M_KIND) & K_HEAVY) !== 0 ? X_HEAVY : X_LIGHT)
  else if (s === 2) sfx(X_GUARD)
  else if (s === 4) sfx(X_DOWN)
  if (threw[a] !== 0) sfx(X_THROW)
  stateSounds(a, s)
  swingSound(a)
}

/** A fighter's new state heard: a dash, a landing, a fall (not the throw's, heard already). */
function stateSounds(a: u16, s: u16): void {
  const st = fState[a]
  if (st !== soundSt[a]) {
    soundSt[a] = st
    if (st === ST_DASH || st === ST_BACKDASH) sfx(X_DASH)
    else if (st === ST_LAND) sfx(X_LAND)
    else if (st === ST_DOWN && s !== 4) sfx(X_DOWN)
  }
}

/** A swing as its first active frame comes (once: a hitstop holds the frame still). */
function swingSound(a: u16): void {
  const st = fState[a]
  const f = fMoveF[a]
  if (st === ST_ATTACK && f !== soundF[a] && fMove[a] !== MV_THROW) {
    if (f === mvAt(a, fMove[a], M_STARTUP)) sfx(X_WHIFF)
  }
  soundF[a] = st === ST_ATTACK ? f : 0
}
