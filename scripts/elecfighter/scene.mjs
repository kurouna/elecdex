// ELECFIGHTER's design scene, shared by the viewer (viewer.html) and the bitmap renderer
// (render.html, driven by mock.mjs): a slot's glTF model posed from poses.json with its build
// from slots.json, flat fills in three tones and 1-pixel wire, under one camera and one light.
// Every colour is a palette index: a material looks its colours up in a 16-entry table, so the
// renderer can ask for the indices themselves (index / 255 in red) and the viewer for colours.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Euler,
  Group,
  LineSegments,
  Matrix4,
  Mesh,
  OrthographicCamera,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const RAD = Math.PI / 180
const here = (p) => new URL(p, import.meta.url).href

// ---------- data ----------
export async function loadData() {
  const [slots, poses] = await Promise.all(
    ['./slots.json', './poses.json'].map((p) => fetch(here(p)).then((r) => r.json())),
  )
  return { slots, poses }
}

const gltfs = new Map()
/** A glTF file read once (by its path relative to this folder). */
export function loadGltf(path) {
  if (!gltfs.has(path)) gltfs.set(path, new GLTFLoader().loadAsync(here(path)))
  return gltfs.get(path)
}

// ---------- the build: bone scales ----------
/**
 * A build's scales per bone, [across, along, deep] in the bone's rest frame (the base human's
 * rest frames are the model's axes: X across to its left, Y up, Z front). See README.md.
 */
export function boneScales(build = {}) {
  const b = { arms: 1, legs: 1, torso: 1, shoulders: 1, hips: 1, girth: 1, head: 1, ...build }
  const g = b.girth
  const s = {
    hips: [b.hips * g, 1, g],
    spine: [g, b.torso, g],
    chest: [b.shoulders * g, b.torso, g],
    neck: [g, 1, g],
    head: [b.head, b.head, b.head],
  }
  for (const side of ['l', 'r']) {
    s[`clavicle_${side}`] = [b.shoulders, 1, 1]
    s[`upperarm_${side}`] = [g, b.arms, g]
    s[`forearm_${side}`] = [g, b.arms, g]
    s[`hand_${side}`] = [g, g, g]
    s[`thigh_${side}`] = [g, b.legs, g]
    s[`shin_${side}`] = [g, b.legs, g]
    s[`foot_${side}`] = [1, 1, 1]
  }
  return s
}

// ---------- posing ----------
const FILL_BASE = { A: 3, B: 6, C: 9, V: 12, K: 13, W: 1 }

/** The model's skinned meshes, their skeleton and each bone's rest transform. */
function rig(gltf) {
  const meshes = []
  gltf.scene.traverse((o) => {
    if (o.isSkinnedMesh) meshes.push(o)
  })
  if (!meshes.length) throw new Error('the model has no skinned mesh')
  const skeleton = meshes[0].skeleton
  for (const b of skeleton.bones) {
    b.userData.rest ??= { p: b.position.clone(), q: b.quaternion.clone() }
  }
  return { meshes, skeleton }
}

function poseBones(skeleton, scales, pose) {
  for (const b of skeleton.bones) {
    const rest = b.userData.rest
    const ps = (b.parent?.isBone && scales[b.parent.name]) || [1, 1, 1]
    b.position.set(rest.p.x * ps[0], rest.p.y * ps[1], rest.p.z * ps[2])
    const p = pose.bones?.[b.name] ?? {}
    if (p.t) b.position.add(new Vector3(...p.t))
    const r = p.r ?? [0, 0, 0]
    b.quaternion
      .copy(rest.q)
      .multiply(new Quaternion().setFromEuler(new Euler(r[0] * RAD, r[1] * RAD, r[2] * RAD, 'YXZ')))
  }
  skeleton.bones[0].parent?.updateMatrixWorld(true)
  for (const b of skeleton.bones) b.updateMatrixWorld(true)
}

/** The fill code and side of a material: its extras.fill (GLTFLoader's userData), else A. */
const fillOf = (m) => FILL_BASE[m?.userData?.fill] ?? FILL_BASE[m?.name?.[0]?.toUpperCase()] ?? 3

/**
 * A slot in a pose as plain triangles in metres, the lowest point on y = 0:
 * { pos: Float32Array (9 a triangle), base: index per triangle (3, 6, 9 shaded; else fixed),
 * far: 0/1 per triangle, bone: name per triangle }. `far(name)` marks the side away from the
 * camera (the model's left, `_l`, when a fighter faces screen right), unless the pose lists
 * the bone in `near` (a rear limb swung through in front).
 */
