// ELECAIRCOMBAT's numbers (docs/elec16-elecaircombat.md section 4): vectors of three words in
// one array, unit vectors in Q14 (16384 is 1), and the few sums that need the machine's 32-bit
// products - a fixed-point product, a dot product, a turn of two vectors together, a scaled
// add and a long division - written in assembly. Their arguments come in a0-a3 (the first
// thing each function does), and an answer goes back through `mOut`.
import { addr, asm, div, i16, u16, words } from '../../../../src/shared/e16c/builtins'

/** Where answers of the assembly come back. */
export const mOut = words(2)

/**
 * Every vector, three words each, at these places: the player's forward, right and up, the
 * enemy's, the enemy's place from the player (world, units) and scratch.
 */
export const vec = words(48)
export const V_PF = 0
export const V_PR = 3
export const V_PU = 6
export const V_EF = 9
export const V_ER = 12
export const V_EU = 15
export const V_REL = 18
export const V_T0 = 21
export const V_T1 = 24
export const V_T2 = 27
export const V_T3 = 30
export const V_UP = 33

/** The address of vector `k`. */
export function va(k: u16): u16 {
  return addr(vec) + k * 2
}

/** One is 16384. */
export const ONE = 16384

/** (a * b) >> 14, from the full product. */
export function mulq(_a: i16, _b: i16): i16 {
  asm`
    mul t0, a0, a1
    mulh t1, a0, a1
    srli t0, t0, 14
    slli t1, t1, 2
    or t0, t0, t1
    li t2, mOut
    sw t0, 0(t2)
  `
  return i16(mOut[0])
}

/**
 * The dot product of the vectors at `pa` and `pb`, shifted down 14 (so a unit vector's dot
 * with a place gives units), summed in 32 bits and held to a word's range.
 */
export function dotq(_pa: u16, _pb: u16): i16 {
  asm`
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .dq_ok
    addi t1, t1, 1
    beqz t1, .dq_ok
    li t0, 32767
    bge t3, zero, .dq_ok
    li t0, -32768
.dq_ok:
    li t2, mOut
    sw t0, 0(t2)
  `
  return i16(mOut[0])
}

/**
 * Turns two vectors together: a' = a c + b s, b' = b c - a s (c and s a cosine and sine in
 * Q14). Pitch, roll and yaw are all this, on the right pair of axes.
 */
export function rotq(_pa: u16, _pb: u16, _c: i16, _s: i16): void {
  asm`
    li t3, 3
    li t2, mOut
    sw t3, 2(t2)
.rq_next:
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, a2
    mulh t3, t0, a2
    srli t2, t2, 14
    slli t3, t3, 2
    or t2, t2, t3
    li t3, mOut
    sw t2, 0(t3)
    mul t2, t1, a3
    mulh t3, t1, a3
    srli t2, t2, 14
    slli t3, t3, 2
    or t2, t2, t3
    li t3, mOut
    lw t3, 0(t3)
    add t2, t2, t3
    sw t2, 0(a0)
    mul t2, t1, a2
    mulh t3, t1, a2
    srli t2, t2, 14
    slli t3, t3, 2
    or t2, t2, t3
    li t3, mOut
    sw t2, 0(t3)
    mul t2, t0, a3
    mulh t3, t0, a3
    srli t2, t2, 14
    slli t3, t3, 2
    or t2, t2, t3
    li t3, mOut
    lw t3, 0(t3)
    sub t2, t3, t2
    sw t2, 0(a1)
    addi a0, a0, 2
    addi a1, a1, 2
    li t2, mOut
    lw t3, 2(t2)
    addi t3, t3, -1
    sw t3, 2(t2)
    bnez t3, .rq_next
  `
}

/** d += s * k >> 14, three words. */
export function axpyq(_pd: u16, _ps: u16, _k: i16): void {
  asm`
    li t3, 3
.ax_next:
    lw t0, 0(a1)
    mul t1, t0, a2
    mulh t2, t0, a2
    srli t1, t1, 14
    slli t2, t2, 2
    or t1, t1, t2
    lw t0, 0(a0)
    add t0, t0, t1
    sw t0, 0(a0)
    addi a0, a0, 2
    addi a1, a1, 2
    addi t3, t3, -1
    bnez t3, .ax_next
  `
}

