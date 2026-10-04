// MY GAME: the starting point of an ELEC-16 PLAY game made with the game kit. A ship flies with
// the d-pad and shoots with A; B plays a sound; START goes back to the start screen. Change
// anything: save, and the pane builds the game again and puts it back in the slot.
//
// The kit's manual is docs/elec16-kit.md (in Japanese). The library's functions are in
// lib/kit.e16.ts and lib/sound.e16.ts; assets.e16.ts is written by the build (do not edit it).

import {
  PAL_SHIP,
  PAL_SPACE,
  SHIP_AT,
  SHIP_BANK,
  SHIP_BYTES,
  SHIP_TILE,
  SONG_BEEP_AT,
  SONG_BEEP_BANK,
  SONG_THEME_AT,
  SONG_THEME_BANK,
} from './assets.e16'
import { i16, poke16, type u16, words } from './lib/builtins'
import {
  B_A,
  B_B,
  B_DOWN,
  B_LEFT,
  B_RIGHT,
  B_START,
  B_UP,
  frame_wait,
  held,
  kitInit,
  load,
  padRead,
  palette,
  pressed,
  S16,
  spr,
  sprBegin,
  sprShow,
  VCTRL,
} from './lib/kit.e16'
import { play, soundInit, soundTick } from './lib/sound.e16'

/** The ship's place, in points. */
let x: i16 = 152
let y: i16 = 220
/** Up to eight shots: their places, 0 for none. */
const shotX = words(8)
const shotY = words(8)

export function main(): void {
  kitInit()
  soundInit()
  // Mode 1 (tiles and sprites), the display on.
  poke16(VCTRL, 3)
  // The background colour is palette 0's colour 0: the space palette into slot 0.
  palette(PAL_SPACE, 0)
  // Sprites use slots 8-15; the ship's palette into slot 8 (written 0 in a tile word).
  palette(PAL_SHIP, 8)
  load(SHIP_BANK, SHIP_AT, SHIP_TILE * 32, SHIP_BYTES)
  play(SONG_THEME_BANK, SONG_THEME_AT, true)
  let seen: u16 = 0
  for (;;) {
    seen = frame_wait(seen)
    // The sprites made last frame go on the screen at its start.
    sprShow()
    padRead()
    soundTick()
    if (pressed(B_START)) return
    move()
    if (pressed(B_A)) fire()
    if (pressed(B_B)) play(SONG_BEEP_BANK, SONG_BEEP_AT, false)
    sprBegin()
    // First drawn is in front: the ship, then its shots.
    spr(x - 8, y - 8, SHIP_TILE, S16)
    shots()
  }
}

/** Two points a frame, kept on the screen. */
function move(): void {
  if (held(B_LEFT) && x > 8) x = x - 2
  if (held(B_RIGHT) && x < 312) x = x + 2
  if (held(B_UP) && y > 8) y = y - 2
  if (held(B_DOWN) && y < 280) y = y + 2
}

/** A shot from the ship's nose, in the first free place. */
function fire(): void {
  let k: u16 = 0
  while (k < 8 && shotY[k] !== 0) k++
  if (k === 8) return
  shotX[k] = u16(x)
  shotY[k] = u16(y - 8)
}

/** Every shot up six points a frame, drawn (the sheet's second frame), gone off the top. */
function shots(): void {
  let k: u16 = 0
  while (k < 8) {
    if (shotY[k] !== 0) {
      const sy = i16(shotY[k]) - 6
      shotY[k] = sy < 8 ? 0 : u16(sy)
      spr(i16(shotX[k]) - 8, sy - 8, SHIP_TILE + 4, S16)
    }
    k++
  }
}
