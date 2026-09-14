import { applySettingsPatch, defaultSettings, SettingsSchema } from '@shared/settings'
import {
  BUILTIN_THEMES,
  DEFAULT_THEME_ID,
  mergeThemes,
  type Theme,
  ThemeSchema,
  themeVariables,
} from '@shared/theme'
import { describe, expect, it } from 'vitest'
import { allowPlay, recipeLength, SOUNDS } from '../../src/renderer/lib/sfx.js'
import {
  buildXtermTheme,
  minimumContrastRatio,
} from '../../src/renderer/widgets/terminal/xterm-theme.js'

const custom: Theme = {
  id: 'ice',
  name: 'Ice',
  accent: { h: 200, s: 60, l: 70 },
  surfaces: { s0: '#000000', s1: '#010203', s2: '#040506', line: '#101820' },
}

describe('built-in themes', () => {
  it('ships six valid themes, the default among them', () => {
    expect(BUILTIN_THEMES.map((t) => t.id)).toEqual([
      'tron',
      'amber',
      'phosphor',
      'white',
      'business-dark',
      'business-light',
    ])
    for (const theme of BUILTIN_THEMES) expect(ThemeSchema.safeParse(theme).success).toBe(true)
    expect(BUILTIN_THEMES.some((t) => t.id === DEFAULT_THEME_ID)).toBe(true)
  })
})

describe('ThemeSchema', () => {
  it('accepts a minimal theme', () => {
    expect(ThemeSchema.safeParse(custom).success).toBe(true)
  })

  it.each([
    ['a colour that is not #rrggbb', { surfaces: { ...custom.surfaces, s1: 'red' } }],
    ['CSS smuggled into a colour', { surfaces: { ...custom.surfaces, line: '#000; }' } }],
    ['a font stack with url()', { fonts: { mono: 'x"); background: url(http://evil' } }],
    ['an id with a path in it', { id: '../../etc' }],
    ['a hue out of range', { accent: { h: 400, s: 10, l: 10 } }],
    ['CSS smuggled into a text colour', { text: { primary: 'red; color: blue' } }],
  ])('rejects %s', (_label, change) => {
    expect(ThemeSchema.safeParse({ ...custom, ...change }).success).toBe(false)
  })
})

describe('mergeThemes', () => {
  it('appends user themes after the built-ins', () => {
    expect(mergeThemes(BUILTIN_THEMES, [custom]).map((t) => t.id)).toEqual([
      'tron',
      'amber',
      'phosphor',
      'white',
      'business-dark',
      'business-light',
      'ice',
    ])
  })

  it('lets a user theme replace a built-in of the same id, in place', () => {
    const mine = { ...custom, id: 'amber', name: 'My Amber' }
    const merged = mergeThemes(BUILTIN_THEMES, [mine])
    expect(merged.map((t) => t.id)).toEqual([
      'tron',
      'amber',
      'phosphor',
      'white',
      'business-dark',
      'business-light',
    ])
    expect(merged[1]?.name).toBe('My Amber')
  })
})

