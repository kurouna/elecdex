import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, type Settings } from '../../src/shared/settings.ts'
import { BUILTIN_THEMES, DEFAULT_THEME_ID, themeVariables } from '../../src/shared/theme.ts'

/**
 * The theme's revision, which every terminal (its glyph atlas) and every
 * canvas chart re-reads colours on: bumped when the look changed, and not for
 * a settings change that has nothing to do with it - a reminder toggled, a
 * system prompt edited - which used to rebuild all of them.
 */

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function started(initial: Settings = defaultSettings()) {
  let push: (settings: Settings) => void = () => {}
  vi.stubGlobal('elecdex', {
    settings: {
      get: () => Promise.resolve(initial),
      onChange: (handler: (settings: Settings) => void) => {
        push = handler
        return () => {}
      },
    },
    themes: {
      list: () => Promise.resolve({ themes: [...BUILTIN_THEMES], problems: [] }),
      onChange: () => () => {},
    },
  })
  const { appearance } = await import('../../src/renderer/stores/appearance.svelte.ts')
  await appearance.init()
  return { appearance, push }
}

describe('the theme revision', () => {
  it('moves for a new look only', async () => {
    const { appearance, push } = await started()
    const first = appearance.revision
    // Something that is not the look.
    push({ ...defaultSettings(), sound: { ...defaultSettings().sound, enabled: false } })
    expect(appearance.revision).toBe(first)
    // Another theme, and motion reduced: each is a new look.
    const other = BUILTIN_THEMES.find((theme) => theme.id !== defaultSettings().theme)
    push({ ...defaultSettings(), theme: other?.id ?? 'amber' })
    expect(appearance.revision).toBe(first + 1)
    expect(document.documentElement.dataset.theme).toBe(other?.id)
    push({ ...defaultSettings(), theme: other?.id ?? 'amber', motion: 'reduced' })
    expect(appearance.revision).toBe(first + 2)
  })
})

describe('a theme id no catalog holds', () => {
  it('falls back to the default theme, on the page and in the theme picker', async () => {
    // settings.json travels between machines, and a user theme can be deleted while
    // it is the one chosen: the page must still draw, in the default's colours.
    const { appearance, push } = await started({ ...defaultSettings(), theme: 'no-such-theme' })
    const fallback = BUILTIN_THEMES.find((theme) => theme.id === DEFAULT_THEME_ID)
    expect(fallback).toBeDefined()
    // What the status bar's theme select shows as its value.
    expect(appearance.theme.id).toBe(DEFAULT_THEME_ID)
    const root = document.documentElement
    expect(root.dataset.theme).toBe(DEFAULT_THEME_ID)
    const accent = themeVariables(fallback as (typeof BUILTIN_THEMES)[number])['--accent-h']
    expect(root.style.getPropertyValue('--accent-h')).toBe(accent)
    // A known theme chosen afterwards is taken as usual.
    const other = BUILTIN_THEMES.find((theme) => theme.id !== DEFAULT_THEME_ID)
    push({ ...defaultSettings(), theme: other?.id ?? 'amber' })
    expect(appearance.theme.id).toBe(other?.id)
  })
})
