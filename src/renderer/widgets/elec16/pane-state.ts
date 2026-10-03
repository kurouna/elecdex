/**
 * What an ELEC-16 pane keeps in its pane state (docs/elec16.md section 8), read with a
 * default for anything missing or strange - layout.json may come from a person or an older
 * version. Only display choices and the machine's settings live here, never the machine:
 * a layout travels, and a unit's memory is main's (phase 4).
 */

import {
  DEFAULT_HZ,
  DEFAULT_MODEL,
  MAX_HZ,
  MIN_HZ,
  MODEL_IDS,
  type ModelId,
} from '@shared/elec16/map'
import { isSkinId, type SkinId } from './skins.js'

export const ELEC16_TABS = ['core', 'mem', 'tune'] as const
export type Elec16Tab = (typeof ELEC16_TABS)[number]

/** How the device is drawn: the whole body, the LCD and a row of keys, or the LCD alone. */
export const BODY_MODES = ['auto', 'full', 'compact', 'lcd'] as const
export type BodyMode = (typeof BODY_MODES)[number]

/** The clocks TUNE offers, in MHz, and MAX: as fast as the page's budget allows. */
export const CLOCKS = [1, 2, 4, 8, 16, 32, 'max'] as const
export type Clock = (typeof CLOCKS)[number]

export interface Elec16Pane {
  skin: SkinId
  model: ModelId
  clock: Clock
  body: BodyMode
  /** Whether the side panel is wanted; it still folds away when the pane is too narrow. */
  panel: boolean
  tab: Elec16Tab
  /** Dots that go out fade slowly, as an LCD's do. */
  ghost: boolean
  /** Added to the contrast the machine sets, -7 to 7. */
  contrast: number
}

const oneOf = <T extends string | number>(value: unknown, options: readonly T[], fallback: T): T =>
  (options as readonly unknown[]).includes(value) ? (value as T) : fallback

export function readElec16Pane(state: Record<string, unknown> | undefined): Elec16Pane {
  const s = state ?? {}
  const contrast = typeof s.contrast === 'number' && Number.isInteger(s.contrast) ? s.contrast : 0
  return {
    skin: isSkinId(s.skin) ? s.skin : 'elec',
    model: oneOf(s.model, MODEL_IDS, DEFAULT_MODEL),
    clock: oneOf<Clock>(s.clock, CLOCKS, (DEFAULT_HZ / 1_000_000) as Clock),
    body: oneOf(s.body, BODY_MODES, 'auto'),
    panel: typeof s.panel === 'boolean' ? s.panel : true,
    tab: oneOf(s.tab, ELEC16_TABS, 'core'),
    ghost: typeof s.ghost === 'boolean' ? s.ghost : true,
    contrast: Math.max(-7, Math.min(7, contrast)),
  }
}

/** Cycles a second for a clock, or Infinity for MAX. */
export function hzOf(clock: Clock): number {
  if (clock === 'max') return Number.POSITIVE_INFINITY
  return Math.min(MAX_HZ, Math.max(MIN_HZ, clock * 1_000_000))
}

/** The side panel's width in CSS pixels. */
export const PANEL_WIDTH = 300

/**
 * Whether the side panel shows: when it is wanted and the device beside it still gets room
 * for the LCD at two device pixels a dot - otherwise the device takes the room, and the
 * strip offers the panel back.
 */
export function panelShown(
  wanted: boolean,
  room: { w: number; h: number },
  lcdWidth: number,
): boolean {
  return wanted && room.w - PANEL_WIDTH >= lcdWidth * 2 + 32
}
