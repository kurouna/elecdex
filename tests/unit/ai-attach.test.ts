import {
  ATTACH_LIMITS,
  type ChatAttachment,
  chatMarkdown,
  chatRequest,
  chatWindow,
  takesPdf,
} from '@shared/ai'
import {
  attachmentName,
  classify,
  composeText,
  fitImage,
  imageTokens,
  namedFiles,
  pdfPages,
  readText,
  roomFor,
  sniff,
  thumbSize,
} from '@shared/ai-attach'
import { describe, expect, it } from 'vitest'
import { jpeg, png } from './attach-bytes'

/**
 * Files attached to a question (shared/ai-attach.ts, architecture.md §5.7): what main makes of
 * the bytes the page hands it, and how they go to a model.
 */

const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const pdf = (pages: number): Uint8Array =>
  encode(
    `%PDF-1.7\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [] /Count ${pages} >> endobj\n` +
      Array.from({ length: pages }, (_, i) => `${i + 3} 0 obj << /Type /Page >> endobj\n`).join(''),
  )

const file = (over: Partial<ChatAttachment> = {}): ChatAttachment => ({
  id: 'f1',
  kind: 'image',
  name: 'shot.png',
  mime: 'image/png',
  bytes: 1000,
  sha256: 'a'.repeat(64),
  tokens: 100,
  width: 10,
  height: 10,
  ...over,
})

const { width: _w, height: _h, ...plain } = file()
const pdfFile: ChatAttachment = {
  ...plain,
  id: 'f2',
  kind: 'pdf',
  name: 'r.pdf',
  mime: 'application/pdf',
}

