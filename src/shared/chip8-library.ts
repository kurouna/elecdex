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

/** The library's tabs, in their order. */
export const CHIP8_GENRES = ['action', 'puzzle', 'showcase', 'toys', 'diag', 'imported'] as const
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
}

const hex = z.string().regex(/^#[0-9a-f]{6}$/i)

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
