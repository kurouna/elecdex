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
})
export type Settings = z.infer<typeof SettingsSchema>

export const defaultSettings = (): Settings => SettingsSchema.parse({})

/** A change to settings: any subset, one level deep for nested groups. */
export interface SettingsPatch {
  theme?: string
  sound?: Partial<Settings['sound']>
  motion?: Settings['motion']
}

/** Applies a patch and validates the result; null if the result is invalid. */
export function applySettingsPatch(current: Settings, patch: unknown): Settings | null {
  if (typeof patch !== 'object' || patch === null) return null
  const p = patch as Record<string, unknown>
  const merged = {
    ...current,
    ...(p.theme !== undefined ? { theme: p.theme } : {}),
    ...(p.motion !== undefined ? { motion: p.motion } : {}),
    sound:
      typeof p.sound === 'object' && p.sound !== null
        ? { ...current.sound, ...(p.sound as object) }
        : current.sound,
  }
  const parsed = SettingsSchema.safeParse(merged)
  return parsed.success ? parsed.data : null
}
