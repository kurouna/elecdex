import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, type Settings } from '../../src/shared/settings.ts'
import { BUILTIN_THEMES } from '../../src/shared/theme.ts'

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

async function started() {
  let push: (settings: Settings) => void = () => {}
  vi.stubGlobal('elecdex', {
    settings: {
      get: () => Promise.resolve(defaultSettings()),
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
