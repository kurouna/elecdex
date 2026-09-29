/**
 * The CHIP-8 pane's library (docs/architecture.md section 5.18): which programs there
 * are and how each wants to run. Main keeps it; the page knows a program only by its id
 * and is given its bytes by id, never a path.
 *
 * The bundled programs are described in resources/chip8/programs.json, which
 * scripts/gen-chip8.mjs writes, in chip8Archive's own terms (Octo's option names,
 * `tickrate`, `fontStyle`). `programFromEntry` turns an entry into what the pane runs,
 * through the core's own profiles, so the platforms' quirks live in one place. Each entry
 * is checked on its own when it is read, and a broken one is dropped, not the whole list.
 */

import { z } from 'zod'
import type { GuessReason } from './chip8/platform.js'
import type { Preview } from './chip8/preview.js'
import { quirksFor, quirksFromOcto } from './chip8/quirks.js'
import {
  FONT_STYLES,
  type FontStyle,
  IPF_MAX,
  IPF_MIN,
  PLATFORMS,
  type Platform,
  type Quirks,
} from './chip8/types.js'

/** A program's id: where it came from and its own name, `diag/5-quirks`, `archive/br8kout`. */
export const CHIP8_PROGRAM_ID = /^(diag|archive|imported)\/[a-z0-9][a-z0-9._+-]{0,63}$/i

export const isChip8ProgramId = (id: unknown): id is string =>
  typeof id === 'string' && CHIP8_PROGRAM_ID.test(id)

/**
 * The library's tabs, in their order. STORY holds the visual novels, adventures and RPGs,
 * MUSIC the rhythm games and the tracker, TOYS what is played with rather than won (a
 * paint program, an aquarium, three language interpreters), SHOWCASE the jams' title cards.
 */
export const CHIP8_GENRES = [
  'action',
  'puzzle',
  'story',
  'music',
  'toys',
  'showcase',
  'diag',
  'imported',
] as const
export type Chip8Genre = (typeof CHIP8_GENRES)[number]

export const CHIP8_LICENCES = ['CC0-1.0', 'GPL-3.0', 'unknown'] as const
export type Chip8Licence = (typeof CHIP8_LICENCES)[number]

export type Rotation = 0 | 90 | 180 | 270

/** The author's colours (chip8Archive): the ground, each plane, both planes, and the buzz. */
export interface Chip8Colours {
  ground: string
  plane1: string
  plane2: string
  both: string
  buzz?: string | undefined
}

/** A program as the pane is given it. */
export interface Chip8Program {
  id: string
  title: string
  authors: string[]
  platform: Platform
  genre: Chip8Genre
  description: string
  /** The game jam it was made for, when there was one. */
  event?: string
  /** YYYY or YYYY-MM-DD. */
  released?: string
  /** Instructions per frame. */
  ipf: number
  quirks: Quirks
  font: FontStyle
  /** How far the picture is turned, clockwise. */
  rotation: Rotation
  colours?: Chip8Colours
  licence: Chip8Licence
  /** A frame of its screen for the list (shared/chip8/preview.ts), when it drew anything. */
  preview?: Preview
  /** The keys it asked about in its first seconds, one bit each: the keypad lights them. */
  keys: number
  /** The user's own speed and quirks for it, kept by main; its own are `ipf` and `quirks`. */
  tuning?: Chip8Tuning
  /** Starred in the library. */
  favourite: boolean
  /** For a program imported: the file it came from and when. */
  source?: { name: string; size: number; at: number }
}

/** The speed and quirks a program runs with: its own, under the user's tuning. */
export function tunedConfig(program: Chip8Program): {
  ipf: number
  quirks: Quirks
} {
  return {
    ipf: program.tuning?.ipf ?? program.ipf,
    quirks: program.tuning?.quirks ?? program.quirks,
  }
}

const QuirksSchema = z.object({
  vfReset: z.boolean(),
  memIncrement: z.boolean(),
  shiftVx: z.boolean(),
  jumpVx: z.boolean(),
  clip: z.boolean(),
  displayWait: z.boolean(),
  vfOrder: z.boolean(),
}) satisfies z.ZodType<Quirks>

/** A program's tuning: either part may be left to the program's own. */
export const Chip8TuningSchema = z.object({
  ipf: z.number().int().min(IPF_MIN).max(IPF_MAX).optional(),
  quirks: QuirksSchema.optional(),
})
export type Chip8Tuning = z.infer<typeof Chip8TuningSchema>

/** A program's save slots: the one written by itself, and three the player writes. */
export const CHIP8_SLOTS = ['auto', '1', '2', '3'] as const
export type Chip8Slot = (typeof CHIP8_SLOTS)[number]
export const isChip8Slot = (slot: unknown): slot is Chip8Slot =>
  typeof slot === 'string' && (CHIP8_SLOTS as readonly string[]).includes(slot)

