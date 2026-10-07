// The bitmap side of the design scene: mock.mjs loads render.html in a hidden Electron window
// and calls window.renderJob(job). Each job is drawn by three.js (no anti-aliasing, pixel
// ratio 1, a render target with nearest filtering) with every colour a palette index, and
// comes back as { w, h, ox, oy, px } (px: the indices, row by row from the top).
import { NearestFilter, Scene, WebGLRenderer, WebGLRenderTarget } from 'three'
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

async function fighterJob(job) {
  const slot = data.slots.slots.find((s) => s.id === job.slot)
  const gltf = await loadGltf(slot.model)
  const mesh = posedMesh(gltf, slot.build, data.poses.poses[job.pose])
  const cam = designCamera(data.slots.camera.yaw, data.slots.camera.pitch)
  const ppm = data.slots.pixelsPerMetre
  if (job.kind === 'shatter') {
    return shatter(mesh, job).map((piece) => {
      const obj = placeFighter(fighterObject(piece.mesh, null, designLight(cam), job), ppm)
      return { ...draw(obj, piece.mesh.pos, cam), at: piece.at }
    })
  }
  const obj = placeFighter(fighterObject(mesh, null, designLight(cam), job), ppm)
  return { ...draw(obj, mesh.pos, cam), tris: mesh.base.length }
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
