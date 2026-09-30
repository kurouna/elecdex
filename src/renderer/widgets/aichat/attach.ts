import { ATTACH_LIMITS, fileSize } from '@shared/ai'
import {
  type AttachRefusal,
  type AttachUpload,
  fitImage,
  refuse,
  thumbSize,
} from '@shared/ai-attach'

/**
 * A file the user picked, dropped or pasted, made ready for main (shared/ai-attach.ts).
 *
 * An image is decoded here, in the page's sandbox - where Chromium decodes every image from
 * anywhere - drawn at the size it will be sent at, and encoded again: main never decodes one,
 * and what the camera wrote into the file (where a photo was taken, among the rest) is left
 * behind. Anything else goes as its bytes, for main to judge.
 */

const IMAGE_TYPES = /^image\/(png|jpeg|gif|webp|bmp|avif)$/
const IMAGE_NAMES = /\.(png|jpe?g|gif|webp|bmp|avif)$/i

/** A picture to draw again, by what the system says it is; an SVG is text, and goes as text. */
export const isImageFile = (file: File): boolean =>
  IMAGE_TYPES.test(file.type) || (file.type === '' && IMAGE_NAMES.test(file.name))

const MAGIC: readonly (readonly number[])[] = [
  [0x89, 0x50, 0x4e, 0x47],
  [0xff, 0xd8, 0xff],
  // GIF87a / GIF89a: "GIF8" alone begins words too.
  [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
]

/** A BMP: "BM", and at 14 the size of a header Windows or OS/2 wrote - "BM" alone begins text. */
const BMP_HEADERS = new Set([12, 40, 52, 56, 64, 108, 124])

/**
 * A picture by its first bytes, whatever it is called: one with no extension, or a type the
 * system names oddly, is drawn again all the same - never sent as it came, with what the camera
 * wrote in it. (Main refuses one that still carries that, `carriesMetadata`.)
 */
export async function looksLikeImage(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 18).arrayBuffer())
  const webp =
    String.fromCharCode(...head.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...head.subarray(8, 12)) === 'WEBP'
  const bmp =
    head.length >= 18 &&
    head[0] === 0x42 &&
    head[1] === 0x4d &&
    BMP_HEADERS.has(new DataView(head.buffer).getUint32(14, true))
  return webp || bmp || MAGIC.some((magic) => magic.every((byte, i) => head[i] === byte))
}

const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

/** JPEG qualities tried in turn when an image does not fit as it is. */
const QUALITIES = [0.9, 0.8, 0.7] as const
const THUMB_QUALITY = 0.7

async function encode(
  bitmap: ImageBitmap,
  size: { width: number; height: number },
  type: 'image/png' | 'image/jpeg',
  quality?: number,
): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(size.width, size.height)
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('no 2d context')
  // A JPEG has no transparency: what was clear becomes paper, not black.
  if (type === 'image/jpeg') {
    context.fillStyle = '#fff'
    context.fillRect(0, 0, size.width, size.height)
  }
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, 0, 0, size.width, size.height)
  const blob = await canvas.convertToBlob({ type, ...(quality === undefined ? {} : { quality }) })
  return blob.arrayBuffer()
}

/**
 * The image as it is sent: a PNG stays a PNG (a screenshot's letters stay sharp) while it fits,
 * a photograph is a JPEG; either, too large, becomes a JPEG of less quality.
 */
async function encodeWithin(
  bitmap: ImageBitmap,
  size: { width: number; height: number },
  photo: boolean,
): Promise<ArrayBuffer | null> {
  if (!photo) {
    const png = await encode(bitmap, size, 'image/png')
    if (png.byteLength <= ATTACH_LIMITS.image) return png
  }
  for (const quality of QUALITIES) {
    const jpeg = await encode(bitmap, size, 'image/jpeg', quality)
    if (jpeg.byteLength <= ATTACH_LIMITS.image) return jpeg
  }
  return null
}

async function prepareImage(file: File, name: string): Promise<AttachUpload | AttachRefusal> {
  if (file.size > ATTACH_LIMITS.imageSource) {
    return refuse('too large', `an image is taken up to ${fileSize(ATTACH_LIMITS.imageSource)}`)
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return refuse('unreadable', 'the image could not be read')
  }
  try {
    const source = { width: bitmap.width, height: bitmap.height }
    const size = fitImage(source.width, source.height)
    const bytes = await encodeWithin(bitmap, size, file.type === 'image/jpeg')
    if (bytes === null) return refuse('too large', 'the image stays too large even made small')
    const thumb = await encode(
      bitmap,
      thumbSize(size.width, size.height),
      'image/jpeg',
      THUMB_QUALITY,
    )
    return {
      name,
      bytes,
      ...(thumb.byteLength <= ATTACH_LIMITS.thumb ? { thumb } : {}),
      source,
    }
  } catch {
    return refuse('unreadable', 'the image could not be drawn')
  } finally {
    bitmap.close()
  }
}

/**
 * A file ready to hand to main, or why it cannot go. `name` stands in for the file's own (a
 * pasted picture is called "image.png" by the system, which says nothing).
 */
export async function prepare(file: File, name = file.name): Promise<AttachUpload | AttachRefusal> {
  if (isImageFile(file)) return prepareImage(file, name)
  if (await looksLikeImage(file).catch(() => false)) {
    // Taken for a picture by its bytes alone: one that does not decode goes as what it is, for
    // main to judge - which never takes an image still carrying the camera's data.
    const drawn = await prepareImage(file, name)
    if (!('ok' in drawn) || drawn.code !== 'unreadable') return drawn
  }
  const pdf = isPdfFile(file)
  const limit = pdf ? ATTACH_LIMITS.pdf : ATTACH_LIMITS.text
  // Refused before it is read: a large file is never read into the page only to be turned away.
  if (file.size > limit) {
    return refuse(
      'too large',
      pdf
        ? `a PDF is sent up to ${fileSize(limit)}`
        : `a text file is sent whole, up to ${fileSize(limit)}; this is ${fileSize(file.size)}`,
    )
  }
  try {
    return { name, bytes: await file.arrayBuffer() }
  } catch {
    return refuse('unreadable', 'the file could not be read')
  }
}

/** A name for a picture pasted from the clipboard: when it was pasted. */
export function pastedName(file: File, at: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`
  const ext = /\.[a-z0-9]+$/i.exec(file.name)?.[0] ?? '.png'
  return `pasted-${stamp}${ext}`
}
