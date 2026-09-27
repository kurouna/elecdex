import type { Theme, ThemeColor } from '@shared/plugin-api'
import { keyLabels } from '@shared/plugin-keys'

/**
 * What the host tells a plugin worker about the page (docs/plugins.md section 13): the look,
 * for a canvas that draws itself, and what the keys print.
 */

/** The semantic token behind each colour a plugin is given (styles/tokens.css). */
const TOKENS: Readonly<Record<ThemeColor, string>> = {
  ground: '--app-bg',
  raised: '--panel-bg-raised',
  text: '--text',
  muted: '--text-muted',
  inverse: '--text-inverse',
  accent: '--accent',
  accentStrong: '--accent-strong',
  accentDim: '--accent-dim',
  accentFaint: '--accent-faint',
  border: '--panel-border',
  rule: '--panel-rule',
  ok: '--ok',
  warn: '--warn',
  danger: '--danger',
  info: '--info',
}

/**
 * The theme as a canvas can take it. Each colour is read back from an element's computed
 * `color`, which resolves the var() and calc() a token is made of into one plain colour.
 */
export function readTheme(reducedMotion: boolean): Theme {
  const root = document.documentElement
  const probe = document.createElement('span')
  probe.style.display = 'none'
  document.body.append(probe)
  const colors = {} as Record<ThemeColor, string>
  for (const [name, token] of Object.entries(TOKENS) as [ThemeColor, string][]) {
    probe.style.color = `var(${token})`
    colors[name] = getComputedStyle(probe).color || '#888888'
  }
  probe.remove()
  const style = getComputedStyle(root)
  const font = (token: string, fallback: string) => style.getPropertyValue(token).trim() || fallback
  return {
    mode: root.dataset.mode === 'light' ? 'light' : 'dark',
    reducedMotion,
    colors,
    fonts: {
      display: font('--font-display', 'system-ui, sans-serif'),
      ui: font('--font-ui', 'system-ui, sans-serif'),
      mono: font('--font-mono', 'ui-monospace, monospace'),
    },
  }
}

interface LayoutMapNavigator {
  keyboard?: { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> }
}

/** What each plugin key prints here: the system's layout map, or a US keyboard's. */
export async function readLabels(): Promise<Record<string, string>> {
  const keyboard = (navigator as LayoutMapNavigator).keyboard
  const layout = await keyboard?.getLayoutMap?.().catch(() => null)
  return keyLabels(layout ?? null)
}
