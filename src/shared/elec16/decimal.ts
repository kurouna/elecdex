/**
 * The ELEC-16's numbers (docs/elec16.md section 5, the maths unit): decimal floating point,
 * twelve significant digits, exponents from -99 to 99, as a pocket computer's are. Pure.
 *
 * The four operations and the square root are exact in BigInt and rounded once, half away
 * from zero, so 0.1 + 0.2 is 0.3 and 1 / 3 * 3 is 1. Sines, logarithms and powers go through
 * the double and are rounded to twelve digits, which the display's ten hide.
 *
 * In memory a number is eight bytes: a sign byte (bit 7; the rest must be 0), the exponent
 * as a signed byte, then twelve BCD digits, the first not 0 unless the number is 0. Its value
 * is d1.d2...d12 x 10^exponent.
 */

export const DIGITS = 12
const SCALE = 10n ** BigInt(DIGITS - 1)
const TOP = 10n ** BigInt(DIGITS)

/** A number: `coeff` has twelve digits (or is 0), its value coeff x 10^(exp - 11). */
export interface Dec {
  neg: boolean
  exp: number
  coeff: bigint
}

export const ZERO: Dec = { neg: false, exp: 0, coeff: 0n }

/** Why an operation has no answer; the maths unit reports it by number. */
export class DecError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export const ERR = { overflow: 1, divideByZero: 2, domain: 3, badNumber: 4 } as const

const overflow = () => new DecError(ERR.overflow, 'overflow')
const domain = () => new DecError(ERR.domain, 'illegal function argument')

/** Rounds `n x 10^e` (any size) to a number of twelve digits, half away from zero. */
export function make(neg: boolean, n: bigint, e: number): Dec {
  if (n === 0n) return ZERO
  const length = n.toString().length
  let coeff = n
  let exp = e + length - 1
  if (length > DIGITS) {
    const cut = 10n ** BigInt(length - DIGITS)
    const kept = n / cut
    coeff = n % cut >= (cut + 1n) / 2n ? kept + 1n : kept
    if (coeff === TOP) {
      coeff = SCALE
      exp++
    }
  } else coeff = n * 10n ** BigInt(DIGITS - length)
  if (exp > 99) throw overflow()
  if (exp < -99) return ZERO
  return { neg, exp, coeff }
}

/** The number as a coefficient and a power of ten: value = n x 10^e. */
const parts = (d: Dec): { n: bigint; e: number } => ({
  n: d.neg ? -d.coeff : d.coeff,
  e: d.exp - (DIGITS - 1),
})

function fromSigned(n: bigint, e: number): Dec {
  return n < 0n ? make(true, -n, e) : make(false, n, e)
}

export function add(a: Dec, b: Dec): Dec {
  const x = parts(a)
  const y = parts(b)
  if (x.n === 0n) return b
  if (y.n === 0n) return a
  const e = Math.min(x.e, y.e)
  return fromSigned(x.n * 10n ** BigInt(x.e - e) + y.n * 10n ** BigInt(y.e - e), e)
}

export const neg = (a: Dec): Dec => (a.coeff === 0n ? a : { ...a, neg: !a.neg })
export const abs = (a: Dec): Dec => ({ ...a, neg: false })
export const sub = (a: Dec, b: Dec): Dec => add(a, neg(b))

export function mul(a: Dec, b: Dec): Dec {
  if (a.coeff === 0n || b.coeff === 0n) return ZERO
  const x = parts(a)
  const y = parts(b)
  return fromSigned(x.n * y.n, x.e + y.e)
}

/** a / b, the quotient carried to more digits than kept, then rounded once. */
export function div(a: Dec, b: Dec): Dec {
  if (b.coeff === 0n) throw new DecError(ERR.divideByZero, 'division by zero')
  if (a.coeff === 0n) return ZERO
  const extra = BigInt(DIGITS + 2)
  let q = (a.coeff * 10n ** extra) / b.coeff
  const r = (a.coeff * 10n ** extra) % b.coeff
  // A remainder left over is below the last digit kept: it only matters as "more than none".
  if (r !== 0n) q = q * 10n + 1n
  const e = a.exp - b.exp - Number(extra) - (r !== 0n ? 1 : 0)
  return make(a.neg !== b.neg, q, e)
}

