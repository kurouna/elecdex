/**
 * What an ELEC-16 pane keeps in its pane state (docs/elec16.md section 8), read with a
 * default for anything missing or strange - layout.json may come from a person or an older
 * version. Only display choices and which unit live here, never the machine nor the unit's
 * own settings (clock, LCD): a layout travels, and a unit is main's (unit-session.svelte.ts).
 */

import { isCardName } from '@shared/elec16/card'
import { MODEL_IDS } from '@shared/elec16/map'
import { ELEC16_CLOCKS, type Elec16UnitSeed, isUnitId } from '@shared/elec16-units'
import { oneOf } from '../emu/format.js'
import { PLAY_BODY_MODES, PLAY_SKINS, type PlayBodyMode, type PlaySkin } from './play-body.js'
import { isSkinId, type SkinId } from './skins.js'

export const ELEC16_TABS = ['core', 'mem', 'files', 'games', 'link', 'tune'] as const
export type Elec16Tab = (typeof ELEC16_TABS)[number]

/** What the pane shows: the machine, or CODE (TypeScript compiled for it). */
export const ELEC16_VIEWS = ['machine', 'code'] as const
export type Elec16View = (typeof ELEC16_VIEWS)[number]

/** The .TS file CODE edits when the pane names none. */
export const CODE_FILE = 'MAIN.TS'

/** How the device is drawn: the whole body, the LCD and a row of keys, or the LCD alone. */
export const BODY_MODES = ['auto', 'full', 'compact', 'lcd'] as const
export type BodyMode = (typeof BODY_MODES)[number]

export interface Elec16Pane {
  skin: SkinId
  /** The unit the pane runs, by id; none yet: the session picks one. */
  unit: string | undefined
  /** A pane from before units had its own clock and LCD: they seed its first unit. */
  seed: Elec16UnitSeed
  body: BodyMode
  /** Whether the side panel is wanted; it still folds away when the pane is too narrow. */
  panel: boolean
  tab: Elec16Tab
  /** Dots that go out fade slowly, as an LCD's do. */
  ghost: boolean
  /** Added to the contrast the machine sets, -7 to 7. */
  contrast: number
  view: Elec16View
  /** The .TS source on the unit's card CODE edits. */
  codeFile: string
  /** The optimisation level whose code CODE shows, runs and saves. */
  codeLevel: 0 | 1 | 2
  /** PLAY-320's body (play-body.ts): chosen by the room, tall, wide, or the screen alone. */
  playBody: PlayBodyMode
  /** And its colours. */
  playSkin: PlaySkin
}

/** `skin` is a new pane's: the setting's, until the pane is given its own. */
export function readElec16Pane(
  state: Record<string, unknown> | undefined,
  skin: SkinId = 'elec',
): Elec16Pane {
  const s = state ?? {}
  const contrast = typeof s.contrast === 'number' && Number.isInteger(s.contrast) ? s.contrast : 0
  const clock = ELEC16_CLOCKS.find((c) => c === s.clock)
  const model = MODEL_IDS.find((m) => m === s.model)
  return {
    skin: isSkinId(s.skin) ? s.skin : skin,
    unit: isUnitId(s.unit) ? s.unit : undefined,
    seed: { ...(clock !== undefined ? { clock } : {}), ...(model !== undefined ? { model } : {}) },
    body: oneOf(s.body, BODY_MODES, 'auto'),
    panel: typeof s.panel === 'boolean' ? s.panel : true,
    tab: oneOf(s.tab, ELEC16_TABS, 'core'),
    ghost: typeof s.ghost === 'boolean' ? s.ghost : true,
    contrast: Math.max(-7, Math.min(7, contrast)),
    view: oneOf(s.view, ELEC16_VIEWS, 'machine'),
    codeFile:
      typeof s.codeFile === 'string' && isCardName(s.codeFile) && s.codeFile.endsWith('.TS')
        ? s.codeFile
        : CODE_FILE,
    codeLevel: s.codeLevel === 0 || s.codeLevel === 1 ? s.codeLevel : 2,
    playBody: oneOf(s.playBody, PLAY_BODY_MODES, 'auto'),
    playSkin: oneOf(s.playSkin, PLAY_SKINS, 'graphite'),
  }
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
