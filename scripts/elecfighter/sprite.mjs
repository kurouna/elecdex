// Indexed sprites ({ w, h, px, ox, oy }): their drawn box, the 16x16 cells the machine streams,
// and the mirror image FLIP_H gives.

/** The box round the drawn points. */
export function bbox(s) {
  let x0 = s.w
  let y0 = s.h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++)
      if (s.px[y * s.w + x]) {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
        y1 = Math.max(y1, y)
      }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

function cellsAt(s, ox, oy) {
  const set = new Set()
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++)
      if (s.px[y * s.w + x])
        set.add(`${Math.floor((x + 16 - ox) / 16)},${Math.floor((y + 16 - oy) / 16)}`)
  return set
}

/** The placement of a 16x16 grid with the fewest non-empty cells: { n, list: [[x, y]] }. */
export function cells(s) {
  let best = null
  for (let oy = 0; oy < 16; oy++)
    for (let ox = 0; ox < 16; ox++) {
      const set = cellsAt(s, ox, oy)
      if (best && set.size >= best.n) continue
      const list = [...set].map((k) => k.split(',').map(Number))
      best = { n: set.size, list: list.map(([i, j]) => [ox - 16 + i * 16, oy - 16 + j * 16]) }
    }
  return best
}

/** The sprite mirrored left to right, its origin with it. */
export function flipSprite(s) {
  const px = new Uint8Array(s.w * s.h)
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) px[y * s.w + x] = s.px[y * s.w + s.w - 1 - x]
  return { ...s, px, ox: s.w - 1 - s.ox }
}
