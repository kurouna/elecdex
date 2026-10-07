// The stage and HUD are SVG (svg/), drawn by resvg with crisp edges and then held to their
// palette: every pixel becomes the index of the nearest palette colour, and the pixels that
// were not a palette colour already are counted (a stray colour is a mistake in the SVG).
import { readFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

/** An SVG file's text with attributes changed by element id: { id: { attr: value } }. */
export function svgText(path, edits = {}) {
  let text = readFileSync(path, 'utf8')
  for (const [id, attrs] of Object.entries(edits))
    for (const [attr, value] of Object.entries(attrs)) {
      const re = new RegExp(`(<[^>]*id="${id}"[^>]*\\s${attr}=")[^"]*(")`)
      if (!re.test(text)) throw new Error(`${path}: no ${attr} on #${id}`)
      text = text.replace(re, `$1${value}$2`)
    }
  return text
}

/** Draws SVG text to palette indices: { w, h, px, stray }. */
export function svgIndices(text, palette) {
  const img = new Resvg(text, { shapeRendering: 0, textRendering: 0, imageRendering: 1 }).render()
  const w = img.width
  const h = img.height
  const rgba = img.pixels
  const px = new Uint8Array(w * h)
  let stray = 0
  for (let k = 0; k < w * h; k++) {
    const c = [rgba[k * 4], rgba[k * 4 + 1], rgba[k * 4 + 2]]
    let best = 0
    let bestD = Infinity
    palette.forEach((p, i) => {
      const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2
      if (d < bestD) [best, bestD] = [i, d]
    })
    if (bestD > 0) stray++
    px[k] = best
  }
  return { w, h, px, stray }
}