describe('what a file is', () => {
  it('is told by its first bytes, never by its name', () => {
    expect(sniff(png(10, 10))).toBe('png')
    expect(sniff(jpeg(10, 10))).toBe('jpeg')
    expect(sniff(pdf(1))).toBe('pdf')
    expect(sniff(encode('hello'))).toBeNull()
    // A PNG called .txt is a PNG; text called .png is text.
    expect(classify('notes.txt', png(10, 20))).toMatchObject({
      kind: 'image',
      width: 10,
      height: 20,
    })
    expect(classify('picture.png', encode('just words'))).toMatchObject({ kind: 'text' })
  })

  it('takes a PDF by its header at the start, not a note that mentions one', () => {
    expect(sniff(encode('  \n%PDF-1.7\n'))).toBe('pdf')
    expect(sniff(encode("if data.startswith(b'%PDF-'):\n    pass\n"))).toBeNull()
    expect(classify('check.py', encode("magic = '%PDF-'\n"))).toMatchObject({ kind: 'text' })
  })

  it('refuses an image that still carries what its file said about itself', () => {
    // A JPEG with an EXIF segment ahead of its frame: the page never makes one.
    const exif = [0xff, 0xe1, 0x00, 0x0a, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x47, 0x50]
    const plain = jpeg(40, 30)
    const withExif = new Uint8Array([...plain.subarray(0, 2), ...exif, ...plain.subarray(2)])
    expect(classify('a.jpg', plain)).toMatchObject({ kind: 'image' })
    expect(classify('a.jpg', withExif)).toMatchObject({ ok: false, code: 'unreadable' })
    // A PNG with a text chunk after its header.
    const chunk = [0, 0, 0, 3, 0x74, 0x45, 0x58, 0x74, 0x61, 0x62, 0x63, 0, 0, 0, 0]
    const png10 = png(10, 10)
    expect(classify('a.png', new Uint8Array([...png10, ...chunk]))).toMatchObject({
      ok: false,
      code: 'unreadable',
    })
  })

  it('reads an image’s size from its header, a JPEG’s past the segments before its frame', () => {
    expect(classify('a.png', png(1280, 720))).toMatchObject({
      kind: 'image',
      mime: 'image/png',
      width: 1280,
      height: 720,
    })
    expect(classify('a.jpg', jpeg(800, 600))).toMatchObject({
      kind: 'image',
      mime: 'image/jpeg',
      width: 800,
      height: 600,
    })
  })

  it('refuses an image the page did not make small: it did not come from the page', () => {
    expect(classify('big.png', png(4000, 3000))).toMatchObject({ ok: false, code: 'too large' })
    expect(classify('big.png', png(10, 10, ATTACH_LIMITS.image))).toMatchObject({
      ok: false,
      code: 'too large',
    })
    expect(classify('broken.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toMatchObject({
      ok: false,
      code: 'unreadable',
    })
  })

  it('counts a PDF’s pages from its latest root, not a branch of it or an older one', () => {
    const edited = encode(
      '%PDF-1.7\n2 0 obj << /Type /Pages /Kids [4 0 R] /Count 9 >> endobj\n' +
        '4 0 obj << /Type /Pages /Parent 2 0 R /Kids [] /Count 4 >> endobj\n' +
        '% an edit appended later\n2 0 obj << /Type /Pages /Kids [4 0 R] /Count 3 >> endobj\n',
    )
    expect(pdfPages(edited)).toBe(3)
  })

  it('counts a PDF’s pages from its page tree, and refuses one past the limit', () => {
    expect(pdfPages(pdf(3))).toBe(3)
    expect(classify('a.pdf', pdf(3))).toMatchObject({ kind: 'pdf', pages: 3, tokens: 7500 })
    expect(classify('a.pdf', pdf(ATTACH_LIMITS.pdfPages + 1))).toMatchObject({
      ok: false,
      code: 'too large',
    })
    // Pages hidden in compressed streams: sent, its cost guessed from its size.
    const hidden = classify('a.pdf', encode('%PDF-1.7\nstream...endstream'))
    expect(hidden).toMatchObject({ kind: 'pdf', tokens: 2500 })
    expect(hidden).not.toHaveProperty('pages')
  })

  it('takes text that decodes, without its byte order mark, and nothing binary', () => {
    expect(readText(encode('\ufeffhéllo\n\tworld'))).toBe('héllo\n\tworld')
    expect(readText(new Uint8Array([0x68, 0x00, 0x69]))).toBeNull()
    expect(readText(new Uint8Array([0xc3, 0x28]))).toBeNull()
    // A few control characters in a log are a log's; many are not text.
    expect(readText(encode(`a\u0007${'b'.repeat(200)}`))).not.toBeNull()
    expect(readText(encode('\u0001\u0002\u0003abc'))).toBeNull()
    expect(classify('app.exe', new Uint8Array([0x4d, 0x5a, 0x00, 0x00]))).toMatchObject({
      ok: false,
      code: 'unreadable',
    })
    expect(classify('empty.txt', new Uint8Array())).toMatchObject({ ok: false, code: 'unreadable' })
  })

  it('refuses a text file too long to send whole, rather than cutting it', () => {
    const long = encode('x'.repeat(ATTACH_LIMITS.text + 1))
    expect(classify('huge.log', long)).toMatchObject({ ok: false, code: 'too large' })
    expect(classify('fits.log', encode('x'.repeat(ATTACH_LIMITS.text)))).toMatchObject({
      kind: 'text',
    })
  })
})

describe('a file’s name', () => {
  it('is the last part of whatever came, never a path', () => {
    expect(attachmentName('C:\\Users\\someone\\secret\\report.md')).toBe('report.md')
    expect(attachmentName('/home/someone/.ssh/id_ed25519')).toBe('id_ed25519')
  })

  it('carries nothing that would break the tag it is sent in, and keeps its extension when long', () => {
    expect(attachmentName('a"b<c>\nd.txt')).toBe('abcd.txt')
    expect(attachmentName('')).toBe('file')
    const long = attachmentName(`${'n'.repeat(300)}.config.json`)
    expect(long.length).toBeLessThanOrEqual(ATTACH_LIMITS.name)
    expect(long.endsWith('.config.json')).toBe(true)
  })
})