/** v = v * k >> 14, three words. */
export function scaleq(_pv: u16, _k: i16): void {
  asm`
    li t3, 3
.sc_next:
    lw t0, 0(a0)
    mul t1, t0, a1
    mulh t2, t0, a1
    srli t1, t1, 14
    slli t2, t2, 2
    or t1, t1, t2
    sw t1, 0(a0)
    addi a0, a0, 2
    addi t3, t3, -1
    bnez t3, .sc_next
  `
}

/**
 * (a * b) / d, unsigned, b and d below 32768, the answer known to fit a word: a long
 * division of the 32-bit product, a bit at a time.
 */
export function muldiv(_a: u16, _b: u16, _d: u16): u16 {
  asm`
    mulhu t1, a0, a1
    mul t2, a0, a1
    li t0, 0
    li t3, 16
.md_next:
    slli t1, t1, 1
    srli a3, t2, 15
    or t1, t1, a3
    slli t2, t2, 1
    slli t0, t0, 1
    bltu t1, a2, .md_skip
    sub t1, t1, a2
    ori t0, t0, 1
.md_skip:
    addi t3, t3, -1
    bnez t3, .md_next
    li t2, mOut
    sw t0, 0(t2)
  `
  return mOut[0]
}

/** A place's parts along the player's right, up and forward (units), from `toBodyOf`; then
 * where sky.e16.ts's `see` put it on the screen. */
export const bodyV = words(5)

/** The place at `p` (an address: units, world) along the player's three axes into `bodyV`. */
export function toBodyOf(_p: u16): void {
  asm`
    li a1, vec + 6
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .tb_x
    addi t1, t1, 1
    beqz t1, .tb_x
    li t0, 32767
    bge t3, zero, .tb_x
    li t0, -32768
.tb_x:
    li t2, bodyV
    sw t0, 0(t2)
    li a1, vec + 12
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .tb_y
    addi t1, t1, 1
    beqz t1, .tb_y
    li t0, 32767
    bge t3, zero, .tb_y
    li t0, -32768
.tb_y:
    li t2, bodyV
    sw t0, 2(t2)
    li a1, vec
    lw t0, 0(a0)
    lw t1, 0(a1)
    mul t2, t0, t1
    mulh t3, t0, t1
    lw t0, 2(a0)
    lw t1, 2(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    lw t0, 4(a0)
    lw t1, 4(a1)
    mul a2, t0, t1
    mulh a3, t0, t1
    add t2, t2, a2
    sltu a2, t2, a2
    add t3, t3, a3
    add t3, t3, a2
    srli t2, t2, 14
    slli t0, t3, 2
    or t0, t0, t2
    srai t1, t3, 13
    beqz t1, .tb_z
    addi t1, t1, 1
    beqz t1, .tb_z
    li t0, 32767
    bge t3, zero, .tb_z
    li t0, -32768
.tb_z:
    li t2, bodyV
    sw t0, 4(t2)
  `
}

/* ---------------- vectors in e16c ---------------- */

/** Copies vector `from` to `to`. */
export function vcopy(to: u16, from: u16): void {
  vec[to] = vec[from]
  vec[to + 1] = vec[from + 1]
  vec[to + 2] = vec[from + 2]
}

export function vset(k: u16, x: i16, y: i16, z: i16): void {
  vec[k] = u16(x)
  vec[k + 1] = u16(y)
  vec[k + 2] = u16(z)
}

/** A component of a vector, signed. */
export function vget(k: u16): i16 {
  return i16(vec[k])
}

/** Vector `d` = a x b (Q14 units). */
export function vcross(d: u16, a: u16, b: u16): void {
  const ax = vget(a)
  const ay = vget(a + 1)
  const az = vget(a + 2)
  const bx = vget(b)
  const by = vget(b + 1)
  const bz = vget(b + 2)
  vec[d] = u16(mulq(ay, bz) - mulq(az, by))
  vec[d + 1] = u16(mulq(az, bx) - mulq(ax, bz))
  vec[d + 2] = u16(mulq(ax, by) - mulq(ay, bx))
}

