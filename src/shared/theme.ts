import { z } from 'zod'

/**
 * Themes: a small, validated description of the look, applied as CSS custom
 * properties with no reload.
 *
 * eDEX-UI themes were JSON files whose values were spliced into a <style> tag
 * with string concatenation (`head.innerHTML += ...`), and switching theme
 * reloaded the whole window - killing nothing only because its shells lived in
 * another process. Here a theme is data: it is validated, turned into a fixed
 * set of CSS variables by a pure function, and set on the root element. Nothing
 * a theme contains is ever parsed as CSS or HTML.
 */

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'a #rrggbb colour')
const Hue = z.number().min(0).max(360)
const Percent = z.number().min(0).max(100)
/** A font family list. Quotes, commas and spaces only - no url(), no semicolons. */
const FontStack = z
  .string()
  .max(200)
  .regex(/^[\w\s"',.-]+$/, 'a font family list')

const AnsiColors = z
  .object({
    black: Hex,
    red: Hex,
    green: Hex,
    yellow: Hex,
    blue: Hex,
    magenta: Hex,
    cyan: Hex,
    white: Hex,
    brightBlack: Hex,
    brightRed: Hex,
    brightGreen: Hex,
    brightYellow: Hex,
    brightBlue: Hex,
    brightMagenta: Hex,
    brightCyan: Hex,
    brightWhite: Hex,
  })
  .partial()

export const ThemeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, 'lowercase letters, digits and hyphens'),
  name: z.string().min(1).max(60),
  author: z.string().max(60).optional(),
  /**
   * Whether the surfaces are dark (the default) or light. A light theme gets
   * darker status colours and a darker strong accent, so they read on white.
   */
  mode: z.enum(['dark', 'light']).optional(),
  accent: z.object({ h: Hue, s: Percent, l: Percent }),
  surfaces: z.object({ s0: Hex, s1: Hex, s2: Hex, line: Hex }),
  /**
   * Text colours. By default text is the accent, as on a monochrome HUD; a theme
   * for everyday work sets neutral text and keeps the accent for highlights.
   * `muted` defaults to the primary text at half strength.
   */
  text: z.object({ primary: Hex, muted: Hex }).partial().optional(),
  /** Hues of the status colours; defaults suit most accents. */
  /** `info` is the cool contrast colour: Saturdays in the calendar. */
  status: z.object({ danger: Hue, warn: Hue, ok: Hue, info: Hue }).partial().optional(),
  fonts: z.object({ display: FontStack, ui: FontStack, mono: FontStack }).partial().optional(),
  terminal: z
    .object({
      /**
       * How far the derived ANSI colours lean toward the accent: 0 keeps their
       * own saturation, 1 adopts the accent's. A monochrome CRT wants it high.
       */
      ansiPull: z.number().min(0).max(1).optional(),
      /** Explicit colours win over the derived palette, one by one. */
      ansi: AnsiColors.optional(),
    })
    .optional(),
  effects: z
    .object({
      /** CRT scanlines over the whole screen. */
      scanlines: z.boolean(),
      /** Phosphor glow on text, 0 (none) to 1. */
      glow: z.number().min(0).max(1),
      /**
       * Launcher icons drawn in the accent (true, the default, so the grid reads
       * as one HUD) or in their own colours, as an ordinary app shows them.
       */
      iconTint: z.boolean(),
    })
    .partial()
    .optional(),
})
export type Theme = z.infer<typeof ThemeSchema>
export type AnsiOverrides = z.infer<typeof AnsiColors>

export const DEFAULT_THEME_ID = 'tron'

/**
 * The built-in themes, all made for elecdex.
 *
 *  - tron: eDEX-UI's default look, a desaturated teal on near-black.
 *  - amber: a monochrome amber terminal, scanlines and a warm glow.
 *  - phosphor: green P1 phosphor, the classic monitor.
 *  - white: a cool white monitor, scanlines and a soft glow. Not pure white on
 *    black: text #D7E0EA on #0A0B0D, the colours of the elec series (elecxzy).
 *  - business-dark / business-light: an ordinary app for the working day, in
 *    Windows 11's dark and light mode colours and the default blue accent, with
 *    its system fonts and a Windows Terminal colour scheme (Campbell, One Half
 *    Light), no grid, scanlines or glow.
 */