describe('themeVariables', () => {
  it('sets every variable, even for a theme that omits the optional parts', () => {
    const full = Object.keys(themeVariables(BUILTIN_THEMES[1] as Theme)).sort()
    const minimal = Object.keys(themeVariables(custom)).sort()
    expect(minimal).toEqual(full)
    expect(themeVariables(custom)['--glow']).toBe('0')
    expect(themeVariables(custom)['--scanlines']).toBe('0')
  })

  it('writes the accent as the parts tokens.css builds colours from', () => {
    const vars = themeVariables(custom)
    expect(vars['--accent-h']).toBe('200')
    expect(vars['--accent-s']).toBe('60%')
    expect(vars['--accent-l']).toBe('70%')
    expect(vars['--surface-1']).toBe('#010203')
  })

  it('makes text the accent unless the theme names its text colours', () => {
    const accent = 'var(--accent-h) var(--accent-s) var(--accent-l)'
    expect(themeVariables(custom)['--text-base']).toBe(`hsl(${accent})`)
    expect(themeVariables(custom)['--text-muted-base']).toBe(`hsl(${accent} / 0.5)`)

    const primaryOnly = themeVariables({ ...custom, text: { primary: '#ffffff' } })
    expect(primaryOnly['--text-base']).toBe('#ffffff')
    expect(primaryOnly['--text-muted-base']).toBe('color-mix(in srgb, #ffffff 50%, transparent)')

    const both = themeVariables({ ...custom, text: { primary: '#ffffff', muted: '#9e9e9e' } })
    expect(both['--text-muted-base']).toBe('#9e9e9e')
  })

  it.each([
    ['business-dark', undefined, '#202020', '#ffffff'],
    ['business-light', 'light', '#f3f3f3', '#1a1a1a'],
  ])(
    '%s is a plain Windows 11 app: neutral text, no grid, glow or scanlines',
    (id, mode, ground, text) => {
      const business = BUILTIN_THEMES.find((t) => t.id === id) as Theme
      expect(business.mode).toBe(mode)
      const vars = themeVariables(business)
      expect(vars['--surface-1']).toBe(ground)
      expect(vars['--line']).toBe(vars['--surface-1'])
      expect(vars['--text-base']).toBe(text)
      expect(vars['--glow']).toBe('0')
      expect(vars['--scanlines']).toBe('0')
      expect(vars['--font-ui']).toContain('Segoe UI')
    },
  )

  it('knows only dark and light modes', () => {
    expect(ThemeSchema.safeParse({ ...custom, mode: 'light' }).success).toBe(true)
    expect(ThemeSchema.safeParse({ ...custom, mode: 'sepia' }).success).toBe(false)
  })

  it('keeps the monochrome CRT accents short of full brightness', () => {
    // The brightest RGB channel of an HSL colour, 0 to 1.
    const peak = ({ s, l }: Theme['accent']) =>
      l / 100 + ((s / 100) * (1 - Math.abs((2 * l) / 100 - 1))) / 2
    for (const id of ['amber', 'phosphor']) {
      const theme = BUILTIN_THEMES.find((t) => t.id === id) as Theme
      expect(peak(theme.accent), id).toBeLessThanOrEqual(0.95)
      expect(theme.effects?.glow ?? 0, id).toBeLessThanOrEqual(0.35)
    }
  })
})

describe('settings', () => {
  it('fills defaults into an empty file', () => {
    expect(SettingsSchema.parse({})).toEqual({
      version: 1,
      theme: 'tron',
      sound: { enabled: true, volume: 0.5 },
      motion: 'system',
      terminal: { startDirectory: '' },
      launcher: { showSystem: true, items: [] },
      keybindings: {},
      updates: { check: true },
      quakes: {
        source: 'auto',
        notify: false,
        minIntensity: '5-',
        minMagnitude: 6,
        tsunami: true,
        system: true,
        sound: true,
      },
    })
  })

  it('merges earthquake alert settings and refuses an intensity JMA does not use', () => {
    const next = applySettingsPatch(defaultSettings(), {
      quakes: { notify: true, minIntensity: '4' },
    })
    expect(next?.quakes).toMatchObject({ notify: true, minIntensity: '4', minMagnitude: 6 })
    expect(applySettingsPatch(defaultSettings(), { quakes: { minIntensity: '5' } })).toBeNull()
    // The world: a magnitude in range (a hand edit off the offered steps is kept), and a known source.
    expect(
      applySettingsPatch(defaultSettings(), { quakes: { minMagnitude: 7.5 } })?.quakes.minMagnitude,
    ).toBe(7.5)
    expect(
      applySettingsPatch(defaultSettings(), { quakes: { minMagnitude: 6.2 } })?.quakes.minMagnitude,
    ).toBe(6.2)
    expect(applySettingsPatch(defaultSettings(), { quakes: { minMagnitude: 3 } })).toBeNull()
    expect(applySettingsPatch(defaultSettings(), { quakes: { source: 'mars' } })).toBeNull()
  })

  it('the terminal starts at home by default, and takes a folder by patch or hand edit', () => {
    expect(defaultSettings().terminal).toEqual({ startDirectory: '' })
    expect(SettingsSchema.parse({ terminal: {} }).terminal.startDirectory).toBe('')
    const next = applySettingsPatch(defaultSettings(), {
      terminal: { startDirectory: 'D:\\work' },
    })
    expect(next?.terminal.startDirectory).toBe('D:\\work')
    expect(
      applySettingsPatch(defaultSettings(), { terminal: { startDirectory: 'x'.repeat(1025) } }),
    ).toBeNull()
    expect(applySettingsPatch(defaultSettings(), { terminal: { startDirectory: 42 } })).toBeNull()
  })

  it('patches one field of a group without losing the others', () => {
    const next = applySettingsPatch(defaultSettings(), { sound: { enabled: false } })
    expect(next?.sound).toEqual({ enabled: false, volume: 0.5 })
  })

  it('refuses a patch that would make the settings invalid', () => {
    expect(applySettingsPatch(defaultSettings(), { sound: { volume: 7 } })).toBeNull()
    expect(applySettingsPatch(defaultSettings(), { motion: 'sideways' })).toBeNull()
    expect(applySettingsPatch(defaultSettings(), 'theme=amber')).toBeNull()
  })
})