/** a and b as whole coefficients over one power of ten: a = x x 10^e, b = y x 10^e. */
function aligned(a: Dec, b: Dec): { x: bigint; y: bigint; e: number } {
  if (b.coeff === 0n) throw new DecError(ERR.divideByZero, 'division by zero')
  const p = parts(a)
  const q = parts(b)
  const e = Math.min(p.e, q.e)
  return { x: p.n * 10n ** BigInt(p.e - e), y: q.n * 10n ** BigInt(q.e - e), e }
}

/**
 * a / b cut towards zero to a whole number, worked exactly: dividing and then cutting would
 * take 999999999999 / 500000000000, rounded up to 2 at its twelfth digit, for 2. A quotient
 * longer than twelve digits is then rounded as any result is.
 */
export function idiv(a: Dec, b: Dec): Dec {
  const { x, y } = aligned(a, b)
  return fromSigned(x / y, 0)
}

/** a - (a idiv b) x b, the remainder, with a's sign; always exact (it is shorter than a or b). */
export function mod(a: Dec, b: Dec): Dec {
  const { x, y, e } = aligned(a, b)
  return fromSigned(x % y, e)
}

export function compare(a: Dec, b: Dec): -1 | 0 | 1 {
  const d = sub(a, b)
  if (d.coeff === 0n) return 0
  return d.neg ? -1 : 1
}

/** The square root, exact to the last digit kept. */
export function sqrt(a: Dec): Dec {
  if (a.coeff === 0n) return ZERO
  if (a.neg) throw domain()
  // n x 10^k with an even power of ten left over, long enough for fourteen digits of root.
  const { n, e } = parts(a)
  let k = Math.max(0, 2 * (DIGITS + 2) - n.toString().length)
  if ((e - k) % 2 !== 0) k++
  const whole = n * 10n ** BigInt(k)
  const half = (e - k) / 2
  const root = isqrt(whole)
  // Not exact: a digit past the last kept says "a little more", so a half is never a tie.
  return root * root === whole ? make(false, root, half) : make(false, root * 10n + 1n, half - 1)
}

function isqrt(n: bigint): bigint {
  if (n < 2n) return n
  let x = BigInt(Math.floor(Math.sqrt(Number(n)))) + 1n
  for (;;) {
    const y = (x + n / x) >> 1n
    if (y >= x) break
    x = y
  }
  while (x * x > n) x--
  while ((x + 1n) * (x + 1n) <= n) x++
  return x
}

/** The whole part towards minus infinity, as BASIC's INT. */
export function floor(a: Dec): Dec {
  const { n, e } = parts(a)
  if (e >= 0 || n === 0n) return a
  const unit = 10n ** BigInt(-e)
  let whole = n / unit
  if (n < 0n && n % unit !== 0n) whole -= 1n
  return fromSigned(whole, 0)
}

/** The part after the point, with the number's sign. */
export const frac = (a: Dec): Dec => sub(a, a.neg ? neg(floor(abs(a))) : floor(a))

export const sign = (a: Dec): Dec => (a.coeff === 0n ? ZERO : fromInt(a.neg ? -1 : 1))

export const fromInt = (v: number): Dec => fromSigned(BigInt(Math.trunc(v)), 0)

/** The whole part towards zero, as a BigInt. */
export function toBigInt(a: Dec): bigint {
  const { n, e } = parts(a)
  return e >= 0 ? n * 10n ** BigInt(e) : n / 10n ** BigInt(-e)
}

/* ---------------- through the double ---------------- */

export function toNumber(a: Dec): number {
  return Number(`${a.neg ? '-' : ''}${a.coeff}e${a.exp - (DIGITS - 1)}`)
}

/** A double to twelve digits; tiny results of the trigonometric functions are 0. */
export function fromNumber(x: number): Dec {
  if (!Number.isFinite(x)) throw Number.isNaN(x) ? domain() : overflow()
  if (x === 0) return ZERO
  const [mantissa = '0', exponent = '0'] = x.toExponential(DIGITS - 1).split('e')
  const negative = mantissa.startsWith('-')
  const digits = mantissa.replace(/[-.]/g, '')
  return make(negative, BigInt(digits), Number(exponent) - (DIGITS - 1))
}