export function posedMesh(
  gltf,
  build,
  pose,
  far = (n) => /_l$/.test(n) && !(pose.near ?? []).includes(n),
) {
  const { meshes, skeleton } = rig(gltf)
  const scales = boneScales(build)
  poseBones(skeleton, scales, pose)
  const skin = skeleton.bones.map((b, j) => {
    const s = scales[b.name] ?? [1, 1, 1]
    return b.matrixWorld
      .clone()
      .multiply(new Matrix4().makeScale(s[0], s[1], s[2]))
      .multiply(skeleton.boneInverses[j])
  })
  const pos = []
  const base = []
  const farOf = []
  const bone = []
  for (const mesh of meshes) posedTriangles(mesh, skin, skeleton, { pos, base, farOf, bone, far })
  let low = Infinity
  for (let k = 1; k < pos.length; k += 3) low = Math.min(low, pos[k])
  const sc = build?.scale ?? 1
  for (let k = 0; k < pos.length; k++) pos[k] = (k % 3 === 1 ? pos[k] - low : pos[k]) * sc
  // Each bone's head in the same space: where a limb's joints are (the art script's boxes).
  const joints = {}
  for (const b of skeleton.bones) {
    const p = new Vector3().setFromMatrixPosition(b.matrixWorld)
    joints[b.name] = [p.x * sc, (p.y - low) * sc, p.z * sc]
  }
  return { pos: Float32Array.from(pos), base, far: farOf, bone, joints }
}

function posedTriangles(mesh, skin, skeleton, out) {
  const g = mesh.geometry
  const P = g.attributes.position
  const J = g.attributes.skinIndex
  const W = g.attributes.skinWeight
  const bind = mesh.bindMatrix
  const unbind = mesh.bindMatrixInverse
  const v = new Vector3()
  const acc = new Vector3()
  const cache = new Map()
  const vertex = (k) => {
    if (cache.has(k)) return cache.get(k)
    acc.set(0, 0, 0)
    let main = 0
    let best = -1
    for (let q = 0; q < 4; q++) {
      const w = W.getComponent(k, q)
      if (!w) continue
      const j = J.getComponent(k, q)
      v.fromBufferAttribute(P, k).applyMatrix4(bind).applyMatrix4(skin[j])
      acc.addScaledVector(v, w)
      if (w > best) [best, main] = [w, j]
    }
    acc.applyMatrix4(unbind).applyMatrix4(mesh.matrixWorld)
    const r = { p: acc.toArray(), bone: main }
    cache.set(k, r)
    return r
  }
  const idx = g.index
  const n = idx ? idx.count : P.count
  const code = fillOf(mesh.material)
  for (let t = 0; t + 2 < n; t += 3) {
    const c = [0, 1, 2].map((q) => vertex(idx ? idx.getX(t + q) : t + q))
    for (const x of c) out.pos.push(...x.p)
    // A triangle belongs to the bone most of its corners mostly follow.
    const b = c[1].bone === c[2].bone ? c[1].bone : c[0].bone
    const name = skeleton.bones[b]?.name ?? ''
    out.base.push(code)
    out.farOf.push(out.far(name) ? 1 : 0)
    out.bone.push(name)
  }
}

/** An unskinned mesh of a glTF (an effect) as plain triangles, all of one fill. */
export function propMesh(gltf, name) {
  let found = null
  gltf.scene.traverse((o) => {
    if (o.isMesh && (o.name === name || o.parent?.name === name)) found ??= o
  })
  if (!found) throw new Error(`no mesh ${name}`)
  const g = found.geometry.index ? found.geometry.toNonIndexed() : found.geometry
  const pos = Float32Array.from(g.attributes.position.array)
  const n = pos.length / 9
  return {
    pos,
    base: Array(n).fill(fillOf(found.material)),
    far: Array(n).fill(0),
    bone: Array(n).fill(''),
  }
}

// ---------- the camera and the light ----------
/**
 * The design camera: orthographic, units are pixels once the fighter is scaled by
 * pixelsPerMetre. The fighter faces screen right (+X); the camera is turned `yaw` degrees
 * toward its front and looks `pitch` degrees down.
 */
export function designCamera(yaw, pitch) {
  const cam = new OrthographicCamera(-100, 100, 100, -100, 1, 4000)
  const d = 1000
  cam.position.set(
    d * Math.sin(yaw * RAD) * Math.cos(pitch * RAD),
    d * Math.sin(pitch * RAD),
    d * Math.cos(yaw * RAD) * Math.cos(pitch * RAD),
  )
  cam.up.set(0, 1, 0)
  cam.lookAt(0, 0, 0)
  cam.updateMatrixWorld(true)
  return cam
}

