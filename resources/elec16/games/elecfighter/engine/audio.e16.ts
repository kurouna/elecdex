// ELECFIGHTER's sound (docs/elec16-elecfighter-design.md 9): the songs on channels 0-11
// (music/songs.mml) and the effects on 12-15 (music/sfx.mml), each played by its number from a
// table made once - the engine says what happened (a heavy hit, a guard, a dash), never which
// fighter or slot it was. In bank 4, beside the look that hears the fight.
import { type u16, words } from '../../../../../src/shared/e16c/builtins'
import { musicStop, play } from '../../lib/sound.e16'
import {
  SONG_CLEAR_AT,
  SONG_CLEAR_BANK,
  SONG_FIGHT_AT,
  SONG_FIGHT_BANK,
  SONG_LOSE_AT,
  SONG_LOSE_BANK,
  SONG_SELECT_AT,
  SONG_SELECT_BANK,
  SONG_TITLE_AT,
  SONG_TITLE_BANK,
  SONG_WIN_AT,
  SONG_WIN_BANK,
  SONG_X_DASH_AT,
  SONG_X_DASH_BANK,
  SONG_X_DOWN_AT,
  SONG_X_DOWN_BANK,
  SONG_X_FIGHT_AT,
  SONG_X_FIGHT_BANK,
  SONG_X_GUARD_AT,
  SONG_X_GUARD_BANK,
  SONG_X_HEAVY_AT,
  SONG_X_HEAVY_BANK,
  SONG_X_KO_AT,
  SONG_X_KO_BANK,
  SONG_X_LAND_AT,
  SONG_X_LAND_BANK,
  SONG_X_LIGHT_AT,
  SONG_X_LIGHT_BANK,
  SONG_X_MAT_AT,
  SONG_X_MAT_BANK,
  SONG_X_MOVE_AT,
  SONG_X_MOVE_BANK,
  SONG_X_OK_AT,
  SONG_X_OK_BANK,
  SONG_X_ROUND_AT,
  SONG_X_ROUND_BANK,
  SONG_X_SHARDS_AT,
  SONG_X_SHARDS_BANK,
  SONG_X_THROW_AT,
  SONG_X_THROW_BANK,
  SONG_X_TIME_AT,
  SONG_X_TIME_BANK,
  SONG_X_WHIFF_AT,
  SONG_X_WHIFF_BANK,
} from '../assets.e16'

/** The songs by number (0 none): a stage's row names its fight's (stage.txt `music`). */
export const M_TITLE = 1
export const M_SELECT = 2
export const M_FIGHT = 3
export const M_WIN = 4
export const M_LOSE = 5
export const M_CLEAR = 6

/** The effects by number: what happened, on the channel music/sfx.mml gives it. */
export const X_LIGHT = 0
export const X_HEAVY = 1
export const X_GUARD = 2
export const X_WHIFF = 3
export const X_DASH = 4
export const X_THROW = 5
export const X_LAND = 6
export const X_DOWN = 7
export const X_SHARDS = 8
export const X_ROUND = 9
export const X_FIGHT = 10
export const X_TIME = 11
export const X_KO = 12
export const X_MAT = 13
export const X_MOVE = 14
export const X_OK = 15

/** Each effect's and each song's bank and place, as pairs. */
const fxSong = words(32)
const songs = words(14)
/** The effects heard (a bit each, kept until a test clears it), and the song playing now. */
export const sfxHeard = words(1)
export let songNow: u16 = 0

function fxIs(k: u16, b: u16, at: u16): void {
  fxSong[k * 2] = b
  fxSong[k * 2 + 1] = at
}

function songIs(m: u16, b: u16, at: u16): void {
  songs[m * 2] = b
  songs[m * 2 + 1] = at
}

/** The tables: an effect's or a song's number to where it is. */
export function audioIn(): void {
  fxIs(X_LIGHT, SONG_X_LIGHT_BANK, SONG_X_LIGHT_AT)
  fxIs(X_HEAVY, SONG_X_HEAVY_BANK, SONG_X_HEAVY_AT)
  fxIs(X_GUARD, SONG_X_GUARD_BANK, SONG_X_GUARD_AT)
  fxIs(X_WHIFF, SONG_X_WHIFF_BANK, SONG_X_WHIFF_AT)
  fxIs(X_DASH, SONG_X_DASH_BANK, SONG_X_DASH_AT)
  fxIs(X_THROW, SONG_X_THROW_BANK, SONG_X_THROW_AT)
  fxIs(X_LAND, SONG_X_LAND_BANK, SONG_X_LAND_AT)
  fxIs(X_DOWN, SONG_X_DOWN_BANK, SONG_X_DOWN_AT)
  fxIs(X_SHARDS, SONG_X_SHARDS_BANK, SONG_X_SHARDS_AT)
  fxIs(X_ROUND, SONG_X_ROUND_BANK, SONG_X_ROUND_AT)
  fxIs(X_FIGHT, SONG_X_FIGHT_BANK, SONG_X_FIGHT_AT)
  fxIs(X_TIME, SONG_X_TIME_BANK, SONG_X_TIME_AT)
  fxIs(X_KO, SONG_X_KO_BANK, SONG_X_KO_AT)
  fxIs(X_MAT, SONG_X_MAT_BANK, SONG_X_MAT_AT)
  fxIs(X_MOVE, SONG_X_MOVE_BANK, SONG_X_MOVE_AT)
  fxIs(X_OK, SONG_X_OK_BANK, SONG_X_OK_AT)
  songIs(M_TITLE, SONG_TITLE_BANK, SONG_TITLE_AT)
  songIs(M_SELECT, SONG_SELECT_BANK, SONG_SELECT_AT)
  songIs(M_FIGHT, SONG_FIGHT_BANK, SONG_FIGHT_AT)
  songIs(M_WIN, SONG_WIN_BANK, SONG_WIN_AT)
  songIs(M_LOSE, SONG_LOSE_BANK, SONG_LOSE_AT)
  songIs(M_CLEAR, SONG_CLEAR_BANK, SONG_CLEAR_AT)
}

/** Effect `k` (its channels only: the music goes on). */
export function sfx(k: u16): void {
  sfxHeard[0] = sfxHeard[0] | (1 << k)
  play(fxSong[k * 2], fxSong[k * 2 + 1], false)
}

/** Song `m` from its start, or none (0); the one playing already goes on. */
export function music(m: u16): void {
  if (m === songNow) return
  songNow = m
  if (m === 0 || m > M_CLEAR) {
    musicStop()
    return
  }
  play(songs[m * 2], songs[m * 2 + 1], true)
}
