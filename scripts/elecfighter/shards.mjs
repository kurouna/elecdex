// Mesh effects made from triangles: the hit spark's icosahedron flying apart, and a KO's body
// cut into pieces of its own mesh (true triangles, never a cut bitmap).
import { Euler, Matrix4, Vector3 } from 'three'

/** Each triangle pushed out from the middle by `f` times its centre's distance. */
export function explodeProp(mesh, f) {
  const pos = Float32Array.from(mesh.pos)
  for (let t = 0; t < pos.length; t += 9) {
    const c = [0, 1, 2].map((k) => (pos[t + k] + pos[t + 3 + k] + pos[t + 6 + k]) / 3)
    for (let q = 0; q < 3; q++) for (let k = 0; k < 3; k++) pos[t + q * 3 + k] += c[k] * f
  }
  return { ...mesh, pos }
}

/** A seeded generator (the same pieces every run). */
function chance(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

// Small bones go with their neighbour; the chest splits front from back.
const WITH = {
  neck: 'head',
  clavicle_l: 'chest',
  clavicle_r: 'chest',
  hand_l: 'forearm_l',
  hand_r: 'forearm_r',
  foot_l: 'shin_l',
  foot_r: 'shin_r',
  spine: 'hips',
}
const SPLIT = new Set(['chest', 'hips', 'thigh_l', 'thigh_r', 'head'])

function groupOf(mesh, t) {
  const raw = mesh.bone[t] || 'body'
  const b = WITH[raw] ?? raw
  if (!SPLIT.has(b)) return b
  const y = (mesh.pos[t * 9 + 1] + mesh.pos[t * 9 + 4] + mesh.pos[t * 9 + 7]) / 3
  const z = (mesh.pos[t * 9 + 2] + mesh.pos[t * 9 + 5] + mesh.pos[t * 9 + 8]) / 3
  return `${b}:${z > 0 ? 'f' : 'b'}:${Math.floor(y * 6)}`
}

const corner = (mesh, t, q) => new Vector3().fromArray(mesh.pos, t * 9 + q * 3)

/** One piece: its triangles moved away from `middle` and turned about their centre. */
function piece(mesh, ts, middle, rnd, t) {
  const c = new Vector3()
  for (const i of ts) for (let q = 0; q < 3; q++) c.add(corner(mesh, i, q))
  c.divideScalar(ts.length * 3)
  const away = c.clone().sub(middle)
  away.y = Math.max(away.y, 0.05)
  away.normalize().multiplyScalar((0.25 + rnd() * 0.5) * t)
  away.y += 0.25 * t * rnd()
  const spin = () => (rnd() - 0.5) * 2.4 * t
  const turn = new Matrix4().makeRotationFromEuler(new Euler(spin(), spin(), spin()))
  const m = new Matrix4()
    .makeTranslation(c.x + away.x, c.y + away.y, c.z + away.z)
    .multiply(turn)
    .multiply(new Matrix4().makeTranslation(-c.x, -c.y, -c.z))
  const pos = []
  for (const i of ts)
    for (let q = 0; q < 3; q++) pos.push(...corner(mesh, i, q).applyMatrix4(m).toArray())
  return {
    mesh: {
      pos: Float32Array.from(pos),
      base: ts.map((i) => mesh.base[i]),
      far: ts.map(() => 0),
      bone: ts.map((i) => mesh.bone[i]),
    },
    at: c.clone().add(away).toArray(),
  }
}

/**
 * The posed body cut into pieces of whole triangles, each flung from the body's middle by
 * `job.t` (0 = whole, 1 = far) and turned a little. Returns [{ mesh, at: [x, y, z] }].
 */
export function shatter(mesh, job) {
  const rnd = chance(job.seed ?? 7)
  const groups = new Map()
  for (let t = 0; t < mesh.base.length; t++) {
    const g = groupOf(mesh, t)
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(t)
  }
  let cy = 0
  for (let k = 1; k < mesh.pos.length; k += 3) cy += mesh.pos[k]
  const middle = new Vector3(0, (cy / (mesh.pos.length / 3)) * 0.9, 0)
  return [...groups.values()].map((ts) => piece(mesh, ts, middle, rnd, job.t ?? 1))
}
