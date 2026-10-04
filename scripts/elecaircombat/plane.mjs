// ELECAIRCOMBAT's enemy fighter, the ARCWING: an original design (a cranked delta with
// canards, twin canted fins and two engines) built as polygons and drawn by a small software
// renderer into pixel art, seen from the views and turned by the steps the game picks frames
// by (docs/elec16-elecaircombat.md section 5). Everything here is ours: no real aircraft's
// shape, markings or name.
import { Canvas } from '../eleclance/draw.mjs'

/* ---------------- vectors ---------------- */

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const norm = (a) => mul(a, 1 / Math.hypot(...a))

/* ---------------- the model: x right, y up, z forward (metres) ---------------- */

/** Materials: paint (upper), belly, marking, canopy, nozzle, dark (intakes), detail. */
const M = { paint: 0, belly: 1, mark: 2, canopy: 3, nozzle: 4, dark: 5, detail: 6 }

/** The fuselage's sections: z, half width, top, bottom (a lofted body of eight sides). */
const SECTIONS = [
  [9.2, 0.02, 0.12, 0.08],
  [8.0, 0.32, 0.3, -0.22],
  [6.4, 0.55, 0.52, -0.42],
  [4.8, 0.72, 0.72, -0.56],
  [3.0, 1.05, 0.7, -0.72],
  [1.0, 1.45, 0.62, -0.8],
  [-2.0, 1.62, 0.6, -0.8],
  [-5.0, 1.55, 0.55, -0.72],
  [-7.2, 1.35, 0.45, -0.58],
  [-8.2, 1.25, 0.4, -0.5],
]

function fuselage(tris) {
  const ring = ([z, w, top, bottom]) => {
    const mid = (top + bottom) / 2
    const h = (top - bottom) / 2
    return Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * Math.PI * 2
      // A rounded box: the sides fuller than an ellipse.
      const c = Math.cos(a)
      const s = Math.sin(a)
      const fx = Math.sign(c) * Math.abs(c) ** 0.7
      const fy = Math.sign(s) * Math.abs(s) ** 0.7
      return [w * fx, mid + h * fy, z]
    })
  }
  const rings = SECTIONS.map(ring)
  for (let r = 0; r + 1 < rings.length; r++) {
    for (let k = 0; k < 8; k++) {
      const a = rings[r][k]
      const b = rings[r][(k + 1) % 8]
      const c = rings[r + 1][(k + 1) % 8]
      const d = rings[r + 1][k]
      // The lower half is the belly's colour; a band down the spine is marked on the tail end.
      const below = a[1] + b[1] < (SECTIONS[r][2] + SECTIONS[r][3]) * 1.0 - 0.05
      const mat = below ? M.belly : M.paint
      tris.push([a, b, c, mat], [a, c, d, mat])
    }
  }
  // The tail end closed, the nozzles drawn on it.
  const last = rings[rings.length - 1]
  const centre = [0, 0, -8.2]
  for (let k = 0; k < 8; k++) tris.push([last[k], last[(k + 1) % 8], centre, M.dark])
  for (const x of [-0.62, 0.62]) disc(tris, [x, -0.05, -8.25], 0.5, M.nozzle)
}

/** A disc facing back (-z) of eight sides. */
function disc(tris, c, r, mat) {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const b = ((k + 1) / 8) * Math.PI * 2
    tris.push([
      c,
      [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]],
      [c[0] + r * Math.cos(b), c[1] + r * Math.sin(b), c[2]],
      mat,
    ])
  }
}

/** The canopy: a bubble on the spine, a half ellipsoid of facets. */
function canopy(tris) {
  const c = [0, 0.6, 4.4]
  const r = [0.56, 0.6, 1.9]
  const at = (u, v) => {
    const a = (u / 6) * Math.PI
    const b = (v / 6) * Math.PI
    return [
      c[0] + r[0] * Math.cos(a) * Math.sin(b),
      c[1] + r[1] * Math.sin(a) * Math.sin(b),
      c[2] + r[2] * Math.cos(b),
    ]
  }
  for (let u = 0; u < 6; u++) {
    for (let v = 0; v < 6; v++) {
      tris.push(
        [at(u, v), at(u + 1, v), at(u + 1, v + 1), M.canopy],
        [at(u, v), at(u + 1, v + 1), at(u, v + 1), M.canopy],
      )
    }
  }
}

/** A flat plate (both sides) from a list of points, its upper face `mat`, its lower `under`. */
function plate(tris, points, mat, under = mat, thick = 0.3) {
  const top = points.map((p) => [p[0], p[1] + thick / 2, p[2]])
  const bottom = points.map((p) => [p[0], p[1] - thick / 2, p[2]])
  for (let k = 1; k + 1 < points.length; k++) {
    tris.push([top[0], top[k], top[k + 1], mat])
    tris.push([bottom[0], bottom[k + 1], bottom[k], under])
  }
  for (let k = 0; k < points.length; k++) {
    const n = (k + 1) % points.length
    tris.push([top[k], bottom[k], bottom[n], mat], [top[k], bottom[n], top[n], mat])
  }
}

