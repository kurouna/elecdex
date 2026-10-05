// ELECAIRCOMBAT's sound (docs/elec16-elecaircombat.md section 8): the songs on channels 0-11,
// the effects on 12-15 (music/songs.mml, music/sfx.mml).
import type { bool, u16 } from '../../../../src/shared/e16c/builtins'
import { musicStop, play } from '../lib/sound.e16'
import {
  SONG_BRIEF_AT,
  SONG_BRIEF_BANK,
  SONG_ENDING_AT,
  SONG_ENDING_BANK,
  SONG_FIGHT_AT,
  SONG_FIGHT_BANK,
  SONG_FINAL_AT,
  SONG_FINAL_BANK,
  SONG_OVER_AT,
  SONG_OVER_BANK,
  SONG_TITLE_AT,
  SONG_TITLE_BANK,
  SONG_WIN_AT,
  SONG_WIN_BANK,
  SONG_X_ALERT_AT,
  SONG_X_ALERT_BANK,
  SONG_X_BOOM_AT,
  SONG_X_BOOM_BANK,
  SONG_X_FLARE_AT,
  SONG_X_FLARE_BANK,
  SONG_X_GUN_AT,
  SONG_X_GUN_BANK,
  SONG_X_GUNOFF_AT,
  SONG_X_GUNOFF_BANK,
  SONG_X_HIT_AT,
  SONG_X_HIT_BANK,
  SONG_X_HUSH_AT,
  SONG_X_HUSH_BANK,
  SONG_X_LAUNCH_AT,
  SONG_X_LAUNCH_BANK,
  SONG_X_LOCK_AT,
  SONG_X_LOCK_BANK,
  SONG_X_LOCKON_AT,
  SONG_X_LOCKON_BANK,
  SONG_X_MISSILE_AT,
  SONG_X_MISSILE_BANK,
  SONG_X_NEAR_AT,
  SONG_X_NEAR_BANK,
  SONG_X_OUCH_AT,
  SONG_X_OUCH_BANK,
  SONG_X_SEEK1_AT,
  SONG_X_SEEK1_BANK,
  SONG_X_SEEK2_AT,
  SONG_X_SEEK2_BANK,
  SONG_X_SEEK3_AT,
  SONG_X_SEEK3_BANK,
  SONG_X_SEEK4_AT,
  SONG_X_SEEK4_BANK,
  SONG_X_SELECT_AT,
  SONG_X_SELECT_BANK,
  SONG_X_SPLASH_AT,
  SONG_X_SPLASH_BANK,
  SONG_X_STALL_AT,
  SONG_X_STALL_BANK,
} from './assets.e16'

export const M_TITLE = 1
export const M_BRIEF = 2
export const M_FIGHT = 3
export const M_FINAL = 4
export const M_WIN = 5
export const M_OVER = 6
export const M_ENDING = 7

export function music(m: u16): void {
  if (m === M_TITLE) play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  else if (m === M_BRIEF) play(SONG_BRIEF_BANK, SONG_BRIEF_AT, true)
  else if (m === M_FIGHT) play(SONG_FIGHT_BANK, SONG_FIGHT_AT, true)
  else if (m === M_FINAL) play(SONG_FINAL_BANK, SONG_FINAL_AT, true)
  else if (m === M_WIN) play(SONG_WIN_BANK, SONG_WIN_AT, true)
  else if (m === M_OVER) play(SONG_OVER_BANK, SONG_OVER_AT, true)
  else if (m === M_ENDING) play(SONG_ENDING_BANK, SONG_ENDING_AT, true)
  else musicStop()
}

/** The gun's loop: started as the trigger goes down, ended as it comes up (channel 12 alone). */
export function sfxGun(on: bool): void {
  if (on) play(SONG_X_GUN_BANK, SONG_X_GUN_AT, false)
  else play(SONG_X_GUNOFF_BANK, SONG_X_GUNOFF_AT, false)
}

export function sfxMissile(): void {
  play(SONG_X_MISSILE_BANK, SONG_X_MISSILE_AT, false)
}

/** The seeker's tone while it tracks, `step` 0-3 higher as the lock nears. */
export function sfxSeek(step: u16): void {
  if (step === 0) play(SONG_X_SEEK1_BANK, SONG_X_SEEK1_AT, false)
  else if (step === 1) play(SONG_X_SEEK2_BANK, SONG_X_SEEK2_AT, false)
  else if (step === 2) play(SONG_X_SEEK3_BANK, SONG_X_SEEK3_AT, false)
  else play(SONG_X_SEEK4_BANK, SONG_X_SEEK4_AT, false)
}

/** The lock: two quick tones as it takes (`first`), then the steady one. */
export function sfxLock(first: bool): void {
  if (first) play(SONG_X_LOCKON_BANK, SONG_X_LOCKON_AT, false)
  else play(SONG_X_LOCK_BANK, SONG_X_LOCK_AT, false)
}

/** The seeker's tones stopped (the lock is lost). */
export function sfxHush(): void {
  play(SONG_X_HUSH_BANK, SONG_X_HUSH_AT, false)
}

/** An enemy missile off its rail. */
export function sfxLaunch(): void {
  play(SONG_X_LAUNCH_BANK, SONG_X_LAUNCH_AT, false)
}

/** A missile burst close by. */
export function sfxNear(): void {
  play(SONG_X_NEAR_BANK, SONG_X_NEAR_AT, false)
}

export function sfxAlert(): void {
  play(SONG_X_ALERT_BANK, SONG_X_ALERT_AT, false)
}

export function sfxHit(): void {
  play(SONG_X_HIT_BANK, SONG_X_HIT_AT, false)
}

export function sfxOuch(): void {
  play(SONG_X_OUCH_BANK, SONG_X_OUCH_AT, false)
}

export function sfxBoom(): void {
  play(SONG_X_BOOM_BANK, SONG_X_BOOM_AT, false)
}

export function sfxFlare(): void {
  play(SONG_X_FLARE_BANK, SONG_X_FLARE_AT, false)
}

export function sfxSelect(): void {
  play(SONG_X_SELECT_BANK, SONG_X_SELECT_AT, false)
}

export function sfxSplash(): void {
  play(SONG_X_SPLASH_BANK, SONG_X_SPLASH_AT, false)
}

/** The stall horn: near the stall or in it. */
export function sfxStall(): void {
  play(SONG_X_STALL_BANK, SONG_X_STALL_AT, false)
}
