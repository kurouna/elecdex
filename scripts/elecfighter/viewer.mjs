// The design viewer (viewer.html, served by serve.mjs): the same scene code as the bitmap
// renderer - model, build, pose, palette, camera and light - at 1x into a small canvas shown
// pixelated, with OrbitControls to look round the model.
import { Group, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { fighterPalette, wireOnly } from './palettes.mjs'
import {
  designCamera,
  designLight,
  fighterObject,
  loadData,
  loadGltf,
  placeFighter,
  posedMesh,
  towardViewer,
} from './scene.mjs'

const $ = (id) => document.getElementById(id)
const canvas = $('view')
const renderer = new WebGLRenderer({ canvas, antialias: false })
renderer.setPixelRatio(1)
const data = await loadData()
const scene = new Scene()
const holder = new Group()
scene.add(holder)
let cam = designCamera(data.slots.camera.yaw, data.slots.camera.pitch)
const light = designLight(cam)
let controls = new OrbitControls(cam, canvas)
let obj = null

function frustum() {
  cam.left = -canvas.width / 2
  cam.right = canvas.width / 2
  cam.top = canvas.height - 24
  cam.bottom = -24
  cam.updateProjectionMatrix()
}

function draw() {
  if (obj) obj.userData.view(towardViewer(cam))
  renderer.setClearColor(0x000810, 1)
  renderer.render(scene, cam)
}

async function rebuild() {
  const slot = data.slots.slots.find((s) => s.id === $('slot').value)
  const gltf = await loadGltf(slot.model)
  const mesh = posedMesh(gltf, slot.build, data.poses.poses[$('pose').value])
  const wire = $('wire').value
  const pal = fighterPalette($('side').value)
  holder.clear()
  obj = fighterObject(mesh, wire === 'only' ? wireOnly(pal) : pal, light, { variant: wire })
  placeFighter(obj, data.slots.pixelsPerMetre)
  holder.add(obj)
  draw()
}

function zoom() {
  const z = Number($('zoom').value)
  canvas.style.width = `${canvas.width * z}px`
  canvas.style.height = `${canvas.height * z}px`
}

for (const s of data.slots.slots)
  $('slot').add(new Option(`${s.id} ${s.role}${s.used ? '' : ' (reserved)'}`, s.id))
for (const p of data.poses.order) $('pose').add(new Option(p, p))
for (const id of ['slot', 'pose', 'side', 'wire']) $(id).addEventListener('change', rebuild)
$('zoom').addEventListener('input', zoom)
$('reset').addEventListener('click', () => {
  controls.dispose()
  cam = designCamera(data.slots.camera.yaw, data.slots.camera.pitch)
  frustum()
  controls = new OrbitControls(cam, canvas)
  controls.addEventListener('change', draw)
  draw()
})
controls.addEventListener('change', draw)
frustum()
zoom()
await rebuild()
