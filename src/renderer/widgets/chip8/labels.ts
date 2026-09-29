import type { GuessReason } from '@shared/chip8/platform'
import { profileOf, QUIRK_PROFILES } from '@shared/chip8/quirks'
import { type Platform, QUIRK_NAMES, type Quirks } from '@shared/chip8/types'
import {
  type Chip8Genre,
  type Chip8Program,
  type Chip8Tuning,
  tunedConfig,
} from '@shared/chip8-library'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * The CHIP-8 pane's words for its programs (docs/architecture.md section 5.18), in one
 * place for the library, the run strip and the detail card. Pure.
 */

export const PLATFORM_CHIPS: Readonly<Record<Platform, string>> = {
  chip8: 'C8',
  schip: 'SC',
  xochip: 'XO',
}

export const PLATFORM_NAMES: Readonly<Record<Platform, string>> = {
  chip8: 'CHIP-8',
  schip: 'SUPER-CHIP',
  xochip: 'XO-CHIP',
}

export const GENRE_LABELS: Readonly<Record<Chip8Genre, string>> = {
  action: 'action',
  puzzle: 'puzzle',
  story: 'story',
  music: 'music',
  toys: 'toys',
  showcase: 'showcase',
  diag: 'diag',
  imported: 'imported',
}

/** The screen a machine draws on: CHIP-8 one resolution, the others two. */
export const screenWords = (platform: Platform): string =>
  platform === 'chip8'
    ? '64 × 32'
    : `64 × 32 and 128 × 64${platform === 'xochip' ? ', 4 colours' : ''}`

/** The keys a program asked about, as the pad names them: "4 5 6". */
export function keyWords(keys: number): string {
  const pads: string[] = []
  for (let k = 0; k < 16; k++) if (keys & (1 << k)) pads.push(k.toString(16).toUpperCase())
  return pads.join(' ')
}

export const PROFILE_NAMES: Readonly<Record<Platform, string>> = {
  chip8: 'VIP',
  schip: 'SCHIP',
  xochip: 'XO',
}

export const QUIRK_LABELS: Readonly<Record<keyof Quirks, string>> = {
  vfReset: 'vf reset',
  memIncrement: 'i increment',
  shiftVx: 'shift vx',
  jumpVx: 'jump vx',
  clip: 'clip',
  displayWait: 'display wait',
  vfOrder: 'vf order',
}

/**
 * The quirks in words: a profile's name when they are one, else its machine's profile and
 * each flag that differs from it ("VIP, shift vx on, display wait off").
 */
export function quirkWords(platform: Platform, quirks: Quirks): string {
  const profile = profileOf(quirks)
  if (profile !== null) return PROFILE_NAMES[profile]
  const own = QUIRK_PROFILES[platform]
  const changed = QUIRK_NAMES.filter((name) => own[name] !== quirks[name]).map(
    (name) => `${QUIRK_LABELS[name]} ${quirks[name] ? 'on' : 'off'}`,
  )
  return [PROFILE_NAMES[platform], ...changed].join(', ')
}

/**
 * A program's detail card, under its whole description: what the row has no room for - the
 * machine and how it runs, the keys it uses, the day it came out - never the row's title,
 * authors, jam or year again.
 */
export function programRows(program: Chip8Program): CardRow[] {
  const { ipf, quirks } = tunedConfig(program)
  const yours = (own: boolean): string => (own ? '' : ' · yours')
  const rows: CardRow[] = [
    {
      label: 'machine',
      value: `${PLATFORM_NAMES[program.platform]} · ${screenWords(program.platform)}`,
    },
    {
      label: 'speed',
      value: `${ipf.toLocaleString('en-US')} instructions a frame${yours(program.tuning?.ipf === undefined)}`,
    },
    {
      label: 'quirks',
      value: `${quirkWords(program.platform, quirks)}${yours(program.tuning?.quirks === undefined)}`,
    },
  ]
  if (program.keys !== 0) rows.push({ label: 'keys', value: keyWords(program.keys) })
  if (program.released !== undefined && program.released.length > 4)
    rows.push({ label: 'released', value: program.released })
  if (program.rotation !== 0) rows.push({ label: 'screen', value: `turned ${program.rotation}°` })
  if (program.source !== undefined) {
    const { name, size, at } = program.source
    rows.push({ label: 'file', value: `${name} · ${size.toLocaleString('en-US')} bytes` })
    rows.push({ label: 'imported', value: dateWords(at) })
  }
  rows.push({ label: 'licence', value: program.licence, muted: true })
  return rows
}

const two = (n: number): string => String(n).padStart(2, '0')

/** A moment as the pane writes it: 2026-09-30 14:32, local time. */
export function dateWords(at: number): string {
  const when = new Date(at)
  const day = `${when.getFullYear()}-${two(when.getMonth() + 1)}-${two(when.getDate())}`
  return `${day} ${two(when.getHours())}:${two(when.getMinutes())}`
}

/** When something was kept: the time alone on the day it is now, else the date too. */
export function whenWords(at: number, now: number): string {
  const full = dateWords(at)
  return new Date(at).toDateString() === new Date(now).toDateString() ? full.slice(11) : full
}

/** Why an imported program was taken for the machine it was. */
export const GUESS_WORDS: Readonly<Record<GuessReason, string>> = {
  size: 'too big for any other machine',
  'xo-instructions': 'it uses XO-CHIP instructions',
  'super-instructions': 'it uses SUPER-CHIP instructions',
  plain: 'it uses only CHIP-8 instructions',
}

/**
 * The user's tuning of a program: what differs from its own speed and quirks, or null when
 * nothing does (and main forgets it).
 */
export function tuningFrom(
  program: Chip8Program,
  config: { ipf: number; quirks: Quirks },
): Chip8Tuning | null {
  const ipf = config.ipf !== program.ipf ? config.ipf : undefined
  const differs = QUIRK_NAMES.some((name) => config.quirks[name] !== program.quirks[name])
  if (ipf === undefined && !differs) return null
  return {
    ...(ipf !== undefined ? { ipf } : {}),
    ...(differs ? { quirks: { ...config.quirks } } : {}),
  }
}
