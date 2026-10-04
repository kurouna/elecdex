// ELEC-16 BASIC, ROM bank 5: ASK, the AI through LINK (docs/elec16.md section 12). Its code
// runs with bank 5 in the window; the interpreter's core (basic.e16.ts) calls it through
// far_call. The question goes out through the ROM's service 8 (link.s), which waits for the
// answer asleep and lets BRK stop the wait.
import {
  type bool,
  type i16,
  peek,
  poke,
  poke16,
  str,
  u16,
} from '../../../../src/shared/e16c/builtins'
import {
  checkBreak,
  E_ARGUMENT,
  E_LINK,
  E_LINK_HELD,
  E_LINK_OFF,
  E_TYPE,
  expect,
  expr,
  fail,
  move,
  nameIsString,
  needString,
  next,
  nsp,
  setNsp,
  setTxt,
  step,
  stringAt,
  stringLength,
  strType,
  tempString,
  toInt,
  top,
  txt,
  varAt,
  varRoom,
} from './basic.e16'
import {
  BRKFLAG,
  CH_COMMA,
  LINK_CMD,
  LINK_FRESH,
  LINK_ST_BAD_REQUEST,
  LINK_ST_CANCELLED,
  LINK_ST_HELD,
  LINK_ST_OFF,
  link,
} from './rom.e16'
import { T_NEW, T_TYPE } from './text.e16'

/** The AI's types by name, in order (link-services.ts AI_TYPES; a test holds them alike). */
export const AI_TYPE_NAMES = str(
  'NORMAL TUTOR BASIC QUIZ STORY POET FORTUNE DICT TRANS SEARCH WEATHER',
)
const AI_TYPES = 11

/** The type ASK asks with: ASK TYPE sets it, and it stays until the machine starts afresh. */
let askType: u16 = 0

/** ASK q$, a$ - and ASK NEW, ASK TYPE t. */
export function askStatement(): void {
  // The ASK itself, just before the text: BRK while it waits makes CONT ask again.
  const again = txt - 1
  if (next() === T_NEW) {
    step()
    poke16(LINK_CMD, LINK_FRESH)
    return
  }
  if (next() === T_TYPE) {
    step()
    askType = typeArgument()
    return
  }
  ask(again)
}

/**
 * ASK q$, a$: the question put to the AI, its answer into a$ - at most as long as a$ holds,
 * which is what the AI is told it has. BRK while it waits stops the program there (CONT asks
 * again); the rest that goes wrong is an error.
 */
function ask(again: u16): void {
  expr()
  needString()
  const n = stringLength(top())
  if (n === 0) fail(E_ARGUMENT)
  const question = tempString(n + 1)
  move(stringAt(top()), question, n)
  poke(question + n, 0)
  setNsp(nsp - 8)
  expect(CH_COMMA)
  const at = varAt(true)
  if (!nameIsString) fail(E_TYPE)
  const room = varRoom
  const reply = tempString(room + 1)
  const got: i16 = link(question, reply, room, askType)
  if (got < 0) failed(u16(-got), again)
  move(reply, at + 1, u16(got))
  poke(at, u16(got))
}

/** LINK's STATUS for a question it did not answer: BREAK for BRK, else the error it is. */
function failed(status: u16, again: u16): void {
  if (status === LINK_ST_CANCELLED) {
    setTxt(again)
    poke16(BRKFLAG, 1)
    checkBreak()
  }
  if (status === LINK_ST_OFF) fail(E_LINK_OFF)
  if (status === LINK_ST_HELD) fail(E_LINK_HELD)
  if (status === LINK_ST_BAD_REQUEST) fail(E_ARGUMENT)
  fail(E_LINK)
}

/** ASK TYPE's type: its name as a string ("QUIZ"), or its number; ARGUMENT for neither. */
function typeArgument(): u16 {
  expr()
  if (strType) {
    const found = typeNamed(stringAt(top()), stringLength(top()))
    setNsp(nsp - 8)
    if (found >= AI_TYPES) fail(E_ARGUMENT)
    return found
  }
  const n = toInt(top())
  setNsp(nsp - 8)
  if (n < 0 || n >= AI_TYPES) fail(E_ARGUMENT)
  return u16(n)
}

/** The number of the type named by the `length` characters at `at`; AI_TYPES when none is. */
function typeNamed(at: u16, length: u16): u16 {
  let p = AI_TYPE_NAMES
  let k: u16 = 0
  while (peek(p) !== 0) {
    let q = p
    while (peek(q) !== 0 && peek(q) !== 0x20) q++
    if (q - p === length && same(p, at, length)) return k
    p = peek(q) === 0 ? q : q + 1
    k++
  }
  return AI_TYPES
}

function same(a: u16, b: u16, length: u16): bool {
  for (let k: u16 = 0; k < length; k++) {
    if (peek(a + k) !== peek(b + k)) return false
  }
  return true
}
