/**
 * ELEC-16 units as main keeps them and the page sees them (docs/elec16.md section 8): a unit
 * is one machine - its name, clock and LCD, its battery-backed RAM and its memory card - held
 * by at most one pane at a time. Types and the checks of what a page sends; the machine is
 * shared/elec16.
 */

import { z } from 'zod'
import { CARD_FILE_MAX, CARD_OP, type CardRequest } from './elec16/card.js'
import { CART_ID } from './elec16/cartridge.js'
import {
  DEFAULT_MODEL,
  DEFAULT_XRAM_KB,
  TUNE_MODEL_IDS,
  type TuneModelId,
  XRAM_SIZES_KB,
  type XramSizeKb,
} from './elec16/map.js'

/** The skins a pane may draw its unit in (widgets/elec16/skins.ts has what each looks like). */
export const ELEC16_SKINS = [
  'elec',
  'plain',
  'tron',
  'business-light',
  'business-dark',
  'classic',
  'ivory',
  'night',
] as const
export type Elec16SkinId = (typeof ELEC16_SKINS)[number]

/** The clocks a unit may run at, in MHz, and MAX: as fast as the page's budget allows. */
export const ELEC16_CLOCKS = [1, 2, 4, 8, 16, 32, 'max'] as const
export type Elec16Clock = (typeof ELEC16_CLOCKS)[number]
export const DEFAULT_CLOCK: Elec16Clock = 4

/**
 * Auto power-off, in minutes: the unit switches itself off after this long asleep waiting
 * for a key with nothing else to wake it (docs/elec16.md section 9); 0 never.
 */
export const ELEC16_AUTO_OFF = [10, 30, 0] as const
export type Elec16AutoOff = (typeof ELEC16_AUTO_OFF)[number]
const AutoOffSchema = z.union([z.literal(10), z.literal(30), z.literal(0)])

/** Extended RAM in KB, used only on a model that has it (docs/elec16-play.md section 3). */
const XramSchema = z.literal(XRAM_SIZES_KB)

/** Cycles a second at a clock, or Infinity for MAX. */
export const hzOfClock = (clock: Elec16Clock): number =>
  clock === 'max' ? Number.POSITIVE_INFINITY : clock * 1_000_000

export const UNIT_ID = /^u[1-9][0-9]{0,3}$/
export const isUnitId = (id: unknown): id is string => typeof id === 'string' && UNIT_ID.test(id)

/** A unit's name: what its card and the sheet call it, printable and short. */
export const UnitNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[\x20-\x7e]+$/)

export const Elec16UnitSchema = z.object({
  id: z.string().regex(UNIT_ID),
  name: UnitNameSchema,
  clock: z.union([
    z.literal('max'),
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(8),
    z.literal(16),
    z.literal(32),
  ]),
  model: z.enum(TUNE_MODEL_IDS),
  // Units made before it had one switch off as a new one does.
  autoOff: AutoOffSchema.default(10),
  // Units made before extended RAM take the most, as a new one does.
  xram: XramSchema.default(DEFAULT_XRAM_KB),
  /** PLAY-320: the game in its slot, by id (docs/elec16-play.md section 7); none: empty. */
  cart: z.string().regex(CART_ID).optional(),
  created: z.number(),
})
export type Elec16Unit = z.infer<typeof Elec16UnitSchema>

/** What TUNE may change about a unit. */
export const Elec16UnitChangeSchema = z
  .object({
    name: UnitNameSchema,
    clock: Elec16UnitSchema.shape.clock,
    model: z.enum(TUNE_MODEL_IDS),
    autoOff: AutoOffSchema,
    xram: XramSchema,
  })
  .partial()
export type Elec16UnitChange = z.infer<typeof Elec16UnitChangeSchema>

/** A game on ELEC-16 PLAY's shelf, as the page sees it (main keeps the image). */
export interface Elec16Game {
  id: string
  name: string
  banks: number
  saveBanks: number
  /** elecdex's own (resources/elec16/games), or one the user imported. */
  bundled: boolean
  /** A line about it: the bundled game's, or the name the imported file had. */
  about: string
}

export type Elec16GameImport = { ok: true; id: string } | { ok: false; problem: string }

/** Where a new unit starts: a pane made before units seeds it with what it had. */
export interface Elec16UnitSeed {
  clock?: Elec16Clock
  model?: TuneModelId
}

export const unitDefaults = (
  seed: Elec16UnitSeed = {},
): { clock: Elec16Clock; model: TuneModelId; autoOff: Elec16AutoOff; xram: XramSizeKb } => ({
  clock: seed.clock ?? DEFAULT_CLOCK,
  model: seed.model ?? DEFAULT_MODEL,
  autoOff: 10,
  xram: DEFAULT_XRAM_KB,
})

/** Who holds a unit, as one page sees it: one of its own panes, or another page (null). */
export interface Elec16Holding {
  unit: string
  pane: string | null
}

/** Everything the panes need of the units, sent to every window on any change. */
export interface Elec16Board {
  units: Elec16Unit[]
  held: Elec16Holding[]
}

/** A pane's claim on a unit: its battery backup (null: switch it on afresh), or no. */
export type Elec16Claim = { ok: true; snapshot: Uint8Array | null } | { ok: false }

export interface Elec16FileInfo {
  name: string
  size: number
  modified: number
  /** A SOFT CARD program's line of what it is (its first REM or comment). */
  about?: string
  /** A SOFT CARD program's help: how to start it, its keys, how it ends. */
  help?: string
}

/** What IMPORT gives: the name the file got on the card, or why it did not go there. */
export type Elec16ImportResult = { ok: true; name: string } | { ok: false; problem: string }

/** A card command as the page passes it on: checked again by main, never trusted. */
export const CardRequestSchema = z.object({
  op: z.enum(Object.keys(CARD_OP) as [keyof typeof CARD_OP, ...(keyof typeof CARD_OP)[]]),
  name: z.string().max(12),
  newName: z.string().max(12),
  offset: z.number().int().min(0).max(0xffff),
  length: z.number().int().min(0).max(0xffff),
  data: z
    .instanceof(Uint8Array)
    .refine((d) => d.length <= CARD_FILE_MAX)
    .nullable(),
  address: z.number().int().min(0).max(0xffff),
}) satisfies z.ZodType<CardRequest>
