import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ATTACH_LIMITS, CHAT_ID, type ChatAttachment } from '@shared/ai'
import {
  type AttachmentView,
  type AttachResult,
  type AttachUpload,
  attachmentName,
  classify,
  refuse,
  roomFor,
  sniff,
} from '@shared/ai-attach'
import { replaceFile } from '../store/replace-file.js'

/**
 * The files of the AI chat pane's questions (architecture.md §5.7, shared/ai-attach.ts).
 *
 * Waiting to be sent, a file is held in memory under the draft the page named - no disk, since a
 * draft may never be sent. Sent, it is written beside its conversation, in `<chat>.files/`, named
 * by its SHA-256 (the same screenshot sent twice is kept once), and goes when the conversation
 * does. The conversation's JSON holds only what each file is; it is rewritten with every answer,
 * and a file's bytes do not need to be.
 */

export interface PendingFile {
  meta: ChatAttachment
  data: Buffer
  /** An image's small picture (JPEG), as the page made it and main checked it. */
  thumb: Buffer | null
}

/**
 * Drafts held at once, and the bytes in all of them. A pane closed with files waiting leaves its
 * draft behind; past either, the oldest go - never the one just added to. A page whose draft went
 * finds out when it sends (`AiChatService`: the question names its files).
 */
const DRAFTS = 24
const HELD_BYTES = 64 * 1024 * 1024

const SHA = /^[0-9a-f]{64}$/

const dataUrl = (thumb: Buffer): string => `data:image/jpeg;base64,${thumb.toString('base64')}`

const view = (file: PendingFile): AttachmentView => ({
  ...file.meta,
  ...(file.thumb === null ? {} : { thumb: dataUrl(file.thumb) }),
})

/** Only a small JPEG, no larger than a chip needs, is taken for a thumb. */
function checkedThumb(raw: ArrayBuffer | undefined): Buffer | null {
  if (raw === undefined || raw.byteLength > ATTACH_LIMITS.thumb) return null
  const bytes = Buffer.from(raw)
  return sniff(bytes) === 'jpeg' ? bytes : null
}

/** An image's size before the page made it smaller: said on its card, never trusted for more. */
function checkedSource(
  raw: AttachUpload['source'],
  meta: { width?: number; height?: number },
): { width: number; height: number } | undefined {
  if (raw === undefined || meta.width === undefined || meta.height === undefined) return undefined
  const whole = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0
  if (!whole(raw.width) || !whole(raw.height) || raw.width > 100_000 || raw.height > 100_000) {
    return undefined
  }
  if (raw.width <= meta.width && raw.height <= meta.height) return undefined
  return { width: raw.width, height: raw.height }
}

export class ChatFiles {
  private readonly dir: string
  private readonly newId: () => string
  private readonly drafts = new Map<string, PendingFile[]>()

  /** `dir` is the conversations' folder (chats/). */
  constructor(dir: string, newId: () => string) {
    this.dir = dir
    this.newId = newId
  }

  /** Takes a file into a draft, or says why not. */
  add(draftId: string, upload: AttachUpload): AttachResult {
    const list = this.drafts.get(draftId) ?? []
    const room = roomFor(
      list.map((file) => file.meta),
      upload.bytes.byteLength,
    )
    if (room !== null) return room
    const data = Buffer.from(upload.bytes)
    const name = attachmentName(upload.name)
    const found = classify(name, data)
    if ('ok' in found) return found
    const { text: _text, ...facts } = found
    const source = checkedSource(upload.source, facts)
    const meta: ChatAttachment = {
      id: this.newId(),
      name,
      bytes: data.length,
      sha256: createHash('sha256').update(data).digest('hex'),
      ...facts,
      ...(source === undefined ? {} : { source }),
    }
    const thumb = meta.kind === 'image' ? checkedThumb(upload.thumb) : null
    const file: PendingFile = { meta, data, thumb }
    // Freshly used, so it is the last to go.
    this.drafts.delete(draftId)
    this.drafts.set(draftId, [...list, file])
    for (const old of this.drafts.keys()) {
      if (old === draftId || (this.drafts.size <= DRAFTS && this.held() <= HELD_BYTES)) break
      this.drafts.delete(old)
    }
    return { ok: true, file: view(file) }
  }

