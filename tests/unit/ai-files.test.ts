import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { type AiProvider, type Chat, ChatSchema } from '@shared/ai'
import type { AttachmentView } from '@shared/ai-attach'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type {
  ProviderAdapter,
  StreamRequest,
  StreamResult,
  StreamSink,
} from '../../src/main/ai/adapter.js'
import { contentOf as anthropicContent } from '../../src/main/ai/anthropic.js'
import { ChatFiles } from '../../src/main/ai/files.js'
import { contentOf as openaiContent } from '../../src/main/ai/openai.js'
import { AiChatService } from '../../src/main/ai/service.js'
import { ChatStore } from '../../src/main/ai/store.js'
import { jpeg, png } from './attach-bytes'

/**
 * Files with a question, through main (main/ai/files.ts, main/ai/service.ts): waiting in a
 * draft, kept beside the conversation when it is sent, and put to each dialect in its own form.
 */

const LOCAL: AiProvider = {
  id: 'local',
  name: 'Local',
  kind: 'openai',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llava',
}
const CLAUDE: AiProvider = {
  id: 'claude',
  name: 'Claude',
  kind: 'anthropic',
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-opus-5',
}

const DRAFT = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const OTHER_DRAFT = 'aaaaaaaa-bbbb-4ccc-8ddd-ffffffffffff'

interface Call {
  request: StreamRequest
  sink: StreamSink
  end(result?: StreamResult): void
}

function harness(dir: string) {
  const calls: Call[] = []
  let ids = 0
  const newId = () => {
    ids += 1
    return `00000000-0000-4000-8000-${String(ids).padStart(12, '0')}`
  }
  const adapter: ProviderAdapter = {
    stream: (request, sink) =>
      new Promise<StreamResult>((resolve, reject) => {
        calls.push({ request, sink, end: (result = {}) => resolve(result) })
        request.signal.addEventListener('abort', () => reject(new Error('aborted')))
      }),
    models: async () => [],
  }
  const files = new ChatFiles(dir, newId)
  const store = new ChatStore(dir)
  const service = new AiChatService({
    store,
    files,
    providers: () => [LOCAL, CLAUDE],
    systemPrompt: () => '',
    compact: () => false,
    keyFor: () => null,
    adapter: async () => adapter,
    now: () => 1000 + ids,
    newId,
    setTimer: (fn) => fn,
    clearTimer: () => {},
    publish: () => {},
    listChanged: () => {},
  })
  /** Waits for reading the files from disk and the adapter's promise, which go through real I/O. */
  const called = async (n: number): Promise<Call> => {
    for (let i = 0; i < 200 && calls.length < n; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
    const call = calls[n - 1]
    if (call === undefined) throw new Error(`no call ${n}`)
    return call
  }
  const attach = (name: string, bytes: Uint8Array, draft = DRAFT): AttachmentView => {
    const result = files.add(draft, {
      name,
      bytes: bytes.slice().buffer,
      thumb: jpeg(32, 18).slice().buffer,
      source: { width: 4032, height: 3024 },
    })
    if (!result.ok) throw new Error(result.detail)
    return result.file
  }
  const chat = (id: string): Chat => store.get(id) as Chat
  /** What a page sends with a question: its draft, and the files it shows in it. */
  const carried = (draft: string) => ({
    draft,
    files: files.pending(draft).map((file) => file.id),
  })
  return { service, files, calls, called, attach, chat, carried }
}

const text = (value: string) => new TextEncoder().encode(value)
const PDF = text('%PDF-1.4\n<< /Type /Pages /Count 1 >>\n<< /Type /Page >>')

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'elecdex-files-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('a draft', () => {
  it('holds files in memory, and says what each is without a path or its bytes', () => {
    const h = harness(dir)
    const view = h.attach('C:\\Users\\someone\\Desktop\\shot.png', png(1280, 720))
    expect(view).toMatchObject({
      kind: 'image',
      name: 'shot.png',
      mime: 'image/png',
      width: 1280,
      height: 720,
      source: { width: 4032, height: 3024 },
    })
    expect(view.thumb).toMatch(/^data:image\/jpeg;base64,/)
    expect(JSON.stringify(view)).not.toMatch(/Users|Desktop/)
    // Nothing is written until the question goes.
    expect(readdirSync(dir)).toEqual([])
    expect(h.files.pending(DRAFT)).toHaveLength(1)
    expect(h.files.pending(OTHER_DRAFT)).toEqual([])
  })

  it('takes no more than a question does, and lets one go', () => {
    const h = harness(dir)
    const views = Array.from({ length: 5 }, (_, i) => h.attach(`n${i}.txt`, text(`note ${i}`)))
    expect(h.files.add(DRAFT, { name: 'six.txt', bytes: text('6').slice().buffer })).toMatchObject({
      ok: false,
      code: 'payload full',
    })
    expect(h.files.remove(DRAFT, views[0]?.id ?? '')).toHaveLength(4)
    h.files.forget(DRAFT)
    expect(h.files.pending(DRAFT)).toEqual([])
  })

  it('keeps no picture that is not a small JPEG', () => {
    const h = harness(dir)
    const result = h.files.add(DRAFT, {
      name: 'a.png',
      bytes: png(10, 10).slice().buffer,
      thumb: text('<svg onload=alert(1)>').slice().buffer,
    })
    expect(result).toMatchObject({ ok: true })
    expect(result.ok && 'thumb' in result.file).toBe(false)
  })
})

