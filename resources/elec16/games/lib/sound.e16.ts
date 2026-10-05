// The game kit's sound driver (docs/elec16-play.md section 10): plays the songs the kit's
// MML compiler wrote (shared/elec16/kit/mml.ts), one step a frame. Channels 0-11 are the
// music's, 12-15 the sound effects', so an effect never cuts the music short. A song reads
// its bytes from its own bank in the window, which is put back after.
import {
  type bool,
  peek,
  peek16,
  poke16,
  type u16,
  words,
  wrap16,
} from '../../../../src/shared/e16c/builtins'
import { bank, IO_BANK } from './kit.e16'

const CHSEL = 0xf840
const WAVE = 0xf842
const FREQ = 0xf844
const VOL = 0xf846
const PAN = 0xf848
const ENV = 0xf84a
const MOD = 0xf84c
const KEY = 0xf84e
const MASTER = 0xf850

const OP_NOTE = 1
const OP_REST = 2
const OP_INST = 3
const OP_VOL = 4
const OP_PAN = 5
const OP_LOOP = 6
const OP_HOLD = 8
const OP_AGAIN = 9
const OP_REPEAT = 10

/** Each channel: its song's bank and start, where it reads, where it loops, frames left. */
const chBank = words(16)
const chSong = words(16)
const chAt = words(16)
const chLoop = words(16)
const chWait = words(16)
const chGate = words(16)
const chFreq = words(16)
/** The last note's FREQ as written (chFreq falls with a drum's drop). */
const lastFreq = words(16)
/** The last note's frames and held frames, for AGAIN and REPEAT. */
const chLen = words(16)
const chHeld = words(16)
const chDrop = words(16)
const chVol = words(16)
const chInstVol = words(16)
/** 1 while it plays. */
const chOn = words(16)
/** Music channels kept quiet (bit per channel): a layer brought in later. */
let muted: u16 = 0

/** Every channel stopped, MASTER full. */
export function soundInit(): void {
  let c: u16 = 0
  while (c < 16) {
    stopChannel(c)
    c++
  }
  poke16(MASTER, 15)
}

function stopChannel(c: u16): void {
  chOn[c] = 0
  poke16(CHSEL, c)
  poke16(KEY, 0)
}

/** Plays the song at `at` in bank `b`: as music (its channels' music stopped first) or an effect. */
export function play(b: u16, at: u16, music: bool): void {
  const old = bank(b)
  if (music) {
    let c: u16 = 0
    while (c < 12) {
      stopChannel(c)
      c++
    }
  }
  const n = peek(at)
  let k: u16 = 0
  while (k < n) {
    const head = at + 2 + k * 6
    const c = peek(head) & 15
    chBank[c] = b
    chSong[c] = at
    chAt[c] = at + peek16(head + 2)
    chLoop[c] = peek16(head + 4)
    chWait[c] = 1
    chGate[c] = 0
    chDrop[c] = 0
    chVol[c] = 15
    chInstVol[c] = 15
    chOn[c] = 1
    poke16(CHSEL, c)
    poke16(KEY, 0)
    k++
  }
  poke16(IO_BANK, old)
}

/** Stops the music (channels 0-11). */
export function musicStop(): void {
  let c: u16 = 0
  while (c < 12) {
    stopChannel(c)
    c++
  }
}

/** Music channels in `mask` quiet (their notes go on, unheard), or heard again. */
export function musicMute(mask: u16): void {
  muted = mask
}

/** MASTER, 0-15 (a fade). */
export function soundMaster(v: u16): void {
  poke16(MASTER, v & 15)
}

/** One frame of every channel: call once a frame. */
export function soundTick(): void {
  const old = peek16(IO_BANK)
  let c: u16 = 0
  while (c < 16) {
    if (chOn[c] !== 0) tickChannel(c)
    c++
  }
  poke16(IO_BANK, old)
}