  /** The bytes every draft holds. */
  private held(): number {
    let bytes = 0
    for (const list of this.drafts.values()) for (const file of list) bytes += file.data.length
    return bytes
  }

  pending(draftId: string): AttachmentView[] {
    return (this.drafts.get(draftId) ?? []).map(view)
  }

  /** Takes one file out of a draft; answers what is left. */
  remove(draftId: string, id: string): AttachmentView[] {
    const list = (this.drafts.get(draftId) ?? []).filter((file) => file.meta.id !== id)
    if (list.length === 0) this.drafts.delete(draftId)
    else this.drafts.set(draftId, list)
    return list.map(view)
  }

  /** The files a draft holds, left where they are until the question is kept (`forget`). */
  take(draftId: string): PendingFile[] {
    return [...(this.drafts.get(draftId) ?? [])]
  }

  forget(draftId: string): void {
    this.drafts.delete(draftId)
  }

  /** Writes a question's files beside its conversation. False when that could not be done. */
  commit(chatId: string, files: readonly PendingFile[]): boolean {
    const folder = this.folderOf(chatId)
    if (folder === null) return false
    try {
      if (files.length > 0) mkdirSync(folder, { recursive: true })
      for (const file of files) {
        this.write(path.join(folder, file.meta.sha256), file.data)
        if (file.thumb !== null)
          this.write(path.join(folder, `${file.meta.sha256}.thumb`), file.thumb)
      }
      return true
    } catch {
      return false
    }
  }

  /** A sent file's bytes, or null when its copy is gone. */
  async read(chatId: string, sha256: string): Promise<Buffer | null> {
    const folder = this.folderOf(chatId)
    if (folder === null || !SHA.test(sha256)) return null
    try {
      return await readFile(path.join(folder, sha256))
    } catch {
      return null
    }
  }

  /** The small pictures of a conversation's images, by attachment id. */
  thumbs(chatId: string, files: readonly ChatAttachment[]): Record<string, string> {
    const folder = this.folderOf(chatId)
    const found: Record<string, string> = {}
    if (folder === null) return found
    for (const file of files) {
      if (file.kind !== 'image' || !SHA.test(file.sha256)) continue
      try {
        const thumb = readFileSync(path.join(folder, `${file.sha256}.thumb`))
        if (sniff(thumb) === 'jpeg') found[file.id] = dataUrl(thumb)
      } catch {
        // No picture was made of it: the chip goes without.
      }
    }
    return found
  }

  /** A conversation's files, with it. */
  removeChat(chatId: string): void {
    const folder = this.folderOf(chatId)
    if (folder !== null) rmSync(folder, { recursive: true, force: true })
  }

  /** Lets go of the files no message names any more (an earlier question rewritten). */
  prune(chatId: string, kept: ReadonlySet<string>): void {
    const folder = this.folderOf(chatId)
    if (folder === null || !existsSync(folder)) return
    for (const name of readdirSync(folder)) {
      const sha = name.replace(/\.thumb$/, '')
      if (SHA.test(sha) && !kept.has(sha)) rmSync(path.join(folder, name), { force: true })
    }
  }

  private folderOf(chatId: string): string | null {
    return CHAT_ID.test(chatId) ? path.join(this.dir, `${chatId}.files`) : null
  }

  /** A file named by its content is already right when it is there. */
  private write(file: string, data: Buffer): void {
    if (existsSync(file)) return
    const temp = `${file}.${process.pid}.tmp`
    writeFileSync(temp, data)
    replaceFile(temp, file)
  }
}

/** The refusal for a file that did not arrive as bytes at all. */
export const notAFile = () => refuse('unreadable', 'that was not a file')
