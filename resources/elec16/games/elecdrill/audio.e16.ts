// ELECDRILL's sound (docs/elec16-elecdrill.md section 7): the songs on channels 0-11, the
// effects on 12-15 (music/songs.mml, music/sfx.mml).
import type { u16 } from '../../../../src/shared/e16c/builtins'
import { musicStop, play } from '../lib/sound.e16'
import {
  SONG_DEEP_AT,
  SONG_DEEP_BANK,
  SONG_GOAL_AT,
  SONG_GOAL_BANK,
  SONG_LOWAIR_AT,
  SONG_LOWAIR_BANK,
  SONG_MAIN_AT,
  SONG_MAIN_BANK,
  SONG_OVER_AT,
  SONG_OVER_BANK,
  SONG_RESULT_AT,
  SONG_RESULT_BANK,
  SONG_STRATUM_AT,
  SONG_STRATUM_BANK,
  SONG_TITLE_AT,
  SONG_TITLE_BANK,
  SONG_X_ALARM_AT,
  SONG_X_ALARM_BANK,
  SONG_X_CAPSULE_AT,
  SONG_X_CAPSULE_BANK,
  SONG_X_CHAIN_AT,
  SONG_X_CHAIN_BANK,
  SONG_X_CHAIN2_AT,
  SONG_X_CHAIN2_BANK,
  SONG_X_CLANK_AT,
  SONG_X_CLANK_BANK,
  SONG_X_CLINK_AT,
  SONG_X_CLINK_BANK,
  SONG_X_CRUSH_AT,
  SONG_X_CRUSH_BANK,
  SONG_X_DIG_AT,
  SONG_X_DIG_BANK,
  SONG_X_GASP_AT,
  SONG_X_GASP_BANK,
  SONG_X_LAND_AT,
  SONG_X_LAND_BANK,
  SONG_X_POP_AT,
  SONG_X_POP_BANK,
  SONG_X_RUMBLE_AT,
  SONG_X_RUMBLE_BANK,
  SONG_X_SELECT_AT,
  SONG_X_SELECT_BANK,
  SONG_X_SWING_AT,
  SONG_X_SWING_BANK,
} from './assets.e16'

export const M_TITLE = 1
export const M_MAIN = 2
export const M_DEEP = 3
export const M_LOWAIR = 4
export const M_STRATUM = 5
export const M_OVER = 6
export const M_RESULT = 7
export const M_GOAL = 8

/** The song playing now (0 none). */
export let song: u16 = 0

export function music(m: u16): void {
  song = m
  if (m === M_TITLE) play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  else if (m === M_MAIN) play(SONG_MAIN_BANK, SONG_MAIN_AT, true)
  else if (m === M_DEEP) play(SONG_DEEP_BANK, SONG_DEEP_AT, true)
  else if (m === M_LOWAIR) play(SONG_LOWAIR_BANK, SONG_LOWAIR_AT, true)
  else if (m === M_STRATUM) play(SONG_STRATUM_BANK, SONG_STRATUM_AT, true)
  else if (m === M_OVER) play(SONG_OVER_BANK, SONG_OVER_AT, true)
  else if (m === M_RESULT) play(SONG_RESULT_BANK, SONG_RESULT_AT, true)
  else if (m === M_GOAL) play(SONG_GOAL_BANK, SONG_GOAL_AT, true)
  else musicStop()
}

export function sfxDig(): void {
  play(SONG_X_DIG_BANK, SONG_X_DIG_AT, false)
}

export function sfxClank(): void {
  play(SONG_X_CLANK_BANK, SONG_X_CLANK_AT, false)
}

export function sfxClink(): void {
  play(SONG_X_CLINK_BANK, SONG_X_CLINK_AT, false)
}

export function sfxSwing(): void {
  play(SONG_X_SWING_BANK, SONG_X_SWING_AT, false)
}

export function sfxLand(): void {
  play(SONG_X_LAND_BANK, SONG_X_LAND_AT, false)
}

export function sfxPop(): void {
  play(SONG_X_POP_BANK, SONG_X_POP_AT, false)
}

/** A chain: higher the longer it runs. */
export function sfxChain(n: u16): void {
  if (n >= 3) play(SONG_X_CHAIN2_BANK, SONG_X_CHAIN2_AT, false)
  else play(SONG_X_CHAIN_BANK, SONG_X_CHAIN_AT, false)
}

export function sfxCapsule(): void {
  play(SONG_X_CAPSULE_BANK, SONG_X_CAPSULE_AT, false)
}

export function sfxCrush(): void {
  play(SONG_X_CRUSH_BANK, SONG_X_CRUSH_AT, false)
}

export function sfxGasp(): void {
  play(SONG_X_GASP_BANK, SONG_X_GASP_AT, false)
}

export function sfxAlarm(): void {
  play(SONG_X_ALARM_BANK, SONG_X_ALARM_AT, false)
}

export function sfxRumble(): void {
  play(SONG_X_RUMBLE_BANK, SONG_X_RUMBLE_AT, false)
}

export function sfxSelect(): void {
  play(SONG_X_SELECT_BANK, SONG_X_SELECT_AT, false)
}
