// ELEC-16 BASIC, ROM bank 2: the memory card - FILES, LOAD, SAVE, KILL, and the data files
// OPEN, PRINT #, INPUT #, EOF and CLOSE (docs/elec16.md sections 5 and 8). A command goes to
// the card through its block in RAM; the machine sleeps (WFI, the CARD line enabled) until
// main's answer comes. A program is kept on the card as its listing - text, a line a CR - so
// a .BAS file reads on a PC as it does here; machine code is kept as its bytes.
import {
  addr,
  type bool,
  bytes,
  peek,
  peek16,
  poke,
  poke16,
  str,
  u16,
  wfi,
  words,
} from '../../../../src/shared/e16c/builtins'
import {
  checkBreak,
  E_CARD,
  E_DATA,
  E_FILE,
  E_MEMORY,
  E_NOFILE,
  E_SYNTAX,
  E_TYPE,
  endProgram,
  expect,
  expr,
  fail,
  keepProgramTo,
  lineBuf,
  needNumber,
  needString,
  next,
  nsp,
  outFile,
  printItems,
  readUnsigned,
  setFilesOpen,
  setInt,
  setNsp,
  setOutFile,
  setStrType,
  setTxt,
  statementEnds,
  step,
  storeTypedLine,
  stringAt,
  stringLength,
  toInt,
  top,
  toWord,
  unary,
  varAt,
  varEnd,
  varRoom,
} from './basic.e16'
import {
  CARD_BLOCK,
  CARD_CMD,
  CARD_RESULT,
  CARD_RESULT_HIGH,
  CARD_STATUS,
  CH_COMMA,
  CH_DOT,
  CH_HASH,
  CH_QUOTE,
  CH_SPACE,
  CODE_AREA,
  CODE_AREA_END,
  K_ENTER,
  newline,
  PROG,
  putc,
  puts,
} from './rom.e16'
import { takeItem } from './strings.e16'
import {
  expand,
  printUnsigned,
  T_APPEND,
  T_AS,
  T_CLOSE,
  T_FILES,
  T_FOR,
  T_INPUT,
  T_KILL,
  T_LOAD,
  T_OPEN,
  T_OUTPUT,
  T_SAVE,
  unsignedText,
} from './text.e16'

const OP_DIR = 1
const OP_READ = 2
const OP_WRITE = 3
const OP_DELETE = 4
const OP_FREE = 6
const ST_BUSY = 1
const ST_NOFILE = 2
const ST_BADNAME = 3
/** WRITE at this offset adds to the file's end (and makes it when there is none). */
const APPEND = 0xffff
const LF = 0x0a

/** The command block: name [12], new name [12], offset, address, length. */
const cardBlock = bytes(32)
const cardBuf = bytes(256)
/** A byte holding 0: where the text is left after LOAD replaced the line it was in. */
const nothing = bytes(2)

/** The two data files: 0 closed, 1 read (INPUT), 2 written (OUTPUT, APPEND). */
const fileMode = bytes(2)
const fileName = bytes(24)
const fileOffset = words(2)
const fileLen = words(2)
const filePos = words(2)
const fileBuf = bytes(128)
const FILE_BUF = 64

/* ---------------- the card ---------------- */

/** A command with the name in the block; the status when main has answered. */
function cardCall(op: u16, offset: u16, at: u16, length: u16): u16 {
  const b = addr(cardBlock)
  poke16(b + 24, offset)
  poke16(b + 26, at)
  poke16(b + 28, length)
  poke16(CARD_BLOCK, b)
  poke16(CARD_CMD, op)
  for (;;) {
    const st = peek16(CARD_STATUS)
    if (st !== ST_BUSY) return st
    wfi()
  }
}

/** A command that must be done: an error stops the program, said as the card said it. */
function cardMust(op: u16, offset: u16, at: u16, length: u16): void {
  const st = cardCall(op, offset, at, length)
  if (st === 0) return
  if (st === ST_NOFILE) fail(E_NOFILE)
  if (st === ST_BADNAME) fail(E_FILE)
  fail(E_CARD)
}

/** The name in the block, from a string expression; `ext` added when it has none (0: none). */
function nameArg(ext: u16): void {
  expr()
  needString()
  const at = stringAt(top())
  const n = stringLength(top())
  setNsp(nsp - 8)
  const b = addr(cardBlock)
  for (let k: u16 = 0; k < 24; k++) poke(b + k, 0)
  let dot = false
  for (let k: u16 = 0; k < n; k++) {
    if (k >= 12) fail(E_FILE)
    poke(b + k, peek(at + k))
    if (peek(at + k) === CH_DOT) dot = true
  }
  if (dot || ext === 0) return
  let e = ext
  let k = n
  while (peek(e) !== 0) {
    if (k >= 12) fail(E_FILE)
    poke(b + k, peek(e))
    e++
    k++
  }
}

