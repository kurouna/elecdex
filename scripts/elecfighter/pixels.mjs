// Clean-up of a rendered sprite's indices: no point may stand alone (a point with no neighbour
// of its own colour in 8 directions reads as noise at 1x; decisions.md).

const N8 = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

const at = (px, W, H, x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : px[y * W + x])

function alone(px, W, H, x, y) {
  const c = px[y * W + x]
  return N8.every(([dx, dy]) => at(px, W, H, x + dx, y + dy) !== c)
}

/** Points with no same-colour neighbour in 8 directions, the transparent ones included. */
export function isolated(px, W, H) {
  let n = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (alone(px, W, H, x, y)) n++
  return n
}

/** The colour most of a point's 8 neighbours have (clear wins a tie). */
function commonest(px, W, H, x, y) {
  const cnt = new Map()
  for (const [dx, dy] of N8) {
    const v = at(px, W, H, x + dx, y + dy)
    cnt.set(v, (cnt.get(v) ?? 0) + 1)
  }
  let best = 0
  let bn = -1
  for (const [v, k] of cnt) if (k > bn || (k === bn && v === 0)) [best, bn] = [v, k]
  return best
}

/** Every isolated point takes the colour most of its neighbours have, until none is left. */
export function despeck(px, W, H) {
  for (let round = 0; round < 12; round++) {
    let changed = 0
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!alone(px, W, H, x, y)) continue
        px[y * W + x] = commonest(px, W, H, x, y)
        changed++
      }
    if (!changed) return
  }
}
