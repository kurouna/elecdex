// Posing by hand and foot: forward kinematics of a model's skeleton (read from its glTF, rest
// rotations identity, as README.md asks) and a two-bone solver that turns "the fist here, the
// elbow towards there" into the joint rotations poses.json holds. Used by pose-book.mjs; plain
// Node with three.js's maths, no window.
import { readFileSync } from 'node:fs'
import { Euler, Matrix4, Quaternion, Vector3 } from 'three'

const RAD = Math.PI / 180

/** A model's bones from its glTF: { name, parent (name or null), t: rest offset from the parent }. */
export function skeletonOf(gltfPath) {
  const g = JSON.parse(readFileSync(gltfPath, 'utf8'))
  const joints = g.skins[0].joints
  const parent = new Map()
  for (const j of joints) for (const c of g.nodes[j].children ?? []) parent.set(c, j)
  return joints.map((j) => ({
    name: g.nodes[j].name,
    parent: parent.has(j) ? g.nodes[parent.get(j)].name : null,
    t: new Vector3(...(g.nodes[j].translation ?? [0, 0, 0])),
  }))
}

/** A pose's rotation of a bone as a quaternion (Euler degrees, order YXZ, as scene.mjs reads). */
export const quatOf = (r = [0, 0, 0]) =>
  new Quaternion().setFromEuler(new Euler(r[0] * RAD, r[1] * RAD, r[2] * RAD, 'YXZ'))

/** A quaternion as a pose's rotation, rounded to a tenth of a degree. */
export function rotOf(q) {
  const e = new Euler().setFromQuaternion(q, 'YXZ')
  return [e.x, e.y, e.z].map((v) => Math.round((v / RAD) * 10) / 10 + 0)
}

/**
 * Every bone's world rotation and head position in model space for `pose` (poses.json's form:
 * bones.<name>.r and the hips' t).
 */
export function forward(skel, pose) {
  const out = new Map()
  for (const b of skel) {
    const p = pose.bones?.[b.name] ?? {}
    const local = quatOf(p.r)
    const off = b.t.clone()
    if (p.t) off.add(new Vector3(...p.t))
    if (!b.parent) {
      out.set(b.name, { q: local, p: off })
      continue
    }
    const up = out.get(b.parent)
    out.set(b.name, {
      q: up.q.clone().multiply(local),
      p: off.applyQuaternion(up.q).add(up.p),
    })
  }
  return out
}

/** Sets bone `name`'s rotation in `pose` so that its world rotation is `world`. */
export function orient(skel, pose, name, world) {
  const b = skel.find((x) => x.name === name)
  const up = b.parent ? forward(skel, pose).get(b.parent).q : new Quaternion()
  pose.bones[name] = { ...pose.bones[name], r: rotOf(up.clone().invert().multiply(world)) }
}

/** A world rotation whose bone's -Y points along `down` and whose X is `across` (made square). */
export function frame(down, across) {
  const y = down.clone().normalize().negate()
  const x = across
    .clone()
    .sub(y.clone().multiplyScalar(across.dot(y)))
    .normalize()
  const z = new Vector3().crossVectors(x, y)
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z))
}

/**
 * Two bones (`upper`, `lower`, ending at `end`'s head) reaching for `target` (model space), the
 * middle joint bent towards `pole`. The lower bone turns about its own X only, a hinge: a knee
 * (`bend` 'back', its foot going behind) or an elbow ('front'). A target out of reach is
 * reached for in a straight line. Writes both bones' rotations into `pose`.
 */
export function reach(skel, pose, upper, lower, end, target, pole, bend) {
  const lenOf = (n) => skel.find((x) => x.name === n).t.length()
  const a = lenOf(lower)
  const b = lenOf(end)
  const w = forward(skel, pose)
  const root = w.get(upper).p
  const to = new Vector3(...target).sub(root)
  const d = Math.min(to.length(), (a + b) * 0.9995)
  const dir = to.clone().normalize()
  // The middle joint: along the reach by the law of cosines, out towards the pole.
  const along = (a * a - b * b + d * d) / (2 * d)
  const out = Math.sqrt(Math.max(0, a * a - along * along))
  const toPole = new Vector3(...pole).sub(root)
  const side = toPole.sub(dir.clone().multiplyScalar(toPole.dot(dir))).normalize()
  const mid = dir.clone().multiplyScalar(along).add(side.clone().multiplyScalar(out))
  const d1 = mid.clone().normalize()
  const d2 = dir.clone().multiplyScalar(d).sub(mid).normalize()
  // The hinge's axis: X such that turning about it takes d1 to d2 the way the joint bends.
  const axis = new Vector3().crossVectors(d1, d2)
  if (axis.lengthSq() < 1e-10) axis.crossVectors(d1, side)
  axis.normalize()
  // A knee turns positively about X (its -Y towards -Z: -Z must face the bend, so X is the
  // axis), an elbow negatively (+Z faces the bend, X the other way).
  const x = bend === 'back' ? axis : axis.clone().negate()
  const angle = d1.angleTo(d2)
  orient(skel, pose, upper, frame(d1, x))
  const deg = Math.round((angle / RAD) * 10) / 10
  pose.bones[lower] = { r: [bend === 'back' ? deg : -deg, 0, 0] }
}

/**
 * The foot or hand `name` given a world direction: `yaw` degrees about Y from the model's front
 * (+Z), `pitch` degrees with the toes or knuckles down, `roll` about its length.
 */
export function aim(skel, pose, name, yaw = 0, pitch = 0, roll = 0) {
  orient(skel, pose, name, quatOf([pitch, yaw, roll]))
}
