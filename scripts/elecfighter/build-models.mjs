#!/usr/bin/env node
/**
 * Builds ELECFIGHTER's models and writes them as glTF 2.0 (scripts/elecfighter/models):
 *
 *   human.gltf    the base human: a skinned low-poly mesh lofted along a 19-bone skeleton,
 *                 about 7.5 heads tall (1.75 m), facing +Z, Y up, standing with arms down
 *   effects.gltf  the hit spark (an icosahedron) and a shard (a thin triangular prism)
 *
 * The .gltf files are what the mock draws (mock.mjs reads them, never this script), so a model
 * made in another tool can take a slot's place. Run this only to make the base models afresh.
 *
 *   node scripts/elecfighter/build-models.mjs
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeGltf } from './gltf.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'models')

// ---------- the skeleton (rest heads in metres; left is +X, front is +Z) ----------
const BONES = [
  ['hips', null, [0, 0.94, 0]],
  ['spine', 'hips', [0, 1.06, -0.005]],
  ['chest', 'spine', [0, 1.22, -0.01]],
  ['neck', 'chest', [0, 1.45, -0.02]],
  ['head', 'neck', [0, 1.53, -0.005]],
  ['clavicle_l', 'chest', [0.03, 1.42, -0.005]],
  ['upperarm_l', 'clavicle_l', [0.192, 1.415, -0.025]],
  ['forearm_l', 'upperarm_l', [0.192, 1.11, -0.03]],
  ['hand_l', 'forearm_l', [0.192, 0.86, -0.02]],
  ['clavicle_r', 'chest', [-0.03, 1.42, -0.005]],
  ['upperarm_r', 'clavicle_r', [-0.192, 1.415, -0.025]],
  ['forearm_r', 'upperarm_r', [-0.192, 1.11, -0.03]],
  ['hand_r', 'forearm_r', [-0.192, 0.86, -0.02]],
  ['thigh_l', 'hips', [0.092, 0.9, 0]],
  ['shin_l', 'thigh_l', [0.092, 0.49, 0.005]],
  ['foot_l', 'shin_l', [0.092, 0.085, -0.01]],
  ['thigh_r', 'hips', [-0.092, 0.9, 0]],
  ['shin_r', 'thigh_r', [-0.092, 0.49, 0.005]],
  ['foot_r', 'shin_r', [-0.092, 0.085, -0.01]],
]
const BONE = Object.fromEntries(BONES.map((b, i) => [b[0], i]))

// ---------- a mesh being built ----------
const verts = [] // { p: [x, y, z], w: { bone: weight } }
const faces = [] // { i: [a, b, c], m: material }

function vert(p, w) {
  verts.push({ p, w })
  return verts.length - 1
}

/** A triangle, turned so its normal points away from `inside`. */
function tri(a, b, c, m, inside) {
  const [pa, pb, pc] = [verts[a].p, verts[b].p, verts[c].p]
  const u = pb.map((v, k) => v - pa[k])
  const v = pc.map((x, k) => x - pa[k])
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const centre = [0, 1, 2].map((k) => (pa[k] + pb[k] + pc[k]) / 3 - inside[k])
  const out = n[0] * centre[0] + n[1] * centre[1] + n[2] * centre[2] >= 0
  faces.push({ i: out ? [a, b, c] : [a, c, b], m })
}

/**
 * A ring of `n` points round an axis point: `sec` gives [across, deep] offsets (across the
 * body's side axis, deep along its front axis), placed in the plane of `ax` (the side axis) and
 * `az` (the front axis) through `c`.
 */
function ring(c, sec, w, ax = [1, 0, 0], az = [0, 0, 1]) {
  const ids = sec.map(([a, d]) =>
    vert(
      [0, 1, 2].map((k) => c[k] + ax[k] * a + az[k] * d),
      w,
    ),
  )
  return { c, ids }
}