/** Whether the name in the block ends .BIN: machine code, not a listing. */
function isMachineCode(): bool {
  const b = addr(cardBlock)
  let k: u16 = 0
  while (k < 12 && peek(b + k) !== 0) k++
  return (
    k >= 4 &&
    peek(b + k - 4) === CH_DOT &&
    peek(b + k - 3) === 0x42 &&
    peek(b + k - 2) === 0x49 &&
    peek(b + k - 1) === 0x4e
  )
}

/** A whole number from 0 to 65535, from an expression. */
function address(): u16 {
  expr()
  needNumber()
  const v = toWord(top())
  setNsp(nsp - 8)
  return v
}

/* ---------------- FILES, SAVE, LOAD, KILL ---------------- */

/**
 * FILES: the card's files and their sizes, and the room left; FILES "SOFT" the SOFT CARD's,
 * elecdex's own programs, which LOAD reads as if they were on the card.
 */
function filesStatement(): void {
  const soft = !statementEnds()
  if (soft) nameArg(0)
  else poke(addr(cardBlock), 0)
  cardMust(OP_DIR, 0, addr(cardBuf), 256)
  const total = peek16(CARD_RESULT)
  const shown = total < 16 ? total : 16
  for (let k: u16 = 0; k < shown; k++) {
    checkBreak()
    const e = addr(cardBuf) + k * 16
    let n: u16 = 0
    while (n < 12 && peek(e + n) !== 0) {
      putc(peek(e + n))
      n++
    }
    while (n < 13) {
      putc(CH_SPACE)
      n++
    }
    printUnsigned(peek16(e + 12))
    newline()
  }
  if (total > shown) {
    puts(str('...'))
    newline()
  }
  if (soft) return
  cardCall(OP_FREE, 0, 0, 0)
  const kb = (peek16(CARD_RESULT_HIGH) << 6) | (peek16(CARD_RESULT) >> 10)
  printUnsigned(kb)
  puts(str(' KB FREE'))
  newline()
}

/**
 * SAVE "NAME" (the program, as its listing; .BAS when no extension is given), or
 * SAVE "NAME.BIN", start, length: bytes of RAM.
 */
function saveStatement(): void {
  nameArg(str('.BAS'))
  if (next() === CH_COMMA) {
    step()
    const from = address()
    expect(CH_COMMA)
    const length = address()
    if (from + length < from || from + length > 0x8000) fail(E_MEMORY)
    cardMust(OP_WRITE, 0, from, length)
    return
  }
  cardMust(OP_WRITE, 0, addr(cardBuf), 0)
  let n: u16 = 0
  let at = PROG
  while (peek16(at) !== 0) {
    checkBreak()
    const line = addr(lineBuf)
    const digits = unsignedText(peek16(at), line)
    poke(line + digits, CH_SPACE)
    const length = digits + 1 + expand(at + 4, line + digits + 1, 77 - digits)
    poke(line + length, K_ENTER)
    if (n + length + 1 > 256) {
      cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
      n = 0
    }
    for (let k: u16 = 0; k <= length; k++) poke(addr(cardBuf) + n + k, peek(line + k))
    n += length + 1
    at += peek16(at + 2)
  }
  if (n > 0) cardMust(OP_WRITE, APPEND, addr(cardBuf), n)
}

/**
 * LOAD "NAME": a listing in place of the program (each line read as if typed), or
 * LOAD "NAME.BIN"[, address]: machine code into RAM, at the code area unless told.
 */
function loadStatement(): void {
  nameArg(str('.BAS'))
  if (isMachineCode() || next() === CH_COMMA) {
    let to = CODE_AREA
    if (next() === CH_COMMA) {
      step()
      to = address()
    }
    // Never over the program and its variables, nor up into the stack.
    if (to < varEnd || to >= CODE_AREA_END) fail(E_MEMORY)
    cardMust(OP_READ, 0, to, CODE_AREA_END - to)
    return
  }
  // Read before the program goes: a name that is not on the card costs nothing.
  cardMust(OP_READ, 0, addr(cardBuf), 256)
  keepProgramTo(PROG)
  let offset: u16 = 0
  let n: u16 = 0
  for (;;) {
    if (offset > 0) cardMust(OP_READ, offset, addr(cardBuf), 256)
    const got = peek16(CARD_RESULT)
    if (got === 0) break
    for (let k: u16 = 0; k < got; k++) n = loadByte(n, peek(addr(cardBuf) + k))
    offset += got
  }
  loadByte(n, K_ENTER)
  // The program in place, the line LOAD was in gone with it: nothing more runs.
  endProgram()
  setTxt(addr(nothing))
}

