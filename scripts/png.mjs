// PNG pictures for the ELEC-16 game kit (docs/elec16-play.md section 10): read into RGBA for
// the kit's builder, and written by the art scripts. Only what the kit needs: 8-bit RGB, RGBA,
// grey and indexed pictures, not interlaced. Node's zlib does the compression.
import { deflateSync, inflateSync } from 'node:zlib'

const SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(bytes) {
  let c = 0xffffffff
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** The chunks of a PNG file: its head, palette, transparency and joined picture data. */
function chunksOf(b) {
  for (let k = 0; k < 8; k++) if (b[k] !== SIGNATURE[k]) throw new Error('not a PNG')
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const out = { head: null, plte: null, trns: null, idat: [] }
  for (let at = 8; at < b.length; ) {
    const len = view.getUint32(at)
    const kind = String.fromCharCode(...b.subarray(at + 4, at + 8))
    const body = b.subarray(at + 8, at + 8 + len)
    if (kind === 'IHDR') out.head = body
    else if (kind === 'PLTE') out.plte = body
    else if (kind === 'tRNS') out.trns = body
    else if (kind === 'IDAT') out.idat.push(body)
    at += 12 + len
  }
  return out
}

/** Paeth's predictor. */
function paeth(a, up, c) {
  const p = a + up - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - up)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? up : c
}

/** The rows unfiltered: `channels` bytes a point, `stride` a row. */
function unfilter(raw, width, height, channels) {
  const stride = width * channels
  const pixels = new Uint8Array(height * stride)
  const at = (x, y) => (x >= 0 && y >= 0 ? pixels[y * stride + x] : 0)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const a = at(x - channels, y)
      const up = at(x, y - 1)
      const guess = [0, a, up, (a + up) >> 1, paeth(a, up, at(x - channels, y - 1))][filter] ?? 0
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + guess) & 0xff
    }
  }
  return pixels
}

/** One point as RGBA, by colour type. */
function rgbaOf(type, p, plte, trns) {
  if (type === 6) return [p[0], p[1], p[2], p[3]]
  if (type === 2) return [p[0], p[1], p[2], 255]
  if (type === 0) return [p[0], p[0], p[0], 255]
  if (type === 4) return [p[0], p[0], p[0], p[1]]
  const i = p[0]
  return [plte[i * 3], plte[i * 3 + 1], plte[i * 3 + 2], trns && i < trns.length ? trns[i] : 255]
}

/** A PNG file's bytes as { width, height, data: RGBA }. */
export function readPng(bytes) {
  const { head, plte, trns, idat } = chunksOf(Uint8Array.from(bytes))
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength)
  const width = view.getUint32(0)
  const height = view.getUint32(4)
  const [depth, type, , , interlace] = head.subarray(8, 13)
  if (depth !== 8 || interlace !== 0) throw new Error('only 8-bit pictures, not interlaced')
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
  if (channels === undefined) throw new Error(`colour type ${type}`)
  const raw = inflateSync(Buffer.concat(idat.map((x) => Buffer.from(x))))
  const pixels = unfilter(raw, width, height, channels)
  const data = new Uint8Array(width * height * 4)
  for (let k = 0; k < width * height; k++) {
    data.set(rgbaOf(type, pixels.subarray(k * channels, (k + 1) * channels), plte, trns), k * 4)
  }
  return { width, height, data }
}

function chunk(kind, body) {
  const out = new Uint8Array(12 + body.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, body.length)
  out.set(
    [...kind].map((c) => c.charCodeAt(0)),
    4,
  )
  out.set(body, 8)
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)))
  return out
}

/** { width, height, data: RGBA } as a PNG file's bytes (RGBA, no filtering). */
export function writePng({ width, height, data }) {
  const head = new Uint8Array(13)
  const view = new DataView(head.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  head.set([8, 6, 0, 0, 0], 8)
  const raw = new Uint8Array(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    raw.set(data.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  }
  const parts = [
    SIGNATURE,
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array()),
  ]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}
