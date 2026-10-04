// Turning ELECLANCE's indexed canvases into pictures: PNG files for the kit.
import { writeFileSync } from 'node:fs'
import { writePng } from '../png.mjs'
import { paletteOf } from './palettes.mjs'

/** A canvas as RGBA in palette `name`; colour 0 clear (or the palette's own 0 when `solid`). */
export function rgbaOf(canvas, name, solid = false) {
  const pal = paletteOf(name)
  const data = new Uint8Array(canvas.w * canvas.h * 4)
  for (let k = 0; k < canvas.px.length; k++) {
    const c = canvas.px[k]
    if (c === 0 && !solid) continue
    const [r, g, b] = pal[c]
    data.set([r, g, b, 255], k * 4)
  }
  return { width: canvas.w, height: canvas.h, data }
}

export function savePng(file, canvas, palette, solid = false) {
  writeFileSync(file, writePng(rgbaOf(canvas, palette, solid)))
}