const WINDOWS_FONTS = {
  display: '"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif',
  ui: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
  mono: '"Cascadia Mono", Consolas, "JetBrains Mono Variable", ui-monospace, monospace',
}

export const BUILTIN_THEMES: readonly Theme[] = [
  {
    id: 'tron',
    name: 'Tron',
    author: 'elecdex',
    accent: { h: 183, s: 22, l: 74 },
    surfaces: { s0: '#000000', s1: '#05080d', s2: '#0b1118', line: '#262828' },
    terminal: { ansiPull: 0.45 },
    effects: { scanlines: false, glow: 0 },
  },
  {
    id: 'amber',
    name: 'Amber',
    author: 'elecdex',
    // Toned down from s 100 / l 58, whose full-strength orange glared.
    accent: { h: 36, s: 90, l: 50 },
    surfaces: { s0: '#000000', s1: '#0a0603', s2: '#160e06', line: '#2b1c0c' },
    status: { danger: 4, warn: 52, ok: 88 },
    terminal: { ansiPull: 0.85 },
    effects: { scanlines: true, glow: 0.35 },
  },
  {
    id: 'phosphor',
    name: 'Phosphor',
    author: 'elecdex',
    // Toned down from s 72 / l 60, like amber.
    accent: { h: 128, s: 60, l: 48 },
    surfaces: { s0: '#000000', s1: '#020703', s2: '#061109', line: '#10281a' },
    status: { danger: 8, warn: 58, ok: 150 },
    terminal: { ansiPull: 0.85 },
    effects: { scanlines: true, glow: 0.3 },
  },
  {
    id: 'white',
    name: 'White',
    author: 'elecdex',
    // #D7E0EA as hue, saturation and lightness.
    accent: { h: 212, s: 31, l: 88 },
    surfaces: { s0: '#0a0b0d', s1: '#0a0b0d', s2: '#15181c', line: '#262a30' },
    // A pale accent would wash ANSI colours out if pulled hard towards it.
    terminal: { ansiPull: 0.3 },
    effects: { scanlines: true, glow: 0.3 },
  },
  {
    id: 'business-dark',
    name: 'Business (Dark)',
    author: 'elecdex',
    // #60CDFF, Windows 11's default blue accent as it is drawn on dark surfaces.
    accent: { h: 199, s: 100, l: 69 },
    // WinUI's dark backgrounds. The grid line matches the ground, so there is no
    // HUD grid, as in an ordinary window.
    surfaces: { s0: '#1c1c1c', s1: '#202020', s2: '#2c2c2c', line: '#202020' },
    text: { primary: '#ffffff', muted: '#9e9e9e' },
    status: { danger: 354, warn: 40, ok: 113, info: 206 },
    fonts: WINDOWS_FONTS,
    terminal: {
      // Windows Terminal's default scheme, Campbell.
      ansi: {
        black: '#0c0c0c',
        red: '#c50f1f',
        green: '#13a10e',
        yellow: '#c19c00',
        blue: '#0037da',
        magenta: '#881798',
        cyan: '#3a96dd',
        white: '#cccccc',
        brightBlack: '#767676',
        brightRed: '#e74856',
        brightGreen: '#16c60c',
        brightYellow: '#f9f1a5',
        brightBlue: '#3b78ff',
        brightMagenta: '#b4009e',
        brightCyan: '#61d6d6',
        brightWhite: '#f2f2f2',
      },
    },
    effects: { scanlines: false, glow: 0, iconTint: false },
  },
  {
    id: 'business-light',
    name: 'Business (Light)',
    author: 'elecdex',
    mode: 'light',
    // #005FB8, Windows 11's default blue accent as it is drawn on light surfaces.
    accent: { h: 209, s: 100, l: 36 },
    // WinUI's light backgrounds: #F3F3F3 ground, white cards, no grid.
    surfaces: { s0: '#eeeeee', s1: '#f3f3f3', s2: '#ffffff', line: '#f3f3f3' },
    text: { primary: '#1a1a1a', muted: '#5f5f5f' },
    status: { danger: 354, warn: 32, ok: 120, info: 209 },
    fonts: WINDOWS_FONTS,
    terminal: {
      // Windows Terminal's light scheme, One Half Light.
      ansi: {
        black: '#383a42',
        red: '#e45649',
        green: '#50a14f',
        yellow: '#c18301',
        blue: '#0184bc',
        magenta: '#a626a4',
        cyan: '#0997b3',
        white: '#fafafa',
        brightBlack: '#4f525d',
        brightRed: '#df6c75',
        brightGreen: '#98c379',
        brightYellow: '#e4c07a',
        brightBlue: '#61afef',
        brightMagenta: '#c577dd',
        brightCyan: '#56b5c2',
        brightWhite: '#ffffff',
      },
    },
    effects: { scanlines: false, glow: 0, iconTint: false },
  },
]

