import {
  ATTACH_LIMITS,
  type AttachmentKind,
  attachmentLabel,
  type ChatAttachment,
  estimateTokens,
  fileSize,
} from './ai.js'

/**
 * Files attached to a question in the AI chat pane (architecture.md §5.7): what a file is, what
 * it costs, and how it is put to a model. Pure: main judges every file with these, and the page
 * uses the same figures to say what it will send.
 *
 * A file reaches main as bytes the page read from a `File` the user picked, dropped or pasted -
 * never as a path. An image has been decoded, made small and encoded again in the page, whose
 * sandbox is where Chromium decodes images from anywhere; main reads only its header. Encoding
 * it again is also what leaves the camera's EXIF, and the place a photo was taken, behind.
 */

/** Why a file was not taken, as the pane's code line says it; the detail says the rest. */
export const ATTACH_CODES = ['too large', 'unreadable', 'payload full', 'no document'] as const
export type AttachCode = (typeof ATTACH_CODES)[number]

export interface AttachRefusal {
  ok: false
  code: AttachCode
  detail: string
}

/** A file as the page sees it: what the conversation keeps, and its small picture if it has one. */
export interface AttachmentView extends ChatAttachment {
  /** A JPEG data URL, for an image. */
  thumb?: string
}

export type AttachResult = { ok: true; file: AttachmentView } | AttachRefusal

/** What the page hands main for one file. */
export interface AttachUpload {
  name: string
  bytes: ArrayBuffer
  /** An image's small picture, made by the page (JPEG). */
  thumb?: ArrayBuffer
  /** An image's size before the page made it smaller. */
  source?: { width: number; height: number }
}

export const refuse = (code: AttachCode, detail: string): AttachRefusal => ({
  ok: false,
  code,
  detail,
})

type Sniffed = 'png' | 'jpeg' | 'pdf' | null

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

const startsWith = (bytes: Uint8Array, magic: readonly number[], at = 0): boolean =>
  magic.every((byte, i) => bytes[at + i] === byte)

/** What a file is by its first bytes; its name and the type the system gave it decide nothing. */
export function sniff(bytes: Uint8Array): Sniffed {
  if (startsWith(bytes, PNG)) return 'png'
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  // At the start, after nothing but white space: a note or a program that mentions "%PDF-" in its
  // first lines is text, not a document.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024))
  return head.trimStart().startsWith('%PDF-') ? 'pdf' : null
}

/** A JPEG APP1 segment that says "Exif", a PNG chunk of camera data or text: what a camera wrote. */
const PNG_WRITTEN = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt'])

/**
 * Whether an image still carries what the file it came from said about itself. The page draws
 * every image again, which leaves all of it behind; one that still has it did not come that way.
 */
export function carriesMetadata(bytes: Uint8Array, format: 'png' | 'jpeg'): boolean {
  return format === 'png' ? pngChunks(bytes).some((type) => PNG_WRITTEN.has(type)) : jpegExif(bytes)
}

/** The types of a PNG's chunks, in order. */
function pngChunks(bytes: Uint8Array): string[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const types: string[] = []
  for (let at = 8; at + 8 <= bytes.length; ) {
    const length = view.getUint32(at)
    types.push(String.fromCharCode(...bytes.subarray(at + 4, at + 8)))
    at += 12 + length
  }
  return types
}

/** Whether a JPEG has an EXIF segment before its frame. */
function jpegExif(bytes: Uint8Array): boolean {
  let at = 2
  while (at + 9 < bytes.length && bytes[at] === 0xff) {
    const marker = bytes[at + 1] ?? 0
    if (isFrame(marker)) return false
    if (marker === 0xe1 && startsWith(bytes, [0x45, 0x78, 0x69, 0x66], at + 4)) return true
    at = nextMarker(bytes, at, marker)
  }
  return false
}

const be16 = (bytes: Uint8Array, at: number): number =>
  ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0)

/** A PNG's size, from its header. */
function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  return width > 0 && height > 0 ? { width, height } : null
}

/** Start-of-frame markers: every one but DHT (C4), JPG (C8) and DAC (CC). */
const isFrame = (marker: number): boolean =>
  marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc

/** Markers that stand alone, with no length after them. */
const standsAlone = (marker: number): boolean =>
  marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)

/** Where the marker after the one at `at` begins: past a fill byte, a lone marker or a segment. */
function nextMarker(bytes: Uint8Array, at: number, marker: number): number {
  if (marker === 0xff) return at + 1
  if (standsAlone(marker)) return at + 2
  return at + 2 + be16(bytes, at + 2)
}