describe('a question with files', () => {
  it('keeps them beside the conversation, and sends text in the text and an image as a part', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    const image = h.attach('shot.png', png(640, 480))
    h.attach('main.ts', text('export const x = 1'))
    expect(
      h.service.send(chatId, {
        provider: 'local',
        model: 'llava',
        text: 'Explain',
        ...h.carried(DRAFT),
      }),
    ).toEqual({
      ok: true,
    })

    const saved = h.chat(chatId)
    expect(saved.messages[0]?.attachments?.map((f) => f.name)).toEqual(['shot.png', 'main.ts'])
    const folder = path.join(dir, `${chatId}.files`)
    expect(readFileSync(path.join(folder, image.sha256))).toEqual(Buffer.from(png(640, 480)))
    expect(existsSync(path.join(folder, `${image.sha256}.thumb`))).toBe(true)
    // The conversation's JSON says what the files are; their bytes are not in it.
    expect(readFileSync(path.join(dir, `${chatId}.json`), 'utf8')).not.toContain('base64')
    // The draft is spent.
    expect(h.files.pending(DRAFT)).toEqual([])

    const call = await h.called(1)
    const [message] = call.request.messages
    expect(message?.text).toBe('<file name="main.ts">\nexport const x = 1\n</file>\n\nExplain')
    expect(message?.media).toEqual([
      { kind: 'image', mime: 'image/png', data: Buffer.from(png(640, 480)).toString('base64') },
    ])
  })

  it('may be only its files, and is named after the first', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.attach('diagram.png', png(10, 10))
    expect(
      h.service.send(chatId, { provider: 'local', model: 'llava', text: '', ...h.carried(DRAFT) }),
    ).toEqual({
      ok: true,
    })
    expect(h.chat(chatId).title).toBe('diagram.png')
    const call = await h.called(1)
    expect(call.request.messages[0]?.text).toBe('')
  })

  it('with neither text nor files is refused', () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    expect(
      h.service.send(chatId, { provider: 'local', model: 'llava', text: '', ...h.carried(DRAFT) }),
    ).toEqual({
      ok: false,
      error: 'there is nothing to send',
    })
  })

  it('with a PDF is refused for a provider that is not sent one, and its draft stays', () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.attach('paper.pdf', PDF)
    const result = h.service.send(chatId, {
      provider: 'local',
      model: 'llava',
      text: 'Sum up',
      ...h.carried(DRAFT),
    })
    expect(result).toMatchObject({ ok: false })
    expect(result.ok || result.error).toMatch(/Local is not sent PDF files/)
    expect(h.files.pending(DRAFT)).toHaveLength(1)
    expect(h.chat(chatId).messages).toEqual([])
    // Anthropic's dialect takes it, as a document.
    expect(
      h.service.send(chatId, {
        provider: 'claude',
        model: 'claude-opus-5',
        text: 'Sum up',
        ...h.carried(DRAFT),
      }),
    ).toEqual({
      ok: true,
    })
  })
})

describe('a draft main let go', () => {
  it('stops the question rather than send it without a file the page showed', () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    const shown = h.attach('shot.png', png(10, 10))
    h.files.forget(DRAFT)
    const result = h.service.send(chatId, {
      provider: 'local',
      model: 'llava',
      text: 'Look',
      draft: DRAFT,
      files: [shown.id],
    })
    expect(result).toEqual({ ok: false, error: 'a file waiting here was let go - attach it again' })
    expect(h.chat(chatId).messages).toEqual([])
  })

  it('goes oldest first, past a number of drafts or of bytes held, never the one just added to', () => {
    const h = harness(dir)
    const draft = (n: number) => `aaaaaaaa-bbbb-4ccc-8ddd-${String(n).padStart(12, '0')}`
    for (let n = 0; n < 30; n += 1) h.attach('a.txt', text(`draft ${n}`), draft(n))
    expect(h.files.pending(draft(0))).toEqual([])
    expect(h.files.pending(draft(5))).toEqual([])
    expect(h.files.pending(draft(6))).toHaveLength(1)
    expect(h.files.pending(draft(29))).toHaveLength(1)
    // Big drafts: 3.7 MB images, four to a draft, five drafts - past 64 MB the oldest go.
    const image = png(1000, 1000, 3_600_000)
    for (let n = 100; n < 105; n += 1)
      for (let i = 0; i < 4; i += 1) h.attach('big.png', image, draft(n))
    expect(h.files.pending(draft(100))).toEqual([])
    expect(h.files.pending(draft(104))).toHaveLength(4)
  })
})

