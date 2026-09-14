import type { ThemeCatalog } from '@shared/api'
import { defaultSettings, type Settings, type SettingsPatch } from '@shared/settings'
import { BUILTIN_THEMES, DEFAULT_THEME_ID, type Theme, themeVariables } from '@shared/theme'

/**
 * Settings and the active theme, kept in step with main.
 *
 * A theme is applied by setting its CSS custom properties on the root element.
 * CSS repaints itself; the few things that read colours once and paint into a
 * canvas or a WebGL context - the terminal, the charts, the memory map - watch
 * `revision` and re-read.
 */
class AppearanceStore {
  settings = $state<Settings>(defaultSettings())
  catalog = $state.raw<ThemeCatalog>({ themes: [...BUILTIN_THEMES], problems: [] })
  /** Bumped after every application of a theme, for canvas-drawn widgets. */
  revision = $state(0)

  readonly theme = $derived.by((): Theme => {
    const { themes } = this.catalog
    return (
      themes.find((t) => t.id === this.settings.theme) ??
      themes.find((t) => t.id === DEFAULT_THEME_ID) ??
      (BUILTIN_THEMES[0] as Theme)
    )
  })

  private started = false

  /** Loads settings and themes, applies them, and follows later changes. */
  async init(): Promise<void> {
    if (this.started) return
    this.started = true
    const [settings, catalog] = await Promise.all([
      window.elecdex.settings.get(),
      window.elecdex.themes.list(),
    ])
    this.settings = settings
    this.catalog = catalog
    this.apply()

    window.elecdex.settings.onChange((next) => {
      this.settings = next
      this.apply()
    })
    window.elecdex.themes.onChange((next) => {
      this.catalog = next
      this.apply()
    })
  }

  patch(patch: SettingsPatch): Promise<Settings> {
    return window.elecdex.settings.patch(patch)
  }

  /** Whether motion should be reduced, by setting or by the OS. */
  get reducedMotion(): boolean {
    if (this.settings.motion === 'reduced') return true
    if (this.settings.motion === 'full') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private apply(): void {
    const root = document.documentElement
    const theme = this.theme
    for (const [name, value] of Object.entries(themeVariables(theme))) {
      root.style.setProperty(name, value)
    }
    root.dataset.theme = theme.id
    root.dataset.mode = theme.mode ?? 'dark'
    root.dataset.icons = theme.effects?.iconTint === false ? 'color' : 'tinted'
    root.dataset.scanlines = theme.effects?.scanlines ? 'on' : 'off'
    if ((theme.effects?.glow ?? 0) > 0) root.dataset.glow = 'on'
    else delete root.dataset.glow
    if (this.settings.motion === 'system') delete root.dataset.motion
    else root.dataset.motion = this.settings.motion
    this.revision += 1
  }
}

export const appearance = new AppearanceStore()