/** A JPEG's size, from its first frame header: the markers before it are stepped over by length. */
function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  let at = 2
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return null
    const marker = bytes[at + 1] ?? 0
    if (isFrame(marker)) {
      const height = be16(bytes, at + 5)
      const width = be16(bytes, at + 7)
      return width > 0 && height > 0 ? { width, height } : null
    }
    at = nextMarker(bytes, at, marker)
  }
  return null
}

/**
 * How many pages a PDF has, as far as can be told without parsing it: the page tree's root -
 * the `/Pages` dictionary with no `/Parent` - and of those the last written, since a PDF edited
 * in place appends its new root after the old. Failing that, the page objects in sight. Null
 * when neither shows (compressed object streams hide both): the file is still sent, its cost
 * guessed from its size, and a provider that finds it too long says so in its own words.
 */
export function pdfPages(bytes: Uint8Array): number | null {
  const text = new TextDecoder('latin1').decode(bytes)
  let root: number | null = null
  for (const match of text.matchAll(/\/Type\s*\/Pages\b/g)) {
    const start = text.lastIndexOf('<<', match.index)
    const end = text.indexOf('>>', match.index)
    if (start === -1 || end === -1) continue
    const dictionary = text.slice(start, end)
    const count = /\/Count\s+(\d+)/.exec(dictionary)
    if (count !== null && !dictionary.includes('/Parent')) root = Number(count[1])
  }
  if (root !== null && root > 0) return root
  const objects = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g)?.length ?? 0
  return objects > 0 ? objects : null
}

/**
 * A file's text, when it is one: UTF-8 that decodes, with no NUL and hardly any other control
 * characters - what a program's output or a binary format that happens to decode is full of.
 */
export function readText(bytes: Uint8Array): string | null {
  const body = startsWith(bytes, [0xef, 0xbb, 0xbf]) ? bytes.subarray(3) : bytes
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(body)
  } catch {
    return null
  }
  let controls = 0
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i)
    if (code === 0) return null
    // Tab, line feed, vertical tab, form feed, carriage return and escape are a text's own.
    if (code < 0x20 && !(code >= 0x09 && code <= 0x0d) && code !== 0x1b) controls += 1
  }
  return controls * 100 > text.length ? null : text
}

/**
 * A name for the file: the last part of whatever came, with nothing that would break a line or
 * the tag it is sent in, and cut in the middle when long so its extension survives.
 */
export function attachmentName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? ''
  // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what is removed
  const clean = base.replace(/[\u0000-\u001f\u007f<>"]/g, '').trim()
  if (clean === '') return 'file'
  const max = ATTACH_LIMITS.name
  if (clean.length <= max) return clean
  const tail = clean.slice(-24)
  return `${clean.slice(0, max - tail.length - 1)}…${tail}`
}

/**
 * The size an image is sent at: within the longest edge and the area past which Anthropic makes
 * it smaller anyway (and OpenAI's tiles cost more), so no byte is sent only to be thrown away.
 */
export function fitImage(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(
    1,
    ATTACH_LIMITS.imageEdge / Math.max(width, height),
    Math.sqrt(ATTACH_LIMITS.imageArea / (width * height)),
  )
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  }
}

/** The size of an image's small picture for its chip and card. */
export function thumbSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, ATTACH_LIMITS.thumbEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * What an image costs, estimated the way the two dialects' own services count it - Anthropic's
 * area over 750, OpenAI's 512-pixel tiles - and the larger taken: the window is better kept too
 * roomy than overrun.
 */
export function imageTokens(width: number, height: number): number {
  const area = Math.ceil((width * height) / 750)
  const fit = Math.min(1, 2048 / Math.max(width, height))
  const w = width * fit
  const h = height * fit
  const short = Math.min(1, 768 / Math.min(w, h))
  const tiles = Math.ceil((w * short) / 512) * Math.ceil((h * short) / 512)
  return Math.max(area, 85 + 170 * tiles)
}

/** A page of a PDF, read as its text and a picture of it: about this many tokens. */
const PDF_PAGE_TOKENS = 2500
/** With no page count to go by, a page is taken to be about this many bytes. */
const PDF_PAGE_BYTES = 60_000

export function pdfTokens(pages: number | null, bytes: number): number {
  return (pages ?? Math.max(1, Math.ceil(bytes / PDF_PAGE_BYTES))) * PDF_PAGE_TOKENS
}

/** A text file as it goes to the model, inside the question: named, and closed. */
export function fileBlock(name: string, text: string): string {
  return `<file name="${name}">\n${text}\n</file>`
}

/**
 * The text of a question with its files: the files first and the question last, as long material
 * is best put ahead of what is asked about it. A file that is not sent says so in its place.
 */