/** One byte of a listing: added to the line, or (CR, LF) the line kept. The line's new length. */
function loadByte(n: u16, c: u16): u16 {
  const line = addr(lineBuf)
  if (c === K_ENTER || c === LF) {
    if (n === 0) return 0
    poke(line + n, 0)
    if (!storeTypedLine()) fail(E_FILE)
    return 0
  }
  if (n >= 78) fail(E_FILE)
  poke(line + n, c)
  return n + 1
}

/* ---------------- data files ---------------- */

/** The file number after #: 1 or 2. */
function fileNumber(): u16 {
  if (next() === CH_HASH) step()
  const n = readUnsigned()
  if (n < 1 || n > 2) fail(E_FILE)
  return n
}

/** The data file's name into the block. */
function fileToBlock(n: u16): void {
  const b = addr(cardBlock)
  for (let k: u16 = 0; k < 12; k++) poke(b + k, peek(addr(fileName) + (n - 1) * 12 + k))
}

/** OPEN "NAME" FOR INPUT | OUTPUT | APPEND AS #n (.DAT when no extension is given). */
function openStatement(): void {
  nameArg(str('.DAT'))
  if (next() !== T_FOR) fail(E_SYNTAX)
  step()
  const how = next()
  if (how !== T_INPUT && how !== T_OUTPUT && how !== T_APPEND) fail(E_SYNTAX)
  step()
  if (next() !== T_AS) fail(E_SYNTAX)
  step()
  const n = fileNumber()
  if (peek(addr(fileMode) + n - 1) !== 0) fail(E_FILE)
  if (how === T_INPUT) cardMust(OP_READ, 0, addr(cardBuf), 0)
  else cardMust(OP_WRITE, how === T_OUTPUT ? 0 : APPEND, addr(cardBuf), 0)
  for (let k: u16 = 0; k < 12; k++)
    poke(addr(fileName) + (n - 1) * 12 + k, peek(addr(cardBlock) + k))
  fileOffset[n - 1] = 0
  fileLen[n - 1] = 0
  filePos[n - 1] = 0
  poke(addr(fileMode) + n - 1, how === T_INPUT ? 1 : 2)
  setFilesOpen(true)
}

/** PRINT #n, items: PRINT's output into a file opened for it. */
export function printToFile(): void {
  const n = fileNumber()
  if (peek(addr(fileMode) + n - 1) !== 2) fail(E_FILE)
  if (next() === CH_COMMA) step()
  setOutFile(n)
  printItems()
  setOutFile(0)
}

/** A byte of PRINT #'s, gathered; a full buffer is written. */
export function fileByte(c: u16): void {
  const n = outFile
  const at = addr(fileBuf) + (n - 1) * FILE_BUF
  const len = fileLen[n - 1]
  poke(at + len, c)
  fileLen[n - 1] = len + 1
  if (len + 1 === FILE_BUF) flush(n, true)
}

/** A written file's gathered bytes, added to it; `must`: an error stops the program. */
function flush(n: u16, must: bool): void {
  const len = fileLen[n - 1]
  if (len === 0) return
  fileToBlock(n)
  fileLen[n - 1] = 0
  const at = addr(fileBuf) + (n - 1) * FILE_BUF
  if (must) cardMust(OP_WRITE, APPEND, at, len)
  else cardCall(OP_WRITE, APPEND, at, len)
}

/** The next byte of a file read, or 0xFFFF at its end. */
function fileByteIn(n: u16): u16 {
  if (filePos[n - 1] >= fileLen[n - 1] && !fill(n)) return 0xffff
  const pos = filePos[n - 1]
  filePos[n - 1] = pos + 1
  return peek(addr(fileBuf) + (n - 1) * FILE_BUF + pos)
}