function wings(tris) {
  for (const s of [-1, 1]) {
    const x = (v) => v * s
    // The main wing: a cranked delta, a little anhedral at the tips.
    plate(
      tris,
      [
        [x(1.3), -0.1, 2.6],
        [x(3.2), -0.18, -1.6],
        [x(6.4), -0.32, -4.4],
        [x(6.5), -0.32, -5.6],
        [x(1.5), -0.1, -6.8],
      ],
      M.paint,
      M.belly,
    )
    // A marking across the wing tip.
    plate(
      tris,
      [
        [x(5.5), -0.26, -3.65],
        [x(6.42), -0.31, -4.45],
        [x(6.5), -0.31, -5.55],
        [x(5.5), -0.26, -5.45],
      ],
      M.mark,
      M.belly,
      0.1,
    )
    // The canards.
    plate(
      tris,
      [
        [x(0.9), 0.28, 4.4],
        [x(2.9), 0.32, 2.8],
        [x(2.9), 0.32, 2.2],
        [x(0.9), 0.28, 2.6],
      ],
      M.paint,
      M.belly,
    )
    fin(tris, s)
    // The intake on each side, dark.
    plate(
      tris,
      [
        [x(1.08), -0.15, 3.1],
        [x(1.5), -0.15, 1.0],
        [x(1.5), -0.65, 1.0],
        [x(1.08), -0.65, 3.1],
      ].map((p) => [p[0], p[1], p[2]]),
      M.dark,
      M.dark,
      0.05,
    )
    // A missile under each wing, light.
    plate(
      tris,
      [
        [x(3.6), -0.45, 0.4],
        [x(3.7), -0.45, -3.4],
        [x(3.5), -0.45, -3.4],
      ],
      M.detail,
      M.detail,
      0.18,
    )
  }
}

/** A fin canted out by 18 degrees, its top marked. */
function fin(tris, s) {
  const cant = (18 * Math.PI) / 180
  const up = (h) => [s * (1.15 + h * Math.sin(cant)), 0.55 + h * Math.cos(cant)]
  const p = (h, z) => {
    const [x, y] = up(h)
    return [x, y, z]
  }
  const finPlate = (points, mat) => {
    // Built flat, then stood up: (x, y, z) here is (along the base, height, z).
    const pts = points.map(([h, z]) => p(h, z))
    const n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])))
    const off = mul(n, 0.14)
    const a = pts.map((q) => add(q, off))
    const b = pts.map((q) => sub(q, off))
    for (let k = 1; k + 1 < pts.length; k++) {
      tris.push([a[0], a[k], a[k + 1], mat], [b[0], b[k + 1], b[k], mat])
    }
  }
  finPlate(
    [
      [0, -3.4],
      [2.0, -5.4],
      [2.0, -7.0],
      [0, -7.8],
    ],
    M.paint,
  )
  finPlate(
    [
      [2.0, -5.4],
      [2.9, -6.3],
      [2.9, -7.5],
      [2.0, -7.0],
    ],
    M.mark,
  )
}

/** The whole fighter as triangles [a, b, c, material]. */
export function arcwing() {
  const tris = []
  fuselage(tris)
  canopy(tris)
  wings(tris)
  return tris
}

/** Its length, nose to nozzles: the frames are sized by it. */
export const LENGTH = 17.6

/* ---------------- the views ---------------- */

/** A view: where the camera is, as an azimuth (180 behind, 0 ahead) and an elevation. */
const view = (a, e) => {
  const ar = (a * Math.PI) / 180
  const er = (e * Math.PI) / 180
  return [Math.sin(ar) * Math.cos(er), Math.sin(er), Math.cos(ar) * Math.cos(er)]
}

/**
 * The views the frames are drawn from (the camera's side: x >= 0; the game mirrors the other).
 * The first nine are every size's; the rest only the middle sizes'. The game finds the
 * nearest, through the same list (VIEW_TABLE).
 */
export const VIEWS = [
  view(180, 20),
  view(180, 48),
  view(180, -36),
  view(130, 0),
  view(90, 0),
  view(50, 0),
  view(0, 14),
  view(0, 90),
  view(0, -90),
  view(130, 42),
  view(130, -42),
  view(90, 48),
  view(90, -48),
  view(50, 40),
  view(50, -40),
  view(0, 36),
  view(0, -36),
]

/** The views whose reference is the nose, not the plane's up (seen from straight above or below). */
export const NOSE_REF = new Set([7, 8])

/* ---------------- the renderer ---------------- */