/** The light, from the upper front and a little to the screen's middle, fixed in the world. */
export function designLight(cam) {
  return new Vector3(0.08, 0.5, 0.86).normalize().applyQuaternion(cam.quaternion)
}

// ---------- materials ----------
const FILL_VERT = /* glsl */ `
attribute vec3 aNormal;
attribute float aBase;
attribute float aFar;
uniform vec3 uLight;
uniform vec2 uTone;
varying float vIndex;
void main() {
  vec3 n = normalize(mat3(modelMatrix) * aNormal);
  float d = dot(n, uLight);
  float tone = d > uTone.x ? 0.0 : (d > uTone.y ? 1.0 : 2.0);
  // The far side is one flat tone, the shade: its facets would stripe it otherwise.
  if (aFar > 0.5) tone = 2.0;
  bool shaded = aBase >= 2.5 && aBase <= 9.5;
  vIndex = shaded ? aBase + tone : (aBase < 1.5 ? (aFar > 0.5 ? 2.0 : 1.0) : aBase);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const FILL_FRAG = /* glsl */ `
uniform vec3 uPal[16];
uniform float uVoid;
varying float vIndex;
void main() {
  int i = int(floor(vIndex + 0.5));
  if (uVoid > 0.5 && i >= 3) i = 13;
  gl_FragColor = vec4(uPal[i], 1.0);
}`

const LINE_VERT = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const LINE_FRAG = /* glsl */ `
uniform vec3 uPal[16];
uniform float uIndex;
void main() {
  gl_FragColor = vec4(uPal[int(uIndex + 0.5)], 1.0);
}`

/** The 16 colours a material looks up: a palette's ([r, g, b] 0-255), or the indices. */
export function paletteUniform(pal) {
  return Array.from({ length: 16 }, (_, i) =>
    pal ? new Color(pal[i][0] / 255, pal[i][1] / 255, pal[i][2] / 255) : new Color(i / 255, 0, 0),
  )
}

export function fillMaterial(pal, light, opt = {}) {
  return new ShaderMaterial({
    vertexShader: FILL_VERT,
    fragmentShader: FILL_FRAG,
    uniforms: {
      uPal: { value: paletteUniform(pal) },
      uLight: { value: light.clone() },
      uTone: { value: [opt.t1 ?? 0.8, opt.t2 ?? 0.42] },
      uVoid: { value: opt.wireOnly ? 1 : 0 },
    },
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2,
  })
}

function lineMaterial(pal, index) {
  return new ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    uniforms: { uPal: { value: paletteUniform(pal) }, uIndex: { value: index } },
  })
}

// ---------- the object: fills and wire ----------
function faceNormals(pos) {
  const n = new Float32Array(pos.length)
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  for (let t = 0; t < pos.length; t += 9) {
    a.fromArray(pos, t)
    b.fromArray(pos, t + 3).sub(a)
    c.fromArray(pos, t + 6).sub(a)
    b.cross(c).normalize()
    for (let q = 0; q < 3; q++) b.toArray(n, t + q * 3)
  }
  return n
}

/** Triangles sharing each edge, the corners welded by position. */
function adjacency(pos) {
  const key = (k) =>
    `${Math.round(pos[k] * 1e5)},${Math.round(pos[k + 1] * 1e5)},${Math.round(pos[k + 2] * 1e5)}`
  const edges = new Map()
  for (let t = 0; t < pos.length / 9; t++)
    for (let e = 0; e < 3; e++) {
      const a = t * 9 + e * 3
      const b = t * 9 + ((e + 1) % 3) * 3
      const ka = key(a)
      const kb = key(b)
      const id = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
      if (!edges.has(id)) edges.set(id, { a, b, t: [] })
      edges.get(id).t.push(t)
    }
  return [...edges.values()]
}

/**
 * A posed mesh as a scene object: the fill, the dim wire (creases sharper than `crease` degrees
 * on the near side, and the far side's outline) and the bright wire (the near outline and the
 * borders between materials). Call `obj.userData.view(dir)` with the direction toward the
 * viewer (world) whenever the camera turns: the outline and the creases depend on it. The far
 * side draws no creases: its limbs are a flat shade inside a dim outline, never stripes.
 */
export function fighterObject(mesh, pal, light, opt = {}) {
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(mesh.pos, 3))
  const normals = faceNormals(mesh.pos)
  geo.setAttribute('aNormal', new BufferAttribute(normals, 3))
  const per = (arr) =>
    Float32Array.from({ length: arr.length * 3 }, (_, k) => arr[Math.floor(k / 3)])
  geo.setAttribute('aBase', new BufferAttribute(per(mesh.base), 1))
  geo.setAttribute('aFar', new BufferAttribute(per(mesh.far), 1))
  const group = new Group()
  const fill = new Mesh(geo, fillMaterial(pal, light, opt))
  group.add(fill)
  const dim = new LineSegments(new BufferGeometry(), lineMaterial(pal, 2))
  dim.renderOrder = 2
  const bright = new LineSegments(new BufferGeometry(), lineMaterial(pal, 1))
  bright.renderOrder = 3
  group.add(dim, bright)
  const edges = adjacency(mesh.pos)
  const n = (t) => new Vector3().fromArray(normals, t * 9)
  const sharp = Math.cos(((opt.crease ?? 50) * Math.PI) / 180)
  group.userData.view = (dirWorld) => {
    group.updateMatrixWorld(true)
    const inv = new Matrix4().copy(group.matrixWorld).invert()
    const d = dirWorld.clone().transformDirection(inv)
    const front = (t) => n(t).dot(d) > 1e-6
    const lists = { dim: [], bright: [] }
    const crease = (e, allFar) =>
      opt.variant !== 'S' &&
      !allFar &&
      e.t.length === 2 &&
      e.t.every(front) &&
      n(e.t[0]).dot(n(e.t[1])) < sharp
    for (const e of edges) {
      const allFar = e.t.every((t) => mesh.far[t])
      const kind = edgeKind(e.t, front, mesh.base) ?? (crease(e, allFar) ? 'crease' : null)
      if (!kind) continue
      const list = kind === 'crease' || allFar ? lists.dim : lists.bright
      list.push(...mesh.pos.slice(e.a, e.a + 3), ...mesh.pos.slice(e.b, e.b + 3))
    }
    for (const [obj, list] of [
      [dim, lists.dim],
      [bright, lists.bright],
    ]) {
      obj.geometry.dispose()
      obj.geometry = new BufferGeometry()
      obj.geometry.setAttribute('position', new BufferAttribute(Float32Array.from(list), 3))
    }
  }
  group.userData.setPalette = (p, wireOnly = false) => {
    for (const o of [fill, dim, bright]) o.material.uniforms.uPal.value = paletteUniform(p)
    fill.material.uniforms.uVoid.value = wireOnly ? 1 : 0
  }
  return group
}

/** The outline (one side faces the viewer, the other not) or a border between materials. */
function edgeKind(tris, front, base) {
  if (tris.length !== 2) return tris.some(front) ? 'sil' : null
  const [a, b] = tris
  const fa = front(a)
  if (fa !== front(b)) return 'sil'
  if (fa && base[a] !== base[b]) return 'mat'
  return null
}

/**
 * The fighter's frame in the world: model facing +Z turned to face +X (screen right) and
 * scaled from metres to pixels.
 */
export function placeFighter(obj, pixelsPerMetre) {
  obj.rotation.set(0, Math.PI / 2, 0)
  obj.scale.setScalar(pixelsPerMetre)
  obj.updateMatrixWorld(true)
  return obj
}

/**
 * Fits the camera's frustum round an object, 3 pixels of margin, the world origin on a pixel
 * corner: returns { w, h, ox, oy } (ox, oy: the origin's pixel).
 */
export function frame(cam, obj, positions) {
  obj.updateMatrixWorld(true)
  const m = new Matrix4().multiplyMatrices(cam.matrixWorldInverse, obj.matrixWorld)
  const v = new Vector3()
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let k = 0; k < positions.length; k += 3) {
    v.fromArray(positions, k).applyMatrix4(m)
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x)
    minY = Math.min(minY, v.y)
    maxY = Math.max(maxY, v.y)
  }
  const ox = Math.ceil(-minX) + 3
  const oy = Math.ceil(maxY) + 3
  const w = ox + Math.ceil(maxX) + 3
  const h = oy + Math.ceil(-minY) + 3
  cam.left = -ox
  cam.right = w - ox
  cam.top = oy
  cam.bottom = oy - h
  cam.updateProjectionMatrix()
  return { w, h, ox, oy }
}

/** The direction toward the viewer for an orthographic camera (world). */
export const towardViewer = (cam) => new Vector3(0, 0, 1).applyQuaternion(cam.quaternion)
