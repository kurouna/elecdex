import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { AI_LIMITS, CHAT_ID, type Chat, ChatSchema, type ChatSummary, summaryOf } from '@shared/ai'

/**
 * Conversations, one JSON file each under userData/chats.
 *
 * One file per conversation rather than one file for all, unlike notes: an
 * answer can run to tens of kilobytes and a long conversation to megabytes, and
 * finishing one answer should rewrite that conversation, not every one. The list
 * a pane shows is read from the folder the first time a chat pane asks and kept
 * in memory from then on.
 *
 * A file that does not parse is left where it is and simply not listed: it may
 * be a hand edit, or written by a newer build.
 */
export class ChatStore {
  private readonly dir: string
  private summaries: Map<string, ChatSummary> | null = null

  constructor(dir: string) {
    this.dir = dir
  }

  /** Newest first. */
  list(): ChatSummary[] {
    return [...this.index().values()].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  get(id: string): Chat | null {
    if (!CHAT_ID.test(id)) return null
    return this.readFile(this.fileOf(id))
  }

  /** False when the conversation could not be kept: too many of them, or an id that is not one. */
  save(chat: Chat): boolean {
    const parsed = ChatSchema.safeParse(chat)
    if (!parsed.success) return false
    const index = this.index()
    if (!index.has(chat.id) && index.size >= AI_LIMITS.chats) return false
    mkdirSync(this.dir, { recursive: true })
    const file = this.fileOf(chat.id)
    const temp = `${file}.${process.pid}.tmp`
    writeFileSync(temp, `${JSON.stringify(parsed.data, null, 2)}\n`, 'utf8')
    renameSync(temp, file)
    index.set(chat.id, summaryOf(parsed.data))
    return true
  }

  remove(id: string): boolean {
    if (!CHAT_ID.test(id) || !this.index().has(id)) return false
    rmSync(this.fileOf(id), { force: true })
    this.index().delete(id)
    return true
  }

  /** The id is checked against CHAT_ID before it gets here, so it cannot name another folder. */
  private fileOf(id: string): string {
    return path.join(this.dir, `${id}.json`)
  }

  private index(): Map<string, ChatSummary> {
    if (this.summaries !== null) return this.summaries
    const found = new Map<string, ChatSummary>()
    let names: string[] = []
    try {
      names = readdirSync(this.dir)
    } catch {
      // No folder yet: no conversations.
    }
    for (const name of names) {
      if (!name.endsWith('.json') || !CHAT_ID.test(name.slice(0, -5))) continue
      const chat = this.readFile(path.join(this.dir, name))
      // A file renamed by hand must not answer to an id it does not carry.
      if (chat !== null && `${chat.id}.json` === name) found.set(chat.id, summaryOf(chat))
    }
    this.summaries = found
    return found
  }

  private readFile(file: string): Chat | null {
    try {
      const parsed = ChatSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')))
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }
}
