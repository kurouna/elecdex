// ELECAIRCOMBAT's title (BG1): "ELEC" small and hot over "AIR COMBAT" in steel, a contrail
// through it. The letters are ELECLANCE's alphabet drawn large.
import { Canvas, each } from '../eleclance/draw.mjs'
import { fontFrames } from '../eleclance/font.mjs'

/** The logo palette: 1 edge, 2-8 steel to white, 9-13 burner, 14-15 sky glints. */
const L = { edge: 1, hot0: 9, hot1: 10, hot2: 11, hot3: 12, hot4: 13, glint: 14 }

/** Steel at height `t` (0 top): a bright top, a dark horizon at the waist, sky below. */
function steel(t) {
  if (t < 0.12) return 8
  if (t < 0.3) return 7
  if (t < 0.46) return 6
  if (t < 0.52) return 3
  if (t < 0.7) return 5
  if (t < 0.86) return 6
  return 7
}

function hot(t) {
  if (t < 0.2) return L.hot4
  if (t < 0.45) return L.hot3
  if (t < 0.7) return L.hot2
  return L.hot1
}

/** A word of glyphs `scale` times as big at (x0, y0), coloured by height through `paint`. */
function word(c, text, x0, y0, scale, paint, slant) {
  const font = fontFrames()
  ;[...text].forEach((ch, k) => {
    const g = font[ch.charCodeAt(0) - 32]
    each(8, 8, (x, y) => {
      if (g.get(x, y) < 4) return
      each(scale, scale, (sx, sy) => {
        const py = y * scale + sy
        const lean = Math.round(((7 * scale - py) * slant) / (7 * scale))
        c.set(x0 + k * 7 * scale + x * scale + sx + lean, y0 + py, paint(py / (7 * scale)))
      })
    })
  })
}

export function logo() {
  const c = new Canvas(320, 64)
  word(c, 'AIR COMBAT', 20, 24, 4, steel, 6)
  c.outline(L.edge, true)
  const top = new Canvas(320, 64)
  word(top, 'ELEC', 22, 4, 2, hot, 3)
  top.outline(L.edge, true)
  c.blit(top, 0, 0)
  // A contrail sweeping under the words, and a glint where it starts.
  for (let x = 78; x < 306; x++) {
    const y = 58 - Math.round(((x - 78) / 228) ** 2 * 6)
    c.set(x, y, x % 9 < 6 ? 15 : L.glint)
    if (x % 4 === 0) c.set(x, y + 1, 4)
  }
  c.set(306, 51, 8)
  c.set(305, 52, 15)
  c.set(307, 52, 15)
  return c
}