/** Vector `k` made a unit again (it is near one: a step of Newton's method). */
export function vunit(k: u16): void {
  const len2 = dotq(va(k), va(k))
  scaleq(va(k), ONE + ((ONE - len2) >> 1))
}

/**
 * A frame of three axes made square and unit again after its turns: forward kept, right
 * made square to it, up from the two.
 */
export function orthonormal(f: u16, r: u16, u: u16): void {
  vunit(f)
  axpyq(va(r), va(f), -dotq(va(r), va(f)))
  vunit(r)
  vcross(u, r, f)
}

/** The sine and cosine (Q14) of a small angle `a` (Q14 radians, under about 0.3). */
export let sinA: i16 = 0
export let cosA: i16 = ONE

export function smallAngle(a: i16): void {
  sinA = a
  cosA = ONE - (mulq(a, a) >> 1)
}

/** Pitch up by `a` (Q14 radians): forward toward up. */
export function pitchBy(f: u16, u: u16, a: i16): void {
  smallAngle(a)
  rotq(va(f), va(u), cosA, sinA)
}

/** Roll right by `a`: right toward down, up toward right. */
export function rollBy(r: u16, u: u16, a: i16): void {
  smallAngle(a)
  rotq(va(r), va(u), cosA, -sinA)
}

/** Yaw right by `a`: forward toward right. */
export function yawBy(f: u16, r: u16, a: i16): void {
  smallAngle(a)
  rotq(va(f), va(r), cosA, sinA)
}

/** Turns vector `k` about the world's up by `a` (to the right, seen from above). */
export function turnWorld(k: u16, a: i16): void {
  smallAngle(a)
  const x = vget(k)
  const y = vget(k + 1)
  vec[k] = u16(mulq(x, cosA) + mulq(y, sinA))
  vec[k + 1] = u16(mulq(y, cosA) - mulq(x, sinA))
}

/* ---------------- small numbers ---------------- */

export function abs16(v: i16): i16 {
  return v < 0 ? -v : v
}

export function clamp16(v: i16, lo: i16, hi: i16): i16 {
  if (v < lo) return lo
  if (v > hi) return hi
  return v
}

/** v moved toward `to` by at most `step`. */
export function approach(v: i16, to: i16, step: i16): i16 {
  if (v < to) return v + step > to ? to : v + step
  if (v > to) return v - step < to ? to : v - step
  return v
}

/** The larger of |x|, |y|, |z|: a quick size of a vector. */
export function vmax(x: i16, y: i16, z: i16): i16 {
  let m = abs16(x)
  const b = abs16(y)
  const c = abs16(z)
  if (b > m) m = b
  if (c > m) m = c
  return m
}

/** A rough length: the largest part plus a third of the other two (within about 12%). */
export function vlen(x: i16, y: i16, z: i16): u16 {
  const a = u16(abs16(x))
  const b = u16(abs16(y))
  const c = u16(abs16(z))
  const m = a > b ? (a > c ? a : c) : b > c ? b : c
  return m + div3(a + b + c - m)
}

/** About a third (5/16). */
function div3(v: u16): u16 {
  return (v >> 2) + (v >> 4)
}

/** The ratio of x to z in Q14 (|x| <= z, z > 0), to a part in 16,000. */
export function ratio(x: i16, z: i16): i16 {
  let xx = abs16(x)
  let zz = z
  while (zz >= 512) {
    zz = zz >> 1
    xx = xx >> 1
  }
  while (zz < 256) {
    zz = zz << 1
    xx = xx << 1
  }
  const n = u16(xx) * 128
  const q = div(n, u16(zz))
  const r = n - q * u16(zz)
  const f = div(r * 128, u16(zz))
  const v = i16(q * 128 + f)
  return x < 0 ? -v : v
}