/** An n-gon section, half-widths ra (across) and rd (deep), the deep axis shifted by off. */
function oval(n, ra, rd, off = 0, phase = Math.PI / n) {
  return Array.from({ length: n }, (_, k) => {
    const t = phase + (k * 2 * Math.PI) / n
    return [ra * Math.cos(t), rd * Math.sin(t) + off]
  })
}

/** Joins rings in order with quads (two triangles); caps the ends when asked. */
function bridge(rings, mats, caps = [true, true]) {
  for (let j = 0; j + 1 < rings.length; j++) {
    const r0 = rings[j]
    const r1 = rings[j + 1]
    const inside = r0.c.map((v, k) => (v + r1.c[k]) / 2)
    const n = r0.ids.length
    for (let i = 0; i < n; i++) {
      const a = r0.ids[i]
      const b = r0.ids[(i + 1) % n]
      const c = r1.ids[(i + 1) % n]
      const d = r1.ids[i]
      const m = typeof mats === 'string' ? mats : mats[j]
      tri(a, b, c, m, inside)
      tri(a, c, d, m, inside)
    }
  }
  const cap = (r, other, m) => {
    // A cap is a fan from the ring's own first point, its inside a little behind it.
    const inside = r.c.map((v, k) => v + (other.c[k] - v) * 0.3)
    for (let i = 1; i + 1 < r.ids.length; i++) tri(r.ids[0], r.ids[i], r.ids[i + 1], m, inside)
  }
  const ms = typeof mats === 'string' ? [mats] : mats
  if (caps[0]) cap(rings[0], rings[1], ms[0])
  if (caps[1]) cap(rings[rings.length - 1], rings[rings.length - 2], ms[ms.length - 1])
}

/** An apex closing a ring (a point at `p`). */
function apex(r, p, w, m) {
  const id = vert(p, w)
  const n = r.ids.length
  for (let i = 0; i < n; i++) tri(r.ids[i], r.ids[(i + 1) % n], id, m, r.c)
}

const at = (b, dx = 0, dy = 0, dz = 0) => {
  const h = BONES[BONE[b]][2]
  return [h[0] + dx, h[1] + dy, h[2] + dz]
}
const only = (b) => ({ [b]: 1 })
const blend = (a, b, t = 0.5) => ({ [a]: 1 - t, [b]: t })

// ---------- the body ----------
function torso() {
  // Octagons with a face to the front, sides and back; the deep axis shifted to give a chest
  // in front and a back that is flatter than a cylinder.
  const R = (y, ra, rd, off, w) => ring([0, y, 0], oval(8, ra, rd, off), w)
  const rings = [
    R(0.84, 0.115, 0.085, 0.0, only('hips')),
    R(0.93, 0.168, 0.105, 0.0, only('hips')),
    R(1.0, 0.152, 0.098, 0.005, only('hips')),
    R(1.065, 0.136, 0.092, 0.008, blend('hips', 'spine')),
    R(1.25, 0.172, 0.122, 0.024, blend('spine', 'chest', 0.7)),
    R(1.37, 0.192, 0.112, 0.012, only('chest')),
    R(1.445, 0.14, 0.078, -0.012, only('chest')),
  ]
  bridge(rings, ['A', 'A', 'B', 'A', 'A', 'A'], [true, false])
  apex(rings[rings.length - 1], [0, 1.46, -0.02], only('chest'), 'A')
}

function neckAndHead() {
  const neck = [
    ring(at('neck', 0, -0.03, 0.005), oval(6, 0.052, 0.056, 0, 0), only('neck')),
    ring(at('neck', 0, 0.08, 0.012), oval(6, 0.047, 0.05, 0, 0), blend('neck', 'head', 0.6)),
  ]
  bridge(neck, 'C', [false, false])
  // The head: an egg from the jaw up, the face side a little fuller; no features.
  const H = (dy, ra, rd, off, w = only('head')) =>
    ring(at('head', 0, dy, 0), oval(8, ra, rd, off), w)
  const rings = [
    H(-0.005, 0.042, 0.05, 0.035),
    H(0.045, 0.066, 0.088, 0.02),
    H(0.12, 0.074, 0.098, 0.0),
    H(0.19, 0.056, 0.078, -0.01),
  ]
  bridge(rings, 'C', [true, false])
  apex(rings[rings.length - 1], at('head', 0, 0.222, -0.014), only('head'), 'C')
}