/** A slot that holds a machine: when it was saved, and its screen then. */
export interface Chip8SlotInfo {
  slot: Chip8Slot
  at: number
  preview?: Preview
}

/** What an IMPORT came to: the program added (or found already there), or why not. */
export type Chip8ImportResult =
  | { ok: true; program: Chip8Program; guess: GuessReason; already: boolean }
  | { ok: false; problem: string }

/** What of an imported program the user may change. */
export const Chip8ImportChangeSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  platform: z.enum(PLATFORMS).optional(),
})
export type Chip8ImportChange = z.infer<typeof Chip8ImportChangeSchema>

const hex = z.string().regex(/^#[0-9a-f]{6}$/i)

/** A preview's bits: at most two planes of 128 x 64, in base64. */
const PreviewSchema = z.object({
  w: z.union([z.literal(64), z.literal(128)]),
  h: z.union([z.literal(32), z.literal(64)]),
  planes: z.union([z.literal(1), z.literal(2)]),
  data: z
    .string()
    .max(2800)
    .regex(/^[A-Za-z0-9+/]*={0,2}$/),
})

/** An entry of programs.json, in chip8Archive's terms, with the file its bytes are in. */
export const Chip8CatalogEntrySchema = z.object({
  id: z.string().regex(CHIP8_PROGRAM_ID),
  title: z.string().min(1).max(80),
  authors: z.array(z.string().min(1).max(80)).max(8),
  platform: z.enum(PLATFORMS),
  genre: z.enum(CHIP8_GENRES),
  description: z.string().max(600),
  event: z.string().min(1).max(60).optional(),
  released: z
    .string()
    .regex(/^\d{4}(-\d{2}-\d{2})?$/)
    .optional(),
  tickrate: z.number().int().min(IPF_MIN).max(IPF_MAX).optional(),
  /** Octo's quirk flags, as chip8Archive has them. */
  octo: z.record(z.string(), z.boolean()).optional(),
  fontStyle: z.enum(FONT_STYLES).optional(),
  screenRotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
  colours: z
    .object({ ground: hex, plane1: hex, plane2: hex, both: hex, buzz: hex.optional() })
    .optional(),
  licence: z.enum(CHIP8_LICENCES),
  preview: PreviewSchema.optional(),
  keys: z.number().int().min(0).max(0xffff).default(0),
  /** Beside programs.json: a folder and a .ch8 file, nothing that climbs out. */
  file: z.string().regex(/^[a-z0-9-]+\/[a-z0-9][a-z0-9._+-]{0,80}\.ch8$/i),
})

export type Chip8CatalogEntry = z.infer<typeof Chip8CatalogEntrySchema>

export const CHIP8_CATALOG_VERSION = 1

/** Instructions per frame when a program says nothing: what each machine usually ran at. */
export const DEFAULT_IPF: Readonly<Record<Platform, number>> = {
  chip8: 15,
  schip: 30,
  xochip: 1000,
}

export function programFromEntry(entry: Chip8CatalogEntry): Chip8Program {
  const quirks = entry.octo ? quirksFromOcto(entry.platform, entry.octo) : quirksFor(entry.platform)
  return {
    id: entry.id,
    title: entry.title,
    authors: entry.authors,
    platform: entry.platform,
    genre: entry.genre,
    description: entry.description,
    ...(entry.event !== undefined ? { event: entry.event } : {}),
    ...(entry.released !== undefined ? { released: entry.released } : {}),
    ipf: entry.tickrate ?? DEFAULT_IPF[entry.platform],
    quirks,
    font: entry.fontStyle ?? 'octo',
    rotation: entry.screenRotation ?? 0,
    ...(entry.colours !== undefined ? { colours: entry.colours } : {}),
    licence: entry.licence,
    ...(entry.preview !== undefined ? { preview: entry.preview } : {}),
    keys: entry.keys,
    favourite: false,
  }
}

const CatalogFileSchema = z.object({
  version: z.literal(CHIP8_CATALOG_VERSION),
  programs: z.array(z.unknown()),
})

const idOf = (raw: unknown): string => {
  const id = z.object({ id: z.string() }).safeParse(raw)
  return id.success ? id.data.id : '?'
}

/**
 * The entries of a programs.json, each checked on its own: one that does not parse, or
 * repeats an id, is dropped and named in `dropped`. A file of another version gives none.
 */
export function readCatalog(json: unknown): { entries: Chip8CatalogEntry[]; dropped: string[] } {
  const file = CatalogFileSchema.safeParse(json)
  const entries: Chip8CatalogEntry[] = []
  const dropped: string[] = []
  const seen = new Set<string>()
  for (const raw of file.success ? file.data.programs : []) {
    const parsed = Chip8CatalogEntrySchema.safeParse(raw)
    if (!parsed.success || seen.has(parsed.data.id)) {
      dropped.push(idOf(raw))
      continue
    }
    seen.add(parsed.data.id)
    entries.push(parsed.data)
  }
  return { entries, dropped }
}
