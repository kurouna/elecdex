/**
 * What a CHIP-8 pane keeps in its pane state (docs/architecture.md section 5.18), read
 * with a default for anything missing or strange - the state comes from layout.json,
 * which a person or an older version may have written.
 *
 * Only display choices live here: which screen is shown, which program, how it is drawn.
 * The machine itself never does (a layout travels to other machines; a snapshot is
 * main's), and neither do a program's speed and quirks (main's, per program).
 */

import { CHIP8_GENRES, type Chip8Genre, isChip8ProgramId } from '@shared/chip8-library'

export const CHIP8_TABS = ['core', 'tune'] as const
export type Chip8Tab = (typeof CHIP8_TABS)[number]

export type LibraryFilter = 'all' | Chip8Genre

export interface Chip8Pane {
  view: 'library' | 'run'
  /** The program chosen, or null before any was. */
  program: string | null
  /** The library's tab. */
  filter: LibraryFilter
  /** Whether the side panel is wanted; it still folds away when the pane is too narrow. */
  panel: boolean | null
  tab: Chip8Tab
  phosphor: boolean
  dots: boolean
  scale: 'integer' | 'fit'
  palette: 'theme' | 'original'
  muted: boolean
}

const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback

const flag = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

export function readChip8Pane(state: Record<string, unknown> | undefined): Chip8Pane {
  const s = state ?? {}
  const program = isChip8ProgramId(s.program) ? s.program : null
  return {
    // A pane with nothing chosen opens on the library, whatever it says.
    view: program === null ? 'library' : oneOf(s.view, ['library', 'run'], 'library'),
    program,
    filter: oneOf<LibraryFilter>(s.filter, ['all', ...CHIP8_GENRES], 'all'),
    // Null: the settings say (chip8.core).
    panel: typeof s.panel === 'boolean' ? s.panel : null,
    tab: oneOf(s.tab, CHIP8_TABS, 'core'),
    phosphor: flag(s.phosphor, true),
    dots: flag(s.dots, true),
    scale: oneOf(s.scale, ['integer', 'fit'], 'integer'),
    palette: oneOf(s.palette, ['theme', 'original'], 'theme'),
    muted: flag(s.muted, false),
  }
}

/** The side panel's width in CSS pixels, and the narrowest screen it may leave. */
export const PANEL_WIDTH = 288
/** Below this many CSS pixels a hires dot's worth of screen, the panel folds away. */
const MIN_UNIT_WITH_PANEL = 3

/**
 * Whether the side panel shows: when it is wanted and the screen beside it still gets at
 * least three CSS pixels a hires dot (six a lores one) - a 128 x 64 picture 384 wide.
 * Otherwise the screen takes the room, and the strip offers the panel back.
 */
export function panelShown(wanted: boolean, room: { w: number; h: number }): boolean {
  if (!wanted) return false
  const left = room.w - PANEL_WIDTH
  return Math.min(left / 128, room.h / 64) >= MIN_UNIT_WITH_PANEL
}
