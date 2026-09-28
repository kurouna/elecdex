import type { Paint } from '../../examples/plugins/keystream/draw/paint'

/**
 * A canvas for KEYSTREAM's drawing tests: it draws nothing, and remembers each text it was
 * asked to write with the font and colour it was written in, and each rectangle filled with
 * its colour. Text is 8 px a character wide.
 */
export function recorder(): {
  g: Paint['g']
  texts: string[]
  writes: { text: string; font: string; color: string; x: number; y: number; alpha: number }[]
  fills: { x: number; y: number; w: number; h: number; color: string }[]
} {
  const texts: string[] = []
  const writes: {
    text: string
    font: string
    color: string
    x: number
    y: number
    alpha: number
  }[] = []
  const fills: { x: number; y: number; w: number; h: number; color: string }[] = []
  const gradient = { addColorStop() {} }
  const target: Record<string | symbol, unknown> = {
    font: '',
    fillStyle: '',
    globalAlpha: 1,
    fillText: (text: string, x: number, y: number) => {
      texts.push(text)
      writes.push({
        text,
        font: String(target.font),
        color: String(target.fillStyle),
        x,
        y,
        alpha: Number(target.globalAlpha),
      })
    },
    fillRect: (x: number, y: number, w: number, h: number) => {
      fills.push({ x, y, w, h, color: String(target.fillStyle) })
    },
    measureText: (text: string) => ({
      width: text.length * 8,
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
    }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  }
  const g = new Proxy(target, {
    get: (t, key) => (key in t ? t[key] : () => {}),
    set: (t, key, value) => {
      t[key] = value
      return true
    },
  }) as unknown as Paint['g']
  return { g, texts, writes, fills }
}

/** Each of the theme's colours its own, told apart by its red: `colour('inverse')`. */
export function colour(name: string): string {
  let red = 0
  for (const char of name) red = (red * 31 + char.charCodeAt(0)) % 256
  return `rgb(${red}, 100, 200)`
}

export function paint(g: Paint['g'], w: number, h: number, reduced = false): Paint {
  const c = new Proxy({}, { get: (_t, key) => colour(String(key)) }) as Paint['c']
  return { g, w, h, c, fonts: { display: 'x', ui: 'x', mono: 'x' }, light: false, reduced }
}
