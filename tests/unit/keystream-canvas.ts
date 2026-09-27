import type { Paint } from '../../examples/plugins/keystream/draw/paint'

/**
 * A canvas for KEYSTREAM's drawing tests: it draws nothing, and remembers each text it was
 * asked to write with the font it was written in. Text is 8 px a character wide.
 */
export function recorder(): {
  g: Paint['g']
  texts: string[]
  writes: { text: string; font: string }[]
} {
  const texts: string[] = []
  const writes: { text: string; font: string }[] = []
  const gradient = { addColorStop() {} }
  const target: Record<string | symbol, unknown> = {
    font: '',
    fillText: (text: string) => {
      texts.push(text)
      writes.push({ text, font: String(target.font) })
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
  return { g, texts, writes }
}

export function paint(g: Paint['g'], w: number, h: number, reduced = false): Paint {
  const colour = 'rgb(120, 200, 220)'
  const c = new Proxy({}, { get: () => colour }) as Paint['c']
  return { g, w, h, c, fonts: { display: 'x', ui: 'x', mono: 'x' }, light: false, reduced }
}
