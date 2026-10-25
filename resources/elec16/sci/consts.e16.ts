// ELEC-16 SCI, ROM bank 10: the physical constants (CONST, SHIFT FUNC), the conversions of
// units (CONV, SHIFT MENU) and the names of v2's tokens (docs/elec16-sci.md sections 14.2-14.4).
// The tables are packed strings, fields between |, read only in this bank: what another bank
// needs - a token's name, a constant's value - is copied into RAM first.

import {
  addr,
  type bool,
  bytes,
  peek,
  poke16,
  str,
  type u16,
} from '../../../src/shared/e16c/builtins'
import { K_AC, K_DOWN, K_UP, refuse } from './calc.e16'
import { binary } from './eval.e16'
import { exactLiteral } from './exact.e16'
import { digitOf } from './keymap.e16'
import { bandWith, lineY, textAt } from './lcd.e16'
import {
  clearStack,
  copyValue,
  inexact,
  KEEP_ANS,
  M_ADD,
  M_DIV,
  M_MUL,
  M_PARSE,
  M_SUB,
  MATH_ARG,
  math,
  push,
  pushInt,
  top,
} from './numbers.e16'

/** A field copied out of a table, ended by a zero: a name, a value, a line of a screen. */
const fieldText = bytes(24)

/**
 * Field `n` of the packed table at `table` (fields between |) copied into fieldText from
 * place `from` on: where its zero went.
 */
function fieldInto(table: u16, n: u16, from: u16): u16 {
  let p = table
  for (let k: u16 = 0; k < n; k++) {
    while (peek(p) !== 0x7c) {
      // Past the table's last field: nothing.
      if (peek(p) === 0) {
        fieldText[from] = 0
        return from
      }
      p++
    }
    p++
  }
  let i = from
  while (peek(p) !== 0x7c && peek(p) !== 0 && i < 23) {
    fieldText[i] = peek(p)
    i++
    p++
  }
  fieldText[i] = 0
  return i
}

/* ---------------- the names of v2's tokens ---------------- */

/**
 * A0-BD: the functions, ∠, the matrices, mod and a program's words; empty for a code with none.
 * ∫ is 97, Σ 90, Π E5, ∠ 98, ⇒ E1, ≠ E2, ≤ E3, ≥ E4.
 */
function wordTable(): u16 {
  return str(
    'd/dx(|\x97(|\x90(|arg(|conj(|Re(|Im(|det(|trn(|dot(|cross(|angle(|\xe5(||||\x98|MatA|MatB|MatC|MatD|MatAns| mod ||\xe1|\xe2|\xe3|\xe4|lbl |goto ',
  )
}

/**
 * A v2 token's name (tokens.e16.ts tokenText from A0), in RAM so any bank reads it; 0 for a
 * code that is no token.
 */
export function extName(t: u16): u16 {
  let n: u16 = 0
  if (t >= 0xe0) n = fieldInto(namedTable(), t - 0xe0, 0)
  else if (t >= 0xc0) n = fieldInto(constTable(), (t - 0xc0) * 3, 0)
  else if (t >= 0xa0) n = fieldInto(wordTable(), t - 0xa0, 0)
  else n = fieldInto(statTable(), t - 0x97, 0)
  return n === 0 ? 0 : addr(fieldText)
}

/**
 * E0-FD, S5's functions and those after it: the hyperbolic ones and their inverses (⁻¹ is 86),
 * abs( gcd( lcm( int( round( pol( rec( rand, BASE's logic, STATS' Σy Σy² Σxy r a b (Σ 90, ² 84),
 * the estimates x′( y′( (′ 89), c and x₂′( (₂ 93). Small letters, as they go into the line.
 */
function namedTable(): u16 {
  return str(
    'sinh(|cosh(|tanh(|sinh\x86(|cosh\x86(|tanh\x86(|abs(|gcd(|lcm(|int(|round(|pol(|rec(|rand| AND | OR | XOR | XNOR |not(|neg(|\x90y|\x90y\x84|\x90xy|r|a|b|x\x89(|y\x89(|c|x\x93\x89(',
  )
}