/** Colour indices of the ace palettes by material and light (0 dark - 1 lit). */
function shadeOf(mat, light, glint) {
  switch (mat) {
    case M.paint:
      return [2, 3, 4, 5, 6][Math.min(4, Math.floor(light * 5))]
    case M.belly:
      return [7, 8, 9][Math.min(2, Math.floor(light * 3))]
    case M.mark:
      return light > 0.5 ? 11 : 10
    case M.canopy:
      return glint ? 13 : 12
    case M.nozzle:
      return 14
    case M.dark:
      return 1
    default:
      return 15
  }
}

/**
 * The fighter drawn into a `box`-point square, `size` points from nose to tail, seen from
 * view `v`, its reference (up, or the nose for views from above and below) turned `g`
 * sixteenths of a turn clockwise from the screen's up. Outlined, so it reads on any sky.
 */
export function drawFrame(tris, v, g, box, size) {
  const c = norm(VIEWS[v])
  const ref = NOSE_REF.has(v) ? [0, 0, 1] : [0, 1, 0]
  // The screen's up before turning: the reference square to the line of sight.
  const up0 = norm(sub(ref, mul(c, dot(ref, c))))
  const right0 = cross(up0, c)
  const ang = (g * Math.PI * 2) / 16
  // The reference must appear `ang` clockwise from up: turn the screen the other way.
  const up = add(mul(up0, Math.cos(ang)), mul(right0, Math.sin(ang)))
  const right = cross(up, c)
  const scale = size / LENGTH
  // Light from the top left of the frame before it is turned, so the turns and the game's
  // flips (a half turn is both flips) shade the fighter alike.
  const light = norm(add(add(mul(right0, -0.45), mul(up0, 0.75)), mul(c, 0.55)))
  const k = 3
  const n = box * k
  const depth = new Float32Array(n * n).fill(-1e9)
  const colour = new Uint8Array(n * n)
  for (const [a, b, d, mat] of tris) {
    let normal = norm(cross(sub(b, a), sub(d, a)))
    if (dot(normal, c) < 0) normal = mul(normal, -1)
    const lit = Math.max(0, dot(normal, light))
    const glint = mat === M.canopy && dot(normal, light) > 0.8
    const idx = shadeOf(mat, 0.15 + lit * 0.85, glint)
    const P = [a, b, d].map((p) => [
      n / 2 + dot(p, right) * scale * k,
      n / 2 - dot(p, up) * scale * k,
      dot(p, c),
    ])
    raster(P, n, depth, colour, idx)
  }
  return downsample(colour, n, k, box)
}

/** A triangle into the supersampled buffers: nearer the camera (larger depth) wins. */
function raster(P, n, depth, colour, idx) {
  const [p0, p1, p2] = P
  const minX = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0])))
  const maxX = Math.min(n - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])))
  const minY = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1])))
  const maxY = Math.min(n - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])))
  const area = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1])
  if (Math.abs(area) < 1e-9) return
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const w0 = ((p1[0] - px) * (p2[1] - py) - (p2[0] - px) * (p1[1] - py)) / area
      const w1 = ((p2[0] - px) * (p0[1] - py) - (p0[0] - px) * (p2[1] - py)) / area
      const w2 = 1 - w0 - w1
      if (w0 < 0 || w1 < 0 || w2 < 0) continue
      const z = w0 * p0[2] + w1 * p1[2] + w2 * p2[2]
      const at = y * n + x
      if (z > depth[at]) {
        depth[at] = z
        colour[at] = idx
      }
    }
  }
}

/**
 * The supersampled picture down to points: a point is drawn where most of its samples are,
 * in its most common colour; then a dark outline round everything.
 */
function downsample(colour, n, k, box) {
  const out = new Canvas(box, box)
  for (let y = 0; y < box; y++) {
    for (let x = 0; x < box; x++) {
      const v = pointOf(colour, n, k, box, x, y)
      if (v !== 0) out.set(x, y, v)
    }
  }
  out.outline(1, box >= 32)
  return out
}

/** One point's colour from its samples: none where too few are drawn, else the commonest. */
function pointOf(colour, n, k, box, x, y) {
  const counts = new Map()
  let drawn = 0
  for (let sy = 0; sy < k; sy++) {
    for (let sx = 0; sx < k; sx++) {
      const v = colour[(y * k + sy) * n + x * k + sx]
      if (v === 0) continue
      drawn++
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
  }
  if (drawn === 0 || (drawn < 3 && box > 16)) return 0
  return commonest(counts)
}

function commonest(counts) {
  let best = 0
  let most = -1
  for (const [v, m] of counts) {
    // Bright details (the burner, the canopy's glint) win ties: they are what is seen.
    const w = m + (v === 14 || v === 13 ? 0.6 : 0)
    if (w > most) {
      most = w
      best = v
    }
  }
  return best
}
