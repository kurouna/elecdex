// The bitmap side of the design scene: mock.mjs loads render.html in a hidden Electron window
// and calls window.renderJob(job). Each job is drawn by three.js (no anti-aliasing, pixel
// ratio 1, a render target with nearest filtering) with every colour a palette index, and
// comes back as { w, h, ox, oy, px } (px: the indices, row by row from the top).
import { NearestFilter, Scene, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three'
import {
  designCamera,
  designLight,
  fighterObject,
  frame,
  loadData,
  loadGltf,
  placeFighter,
  posedMesh,
  propMesh,
  towardViewer,
} from './scene.mjs'
import { explodeProp, shatter } from './shards.mjs'

const renderer = new WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setClearColor(0x000000, 0)

let data = null

/** Draws an object (with its posed positions) into indices. */
function draw(obj, positions, cam) {
  const scene = new Scene()
  scene.add(obj)
  const f = frame(cam, obj, positions)
  obj.userData.view(towardViewer(cam))
  const rt = new WebGLRenderTarget(f.w, f.h, { minFilter: NearestFilter, magFilter: NearestFilter })
  renderer.setRenderTarget(rt)
  renderer.clear()
  renderer.render(scene, cam)
  const buf = new Uint8Array(f.w * f.h * 4)
  renderer.readRenderTargetPixels(rt, 0, 0, f.w, f.h, buf)
  renderer.setRenderTarget(null)
  rt.dispose()
  const px = new Array(f.w * f.h).fill(0)
  let stray = 0
  for (let y = 0; y < f.h; y++)
    for (let x = 0; x < f.w; x++) {
      // The target's rows run from the bottom.
      const k = ((f.h - 1 - y) * f.w + x) * 4
      if (buf[k + 3] === 0) continue
      if (buf[k + 1] || buf[k + 2] || buf[k] > 15) stray++
      px[y * f.w + x] = Math.min(15, buf[k])
    }
  return { ...f, px, stray }
}

/** Model-space points to the sprite's pixels, once the camera is framed (`f` from frame()). */
function projector(cam, obj, f) {
  const v = new Vector3()
  return (x, y, z) => {
    v.set(x, y, z).applyMatrix4(obj.matrixWorld).project(cam)
    return [((v.x + 1) / 2) * f.w, ((1 - v.y) / 2) * f.h]
  }
}

/** The pixel box [x0, y0, x1, y1] (inclusive) round triangles `ts` of `mesh`, or null. */
function boxOf(mesh, ts, at) {
  let b = null
  for (const t of ts)
    for (let q = 0; q < 3; q++) {
      const k = t * 9 + q * 3
      const [x, y] = at(mesh.pos[k], mesh.pos[k + 1], mesh.pos[k + 2])
      b ??= [x, y, x, y]
      b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]
    }
  return b && [Math.floor(b[0]), Math.floor(b[1]), Math.ceil(b[2]) - 1, Math.ceil(b[3]) - 1]
}

const centre = (mesh, t) =>
  [0, 1, 2].map(
    (k) => (mesh.pos[t * 9 + k] + mesh.pos[t * 9 + 3 + k] + mesh.pos[t * 9 + 6 + k]) / 3,
  )

/** Each bone's triangles' pixel box, and the striking limb's (the bones of `pose.strikes`). */
function partsOf(mesh, pose, at) {
  const by = {}
  mesh.bone.forEach((b, t) => {
    by[b] ??= []
    by[b].push(t)
  })
  const parts = {}
  for (const [b, ts] of Object.entries(by)) parts[b] = boxOf(mesh, ts, at)
  const s = new Set(pose.strikes ?? [])
  const ts = []
  mesh.bone.forEach((b, t) => {
    if (s.has(b)) ts.push(t)
  })
  return { parts, tip: ts.length ? boxOf(mesh, ts, at) : null }
}

/** A part of a mesh: its triangles `ts`. */
function subMesh(mesh, ts) {
  const pos = new Float32Array(ts.length * 9)
  for (let k = 0; k < ts.length; k++) pos.set(mesh.pos.subarray(ts[k] * 9, ts[k] * 9 + 9), k * 9)
  return {
    pos,
    base: ts.map((t) => mesh.base[t]),
    far: ts.map(() => 0),
    bone: ts.map((t) => mesh.bone[t]),
  }
}