function tickChannel(c: u16): void {
  if (chGate[c] > 0) {
    chGate[c] = chGate[c] - 1
    if (chGate[c] === 0) {
      poke16(CHSEL, c)
      poke16(KEY, 0)
    }
  }
  if (chDrop[c] !== 0 && chGate[c] > 0) {
    const f = chFreq[c]
    chFreq[c] = f - (f >> chDrop[c])
    poke16(CHSEL, c)
    poke16(FREQ, chFreq[c])
  }
  chWait[c] = chWait[c] - 1
  if (chWait[c] !== 0) return
  poke16(IO_BANK, chBank[c])
  readOps(c)
}

/** Set by `oneOp` when the op takes time (a note, a rest, a hold) or the channel ends. */
let opTook = false

/** Reads the channel's ops until one takes time or it ends. */
function readOps(c: u16): void {
  let at = chAt[c]
  opTook = false
  while (!opTook) at = oneOp(c, at)
  chAt[c] = at
}

/** The op at `at`, done; answers where the next one is. */
function oneOp(c: u16, at: u16): u16 {
  switch (peek(at)) {
    case OP_NOTE:
      // The note's FREQ is at an odd address: two bytes, not a word.
      startNote(c, peek(at + 1) | (peek(at + 2) << 8), peek(at + 3), peek(at + 4))
      opTook = true
      return wrap16(at + 5)
    case OP_AGAIN:
      startNote(c, peek(at + 1) | (peek(at + 2) << 8), chLen[c], chHeld[c])
      opTook = true
      return wrap16(at + 3)
    case OP_REPEAT:
      startNote(c, lastFreq[c], chLen[c], chHeld[c])
      opTook = true
      return wrap16(at + 1)
    case OP_REST:
      chWait[c] = peek(at + 1)
      opTook = true
      return wrap16(at + 2)
    case OP_HOLD:
      // A long note goes on: its key let go after this many of its frames (0: as it is).
      chWait[c] = peek(at + 1)
      chGate[c] = peek(at + 2)
      opTook = true
      return wrap16(at + 3)
    case OP_INST:
      setInstrument(c, peek(at + 1))
      return wrap16(at + 2)
    case OP_VOL:
      chVol[c] = peek(at + 1)
      return wrap16(at + 2)
    case OP_PAN:
      poke16(CHSEL, c)
      poke16(PAN, peek(at + 1))
      return wrap16(at + 2)
    case OP_LOOP:
      if (chLoop[c] !== 0xffff) return wrap16(chSong[c] + chLoop[c])
      return endChannel(c, at)
    default:
      // The end (7): let go, and stop.
      return endChannel(c, at)
  }
}

function endChannel(c: u16, at: u16): u16 {
  poke16(CHSEL, c)
  poke16(KEY, 0)
  chOn[c] = 0
  opTook = true
  return at
}

/** A note: FREQ, the volume (the channel's times the instrument's), keyed on. */
function startNote(c: u16, freq: u16, frames: u16, held: u16): void {
  chLen[c] = frames
  chHeld[c] = held
  lastFreq[c] = freq
  chWait[c] = frames
  chGate[c] = held
  chFreq[c] = freq
  poke16(CHSEL, c)
  poke16(FREQ, freq)
  const quiet = c < 12 && (muted & (1 << c)) !== 0
  // The two volumes' product over 15, rounded: 15 and 15 are 15 (x 17 / 256 is / 15).
  poke16(VOL, quiet ? 0 : (chVol[c] * chInstVol[c] * 17 + 128) >> 8)
  poke16(KEY, 1)
}

/** Instrument `k` of the channel's song: its wave, envelope, modulation, pan and fall. */
function setInstrument(c: u16, k: u16): void {
  const song = chSong[c]
  const at = song + 2 + peek(song) * 6 + k * 8
  poke16(CHSEL, c)
  poke16(WAVE, peek(at))
  chInstVol[c] = peek(at + 1)
  poke16(ENV, peek16(at + 2))
  poke16(MOD, peek16(at + 4))
  poke16(PAN, peek(at + 6))
  chDrop[c] = peek(at + 7)
}
