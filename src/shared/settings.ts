import { z } from 'zod'
import { PLUGIN_ID, type PluginSettings, PluginSettingsSchema } from './plugins.js'
import { INTENSITIES, MAGNITUDES } from './quakes.js'
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
  terminal: z
    .object({
      /**
       * The folder a new shell starts in. Empty for the home folder; "~" stands for
       * it at the start of a path. A folder that does not exist starts the shell at
       * home instead (main/pty/start-directory.ts).
       */
      startDirectory: z.string().max(1024).default(''),
    })
    .default({ startDirectory: '' }),
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
  keybindings: z
    .record(z.string().max(60), z.string().max(40).nullable())
    .refine((map) => Object.keys(map).length <= 64, 'too many shortcut overrides')
    .default({}),
  /**
   * Running in the background, Windows only (shared/background.ts). All off by
   * default: each is the user's explicit choice. Whether elecdex launches at
   * sign-in is not kept here - Windows holds it, and the user can turn it off
   * there too.
   */
  window: z
    .object({
      /** Minimising hides the window to the notification area. */
      minimizeToTray: z.boolean().default(false),
      /** Closing the window hides it to the notification area, and elecdex keeps running. */
      closeToTray: z.boolean().default(false),
      /** The window.toggle shortcut works from every app. */
      globalShortcut: z.boolean().default(false),
      /** Launched at sign-in, elecdex starts hidden in the notification area. */
      startInBackground: z.boolean().default(false),
    })
    .default({
      minimizeToTray: false,
      closeToTray: false,
      globalShortcut: false,
      startInBackground: false,
    }),
  /** Web panes (browser, YouTube, X): docs/architecture.md section 5.4. */
  web: z
    .object({
      /**
       * Draw pages in the theme's accent, as the launcher's icons are, unless a pane
       * says otherwise with its own switch. Off by default: a tinted site is harder to
       * read and watch than the HUD around it. Themes that keep icons in their own
       * colours (Business) never tint.
       */
      tint: z.boolean().default(false),
    })
    .default({ tint: false }),
  updates: z
    .object({
      /** Ask GitHub once a day whether a newer release exists. Nothing is downloaded. */
      check: z.boolean().default(true),
    })
    .default({ check: true }),
  /**
   * Earthquakes and tsunamis: where they are read from, and the alerts. Alerts are
   * off by default: while on, main checks the source every minute, whether or not
   * a quakes pane is open.
   */
  quakes: z
    .object({
      /** JMA for Japan, the USGS for the world, or auto: Japan when the system is set up for it. */
      source: z.enum(['auto', 'jma', 'usgs']).default('auto'),
      notify: z.boolean().default(false),
      /** Japan: the weakest maximum intensity (shindo) that is announced. */
      minIntensity: z.enum(INTENSITIES).default('5-'),
      /**
       * The world: the smallest magnitude that is announced. The dialog offers MAGNITUDES;
       * any value in range is kept, so a hand edit such as 6.2 does not invalidate the file.
       */
      minMagnitude: z.number().min(MAGNITUDES[0]).max(9).default(6),
      /** Tsunami warnings, watches and advisories, announced whatever the earthquake thresholds. */
      tsunami: z.boolean().default(true),
      /** Also a system notification, when the window is not in front. */
      system: z.boolean().default(true),
      /** An alert sound, when interface sounds are on. */
      sound: z.boolean().default(true),
    })
    .default({
      source: 'auto',
      notify: false,
      minIntensity: '5-',
      minMagnitude: 6,
      tsunami: true,
      system: true,
      sound: true,
    }),
  /**
   * Task reminders (the tasks pane). Unlike the quake alerts these are on by default:
   * nothing is fetched for them, they only go off for deadlines the user typed in, and
   * a reminder that has to be switched on first is a reminder that is missed once.
   */
  reminders: z
    .object({
      notify: z.boolean().default(true),
      /** Also a system notification, when the window is not in front. */
      system: z.boolean().default(true),
      /** A sound, when interface sounds are on. */
      sound: z.boolean().default(true),
      /** How long "snooze" puts a task off for. */
      snoozeMinutes: z.number().int().min(1).max(1440).default(10),
      /** Announce this many minutes before the deadline itself. */
      leadMinutes: z.number().int().min(0).max(1440).default(0),
    })
    .default({ notify: true, system: true, sound: true, snoozeMinutes: 10, leadMinutes: 0 }),
  /**
   * Plugins by id: whether each is on, what the user agreed it may do, and its setting
   * values. A plugin never listed here is off (docs/plugins.md section 8).
   */
  plugins: z
    .record(z.string().regex(PLUGIN_ID), PluginSettingsSchema)
    .refine((map) => Object.keys(map).length <= 128, 'too many plugins')
    .default({}),
})
export type Settings = z.infer<typeof SettingsSchema>

export const defaultSettings = (): Settings => SettingsSchema.parse({})

/** A change to settings: any subset, one level deep for nested groups. */
export interface SettingsPatch {
  theme?: string
  sound?: Partial<Settings['sound']>
  motion?: Settings['motion']
  launcher?: { showSystem?: boolean }
  terminal?: Partial<Settings['terminal']>
  /** Replaces the whole override map. */
  keybindings?: Settings['keybindings']
  window?: Partial<Settings['window']>
  updates?: Partial<Settings['updates']>
  web?: Partial<Settings['web']>
  quakes?: Partial<Settings['quakes']>
  reminders?: Partial<Settings['reminders']>
  /** Per plugin id: fields to change (values and granted are replaced whole), or null to forget it. */
  plugins?: Record<string, Partial<PluginSettings> | null>
}

const merge = <T extends object>(current: T, value: unknown): T =>
  typeof value === 'object' && value !== null ? { ...current, ...value } : current

function mergePlugins(current: Settings['plugins'], value: unknown): Settings['plugins'] {
  if (typeof value !== 'object' || value === null) return current
  const next = { ...current }
  for (const [id, change] of Object.entries(value)) {
    if (change === null) delete next[id]
    else next[id] = merge(next[id] ?? PluginSettingsSchema.parse({}), change)
  }
  return next
}

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
    window: merge(current.window, p.window),
    updates: merge(current.updates, p.updates),
    web: merge(current.web, p.web),
    quakes: merge(current.quakes, p.quakes),
    reminders: merge(current.reminders, p.reminders),
    terminal: merge(current.terminal, p.terminal),
    plugins: mergePlugins(current.plugins, p.plugins),
    // Only showSystem: the launcher's own entries are edited in settings.json.
    launcher:
      typeof p.launcher === 'object' && p.launcher !== null && 'showSystem' in p.launcher
        ? { ...current.launcher, showSystem: (p.launcher as { showSystem: unknown }).showSystem }
        : current.launcher,
  }
  const parsed = SettingsSchema.safeParse(merged)
  return parsed.success ? parsed.data : null
}