/** 97-9F, STATS' n x̄ σx sx ȳ σy sy Σx Σx² (x̄ 95, ȳ 96, σ 91). */
function statTable(): u16 {
  return str('n|\x95|\x91x|sx|\x96|\x91y|sy|\x90x|\x90x\x84')
}

/* ---------------- CONST ---------------- */

/**
 * The constants, CODATA 2022 in twelve digits (section 14.3): its name, what it is, its value,
 * five a page. ₀ is 99, ₑ 9A, ₚ 9B, ₙ 9C, ħ 9D, ε 9E, μ 9F, α E0, σ 91, π 80.
 */
function constTable(): u16 {
  return str(
    'c\x99|LIGHT|299792458|h|PLANCK|6.62607015E-34|\x9d|PLANCK/2\x80|1.05457181765E-34|G|GRAVITATION|6.67430E-11|\x9e\x99|ELECTRIC|8.8541878188E-12|\x9f\x99|MAGNETIC|1.25663706127E-6|q\x9a|CHARGE|1.602176634E-19|m\x9a|ELECTRON|9.1093837139E-31|m\x9b|PROTON|1.67262192595E-27|m\x9c|NEUTRON|1.67492750056E-27|u|ATOMIC MASS|1.66053906892E-27|NA|AVOGADRO|6.02214076E23|k|BOLTZMANN|1.380649E-23|R|GAS|8.31446261815|\x91|STEFAN-BOLTZMANN|5.67037441918E-8|g|GRAVITY|9.80665|atm|ATMOSPHERE|101325|a\x99|BOHR RADIUS|5.29177210544E-11|\xe0|FINE STRUCTURE|7.2973525643E-3|Vm|MOLAR VOLUME|2.24139695450E-2',
  )
}

const CONST_PAGES = 4
let constPage: u16 = 0

/** The constant token `t`'s value into `v`, a decimal alone. */
export function constValue(t: u16, v: u16): void {
  const n = fieldInto(constTable(), (t - 0xc0) * 3 + 2, 0)
  poke16(MATH_ARG, n)
  math(M_PARSE, v, addr(fieldText), 0)
  inexact(v)
}

/** SHIFT FUNC: CONST's first page. */
export function constScreen(): void {
  constPage = 0
  drawConst()
}

function drawConst(): void {
  bandWith(str('CONST'), pageText(constPage, CONST_PAGES))
  for (let r: u16 = 0; r < 5; r++) {
    const k = constPage * 5 + r
    fieldText[0] = 0x31 + r
    fieldText[1] = 0x3a
    const n = fieldInto(constTable(), k * 3, 2)
    fieldText[n] = 0x20
    fieldInto(constTable(), k * 3 + 1, n + 1)
    textAt(addr(fieldText), 1, lineY(r))
  }
  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
}

/** A key on CONST: the constant's token (the calculator types it), 1 back, 0 stay. */
export function constKey(k: u16): u16 {
  if (k === K_AC) return 1
  if (k === K_DOWN || k === K_UP) {
    constPage = turnPage(constPage, CONST_PAGES, k === K_DOWN)
    drawConst()
    return 0
  }
  const d = digitOf(k)
  if (d < 1 || d > 5) {
    refuse()
    return 0
  }
  return 0xc0 + constPage * 5 + d - 1
}

/* ---------------- CONV ---------------- */

/** The conversions, each one way and back (section 14.4); → is 94, ° 88, ² 84. */
function convTable(): u16 {
  return str(
    'in\x94cm|cm\x94in|ft\x94m|m\x94ft|yd\x94m|m\x94yd|mile\x94km|km\x94mile|nmi\x94m|m\x94nmi|acre\x94m\x84|m\x84\x94acre|gal\x94L|L\x94gal|floz\x94mL|mL\x94floz|oz\x94g|g\x94oz|lb\x94kg|kg\x94lb|\x88F\x94\x88C|\x88C\x94\x88F|km/h\x94m/s|m/s\x94km/h|kgf\x94N|N\x94kgf|atm\x94Pa|Pa\x94atm|mmHg\x94Pa|Pa\x94mmHg|kgfm\x94J|J\x94kgfm|cal\x94J|J\x94cal|hp\x94W|W\x94hp|kWh\x94MJ|MJ\x94kWh|eV\x94J|J\x94eV',
  )
}

