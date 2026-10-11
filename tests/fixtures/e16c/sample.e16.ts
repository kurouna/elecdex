// e16c's sample program: the subset at work, run both as TypeScript and on the machine by
// tests/unit/e16c.test.ts. Every function answers a word, so the two can be compared.
import {
  addr,
  bytes,
  div,
  i16,
  idiv,
  memcpy,
  memset,
  mulShift,
  peek,
  poke,
  str,
  u8,
  u16,
  words,
  wrap16,
} from '../../../src/shared/e16c/builtins'

const LIMIT = 10
const TWICE = LIMIT * 2
const GREETING = str('HELLO, ELEC-16')

const buffer = bytes(32)
const table = words(8)
let calls: u16 = 0

export function fib(n: u16): u16 {
  calls += 1
  if (n < 2) return n
  return fib(n - 1) + fib(n - 2)
}

export function callsSoFar(): u16 {
  return calls
}

export function gcd(a: u16, b: u16): u16 {
  while (b !== 0) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

/** The length of a string ended by a zero. */
export function length(at: u16): u16 {
  let n: u16 = 0
  while (peek(at + n) !== 0) n++
  return n
}

export function greetingLength(): u16 {
  return length(GREETING)
}

/** Fills the buffer with a falling sequence, sorts it and answers a checksum of the order. */
export function sortBytes(count: u16): u16 {
  for (let i: u16 = 0; i < count; i++) buffer[i] = wrap16(200 - i * 7) & 0xff
  for (let i: u16 = 1; i < count; i++) {
    const v: u8 = buffer[i]
    let j: u16 = i
    while (j > 0 && buffer[j - 1] > v) {
      buffer[j] = buffer[j - 1]
      j--
    }
    buffer[j] = v
  }
  let check: u16 = 0
  for (let i: u16 = 0; i < count; i++) check = wrap16(check * 3 + buffer[i])
  return check
}

export function squares(): u16 {
  for (let i: u16 = 0; i < 8; i++) table[i] = i * i
  let sum: u16 = 0
  for (let i: u16 = 0; i < 8; i++) sum += table[i]
  return sum
}

/** Signed arithmetic and comparison. */
export function signedMix(a: i16, b: i16): i16 {
  let r: i16 = 0
  if (a < b) r = r + 1
  if (a - b < -5) r = r + 10
  r = r + div(a, 3)
  r = r + (a >> 1)
  return r
}

export function classify(c: u16): u16 {
  switch (c) {
    case 0:
      return 100
    case 1:
    case 2:
      return 200
    case TWICE:
      return 300
    default:
      return c > LIMIT && c < 50 ? 400 : 500
  }
}

export function logic(a: u16, b: u16): u16 {
  let r: u16 = 0
  if (a > 3 && b > 3) r |= 1
  if (a > 3 || b > 3) r |= 2
  if (!(a === b)) r |= 4
  if (a !== 0 && b !== 0) r |= 8
  return r
}

export function bufferAt(): u16 {
  poke(addr(buffer) + 1, 77)
  return buffer[1]
}

export function breaks(): u16 {
  let n: u16 = 0
  for (let i: u16 = 0; i < 100; i++) {
    if (i % 2 === 0) continue
    if (i > 15) break
    n += i
  }
  do {
    n++
  } while (n < 70)
  return n
}

function identity(x: u16): u16 {
  return x
}

/** A ?: and then a call: the call must find the stack as deep as the source says. */
export function choiceThenCall(flag: u16): u16 {
  let m: u16 = flag !== 0 ? 16 : 32
  m |= 1
  return identity(m) + identity(flag > 2 ? 100 : 200)
}

function pair(x: u16, y: u16): u16 {
  return x * 100 + y
}

/** A call among another call's arguments: what was worked out before it must survive it. */
export function nestedArguments(a: u16): u16 {
  return pair(a + 1, identity(a) * 2) + pair(identity(a), a + 3)
}

/** ?: whose answers are not constants. */
export function pick(c: u16, x: u16, y: u16): u16 {
  return (c !== 0 ? x : y) + (c > 5 ? y : x)
}

function sum4(a: u16, b: u16, c: u16, d: u16): u16 {
  return wrap16(a * 1000 + b * 100 + c * 10 + d)
}

/** Every argument a call, but the last: they must arrive in their order. */
export function nestedCalls(): u16 {
  return sum4(identity(1), identity(2), identity(3), 4) + sum4(identity(5) + 1, 0, identity(0), 1)
}

/** A constant under many values at once, more than there are temporaries. */
export function deepExpression(a: u16, b: u16): u16 {
  return wrap16(1 + (a + 1 + (b + 1 + (a + 2 + (b + 2 + (a + 3 + (b + 3 + (a + 4 + (b + 4)))))))))
}

/** Readings changed on purpose, alike in TypeScript and on the machine. */
export function readings(x: u16): u16 {
  const low: u8 = u8(x)
  const s: i16 = i16(x)
  let r: u16 = low
  if (s < 0) r += 1000
  r += u16(s) & 0x0f
  return r + (x & 0xff)
}

/** Conditions as branches: !, && and || mixed and nested, and ones known while compiling. */
export function conditions(a: u16, b: u16, c: u16): u16 {
  let r: u16 = (a > 1 && (b > 1 || c > 1)) || (a === 0 && c === 0) ? 7 : 9
  if (!(a > 1 || !(b === 2))) r += 100
  // biome-ignore lint/correctness/noConstantCondition: one known while compiling, on purpose
  if (false) r += 1000
  while (true) {
    if (r > 50 || !(c !== 3)) break
    r += 10
  }
  let n: u16 = 0
  do n++
  while (!(n >= 3 && b !== n))
  return r + n
}

/** An index plus or minus a constant, read and written, across calls and in a loop. */
export function offsets(k: u16): u16 {
  for (let i: u16 = 0; i < 8; i++) buffer[i + 2] = wrap16(i * 3 + k)
  buffer[identity(2)] += identity(3)
  let s: u16 = buffer[k + 1] + buffer[k - 1 + 4]
  let p: u16 = 7
  table[p - 3] = buffer[p]
  p = 1
  s += table[4] + buffer[p + 1] + buffer[identity(p) + 2]
  for (let i: u16 = 9; i > 2; i--) s += buffer[i - 1]
  return s
}

/** A leaf with four parameters and more locals than spare registers, a ?: deep inside. */
export function leafMany(a: u16, b: u16, c: u16, d: u16): u16 {
  const e: u16 = a + b
  const f: u16 = c ^ d
  const g: u16 = e - f
  const h: u16 = wrap16(g * 5)
  return wrap16(a + (b + (c + (d + (e > f ? g : h)))) + f)
}

/** Multiplying, dividing and taking the remainder by constants that become shifts. */
export function constants(x: u16, s: i16): u16 {
  let r: u16 = wrap16(x * 2 + x * 3 + x * 7 + x * 10 + x * 12 + x * 1 + x * 0x8000)
  r = wrap16(r + (x % 8) + div(x, 16) + (x % 10) + div(x, 3))
  return wrap16(r + u16(wrap16(s * 4)) + u16(div(s, 4)) + u16(s % 4))
}

/** A switch on a local that a case changes, inside a loop with continue and shared cases. */
export function switchLoop(n: u16): u16 {
  let r: u16 = 0
  for (let i: u16 = 0; i < n; i++) {
    let c: u16 = i % 5
    switch (c) {
      case 0:
        c = 3
        r += c
        break
      case 4:
      case 1:
        r += c
        break
      case 2:
        continue
      default:
        r += 100
        break
    }
    r += 1000
  }
  return r
}

/** Shifts by a variable, recursion writing an array, and locals kept across calls in a loop. */
export function misc(n: u16): u16 {
  let a: u16 = 1
  let b: u16 = 2
  const c: u16 = 3
  const d: u16 = 4
  let e: u16 = 5
  for (let i: u16 = 0; i < n; i++) {
    a = identity(a + b)
    b = identity(c ^ d) + e
    e = wrap16((e << (i & 3)) + (a >> (b & 7)))
  }
  fill(5)
  return wrap16(a + b + c + d + e + table[0] + table[5])
}

function fill(k: u16): void {
  if (k === 0) return
  table[k] = k * k
  fill(k - 1)
}

/** Calls that stay calls at every level, several inside one argument list. */
export function callsInArguments(x: u16): u16 {
  return sum4(pair(x, 2), pair(3, x), 1, pair(x, x))
}

/** A counter that a call moves: never inlined, and seen by the caller. */
let cursor: u16 = 0

function nextIndex(): u16 {
  cursor++
  return identity(cursor)
}

function counted(x: u16, y: u16): u16 {
  calls += 1
  return identity(x * 100 + y)
}

/**
 * A sum left to add (a register and a constant) among a call's arguments and beside a
 * comparison: the register it reads must not be taken for an argument first.
 */
export function pendingSums(k: u16): u16 {
  cursor = 0
  table[k] = 3
  const a = counted(k, nextIndex() + 1)
  const b = 7 + (table[k] + 1 > 3 ? k : 2)
  return wrap16(a + b * 1000)
}

/** An element stepped and added to by index: the index is worked out once. */
export function stepByIndex(): u16 {
  cursor = 0
  buffer[1] = 0
  buffer[2] = 0
  buffer[nextIndex()]++
  buffer[nextIndex()] += 5
  return cursor * 100 + buffer[1] * 10 + buffer[2]
}

/** A pure function giving a string's address: never worked out at compile time. */
function labelOf(k: u16): u16 {
  return k === 0 ? str('NO') : str('YES')
}

export function stringByCall(): u16 {
  return peek(labelOf(1)) * 256 + peek(labelOf(0) + 1)
}

/**
 * Five answers and a choice across a branch: the picture full, its registers a cycle that is
 * undone with none to spare (-O1 once spilled under the picture and returned to garbage).
 */
export function fullPicture(x: u16): u16 {
  return wrap16(
    identity(1) +
      (identity(2) + (identity(3) + (identity(4) + (identity(5) + (x !== 0 ? 10 : 20))))),
  )
}

/**
 * A constant condition whose other arm has labels of its own: all of it goes (-O2 once kept a
 * piece that fell through into live code at another depth).
 */
export function deadArm(x: u16): u16 {
  let r: u16 = 0
  if (wrap16(1) !== 0) {
    r = x + 1
  } else {
    r = (x > 3 ? (x > 5 ? 1 : 2) : 3) & (x !== 7 ? 9 : 8)
  }
  return r
}

const marks = bytes(4)
const cells = words(4)

/**
 * Any word into an element, a constant or a signed value: both runs cut it to the element's
 * width (e16c once refused -1 and 300 here, and an i16).
 */
export function elementsCut(s: i16): u16 {
  marks[0] = -1
  marks[1] = 300
  cells[0] = -1
  cells[1] = s
  return wrap16(marks[0] * 256 + marks[1]) ^ cells[0] ^ cells[1]
}

/** A negative constant with no type said is an i16 in a function too, as at the top level. */
export function negativeLocal(x: i16): u16 {
  let k = -1
  k = k * 3 + x
  return u16(k)
}

const blocks = bytes(24)

/**
 * memset and memcpy, the second over itself both ways: MSET and MCPY, a step at a time, and
 * k still k after them (their registers are a0-a2, where a leaf keeps its arguments).
 */
export function blockMoves(k: u16): u16 {
  const at = addr(blocks)
  memset(at, 0x1ab, 24)
  for (let i: u16 = 0; i < 10; i++) poke(at + i, i + k)
  memcpy(at + 3, at, 9)
  memcpy(at + 12, at + 14, 6)
  let sum: u16 = 0
  for (let i: u16 = 0; i < 24; i++) sum = wrap16(sum * 3 + peek(at + i))
  return wrap16(sum + k)
}

/**
 * A signed division by a value that may be 0 is idiv: -1 then in both runs (div's 65535 read
 * as an i16 was -1 on the machine and 65535 in TypeScript).
 */
export function signedQuotient(a: i16, b: i16): u16 {
  const q = idiv(a, b)
  return q < 0 ? 1000 + u16(-q) : u16(q)
}

/**
 * A ?: of the numbers 0 and 1 is a number, as TypeScript has it: once a truth, which refused a
 * 3 beside it in an outer ?:, a 7 put after into the variable it started, and an i16 argument.
 */
export function numberPicks(x: u16): u16 {
  const r: u16 = x > 5 ? 1 | 2 : x > 2 ? 1 : 0
  let k = x > 4 ? 1 : 0
  k = k + 7
  return r * 100 + k * 10 + u16(signedOne(x > 3 ? 0 : 1) + 1)
}

function signedOne(v: i16): i16 {
  return v - 1
}

/**
 * A fixed-point product (MULQ): Q14 values whose product leaves 16 bits before its shift,
 * which `(a * b) >> 14` loses; by 0 it is MUL's low half, and constants are worked out
 * while compiling. An argument the machine reads otherwise in a register - a sum held only
 * by i16() - and a u8 beside an i16.
 */
export function fixedProducts(a: i16, b: i16): u16 {
  const q = mulShift(a, b, 14)
  const low = mulShift(a, b, 0)
  const byte = mulShift(u8(a), b, 3)
  const known = mulShift(-12000, 30000, 15)
  const sum = mulShift(i16(a + b), 16384, 14)
  return u16(q + low * 3 + byte * 5 + known + sum * 7)
}

/**
 * Unsigned division and remainder by constants that are no power of two (MULHU from -O1): a
 * 16-bit multiplier, one after the divisor's factors of two (100, 60), one of 17 bits (7), a
 * quotient into its operand's own register and a remainder that reads its operand again.
 */
export function constantQuotients(a: u16, b: u16): u16 {
  const q = wrap16(div(a, 10) + div(a, 7) * 3 + div(b, 100) + div(a, 65535) + div(b, 40000))
  const r = wrap16((a % 10) + (b % 7) * 5 + (a % 60) + (b % 641) + (a % 65535) * 9)
  return wrap16(q * 31 + r + div(wrap16(a + b), 3) + (wrap16(b * 3) % 1000))
}

function scaleBy(x: u16, k: u16): u16 {
  return wrap16(x * k)
}

function bumped(x: u16, k: u16): u16 {
  x = wrap16(x + k)
  return wrap16(x * 2)
}

function byteAt(at: u16, k: u16): u16 {
  return peek(at + k)
}

/**
 * Leaves inlined at -O2 with their arguments read in place of their parameters: a constant,
 * a local written again after the call, an address; a parameter the callee writes stored as
 * before; a computed first argument beside a constant second.
 */
export function inlinedArguments(n: u16): u16 {
  let s: u16 = 0
  for (let i: u16 = 0; i < 4; i++) {
    s = wrap16(s + scaleBy(i, 6) + bumped(n, i))
    n = wrap16(n + scaleBy(s, n))
  }
  poke(addr(buffer) + 3, 77)
  return wrap16(s + n + byteAt(addr(buffer), 3) + scaleBy(wrap16(n + 1), 5))
}

let kept: u16 = 0

/** A call between the locals below: more than a few operations, called often, never inlined. */
function keep(v: u16): u16 {
  kept = wrap16(kept * 3 + v)
  kept = kept ^ (v >> 1)
  return kept
}

/** Each called once, and writing its parameter: inlined at -O2 with a slot of its own. */
function doubled(v: u16): u16 {
  v = wrap16(v + v)
  return wrap16(v + 1)
}

function tripled(v: u16): u16 {
  v = wrap16(v * 3)
  return wrap16(v + 2)
}

/**
 * Locals one after another, each dead once handed on: from -O1 they share places, and the
 * function needs no frame. Then a local, and a sum on it, read into an expression and still
 * waiting there while calls put a value on the machine's stack above them and an inlined
 * body writes its parameter: a place shared with that parameter would be written under them.
 */
export function oneAfterAnother(x: u16): u16 {
  kept = 0
  const a = wrap16(x + 1)
  keep(a)
  const b = wrap16(a * 5 + x)
  keep(b)
  const c = wrap16(x + 3)
  keep(c)
  const d = wrap16(c + b)
  keep(d)
  const e = wrap16(x ^ 0x55)
  keep(e)
  const f = wrap16(x * 3)
  const g = wrap16(f + (keep(1) + (keep(x) + doubled(x))))
  const h = wrap16(x * 7)
  return wrap16(g + (h + 1) + (keep(2) + (keep(h) + tripled(h))))
}

/**
 * More locals alive at once than registers hold, round calls: some live in a frame, read by
 * sp while calls' answers wait on the machine's stack above it, in a loop and after it.
 */
export function manyAlive(x: u16): u16 {
  kept = 0
  const a = wrap16(x + 1)
  const b = wrap16(x * 3)
  const c = keep(a)
  const d = wrap16(b ^ c)
  const e = keep(d)
  const f = wrap16(e + a)
  let s: u16 = 0
  for (let i: u16 = 0; i < 3; i++) {
    s = wrap16(s + keep(i) * (a + keep(b) + (c + keep(d) + (e + keep(f)))))
  }
  return wrap16(
    s + a + b + c + d + e + f + keep(wrap16(a + keep(wrap16(b + keep(wrap16(c + keep(f))))))),
  )
}

/** Three arguments, read in an order of its own: called often, never inlined. */
function mix3(a: u16, b: u16, c: u16): u16 {
  kept = wrap16(kept * 5 + a)
  return wrap16((a ^ (b << 1)) + c * 3 + kept)
}

/**
 * Arguments computed straight into their registers: masks, sums, loads from an array, a
 * call's answer in a0 read into another argument, arguments that read each other's sources,
 * and a value moved into an argument after another argument was written.
 */
export function argsInPlace(x: u16, y: u16): u16 {
  kept = 0
  table[3] = wrap16(x * 7)
  let s = mix3(x & 31, y & 31, wrap16(x + y))
  s = wrap16(s + mix3(table[3], wrap16(s - x), y ^ s))
  s = wrap16(s + mix3(keep(x) & 7, wrap16(keep(y) + 1), s))
  s = wrap16(s + mix3(y, x, wrap16(mix3(s, y, x) + 2)))
  return wrap16(s + keep(wrap16(s + table[3])))
}

/**
 * Division and remainder by constants with many values waiting in registers around them, so
 * the temporaries MULHU's way needs are found by putting others on the machine's stack.
 */
export function quotientsUnderLoad(a: u16, b: u16): u16 {
  const p = wrap16(
    a * 3 +
      wrap16(b * 5) *
        wrap16(
          wrap16(a * 7) +
            wrap16(
              wrap16(b * 9) +
                wrap16(wrap16(a * 11) + wrap16(div(b, 7) + (a % 100) + div(wrap16(a + b), 641))),
            ),
        ),
  )
  return wrap16(p + (b % 7) * div(p, 10))
}