/** More of a file read into its buffer; false when there is none. */
function fill(n: u16): bool {
  fileToBlock(n)
  cardMust(OP_READ, fileOffset[n - 1], addr(fileBuf) + (n - 1) * FILE_BUF, FILE_BUF)
  const got = peek16(CARD_RESULT)
  fileOffset[n - 1] = fileOffset[n - 1] + got
  fileLen[n - 1] = got
  filePos[n - 1] = 0
  return got > 0
}

/** INPUT #n, v[, v...]: the next items of the file, as PRINT # wrote them. */
export function inputFromFile(): void {
  const n = fileNumber()
  if (peek(addr(fileMode) + n - 1) !== 1) fail(E_FILE)
  expect(CH_COMMA)
  for (;;) {
    const at = varAt(true)
    const room = varRoom
    const length = itemIn(n)
    if (length === 0xffff) fail(E_DATA)
    if (takeItem(at, room, addr(lineBuf), false) === 0xffff) fail(E_TYPE)
    if (next() !== CH_COMMA) return
    step()
  }
}

/**
 * The file's next item into lineBuf, ended by a zero: up to a comma or a line's end, a quoted
 * one whole; its length, 0xFFFF when the file has ended.
 */
function itemIn(n: u16): u16 {
  const line = addr(lineBuf)
  let c = fileByteIn(n)
  while (c === CH_SPACE || c === K_ENTER || c === LF) c = fileByteIn(n)
  if (c === 0xffff) return 0xffff
  let k: u16 = 0
  const inQuote = c === CH_QUOTE
  // A quoted item keeps its quotes, so that a comma in it stays part of it when it is taken.
  if (inQuote) {
    poke(line, CH_QUOTE)
    k = 1
    c = fileByteIn(n)
  }
  while (c !== 0xffff && k < 77) {
    if (inQuote ? c === CH_QUOTE : c === CH_COMMA || c === K_ENTER || c === LF) break
    poke(line + k, c)
    k++
    c = fileByteIn(n)
  }
  // Past a quoted item's closing quote: its spaces and the comma or line end after it, or
  // the next item would start at that comma and be empty.
  if (inQuote) {
    poke(line + k, CH_QUOTE)
    k++
    c = fileByteIn(n)
    while (c === CH_SPACE) c = fileByteIn(n)
  }
  poke(line + k, 0)
  return k
}

/** Whether a file read has an item left: spaces and line ends before the end are none. */
function itemLeft(f: u16): bool {
  for (;;) {
    if (filePos[f - 1] >= fileLen[f - 1] && !fill(f)) return false
    const c = peek(addr(fileBuf) + (f - 1) * FILE_BUF + filePos[f - 1])
    if (c !== CH_SPACE && c !== K_ENTER && c !== LF) return true
    filePos[f - 1] = filePos[f - 1] + 1
  }
}

/** EOF(n): 1 when a file read has nothing more, else 0. */
export function eofFunction(): void {
  unary()
  needNumber()
  const n = toInt(top())
  if (n < 1 || n > 2 || peek(addr(fileMode) + u16(n) - 1) !== 1) fail(E_FILE)
  setInt(top(), itemLeft(u16(n)) ? 0 : 1)
  setStrType(false)
}

/** CLOSE [#n]: a file (or every file) written out and closed. */
function closeStatement(): void {
  if (statementEnds()) {
    for (let n: u16 = 1; n <= 2; n++) closeFile(n, true)
    return
  }
  closeFile(fileNumber(), true)
}

function closeFile(n: u16, must: bool): void {
  if (peek(addr(fileMode) + n - 1) === 2) flush(n, must)
  poke(addr(fileMode) + n - 1, 0)
  setFilesOpen(peek(addr(fileMode)) !== 0 || peek(addr(fileMode) + 1) !== 0)
}

/** Every file closed as the program stops: written out, and no error said from here. */
export function closeFiles(): void {
  // Marked closed first: a card that fails here cannot bring the stop back round.
  setFilesOpen(false)
  for (let n: u16 = 1; n <= 2; n++) {
    const written = peek(addr(fileMode) + n - 1) === 2
    poke(addr(fileMode) + n - 1, 0)
    if (written) flush(n, false)
  }
}

/** The statements of this bank. */
export function fileStatement(c: u16): void {
  if (c === T_FILES) filesStatement()
  else if (c === T_SAVE) saveStatement()
  else if (c === T_LOAD) loadStatement()
  else if (c === T_KILL) {
    nameArg(str('.BAS'))
    cardMust(OP_DELETE, 0, 0, 0)
  } else if (c === T_OPEN) openStatement()
  else if (c === T_CLOSE) closeStatement()
  else fail(E_SYNTAX)
}