describe('terminal palette for a theme', () => {
  const input = { hue: 36, saturation: 100, lightness: 58, foreground: '#fff', background: '#000' }

  it('leans ANSI colours toward the accent as the pull rises', () => {
    const loose = buildXtermTheme({ ...input, pull: 0 })
    const tight = buildXtermTheme({ ...input, pull: 0.9 })
    expect(tight.green).not.toBe(loose.green)
    // Still distinct from each other, or `git diff` would be unreadable.
    expect(tight.red).not.toBe(tight.green)
  })

  it('has xterm lift faint colours to 4.5:1 on a light theme only', () => {
    // White and bright yellow from the shell would vanish on a white ground.
    expect(minimumContrastRatio('light')).toBe(4.5)
    expect(minimumContrastRatio('dark')).toBe(1)
    expect(minimumContrastRatio(undefined)).toBe(1)
  })

  it('uses a theme’s explicit colours over the derived ones', () => {
    const theme = buildXtermTheme(input, { red: '#ff0000', brightWhite: '#ffffff' })
    expect(theme.red).toBe('#ff0000')
    expect(theme.brightWhite).toBe('#ffffff')
    expect(theme.green).toBe(buildXtermTheme(input).green)
  })
})

describe('sound recipes', () => {
  it('keeps every sound short and quiet enough for an interface', () => {
    for (const [name, recipe] of Object.entries(SOUNDS)) {
      expect(recipeLength(recipe), name).toBeLessThanOrEqual(1.2)
      for (const tone of recipe.tones) expect(tone.gain, name).toBeLessThanOrEqual(0.3)
    }
  })

  it('rate-limits a sound played in a burst', () => {
    expect(allowPlay(undefined, 0, 28)).toBe(true)
    expect(allowPlay(100, 110, 28)).toBe(false)
    expect(allowPlay(100, 128, 28)).toBe(true)
  })
})

describe('settings patches for the settings dialog', () => {
  it('replaces keybindings, merges updates, and changes only showSystem of the launcher', () => {
    const base = {
      ...defaultSettings(),
      launcher: { showSystem: true, items: [{ name: 'Mine', target: '/bin/x' }] },
    }
    const next = applySettingsPatch(base, {
      keybindings: { 'pane.add': 'Alt+KeyP' },
      updates: { check: false },
      launcher: { showSystem: false, items: [] },
    })
    expect(next?.keybindings).toEqual({ 'pane.add': 'Alt+KeyP' })
    expect(next?.updates.check).toBe(false)
    expect(next?.launcher).toEqual({
      showSystem: false,
      items: [{ name: 'Mine', target: '/bin/x' }],
    })
    // An action this build does not know (from a newer one) is kept, not an error.
    expect(applySettingsPatch(base, { keybindings: { 'no.such': 'Alt+KeyP' } })).not.toBeNull()
    expect(applySettingsPatch(base, { keybindings: { 'pane.add': 42 } })).toBeNull()
  })
})
