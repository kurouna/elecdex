// ELECDRILL's falling blocks and chains (docs/elec16-elecdrill.md section 5). Everything here is
// incremental, its work bounded each frame, so the busiest collapse never misses a frame:
//
//   - A removed cell makes the cell above it a suspect. A suspect's group (its colour's
//     neighbours, or the cell alone for ALLOY and a capsule) is held up when any of its blocks
//     stands on something that is not its own group and not loose; otherwise it comes loose.
//     Only groups above a change are ever looked at; a whole field is never searched.
//   - Loose blocks belong to a unit: a group that came loose, and the groups resting on it,
//     which wobble together and then fall together, a quarter point at a time.
//   - When a unit has come down a whole cell, its groups that now rest on something settle.
//     A settled block of a colour whose group reaches four or more makes that group vanish:
//     a chain. Vanishing blocks flash for a moment, then go, a few a frame, and the cells
//     above them become suspects in turn.
import {
  addr,
  type bool,
  bytes,
  i16,
  memcpy,
  type u16,
  words,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import { ALLOY_TILE, CAPSULE_TILE, LOOSE_TILE } from './assets.e16'
import {
  cells,
  F_LOOSE,
  F_PEND,
  markAround,
  stamped,
  stampIt,
  stampNext,
  T_AIR,
  T_ALLOY,
  T_BLUE,
  T_CORE,
  T_EMPTY,
  top,
} from './field.e16'

/* ---------------- searching a group ---------------- */

/** The cells of the last group searched, in the order found (nearest first). */
export const found = words(280)
export let foundN: u16 = 0

/** The group of cell `start`: its colour's static neighbours, or it alone. Answers the count. */
export function groupOf(start: u16): u16 {
  stampNext()
  found[0] = start
  stampIt(start)
  foundN = 1
  const key = cells[start]
  if ((key & 15) > T_BLUE) return 1
  let k: u16 = 0
  while (k < foundN) {
    const i = found[k]
    k++
    reach((i - 16) & 511, key)
    reach((i + 16) & 511, key)
    reach((i - 1) & 511, key)
    reach((i + 1) & 511, key)
  }
  return foundN
}

function reach(i: u16, key: u16): void {
  if (cells[i] !== key || stamped(i) || foundN >= 280) return
  stampIt(i)
  found[foundN] = i
  foundN++
}

/* ---------------- loose blocks and their units ---------------- */

const LB_N = 96
export const lbCell = words(96)
/** Each loose block's group (an index into the groups' table), unit and sprite tile. */
export const lbGroup = bytes(96)
export const lbUnit = bytes(96)
export const lbTile = words(96)
/** A block's cell value while its unit moves it down. */
const lbVal = bytes(96)
export let lbN: u16 = 0
/** For each cell: its loose block's index + 1, or 0. */
export const lbAt = bytes(512)

/** The loose groups: how many blocks each has left (0 a free entry), and whether it has settled. */
const G_N = 48
const gSize = words(48)
const gSet = bytes(48)

let gNext: u16 = 0

/** A free entry of the groups' table, looked for from after the last one taken. */
function groupNew(): u16 {
  let n: u16 = 0
  while (n < G_N) {
    const g = gNext
    gNext = gNext + 1 === G_N ? 0 : gNext + 1
    if (gSize[g] === 0) return g
    n++
  }
  return 0xff
}

export const U_N = 12
export const U_FREE = 0
export const U_WOBBLE = 1
export const U_FALL = 2
export const uState = words(12)
export const uTime = words(12)
/** How far down into the next cell, in quarter points (64 a cell). */
export const uOff = words(12)
const uSize = words(12)

/** How long a group wobbles before it falls, and how fast it falls (quarter points a frame). */
export let wobbleFrames: u16 = 64
export let fallSpeed: u16 = 8

export function fallPace(wobble: u16, speed: u16): void {
  wobbleFrames = wobble
  fallSpeed = speed
}

/** The driller's cell, for a falling block to land on, or 0xffff while it is not to be hit. */
export let target: u16 = 0xffff
/** Set when a falling block reached the driller: 1 crushed, 2 a capsule caught. */
export let struck: u16 = 0

export function targetIs(cell: u16): void {
  target = cell
}

export function struckClear(): void {
  struck = 0
}

/** Everything still: no unit, nothing waiting to vanish or to be looked at. */
export function fallQuiet(): bool {
  return lbN === 0 && pendN === 0 && landN === 0 && susHead === susTail
}

export function fallClear(): void {
  let k: u16 = 0
  while (k < 512) {
    lbAt[k] = 0
    k++
  }
  k = 0
  while (k < U_N) {
    uState[k] = U_FREE
    uSize[k] = 0
    k++
  }
  k = 0
  while (k < G_N) {
    gSize[k] = 0
    k++
  }
  lbN = 0
  pendN = 0
  susHead = 0
  susTail = 0
  landN = 0
  chain = 0
  struck = 0
}

function unitNew(): u16 {
  let u: u16 = 0
  while (u < U_N) {
    if (uState[u] === U_FREE) {
      uState[u] = U_WOBBLE
      uTime[u] = wobbleFrames
      uOff[u] = 0
      uSize[u] = 0
      return u
    }
    u++
  }
  return 0xff
}

/* ---------------- suspects: cells whose footing may have gone ---------------- */

const sus = words(128)
let susHead: u16 = 0
let susTail: u16 = 0

export function suspect(i: u16): void {
  const next = (susTail + 1) & 127
  if (next === susHead) return
  sus[susTail] = i
  susTail = next
}

/** Looks at suspects until about `budget` cells have been searched. */
export function suspectsStep(budget: u16): void {
  let spent: u16 = 0
  while (susHead !== susTail && spent < budget) {
    const i = sus[susHead]
    susHead = (susHead + 1) & 127
    const cost = footing(i)
    // No room for another loose group just now: the rest wait for a later frame.
    if (cost === FULL) return
    spent = spent + cost
  }
}

/** What `footing` answers when there is no room for another loose group. */
const FULL = 0xffff

/** What `underneath` answers for a group held up. */
const HELD = 0xfe

/**
 * What the group just searched (`n` cells) stands on: HELD by something still, or nothing -
 * then a wobbling unit under it to join (its index), or 0xff for none.
 */
function underneath(n: u16): u16 {
  let join: u16 = 0xff
  let k: u16 = 0
  const ceiling = top & 31
  while (k < n) {
    // A group reaching the ring's highest row hangs from what is above it, out of the ring.
    if (found[k] >> 4 === ceiling) return HELD
    const below = (found[k] + 16) & 511
    const bv = cells[below]
    if ((bv & 15) !== 0 && !stamped(below)) {
      if ((bv & F_LOOSE) === 0) return HELD
      const u = lbUnit[lbAt[below] - 1]
      if (uState[u] === U_WOBBLE) join = u
    }
    k++
  }
  return join
}

/** Whether cell `i`'s group still stands; if not, it comes loose. Answers the cells searched. */
function footing(i: u16): u16 {
  const v = cells[i]
  const t = v & 15
  if (t === T_EMPTY || t >= T_CORE || (v & (F_LOOSE | F_PEND)) !== 0) return 2
  const n = groupOf(i)
  const join = underneath(n)
  if (join === HELD) return n + 4
  if (lbN + n > LB_N) {
    // No room to let it fall yet: look again later.
    suspect(i)
    return FULL
  }
  const g = groupNew()
  const u = g === 0xff ? 0xff : join !== 0xff ? join : unitNew()
  if (u === 0xff) {
    suspect(i)
    return FULL
  }
  if (join === 0xff) loosened++
  loosen(n, u, g)
  // Letting a group go costs more than looking at it: a block's sprite, its neighbours redrawn.
  return n * 4 + 16
}

/** The group just searched comes loose in unit `u`; the cells above it become suspects. */
function loosen(n: u16, u: u16, g: u16): void {
  const first = lbN
  let k: u16 = 0
  while (k < n) {
    const c = found[k]
    cells[c] = cells[c] | F_LOOSE
    lbCell[lbN] = c
    lbGroup[lbN] = g
    lbUnit[lbN] = u
    lbN++
    lbAt[c] = lbN
    markAround(c)
    k++
  }
  // Each block's sprite, joined to its group's blocks beside it: worked out once, as a group
  // keeps its shape all the way down.
  k = first
  while (k < lbN) {
    lbTile[k] = looseTile(lbCell[k], g)
    k++
  }
  gSize[g] = n
  uSize[u] = uSize[u] + n
  k = 0
  while (k < n) {
    const above = (found[k] - 16) & 511
    if (!stamped(above)) suspect(above)
    k++
  }
}

/** A loose block's sprite tile: a colour joined N, E, S and W to its group, or ALLOY or air. */
function looseTile(c: u16, g: u16): u16 {
  const v = cells[c]
  const t = v & 15
  if (t === T_ALLOY) return (ALLOY_TILE + ((v >> 4) & 3) * 4) | (5 << 10)
  if (t === T_AIR) return CAPSULE_TILE | (5 << 10)
  let m: u16 = 0
  if (kin((c - 16) & 511, g)) m = m | 1
  if (kin((c + 1) & 511, g)) m = m | 2
  if (kin((c + 16) & 511, g)) m = m | 4
  if (kin((c - 1) & 511, g)) m = m | 8
  return (LOOSE_TILE + m * 4) | (t << 10)
}

function kin(c: u16, g: u16): bool {
  const j = lbAt[c]
  return j !== 0 && lbGroup[j - 1] === g
}

/* ---------------- the units move ---------------- */

/** Every unit a frame on: wobbling down to falling, falling a cell at a time, settling. */
export function unitsStep(): void {
  let u: u16 = 0
  while (u < U_N) {
    const s = uState[u]
    if (s === U_WOBBLE) wobbleStep(u)
    else if (s === U_FALL) fallStep(u)
    u++
  }
}

function wobbleStep(u: u16): void {
  if (uTime[u] > 0) {
    uTime[u] = uTime[u] - 1
    return
  }
  settle(u)
  if (uState[u] !== U_FREE) {
    uState[u] = U_FALL
    uOff[u] = 0
  }
}

function fallStep(u: u16): void {
  let off = uOff[u] + fallSpeed
  // A block over the driller's head, a good way into its cell, has reached it.
  if (off >= 32 && target !== 0xffff) strikeCheck(u)
  if (off < 64) {
    uOff[u] = off
    return
  }
  // Nothing still can have come under a falling block (it would have had to pass it), so
  // the unit settles only after it has moved.
  const v = blocker(u)
  if (v !== 0xff) {
    // Held up by another unit: wait while it wobbles; once it falls, fall with it as one (two
    // units could otherwise each wait for the other, side by side, for ever).
    if (uState[v] === U_FALL) merge(u, v)
    else uOff[u] = 64
    return
  }
  down(u)
  off = off - 64
  uOff[u] = off
  settle(u)
}

/** Whether a block of unit `u` hangs over the driller: a capsule is caught, a block crushes. */
function strikeCheck(u: u16): void {
  let k: u16 = 0
  while (k < lbN) {
    if (lbUnit[k] === u && ((lbCell[k] + 16) & 511) === target) {
      if ((cells[lbCell[k]] & 15) === T_AIR) {
        struck = 2
        const c = lbCell[k]
        dropBlock(k)
        cells[c] = T_EMPTY
        markAround(c)
        return
      }
      // It comes to rest on the flattened driller.
      struck = 1
      uOff[u] = 50
      return
    }
    k++
  }
}

/** The unit a block of unit `u` would fall into, or 0xff for none. */
function blocker(u: u16): u16 {
  let k: u16 = 0
  while (k < lbN) {
    if (lbUnit[k] === u) {
      const below = (lbCell[k] + 16) & 511
      if ((cells[below] & F_LOOSE) !== 0) {
        const v = lbUnit[lbAt[below] - 1]
        if (v !== u) return v
      }
    }
    k++
  }
  return 0xff
}

/** Unit `u`'s blocks join unit `v` (and move with it from now on); `u` is freed. */
function merge(u: u16, v: u16): void {
  let k: u16 = 0
  while (k < lbN) {
    if (lbUnit[k] === u) lbUnit[k] = v
    k++
  }
  uSize[v] = uSize[v] + uSize[u]
  uSize[u] = 0
  uState[u] = U_FREE
}

/** Unit `u` a cell down: every block lifted, then every block set down a row lower. */
function down(u: u16): void {
  let k: u16 = 0
  while (k < lbN) {
    if (lbUnit[k] === u) {
      // The cell left was drawn as dug ground already (a loose block is a sprite), and so is
      // the one it goes to: nothing to redraw.
      const c = lbCell[k]
      lbVal[k] = cells[c]
      cells[c] = T_EMPTY
      lbAt[c] = 0
    }
    k++
  }
  k = 0
  while (k < lbN) {
    if (lbUnit[k] === u) {
      const c = (lbCell[k] + 16) & 511
      cells[c] = lbVal[k]
      lbCell[k] = c
      lbAt[c] = k + 1
    }
    k++
  }
}

/**
 * Unit `u`'s groups that rest on something still: settled where they are. A group rests on
 * what is not loose, or on a group of its own unit that has settled - so groups stacked in a
 * unit settle from the bottom up, a pass at a time.
 */
function settle(u: u16): void {
  // Mostly a unit is still falling free: nothing under it but air and its own blocks.
  if (!touches(u)) return
  let k: u16 = 0
  while (k < lbN) {
    if (lbUnit[k] === u) gSet[lbGroup[k]] = 0
    k++
  }
  // Passes up and down the list by turns: a stack settles in a pass or two whichever way
  // its groups were listed.
  let up = true
  while (settlePass(u, up)) up = !up
  // The settled blocks leave the unit (from the end, as a block's place in the list moves).
  k = lbN
  while (k > 0) {
    k--
    if (lbUnit[k] === u && gSet[lbGroup[k]] !== 0) {
      const c = lbCell[k]
      cells[c] = cells[c] & ~F_LOOSE
      markAround(c)
      landed(c)
      dropBlock(k)
    }
  }
}

/** One pass of `settle` up or down the list: answers whether a group settled in it. */
function settlePass(u: u16, up: bool): bool {
  let more = false
  let k: u16 = 0
  while (k < lbN) {
    const j = up ? k : lbN - 1 - k
    if (lbUnit[j] === u && gSet[lbGroup[j]] === 0 && rests(j, u)) {
      gSet[lbGroup[j]] = 1
      more = true
    }
    k++
  }
  return more
}

/** Whether a block of unit `u` stands on something not loose. */
function touches(u: u16): bool {
  let k: u16 = 0
  while (k < lbN) {
    if (lbUnit[k] === u) {
      const bv = cells[(lbCell[k] + 16) & 511]
      if ((bv & 15) !== 0 && (bv & F_LOOSE) === 0) return true
    }
    k++
  }
  return false
}

function rests(k: u16, u: u16): bool {
  const below = (lbCell[k] + 16) & 511
  const bv = cells[below]
  if ((bv & 15) === 0) return false
  if ((bv & F_LOOSE) === 0) return true
  const j = lbAt[below] - 1
  return lbUnit[j] === u && gSet[lbGroup[j]] !== 0
}

/** Loose block `k` taken out of the list (its cell left as it is); its unit freed when empty. */
function dropBlock(k: u16): void {
  const u = lbUnit[k]
  gSize[lbGroup[k]] = gSize[lbGroup[k]] - 1
  lbAt[lbCell[k]] = 0
  lbN--
  if (k !== lbN) {
    lbCell[k] = lbCell[lbN]
    lbGroup[k] = lbGroup[lbN]
    lbUnit[k] = lbUnit[lbN]
    lbTile[k] = lbTile[lbN]
    lbVal[k] = lbVal[lbN]
    lbAt[lbCell[k]] = k + 1
  }
  uSize[u] = uSize[u] - 1
  if (uSize[u] === 0) uState[u] = U_FREE
}

/** Cell `c` cleared whatever it holds (a loose block taken out of its unit too). */
export function cellClear(c: u16): void {
  if (lbAt[c] !== 0) dropBlock(lbAt[c] - 1)
  cells[c] = T_EMPTY
  markAround(c)
  suspect((c - 16) & 511)
}

/** Every loose block in ring row `ring` taken out of the field (the ring moves past it). */
export function fallForget(ring: u16): void {
  let k = lbN
  while (k > 0) {
    k--
    if (lbCell[k] >> 4 === ring) dropBlock(k)
  }
}

/* ---------------- landing, chains, vanishing ---------------- */

const landQ = words(64)
let landN: u16 = 0

function landed(c: u16): void {
  if (landAt === 0xffff) landAt = c
  if (landN < 64) {
    landQ[landN] = c
    landN++
  }
}

/** The chain so far (groups that vanished after a fall), and this frame's news for the score. */
export let chain: u16 = 0
export let vanishedBlocks: u16 = 0
export let vanishedChain: u16 = 0
export let vanishedAt: u16 = 0
export let landings: u16 = 0
/** Groups that came loose of themselves this frame (not on another's back). */
export let loosened: u16 = 0
/** A block that came to rest this frame (the first), for its dust, or 0xffff. */
export let landAt: u16 = 0xffff

/** A dig starts a new count: a chain is what falls of itself, not what the drill does. */
export function chainNew(): void {
  chain = 0
}

export function newsClear(): void {
  loosened = 0
  vanishedBlocks = 0
  vanishedChain = 0
  landings = 0
  landAt = 0xffff
}

/**
 * The groups the blocks that landed joined: four or more vanish, a chain. About `budget`
 * cells are searched a frame; the rest wait for the next (a big landing is looked at over a
 * frame or two, which no one sees).
 */
export function chainsStep(now: u16, budget: u16): void {
  landings = landN
  let spent: u16 = 0
  let k: u16 = 0
  while (k < landN && spent < budget) {
    const c = landQ[k]
    k++
    const t = cells[c]
    spent = spent + 2
    if (t < 1 || t > T_BLUE) continue
    const n = groupOf(c)
    spent = spent + n
    if (n < 4) continue
    chain++
    vanishedBlocks = vanishedBlocks + n
    vanishedChain = chain
    vanishedAt = c
    vanish(n, now + 24, 0)
    spent = spent + n * 2
  }
  if (k > 0 && k < landN) memcpy(addr(landQ), addr(landQ) + k * 2, (landN - k) * 2)
  landN = landN - k
  if (fallQuiet()) chain = 0
}

/**
 * The group just searched marked to vanish from frame `due`, `step` frames later for each
 * further ring of it (a ripple out from where it was struck).
 */
export function vanish(n: u16, due: u16, step: u16): void {
  let k: u16 = 0
  while (k < n) {
    const c = found[k]
    cells[c] = cells[c] | F_PEND
    markAround(c)
    pend(c, wrap16(due + ((k * step) >> 2)))
    k++
  }
}

const PEND_N = 160
const pendCell = words(160)
const pendDue = words(160)
let pendN: u16 = 0

function pend(c: u16, due: u16): void {
  if (pendN >= PEND_N) {
    gone(c)
    return
  }
  pendCell[pendN] = c
  pendDue[pendN] = due
  pendN++
}

/** What vanished this frame, for the pops: cells and their colours, at most 24. */
export const goneCell = words(24)
export const goneType = words(24)
export let goneN: u16 = 0

/** Vanishing blocks whose time has come go, at most `most` of them this frame. */
export function pendStep(now: u16, most: u16): void {
  goneN = 0
  let k: u16 = 0
  while (k < pendN) {
    if (i16(wrap16(now - pendDue[k])) >= 0 && most > 0) {
      gone(pendCell[k])
      most--
      pendN--
      pendCell[k] = pendCell[pendN]
      pendDue[k] = pendDue[pendN]
    } else k++
  }
}

/** A vanishing block gone: its cell empty, what was on it a suspect. */
function gone(c: u16): void {
  const v = cells[c]
  if ((v & F_PEND) === 0) return
  if (goneN < 24) {
    goneCell[goneN] = c
    goneType[goneN] = v & 15
    goneN++
  }
  cells[c] = T_EMPTY
  markAround(c)
  suspect((c - 16) & 511)
}

/** Whether cell `c` is waiting to vanish. */
export function pending(c: u16): bool {
  return (cells[c] & F_PEND) !== 0
}

/** Forgets pending cells in ring row `ring` (the ring moves past it). */
export function pendForget(ring: u16): void {
  let k: u16 = 0
  while (k < pendN) {
    if (pendCell[k] >> 4 === ring) {
      pendN--
      pendCell[k] = pendCell[pendN]
      pendDue[k] = pendDue[pendN]
    } else k++
  }
}