describe('an image’s size', () => {
  it('is brought within the edge and the area the services would shrink it to anyway', () => {
    expect(fitImage(800, 600)).toEqual({ width: 800, height: 600 })
    const shot = fitImage(1920, 1080)
    expect(shot.width * shot.height).toBeLessThanOrEqual(ATTACH_LIMITS.imageArea)
    expect(shot.width / shot.height).toBeCloseTo(16 / 9, 1)
    const tall = fitImage(1000, 8000)
    expect(Math.max(tall.width, tall.height)).toBeLessThanOrEqual(ATTACH_LIMITS.imageEdge)
    // What the page makes, main takes.
    const photo = fitImage(4032, 3024)
    expect(classify('p.png', png(photo.width, photo.height))).toMatchObject({ kind: 'image' })
  })

  it('costs what the dearer of the two services would count', () => {
    // Anthropic: 1092x1092 is about 1590 tokens; OpenAI's tiles of it are fewer.
    expect(imageTokens(1092, 1092)).toBe(Math.ceil((1092 * 1092) / 750))
    // A small image: OpenAI's one tile, 255, is more than its area says.
    expect(imageTokens(100, 100)).toBe(255)
  })

  it('makes a small picture for its chip', () => {
    expect(thumbSize(1280, 720)).toEqual({ width: 128, height: 72 })
    expect(thumbSize(40, 20)).toEqual({ width: 40, height: 20 })
  })
})

describe('a question with files', () => {
  it('puts the files first and the question last, each file named and closed', () => {
    expect(composeText('What does it do?', [{ name: 'a.ts', text: 'export {}' }])).toBe(
      '<file name="a.ts">\nexport {}\n</file>\n\nWhat does it do?',
    )
    expect(composeText('', [{ name: 'a.ts', text: 'x' }], ['[b.pdf - not sent]'])).toBe(
      '<file name="a.ts">\nx\n</file>\n\n[b.pdf - not sent]',
    )
    expect(composeText('only words', [])).toBe('only words')
  })

  it('takes up to five files and fifteen megabytes', () => {
    expect(roomFor([], 1000)).toBeNull()
    expect(
      roomFor(
        Array.from({ length: 5 }, () => ({ bytes: 1 })),
        1,
      ),
    ).toMatchObject({
      code: 'payload full',
    })
    expect(roomFor([{ bytes: ATTACH_LIMITS.message }], 1)).toMatchObject({ code: 'payload full' })
  })

  it('is named, not shown, where a summary or an export speaks of it', () => {
    expect(namedFiles([file(), { ...pdfFile, pages: 2 }])).toBe(
      '[attached: shot.png (image, 10×10, 1000 B); r.pdf (PDF, 2 pages, 1000 B)]',
    )
    expect(namedFiles(undefined)).toBe('')
    const markdown = chatMarkdown({
      version: 1,
      id: '11111111-2222-4333-8444-555555555555',
      title: 'files',
      createdAt: 1,
      updatedAt: 1,
      messages: [{ id: 'q', role: 'user', text: '', attachments: [file()], at: 1 }],
    })
    expect(markdown).toContain('## You\n\n- shot.png (image, 10×10, 1000 B)\n')
    expect(markdown).not.toContain('base64')
  })
})

describe('a request with files', () => {
  const ASK = { provider: 'local', model: 'm' }
  const DRAFT = '11111111-2222-4333-8444-555555555555'

  it('may have an empty question when it carries files, and not otherwise', () => {
    expect(chatRequest({ ...ASK, text: '', draft: DRAFT, files: ['a'] })).toEqual({
      ...ASK,
      text: '',
      draft: DRAFT,
      files: ['a'],
    })
    expect(chatRequest({ ...ASK, text: ' ', keep: ['a'] })).toMatchObject({ keep: ['a'] })
    expect(chatRequest({ ...ASK, text: '' })).toBeNull()
    expect(chatRequest({ ...ASK, text: '', keep: [] })).toBeNull()
  })

  it('names the draft’s files with it, and a draft with them', () => {
    expect(chatRequest({ ...ASK, text: 'x', draft: DRAFT })).toBeNull()
    expect(chatRequest({ ...ASK, text: 'x', files: ['a'] })).toBeNull()
    expect(chatRequest({ ...ASK, text: '', draft: DRAFT, files: [] })).toBeNull()
  })

  it('names a draft by an id of the page’s making, and keeps no more files than a question takes', () => {
    expect(chatRequest({ ...ASK, text: 'x', draft: '../chats' })).toBeNull()
    expect(chatRequest({ ...ASK, text: 'x', keep: ['a', 'b', 'c', 'd', 'e', 'f'] })).toBeNull()
    expect(chatRequest({ ...ASK, text: 'x', keep: [7] })).toBeNull()
  })
})