export interface ThemeProblem {
  /** File name under the themes directory. */
  file: string
  message: string
}

/**
 * Built-ins overlaid with user themes: a user theme with a built-in's id
 * replaces it, the rest are appended. Order is stable for a menu.
 */
export function mergeThemes(builtin: readonly Theme[], user: readonly Theme[]): Theme[] {
  const byId = new Map<string, Theme>()
  for (const theme of builtin) byId.set(theme.id, theme)
  for (const theme of user) byId.set(theme.id, theme)
  const builtinIds = builtin.map((t) => t.id)
  const extra = user
    .map((t) => t.id)
    .filter((id, i, all) => !builtinIds.includes(id) && all.indexOf(id) === i)
    .sort()
  return [...builtinIds, ...extra].map((id) => byId.get(id) as Theme)
}

/** Fixed fallbacks, so a theme that omits an optional part cannot leave a variable stale. */
const DEFAULT_STATUS = { danger: 0, warn: 45, ok: 130, info: 212 }
const DEFAULT_FONTS = {
  display: '"Chakra Petch", system-ui, sans-serif',
  ui: '"Saira Condensed", system-ui, sans-serif',
  mono: '"JetBrains Mono Variable", ui-monospace, monospace',
}

/** Text follows the accent unless the theme names its colours; muted is half strength. */
function textVariables(theme: Theme): Record<string, string> {
  const accent = 'var(--accent-h) var(--accent-s) var(--accent-l)'
  const primary = theme.text?.primary
  const halfPrimary =
    primary === undefined
      ? `hsl(${accent} / 0.5)`
      : `color-mix(in srgb, ${primary} 50%, transparent)`
  return {
    '--text-base': primary ?? `hsl(${accent})`,
    '--text-muted-base': theme.text?.muted ?? halfPrimary,
  }
}

/**
 * The CSS custom properties a theme sets. Every theme sets every one of them,
 * so switching from a theme that sets fonts to one that does not resets them.
 */
export function themeVariables(theme: Theme): Record<string, string> {
  // Field by field: a partial object may carry explicit undefineds.
  const status = {
    danger: theme.status?.danger ?? DEFAULT_STATUS.danger,
    warn: theme.status?.warn ?? DEFAULT_STATUS.warn,
    ok: theme.status?.ok ?? DEFAULT_STATUS.ok,
    info: theme.status?.info ?? DEFAULT_STATUS.info,
  }
  const fonts = {
    display: theme.fonts?.display ?? DEFAULT_FONTS.display,
    ui: theme.fonts?.ui ?? DEFAULT_FONTS.ui,
    mono: theme.fonts?.mono ?? DEFAULT_FONTS.mono,
  }
  return {
    '--accent-h': String(theme.accent.h),
    '--accent-s': `${theme.accent.s}%`,
    '--accent-l': `${theme.accent.l}%`,
    '--surface-0': theme.surfaces.s0,
    '--surface-1': theme.surfaces.s1,
    '--surface-2': theme.surfaces.s2,
    '--line': theme.surfaces.line,
    ...textVariables(theme),
    '--hue-danger': String(status.danger),
    '--hue-warn': String(status.warn),
    '--hue-ok': String(status.ok),
    '--hue-info': String(status.info),
    '--font-display': fonts.display,
    '--font-ui': fonts.ui,
    '--font-mono': fonts.mono,
    '--glow': String(theme.effects?.glow ?? 0),
    '--scanlines': theme.effects?.scanlines ? '1' : '0',
    '--terminal-ansi-pull': String(theme.terminal?.ansiPull ?? 0.45),
  }
}
