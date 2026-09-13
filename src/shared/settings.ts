import { z } from 'zod'
import { DEFAULT_THEME_ID } from './theme.js'

/**
 * User settings, kept in settings.json under userData.
 *
 * Every field has a default, so an empty or partial file is valid and a newer
 * build can add settings without a migration. The file may be edited by hand
 * while the app runs; main watches it and pushes the result.
 */

export const SETTINGS_VERSION = 1

/** A launcher entry the user adds by hand. */
export const LauncherItemSchema = z.object({
  name: z.string().min(1).max(80),
  /**
   * What to start: an http(s) URL, or a path to a program, document, folder or
   * shortcut. With `args`, the path is run as a program with those arguments.
   */
  target: z.string().min(1).max(2048),
  args: z.array(z.string().max(2048)).max(64).optional(),
})
export type LauncherItem = z.infer<typeof LauncherItemSchema>

export const SettingsSchema = z.object({
  version: z.literal(SETTINGS_VERSION).default(SETTINGS_VERSION),
  /** Theme id; an id no theme has falls back to the default theme. */
  theme: z.string().max(40).default(DEFAULT_THEME_ID),
  sound: z
    .object({
      enabled: z.boolean().default(true),
      /** 0 to 1. */
      volume: z.number().min(0).max(1).default(0.5),
    })
    .default({ enabled: true, volume: 0.5 }),
  /** 'system' follows the OS reduced-motion setting. */
  motion: z.enum(['system', 'full', 'reduced']).default('system'),
  launcher: z
    .object({
      /** List the platform's own applications (Start Menu, /Applications, .desktop files). */
      showSystem: z.boolean().default(true),
      items: z.array(LauncherItemSchema).max(200).default([]),
    })
    .default({ showSystem: true, items: [] }),
  /**
   * Shortcut overrides by action id: a chord such as "Ctrl+Shift+KeyA", or null
   * for none. Actions not listed keep their default. An unusable chord, or an
   * action this build does not know (written by a newer one), is ignored rather
   * than failing the whole file.
   */
  keybindings: z.record(z.string().max(60), z.string().max(40).nullable()).default({}),
  updates: z
    .object({
      /** Ask GitHub once a day whether a newer release exists. Nothing is downloaded. */
      check: z.boolean().default(true),
    })
    .default({ check: true }),
})
export type Settings = z.infer<typeof SettingsSchema>

export const defaultSettings = (): Settings => SettingsSchema.parse({})

/** A change to settings: any subset, one level deep for nested groups. */
export interface SettingsPatch {
  theme?: string
  sound?: Partial<Settings['sound']>
  motion?: Settings['motion']
  launcher?: { showSystem?: boolean }
  /** Replaces the whole override map. */
  keybindings?: Settings['keybindings']
  updates?: Partial<Settings['updates']>
}

const merge = <T extends object>(current: T, value: unknown): T =>
  typeof value === 'object' && value !== null ? { ...current, ...value } : current

/** Applies a patch and validates the result; null if the result is invalid. */
export function applySettingsPatch(current: Settings, patch: unknown): Settings | null {
  if (typeof patch !== 'object' || patch === null) return null
  const p = patch as Record<string, unknown>
  const merged = {
    ...current,
    ...(p.theme !== undefined ? { theme: p.theme } : {}),
    ...(p.motion !== undefined ? { motion: p.motion } : {}),
    ...(p.keybindings !== undefined ? { keybindings: p.keybindings } : {}),
    sound: merge(current.sound, p.sound),
    updates: merge(current.updates, p.updates),
    // Only showSystem: the launcher's own entries are edited in settings.json.
    launcher:
      typeof p.launcher === 'object' && p.launcher !== null && 'showSystem' in p.launcher
        ? { ...current.launcher, showSystem: (p.launcher as { showSystem: unknown }).showSystem }
        : current.launcher,
  }
  const parsed = SettingsSchema.safeParse(merged)
  return parsed.success ? parsed.data : null
}
