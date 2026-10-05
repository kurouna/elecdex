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

/** The ace palettes' ramps: the upper paint dark to light, the underside, the markings. */
const PAINT = [2, 3, 4, 5, 6]
const BELLY = [7, 8, 9]
const MARK = [10, 11]

/**
 * A ramp's colour at `level` 0-1: the nearest shade, and a checker of the two only where the
 * level falls half way between them - flat facets stay clean, curves step softly.
 */
function rampOf(colours, level, x, y) {
  const v = Math.max(0, Math.min(0.9999, level)) * (colours.length - 1)
  const k = Math.floor(v)
  const t = v - k
  const up = Math.min(k + 1, colours.length - 1)
  if (t < 0.4) return colours[k]
  if (t > 0.6) return colours[up]
  return colours[(x + y) & 1 ? up : k]
}

/**
 * The fighter drawn into a `box`-point square, `size` points from nose to tail, seen from
 * view `v`, its reference (up, or the nose for views from above and below) turned `g`
 * sixteenths of a turn clockwise from the screen's up. Shaded by facet, the shades dithered
 * into one another; a glint on the canopy and highlights on the paint, a rim of light along
 * the lit side's edge, and a dark outline, so it reads on any sky.
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
  // Half way between the light and the eye (the camera looks from `c`): the highlights.
  const half = norm(add(light, c))
  const k = 4
  const n = box * k
  const depth = new Float32Array(n * n).fill(-1e9)
  const f = {
    mats: new Int8Array(n * n).fill(-1),
    lits: new Float32Array(n * n),
    specs: new Float32Array(n * n),
    n,
    k,
    box,
    // The light's way on the screen (y down), for the rim.
    lx: dot(light, right),
    ly: -dot(light, up),
  }
  for (const [a, b, d, mat] of tris) {
    let normal = norm(cross(sub(b, a), sub(d, a)))
    if (dot(normal, c) < 0) normal = mul(normal, -1)
    const lit = 0.12 + Math.max(0, dot(normal, light)) * 0.88
    const spec = Math.max(0, dot(normal, half)) ** 24
    const P = [a, b, d].map((p) => [
      n / 2 + dot(p, right) * scale * k,
      n / 2 - dot(p, up) * scale * k,
      dot(p, c),
    ])
    raster(P, n, depth, (at) => {
      f.mats[at] = mat
      f.lits[at] = lit
      f.specs[at] = spec
    })
  }
  return downsample(f)
}

/** A triangle into the supersampled buffers: nearer the camera (larger depth) wins. */
function raster(P, n, depth, put) {
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
        put(at)
      }
    }
  }
}

/** What a point of the frame shows: its material, light and highlight, from its samples. */
function pointOf(f, x, y) {
  const { count, drawn } = samplesOf(f, x, y)
  const { k, box } = f
  // Small frames keep a point a quarter covered (thin wings and fins stay); large ones half.
  if (drawn === 0 || drawn < (box > 16 ? (k * k) / 2 : (k * k) / 4)) return null
  let best = -1
  let most = -1
  for (const [m, e] of count) {
    // The burner and the canopy are what is seen: they win near ties.
    const w = e.n + (m === M.nozzle || m === M.canopy ? k : 0)
    if (w > most) {
      most = w
      best = m
    }
  }
  const e = count.get(best)
  return { mat: best, lit: e.lit / e.n, spec: e.spec }
}

/** A point's samples by material: how many, their light summed, their brightest highlight. */
function samplesOf(f, x, y) {
  const { mats, lits, specs, n, k } = f
  const count = new Map()
  let drawn = 0
  for (let sy = 0; sy < k; sy++) {
    for (let sx = 0; sx < k; sx++) {
      const at = (y * k + sy) * n + x * k + sx
      const m = mats[at]
      if (m < 0) continue
      drawn++
      const e = count.get(m) ?? { n: 0, lit: 0, spec: 0 }
      e.n++
      e.lit += lits[at]
      e.spec = Math.max(e.spec, specs[at])
      count.set(m, e)
    }
  }
  return { count, drawn }
}

/** A point's colour from what it shows: shaded and dithered, highlights where they fall. */
function colourOf(p, x, y, big) {
  switch (p.mat) {
    case M.paint:
      if (big && p.spec > 0.6) return 15
      return rampOf(PAINT, p.lit * 1.05, x, y)
    case M.belly:
      return rampOf(BELLY, p.lit * 1.1, x, y)
    case M.mark:
      return rampOf(MARK, p.lit * 1.25, x, y)
    case M.canopy:
      return p.spec > 0.35 ? 13 : 12
    case M.nozzle:
      return 14
    case M.dark:
      return 1
    default:
      return 15
  }
}

/**
 * The supersampled picture down to points: shaded, then the canopy given one glint if it has
 * none, a rim of light along the lit side's edge, and a dark outline round everything.
 */
function downsample(f) {
  const { box } = f
  const big = box >= 32
  const out = new Canvas(box, box)
  const shown = []
  for (let y = 0; y < box; y++) {
    for (let x = 0; x < box; x++) {
      const p = pointOf(f, x, y)
      if (p === null) continue
      shown.push([x, y, p])
      out.set(x, y, colourOf(p, x, y, big))
    }
  }
  canopyGlint(out, shown)
  if (box >= 16) rim(out, shown, f.lx, f.ly)
  out.outline(1, big)
  return out
}

/** The canopy's brightest point catches the light, if no point of it does. */
function canopyGlint(out, shown) {
  const canopy = shown.filter(([, , p]) => p.mat === M.canopy)
  if (canopy.length === 0 || canopy.some(([x, y]) => out.get(x, y) === 13)) return
  let best = canopy[0]
  for (const q of canopy) if (q[2].lit + q[2].spec > best[2].lit + best[2].spec) best = q
  out.set(best[0], best[1], 13)
}

/**
 * Edges towards the light: a painted point with nothing beside it on the light's side is the
 * paint's lightest (the belly's), so the silhouette reads on a dark sky as on a bright one.
 */
function rim(out, shown, lx, ly) {
  const sx = Math.abs(lx) > 0.3 ? Math.sign(lx) : 0
  const sy = Math.abs(ly) > 0.3 ? Math.sign(ly) : 0
  const lit = []
  for (const [x, y, p] of shown) {
    if (p.mat !== M.paint && p.mat !== M.belly) continue
    const open = (sx !== 0 && out.get(x + sx, y) === 0) || (sy !== 0 && out.get(x, y + sy) === 0)
    if (open) lit.push([x, y, p.mat === M.paint ? 6 : 9])
  }
  for (const [x, y, v] of lit) out.set(x, y, v)
}
