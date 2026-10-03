// e16c's sample program: the subset at work, run both as TypeScript and on the machine by
// tests/unit/e16c.test.ts. Every function answers a word, so the two can be compared.
import {
  addr,
  bytes,
  div,
  i16,
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
