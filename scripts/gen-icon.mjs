/**
 * Generates build/icon.png (1024x1024), the master app icon.
 *
 * electron-builder derives icon.ico / icon.icns / the Linux icon set from this
 * single file, so this is the only icon asset we keep in the repo.
 *
 * The mark is drawn procedurally - a notched HUD frame around a terminal
 * caret - so it stays in sync with the design tokens and needs no binary blobs
 * or image libraries. Run with: node scripts/gen-icon.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const SIZE = 1024
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'icon.png')

// Matches --surface-1 and --accent from src/renderer/styles/tokens.css.
const BG = [5, 8, 13]
const ACCENT = [170, 207, 209]

const px = new Uint8Array(SIZE * SIZE * 4)

/** Signed distance to the edge of an axis-aligned rectangle. */
const rectSdf = (x, y, x0, y0, x1, y1) => Math.max(x0 - x, x - x1, y0 - y, y - y1)

/**
 * Signed distance to a square spanning [lo, hi] with its top-right and
 * bottom-left corners cut off by a 45 degree bevel. `diag` places the two cut
 * lines; the /SQRT2 normalises them so antialiasing matches the straight edges.
 */
const octSdf = (x, y, lo, hi, diag) =>
  Math.max(rectSdf(x, y, lo, lo, hi, hi), (x - y - diag) / Math.SQRT2, (y - x - diag) / Math.SQRT2)

/** Signed distance to a line segment of the given half-thickness. */
function segSdf(x, y, ax, ay, bx, by, half) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / len2))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(x - cx, y - cy) - half
}

/** Coverage in [0,1] from a signed distance, antialiased over ~1.5px. */
const cover = (d) => Math.min(1, Math.max(0, 0.75 - d / 1.5))

const S = SIZE / 1024 // keeps the numbers below readable as /1024 units
const NOTCH = 150 * S
const FRAME_IN = 104 * S
const FRAME_OUT = 950 * S
const FRAME_W = 26 * S
const DIAG_OUT = FRAME_OUT - FRAME_IN - NOTCH
// Moving a 45 degree line inward by FRAME_W perpendicular means shifting its
// x-y intercept by FRAME_W * sqrt(2), which keeps the bevel exactly as thick
// as the straight edges.
const DIAG_IN = DIAG_OUT - FRAME_W * Math.SQRT2

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    // Notched frame: the ring between two octagons. Making the *inner*
    // boundary an octagon too is what closes the bevels - subtracting a plain
    // rectangle would leave the cut corners as gaps.
    const outer = octSdf(x, y, FRAME_IN, FRAME_OUT, DIAG_OUT)
    const inner = octSdf(x, y, FRAME_IN + FRAME_W, FRAME_OUT - FRAME_W, DIAG_IN)
    const frame = Math.max(outer, -inner)

    // Terminal caret ">" plus an input underscore.
    const caretW = 30 * S
    const caret = Math.min(
      segSdf(x, y, 360 * S, 380 * S, 520 * S, 512 * S, caretW),
      segSdf(x, y, 520 * S, 512 * S, 360 * S, 644 * S, caretW),
    )
    const bar = rectSdf(x, y, 580 * S, 600 * S, 720 * S, 600 * S + 2 * caretW)

    const a = Math.max(cover(frame), cover(caret), cover(bar))

    const i = (y * SIZE + x) * 4
    px[i] = Math.round(BG[0] + (ACCENT[0] - BG[0]) * a)
    px[i + 1] = Math.round(BG[1] + (ACCENT[1] - BG[1]) * a)
    px[i + 2] = Math.round(BG[2] + (ACCENT[2] - BG[2]) * a)
    px[i + 3] = 255
  }
}

// --- minimal PNG encoder (RGBA8, one IDAT) ---
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // colour type: RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// Each scanline is prefixed with its filter byte (0 = none).
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  Buffer.from(px.buffer, y * SIZE * 4, SIZE * 4).copy(raw, y * (SIZE * 4 + 1) + 1)
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, png)
console.log(`wrote ${OUT} (${SIZE}x${SIZE}, ${(png.length / 1024).toFixed(1)} kB)`)