/** What each pair's first unit is in its second: multiplied by, or divided by after a /. */
function factorTable(): u16 {
  return str(
    '2.54|0.3048|0.9144|1.609344|1852|4046.8564224|3.785411784|29.5735295625|28.349523125|0.45359237||/3.6|9.80665|101325|133.322387415|9.80665|4.184|745.699871582|3.6|1.602176634E-19',
  )
}

/** The pair °F and °C: 32 apart, 9 to 5. */
const FAHRENHEIT = 10
const CONV_PAGES = 4
let convPage: u16 = 0
/** The conversion last made (its label's field), shown over its answer. */
let convDone: u16 = 0

/** SHIFT MENU: CONV's first page. */
export function convScreen(): void {
  convPage = 0
  drawConv()
}

function drawConv(): void {
  bandWith(str('CONV'), pageText(convPage, CONV_PAGES))
  for (let r: u16 = 0; r < 5; r++) {
    convItem(r * 2, 1, lineY(r))
    convItem(r * 2 + 1, 67, lineY(r))
  }
  textAt(str('\x8d\x8e:PAGE AC:BACK'), 1, lineY(5))
}

/** Item `i` (0-9) of the page, its digit before it (1-9, then 0). */
function convItem(i: u16, x: u16, y: u16): void {
  fieldText[0] = i === 9 ? 0x30 : 0x31 + i
  fieldText[1] = 0x3a
  fieldInto(convTable(), convPage * 10 + i, 2)
  textAt(addr(fieldText), x, y)
}

/** A key on CONV: 2 when Ans was converted, 1 back, 0 stay. */
export function convKey(k: u16): u16 {
  if (k === K_AC) return 1
  if (k === K_DOWN || k === K_UP) {
    convPage = turnPage(convPage, CONV_PAGES, k === K_DOWN)
    drawConv()
    return 0
  }
  let d = digitOf(k)
  if (d === 0xffff) {
    refuse()
    return 0
  }
  if (d === 0) d = 10
  const item = convPage * 10 + d - 1
  convert(item >> 1, (item & 1) !== 0)
  convDone = item
  return 2
}

/** Ans in the other unit of pair `pair`, `back` the second unit to the first. */
function convert(pair: u16, back: bool): void {
  clearStack()
  copyValue(KEEP_ANS, push(0))
  if (pair === FAHRENHEIT) {
    if (back) {
      times(9, 5)
      pushInt(32, 0)
      binary(M_ADD, 0)
    } else {
      pushInt(32, 0)
      binary(M_SUB, 0)
      times(5, 9)
    }
  } else {
    const n = fieldInto(factorTable(), pair, 0)
    const divides = fieldText[0] === 0x2f
    const v = push(0)
    poke16(MATH_ARG, divides ? n - 1 : n)
    math(M_PARSE, v, addr(fieldText) + (divides ? 1 : 0), 0)
    exactLiteral(v)
    binary(divides === back ? M_MUL : M_DIV, 0)
  }
  copyValue(top(), KEEP_ANS)
}

/** The value on top times a/b, in its exact form where it has one. */
function times(a: u16, b: u16): void {
  pushInt(a, 0)
  binary(M_MUL, 0)
  pushInt(b, 0)
  binary(M_DIV, 0)
}

/** The last conversion's label (in→cm), for the answer it made. */
export function convLabel(): u16 {
  fieldInto(convTable(), convDone, 0)
  return addr(fieldText)
}

/* ---------------- pages and digits ---------------- */

const pageChars = bytes(4)

function pageText(page: u16, pages: u16): u16 {
  pageChars[0] = 0x31 + page
  pageChars[1] = 0x2f
  pageChars[2] = 0x30 + pages
  pageChars[3] = 0
  return addr(pageChars)
}

/** The next page down or up, with a beep at either end. */
function turnPage(page: u16, pages: u16, down: bool): u16 {
  if (down && page + 1 < pages) return page + 1
  if (!down && page > 0) return page - 1
  refuse()
  return page
}
