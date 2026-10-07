// The glTF 2.0 writer for what build-models.mjs makes: one buffer embedded as base64, so a
// model is one .gltf file. three.js's GLTFLoader reads them (scene.mjs), so a model made in
// another tool works as long as its bones carry the names in README.md.
import { writeFileSync } from 'node:fs'

const FLOAT = 5126
const USHORT = 5123
const UBYTE = 5121
const ARRAY_BUFFER = 34962
const ELEMENT_ARRAY_BUFFER = 34963
const SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

/** Collects typed arrays into one buffer, each view 4-byte aligned, and their accessors. */
class Packer {
  constructor(json) {
    this.json = json
    this.parts = []
    this.length = 0
    json.bufferViews = []
    json.accessors = []
  }

  add(array, type, componentType, target, extra = {}) {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
    const view = { buffer: 0, byteOffset: this.length, byteLength: bytes.length }
    if (target) view.target = target
    this.json.bufferViews.push(view)
    this.parts.push(bytes)
    this.length += bytes.length
    const pad = (4 - (this.length % 4)) % 4
    if (pad) {
      this.parts.push(new Uint8Array(pad))
      this.length += pad
    }
    this.json.accessors.push({
      bufferView: this.json.bufferViews.length - 1,
      componentType,
      count: array.length / SIZES[type],
      type,
      ...extra,
    })
    return this.json.accessors.length - 1
  }

  finish() {
    const all = new Uint8Array(this.length)
    let at = 0
    for (const p of this.parts) {
      all.set(p, at)
      at += p.length
    }
    this.json.buffers = [
      {
        byteLength: all.length,
        uri: `data:application/octet-stream;base64,${Buffer.from(all).toString('base64')}`,
      },
    ]
  }
}

function minMax(pos) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], pos[i + k])
      max[k] = Math.max(max[k], pos[i + k])
    }
  return { min, max }
}

/**
 * Writes a model. `bones`: [{ name, parent (index or -1), head: [x, y, z] in model space }],
 * rest rotations identity. `mesh`: { positions: number[], joints: number[] (4 a vertex),
 * weights: number[] (4 a vertex), groups: [{ material, fill, indices: number[] }] }.
 * `meshes` (optional, unskinned): [{ name, positions, groups }].
 */
export function writeGltf(path, { name, bones, mesh, meshes = [], generator }) {
  const json = {
    asset: { version: '2.0', generator },
    scene: 0,
    scenes: [{ name, nodes: [] }],
    nodes: [],
    meshes: [],
    materials: [],
  }
  const pack = new Packer(json)
  const materialIndex = new Map()
  const material = (g) => {
    if (!materialIndex.has(g.material)) {
      json.materials.push({
        name: g.material,
        pbrMetallicRoughness: { baseColorFactor: g.colour ?? [0.6, 0.6, 0.6, 1] },
        extras: { fill: g.fill },
      })
      materialIndex.set(g.material, json.materials.length - 1)
    }
    return materialIndex.get(g.material)
  }
  const primitives = (m, attributes) =>
    m.groups.map((g) => ({
      attributes,
      indices: pack.add(Uint16Array.from(g.indices), 'SCALAR', USHORT, ELEMENT_ARRAY_BUFFER),
      material: material(g),
    }))
  if (bones && mesh) {
    const nodeOf = bones.map((b, i) => {
      const parent = b.parent >= 0 ? bones[b.parent].head : [0, 0, 0]
      json.nodes.push({ name: b.name, translation: b.head.map((v, k) => round(v - parent[k])) })
      return i
    })
    bones.forEach((_, i) => {
      const kids = bones.flatMap((c, j) => (c.parent === i ? [nodeOf[j]] : []))
      if (kids.length) json.nodes[nodeOf[i]].children = kids
    })
    const ibm = new Float32Array(bones.length * 16)
    bones.forEach((b, i) => {
      // Rest rotations are identity, so the inverse bind is a translation by -head.
      ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -b.head[0], -b.head[1], -b.head[2], 1], i * 16)
    })
    const pos = Float32Array.from(mesh.positions)
    const attributes = {
      POSITION: pack.add(pos, 'VEC3', FLOAT, ARRAY_BUFFER, minMax(pos)),
      JOINTS_0: pack.add(Uint8Array.from(mesh.joints), 'VEC4', UBYTE, ARRAY_BUFFER),
      WEIGHTS_0: pack.add(Float32Array.from(mesh.weights), 'VEC4', FLOAT, ARRAY_BUFFER),
    }
    json.meshes.push({ name, primitives: primitives(mesh, attributes) })
    const root = bones.findIndex((b) => b.parent < 0)
    json.skins = [
      {
        name: `${name}-skeleton`,
        joints: nodeOf,
        skeleton: nodeOf[root],
        inverseBindMatrices: pack.add(ibm, 'MAT4', FLOAT),
      },
    ]
    json.nodes.push({ name, mesh: json.meshes.length - 1, skin: 0 })
    json.scenes[0].nodes.push(nodeOf[root], json.nodes.length - 1)
  }
  for (const m of meshes) {
    const pos = Float32Array.from(m.positions)
    const attributes = { POSITION: pack.add(pos, 'VEC3', FLOAT, ARRAY_BUFFER, minMax(pos)) }
    json.meshes.push({ name: m.name, primitives: primitives(m, attributes) })
    json.nodes.push({ name: m.name, mesh: json.meshes.length - 1 })
    json.scenes[0].nodes.push(json.nodes.length - 1)
  }
  pack.finish()
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
  return json
}

const round = (v) => Math.round(v * 1e5) / 1e5
