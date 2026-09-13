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
  accent: z.object({ h: Hue, s: Percent, l: Percent }),
  surfaces: z.object({ s0: Hex, s1: Hex, s2: Hex, line: Hex }),
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
 */
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
    accent: { h: 36, s: 100, l: 58 },
    surfaces: { s0: '#000000', s1: '#0a0603', s2: '#160e06', line: '#2b1c0c' },
    status: { danger: 4, warn: 52, ok: 88 },
    terminal: { ansiPull: 0.85 },
    effects: { scanlines: true, glow: 0.45 },
  },
  {
    id: 'phosphor',
    name: 'Phosphor',
    author: 'elecdex',
    accent: { h: 128, s: 72, l: 60 },
    surfaces: { s0: '#000000', s1: '#020703', s2: '#061109', line: '#10281a' },
    status: { danger: 8, warn: 58, ok: 150 },
    terminal: { ansiPull: 0.85 },
    effects: { scanlines: true, glow: 0.4 },
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
