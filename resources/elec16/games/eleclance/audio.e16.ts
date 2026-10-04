// ELECLANCE's sound (docs/elec16-eleclance.md section 7): the songs on channels 0-11, the
// effects on 12-15 (music/songs.mml, music/sfx.mml), and the counter-melody on channel 11
// that OVERDRIVE and ZENITH's last phase bring in.
import type { bool, u16 } from '../../../../src/shared/e16c/builtins'
import { musicMute, musicStop, play } from '../lib/sound.e16'
import {
  SONG_BOSS_AT,
  SONG_BOSS_BANK,
  SONG_CLEAR_AT,
  SONG_CLEAR_BANK,
  SONG_ENTRY_AT,
  SONG_ENTRY_BANK,
  SONG_EXTEND_AT,
  SONG_EXTEND_BANK,
  SONG_OVER_AT,
  SONG_OVER_BANK,
  SONG_STAGE_AT,
  SONG_STAGE_BANK,
  SONG_TITLE_AT,
  SONG_TITLE_BANK,
  SONG_X_BOMB_AT,
  SONG_X_BOMB_BANK,
  SONG_X_BOOM_AT,
  SONG_X_BOOM_BANK,
  SONG_X_DIE_AT,
  SONG_X_DIE_BANK,
  SONG_X_DOWN_AT,
  SONG_X_DOWN_BANK,
  SONG_X_DRIVE_AT,
  SONG_X_DRIVE_BANK,
  SONG_X_HIT_AT,
  SONG_X_HIT_BANK,
  SONG_X_PART_AT,
  SONG_X_PART_BANK,
  SONG_X_PICK_AT,
  SONG_X_PICK_BANK,
  SONG_X_SELECT_AT,
  SONG_X_SELECT_BANK,
  SONG_X_SHOT_AT,
  SONG_X_SHOT_BANK,
  SONG_X_SIREN_AT,
  SONG_X_SIREN_BANK,
  SONG_X_SKIM_AT,
  SONG_X_SKIM_BANK,
} from './assets.e16'

/** The counter-melody's channel, kept quiet until a layer is called. */
const LAYER = 0x800

export const M_TITLE = 1
export const M_STAGE = 2
export const M_BOSS = 3
export const M_CLEAR = 4
export const M_OVER = 5
export const M_ENTRY = 6

export function music(m: u16): void {
  musicMute(LAYER)
  if (m === M_TITLE) play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  else if (m === M_STAGE) play(SONG_STAGE_BANK, SONG_STAGE_AT, true)
  else if (m === M_BOSS) play(SONG_BOSS_BANK, SONG_BOSS_AT, true)
  else if (m === M_CLEAR) play(SONG_CLEAR_BANK, SONG_CLEAR_AT, true)
  else if (m === M_OVER) play(SONG_OVER_BANK, SONG_OVER_AT, true)
  else if (m === M_ENTRY) play(SONG_ENTRY_BANK, SONG_ENTRY_AT, true)
  else musicStop()
}

/** The counter-melody in (1) or out (0). */
export function musicLayer(on: u16): void {
  musicMute(on ? 0 : LAYER)
}

export function sfxShot(): void {
  play(SONG_X_SHOT_BANK, SONG_X_SHOT_AT, false)
}

export function sfxSkim(): void {
  play(SONG_X_SKIM_BANK, SONG_X_SKIM_AT, false)
}

export function sfxKill(big: bool): void {
  if (big) play(SONG_X_BOOM_BANK, SONG_X_BOOM_AT, false)
  else play(SONG_X_HIT_BANK, SONG_X_HIT_AT, false)
}

export function sfxBomb(): void {
  play(SONG_X_BOMB_BANK, SONG_X_BOMB_AT, false)
}

export function sfxDie(): void {
  play(SONG_X_DIE_BANK, SONG_X_DIE_AT, false)
}

export function sfxOverdrive(): void {
  play(SONG_X_DRIVE_BANK, SONG_X_DRIVE_AT, false)
}

export function sfxPick(): void {
  play(SONG_X_PICK_BANK, SONG_X_PICK_AT, false)
}

export function sfxExtend(): void {
  play(SONG_EXTEND_BANK, SONG_EXTEND_AT, false)
}

export function sfxSiren(): void {
  play(SONG_X_SIREN_BANK, SONG_X_SIREN_AT, false)
}

export function sfxBossPhase(): void {
  play(SONG_X_PART_BANK, SONG_X_PART_AT, false)
}

export function sfxBossDown(): void {
  play(SONG_X_DOWN_BANK, SONG_X_DOWN_AT, false)
}

export function bossPartDown(): void {
  play(SONG_X_PART_BANK, SONG_X_PART_AT, false)
}

export function sfxSelect(): void {
  play(SONG_X_SELECT_BANK, SONG_X_SELECT_AT, false)
}