export type Angle = 0 | 1 | 2
const TO_RADIANS: Record<Angle, number> = { 0: Math.PI / 180, 1: 1, 2: Math.PI / 200 }

/** A turn in the angle's unit, for reducing a degree or grad angle exactly first. */
const TURN: Record<Angle, Dec | null> = { 0: fromInt(360), 1: null, 2: fromInt(400) }

/** An angle brought into one turn, exactly; null in radians, where no turn is exact. */
function reduced(a: Dec, angle: Angle): Dec | null {
  const turn = TURN[angle]
  return turn === null ? null : sub(a, mul(floor(div(a, turn)), turn))
}

/** An angle brought into one turn, exactly where the unit allows. */
const reduce = (a: Dec, angle: Angle): number => toNumber(reduced(a, angle) ?? a)

/** Where the tangent has no value, a quarter and three quarters of a turn: degrees and grads. */
const POLES: Record<Angle, Dec[]> = {
  0: [fromInt(90), fromInt(270)],
  1: [],
  2: [fromInt(100), fromInt(300)],
}

/** What a sine or cosine too small to be anything but rounding comes to. */
const settle = (x: number): Dec => fromNumber(Math.abs(x) < 1e-12 ? 0 : x)

export function sin(a: Dec, angle: Angle): Dec {
  return settle(Math.sin(reduce(a, angle) * TO_RADIANS[angle]))
}

export function cos(a: Dec, angle: Angle): Dec {
  return settle(Math.cos(reduce(a, angle) * TO_RADIANS[angle]))
}

/**
 * The tangent. Its poles are decided on the exactly reduced angle, never on a cosine rounded
 * to 0, so 89.9999999999 degrees has a (large) value and 90 has none. A radian angle is
 * never exactly at one.
 */
export function tan(a: Dec, angle: Angle): Dec {
  const r = reduced(a, angle)
  if (r !== null && POLES[angle].some((pole) => compare(r, pole) === 0)) throw domain()
  return settle(Math.tan(toNumber(r ?? a) * TO_RADIANS[angle]))
}

const inverse = (x: number, angle: Angle): Dec => fromNumber(x / TO_RADIANS[angle])

export function asin(a: Dec, angle: Angle): Dec {
  const x = toNumber(a)
  if (x < -1 || x > 1) throw domain()
  return inverse(Math.asin(x), angle)
}

export function acos(a: Dec, angle: Angle): Dec {
  const x = toNumber(a)
  if (x < -1 || x > 1) throw domain()
  return inverse(Math.acos(x), angle)
}

export const atan = (a: Dec, angle: Angle): Dec => inverse(Math.atan(toNumber(a)), angle)

export function ln(a: Dec): Dec {
  if (a.neg || a.coeff === 0n) throw domain()
  return fromNumber(Math.log(toNumber(a)))
}

/** The common logarithm: exact for a power of ten. */
export function log(a: Dec): Dec {
  if (a.neg || a.coeff === 0n) throw domain()
  if (a.coeff === SCALE) return fromInt(a.exp)
  return fromNumber(Math.log10(toNumber(a)))
}

export const exp = (a: Dec): Dec => fromNumber(Math.exp(toNumber(a)))

/** a ^ b: by repeated multiplication for a whole power (exact), else through logarithms. */
export function pow(a: Dec, b: Dec): Dec {
  if (compare(floor(b), b) === 0) {
    const k = toBigInt(b)
    if (k >= -999n && k <= 999n) return powInt(a, Number(k))
  }
  if (a.neg) throw domain()
  if (a.coeff === 0n) {
    if (b.neg) throw new DecError(ERR.divideByZero, 'division by zero')
    return ZERO
  }
  return fromNumber(toNumber(a) ** toNumber(b))
}

function powInt(a: Dec, k: number): Dec {
  if (k === 0) return fromInt(1)
  if (k < 0) return reciprocalPower(a, -k)
  let result = fromInt(1)
  let base = a
  let n = k
  while (n > 0) {
    if (n & 1) result = mul(result, base)
    n >>= 1
    if (n > 0) base = mul(base, base)
  }
  return result
}

/**
 * a ^ -k: a power too large to hold has a reciprocal too small to show (0, as any result
 * under 1E-99 is), and one too small to show has a reciprocal too large.
 */