describe('the history', () => {
  it('names a PDF it cannot send to the provider now asked, rather than dropping it unsaid', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.attach('paper.pdf', PDF)
    h.service.send(chatId, {
      provider: 'claude',
      model: 'claude-opus-5',
      text: 'Read',
      ...h.carried(DRAFT),
    })
    ;(await h.called(1)).end()
    await new Promise((resolve) => setTimeout(resolve, 10))
    h.service.send(chatId, { provider: 'local', model: 'llava', text: 'And now?' })
    const call = await h.called(2)
    expect(call.request.messages[0]?.media).toBeUndefined()
    expect(call.request.messages[0]?.text).toMatch(
      /^\[paper\.pdf \(PDF, 1 page, .*\) - not sent: Local is not sent PDF files\]\n\nRead$/,
    )
  })

  it('does not weigh a PDF the provider now asked is not sent, so it moves no cut', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    // Twelve pages: 30,000 estimated tokens, far past a local server's 8,192.
    h.attach('long.pdf', text('%PDF-1.4\n<< /Type /Pages /Count 12 >>'))
    h.service.send(chatId, {
      provider: 'claude',
      model: 'claude-opus-5',
      text: 'Read',
      ...h.carried(DRAFT),
    })
    const first = await h.called(1)
    first.sink.text('It is long.')
    first.end()
    await new Promise((resolve) => setTimeout(resolve, 10))
    h.service.send(chatId, { provider: 'local', model: 'llava', text: 'And now?' })
    const call = await h.called(2)
    expect(call.request.messages).toHaveLength(3)
    expect(h.chat(chatId).context).toBeUndefined()
  })

  it('names a file whose copy is gone', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    const view = h.attach('notes.md', text('# notes'))
    h.service.send(chatId, { provider: 'local', model: 'llava', text: 'Read', ...h.carried(DRAFT) })
    ;(await h.called(1)).end()
    await new Promise((resolve) => setTimeout(resolve, 10))
    unlinkSync(path.join(dir, `${chatId}.files`, view.sha256))
    h.service.send(chatId, { provider: 'local', model: 'llava', text: 'Again' })
    const call = await h.called(2)
    expect(call.request.messages[0]?.text).toMatch(/not sent: its copy is missing/)
  })

  it('keeps the files an edited question keeps, and lets go of the rest on disk', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    const keep = h.attach('keep.png', png(10, 10))
    const drop = h.attach('drop.png', png(20, 20))
    h.service.send(chatId, {
      provider: 'local',
      model: 'llava',
      text: 'First',
      ...h.carried(DRAFT),
    })
    ;(await h.called(1)).end()
    await new Promise((resolve) => setTimeout(resolve, 10))
    const question = h.chat(chatId).messages[0]?.id as string

    h.attach('new.txt', text('added'), OTHER_DRAFT)
    const saved = h.chat(chatId).messages[0]?.attachments ?? []
    const keepId = saved.find((f) => f.name === 'keep.png')?.id as string
    expect(
      h.service.send(chatId, {
        provider: 'local',
        model: 'llava',
        text: 'Rewritten',
        replaceFrom: question,
        keep: [keepId],
        ...h.carried(OTHER_DRAFT),
      }),
    ).toEqual({ ok: true })
    const rewritten = ChatSchema.parse(h.chat(chatId)).messages
    expect(rewritten).toHaveLength(1)
    expect(rewritten[0]?.attachments?.map((f) => f.name)).toEqual(['keep.png', 'new.txt'])
    const folder = readdirSync(path.join(dir, `${chatId}.files`))
    expect(folder).toContain(keep.sha256)
    expect(folder).not.toContain(drop.sha256)
    expect(folder).not.toContain(`${drop.sha256}.thumb`)
  })

  it('goes with its conversation', async () => {
    const h = harness(dir)
    const chatId = h.service.create() as string
    h.attach('a.png', png(10, 10))
    h.service.send(chatId, { provider: 'local', model: 'llava', text: 'x', ...h.carried(DRAFT) })
    await h.called(1)
    expect(existsSync(path.join(dir, `${chatId}.files`))).toBe(true)
    h.service.remove(chatId)
    expect(existsSync(path.join(dir, `${chatId}.files`))).toBe(false)
  })
})

describe('each dialect', () => {
  const message = {
    role: 'user' as const,
    text: 'What is this?',
    media: [
      { kind: 'image' as const, mime: 'image/jpeg' as const, data: 'AAAA' },
      { kind: 'pdf' as const, name: 'r.pdf', data: 'BBBB' },
    ],
  }

  it('OpenAI: an image as a data URL, a PDF as a file part, the text last', () => {
    expect(openaiContent(message)).toEqual([
      { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAAA' } },
      { type: 'file', file: { filename: 'r.pdf', file_data: 'data:application/pdf;base64,BBBB' } },
      { type: 'text', text: 'What is this?' },
    ])
    expect(openaiContent({ role: 'user', text: 'plain' })).toBe('plain')
  })

  it('Anthropic: base64 blocks with their media type, the text last, and no empty text block', () => {
    expect(anthropicContent(message)).toEqual([
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } },
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: 'BBBB' },
        title: 'r.pdf',
      },
      { type: 'text', text: 'What is this?' },
    ])
    expect(anthropicContent({ ...message, text: '' })).toHaveLength(2)
  })
})