function arm(s) {
  const L = `_${s}`
  const x = s === 'l' ? 1 : -1
  const ua = `upperarm${L}`
  const fa = `forearm${L}`
  const hd = `hand${L}`
  // Octagons like the legs' (45 degrees between faces, under the crease angle, so a straight
  // limb draws no stripes of crease), with rings either side of the elbow weighted a quarter and
  // three quarters across it so a bent elbow rounds instead of folding to a point.
  const R = (b, dy, ra, rd, w, dx = 0, dz = 0) => ring(at(b, dx * x, dy, dz), oval(8, ra, rd), w)
  const rings = [
    R(ua, 0.045, 0.03, 0.035, blend(`clavicle${L}`, ua, 0.6), -0.015),
    R(ua, 0.0, 0.064, 0.066, blend(`clavicle${L}`, ua, 0.85), 0.006),
    R(ua, -0.1, 0.058, 0.06, only(ua), 0.005, 0.006),
    R(ua, -0.24, 0.05, 0.052, blend(ua, fa, 0.2), 0, 0.002),
    R(fa, 0.0, 0.05, 0.05, blend(ua, fa)),
    R(fa, -0.035, 0.053, 0.055, blend(ua, fa, 0.8), 0, 0.004),
    R(fa, -0.1, 0.056, 0.058, only(fa), 0, 0.006),
    R(fa, -0.2, 0.04, 0.044, blend(fa, hd, 0.2)),
  ]
  bridge(rings, ['A', 'A', 'A', 'A', 'A', 'A', 'B'], [true, false])
  // The fist (gloved), 6 points deep and 5 across at 1x: thick across the palm, the knuckles to
  // the front once the arm is up. Eight corners, so it joins the forearm's octagon.
  const F = (dy, ra, rd, dz = 0) => ring(at(hd, 0, dy, dz), oval(8, ra, rd), only(hd))
  const fist = [
    F(-0.005, 0.04, 0.046),
    F(-0.06, 0.046, 0.058, 0.005),
    F(-0.115, 0.042, 0.052, 0.01),
    F(-0.14, 0.026, 0.032, 0.01),
  ]
  // The last ring of the forearm joins the glove so the wrist is one shell.
  bridge([rings[rings.length - 1], fist[0]], 'B', [false, false])
  bridge(fist, 'B', [false, true])
}

function leg(s) {
  const L = `_${s}`
  const x = s === 'l' ? 1 : -1
  const th = `thigh${L}`
  const sh = `shin${L}`
  const ft = `foot${L}`
  const R = (b, dy, ra, rd, w, dx = 0, dz = 0, n = 8) =>
    ring(at(b, dx * x, dy, dz), oval(n, ra, rd), w)
  // Rings a quarter and three quarters across the knee round it when it bends; the calf is
  // full behind the shin.
  const rings = [
    R(th, 0.03, 0.082, 0.09, blend('hips', th, 0.7), 0, 0.006),
    R(th, -0.18, 0.074, 0.078, only(th), 0, 0.01),
    R(th, -0.33, 0.06, 0.062, blend(th, sh, 0.1), -0.004, 0.012),
    R(sh, 0.035, 0.056, 0.06, blend(th, sh, 0.3), -0.002, 0.014),
    R(sh, -0.01, 0.055, 0.058, blend(th, sh, 0.7), 0, 0.01),
    R(sh, -0.11, 0.058, 0.068, only(sh), 0, -0.014),
    R(sh, -0.25, 0.046, 0.05, only(sh), 0, -0.006),
    R(sh, -0.38, 0.04, 0.044, blend(sh, ft, 0.4)),
  ]
  bridge(rings, ['A', 'A', 'A', 'A', 'A', 'A', 'B'], [false, true])
  // The shoe: a wedge from heel to toe, flat underneath (y = 0), along +Z; 7 points high at the
  // instep and 16 long at 1x.
  const fx = at(ft)[0]
  const S = (z, w, h, wt = only(ft)) =>
    ring(
      [fx, 0, z],
      [
        [w, 0],
        [w, h * 0.62],
        [w * 0.55, h],
        [-w * 0.55, h],
        [-w, h * 0.62],
        [-w, 0],
      ],
      wt,
      [1, 0, 0],
      [0, 1, 0],
    )
  bridge([S(-0.075, 0.04, 0.085), S(0.02, 0.05, 0.12), S(0.2, 0.045, 0.045)], 'B')
}

