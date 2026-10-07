// RGBA pictures for the mock's sheets: indexed sprites through a palette, nearest neighbour
// only, and text in ELECLANCE's 8x8 font.
import { writeFileSync } from 'node:fs'
import { fontFrames } from '../eleclance/font.mjs'
import { writePng } from '../png.mjs'
import { GROUND } from './palettes.mjs'

const FONT = fontFrames()

/** A glyph of the 8x8 font: get(x, y) >= 4 is the letter. */
export const glyph = (ch) => FONT[ch.charCodeAt(0) - 32]

export class Img {
  constructor(w, h, bg = GROUND) {
    this.w = w
    this.h = h
    this.data = new Uint8Array(w * h * 4)
    this.rect(0, 0, w, h, bg)
  }

  set(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const k = (y * this.w + x) * 4
    this.data[k] = c[0]
    this.data[k + 1] = c[1]
    this.data[k + 2] = c[2]
    this.data[k + 3] = 255
  }

  get(x, y) {
    const k = (y * this.w + x) * 4
    return [this.data[k], this.data[k + 1], this.data[k + 2]]
  }

  rect(x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c)
  }

  /** An indexed sprite with its top left at (x, y), `s` times, through `pal`; 0 is clear. */
  sprite(spr, x, y, pal, s = 1) {
    for (let yy = 0; yy < spr.h; yy++)
      for (let xx = 0; xx < spr.w; xx++) {
        const v = spr.px[yy * spr.w + xx]
        if (v) this.rect(x + xx * s, y + yy * s, s, s, pal[v])
      }
  }

  /** Another picture, `s` times. */
  blit(src, x, y, s = 1) {
    for (let yy = 0; yy < src.h; yy++)
      for (let xx = 0; xx < src.w; xx++) this.rect(x + xx * s, y + yy * s, s, s, src.get(xx, yy))
  }

  text(str, x, y, c, s = 1) {
    ;[...str.toUpperCase()].forEach((ch, i) => {
      const g = glyph(ch)
      if (!g) return
      for (let yy = 0; yy < 8; yy++)
        for (let xx = 0; xx < 8; xx++)
          if (g.get(xx, yy) >= 4) this.rect(x + (i * 7 + xx) * s, y + yy * s, s, s, c)
    })
  }

  /** A copy `s` times the size. */
  scaled(s) {
    const o = new Img(this.w * s, this.h * s)
    o.blit(this, 0, 0, s)
    return o
  }

  save(path) {
    writeFileSync(path, writePng({ width: this.w, height: this.h, data: this.data }))
  }
}