describe('the providers sent a PDF', () => {
  it('are Anthropic’s dialect, and the OpenAI-dialect presets that read one, by their address', () => {
    expect(takesPdf({ kind: 'anthropic', baseUrl: 'http://localhost:9000' })).toBe(true)
    expect(takesPdf({ kind: 'openai', baseUrl: 'https://api.openai.com/v1/' })).toBe(true)
    expect(takesPdf({ kind: 'openai', baseUrl: 'https://openrouter.ai/api/v1' })).toBe(true)
    expect(takesPdf({ kind: 'openai', baseUrl: 'http://localhost:11434/v1' })).toBe(false)
    expect(
      takesPdf({
        kind: 'openai',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      }),
    ).toBe(false)
  })
})

describe('the window, with files', () => {
  const message = (id: string, role: 'user' | 'assistant', attachments?: ChatAttachment[]) => ({
    id,
    role,
    text: 'hi',
    ...(attachments === undefined ? {} : { attachments }),
  })

  it('counts what a file costs as part of its message', () => {
    const heavy = [
      message('1', 'user', [file({ tokens: 5000 })]),
      message('2', 'assistant'),
      message('3', 'user'),
    ]
    expect(chatWindow(heavy, { window: 4000, system: 0, ratio: 1 }).from).toBe(2)
    expect(chatWindow(heavy, { window: 40_000, system: 0, ratio: 1 }).from).toBe(0)
  })

  it('cuts for bytes rarely and by a lot, not one screenshot a turn', () => {
    // A screenshot with every question: the cut must hold for many turns once made, or every turn
    // would send a new beginning and throw the prompt cache away.
    const history: ReturnType<typeof message>[] = []
    let from: string | undefined
    let moves = 0
    for (let turn = 0; turn < 40; turn += 1) {
      history.push(message(`q${turn}`, 'user', [file({ id: `q${turn}`, bytes: 3_000_000 })]))
      const cut = chatWindow(history, {
        window: 0,
        system: 0,
        ratio: 1,
        from,
        media: ATTACH_LIMITS.sent,
      })
      const at = history[cut.from]?.id
      if (cut.from > 0 && at !== from) moves += 1
      from = cut.from > 0 ? at : undefined
      history.push(message(`a${turn}`, 'assistant'))
    }
    expect(moves).toBeGreaterThan(0)
    expect(moves).toBeLessThanOrEqual(12)
  })

  it('cuts at the bytes a request can carry even where tokens are not limited', () => {
    const big = (id: string) => message(id, 'user', [file({ id, bytes: 8_000_000 })])
    const history = [
      big('1'),
      message('2', 'assistant'),
      big('3'),
      message('4', 'assistant'),
      big('5'),
    ]
    const cut = chatWindow(history, { window: 0, system: 0, ratio: 1, media: ATTACH_LIMITS.sent })
    // Cut to leave room, as for tokens: to the last question alone, not just under the limit.
    expect(cut.from).toBe(4)
    // A text file weighs nothing against the bytes.
    const texts = history.map((m) => ({
      ...m,
      ...(m.attachments
        ? { attachments: [file({ kind: 'text', mime: 'text/plain', bytes: 8_000_000 })] }
        : {}),
    }))
    expect(
      chatWindow(texts, { window: 0, system: 0, ratio: 1, media: ATTACH_LIMITS.sent }).from,
    ).toBe(0)
  })
})