function human() {
  torso()
  neckAndHead()
  arm('l')
  arm('r')
  leg('l')
  leg('r')
}

// ---------- the effects (unskinned, about a unit in size) ----------
function icosahedron() {
  const t = (1 + Math.sqrt(5)) / 2
  const V = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ].map((p) => p.map((v) => v / Math.hypot(1, t)))
  const F = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ]
  return {
    name: 'spark',
    positions: V.flat(),
    groups: [{ material: 'spark', fill: 'A', colour: [1, 0.8, 0.4, 1], indices: F.flat() }],
  }
}

function shard() {
  // A thin triangular plate: a sliver of a body's surface, 1 long, 0.08 thick.
  const a = [
    [0, 0.5, 0],
    [-0.32, -0.42, 0],
    [0.36, -0.3, 0],
  ]
  const positions = [...a.map(([x, y]) => [x, y, 0.04]), ...a.map(([x, y]) => [x, y, -0.04])].flat()
  const indices = [0, 1, 2, 3, 5, 4, 0, 3, 4, 0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 3, 2, 3, 0]
  return {
    name: 'shard',
    positions,
    groups: [{ material: 'shard', fill: 'A', colour: [0.5, 0.6, 0.7, 1], indices }],
  }
}

// ---------- write ----------
human()
const COLOURS = { A: [0.42, 0.5, 0.66, 1], B: [0.22, 0.25, 0.3, 1], C: [0.66, 0.68, 0.74, 1] }
const NAMES = { A: 'suit', B: 'gear', C: 'head' }
const joints = []
const weights = []
for (const v of verts) {
  const ws = Object.entries(v.w).filter(([, x]) => x > 0)
  const sum = ws.reduce((s, [, x]) => s + x, 0)
  for (let k = 0; k < 4; k++) {
    joints.push(ws[k] ? BONE[ws[k][0]] : 0)
    weights.push(ws[k] ? ws[k][1] / sum : 0)
  }
}
const groups = ['A', 'B', 'C'].map((f) => ({
  material: NAMES[f],
  fill: f,
  colour: COLOURS[f],
  indices: faces.filter((t) => t.m === f).flatMap((t) => t.i),
}))
mkdirSync(OUT, { recursive: true })
const GENERATOR = 'elecdex scripts/elecfighter/build-models.mjs'
writeGltf(join(OUT, 'human.gltf'), {
  name: 'human',
  generator: GENERATOR,
  bones: BONES.map(([name, parent, head]) => ({
    name,
    parent: parent ? BONE[parent] : -1,
    head,
  })),
  mesh: { positions: verts.flatMap((v) => v.p), joints, weights, groups },
})
writeGltf(join(OUT, 'effects.gltf'), {
  name: 'effects',
  generator: GENERATOR,
  meshes: [icosahedron(), shard()],
})
console.log(
  `human.gltf: ${verts.length} vertices, ${faces.length} triangles, ${BONES.length} bones`,
)
console.log('effects.gltf: spark (20 triangles), shard (8 triangles)')
