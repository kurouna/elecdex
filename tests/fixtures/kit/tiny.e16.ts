// A tiny game for the kit's tests (tests/unit/elec16-kit.test.ts): mode 1, a sprite, a song,
// a call into a cartridge bank, frames counted until START.

import {
  B_START,
  frame_wait,
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
} from '../../../resources/elec16/games/lib/kit.e16'
import { play, soundInit, soundTick } from '../../../resources/elec16/games/lib/sound.e16'
import { poke16, type u16 } from '../../../src/shared/e16c/builtins'
import {
  PAL_SHIP,
  SHIP_AT,
  SHIP_BANK,
  SHIP_BYTES,
  SHIP_TILE,
  SONG_BEEP_AT,
  SONG_BEEP_BANK,
} from './assets.e16'
import { farAway } from './far.e16'

export let frames: u16 = 0
export let far: u16 = 0

export function main(): void {
  kitInit()
  soundInit()
  poke16(VCTRL, 3)
  palette(PAL_SHIP, 8)
  load(SHIP_BANK, SHIP_AT, SHIP_TILE * 32, SHIP_BYTES)
  play(SONG_BEEP_BANK, SONG_BEEP_AT, true)
  far = farAway(20, 22)
  let seen: u16 = 0
  for (;;) {
    seen = frame_wait(seen)
    sprShow()
    padRead()
    soundTick()
    if (pressed(B_START)) return
    sprBegin()
    // Palette 0 of the sprites' field: slot 8.
    spr(100, 50, SHIP_TILE, S16)
    frames++
    poke16(0x0270, frames)
    poke16(0x0272, far)
  }
}