export function composeText(
  question: string,
  files: readonly { name: string; text: string }[],
  notes: readonly string[] = [],
): string {
  const parts = [...files.map((file) => fileBlock(file.name, file.text)), ...notes]
  if (question !== '') parts.push(question)
  return parts.join('\n\n')
}

/** In place of a file that is not sent, so the model knows it was there. */
export function unsentNote(file: ChatAttachment, why: string): string {
  return `[${attachmentLabel(file)} - not sent: ${why}]`
}

/** A question's files, named on a line of their own: what a summary is told of them. */
export function namedFiles(files: readonly ChatAttachment[] | undefined): string {
  if (files === undefined || files.length === 0) return ''
  return `[attached: ${files.map((file) => attachmentLabel(file)).join('; ')}]`
}

export interface Classified {
  kind: AttachmentKind
  mime: ChatAttachment['mime']
  tokens: number
  /** A text file's text. */
  text?: string
  width?: number
  height?: number
  pages?: number
}

function classifyImage(bytes: Uint8Array, format: 'png' | 'jpeg'): Classified | AttachRefusal {
  if (bytes.length > ATTACH_LIMITS.image) {
    return refuse('too large', `an image is sent up to ${fileSize(ATTACH_LIMITS.image)}`)
  }
  const size = format === 'png' ? pngSize(bytes) : jpegSize(bytes)
  if (size === null) return refuse('unreadable', 'the image could not be read')
  // The page makes every image this small; one that is not did not come from it.
  const fit = fitImage(size.width, size.height)
  if (fit.width !== size.width || fit.height !== size.height) {
    return refuse('too large', `an image is sent up to ${ATTACH_LIMITS.imageEdge} pixels a side`)
  }
  if (carriesMetadata(bytes, format)) {
    return refuse('unreadable', 'an image is sent only as elecdex draws it again')
  }
  return {
    kind: 'image',
    mime: format === 'png' ? 'image/png' : 'image/jpeg',
    tokens: imageTokens(size.width, size.height),
    width: size.width,
    height: size.height,
  }
}

function classifyPdf(bytes: Uint8Array): Classified | AttachRefusal {
  if (bytes.length > ATTACH_LIMITS.pdf) {
    return refuse('too large', `a PDF is sent up to ${fileSize(ATTACH_LIMITS.pdf)}`)
  }
  const pages = pdfPages(bytes)
  if (pages !== null && pages > ATTACH_LIMITS.pdfPages) {
    return refuse('too large', `a PDF is sent up to ${ATTACH_LIMITS.pdfPages} pages`)
  }
  return {
    kind: 'pdf',
    mime: 'application/pdf',
    tokens: pdfTokens(pages, bytes.length),
    ...(pages === null ? {} : { pages }),
  }
}

/** What a file is and what it costs, or why it is not taken. */
export function classify(name: string, bytes: Uint8Array): Classified | AttachRefusal {
  if (bytes.length === 0) return refuse('unreadable', 'the file is empty')
  const format = sniff(bytes)
  if (format === 'png' || format === 'jpeg') return classifyImage(bytes, format)
  if (format === 'pdf') return classifyPdf(bytes)
  if (bytes.length > ATTACH_LIMITS.text) {
    return refuse(
      'too large',
      `a text file is sent whole, up to ${fileSize(ATTACH_LIMITS.text)}; this is ${fileSize(bytes.length)}`,
    )
  }
  const text = readText(bytes)
  if (text === null) {
    return refuse('unreadable', 'only text, images and PDF files can be attached')
  }
  return {
    kind: 'text',
    mime: 'text/plain',
    tokens: estimateTokens(fileBlock(name, text)),
    text,
  }
}

/** Whether one more file of this size may join these: how many, and how much in all. */
export function roomFor(files: readonly Pick<ChatAttachment, 'bytes'>[], bytes: number) {
  if (files.length >= ATTACH_LIMITS.perMessage) {
    return refuse('payload full', `a question takes up to ${ATTACH_LIMITS.perMessage} files`)
  }
  const total = files.reduce((sum, file) => sum + file.bytes, 0)
  if (total + bytes > ATTACH_LIMITS.message) {
    return refuse(
      'payload full',
      `a question takes up to ${fileSize(ATTACH_LIMITS.message)} of files`,
    )
  }
  return null
}

/** The readout of a question's files: "3 files · 1.2 MB · ~4.1k tok". */
export function payloadReadout(files: readonly ChatAttachment[]): {
  files: number
  bytes: number
  tokens: number
} {
  return {
    files: files.length,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    tokens: files.reduce((sum, file) => sum + file.tokens, 0),
  }
}

/** The tag a chip wears for its kind. */
export const KIND_TAGS: Readonly<Record<AttachmentKind, string>> = {
  text: 'TXT',
  image: 'IMG',
  pdf: 'PDF',
}
