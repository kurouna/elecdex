import type { TitleBarColors } from './api.js'

const HEX = /^#[0-9a-f]{6}$/i

/** Only two #rrggbb strings get through to the native title bar controls. */
export function titleBarColors(raw: unknown): TitleBarColors | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { background, symbols } = raw as Record<string, unknown>
  if (typeof background !== 'string' || typeof symbols !== 'string') return null
  if (!HEX.test(background) || !HEX.test(symbols)) return null
  return { background, symbols }
}

/** "rgb(5, 8, 13)" -> "#05080d". Computed colours come back as rgb()/rgba(). */
export function cssColorToHex(css: string): string | null {
  const m = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (!m) return null
  return `#${m
    .slice(1, 4)
    .map((n) => Math.min(255, Number(n)).toString(16).padStart(2, '0'))
    .join('')}`
}
