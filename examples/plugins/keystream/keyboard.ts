/**
 * The instrument: two rows of the keyboard played as a piano, as music software's "musical
 * typing" does. The home row is the white keys, from A (middle C) to the key right of L; the
 * row above is the black keys. The rows are staggered by half a key, which is exactly where a
 * piano's black keys sit - and the keys with no black key above the gap (R between E and F,
 * I between B and C) are the ones a piano has none at either.
 *
 * Every key always plays the same note, in every song. Keys are named by KeyboardEvent.code,
 * so the instrument is the same on any layout; what a key prints comes from the host.
 */

export interface KeyDef {
  code: string
  /** The character that writes the key in a melody (notation.ts). */
  char: string
  /** MIDI note number; null for a key in the rows that plays nothing. */
  pitch: number | null
  /** 0 is the upper row, 1 the home row. */
  row: 0 | 1
  /** Centre across the keyboard, in keys: the upper row at 0, 1, ... the home row at 0.5, 1.5, ... */
  x: number
}

const UPPER: readonly [string, string, number | null][] = [
  ['KeyQ', 'q', null],
  ['KeyW', 'w', 61],
  ['KeyE', 'e', 63],
  ['KeyR', 'r', null],
  ['KeyT', 't', 66],
  ['KeyY', 'y', 68],
  ['KeyU', 'u', 70],
  ['KeyI', 'i', null],
  ['KeyO', 'o', 73],
  ['KeyP', 'p', 75],
  ['BracketLeft', '[', null],
  ['BracketRight', ']', null],
]

const HOME: readonly [string, string, number][] = [
  ['KeyA', 'a', 60],
  ['KeyS', 's', 62],
  ['KeyD', 'd', 64],
  ['KeyF', 'f', 65],
  ['KeyG', 'g', 67],
  ['KeyH', 'h', 69],
  ['KeyJ', 'j', 71],
  ['KeyK', 'k', 72],
  ['KeyL', 'l', 74],
  ['Semicolon', ';', 76],
  ['Quote', "'", 77],
]

/** Every key drawn, upper row first. */
export const KEYS: readonly KeyDef[] = [
  ...UPPER.map(([code, char, pitch], i): KeyDef => ({ code, char, pitch, row: 0, x: i })),
  ...HOME.map(([code, char, pitch], i): KeyDef => ({ code, char, pitch, row: 1, x: i + 0.5 })),
]

/** The keys that play a note: eighteen, from C4 to F5. */
export const NOTE_KEYS: readonly KeyDef[] = KEYS.filter((k) => k.pitch !== null)

/** From the left edge of the upper row to the right edge of its last key. */
export const KEYBOARD_SPAN = { from: -0.5, to: UPPER.length - 0.5 }

const byCode = new Map(KEYS.map((k) => [k.code, k]))
const byChar = new Map(NOTE_KEYS.map((k) => [k.char, k]))

export const keyOf = (code: string): KeyDef | undefined => byCode.get(code)
export const keyOfChar = (char: string): KeyDef | undefined => byChar.get(char)

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 'C4' for 60. */
export function noteName(pitch: number): string {
  return `${NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`
}

/** Whether a key is a black key of the piano: the upper row. */
export const isBlack = (key: KeyDef): boolean => key.row === 0