/**
 * The KO's pieces: the posed body's triangles in pieces that each fit `cell` pixels square on
 * screen - by bone, then halved across their longer side until they fit - the smallest merged
 * into a neighbour while the two still fit, at most `most` kept (the largest).
 */
function piecesOf(mesh, at, cell, most) {
  const box = (ts) => boxOf(mesh, ts, at)
  const fits = (b) => b[2] - b[0] < cell && b[3] - b[1] < cell
  const by = new Map()
  mesh.bone.forEach((b, t) => {
    if (!by.has(b)) by.set(b, [])
    by.get(b).push(t)
  })
  const out = []
  const split = (ts) => {
    const b = box(ts)
    if (fits(b) || ts.length === 1) {
      out.push(ts)
      return
    }
    const across = b[2] - b[0] >= b[3] - b[1] ? 0 : 1
    const key = (t) => {
      const c = centre(mesh, t)
      return at(c[0], c[1], c[2])[across]
    }
    const sorted = [...ts].sort((p, q) => key(p) - key(q))
    const h = sorted.length >> 1
    split(sorted.slice(0, h))
    split(sorted.slice(h))
  }
  for (const ts of by.values()) split(ts)
  const pieces = out.map((ts) => ({ ts, b: box(ts) }))
  const area = (b) => (b[2] - b[0] + 1) * (b[3] - b[1] + 1)
  for (;;) {
    pieces.sort((p, q) => area(p.b) - area(q.b))
    let merged = false
    for (let i = 0; i < pieces.length && !merged; i++)
      for (let j = pieces.length - 1; j > i && !merged; j--) {
        const u = [
          Math.min(pieces[i].b[0], pieces[j].b[0]),
          Math.min(pieces[i].b[1], pieces[j].b[1]),
          Math.max(pieces[i].b[2], pieces[j].b[2]),
          Math.max(pieces[i].b[3], pieces[j].b[3]),
        ]
        if (!fits(u)) continue
        pieces[j] = { ts: [...pieces[i].ts, ...pieces[j].ts], b: u }
        pieces.splice(i, 1)
        merged = true
      }
    if (!merged) break
  }
  pieces.sort((p, q) => area(q.b) - area(p.b))
  return pieces.slice(0, most)
}

async function fighterJob(job) {
  const slot = data.slots.slots.find((s) => s.id === job.slot)
  const gltf = await loadGltf(slot.model)
  const pose = data.poses.poses[job.pose]
  const mesh = posedMesh(gltf, slot.build, pose)
  const cam = designCamera(data.slots.camera.yaw, data.slots.camera.pitch)
  // A job may draw nearer (the select screen's busts: the same model, the camera closer).
  const ppm = job.ppm ?? data.slots.pixelsPerMetre
  if (job.kind === 'shatter') {
    return shatter(mesh, job).map((piece) => {
      const obj = placeFighter(fighterObject(piece.mesh, null, designLight(cam), job), ppm)
      return { ...draw(obj, piece.mesh.pos, cam), at: piece.at }
    })
  }
  const obj = placeFighter(fighterObject(mesh, null, designLight(cam), job), ppm)
  const whole = draw(obj, mesh.pos, cam)
  const at = projector(cam, obj, whole)
  if (job.kind === 'pieces') {
    // Each piece drawn alone in the whole body's frame, so its points keep their place.
    return piecesOf(mesh, at, job.cell ?? 16, job.most ?? 32).map(({ ts }) => {
      const part = subMesh(mesh, ts)
      const o = placeFighter(fighterObject(part, null, designLight(cam), job), ppm)
      return draw(o, mesh.pos, cam)
    })
  }
  return { ...whole, tris: mesh.base.length, ...partsOf(mesh, pose, at) }
}

async function propJob(job) {
  const gltf = await loadGltf(job.file)
  const mesh = explodeProp(propMesh(gltf, job.mesh), job.explode ?? 0)
  const cam = designCamera(job.yaw ?? 20, job.pitch ?? 25)
  const obj = fighterObject(mesh, null, designLight(cam), { crease: job.crease ?? 20 })
  obj.scale.setScalar(job.scale ?? 10)
  obj.rotation.set(...(job.rot ?? [0, 0, 0]).map((d) => (d * Math.PI) / 180))
  return draw(obj, mesh.pos, cam)
}

window.renderJob = async (job) => {
  data ??= await loadData()
  if (job.kind === 'prop') return propJob(job)
  return fighterJob(job)
}
window.rendererInfo = () => {
  const gl = renderer.getContext()
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
}
window.ready = true