function reciprocalPower(a: Dec, k: number): Dec {
  let p: Dec
  try {
    p = powInt(a, k)
  } catch (e) {
    if (e instanceof DecError && e.code === ERR.overflow) return ZERO
    throw e
  }
  if (p.coeff === 0n && a.coeff !== 0n) throw overflow()
  return div(fromInt(1), p)
}

/* ---------------- memory ---------------- */

export function encode(d: Dec): Uint8Array {
  const out = new Uint8Array(8)
  if (d.coeff === 0n) return out
  out[0] = d.neg ? 0x80 : 0
  out[1] = d.exp & 0xff
  const digits = d.coeff.toString().padStart(DIGITS, '0')
  for (let k = 0; k < 6; k++) {
    out[2 + k] = (Number(digits[2 * k]) << 4) | Number(digits[2 * k + 1])
  }
  return out
}

/** Eight bytes back to a number, or null when they are not one (a stray flag, a bad digit). */
export function decode(bytes: ArrayLike<number>): Dec | null {
  const flags = bytes[0] ?? 0
  if ((flags & 0x7f) !== 0) return null
  let digits = ''
  for (let k = 2; k < 8; k++) {
    const b = bytes[k] ?? 0
    if (b >> 4 > 9 || (b & 15) > 9) return null
    digits += `${b >> 4}${b & 15}`
  }
  const coeff = BigInt(digits)
  const exp = (((bytes[1] ?? 0) << 24) >> 24) as number
  if (coeff === 0n) return exp === 0 && flags === 0 ? ZERO : null
  if (coeff < SCALE || exp > 99 || exp < -99) return null
  return { neg: (flags & 0x80) !== 0, exp, coeff }
}

/* ---------------- text ---------------- */

/**
 * The number at the start of `text` (digits, a point, an exponent with E): the number and how
 * many characters it took, or null when it does not start with one. No sign: BASIC reads
 * a minus as an operator.
 */
export function parse(text: string): { value: Dec; length: number } | null {
  const m = /^(\d*)(?:\.(\d*))?(?:E([+-]?\d{1,3}))?/i.exec(text)
  const whole = m?.[1] ?? ''
  const fraction = m?.[2] ?? ''
  if (m === null || (whole === '' && fraction === '')) return null
  // An E with no digits after it is not part of the number ("2E" is 2 then E).
  const exponentPart = m[3]
  const length =
    exponentPart === undefined
      ? whole.length + (m[2] !== undefined ? fraction.length + 1 : 0)
      : m[0].length
  const e = exponentPart === undefined ? 0 : Number(exponentPart)
  const n = BigInt(`${whole}${fraction}` || '0')
  return { value: make(false, n, e - fraction.length), length }
}

/**
 * The number as a pocket computer shows it, in at most `digits` significant digits (ten on
 * the display): a whole number or a decimal while that fits, else with an exponent
 * ("1.234567891E15", "5E-12"). Trailing zeros go; a negative number has its minus.
 */
export function format(d: Dec, digits = 10): string {
  if (d.coeff === 0n) return '0'
  const cut = 10n ** BigInt(DIGITS - digits)
  let coeff = d.coeff / cut
  if (d.coeff % cut >= (cut + 1n) / 2n) coeff++
  let exp = d.exp
  if (coeff === 10n ** BigInt(digits)) {
    // Rounded up past the largest exponent, it would read back as an overflow: all digits.
    if (exp === 99) return format(d, DIGITS)
    coeff /= 10n
    exp++
  }
  const text = coeff.toString().replace(/0+$/, '')
  const sign = d.neg ? '-' : ''
  if (exp >= 0 && exp < digits) {
    const all = text.padEnd(exp + 1, '0')
    const tail = all.slice(exp + 1)
    return `${sign}${all.slice(0, exp + 1)}${tail === '' ? '' : `.${tail}`}`
  }
  // A small number written out while its digits after the point still fit the display.
  if (exp < 0 && -exp - 1 + text.length <= digits) return `${sign}0.${'0'.repeat(-exp - 1)}${text}`
  const mantissa = text.length > 1 ? `${text[0]}.${text.slice(1)}` : text
  return `${sign}${mantissa}E${exp}`
}
