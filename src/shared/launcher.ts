/** An application the launcher can start, as the renderer sees it: no paths, no commands. */
export interface LauncherEntry {
  /** Opaque; the only thing the renderer can ask main to launch. */
  id: string
  name: string
  /** Start Menu folder or desktop category, where the platform has one. */
  group: string | null
  /** 'user' entries come from settings.json and are listed first. */
  source: 'user' | 'system'
}

export type LaunchResult = { ok: true } | { ok: false; error: string }
